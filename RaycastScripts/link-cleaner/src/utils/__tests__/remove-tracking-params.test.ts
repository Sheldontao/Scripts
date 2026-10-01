import { describe, expect, it } from "vitest";
import { Rule } from "../../types/rule";
import { cleanTextWithRules } from "../remove-tracking-params";

const rules: Rule[] = [
  {
    name: "Google",
    allowParams: ["q"],
    source: "builtin",
    updatedAt: 0,
    target: { host: "google.com", path: "/", key: "google.com/" },
  },
  {
    name: "Goofish",
    allowParams: ["id"],
    source: "user",
    updatedAt: 1,
    target: { host: "h5.m.goofish.com", path: "/item", key: "h5.m.goofish.com/item" },
  },
];

describe("cleanTextWithRules", () => {
  it("cleans all matched urls", () => {
    const input = "A https://google.com/search?q=abc&utm=1 B";
    const result = cleanTextWithRules(input, rules);
    expect(result.cleanedText).toBe("A https://google.com/search?q=abc B");
    expect(result.unmatchedUrls).toEqual([]);
  });

  it("keeps unmatched urls unchanged in mixed inputs", () => {
    const input =
      "A https://google.com/search?q=abc&utm=1 B https://foo.com/page?x=1&utm=2 C https://h5.m.goofish.com/item?id=1&spm=2";
    const result = cleanTextWithRules(input, rules);
    expect(result.cleanedText).toContain("https://foo.com/page?x=1&utm=2");
    expect(result.cleanedText).toContain("https://h5.m.goofish.com/item?id=1");
    expect(result.unmatchedUrls).toEqual(["https://foo.com/page?x=1&utm=2"]);
  });

  it("returns original text when no url exists", () => {
    const result = cleanTextWithRules("hello", rules);
    expect(result.cleanedText).toBe("hello");
    expect(result.diagnostics).toEqual([]);
  });

  it("preserves replacement order with duplicate urls", () => {
    const input = "https://google.com/search?q=1&utm=1 https://google.com/search?q=1&utm=1";
    const result = cleanTextWithRules(input, rules);
    expect(result.cleanedText).toBe("https://google.com/search?q=1 https://google.com/search?q=1");
  });
});
