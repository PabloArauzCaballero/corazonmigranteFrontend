import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200",
  {
    variants: {
      variant: {
        default:   "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        muted:     "bg-muted text-muted-foreground",
        // Antes: `emerald-100/800`, `amber-100/800`, `red-100/800` — paletas crudas
        // de Tailwind que no respondían a ningún token y quedaban en claro sobre el
        // tema oscuro. Ahora salen del par `*-surface` / `*` del sistema.
        success:   "bg-success-surface text-success",
        warning:   "bg-warning-surface text-warning",
        danger:    "bg-destructive-surface text-destructive",
        info:      "bg-info-surface text-info",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
