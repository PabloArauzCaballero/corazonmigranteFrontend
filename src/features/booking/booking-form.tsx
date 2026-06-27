"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { bookingSchema, type BookingInput } from "@/features/booking/booking.schemas";
import { createBooking, getBookingBootstrap } from "@/features/booking/booking.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { LoadingState } from "@/shared/ui/state";

export function BookingForm() {
  const bootstrap = useQuery({ queryKey: ["booking", "bootstrap"], queryFn: getBookingBootstrap });
  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { fullName: "", email: "", country: "", serviceId: "", preferredDate: "", preferredTime: "", notes: "" }
  });
  const selectedDate = form.watch("preferredDate");
  const availableTimes = useMemo(() => bootstrap.data?.availability.find((slot) => slot.date === selectedDate)?.times ?? [], [bootstrap.data?.availability, selectedDate]);
  const mutation = useMutation({ mutationFn: createBooking });

  if (bootstrap.isLoading) return <LoadingState title="Consultando servicios y disponibilidad" />;

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Solicitud de cita</CardTitle>
        <CardDescription>Elige una opción disponible. La confirmación final dependerá de la respuesta del backend y del equipo correspondiente.</CardDescription>
      </CardHeader>
      <CardContent>
        {mutation.isSuccess ? (
          <div className="rounded-2xl bg-emerald-50 p-6 text-emerald-900">
            <p className="font-semibold">Solicitud registrada</p>
            <p className="mt-2 text-sm leading-6">Te avisaremos cuando la cita quede confirmada o si se requiere reprogramación.</p>
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" {...form.register("fullName")} />
                {form.formState.errors.fullName ? <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" {...form.register("email")} />
                {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">País o ciudad actual</Label>
              <Input id="country" {...form.register("country")} />
              {form.formState.errors.country ? <p className="text-sm text-destructive">{form.formState.errors.country.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="serviceId">Servicio</Label>
              <select id="serviceId" className="focus-ring h-11 rounded-xl border bg-background px-3 text-sm" {...form.register("serviceId")}> 
                <option value="">Seleccionar servicio</option>
                {bootstrap.data?.services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
              {form.formState.errors.serviceId ? <p className="text-sm text-destructive">{form.formState.errors.serviceId.message}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="preferredDate">Fecha</Label>
                <select id="preferredDate" className="focus-ring h-11 rounded-xl border bg-background px-3 text-sm" {...form.register("preferredDate")}> 
                  <option value="">Seleccionar fecha</option>
                  {bootstrap.data?.availability.map((slot) => (
                    <option key={slot.date} value={slot.date}>{slot.date}</option>
                  ))}
                </select>
                {form.formState.errors.preferredDate ? <p className="text-sm text-destructive">{form.formState.errors.preferredDate.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preferredTime">Hora</Label>
                <select id="preferredTime" className="focus-ring h-11 rounded-xl border bg-background px-3 text-sm" {...form.register("preferredTime")} disabled={!selectedDate}>
                  <option value="">Seleccionar hora</option>
                  {availableTimes.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {form.formState.errors.preferredTime ? <p className="text-sm text-destructive">{form.formState.errors.preferredTime.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas opcionales</Label>
              <Textarea id="notes" {...form.register("notes")} />
            </div>
            {mutation.isError ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{humanizeApiError(mutation.error)}</p> : null}
            <Button disabled={mutation.isPending} type="submit">{mutation.isPending ? "Enviando..." : "Solicitar cita"}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
