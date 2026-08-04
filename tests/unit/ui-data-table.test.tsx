import { render, screen, within } from "@testing-library/react";
import { DataTable, type DataTableColumn } from "@/shared/ui/data-table";

/**
 * `DataTable` está detrás de casi todas las pantallas de portal. Lo que se prueba aquí
 * es sobre todo su DEFENSA: acepta `undefined` y `null` a propósito para que el
 * consumidor pueda pasarle `query.data` sin comprobaciones previas. Esa tolerancia es
 * lo que evita el fallo «Cannot read properties of undefined (reading 'length')»
 * cuando el endpoint aún no respondió o falló.
 *
 * NOTA: el componente pinta DOS vistas simultáneas — tarjetas (móvil) y tabla
 * (escritorio) — y CSS decide cuál se ve. En jsdom no hay CSS, así que cada dato
 * aparece dos veces en el DOM. Las aserciones se acotan a la <table> para no depender
 * de esa duplicación.
 */
type Fila = { id: string; nombre: string; estado: string };

const columnas: DataTableColumn<Fila>[] = [
  { key: "nombre", header: "Nombre", render: (row) => row.nombre },
  { key: "estado", header: "Estado", render: (row) => row.estado }
];

const filas: Fila[] = [
  { id: "1", nombre: "Ana Pérez", estado: "Activa" },
  { id: "2", nombre: "Luis Gómez", estado: "Pendiente" }
];

function renderTabla(data: Fila[] | undefined | null) {
  return render(<DataTable columns={columnas} data={data} getRowKey={(row) => row.id} />);
}

describe("DataTable", () => {
  it("renderiza una fila por elemento con sus celdas", () => {
    renderTabla(filas);

    const tabla = screen.getByRole("table");
    // 1 fila de cabecera + 2 de datos
    expect(within(tabla).getAllByRole("row")).toHaveLength(3);
    expect(within(tabla).getByText("Ana Pérez")).toBeInTheDocument();
    expect(within(tabla).getByText("Pendiente")).toBeInTheDocument();
  });

  it("renderiza las cabeceras declaradas en columns", () => {
    renderTabla(filas);

    const tabla = screen.getByRole("table");
    expect(within(tabla).getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
    expect(within(tabla).getByRole("columnheader", { name: "Estado" })).toBeInTheDocument();
  });

  it("con data undefined muestra el estado vacío en lugar de romper", () => {
    // Este es el caso real: `query.data` es undefined mientras carga o si falla.
    expect(() => renderTabla(undefined)).not.toThrow();

    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("con data null muestra el estado vacío en lugar de romper", () => {
    expect(() => renderTabla(null)).not.toThrow();
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });

  it("con lista vacía muestra el estado vacío", () => {
    renderTabla([]);
    expect(screen.getByText("Sin resultados")).toBeInTheDocument();
  });

  it("permite personalizar el texto del estado vacío", () => {
    render(
      <DataTable
        columns={columnas}
        data={[]}
        getRowKey={(row) => row.id}
        emptyTitle="Aún no hay citas"
        emptyDescription="Cuando reserves una cita aparecerá aquí."
      />
    );

    expect(screen.getByText("Aún no hay citas")).toBeInTheDocument();
    expect(screen.getByText("Cuando reserves una cita aparecerá aquí.")).toBeInTheDocument();
    expect(screen.queryByText("Sin resultados")).not.toBeInTheDocument();
  });

  it("usa getRowKey para identificar cada fila", () => {
    // Si getRowKey devolviera algo no único, React reutilizaría filas al reordenar y
    // se verían datos cruzados. Se comprueba que se invoca con la fila completa.
    const getRowKey = jest.fn((row: Fila) => row.id);
    render(<DataTable columns={columnas} data={filas} getRowKey={getRowKey} />);

    expect(getRowKey).toHaveBeenCalledWith(filas[0]);
    expect(getRowKey).toHaveBeenCalledWith(filas[1]);
  });

  it("render de columna recibe la fila completa", () => {
    const render1 = jest.fn((row: Fila) => row.nombre);
    render(
      <DataTable
        columns={[{ key: "nombre", header: "Nombre", render: render1 }]}
        data={[filas[0]]}
        getRowKey={(row) => row.id}
      />
    );

    expect(render1).toHaveBeenCalledWith(filas[0]);
  });
});
