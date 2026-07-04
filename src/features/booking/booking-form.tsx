"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  createManagedBooking,
  createPatientBooking,
  getBookingAvailability,
  listBookingProducts
} from "@/features/booking/booking.api";
import {
  managedBookingSchema,
  patientBookingSchema,
  timezoneDefault,
  type ManagedBookingInput,
  type PatientBookingInput
} from "@/features/booking/booking.schemas";
import { humanizeApiError } from "@/shared/api/errors";
import { useSession } from "@/shared/auth/use-session";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { ErrorState, LoadingState } from "@/shared/ui/state";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type PatientBookingFormProps = {
  title?: string;
  description?: string;
};

export function BookingAuthWall() {
  const { session, isReady } = useSession();

  if (!isReady) return <LoadingState title="Verificando sesión" />;

  if (session?.role === "PACIENTE") {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Reserva protegida</CardTitle>
          <CardDescription>Tu sesión está activa. Continúa desde tu portal de paciente para que el backend use tu identidad del JWT.</CardDescription>
        </CardHeader>
        <CardContent><Button asChild><Link href="/paciente/booking">Ir a reservar mi cita</Link></Button></CardContent>
      </Card>
    );
  }

  if (session?.role === "ADMIN" || session?.role === "SUPER_ADMIN") {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Reserva operativa</CardTitle>
          <CardDescription>Para crear o preparar una cita de un paciente concreto, entra al panel administrativo.</CardDescription>
        </CardHeader>
        <CardContent><Button asChild><Link href="/admin/booking">Ir a booking administrativo</Link></Button></CardContent>
      </Card>
    );
  }

  if (session?.role === "TERAPEUTA") {
    return (
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Reserva asistida</CardTitle>
          <CardDescription>Como terapeuta, gestiona citas de pacientes concretos desde tu portal.</CardDescription>
        </CardHeader>
        <CardContent><Button asChild><Link href="/terapeuta/booking">Ir a booking terapeuta</Link></Button></CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <Badge className="w-fit" variant="secondary">Requiere sesión</Badge>
        <CardTitle>Para reservar necesitas iniciar sesión</CardTitle>
        <CardDescription>
          El backend no debe aceptar reservas anónimas. La cita de paciente se crea con el JWT del paciente autenticado; admin o terapeuta deben trabajar sobre un paciente concreto.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild><Link href="/login">Iniciar sesión</Link></Button>
        <Button asChild variant="outline"><Link href="/registro">Crear cuenta de paciente</Link></Button>
      </CardContent>
    </Card>
  );
}

