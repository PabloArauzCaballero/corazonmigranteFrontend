import { AlertTriangle, Inbox, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

export function LoadingState({ title = "Cargando información" }: { title?: string }) {
  return (
    <Card className="animate-pulse border-dashed">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
        <p className="font-medium text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="animate-fade-in border-dashed">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="animate-fade-in border-destructive/30 bg-destructive/5">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && onAction ? (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ForbiddenState() {
  return (
    <Card className="animate-fade-in border-amber-200 bg-amber-50">
      <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
        <ShieldAlert className="h-8 w-8 text-amber-700" aria-hidden="true" />
        <div>
          <p className="font-semibold text-amber-950">Acceso restringido</p>
          <p className="mt-1 max-w-md text-sm leading-6 text-amber-900/80">
            Tu cuenta no tiene permisos para ver esta sección. Si crees que esto es un error, contacta a administración.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
