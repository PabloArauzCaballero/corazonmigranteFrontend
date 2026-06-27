import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

const rows = [{ id: "t-1", fecha: "2026-07-02", detalle: "Venta de servicio", monto: "Bs 350.00", estado: "borrador" }];

export default function TransactionsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Transacciones" description="Movimientos contables con validaciones y confirmación para acciones de impacto." actions={<Button>Nueva transacción</Button>} />
      <DataTable
        data={rows}
        getRowKey={(row) => row.id}
        columns={[
          { key: "fecha", header: "Fecha", render: (row) => row.fecha },
          { key: "detalle", header: "Detalle", render: (row) => row.detalle },
          { key: "monto", header: "Monto", render: (row) => row.monto },
          { key: "estado", header: "Estado", render: (row) => <Badge variant="warning">{row.estado}</Badge> }
        ]}
      />
    </div>
  );
}
