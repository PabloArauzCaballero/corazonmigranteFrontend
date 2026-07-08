"use client";

import { useMutation, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { fetchCountriesCities, fetchOccupations } from "@/features/auth/public-options";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { humanizeApiError } from "@/shared/api/errors";
import { buildFileDownloadUrl, uploadUserPhoto } from "@/shared/api/files";
import { getString, isRecord } from "@/shared/api/normalizers";
import { useSession } from "@/shared/auth/use-session";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { LoadingState } from "@/shared/ui/state";
import { Textarea } from "@/shared/ui/textarea";
import { initials } from "@/lib/utils";

type MeProfile = Record<string, unknown>;

function unwrap(payload: unknown): MeProfile {
  if (isRecord(payload) && isRecord(payload.data)) return payload.data as MeProfile;
  return isRecord(payload) ? payload : {};
}

function nested(record: MeProfile, keys: string[]): MeProfile {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) return value as MeProfile;
  }
  return {};
}

async function fetchMe() {
  const payload = await apiRequest<unknown>(ENDPOINTS.users.me);
  return unwrap(payload);
}

function resolveAvatarUrl(me: MeProfile): string | undefined {
  const profiles = [me, nested(me, ["patientProfile", "patient_profile"]), nested(me, ["therapistProfile", "therapist_profile"]), nested(me, ["user"])];
  for (const source of profiles) {
    const direct = getString(source, ["avatarUrl", "avatar_url", "photoUrl", "photo_url", "imageUrl", "image_url", "fotoUrl", "publicUrl"], "");
    if (direct) return direct;
    const fileId = getString(source, ["avatarFileId", "avatar_file_id", "photoFileId", "photo_file_id"], "");
    const built = buildFileDownloadUrl(fileId);
    if (built) return built;
  }
  return undefined;
}

export function ProfilePhotoUploader() {
  const { session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const me = useQuery({ queryKey: ["me"], queryFn: fetchMe, enabled: Boolean(session) });

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (!session?.userId) throw new Error("Sesión no disponible");
      return uploadUserPhoto(session.userId, file);
    },
    onSuccess: async () => {
      await me.refetch();
    }
  });

  if (!session) return null;
  const avatarUrl = previewUrl ?? resolveAvatarUrl(me.data ?? {});

  function onFileChange(event: FormEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    mutation.mutate(file);
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-5 p-6">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt={session.fullName} className="h-20 w-20 rounded-2xl border object-cover" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">{initials(session.fullName)}</div>
          )}
        </div>
        <div className="grid gap-2">
          <p className="font-semibold">Foto de perfil</p>
          <p className="text-sm text-muted-foreground">Se guarda en el servidor de archivos del sistema (módulo USER_PROFILE).</p>
          <div className="flex items-center gap-3">
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <Button type="button" size="sm" variant="outline" disabled={mutation.isPending} onClick={() => inputRef.current?.click()}>
              <Camera className="h-4 w-4" /> {mutation.isPending ? "Subiendo..." : "Subir foto"}
            </Button>
            {mutation.isSuccess ? <span className="text-xs font-semibold text-emerald-700">Foto subida correctamente.</span> : null}
          </div>
          {mutation.isError ? <p className="text-xs text-destructive">{humanizeApiError(mutation.error)}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function profileValue(me: MeProfile | undefined, profileKeys: string[], fieldKeys: string[]) {
  if (!me) return "";
  const profile = nested(me, profileKeys);
  return getString(profile, fieldKeys, getString(me, fieldKeys, ""));
}

const PATIENT_PROFILE_KEYS = ["patientProfile", "patient_profile", "perfilPaciente", "profile"];

export function PatientProfileForm() {
  const me = useQuery({ queryKey: ["me"], queryFn: fetchMe });

  if (me.isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <LoadingState title="Cargando perfil" />
        </CardContent>
      </Card>
    );
  }

  return <PatientProfileFormBody me={me} />;
}

