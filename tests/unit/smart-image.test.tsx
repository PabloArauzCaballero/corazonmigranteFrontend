import { render, screen, fireEvent } from "@testing-library/react";
import { SmartImage } from "@/shared/ui/smart-image";

describe("SmartImage — reparación de imágenes caídas", () => {
  it("renderiza la imagen principal cuando la URL es válida", () => {
    render(<SmartImage src="/landing/carrusel-1.webp" alt="Hero" />);
    const img = screen.getByAltText("Hero") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toBe("/landing/carrusel-1.webp");
  });

  it("usa el fallback cuando la imagen principal falla", () => {
    render(
      <SmartImage
        src="https://cloudinary.invalid/roto.webp"
        fallbackSrc="/landing/carrusel-2.webp"
        alt="Con fallback"
      />,
    );
    const img = screen.getByAltText("Con fallback") as HTMLImageElement;
    // Simula el error de carga del recurso remoto
    fireEvent.error(img);
    expect(img.getAttribute("src")).toBe("/landing/carrusel-2.webp");
  });

  it("una URL vacía no rompe el render y usa el fallback directamente", () => {
    render(<SmartImage src="" fallbackSrc="/landing/carrusel-3.webp" alt="Vacia" />);
    const img = screen.getByAltText("Vacia") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/landing/carrusel-3.webp");
  });

  it("no entra en bucle: tras fallar el fallback marca error y no reintenta", () => {
    render(<SmartImage src="/roto-1.webp" fallbackSrc="/roto-2.webp" alt="Doble fallo" />);
    const img = screen.getByAltText("Doble fallo") as HTMLImageElement;
    fireEvent.error(img); // pasa a fallback /roto-2.webp
    expect(img.getAttribute("src")).toBe("/roto-2.webp");
    fireEvent.error(img); // segundo fallo -> estado error, sin cambiar src de nuevo
    expect(img.getAttribute("src")).toBe("/roto-2.webp");
  });

  it("marca prioridad de carga para el hero", () => {
    render(<SmartImage src="/landing/carrusel-1.webp" alt="Prioritaria" priority />);
    const img = screen.getByAltText("Prioritaria") as HTMLImageElement;
    expect(img.getAttribute("loading")).toBe("eager");
    expect(img.getAttribute("fetchpriority")).toBe("high");
  });
});
