import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionProvider } from "@/shared/auth/use-session";
import { TutorialProvider } from "@/features/tutorial/ui/tutorial-provider";
import { TutorialCenter } from "@/features/tutorial/ui/tutorial-center";
import { LocalTutorialStorage } from "@/features/tutorial/storage/tutorial-storage";
import { markCompleted, markStep } from "@/features/tutorial/engine/tutorial-progress";
import { tutorialRegistry } from "@/features/tutorial/catalog";

const push = jest.fn();
let pathname = "/paciente/ayuda";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push, replace: jest.fn(), refresh: jest.fn() }),
}));

const patientSession = {
  userId: "usuario-1",
  fullName: "Persona de prueba",
  email: "persona@corazonmigrante.local",
  role: "PACIENTE",
  permissions: ["profile:read", "profile:update", "booking:create"],
};

function renderCenter() {
  return render(
    <SessionProvider>
      <TutorialProvider>
        <TutorialCenter title="Centro de tutoriales" description="Recorridos guiados" />
      </TutorialProvider>
    </SessionProvider>,
  );
}

describe("Centro de tutoriales", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("cm_session", JSON.stringify(patientSession));
    pathname = "/paciente/ayuda";
    push.mockClear();
  });

  it("solo lista los tutoriales del rol de la sesión", async () => {
    renderCenter();
    expect(await screen.findByText("Tu portal, de un vistazo")).toBeInTheDocument();
    expect(screen.queryByText("El panel, de un vistazo")).not.toBeInTheDocument();
    expect(screen.queryByText("Contabilidad del centro")).not.toBeInTheDocument();
  });

  it("agrupa los obligatorios antes que el resto", async () => {
    renderCenter();
    const required = await screen.findByRole("heading", { name: /obligatorios para tu rol/i });
    expect(required).toBeInTheDocument();
  });

  it("filtra por texto de búsqueda", async () => {
    renderCenter();
    await screen.findByText("Tu portal, de un vistazo");

    await userEvent.type(screen.getByLabelText("Buscar un tutorial"), "premium");
    await waitFor(() => expect(screen.queryByText("Tu portal, de un vistazo")).not.toBeInTheDocument());
    expect(screen.getByText("Solicitar acceso premium")).toBeInTheDocument();
  });

  it("filtra por estado y muestra el vacío cuando nada coincide", async () => {
    renderCenter();
    await screen.findByText("Tu portal, de un vistazo");

    await userEvent.selectOptions(screen.getByLabelText("Filtrar por estado"), "completado");
    expect(await screen.findByText("Sin tutoriales que coincidan")).toBeInTheDocument();
  });

  it("refleja el progreso guardado y ofrece continuar", async () => {
    const definition = tutorialRegistry.get("paciente-navegacion");
    if (!definition) throw new Error("El catálogo debe incluir paciente-navegacion");
    await new LocalTutorialStorage("usuario-1").save(
      markStep({ definition }, definition.steps[2].id),
    );

    renderCenter();
    const card = (await screen.findByText("Tu portal, de un vistazo")).closest("div[class*='rounded-2xl']");
    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText("En progreso")).toBeInTheDocument();
    expect(within(card as HTMLElement).getByRole("button", { name: /continuar/i })).toBeInTheDocument();
  });

  it("un tutorial completado ofrece repetirlo y suma al avance general", async () => {
    const definition = tutorialRegistry.get("paciente-premium");
    if (!definition) throw new Error("El catálogo debe incluir paciente-premium");
    await new LocalTutorialStorage("usuario-1").save(markCompleted({ definition }));

    renderCenter();
    await screen.findByText("Solicitar acceso premium");
    const general = screen.getByRole("progressbar", { name: "Avance general de tutoriales" });
    await waitFor(() => expect(Number(general.getAttribute("aria-valuenow"))).toBeGreaterThan(0));

    const card = screen.getByText("Solicitar acceso premium").closest("div[class*='rounded-2xl']");
    expect(within(card as HTMLElement).getByRole("button", { name: /repetir/i })).toBeInTheDocument();
  });

  it("iniciar un tutorial de otra pantalla navega hasta ella", async () => {
    renderCenter();
    const card = (await screen.findByText("Reservar tu cita")).closest("div[class*='rounded-2xl']");
    await userEvent.click(within(card as HTMLElement).getByRole("button", { name: /comenzar/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/paciente/booking"));
  });

  it("muestra los prerrequisitos pendientes sin bloquear el inicio", async () => {
    renderCenter();
    const card = (await screen.findByText("Reservar tu cita")).closest("div[class*='rounded-2xl']");
    expect(within(card as HTMLElement).getByText(/te recomendamos completar antes/i)).toBeInTheDocument();
    expect(within(card as HTMLElement).getByRole("button", { name: /comenzar/i })).toBeEnabled();
  });
});
