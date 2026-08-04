import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/features/auth/login-form";
import { login } from "@/features/auth/auth.api";
import { ApiError } from "@/shared/api/errors";
import { SessionProvider } from "@/shared/auth/use-session";
import type { NormalizedSession } from "@/shared/auth/session";

/**
 * Journey J1 — Iniciar sesión.
 *
 * Es el journey que toda persona usuaria atraviesa y no tenía ninguna prueba: solo
 * estaba cubierto `normalizeSession()`, es decir la normalización de la respuesta,
 * nunca el flujo del formulario.
 *
 * Se prueba el contrato observable: qué se envía, adónde se redirige según el rol,
 * qué se anuncia al fallar y que el destino de `?next=` no puede sacar a nadie del
 * dominio (SEC-05).
 */
jest.mock("@/features/auth/auth.api", () => ({ login: jest.fn() }));

const replace = jest.fn();
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
  useSearchParams: () => searchParams
}));

// La telemetría no debe influir en el resultado del formulario: se neutraliza para que
// la prueba mida el flujo, no la instrumentación.
jest.mock("@/observability", () => ({
  traceFormSubmit: (_ctx: unknown, run: () => Promise<unknown>) => run(),
  traceFormValidationFailure: jest.fn(),
  ATTR: {},
  BUSINESS_SPANS: { authLogout: "auth.logout", authSessionExpired: "auth.session_expired" },
  startSpan: () => ({ end: jest.fn(), setAttribute: jest.fn() }),
  rotateTelemetrySessionId: jest.fn()
}));

const loginMock = login as jest.MockedFunction<typeof login>;

function sesion(role: NormalizedSession["role"]): NormalizedSession {
  return {
    userId: "u-1",
    fullName: "Ana Pérez",
    email: "ana@example.org",
    role,
    permissions: [],
    token: "jwt-de-prueba"
  };
}

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <LoginForm />
      </SessionProvider>
    </QueryClientProvider>
  );
}

/**
 * Se usan etiquetas EXACTAS: `/contraseña/i` también casa con el botón de
 * mostrar/ocultar del `PasswordInput`, y la consulta devolvería dos elementos.
 */
const campoCorreo = () => screen.findByLabelText("Correo electrónico");
const campoContrasena = () => screen.getByLabelText("Contraseña");

async function rellenarYEnviar(user: ReturnType<typeof userEvent.setup>, email = "ana@example.org", password = "secreto123") {
  await user.type(await campoCorreo(), email);
  await user.type(campoContrasena(), password);
  await user.click(screen.getByRole("button", { name: /ingresar/i }));
}

beforeEach(() => {
  replace.mockClear();
  loginMock.mockReset();
  searchParams = new URLSearchParams();
  window.localStorage.clear();
});

describe("Journey: iniciar sesión", () => {
  it("envía las credenciales tal como se escriben", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(sesion("PACIENTE"));
    renderLogin();

    await rellenarYEnviar(user);

    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1));
    // React Query invoca la `mutationFn` con un segundo argumento propio (contexto de
    // la mutación), así que se inspecciona solo el primero.
    expect(loginMock.mock.calls[0][0]).toEqual({
      email: "ana@example.org",
      password: "secreto123",
      roleHint: "PACIENTE"
    });
  });

  it("persiste la sesión al autenticarse", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(sesion("PACIENTE"));
    renderLogin();

    await rellenarYEnviar(user);

    await waitFor(() => expect(window.localStorage.getItem("cm_session")).not.toBeNull());
    expect(JSON.parse(window.localStorage.getItem("cm_session") as string)).toMatchObject({
      role: "PACIENTE",
      token: "jwt-de-prueba"
    });
  });

  it.each([
    ["PACIENTE", "/paciente"],
    ["TERAPEUTA", "/terapeuta"],
    ["CONTADOR", "/admin/contabilidad"],
    ["ADMIN", "/admin"],
    ["SUPER_ADMIN", "/admin"]
  ] as const)("redirige a %s hacia %s", async (role, destino) => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(sesion(role));
    renderLogin();

    await rellenarYEnviar(user);

    await waitFor(() => expect(replace).toHaveBeenCalledWith(destino));
  });

  it("vuelve al destino de ?next= en lugar del panel por defecto", async () => {
    const user = userEvent.setup();
    searchParams = new URLSearchParams("next=/admin/usuarios");
    loginMock.mockResolvedValue(sesion("ADMIN"));
    renderLogin();

    await rellenarYEnviar(user);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin/usuarios"));
  });

  it.each(["https://malicioso.example", "//malicioso.example"])(
    "ignora un ?next= hacia el exterior (%s) y usa el panel del rol",
    async (destinoExterno) => {
      // SEC-05: sin esta comprobación, un enlace de phishing a
      // /login?next=https://malicioso.example sacaría a la persona del dominio justo
      // después de autenticarse, en el momento de máxima confianza.
      const user = userEvent.setup();
      searchParams = new URLSearchParams(`next=${destinoExterno}`);
      loginMock.mockResolvedValue(sesion("ADMIN"));
      renderLogin();

      await rellenarYEnviar(user);

      await waitFor(() => expect(replace).toHaveBeenCalledWith("/admin"));
      expect(replace).not.toHaveBeenCalledWith(destinoExterno);
    }
  );

  it("anuncia credenciales inválidas ante un 401", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new ApiError("Unauthorized", 401));
    renderLogin();

    await rellenarYEnviar(user);

    const aviso = await screen.findByRole("alert");
    expect(aviso).toHaveTextContent(/credenciales inválidas/i);
    expect(replace).not.toHaveBeenCalled();
  });

  it("anuncia el fallo de red sin cerrar el formulario", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new ApiError("No se pudo conectar con el servidor", 0));
    renderLogin();

    await rellenarYEnviar(user);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingresar/i })).toBeEnabled();
  });

  it("no llama a la API si el correo no es válido", async () => {
    const user = userEvent.setup();
    renderLogin();

    await rellenarYEnviar(user, "esto-no-es-un-correo");

    await waitFor(() => expect(document.getElementById("email")).toHaveAttribute("aria-invalid", "true"));
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("asocia el mensaje de error al campo mediante aria-describedby", async () => {
    const user = userEvent.setup();
    renderLogin();

    await rellenarYEnviar(user, "esto-no-es-un-correo");

    const campo = await campoCorreo();
    await waitFor(() => expect(campo).toHaveAttribute("aria-describedby", "email-error"));
    expect(document.getElementById("email-error")).toBeInTheDocument();
  });
});
