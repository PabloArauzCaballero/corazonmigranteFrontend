import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAdminOptions } from "../../../sistema/admin/context/AdminOptionsContext";

/**
 * Soporta 2 formatos comunes del JSON:
 * A) { "Bolivia": ["Santa Cruz", "La Paz"], "Argentina": ["Buenos Aires"] }
 * B) [{ pais: "Bolivia", ciudades: ["Santa Cruz"] }, ...]
 */
function getPaisesFromData(data) {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return Object.keys(data);
  }
  if (Array.isArray(data)) {
    return data
      .map((x) => x?.pais || x?.Pais || x?.country || x?.name)
      .filter(Boolean);
  }
  return [];
}

function getCiudadesFromData(data, pais) {
  if (!pais) return [];

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const ciudades = data[pais];
    return Array.isArray(ciudades) ? ciudades : [];
  }

  if (Array.isArray(data)) {
    const found = data.find(
      (x) => (x?.pais || x?.Pais || x?.country || x?.name) === pais
    );
    const ciudades =
      found?.ciudades || found?.Ciudades || found?.cities || found?.value;
    return Array.isArray(ciudades) ? ciudades : [];
  }

  return [];
}

function FieldLabel({ children }) {
  return (
    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
      {children}
    </label>
  );
}

function TextInput({
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  ...rest
}) {
  const isDate = type === "date";
  const inputRef = useRef(null);

  const openDatePicker = () => {
    const el = inputRef.current;
    if (!el) return;

    if (typeof el.showPicker === "function") {
      el.showPicker();
      return;
    }
    el.focus();
    el.click();
  };

  return (
    <div className="relative">
      {icon ? (
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
          {icon}
        </span>
      ) : null}

      <input
        ref={inputRef}
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full bg-white border border-slate-200 rounded-[20px]",
          "py-3.5 text-slate-600 text-sm placeholder:text-slate-300",
          "focus:ring-primary/20 focus:border-primary transition-all",
          icon ? "pl-12" : "pl-4",
          isDate ? "pr-12 cm-date-input" : "pr-4",
          className,
        ].join(" ")}
        {...rest}
      />

      {isDate ? (
        <button
          type="button"
          onClick={openDatePicker}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center"
          aria-label="Abrir calendario"
          disabled={rest.disabled}
        >
          <span className="material-symbols-outlined text-slate-400">
            calendar_month
          </span>
        </button>
      ) : null}
    </div>
  );
}

