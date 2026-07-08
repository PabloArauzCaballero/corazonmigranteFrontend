import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, Globe2, HeartHandshake, LockKeyhole, MessageCircle } from "lucide-react";
import { landingSections } from "@/features/landing/content";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

export default function HomePage() {
  return (
    <>
      <section className="container grid gap-10 py-16 md:grid-cols-[1.08fr_0.92fr] md:items-center md:py-24">
        <div>
          <Badge variant="secondary">Plataforma humana y profesional</Badge>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Acompañamiento emocional para personas migrantes y sus familias.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Corazón Migrante organiza terapia, solicitudes de cita y seguimiento en un entorno claro, privado y sensible al contexto de cada persona.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/booking">
                Solicitar cita <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Entrar a mi portal</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> Sin promesas clínicas absolutas</span>
            <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-primary" /> Datos tratados con cuidado</span>
          </div>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-primary/12 via-accent to-secondary p-8">
              <div className="rounded-[2rem] border bg-background/80 p-6 shadow-soft backdrop-blur">
                <div className="grid h-16 w-16 place-items-center rounded-3xl bg-primary text-primary-foreground">
                  <HeartHandshake className="h-8 w-8" aria-hidden="true" />
                </div>
                <h2 className="mt-8 text-2xl font-bold">Un proceso cuidado desde la primera solicitud</h2>
                <div className="mt-6 grid gap-4">
                  {landingSections.steps.map((step, index) => (
                    <div className="flex items-start gap-3" key={step}>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                      <p className="pt-1 text-sm leading-6 text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container py-12" id="acompanamiento">
        <div className="mb-8 max-w-3xl">
          <Badge variant="muted">Acompañamiento</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Diseñado para confianza, no para saturar.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {landingSections.values.map((item) => (
            <Card key={item.title}>
              <CardContent className="p-6">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr]" id="como-funciona">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8">
            <Globe2 className="h-10 w-10" aria-hidden="true" />
            <h2 className="mt-6 text-3xl font-bold">Migrar mueve muchas cosas. La experiencia digital no debería aumentar la carga.</h2>
            <p className="mt-4 text-primary-foreground/80">Por eso la plataforma separa claramente lo público, el portal del paciente, el trabajo terapéutico y la administración.</p>
          </CardContent>
        </Card>
        <div className="grid gap-5 sm:grid-cols-3">
          {landingSections.impact.map((item) => (
            <Card key={item.label}>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-3xl font-black">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {landingSections.specialists.map((specialist) => (
            <Card key={specialist.name}>
              <CardContent className="p-6">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-accent font-bold text-accent-foreground">CM</div>
                <h3 className="text-lg font-bold">{specialist.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{specialist.focus}</p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-primary">{specialist.location}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container pb-20 pt-10">
        <Card className="overflow-hidden bg-secondary">
          <CardContent className="grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Badge>Primer paso</Badge>
              <h2 className="mt-4 text-3xl font-bold">Solicita una cita con una experiencia clara y sin presión.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">El flujo de booking está preparado para consultar disponibilidad real del servidor y mostrar mensajes humanos cuando algo no esté disponible.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Button asChild size="lg">
                <Link href="/booking"><CalendarCheck className="h-5 w-5" /> Agendar</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login"><MessageCircle className="h-5 w-5" /> Ya soy paciente</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
