import React, { useMemo, useRef } from "react";

export default function PerfilSidebar({
  profile,
  loading,
  uploadingAvatar = false,
  onSelectAvatar,
}) {
  const inputRef = useRef(null);
  const status = useMemo(() => (profile?.status ?? "Activo"), [profile]);
  const statusStyles =
    status === "Activo"
      ? "bg-green-100 text-green-700"
      : "bg-slate-100 text-slate-700";

  if (loading) {
    return (
      <div className="bg-brand-cream rounded-3xl shadow-soft border border-white overflow-hidden p-8">
        <div className="animate-pulse">
          <div className="w-32 h-32 rounded-3xl bg-slate-200 mx-auto mb-6" />
          <div className="h-6 bg-slate-200 rounded w-2/3 mx-auto mb-3" />
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-6" />
          <div className="h-8 bg-slate-200 rounded-full w-28 mx-auto mb-8" />
          <div className="h-px bg-slate-200 mb-6" />
          <div className="h-4 bg-slate-200 rounded w-full mb-3" />
          <div className="h-4 bg-slate-200 rounded w-4/5" />
        </div>
      </div>
    );
  }

  const displayName = [profile?.nombre, profile?.apellido].filter(Boolean).join(" ") || "—";

  const pickImage = () => {
    if (uploadingAvatar) return;
    inputRef.current?.click();
  };

  const onChangeFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // ✅ preview inmediato, y se sube recién al guardar
    onSelectAvatar?.(file);
    // permite re-seleccionar el mismo archivo
    e.target.value = "";
  };

  return (
    <div className="bg-brand-cream rounded-3xl shadow-soft border border-white overflow-hidden p-8 text-center sticky top-24">
      <div className="relative w-32 h-32 mx-auto mb-6">
        <img
          alt="Avatar"
          className="w-full h-full rounded-3xl object-cover shadow-lg"
          src={
            profile?.avatarUrl ||
            "https://ui-avatars.com/api/?background=742f38&color=fff&name=" +
              encodeURIComponent(displayName)
          }
        />
        <button
          type="button"
          className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-border-light text-primary hover:text-primary-dark transition-all"
          title={uploadingAvatar ? "Subiendo..." : "Cambiar foto"}
          onClick={pickImage}
          disabled={uploadingAvatar}
        >
          <span className="material-symbols-outlined text-xl">
            {uploadingAvatar ? "hourglass_top" : "photo_camera"}
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChangeFile}
        />
      </div>

      <h3 className="font-display text-2xl text-primary font-bold mb-1">{displayName}</h3>
      <p className="text-slate-500 font-medium mb-4">{profile?.rolLabel || "—"}</p>

      <div
        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-8 ${statusStyles}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${status === "Activo" ? "bg-green-600" : "bg-slate-500"}`}
        />
        {status}
      </div>

      <div className="space-y-3 pt-6 border-t border-border-light">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">ID de Usuario</span>
          <span className="font-semibold text-slate-800">{profile?.idEmpleado || "—"}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Desde</span>
          <span className="font-semibold text-slate-800">{profile?.desdeLabel || "—"}</span>
        </div>
      </div>
    </div>
  );
}
