export type RuleSource = "builtin" | "user";

export interface MatchTarget {
  host: string;
  path: string;
  key: string;
}

export interface Rule {
  name: string;
  allowParams: string[];
  target: MatchTarget;
  source: RuleSource;
  updatedAt: number;
}

export interface RuleMatchResult {
  matchedRule?: Rule;
  reason: "matched" | "no-rule" | "invalid-url";
  normalizedTarget?: MatchTarget;
}
