import { describe, expect, it } from "vitest";
import { formatAllowParams, parseAllowParams } from "../rule-editor-form-helpers";

describe("rule-editor-form helpers", () => {
  it("parses comma-separated params with dedupe", () => {
    expect(parseAllowParams("id, itemId, id, spm")).toEqual(["id", "itemId", "spm"]);
  });

  it("formats allow params for textarea", () => {
    expect(formatAllowParams(["id", "itemId"])).toBe("id, itemId");
  });
});
