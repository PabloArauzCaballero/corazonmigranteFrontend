"use client";

import { ExternalLink, MonitorSmartphone } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

const PUBLIC_VIEWS = [
  { path: "/", label: "Inicio" },
  { path: "/biblioteca/", label: "Biblioteca" },
  { path: "/novedades/", label: "Novedades" },
  { path: "/noticias/", label: "Noticias" },
  { path: "/booking/", label: "Booking público" },
  { path: "/login/", label: "Login" },
  { path: "/registro/", label: "Registro" }
];

/**
 * Previsualización de las vistas públicas SIN salir del panel administrativo:
 * la barra lateral se mantiene visible y la página pública se renderiza en un iframe.
 */
export function AdminPublicPreview() {
  const [view, setView] = useState(PUBLIC_VIEWS[0]);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  return (
    <Card>
      <CardContent className="grid gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          {PUBLIC_VIEWS.map((item) => (
            <Button
              key={item.path}
              type="button"
              size="sm"
              variant={view.path === item.path ? "default" : "outline"}
              onClick={() => setView(item)}
            >
              {item.label}
            </Button>
          ))}
          <span className="mx-2 hidden h-6 w-px bg-border md:block" />
          <Button type="button" size="sm" variant={device === "desktop" ? "secondary" : "ghost"} onClick={() => setDevice("desktop")}>
            <MonitorSmartphone className="h-4 w-4" /> Escritorio
          </Button>
          <Button type="button" size="sm" variant={device === "mobile" ? "secondary" : "ghost"} onClick={() => setDevice("mobile")}>
            Móvil
          </Button>
          <Button asChild type="button" size="sm" variant="ghost">
            <a href={view.path} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" /> Abrir en pestaña nueva
            </a>
          </Button>
        </div>
        <div className={cn("overflow-hidden rounded-xl border bg-white", device === "mobile" ? "mx-auto w-full max-w-[420px]" : "w-full")}>
          <iframe
            key={`${view.path}-${device}`}
            src={view.path}
            title={`Vista pública: ${view.label}`}
            className="h-[70vh] w-full"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Esta previsualización muestra la vista tal como la ve un visitante, manteniendo tu sesión y la navegación del panel.
        </p>
      </CardContent>
    </Card>
  );
}