export function PatientBookingForm({ title = "Reservar mi cita", description = "La solicitud se registra para el paciente autenticado. El frontend no envía patientUserId porque el backend toma la identidad desde el JWT." }: PatientBookingFormProps) {
  const products = useQuery({ queryKey: ["booking", "products"], queryFn: listBookingProducts });
  const form = useForm<PatientBookingInput>({
    resolver: zodResolver(patientBookingSchema),
    defaultValues: { therapistUserId: "", productId: "", scheduledDate: "", scheduledTime: "", timezone: timezoneDefault, notesForTherapist: "" }
  });

  const therapistUserId = useWatch({ control: form.control, name: "therapistUserId" });
  const productId = useWatch({ control: form.control, name: "productId" });
  const scheduledDate = useWatch({ control: form.control, name: "scheduledDate" });
  const timezone = useWatch({ control: form.control, name: "timezone" });

  const availability = useQuery({
    queryKey: ["booking", "availability", therapistUserId, productId, scheduledDate, timezone],
    queryFn: () => getBookingAvailability({ therapistUserId, productId, from: scheduledDate, to: scheduledDate, timezone }),
    enabled: Boolean(therapistUserId && productId && scheduledDate && timezone)
  });

  const availableTimes = useMemo(() => {
    return availability.data?.map((slot) => {
      const match = slot.scheduledStartAt.match(/T(\d{2}:\d{2})/);
      return { value: match?.[1] ?? slot.label, label: slot.label };
    }) ?? [];
  }, [availability.data]);

  const mutation = useMutation({ mutationFn: createPatientBooking });

  if (products.isLoading) return <LoadingState title="Consultando servicios reales del backend" />;
  if (products.isError) return <ErrorState title="No se pudo consultar el catálogo" description={humanizeApiError(products.error)} actionLabel="Reintentar" onAction={() => void products.refetch()} />;

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <Badge className="w-fit" variant="secondary">Paciente autenticado</Badge>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {mutation.isSuccess ? (
          <div className="rounded-2xl bg-emerald-50 p-6 text-emerald-900">
            <p className="font-semibold">Solicitud registrada en backend</p>
            <p className="mt-2 text-sm leading-6">La cita queda en estado solicitado y será gestionada según el flujo del backend.</p>
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <div className="grid gap-2">
              <Label htmlFor="therapistUserId">ID del terapeuta</Label>
              <Input id="therapistUserId" placeholder="UUID del terapeuta" {...form.register("therapistUserId")} />
              <p className="text-xs leading-5 text-muted-foreground">PENDIENTE_CM: reemplazar este campo por selector cuando el backend exponga listado de terapeutas disponibles.</p>
              {form.formState.errors.therapistUserId ? <p className="text-sm text-destructive">{form.formState.errors.therapistUserId.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productId">Servicio</Label>
              <select id="productId" className="focus-ring h-11 rounded-xl border bg-background px-3 text-sm" {...form.register("productId")}>
                <option value="">Seleccionar servicio</option>
                {products.data?.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} {product.price ? `— ${product.price} ${product.currency}` : ""}</option>
                ))}
              </select>
              {form.formState.errors.productId ? <p className="text-sm text-destructive">{form.formState.errors.productId.message}</p> : null}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="scheduledDate">Fecha</Label>
                <Input id="scheduledDate" type="date" {...form.register("scheduledDate")} />
                {form.formState.errors.scheduledDate ? <p className="text-sm text-destructive">{form.formState.errors.scheduledDate.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="scheduledTime">Hora</Label>
                <select id="scheduledTime" className="focus-ring h-11 rounded-xl border bg-background px-3 text-sm" {...form.register("scheduledTime")} disabled={!scheduledDate}>
                  <option value="">Seleccionar hora</option>
                  {availableTimes.map((time) => <option key={time.value} value={time.value}>{time.label}</option>)}
                </select>
                {availability.isFetching ? <p className="text-xs text-muted-foreground">Consultando disponibilidad real...</p> : null}
                {availability.isError ? <p className="text-xs text-destructive">{humanizeApiError(availability.error)}</p> : null}
                {form.formState.errors.scheduledTime ? <p className="text-sm text-destructive">{form.formState.errors.scheduledTime.message}</p> : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Zona horaria</Label>
                <Input id="timezone" {...form.register("timezone")} />
                {form.formState.errors.timezone ? <p className="text-sm text-destructive">{form.formState.errors.timezone.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notesForTherapist">Notas para el terapeuta</Label>
              <Textarea id="notesForTherapist" {...form.register("notesForTherapist")} />
            </div>
            {mutation.isError ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{humanizeApiError(mutation.error)}</p> : null}
            <Button disabled={mutation.isPending} type="submit">{mutation.isPending ? "Registrando..." : "Reservar cita"}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function ManagedBookingForm({ actorLabel }: { actorLabel: "administrador" | "terapeuta" }) {
  const form = useForm<ManagedBookingInput>({
    resolver: zodResolver(managedBookingSchema),
    defaultValues: { patientUserId: "", therapistUserId: "", productId: "", scheduledDate: "", scheduledTime: "", timezone: timezoneDefault, notesForTherapist: "" }
  });
  const mutation = useMutation({ mutationFn: createManagedBooking });

  return (
    <Card className="mx-auto w-full max-w-4xl">
      <CardHeader>
        <Badge className="w-fit" variant="secondary">Booking por {actorLabel}</Badge>
        <CardTitle>Agendar cita para un paciente concreto</CardTitle>
        <CardDescription>
          Esta vista ya exige paciente concreto, terapeuta, servicio y horario. No crea datos locales ni datos inventados. Falta que el backend exponga el endpoint de creación por paciente para admin/terapeuta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="patientUserId">ID del paciente</Label>
              <Input id="patientUserId" placeholder="UUID del paciente" {...form.register("patientUserId")} />
              {form.formState.errors.patientUserId ? <p className="text-sm text-destructive">{form.formState.errors.patientUserId.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="managedTherapistUserId">ID del terapeuta</Label>
              <Input id="managedTherapistUserId" placeholder="UUID del terapeuta" {...form.register("therapistUserId")} />
              {form.formState.errors.therapistUserId ? <p className="text-sm text-destructive">{form.formState.errors.therapistUserId.message}</p> : null}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="managedProductId">ID del servicio</Label>
              <Input id="managedProductId" placeholder="UUID del producto/servicio" {...form.register("productId")} />
              {form.formState.errors.productId ? <p className="text-sm text-destructive">{form.formState.errors.productId.message}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="managedTimezone">Zona horaria</Label>
              <Input id="managedTimezone" {...form.register("timezone")} />
              {form.formState.errors.timezone ? <p className="text-sm text-destructive">{form.formState.errors.timezone.message}</p> : null}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2"><Label htmlFor="managedDate">Fecha</Label><Input id="managedDate" type="date" {...form.register("scheduledDate")} /></div>
            <div className="grid gap-2"><Label htmlFor="managedTime">Hora</Label><Input id="managedTime" placeholder="HH:mm" {...form.register("scheduledTime")} /></div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="managedNotes">Notas</Label>
            <Textarea id="managedNotes" {...form.register("notesForTherapist")} />
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            PENDIENTE_BACKEND_CM: el backend actual documenta creación de citas con `POST /api/v1/appointments`, pero está restringido a paciente autenticado. Para esta vista se necesita un contrato que reciba `patientUserId` y autorice ADMIN/SUPER_ADMIN/THERAPIST.
          </div>
          {mutation.isError ? <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{humanizeApiError(mutation.error)}</p> : null}
          <Button type="submit" variant="outline">Validar contrato de backend</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export const BookingForm = PatientBookingForm;
