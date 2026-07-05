const originalEnv = { ...process.env };

async function importPublicViewApi() {
  jest.resetModules();
  return import("@/features/public-view/public-view.api");
}

describe("public view api endpoints", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("usa public-views/1 para la landing por defecto", async () => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_API_BASE_URL: "https://api.corazondemigrante.com",
      NEXT_PUBLIC_PUBLIC_VIEW_ID: "",
    };

    const {
      buildConfiguredPublicViewCandidates,
      buildConfiguredPublicViewElementCandidates,
    } = await importPublicViewApi();

    expect(buildConfiguredPublicViewCandidates().map((item) => item.url)).toEqual([
      "https://api.corazondemigrante.com/api/v1/public-views/1",
    ]);
    expect(buildConfiguredPublicViewElementCandidates("hero").map((item) => item.url)).toEqual([
      "https://api.corazondemigrante.com/api/v1/public-views/1/elements/hero",
    ]);
  });
});
