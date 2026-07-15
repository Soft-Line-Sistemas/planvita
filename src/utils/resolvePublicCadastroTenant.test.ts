import { describe, expect, it } from "vitest";

import resolvePublicCadastroTenant from "./resolvePublicCadastroTenant";

describe("resolvePublicCadastroTenant", () => {
  it("uses consultorTenant from the public link when present", () => {
    expect(
      resolvePublicCadastroTenant("?consultorId=2&consultorTenant=tenant-b"),
    ).toBe("tenant-b");
  });

  it("normalizes consultorTenant to lowercase", () => {
    expect(resolvePublicCadastroTenant("?consultorTenant=BOSQUE")).toBe(
      "bosque",
    );
  });

  it("falls back to bosque when consultorTenant is missing", () => {
    expect(resolvePublicCadastroTenant("?consultorId=2")).toBe("bosque");
  });

  it("falls back to bosque when consultorTenant is invalid", () => {
    expect(resolvePublicCadastroTenant("?consultorTenant=bosque/app")).toBe(
      "bosque",
    );
  });
});
