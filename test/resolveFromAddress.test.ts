import { describe, it, expect } from "vitest";
import { resolveFromAddress } from "../src/helpers";

describe("resolveFromAddress", () => {
  const defaultName = "Default";
  const defaultAddress = "default@test.com";

  it("returns string from directly", () => {
    expect(
      resolveFromAddress("custom@test.com", defaultName, defaultAddress),
    ).toBe("custom@test.com");
  });

  it("formats object with address and name", () => {
    expect(
      resolveFromAddress(
        { address: "obj@test.com", name: "Custom" },
        defaultName,
        defaultAddress,
      ),
    ).toBe("Custom <obj@test.com>");
  });

  it("uses default name when object has no name", () => {
    expect(
      resolveFromAddress(
        { address: "obj@test.com" },
        defaultName,
        defaultAddress,
      ),
    ).toBe("Default <obj@test.com>");
  });

  it("falls back to default when from is undefined", () => {
    expect(resolveFromAddress(undefined, defaultName, defaultAddress)).toBe(
      "Default <default@test.com>",
    );
  });

  it("falls back to default when from is null", () => {
    expect(resolveFromAddress(null, defaultName, defaultAddress)).toBe(
      "Default <default@test.com>",
    );
  });

  it("falls back to default when object has no address key", () => {
    expect(
      resolveFromAddress({ name: "NoAddr" }, defaultName, defaultAddress),
    ).toBe("Default <default@test.com>");
  });
});
