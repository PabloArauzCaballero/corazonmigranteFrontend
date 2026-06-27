import Link from "next/link";
import { ForbiddenState } from "@/shared/ui/state";
import { Button } from "@/shared/ui/button";

export default function ForbiddenPage() {
  return (
    <main className="container flex min-h-screen flex-col justify-center gap-6 py-16">
      <ForbiddenState />
      <div className="text-center"><Button asChild variant="outline"><Link href="/">Volver al inicio</Link></Button></div>
    </main>
  );
}
