import { describe, expect, it } from "vitest";
import { Rule } from "../types/rule";
import { ruleSubtitle } from "../utils/rule-presenter";

describe("manage-user-rules helpers", () => {
  it("formats subtitle from allow params", () => {
    const rule: Rule = {
      name: "Goofish",
      source: "user",
      updatedAt: 1,
      allowParams: ["id", "itemId"],
      target: { host: "h5.m.goofish.com", path: "/item", key: "h5.m.goofish.com/item" },
    };

    expect(ruleSubtitle(rule)).toBe("id, itemId");
  });

  it("shows fallback subtitle when allow list is empty", () => {
    const rule: Rule = {
      name: "Goofish",
      source: "user",
      updatedAt: 1,
      allowParams: [],
      target: { host: "h5.m.goofish.com", path: "/item", key: "h5.m.goofish.com/item" },
    };

    expect(ruleSubtitle(rule)).toBe("No parameters kept");
  });
});
