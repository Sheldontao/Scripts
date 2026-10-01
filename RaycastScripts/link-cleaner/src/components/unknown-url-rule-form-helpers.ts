import { removeQueryParams } from "../utils/url-utils";

function dedupeParamKeys(keys: string[]): string[] {
  return Array.from(new Set(keys.filter(Boolean)));
}

function getPreviewUrl(url: string, selectedParams: string[]): string {
  return removeQueryParams(url, selectedParams);
}

function formatDetectedParams(keys: string[]): string {
  const uniqueKeys = dedupeParamKeys(keys);
  if (uniqueKeys.length === 0) {
    return "No query parameters found";
  }

  return uniqueKeys.join(", ");
}

export { dedupeParamKeys, formatDetectedParams, getPreviewUrl };
