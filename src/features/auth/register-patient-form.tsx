"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { registerPatientSchema, type RegisterPatientInput } from "@/features/auth/auth.schemas";
import { registerPatient } from "@/features/auth/auth.api";
import { fetchCountriesCities, fetchOccupations } from "@/features/auth/public-options";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PasswordInput } from "@/shared/ui/password-input";
import { Textarea } from "@/shared/ui/textarea";

export function RegisterPatientForm() {
  const form = useForm<RegisterPatientInput>({
    resolver: zodResolver(registerPatientSchema),
    defaultValues: { fullName: "", email: "", password: "", country: "", city: "", phone: "", occupation: "", reason: "" }
  });
  const mutation = useMutation({ mutationFn: registerPatient });

  const countriesCities = useQuery({ queryKey: ["public-options", "countries-cities"], queryFn: fetchCountriesCities });
  const occupations = useQuery({ queryKey: ["public-options", "occupations"], queryFn: fetchOccupations });

  const selectedCountry = useWatch({ control: form.control, name: "country" });
  const countryNames = useMemo(
    () => Object.keys(countriesCities.data ?? {}).sort((a, b) => a.localeCompare(b)),
    [countriesCities.data]
  );
  const cityOptions = useMemo(
    () => (selectedCountry ? countriesCities.data?.[selectedCountry] ?? [] : []),
    [countriesCities.data, selectedCountry]
  );

  const previousCountry = useRef(selectedCountry);
  useEffect(() => {
    if (previousCountry.current !== selectedCountry) {
      form.setValue("city", "");
      previousCountry.current = selectedCountry;
    }
  }, [selectedCountry, form]);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Crear cuenta de paciente</CardTitle>
        <CardDescription>Completa la información inicial. Evita incluir detalles sensibles que no sean necesarios en este primer paso.</CardDescription>
      </CardHeader>
      <CardContent>
        {mutation.isSuccess ? (
          <div className="rounded-lg bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
            Tu solicitud fue registrada. Ingresa con tu cuenta cuando el equipo confirme la activación.
          </div>
        ) : (
          // `noValidate`: la validación la hace zod y se anuncia con aria-describedby.
          // Dejando la del navegador se mezclarían dos mensajes distintos por campo,
          // y el del navegador no respeta el idioma de la aplicación.
          <form className="grid gap-5" noValidate onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                autoComplete="name"
                aria-invalid={form.formState.errors.fullName ? true : undefined}
                aria-describedby={form.formState.errors.fullName ? "fullName-error" : undefined}
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName ? <p className="text-sm text-destructive" id="fullName-error">{form.formState.errors.fullName.message}</p> : null}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
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
                  autoComplete="new-password"
                  aria-invalid={form.formState.errors.password ? true : undefined}
                  aria-describedby={form.formState.errors.password ? "password-error" : undefined}
                  {...form.register("password")}
                />
                {form.formState.errors.password ? <p className="text-sm text-destructive" id="password-error">{form.formState.errors.password.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="country">País actual</Label>
                <select
                  id="country"
                  className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-surface-raised px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={form.formState.errors.country ? true : undefined}
                  aria-describedby={form.formState.errors.country ? "country-error" : undefined}
                  {...form.register("country")}
                  disabled={countriesCities.isLoading}
                >
                  <option value="">
                    {countriesCities.isLoading ? "Cargando países..." : "Seleccionar país"}
                  </option>
                  {countryNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {countriesCities.isError ? <p className="text-xs text-destructive">No se pudo cargar la lista de países.</p> : null}
                {form.formState.errors.country ? <p className="text-sm text-destructive" id="country-error">{form.formState.errors.country.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">Ciudad</Label>
                <select
                  id="city"
                  className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-surface-raised px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("city")}
                  disabled={!selectedCountry}
                >
                  <option value="">Seleccionar ciudad</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="occupation">Ocupación (opcional)</Label>
                <select
                  id="occupation"
                  className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-surface-raised px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("occupation")}
                  disabled={occupations.isLoading}
                >
                  <option value="">
                    {occupations.isLoading ? "Cargando ocupaciones..." : "Seleccionar ocupación"}
                  </option>
                  {occupations.data?.map((occupation) => (
                    <option key={occupation} value={occupation}>{occupation}</option>
                  ))}
                </select>
                {occupations.isError ? <p className="text-xs text-destructive">No se pudo cargar la lista de ocupaciones.</p> : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Motivo breve de consulta</Label>
              <Textarea
                id="reason"
                aria-invalid={form.formState.errors.reason ? true : undefined}
                aria-describedby={form.formState.errors.reason ? "reason-error" : undefined}
                {...form.register("reason")}
              />
              {form.formState.errors.reason ? <p className="text-sm text-destructive" id="reason-error">{form.formState.errors.reason.message}</p> : null}
            </div>
            {/* `role="alert"` para que el error de envío se anuncie: sin él, quien usa
                lector de pantalla no se entera de que el registro falló. */}
            {mutation.isError ? <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive transition-colors" role="alert">{humanizeApiError(mutation.error)}</p> : null}
            {/* `loading` (en vez de `disabled`) deshabilita igual y además marca
                aria-busy: es la API del componente para este caso. */}
            <Button loading={mutation.isPending} type="submit">
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
