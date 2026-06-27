"use client";

import { useSession } from "@/shared/auth/use-session";
import { initials } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";

export function ProfileCard() {
  const { session } = useSession();
  if (!session) return null;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">{initials(session.fullName)}</div>
        <div>
          <p className="font-bold">{session.fullName}</p>
          <p className="text-sm text-muted-foreground">{session.email}</p>
          <Badge className="mt-2" variant="secondary">{session.role}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
