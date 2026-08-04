import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "@/shared/ui/data-table";
import { resolvePriority, type DataTableColumn } from "@/shared/ui/data-table-types";

/**
 * Cubre EXCLUSIVAMENTE la vista compacta de `DataTable` (tarjetas por debajo de `md`)
 * y la inferencia de prioridad de columna. El contrato general del componente —
 * tolerancia a `undefined`/`null`, estados vacíos, `getRowKey`, cabeceras — se prueba
 * en `ui-data-table.test.tsx`; aquí no se repite.
 *
 * Contexto de la corrección: la tabla forzaba `min-w-[760px]`, de modo que en un
 * teléfono la columna de acciones quedaba siempre fuera de pantalla y el panel admin
 * era inoperable. La vista de tarjetas reutiliza las MISMAS columnas, así que ninguna
 * de las 16 pantallas que usan `DataTable` necesitó cambio alguno.
 *
 * NOTA sobre jsdom: no aplica CSS, de modo que ambas vistas coexisten en el DOM. Las
 * aserciones se acotan a la tarjeta (`listitem`) o a la `table` según corresponda.
 */

type Row = { id: string; nombre: string; correo: string; estado: string };

const rows: Row[] = [
  { id: "1", nombre: "Ana Pérez", correo: "ana.perez@ejemplo.com", estado: "activo" },
  { id: "2", nombre: "Luis Rodríguez", correo: "luis.rodriguez@ejemplo.com", estado: "bloqueado" },
];

function columnsWith(onAction: (row: Row) => void): DataTableColumn<Row>[] {
  return [
    { key: "nombre", header: "Usuario", render: (row) => <span>{row.nombre}</span> },
    { key: "correo", header: "Correo", render: (row) => <span>{row.correo}</span> },
    { key: "estado", header: "Estado", render: (row) => <span>{row.estado}</span> },
    {
      key: "actions",
      header: "Acciones",
      render: (row) => (
        <button type="button" onClick={() => onAction(row)}>
          Editar {row.nombre}
        </button>
      ),
    },
  ];
}

describe("resolvePriority — inferencia de prioridad de columna", () => {
  it("trata la primera columna como identidad de la fila", () => {
    expect(resolvePriority({ key: "nombre", header: "Usuario", render: () => null }, 0)).toBe("primary");
  });

  it("agrupa la columna `actions` como controles", () => {
    expect(resolvePriority({ key: "actions", header: "Acciones", render: () => null }, 3)).toBe("actions");
  });

  it("trata el resto como datos", () => {
    expect(resolvePriority({ key: "correo", header: "Correo", render: () => null }, 1)).toBe("secondary");
  });

  it("respeta la prioridad declarada por encima de la inferida", () => {
    expect(
      resolvePriority({ key: "nombre", header: "Usuario", render: () => null, priority: "hidden" }, 0)
    ).toBe("hidden");
  });
});

describe("DataTable — vista compacta de tarjetas", () => {
  it("pinta una tarjeta por fila con sus datos", () => {
    render(<DataTable<Row> columns={columnsWith(() => {})} data={rows} getRowKey={(row) => row.id} />);

    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(rows.length);
    expect(within(cards[0]).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(cards[0]).getByText("ana.perez@ejemplo.com")).toBeInTheDocument();
  });

  it("mantiene operativas las acciones dentro de la tarjeta", async () => {
    // Garantía central de la corrección: la acción sigue disponible y sigue recibiendo
    // la fila correcta, que es lo que el desplazamiento horizontal impedía en móvil.
    const onAction = jest.fn();
    render(<DataTable<Row> columns={columnsWith(onAction)} data={rows} getRowKey={(row) => row.id} />);

    const card = screen.getAllByRole("listitem")[1];
    await userEvent.click(within(card).getByRole("button", { name: /Editar Luis Rodríguez/ }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(rows[1]);
  });

  it("etiqueta cada dato de la tarjeta con el encabezado de su columna", () => {
    // En una tarjeta la relación etiqueta→valor deja de ser posicional (ya no hay
    // cabecera de columna encima), así que se declara con `dl`/`dt`/`dd`.
    render(<DataTable<Row> columns={columnsWith(() => {})} data={rows} getRowKey={(row) => row.id} />);

    const card = screen.getAllByRole("listitem")[0];
    expect(within(card).getByText("Correo")).toBeInTheDocument();
    expect(within(card).getByText("Estado")).toBeInTheDocument();
  });

  it("usa `cardLabel` cuando el encabezado resulta escueto fuera de la tabla", () => {
    const columns: DataTableColumn<Row>[] = [
      { key: "nombre", header: "Usuario", render: (row) => <span>{row.nombre}</span> },
      { key: "estado", header: "Est.", cardLabel: "Estado de la cuenta", render: (row) => <span>{row.estado}</span> },
    ];
    render(<DataTable<Row> columns={columns} data={rows} getRowKey={(row) => row.id} />);

    expect(within(screen.getAllByRole("listitem")[0]).getByText("Estado de la cuenta")).toBeInTheDocument();
  });

  it("omite en la tarjeta las columnas `hidden`, sin quitarlas de la tabla", () => {
    const columns: DataTableColumn<Row>[] = [
      { key: "nombre", header: "Usuario", render: (row) => <span>{row.nombre}</span> },
      { key: "id", header: "ID interno", priority: "hidden", render: (row) => <span>ID-{row.id}</span> },
    ];
    render(<DataTable<Row> columns={columns} data={rows} getRowKey={(row) => row.id} />);

    expect(within(screen.getAllByRole("listitem")[0]).queryByText("ID interno")).not.toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("ID interno")).toBeInTheDocument();
  });

  it("no pinta tarjetas cuando no hay filas", () => {
    render(<DataTable<Row> columns={columnsWith(() => {})} data={[]} getRowKey={(row) => row.id} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
