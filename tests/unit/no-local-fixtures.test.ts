import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "src");
const forbiddenPatterns = [
  /Paciente Demo/i,
  /demo-token/i,
  /demo-booking/i,
  /demoUsers/i,
  /mock(?:s|ups?)/i,
  /const\s+rows\s*=\s*\[/,
  /const\s+requests\s*=\s*\[/,
  /const\s+agenda\s*=\s*\[/,
  /Paciente asignado/i,
  /const\s+sections\s*=\s*\[/
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return sourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry) ? [fullPath] : [];
  });
}

describe("backend integrity guard", () => {
  it("does not keep local business fixtures or mocked production data in src", () => {
    const offenders = sourceFiles(root).flatMap((file) => {
      const content = readFileSync(file, "utf8");
      return forbiddenPatterns.some((pattern) => pattern.test(content)) ? [file.replace(`${process.cwd()}/`, "")] : [];
    });

    expect(offenders).toEqual([]);
  });
});
