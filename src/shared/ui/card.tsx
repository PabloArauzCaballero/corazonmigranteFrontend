import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card text-card-foreground shadow-soft",
        "transition-[shadow,transform] duration-200 ease-out",
        className
      )}
      {...props}
    />
  );
}

/* El padding de las tarjetas es progresivo: a 320 px los 24 px fijos por lado, sumados
   a los del contenedor de página, dejaban el contenido en 240 px útiles. A partir de
   `sm` se recupera el espaciado original, de modo que el escritorio no cambia. */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2 p-4 sm:p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("break-words text-lg font-bold tracking-tight sm:text-xl", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  /* `flex-wrap`: los pies de tarjeta agrupan acciones y, sin envoltura, dos botones
     desbordaban la tarjeta en pantallas estrechas. */
  return <div className={cn("flex flex-wrap items-center gap-2 p-4 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}
