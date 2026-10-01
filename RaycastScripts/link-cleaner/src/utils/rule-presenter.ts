import { Rule } from "../types/rule";

function ruleSubtitle(rule: Rule): string {
  return rule.allowParams.join(", ") || "No parameters kept";
}

export { ruleSubtitle };
