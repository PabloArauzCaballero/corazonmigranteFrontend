"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, Check, Clock3, Globe2, LockKeyhole, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  createManagedBooking,
  createPatientBooking,
  getBookingAvailability,
  listBookingProducts,
  listBookingTherapists,
  type AvailabilitySlot,
  type BookingProduct,
  type BookingTherapist
} from "@/features/booking/booking.api";
import {
  managedBookingSchema,
  patientBookingSchema,
  timezoneDefault,
  type ManagedBookingInput,
  type PatientBookingInput
} from "@/features/booking/booking.schemas";
import { cn } from "@/lib/utils";
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

type BookingFormValues = PatientBookingInput | ManagedBookingInput;

function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || timezoneDefault;
  } catch {
    return timezoneDefault;
  }
}

function formatMoney(product: BookingProduct) {
  if (!product.price) return "Sin costo configurado";
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: product.currency || "BOB" }).format(product.price);
}

function formatDateTime(value: string, timezone: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone
  }).format(date);
}

function slotLabels(slot: AvailabilitySlot, therapist: BookingTherapist | undefined, userTimezone: string) {
  const therapistTimezone = slot.timezone || therapist?.timezone || timezoneDefault;
  return {
    therapist: `${formatDateTime(slot.scheduledStartAt, therapistTimezone)} (${therapistTimezone})`,
    user: `${formatDateTime(slot.scheduledStartAt, userTimezone)} (${userTimezone})`
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function BookingAuthCard({ title, description, href, cta }: { title: string; description: string; href: string; cta: string }) {
  return (
    <Card className="mx-auto max-w-3xl overflow-hidden rounded-none border-slate-200 bg-white shadow-none">
      <CardHeader className="border-b border-slate-200 bg-[#f7f4ef]">
        <Badge className="w-fit" variant="secondary">Reserva segura</Badge>
        <CardTitle className="font-serif text-3xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Button asChild className="rounded-none bg-teal-900 hover:bg-teal-950">
          <Link href={href}>{cta}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function BookingAuthWall() {
  const { session, isReady } = useSession();

  if (!isReady) return <LoadingState title="Verificando sesion" />;

  if (session?.role === "PACIENTE") {
    return <BookingAuthCard title="Reserva protegida" description="Tu sesion esta activa. Continua desde tu portal de paciente para registrar la solicitud de forma segura." href="/paciente/booking" cta="Ir a reservar mi cita" />;
  }

  if (session?.role === "ADMIN" || session?.role === "SUPER_ADMIN") {
    return <BookingAuthCard title="Reserva operativa" description="Para crear o preparar una cita de un paciente concreto, entra al panel administrativo." href="/admin/booking" cta="Ir a booking administrativo" />;
  }

  if (session?.role === "TERAPEUTA") {
    return <BookingAuthCard title="Reserva asistida" description="Como terapeuta, gestiona citas de pacientes concretos desde tu portal." href="/terapeuta/booking" cta="Ir a booking terapeuta" />;
  }

  return (
    <Card className="mx-auto max-w-3xl rounded-none border-slate-200 bg-white shadow-none">
      <CardHeader>
        <Badge className="w-fit" variant="secondary">Requiere sesion</Badge>
        <CardTitle className="font-serif text-3xl">Para reservar necesitas iniciar sesion</CardTitle>
        <CardDescription>Para proteger tu informacion, las reservas requieren una sesion activa. Admins y terapeutas trabajan sobre pacientes concretos desde sus portales.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild className="rounded-none bg-teal-900 hover:bg-teal-950"><Link href="/login">Iniciar sesion</Link></Button>
        <Button asChild variant="outline" className="rounded-none"><Link href="/registro">Crear cuenta de paciente</Link></Button>
      </CardContent>
    </Card>
  );
}

function TherapistPicker({
  therapists,
  value,
  onChange
}: {
  therapists: BookingTherapist[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {therapists.map((therapist) => {
        const selected = value === therapist.id;
        return (
          <button
            key={therapist.id}
            type="button"
            onClick={() => onChange(therapist.id)}
            className={cn(
              "grid min-h-36 grid-cols-[4.5rem_1fr] gap-4 border bg-white p-4 text-left transition",
              selected ? "border-teal-900 ring-2 ring-teal-900/20" : "border-slate-200 hover:border-teal-900/50"
            )}
          >
            <span className="relative h-16 w-16 overflow-hidden rounded-full bg-teal-900/10 text-teal-950">
              {therapist.avatarUrl ? <img src={therapist.avatarUrl} alt={therapist.name} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center font-serif text-xl font-bold">{initials(therapist.name)}</span>}
              {selected ? <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-teal-900 text-white"><Check className="h-4 w-4" /></span> : null}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-slate-950">{therapist.name}</span>
              <span className="mt-1 block text-sm text-slate-600">{therapist.title}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-teal-800"><Stethoscope className="h-3.5 w-3.5" />{therapist.specialty}</span>
              {therapist.personalPhrase ? <span className="mt-2 line-clamp-2 block text-xs leading-5 text-slate-500">{therapist.personalPhrase}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ProductSelect({ products, registerName, register }: { products: BookingProduct[]; registerName: "productId"; register: ReturnType<typeof useForm<PatientBookingInput>>["register"] }) {
  return (
    <select id={registerName} className="focus-ring h-12 rounded-none border border-slate-300 bg-white px-3 text-sm" {...register(registerName)}>
      <option value="">Seleccionar servicio</option>
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name} - {product.durationMinutes} min - {formatMoney(product)}
        </option>
      ))}
    </select>
  );
}

function AvailabilityPicker({
  slots,
  value,
  onChange,
  therapist,
  userTimezone,
  isFetching,
  error
}: {
  slots: AvailabilitySlot[];
  value: string;
  onChange: (value: string) => void;
  therapist?: BookingTherapist;
  userTimezone: string;
  isFetching: boolean;
  error: unknown;
}) {
  if (isFetching) return <p className="border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Consultando disponibilidad calculada...</p>;
  if (error) return <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{humanizeApiError(error)}</p>;
  if (slots.length === 0) return <p className="border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">Selecciona terapeuta, servicio y fecha para ver horarios disponibles.</p>;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {slots.map((slot) => {
        const labels = slotLabels(slot, therapist, userTimezone);
        const selected = value === slot.scheduledStartAt;
        return (
          <button
            key={slot.scheduledStartAt}
            type="button"
            onClick={() => onChange(slot.scheduledStartAt)}
            className={cn(
              "border bg-white p-4 text-left transition",
              selected ? "border-teal-900 bg-teal-900/5 ring-2 ring-teal-900/20" : "border-slate-200 hover:border-teal-900/50"
            )}
          >
            <span className="flex items-center gap-2 text-sm font-bold text-slate-950"><Clock3 className="h-4 w-4 text-teal-800" />Horario disponible</span>
            <span className="mt-3 grid gap-2 text-xs leading-5 text-slate-600">
              <span><b className="text-slate-950">Terapeuta:</b> {labels.therapist}</span>
              <span><b className="text-slate-950">Tu hora local:</b> {labels.user}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BookingFields<T extends BookingFormValues>({
  form,
  products,
  therapists,
  availability,
  selectedTherapist,
  isManaged = false
}: {
  form: ReturnType<typeof useForm<T>>;
  products: BookingProduct[];
  therapists: BookingTherapist[];
  availability: { data?: AvailabilitySlot[]; isFetching: boolean; error: unknown };
  selectedTherapist?: BookingTherapist;
  isManaged?: boolean;
}) {
  const therapistUserId = useWatch({ control: form.control, name: "therapistUserId" as never }) as unknown as string;
  const scheduledTime = useWatch({ control: form.control, name: "scheduledTime" as never }) as unknown as string;
  const userTimezone = useWatch({ control: form.control, name: "timezone" as never }) as unknown as string;
  const patientError = (form.formState.errors as { patientUserId?: { message?: unknown } }).patientUserId;

  return (
    <div className="grid gap-7">
      {isManaged ? (
        <div className="grid gap-2">
          <Label htmlFor="patientUserId">Paciente</Label>
          <Input id="patientUserId" placeholder="UUID del paciente" className="rounded-none" {...form.register("patientUserId" as never)} />
          {patientError ? <p className="text-sm text-destructive">{String(patientError.message)}</p> : null}
        </div>
      ) : null}

      <section className="grid gap-3">
        <div>
          <Label>Terapeuta disponible</Label>
          <p className="mt-1 text-xs text-slate-500">Elige desde el directorio del backend; ya no necesitas pegar el UUID manualmente.</p>
        </div>
        <TherapistPicker therapists={therapists} value={therapistUserId} onChange={(value) => form.setValue("therapistUserId" as never, value as never, { shouldDirty: true, shouldValidate: true })} />
        {form.formState.errors.therapistUserId ? <p className="text-sm text-destructive">{String(form.formState.errors.therapistUserId.message)}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-2">
          <Label htmlFor="productId">Servicio</Label>
          <ProductSelect products={products} registerName="productId" register={form.register as ReturnType<typeof useForm<PatientBookingInput>>["register"]} />
          {form.formState.errors.productId ? <p className="text-sm text-destructive">{String(form.formState.errors.productId.message)}</p> : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timezone">Zona horaria del usuario</Label>
          <div className="relative">
            <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input id="timezone" className="rounded-none pl-9" {...form.register("timezone" as never)} />
          </div>
          {form.formState.errors.timezone ? <p className="text-sm text-destructive">{String(form.formState.errors.timezone.message)}</p> : null}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="grid gap-2 md:max-w-xs">
          <Label htmlFor="scheduledDate">Fecha</Label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input id="scheduledDate" type="date" className="rounded-none pl-9" {...form.register("scheduledDate" as never)} />
          </div>
          {form.formState.errors.scheduledDate ? <p className="text-sm text-destructive">{String(form.formState.errors.scheduledDate.message)}</p> : null}
        </div>
        <AvailabilityPicker
          slots={availability.data ?? []}
          value={scheduledTime}
          onChange={(value) => form.setValue("scheduledTime" as never, value as never, { shouldDirty: true, shouldValidate: true })}
          therapist={selectedTherapist}
          userTimezone={userTimezone || timezoneDefault}
          isFetching={availability.isFetching}
          error={availability.error}
        />
        {form.formState.errors.scheduledTime ? <p className="text-sm text-destructive">{String(form.formState.errors.scheduledTime.message)}</p> : null}
      </section>

      <div className="grid gap-2">
        <Label htmlFor="notesForTherapist">Notas para el terapeuta</Label>
        <Textarea id="notesForTherapist" className="min-h-28 rounded-none" placeholder="Cuéntanos brevemente que necesitas trabajar en la sesion." {...form.register("notesForTherapist" as never)} />
      </div>
    </div>
  );
}

function useBookingData(form: ReturnType<typeof useForm<PatientBookingInput>>) {
  const products = useQuery({ queryKey: ["booking", "products"], queryFn: listBookingProducts });
  const therapists = useQuery({ queryKey: ["booking", "therapists"], queryFn: listBookingTherapists });
  const therapistUserId = useWatch({ control: form.control, name: "therapistUserId" });
  const productId = useWatch({ control: form.control, name: "productId" });
  const scheduledDate = useWatch({ control: form.control, name: "scheduledDate" });
  const userTimezone = useWatch({ control: form.control, name: "timezone" });

  const selectedTherapist = useMemo(() => therapists.data?.find((therapist) => therapist.id === therapistUserId), [therapists.data, therapistUserId]);
  const availabilityTimezone = selectedTherapist?.timezone || userTimezone || timezoneDefault;
  const availability = useQuery({
    queryKey: ["booking", "availability", therapistUserId, productId, scheduledDate, availabilityTimezone],
    queryFn: () => getBookingAvailability({ therapistUserId, productId, from: scheduledDate, to: scheduledDate, timezone: availabilityTimezone }),
    enabled: Boolean(therapistUserId && productId && scheduledDate && availabilityTimezone)
  });

  useEffect(() => {
    form.setValue("scheduledTime", "", { shouldDirty: true });
  }, [form, therapistUserId, productId, scheduledDate]);

  return { products, therapists, selectedTherapist, availability };
}

export function PatientBookingForm({ title = "Reservar mi cita", description = "Selecciona terapeuta, servicio y horario calculado desde el backend." }: PatientBookingFormProps) {
  const form = useForm<PatientBookingInput>({
    resolver: zodResolver(patientBookingSchema),
    defaultValues: { therapistUserId: "", productId: "", scheduledDate: "", scheduledTime: "", timezone: browserTimezone(), notesForTherapist: "" }
  });
  const { products, therapists, selectedTherapist, availability } = useBookingData(form);
  const mutation = useMutation({ mutationFn: createPatientBooking });

  if (products.isLoading || therapists.isLoading) return <LoadingState title="Consultando servicios y terapeutas disponibles" />;
  if (products.isError) return <ErrorState title="No se pudo consultar el catalogo" description={humanizeApiError(products.error)} actionLabel="Reintentar" onAction={() => void products.refetch()} />;
  if (therapists.isError) return <ErrorState title="No se pudo consultar terapeutas" description={humanizeApiError(therapists.error)} actionLabel="Reintentar" onAction={() => void therapists.refetch()} />;

  return (
    <Card className="mx-auto w-full max-w-6xl overflow-hidden rounded-none border-slate-200 bg-white shadow-none">
      <CardHeader className="border-b border-slate-200 bg-[#f7f4ef] p-7">
        <Badge className="w-fit" variant="secondary">Paciente autenticado</Badge>
        <CardTitle className="font-serif text-4xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-7">
        {mutation.isSuccess ? (
          <div className="border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <p className="font-semibold">Solicitud registrada</p>
            <p className="mt-2 text-sm leading-6">La cita queda en estado solicitado y sera gestionada por el equipo correspondiente.</p>
          </div>
        ) : (
          <form className="grid gap-7" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <BookingFields form={form} products={products.data ?? []} therapists={therapists.data ?? []} availability={availability} selectedTherapist={selectedTherapist} />
            {mutation.isError ? <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{humanizeApiError(mutation.error)}</p> : null}
            <Button disabled={mutation.isPending} type="submit" className="w-full rounded-none bg-teal-900 hover:bg-teal-950 md:w-fit">
              {mutation.isPending ? "Registrando..." : "Reservar cita"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export function ManagedBookingForm({ actorLabel }: { actorLabel: "administrador" | "terapeuta" }) {
  const form = useForm<ManagedBookingInput>({
    resolver: zodResolver(managedBookingSchema),
    defaultValues: { patientUserId: "", therapistUserId: "", productId: "", scheduledDate: "", scheduledTime: "", timezone: browserTimezone(), notesForTherapist: "" }
  });
  const data = useBookingData(form as unknown as ReturnType<typeof useForm<PatientBookingInput>>);
  const mutation = useMutation({ mutationFn: createManagedBooking });

  if (data.products.isLoading || data.therapists.isLoading) return <LoadingState title="Consultando servicios y terapeutas disponibles" />;
  if (data.products.isError) return <ErrorState title="No se pudo consultar el catalogo" description={humanizeApiError(data.products.error)} actionLabel="Reintentar" onAction={() => void data.products.refetch()} />;
  if (data.therapists.isError) return <ErrorState title="No se pudo consultar terapeutas" description={humanizeApiError(data.therapists.error)} actionLabel="Reintentar" onAction={() => void data.therapists.refetch()} />;

  return (
    <Card className="mx-auto w-full max-w-6xl overflow-hidden rounded-none border-slate-200 bg-white shadow-none">
      <CardHeader className="border-b border-slate-200 bg-[#f7f4ef] p-7">
        <Badge className="w-fit" variant="secondary">Booking por {actorLabel}</Badge>
        <CardTitle className="font-serif text-4xl">Agendar cita para un paciente concreto</CardTitle>
        <CardDescription>Selecciona terapeuta, servicio y horario calculado antes de enviar la solicitud operativa.</CardDescription>
      </CardHeader>
      <CardContent className="p-7">
        <form className="grid gap-7" onSubmit={(event) => event.preventDefault()}>
          <BookingFields
            form={form}
            products={data.products.data ?? []}
            therapists={data.therapists.data ?? []}
            availability={data.availability}
            selectedTherapist={data.selectedTherapist}
            isManaged
          />
          <div className="border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <span className="inline-flex items-center gap-2 font-semibold"><LockKeyhole className="h-4 w-4" />Accion operativa protegida</span>
            <p className="mt-1">El OpenAPI actualizado indica que `POST /appointments` requiere rol PATIENT. Admin y terapeuta pueden consultar disponibilidad y revisar reglas, pero no crear una sesion por otro paciente hasta que exista un endpoint operativo dedicado.</p>
          </div>
          {mutation.isError ? <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{humanizeApiError(mutation.error)}</p> : null}
          <Button disabled type="button" variant="outline" className="w-full rounded-none md:w-fit">Creacion operativa pendiente de endpoint</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export const BookingForm = PatientBookingForm;
