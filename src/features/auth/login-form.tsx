"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@/features/auth/auth.schemas";
import { login } from "@/features/auth/auth.api";
import { dashboardForRole } from "@/shared/auth/roles";
import { useSession } from "@/shared/auth/use-session";
import { ApiError, humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";
import { traceFormSubmit, traceFormValidationFailure, type FormTracingContext } from "@/observability";

/** Contexto de trazabilidad del formulario. Valores literales: cardinalidad fija. */
const LOGIN_FORM_TRACING: FormTracingContext = {
  formName: "login",
  feature: "auth",
  operation: "login",
  component: "LoginForm"
};

/**
 * Solo se acepta como destino una ruta interna: una cadena que empiece por una única
 * barra. Se descartan `//evil.com` y `https://evil.com`, que el navegador
 * interpretaría como otro dominio (redirección abierta).
 */
function safeInternalPath(value: string | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

function LoginFormFields({ defaultRole = "PACIENTE" as LoginInput["roleHint"], title = "Ingresar" }: { defaultRole?: LoginInput["roleHint"]; title?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession, logout } = useSession();
  const didClearStaleSession = useRef(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", roleHint: defaultRole }
  });

  useEffect(() => {
    // Limpiar sesión vieja una sola vez al entrar al formulario.
    // Antes el efecto dependía de una función recreada por el provider; después de login se volvía a ejecutar,
    // borraba la sesión recién guardada y el usuario terminaba redirigido como no autorizado.
    if (didClearStaleSession.current) return;
    didClearStaleSession.current = true;
    logout();
  }, [logout]);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess(session) {
      setSession(session);
      // Si se llegó aquí desde una ruta protegida (?next=/admin/usuarios), se vuelve
      // ahí en lugar de al panel por defecto.
      const next = safeInternalPath(searchParams.get("next"));
      router.replace(next ?? dashboardForRole(session.role));
    }
  });

  const rootError = mutation.isError ? (mutation.error instanceof ApiError && mutation.error.status === 401 ? "Credenciales inválidas o usuario no activo." : humanizeApiError(mutation.error)) : null;

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Accede a tu espacio de Corazón Migrante. Tus datos se tratan con cuidado.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* `noValidate`: la validación la hace zod y se anuncia con aria-describedby.
            Dejando la del navegador se mezclaban dos mensajes distintos por campo. */}
        {/* El segundo argumento de handleSubmit se ejecuta cuando zod rechaza el
            formulario: se registra CUÁNTOS campos fallaron, nunca cuáles ni sus
            valores. `mutation.mutate` sigue disparándose exactamente igual que antes. */}
        <form
          className="grid gap-5"
          noValidate
          onSubmit={form.handleSubmit(
            (values) => {
              void traceFormSubmit(LOGIN_FORM_TRACING, () => mutation.mutateAsync(values)).catch(() => {
                // El error ya lo gestiona `mutation.isError` y se pinta en `rootError`.
                // Aquí solo se evita un rechazo sin capturar.
              });
            },
            (errors) => traceFormValidationFailure(LOGIN_FORM_TRACING, Object.keys(errors).length)
          )}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={form.formState.errors.email ? true : undefined}
              aria-describedby={form.formState.errors.email ? "email-error" : undefined}
              {...form.register("email")}
            />
            {form.formState.errors.email ? <p className="text-sm text-destructive" id="email-error">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              aria-invalid={form.formState.errors.password ? true : undefined}
              aria-describedby={form.formState.errors.password ? "password-error" : undefined}
              {...form.register("password")}
            />
            {form.formState.errors.password ? <p className="text-sm text-destructive" id="password-error">{form.formState.errors.password.message}</p> : null}
          </div>
          <input type="hidden" {...form.register("roleHint")} />
          {rootError ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive transition-colors" role="alert">{rootError}</p> : null}
          <Button loading={mutation.isPending} type="submit">
            {mutation.isPending ? "Ingresando..." : "Ingresar"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta? <Link className="font-semibold text-primary" href="/registro">Regístrate</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * `useSearchParams()` (para leer `?next=`) exige un límite de Suspense en un proyecto
 * prerenderizado con `output: "export"`.
 */
export function LoginForm(props: { defaultRole?: LoginInput["roleHint"]; title?: string }) {
  return (
    <Suspense fallback={<Card className="mx-auto h-80 w-full max-w-md animate-pulse" />}>
      <LoginFormFields {...props} />
    </Suspense>
  );
}
