import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/shared/ui/button";

/**
 * `Button` es el nodo más usado del sistema de diseño. Lo que se prueba aquí no es el
 * estilo, sino el contrato de accesibilidad y de prevención de doble envío, que estaba
 * implementado y sin ninguna red de seguridad.
 */
describe("Button", () => {
  it("con loading queda deshabilitado y marca aria-busy", () => {
    render(<Button loading>Guardar</Button>);
    const button = screen.getByRole("button", { name: /guardar/i });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("sin loading NO deja aria-busy='false' colgando", () => {
    // Un aria-busy="false" permanente es ruido para el lector de pantalla: el
    // componente usa `loading || undefined` justamente para que el atributo
    // desaparezca en lugar de quedarse a false.
    render(<Button>Guardar</Button>);
    expect(screen.getByRole("button", { name: /guardar/i })).not.toHaveAttribute("aria-busy");
  });

  it("con loading no dispara onClick (previene el doble envío)", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button loading onClick={onClick}>Enviar</Button>);

    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("sin loading sí dispara onClick", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Enviar</Button>);

    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("respeta disabled aunque no esté cargando", () => {
    render(<Button disabled>Enviar</Button>);
    expect(screen.getByRole("button", { name: /enviar/i })).toBeDisabled();
  });

  it("con asChild delega el render al hijo y conserva la semántica de enlace", () => {
    // Navegar con un <button onClick={router.push}> rompe "abrir en pestaña nueva" y
    // el menú contextual. `asChild` existe para que el enlace siga siendo un <a>.
    //
    // Se usa un destino EXTERNO a propósito: con una ruta interna, la regla
    // `@next/next/no-html-link-for-pages` exigiría `next/link` —y tiene razón en
    // producción—, pero aquí lo que se comprueba es que `Slot` delega el render al
    // hijo, no cómo se navega dentro de la aplicación.
    render(
      <Button asChild>
        <a href="https://example.org/documentacion">Ver documentación</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: /ver documentación/i });
    expect(link).toHaveAttribute("href", "https://example.org/documentacion");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("el spinner de carga queda oculto para el lector de pantalla", () => {
    const { container } = render(<Button loading>Guardar</Button>);
    const spinner = container.querySelector("svg");

    expect(spinner).not.toBeNull();
    expect(spinner).toHaveAttribute("aria-hidden", "true");
  });

  it("mantiene el nombre accesible mientras carga", () => {
    // Si el spinner aportara texto, el nombre accesible cambiaría a mitad de acción.
    render(<Button loading>Guardar cambios</Button>);
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
  });
});