function SelectInput({
  icon,
  value,
  onChange,
  options = [],
  className = "",
  disabled = false,
}) {
  return (
    <div className="relative">
      {icon ? (
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
          {icon}
        </span>
      ) : null}

      <select
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={[
          "cm-select",
          "w-full bg-white border border-slate-200 rounded-[20px]",
          "py-3.5 text-slate-600 text-sm",
          "focus:ring-primary/20 focus:border-primary transition-all",
          "appearance-none",
          icon ? "pl-12" : "pl-4",
          "pr-12",
          disabled ? "opacity-60 cursor-not-allowed" : "",
          className,
        ].join(" ")}
      >
        {options.map((op) => (
          <option key={`${op.value}`} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        expand_more
      </span>
    </div>
  );
}

export default function TerapeutaPerfilForm({
  profile,
  onChange,
  onSubmit,
  onReset,
  isSaving = false,
  disabled = false,
}) {
  const set = (k, v) => onChange?.(k, v);

  // remote lists (cacheadas al iniciar sesión por AdminOptionsProvider)
  const {
    profesiones: profesionesList,
    especialidades: especialidadesList,
    paisesCiudades: paisesCiudadesData,
    loading: loadingLists,
    error: listsError,
  } = useAdminOptions();

  // derived
  const paisesList = useMemo(
    () => getPaisesFromData(paisesCiudadesData),
    [paisesCiudadesData]
  );

  const ciudadesList = useMemo(
    () => getCiudadesFromData(paisesCiudadesData, profile?.pais ?? ""),
    [paisesCiudadesData, profile?.pais]
  );

  // Sin fetch aquí: viene listo desde el Provider

  // Si cambia el país, y la ciudad ya no es válida => reset
  useEffect(() => {
    const currentPais = profile?.pais ?? "";
    const currentCiudad = profile?.ciudad ?? "";
    if (!currentPais) {
      if (currentCiudad) set("ciudad", "");
      return;
    }
    if (currentCiudad && !ciudadesList.includes(currentCiudad)) {
      set("ciudad", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.pais, ciudadesList]);

  // Options para selects (formato {value,label})
  const tituloOptions = useMemo(() => {
    const base = [{ value: "", label: loadingLists ? "Cargando..." : "Seleccione..." }];
    return base.concat(
      profesionesList.map((p) => ({ value: p, label: p }))
    );
  }, [profesionesList, loadingLists]);

  const especialidadOptions = useMemo(() => {
    const base = [{ value: "", label: loadingLists ? "Cargando..." : "Seleccione..." }];
    return base.concat(
      especialidadesList.map((e) => ({ value: e, label: e }))
    );
  }, [especialidadesList, loadingLists]);

  const paisOptions = useMemo(() => {
    const base = [{ value: "", label: loadingLists ? "Cargando..." : "Seleccione..." }];
    return base.concat(
      paisesList.map((p) => ({ value: p, label: p }))
    );
  }, [paisesList, loadingLists]);

  const ciudadOptions = useMemo(() => {
    const currentPais = profile?.pais ?? "";
    if (!currentPais) {
      return [{ value: "", label: "Primero selecciona un país" }];
    }
    if (ciudadesList.length === 0) {
      return [{ value: "", label: "No hay ciudades para este país" }];
    }
    return [{ value: "", label: "Seleccione..." }].concat(
      ciudadesList.map((c) => ({ value: c, label: c }))
    );
  }, [profile?.pais, ciudadesList]);

  return (
    <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100">
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        onReset={(e) => {
          e.preventDefault();
          onReset?.();
        }}
      >
        {/* Información personal */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">
                person
              </span>
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900">
              Información Personal
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2" title="Este campo no es modificable">
              <FieldLabel>Email *</FieldLabel>
              <TextInput
                icon="mail"
                type="email"
                placeholder="ejemplo@corazondemigrante.com"
                value={profile?.email}
                onChange={(v) => set("email", v)}
                disabled={true}
              />
            </div>

            <div>
              <FieldLabel>Nombres *</FieldLabel>
              <TextInput
                icon="badge"
                placeholder="Ingrese nombres"
                value={profile?.nombres}
                onChange={(v) => set("nombres", v)}
                disabled={disabled}
              />
            </div>

            <div>
              <FieldLabel>Apellidos *</FieldLabel>
              <TextInput
                icon="badge"
                placeholder="Ingrese apellidos"
                value={profile?.apellidos}
                onChange={(v) => set("apellidos", v)}
                disabled={disabled}
              />
            </div>

            <div>
              <FieldLabel>Teléfono *</FieldLabel>
              <TextInput
                icon="call"
                type="tel"
                placeholder="+591 70000001"
                value={profile?.telefono}
                onChange={(v) => set("telefono", v)}
                disabled={disabled}
              />
            </div>

            <div>
              <FieldLabel>Fecha de Nacimiento *</FieldLabel>
              <TextInput
                type="date"
                icon="calendar_today"
                placeholder="dd/mm/aaaa"
                value={profile?.raw?.usuario?.fecha_nacimiento}
                onChange={(v) => set("fecha_nacimiento", v)}
                disabled={disabled}
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Sexo *</FieldLabel>
              <SelectInput
                icon="group"
                value={profile?.sexo}
                onChange={(v) => set("sexo", v)}
                options={[
                  { value: "Femenino", label: "Femenino" },
                  { value: "Masculino", label: "Masculino" },
                  { value: "Otro", label: "Otro" },
                ]}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-slate-200 my-8" />

        {/* Datos profesionales */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">
                work
              </span>
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900">
              Datos Profesionales
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <FieldLabel>Título Profesional *</FieldLabel>
              <SelectInput
                icon="school"
                value={profile?.titulo_profesional}
                onChange={(v) => set("titulo_profesional", v)}
                options={tituloOptions}
                disabled={disabled || loadingLists}
              />
            </div>

            <div>
              <FieldLabel>Especialidad Principal *</FieldLabel>
              <SelectInput
                icon="psychology"
                value={profile?.especialidad_principal}
                onChange={(v) => set("especialidad_principal", v)}
                options={especialidadOptions}
                disabled={disabled || loadingLists}
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Descripción Perfil *</FieldLabel>
              <textarea
                value={profile?.descripcion ?? ""}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="Describe tu enfoque y experiencia profesional..."
                className="w-full bg-white border border-slate-200 rounded-[20px] p-4 text-slate-600 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 text-sm min-h-[120px]"
                disabled={disabled}
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Frase Personal</FieldLabel>
              <TextInput
                icon="format_quote"
                placeholder="Una frase que te identifique"
                value={profile?.frase_personal}
                onChange={(v) => set("frase_personal", v)}
                disabled={disabled}
              />
            </div>

            <div className="md:col-span-2">
              <FieldLabel>Link Video YouTube</FieldLabel>
              <TextInput
                icon="smart_display"
                type="url"
                placeholder="https://youtube.com/..."
                value={profile?.youtube_link}
                onChange={(v) => set("youtube_link", v)}
                disabled={disabled}
              />
            </div>

            <div>
              <FieldLabel>Matrícula Profesional *</FieldLabel>
              <TextInput
                icon="history_edu"
                placeholder="Ej: SCZ-PSI-12345"
                value={profile?.matricula_profesional}
                onChange={(v) => set("matricula_profesional", v)}
                disabled={disabled}
              />
            </div>

            <div>
              <FieldLabel>Valor Sesión Base *</FieldLabel>
              <TextInput
                icon="payments"
                type="number"
                placeholder="Ej: 120"
                value={profile?.valor_sesion_base}
                onChange={(v) => set("valor_sesion_base", v)}
                disabled={disabled}
              />
            </div>

            {/* País / Ciudad condicional desde JSON */}
            <div>
              <FieldLabel>País *</FieldLabel>
              <SelectInput
                icon="public"
                value={profile?.pais}
                onChange={(v) => {
                  set("pais", v);
                  // al cambiar país, reset ciudad
                  set("ciudad", "");
                }}
                options={paisOptions}
                disabled={disabled || loadingLists}
              />
            </div>

            <div>
              <FieldLabel>Ciudad *</FieldLabel>
              <SelectInput
                icon="location_city"
                value={profile?.ciudad}
                onChange={(v) => set("ciudad", v)}
                options={ciudadOptions}
                disabled={disabled || loadingLists || !(profile?.pais ?? "")}
              />
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            type="submit"
            disabled={disabled || isSaving}
            className="w-full sm:flex-1 py-4 px-8 bg-primary text-white text-xs font-bold uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Guardar Cambios
          </button>

          <button
            type="reset"
            disabled={disabled}
            className="w-full sm:w-auto py-4 px-10 bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Limpiar
          </button>
        </div>
      </form>
    </div>
  );
}
