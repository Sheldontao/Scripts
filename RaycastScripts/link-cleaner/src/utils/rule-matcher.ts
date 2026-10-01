import { Rule, RuleMatchResult } from "../types/rule";

function normalizeHost(host: string): string {
  return host.trim().toLowerCase();
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }
  const trimmed = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return trimmed || "/";
}

function buildRuleKey(host: string, path: string): string {
  return `${normalizeHost(host)}${normalizePath(path)}`;
}

function normalizeUrlTarget(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const host = normalizeHost(parsed.hostname);
    const path = normalizePath(parsed.pathname);
    return { host, path, key: buildRuleKey(host, path) };
  } catch {
    return undefined;
  }
}

function compareRules(a: Rule, b: Rule): number {
  const sourceRank = (rule: Rule) => (rule.source === "user" ? 2 : 1);
  if (sourceRank(a) !== sourceRank(b)) {
    return sourceRank(b) - sourceRank(a);
  }

  const pathLengthA = a.target.path.length;
  const pathLengthB = b.target.path.length;
  if (pathLengthA !== pathLengthB) {
    return pathLengthB - pathLengthA;
  }

  return b.updatedAt - a.updatedAt;
}

function ruleMatchesTarget(rule: Rule, host: string, path: string): boolean {
  if (rule.source === "user") {
    return rule.target.host === host && rule.target.path === path;
  }

  const hostMatches = host === rule.target.host || host.endsWith(`.${rule.target.host}`);
  if (!hostMatches) {
    return false;
  }

  if (rule.target.path === "/") {
    return true;
  }

  return path === rule.target.path || path.startsWith(`${rule.target.path}/`);
}

function resolveRuleForUrl(rawUrl: string, rules: Rule[]): RuleMatchResult {
  const target = normalizeUrlTarget(rawUrl);
  if (!target) {
    return { reason: "invalid-url" };
  }

  const matched = rules.filter((rule) => ruleMatchesTarget(rule, target.host, target.path)).sort(compareRules);
  if (matched.length === 0) {
    return { reason: "no-rule", normalizedTarget: target };
  }

  return { reason: "matched", normalizedTarget: target, matchedRule: matched[0] };
}

export { buildRuleKey, normalizePath, normalizeUrlTarget, resolveRuleForUrl };
