import { describe, expect, it } from "vitest";
import { Rule } from "../../types/rule";
import { buildRuleKey, normalizeUrlTarget, resolveRuleForUrl } from "../rule-matcher";

function userRule(host: string, path: string, updatedAt: number): Rule {
  return {
    name: "User Rule",
    allowParams: ["id"],
    source: "user",
    updatedAt,
    target: { host, path, key: buildRuleKey(host, path) },
  };
}

function builtinRule(host: string, path: string): Rule {
  return {
    name: "Builtin Rule",
    allowParams: ["id"],
    source: "builtin",
    updatedAt: 0,
    target: { host, path, key: buildRuleKey(host, path) },
  };
}

describe("rule-matcher", () => {
  it("prefers user rule over builtin", () => {
    const result = resolveRuleForUrl("https://h5.m.goofish.com/item?id=1", [
      builtinRule("goofish.com", "/item"),
      userRule("h5.m.goofish.com", "/item", 1),
    ]);

    expect(result.matchedRule?.source).toBe("user");
  });

  it("prefers longer path within same source", () => {
    const result = resolveRuleForUrl("https://example.com/item/detail?id=1", [
      userRule("example.com", "/item", 1),
      userRule("example.com", "/item/detail", 1),
    ]);

    expect(result.matchedRule?.target.path).toBe("/item/detail");
  });

  it("prefers newer rule when key collides", () => {
    const result = resolveRuleForUrl("https://example.com/item?id=1", [
      userRule("example.com", "/item", 1),
      userRule("example.com", "/item", 2),
    ]);

    expect(result.matchedRule?.updatedAt).toBe(2);
  });

  it("normalizes trailing slash for url target", () => {
    const target = normalizeUrlTarget("https://example.com/item/?id=1");
    expect(target?.key).toBe("example.com/item");
  });

  it("keeps root path normalized", () => {
    const target = normalizeUrlTarget("https://example.com/?id=1");
    expect(target?.path).toBe("/");
  });

  it("returns invalid-url when input is malformed", () => {
    const result = resolveRuleForUrl("not-a-url", [userRule("example.com", "/", 1)]);
    expect(result.reason).toBe("invalid-url");
    expect(result.matchedRule).toBeUndefined();
  });
});
