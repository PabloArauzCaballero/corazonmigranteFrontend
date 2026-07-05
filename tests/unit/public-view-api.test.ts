const originalEnv = { ...process.env };

async function importPublicViewApi() {
  jest.resetModules();
  return import("@/features/public-view/public-view.api");
}

describe("public view api endpoints", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("usa public/pages/inicio para la landing por defecto", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_BASE_URL: "https://api.corazondemigrante.com",
      NEXT_PUBLIC_PUBLIC_VIEW_SLUG: "",
    };

    const {
      buildConfiguredPublicViewCandidates,
      buildConfiguredPublicViewElementCandidates,
    } = await importPublicViewApi();

    expect(buildConfiguredPublicViewCandidates().map((item) => item.url)).toEqual([
      "https://api.corazondemigrante.com/api/v1/public/pages/inicio",
    ]);
    expect(buildConfiguredPublicViewElementCandidates("hero").map((item) => item.url)).toEqual([
      "https://api.corazondemigrante.com/api/v1/public/pages/inicio/elements/hero",
    ]);
  });

  it("convierte el valor legacy 1 al slug inicio", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_BASE_URL: "https://api.corazondemigrante.com",
      NEXT_PUBLIC_PUBLIC_VIEW_SLUG: "1",
    };

    const { buildConfiguredPublicViewCandidates } = await importPublicViewApi();

    expect(buildConfiguredPublicViewCandidates().map((item) => item.url)).toEqual([
      "https://api.corazondemigrante.com/api/v1/public/pages/inicio",
    ]);
  });

  it("corrige endpoints custom legacy con /public/pages/1", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_BASE_URL: "https://api.corazondemigrante.com",
      NEXT_PUBLIC_PUBLIC_VIEW_ENDPOINT: "/api/v1/public/pages/1",
      NEXT_PUBLIC_PUBLIC_VIEW_ELEMENT_ENDPOINT: "/api/v1/public/pages/1/elements/:code",
    };

    const {
      buildConfiguredPublicViewCandidates,
      buildConfiguredPublicViewElementCandidates,
    } = await importPublicViewApi();

    expect(buildConfiguredPublicViewCandidates().map((item) => item.url)[0]).toBe(
      "https://api.corazondemigrante.com/api/v1/public/pages/inicio",
    );
    expect(buildConfiguredPublicViewElementCandidates("hero").map((item) => item.url)[0]).toBe(
      "https://api.corazondemigrante.com/api/v1/public/pages/inicio/elements/hero",
    );
  });
});