function PatientProfileFormBody({ me }: { me: UseQueryResult<MeProfile> }) {
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<unknown>(ENDPOINTS.users.updatePatientProfile, { method: "PATCH", body }),
    onSuccess: async () => {
      await me.refetch();
    }
  });

  const countriesCities = useQuery({ queryKey: ["public-options", "countries-cities"], queryFn: fetchCountriesCities });
  const occupations = useQuery({ queryKey: ["public-options", "occupations"], queryFn: fetchOccupations });

  const currentCountry = profileValue(me.data, PATIENT_PROFILE_KEYS, ["country", "pais"]);
  const currentCity = profileValue(me.data, PATIENT_PROFILE_KEYS, ["city", "ciudad"]);

  const [country, setCountry] = useState(currentCountry);
  const [city, setCity] = useState(currentCity);
  const previousCountry = useRef(country);

  useEffect(() => {
    if (previousCountry.current !== country) {
      setCity("");
      previousCountry.current = country;
    }
  }, [country]);

  const countryNames = useMemo(() => Object.keys(countriesCities.data ?? {}).sort((a, b) => a.localeCompare(b)), [countriesCities.data]);
  const cityOptions = useMemo(() => (country ? countriesCities.data?.[country] ?? [] : []), [countriesCities.data, country]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {};
    for (const key of ["firstName", "lastName", "phone", "birthDate", "country", "city", "occupation"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value) body[key] = value;
    }
    mutation.mutate(body);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-bold">Editar mis datos</h2>
        <p className="mt-1 text-sm text-muted-foreground">Actualiza tu información de paciente. Se guarda con PATCH /me/patient-profile.</p>
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2"><Label>Nombre</Label><Input name="firstName" defaultValue={profileValue(me.data, PATIENT_PROFILE_KEYS, ["firstName", "first_name", "nombres"])} /></div>
          <div className="grid gap-2"><Label>Apellido</Label><Input name="lastName" defaultValue={profileValue(me.data, PATIENT_PROFILE_KEYS, ["lastName", "last_name", "apellidos"])} /></div>
          <div className="grid gap-2"><Label>Teléfono</Label><Input name="phone" defaultValue={profileValue(me.data, PATIENT_PROFILE_KEYS, ["phone", "telefono"])} /></div>
          <div className="grid gap-2"><Label>Fecha de nacimiento</Label><Input name="birthDate" type="date" defaultValue={profileValue(me.data, PATIENT_PROFILE_KEYS, ["birthDate", "birth_date"])} /></div>
          <div className="grid gap-2">
            <Label htmlFor="country">País</Label>
            <select
              id="country"
              name="country"
              className="focus-ring h-11 rounded-lg border bg-background px-3 text-sm hover:border-ring/60"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              disabled={countriesCities.isLoading}
            >
              <option value="">{countriesCities.isLoading ? "Cargando países..." : "Seleccionar país"}</option>
              {countryNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
            {countriesCities.isError ? <p className="text-xs text-destructive">No se pudo cargar la lista de países.</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Ciudad</Label>
            <select
              id="city"
              name="city"
              className="focus-ring h-11 rounded-lg border bg-background px-3 text-sm hover:border-ring/60"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              disabled={!country}
            >
              <option value="">Seleccionar ciudad</option>
              {cityOptions.map((cityName) => <option key={cityName} value={cityName}>{cityName}</option>)}
            </select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="occupation">Ocupación</Label>
            <select
              id="occupation"
              name="occupation"
              className="focus-ring h-11 rounded-lg border bg-background px-3 text-sm hover:border-ring/60"
              defaultValue={profileValue(me.data, PATIENT_PROFILE_KEYS, ["occupation", "ocupacion"])}
              disabled={occupations.isLoading}
            >
              <option value="">{occupations.isLoading ? "Cargando ocupaciones..." : "Seleccionar ocupación"}</option>
              {(occupations.data ?? []).map((occupation) => <option key={occupation} value={occupation}>{occupation}</option>)}
            </select>
            {occupations.isError ? <p className="text-xs text-destructive">No se pudo cargar la lista de ocupaciones.</p> : null}
          </div>
          {mutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(mutation.error)}</p> : null}
          {mutation.isSuccess ? <p className="text-sm font-semibold text-emerald-700 md:col-span-2">Perfil actualizado correctamente.</p> : null}
          <div className="md:col-span-2"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Guardando..." : "Guardar cambios"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

export function TherapistProfileForm() {
  const me = useQuery({ queryKey: ["me"], queryFn: fetchMe });
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest<unknown>(ENDPOINTS.users.updateTherapistProfile, { method: "PATCH", body }),
    onSuccess: async () => {
      await me.refetch();
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {};
    for (const key of ["firstName", "lastName", "phone", "title", "mainSpecialty", "bio", "personalPhrase"]) {
      const value = String(form.get(key) ?? "").trim();
      if (value) body[key] = value;
    }
    mutation.mutate(body);
  }

  const keys = ["therapistProfile", "therapist_profile", "perfilTerapeuta", "profile"];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-bold">Información profesional</h2>
        <p className="mt-1 text-sm text-muted-foreground">Actualiza tus datos visibles para pacientes. Se guarda con PATCH /me/therapist-profile.</p>
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2"><Label>Nombre</Label><Input name="firstName" defaultValue={profileValue(me.data, keys, ["firstName", "first_name", "nombres"])} /></div>
          <div className="grid gap-2"><Label>Apellido</Label><Input name="lastName" defaultValue={profileValue(me.data, keys, ["lastName", "last_name", "apellidos"])} /></div>
          <div className="grid gap-2"><Label>Teléfono</Label><Input name="phone" defaultValue={profileValue(me.data, keys, ["phone", "telefono"])} /></div>
          <div className="grid gap-2"><Label>Título profesional</Label><Input name="title" defaultValue={profileValue(me.data, keys, ["title", "titulo", "professionalTitle"])} /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Especialidad principal</Label><Input name="mainSpecialty" defaultValue={profileValue(me.data, keys, ["mainSpecialty", "main_specialty", "especialidad"])} /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Frase personal</Label><Input name="personalPhrase" defaultValue={profileValue(me.data, keys, ["personalPhrase", "personal_phrase"])} /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Bio</Label><Textarea name="bio" className="min-h-28" defaultValue={profileValue(me.data, keys, ["bio", "biography", "descripcion"])} /></div>
          {mutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(mutation.error)}</p> : null}
          {mutation.isSuccess ? <p className="text-sm font-semibold text-emerald-700 md:col-span-2">Perfil actualizado correctamente.</p> : null}
          <div className="md:col-span-2"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Guardando..." : "Guardar cambios"}</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
