import { LocalStorage } from "@raycast/api";
import { Rule } from "../types/rule";
import { buildRuleKey, normalizePath } from "./rule-matcher";

const USER_RULES_STORAGE_KEY = "user-rules-v1";

interface UpsertUserRuleInput {
  name: string;
  host: string;
  path: string;
  allowParams: string[];
}

function normalizeHost(host: string): string {
  return host.trim().toLowerCase();
}

function parseStoredRules(rawValue: string | undefined): Rule[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((rule) => rule?.source === "user");
  } catch {
    return [];
  }
}

async function listUserRules(): Promise<Rule[]> {
  const rawValue = await LocalStorage.getItem<string>(USER_RULES_STORAGE_KEY);
  return parseStoredRules(rawValue);
}

async function saveUserRules(rules: Rule[]): Promise<void> {
  await LocalStorage.setItem(USER_RULES_STORAGE_KEY, JSON.stringify(rules));
}

async function upsertUserRule(input: UpsertUserRuleInput): Promise<Rule> {
  const host = normalizeHost(input.host);
  const path = normalizePath(input.path);
  const key = buildRuleKey(host, path);
  const updatedAt = Date.now();

  const nextRule: Rule = {
    name: input.name,
    allowParams: Array.from(new Set(input.allowParams)).filter(Boolean),
    source: "user",
    updatedAt,
    target: {
      host,
      path,
      key,
    },
  };

  const rules = await listUserRules();
  const nextRules = [...rules.filter((rule) => rule.target.key !== key), nextRule];

  await saveUserRules(nextRules);
  return nextRule;
}

async function deleteUserRuleByKey(key: string): Promise<void> {
  const rules = await listUserRules();
  const nextRules = rules.filter((rule) => rule.target.key !== key);
  await saveUserRules(nextRules);
}

export { USER_RULES_STORAGE_KEY, deleteUserRuleByKey, listUserRules, upsertUserRule };
