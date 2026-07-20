"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
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

export function LoginForm({ defaultRole = "PACIENTE" as LoginInput["roleHint"], title = "Ingresar" }: { defaultRole?: LoginInput["roleHint"]; title?: string }) {
  const router = useRouter();
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
      router.replace(dashboardForRole(session.role));
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
        <form className="grid gap-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput id="password" autoComplete="current-password" {...form.register("password")} />
            {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
          </div>
          <input type="hidden" {...form.register("roleHint")} />
          {rootError ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive transition-colors">{rootError}</p> : null}
          <Button disabled={mutation.isPending} type="submit">
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
