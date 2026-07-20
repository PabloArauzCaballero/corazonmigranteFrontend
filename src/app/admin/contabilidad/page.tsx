import Link from "next/link";
import { BadgeDollarSign, Building2, Layers3, ReceiptText } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

const modules = [
  { href: "/admin/contabilidad/cuentas", title: "Cuentas", description: "La lista de cuentas que usa el sistema para clasificar el dinero (por ejemplo: caja, banco, ventas).", icon: BadgeDollarSign },
  { href: "/admin/contabilidad/grupos-cuenta", title: "Grupos de cuenta", description: "Agrupan cuentas parecidas entre sí para que los reportes sean más claros.", icon: Layers3 },
  { href: "/admin/contabilidad/centros-costo", title: "Centros de costo", description: "Áreas o proyectos internos a los que se les puede asignar un gasto o un ingreso.", icon: Building2 },
  { href: "/admin/contabilidad/transacciones", title: "Transacciones y ventas", description: "Todos los movimientos de dinero: pagos, gastos y las ventas registradas desde las citas pagadas.", icon: ReceiptText }
];

export default function AccountingPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Contabilidad" description="Aquí se lleva el control del dinero del sistema: cuentas, movimientos y ventas. Solo el personal autorizado puede entrar a esta sección." />
      <div className="grid gap-5 md:grid-cols-2">
        {modules.map((item) => (
          <Link href={item.href} key={item.href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-lg">
              <CardContent className="p-6">
                <item.icon className="h-7 w-7 text-primary" />
                <h2 className="mt-5 text-xl font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
