"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { registerPatientSchema, type RegisterPatientInput } from "@/features/auth/auth.schemas";
import { registerPatient } from "@/features/auth/auth.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

export function RegisterPatientForm() {
  const form = useForm<RegisterPatientInput>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: { fullName: "", email: "", password: "", country: "", reason: "" }
  });
  const mutation = useMutation({ mutationFn: registerPatient });

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Crear cuenta de paciente</CardTitle>
        <CardDescription>Completa la información inicial. Evita incluir detalles sensibles que no sean necesarios en este primer paso.</CardDescription>
      </CardHeader>
      <CardContent>
        {mutation.isSuccess ? (
          <div className="rounded-2xl bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
            Tu solicitud fue registrada. Ingresa con tu cuenta cuando el backend confirme el flujo final de activación.
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
              {form.formState.errors.fullName ? <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p> : null}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" autoComplete="email" {...form.register("email")} />
                {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
                {form.formState.errors.password ? <p className="text-sm text-destructive">{form.formState.errors.password.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">País o ciudad actual</Label>
              <Input id="country" {...form.register("country")} />
              {form.formState.errors.country ? <p className="text-sm text-destructive">{form.formState.errors.country.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo breve de consulta</Label>
              <Textarea id="reason" {...form.register("reason")} />
              {form.formState.errors.reason ? <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p> : null}
            </div>
            {mutation.isError ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{humanizeApiError(mutation.error)}</p> : null}
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Registrando..." : "Crear cuenta"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta? <Link className="font-semibold text-primary" href="/login">Ingresar</Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
