import React, { useEffect, useMemo, useState } from "react";

function isImageUrl(url) {
  const u = String(url || "").toLowerCase();
  // Fast path for common image extensions.
  return (
    u.endsWith(".png") ||
    u.endsWith(".jpg") ||
    u.endsWith(".jpeg") ||
    u.endsWith(".webp") ||
    u.endsWith(".gif") ||
    u.endsWith(".bmp") ||
    u.includes("image/")
  );
}

function prettyMaybeJson(text) {
  const t = String(text ?? "").trim();
  if (!t) return "";
  try {
    const obj = JSON.parse(t);
    return JSON.stringify(obj, null, 2);
  } catch {
    return t;
  }
}

export default function PublicViewPreviewCard({ title, description, editingUiElement, file }) {
  // Backend response shape: row.link is the main URL to media/json/etc.
  const elementLink = editingUiElement?.raw?.link || editingUiElement?.link || editingUiElement?.raw?.metadata?.url || null;

  // Local file preview (if user selected a new file)
  const [localObjectUrl, setLocalObjectUrl] = useState("");
  const [localText, setLocalText] = useState("");
  const [remoteText, setRemoteText] = useState("");
  const [remoteTextError, setRemoteTextError] = useState("");

  const isLocalImage = Boolean(file && String(file?.type || "").startsWith("image/"));
  const isRemoteImage = Boolean(elementLink && isImageUrl(elementLink));

  // Choose what to show in the left side of preview.
  // Priority: local file (if selected) > remote link (existing element)
  const mode = useMemo(() => {
    if (file) return isLocalImage ? "image" : "text";
    if (elementLink) return isRemoteImage ? "image" : "text";
    return "image"; // default placeholder
  }, [file, isLocalImage, elementLink, isRemoteImage]);

  // Build local objectURL for selected file images.
  useEffect(() => {
    if (!file || !isLocalImage) {
      setLocalObjectUrl("");
      return;
    }

    const url = URL.createObjectURL(file);
    setLocalObjectUrl(url);
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // noop
      }
    };
  }, [file, isLocalImage]);

  // Read local text/json file (best effort)
  useEffect(() => {
    if (!file || isLocalImage) {
      setLocalText("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      setLocalText(prettyMaybeJson(raw));
    };
    reader.onerror = () => {
      setLocalText("(No se pudo leer el archivo como texto.)");
    };
    reader.readAsText(file);
  }, [file, isLocalImage]);

  // Fetch remote text/json (best effort). Only when:
  // - no local file selected
  // - link exists
  // - link doesn't look like an image
  useEffect(() => {
    let abort = false;

    async function run() {
      setRemoteText("");
      setRemoteTextError("");

      if (file) return;
      if (!elementLink) return;
      if (isRemoteImage) return;

      try {
        const r = await fetch(elementLink, { method: "GET" });
        const txt = await r.text();
        if (abort) return;
        setRemoteText(prettyMaybeJson(txt));
      } catch (e) {
        if (abort) return;
        setRemoteTextError("No se pudo cargar el contenido del link para vista previa.");
      }
    }

    run();
    return () => {
      abort = true;
    };
  }, [file, elementLink, isRemoteImage]);

  // Preview text labels
  const previewTitle = useMemo(() => {
    if (editingUiElement?.type && String(editingUiElement.type).toLowerCase().includes("texto")) {
      return editingUiElement?.value || title || "Vista Previa";
    }
    return title || "Vista Previa";
  }, [editingUiElement, title]);

  const previewDesc = useMemo(() => {
    if (editingUiElement) {
      return [editingUiElement?.page, editingUiElement?.code].filter(Boolean).join(" • ");
    }
    return description;
  }, [editingUiElement, description]);

  // Image source (local file > element link > default)
  const imgSrc = useMemo(() => {
    if (localObjectUrl) return localObjectUrl;
    if (isRemoteImage) return elementLink;
    return null;
  }, [localObjectUrl, isRemoteImage, elementLink]);

  const DEFAULT_URL =
    "https://storage.googleapis.com/vistas_publicas_assets/admin_portal/media/Banner%20portal%20administrativo";

  const glassCard =
    "rounded-xl p-8 shadow-sm bg-white/70 backdrop-blur border border-primary/10";

  const codeValue = useMemo(() => {
    if (file && !isLocalImage) return localText;
    if (!file && elementLink && !isRemoteImage) return remoteText || "";
    return "";
  }, [file, isLocalImage, localText, elementLink, isRemoteImage, remoteText]);

  return (
    <section className={[glassCard, "flex flex-col"].join(" ")}>
      <div className="flex items-center gap-3 mb-8">
        <span className="material-symbols-outlined text-primary">play_circle</span>
        <h3 className="font-display text-2xl text-gray-800 italic">Vista Previa</h3>
      </div>

      <div className="flex-1 bg-white rounded-xl overflow-hidden border border-gray-100 shadow-xl flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 aspect-square overflow-hidden bg-background-light">
          {mode === "image" ? (
            <img
              src={imgSrc || DEFAULT_URL}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Vista previa de contenido
              </div>

              {remoteTextError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs p-3 mb-3">
                  {remoteTextError}
                </div>
              ) : null}

              <textarea
                readOnly
                value={codeValue || (elementLink ? String(elementLink) : "")}
                className="w-full h-[calc(100%-28px)] resize-none rounded-lg border border-gray-200 bg-white font-mono text-[12px] leading-5 p-3 focus:outline-none"
                placeholder="(Aquí se mostrará el contenido si no es imagen)"
              />
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h4 className="font-display text-2xl text-primary mb-4">{previewTitle}</h4>

          <p className="text-gray-600 text-sm leading-relaxed mb-8 italic font-light">
            {previewDesc}
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400 italic">Previsualización exacta de la landing page pública.</p>
      </div>
    </section>
  );
}
