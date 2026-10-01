import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = new Map<string, string>();

vi.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: vi.fn(async (key: string) => storage.get(key)),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

import { USER_RULES_STORAGE_KEY, deleteUserRuleByKey, listUserRules, upsertUserRule } from "../user-rules-storage";

describe("user-rules-storage", () => {
  beforeEach(() => {
    storage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T00:00:00Z"));
  });

  it("upserts a new rule", async () => {
    await upsertUserRule({ name: "Goofish", host: "h5.m.goofish.com", path: "/item", allowParams: ["id"] });

    const rules = await listUserRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].target.key).toBe("h5.m.goofish.com/item");
    expect(rules[0].allowParams).toEqual(["id"]);
  });

  it("overwrites existing key on upsert", async () => {
    await upsertUserRule({ name: "Goofish", host: "h5.m.goofish.com", path: "/item", allowParams: ["id"] });
    vi.setSystemTime(new Date("2026-04-18T00:01:00Z"));
    await upsertUserRule({ name: "Goofish", host: "h5.m.goofish.com", path: "/item/", allowParams: ["itemId"] });

    const rules = await listUserRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].allowParams).toEqual(["itemId"]);
    expect(rules[0].updatedAt).toBe(new Date("2026-04-18T00:01:00Z").getTime());
  });

  it("returns empty array for empty storage", async () => {
    const rules = await listUserRules();
    expect(rules).toEqual([]);
  });

  it("falls back to empty array for malformed stored data", async () => {
    storage.set(USER_RULES_STORAGE_KEY, "{oops");
    const rules = await listUserRules();
    expect(rules).toEqual([]);
  });

  it("deletes by key idempotently", async () => {
    await upsertUserRule({ name: "Rule", host: "example.com", path: "/x", allowParams: ["a"] });
    await deleteUserRuleByKey("example.com/x");
    await deleteUserRuleByKey("example.com/x");
    expect(await listUserRules()).toEqual([]);
  });
});
