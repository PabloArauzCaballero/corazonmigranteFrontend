"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { confirmPasswordReset, requestPasswordResetPin } from "@/features/auth/auth.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";

type Step = "request" | "confirm" | "done";

export function PasswordResetForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const requestPin = useMutation({
    mutationFn: (value: string) => requestPasswordResetPin(value),
    onSuccess: () => setStep("confirm")
  });

  const confirmReset = useMutation({
    mutationFn: confirmPasswordReset,
    onSuccess: () => setStep("done")
  });

  function onRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    setEmail(value);
    setFormError("");
    requestPin.mutate(value);
  }

  function onConfirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setFormError("Las dos contraseñas no coinciden.");
      return;
    }
    setFormError("");
    confirmReset.mutate({
      email,
      pin: String(form.get("pin") ?? "").trim(),
      newPassword
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          {step === "request"
            ? "Escribe tu correo y te enviamos un código de 6 dígitos para crear una contraseña nueva."
            : step === "confirm"
              ? "Revisa tu correo e ingresa el código junto con tu contraseña nueva."
              : "Listo. Ya puedes entrar con tu contraseña nueva."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "request" ? (
          <form className="grid gap-5" onSubmit={onRequest}>
            <div className="grid gap-2">
              <Label htmlFor="reset-email">Correo electrónico</Label>
              <Input id="reset-email" name="email" type="email" autoComplete="email" required defaultValue={email} />
            </div>
            {requestPin.isError ? (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {humanizeApiError(requestPin.error)}
              </p>
            ) : null}
            <Button type="submit" loading={requestPin.isPending}>
              {requestPin.isPending ? "Enviando..." : "Enviarme el código"}
            </Button>
          </form>
        ) : null}

        {step === "confirm" ? (
          <form className="grid gap-5" onSubmit={onConfirm}>
            {/* El servidor responde igual exista o no la cuenta: el mensaje no confirma
                que el correo esté registrado. */}
            <p className="rounded-lg bg-primary/10 p-3 text-sm">
              Si <span className="font-semibold">{email}</span> tiene una cuenta, le acaba de llegar un código. Caduca en 15 minutos.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="reset-pin">Código de 6 dígitos</Label>
              <Input id="reset-pin" name="pin" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="one-time-code" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reset-new-password">Contraseña nueva</Label>
              <PasswordInput id="reset-new-password" name="newPassword" required minLength={8} autoComplete="new-password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reset-confirm-password">Repetir contraseña</Label>
              <PasswordInput id="reset-confirm-password" name="confirmPassword" required minLength={8} autoComplete="new-password" />
            </div>
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            {confirmReset.isError ? (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {humanizeApiError(confirmReset.error)}
              </p>
            ) : null}
            <Button type="submit" loading={confirmReset.isPending}>
              {confirmReset.isPending ? "Guardando..." : "Cambiar contraseña"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setStep("request")} disabled={confirmReset.isPending}>
              Usar otro correo o pedir un código nuevo
            </Button>
          </form>
        ) : null}

        {step === "done" ? (
          <div className="grid gap-5">
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              Contraseña actualizada. Por seguridad se cerraron las sesiones que tenías abiertas.
            </p>
            <Button asChild>
              <Link href="/login">Ir a ingresar</Link>
            </Button>
          </div>
        ) : null}

        <p className="mt-5 text-center text-sm text-muted-foreground">
          ¿Ya la recordaste?{" "}
          <Link className="font-semibold text-primary" href="/login">
            Volver a ingresar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
