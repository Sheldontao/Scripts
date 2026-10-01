import { Rule } from "../types/rule";
import { resolveRuleForUrl } from "./rule-matcher";
import { extractQueryParamKeys, findURLs, removeQueryParams, replaceURLs } from "./url-utils";

interface UrlDiagnostic {
  originalUrl: string;
  cleanedUrl: string;
  status: "matched" | "no-rule" | "invalid-url";
  targetKey?: string;
  availableParams: string[];
}

interface CleaningResult {
  rawText: string;
  cleanedText: string;
  matchedCount: number;
  unmatchedUrls: string[];
  diagnostics: UrlDiagnostic[];
}

function cleanTextWithRules(rawText: string, rules: Rule[]): CleaningResult {
  const urls = findURLs(rawText);
  if (urls.length === 0) {
    return {
      rawText,
      cleanedText: rawText,
      matchedCount: 0,
      unmatchedUrls: [],
      diagnostics: [],
    };
  }

  const nextUrls: string[] = [];
  const diagnostics: UrlDiagnostic[] = [];

  for (const url of urls) {
    const match = resolveRuleForUrl(url, rules);

    if (match.reason === "matched" && match.matchedRule) {
      const cleanedUrl = removeQueryParams(url, match.matchedRule.allowParams);
      nextUrls.push(cleanedUrl);
      diagnostics.push({
        originalUrl: url,
        cleanedUrl,
        status: "matched",
        targetKey: match.normalizedTarget?.key,
        availableParams: extractQueryParamKeys(url),
      });
      continue;
    }

    nextUrls.push(url);
    diagnostics.push({
      originalUrl: url,
      cleanedUrl: url,
      status: match.reason,
      targetKey: match.normalizedTarget?.key,
      availableParams: extractQueryParamKeys(url),
    });
  }

  const cleanedText = replaceURLs(rawText, nextUrls);
  const unmatchedUrls = diagnostics.filter((entry) => entry.status !== "matched").map((entry) => entry.originalUrl);

  return {
    rawText,
    cleanedText,
    matchedCount: diagnostics.length - unmatchedUrls.length,
    unmatchedUrls,
    diagnostics,
  };
}

export type { CleaningResult, UrlDiagnostic };
export { cleanTextWithRules };
