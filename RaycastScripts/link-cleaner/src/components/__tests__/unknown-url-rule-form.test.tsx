import { describe, expect, it } from "vitest";
import { dedupeParamKeys, formatDetectedParams, getPreviewUrl } from "../unknown-url-rule-form-helpers";

describe("unknown-url-rule-form helpers", () => {
  it("deduplicates parameter keys", () => {
    expect(dedupeParamKeys(["id", "id", "itemId"])).toEqual(["id", "itemId"]);
  });

  it("updates preview based on selected params", () => {
    const preview = getPreviewUrl("https://h5.m.goofish.com/item?id=1&itemId=2&spm=3", ["id", "itemId"]);
    expect(preview).toBe("https://h5.m.goofish.com/item?id=1&itemId=2");
  });

  it("removes query entirely when no params are selected", () => {
    const preview = getPreviewUrl("https://h5.m.goofish.com/item?id=1&spm=3", []);
    expect(preview).toBe("https://h5.m.goofish.com/item");
  });

  it("formats detected parameters for display", () => {
    expect(formatDetectedParams(["id", "itemId", "id"])).toBe("id, itemId");
  });
});
