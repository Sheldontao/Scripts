// detect all urls in text
function findURLs(text: string): string[] {
  const regex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(regex);
  return matches ?? [];
}

// replace all urls in text
function replaceURLs(text: string, newURLs: string[]): string {
  let cursor = 0;
  return text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
    const replacement = newURLs[cursor];
    cursor += 1;
    return replacement ?? match;
  });
}

// remove some query params from url
function removeQueryParams(url: string, allowParams: string[]): string {
  // find all query params
  const urlParts = url.split("?");
  if (urlParts.length < 2) {
    return url;
  }
  const query = urlParts[1].split("&");

  // if params is not empty, match params to remove
  if (allowParams.length > 0) {
    const newQuery = query.filter((param) => allowParams.includes(param.split("=")[0]));
    if (newQuery.length === 0) {
      return urlParts[0];
    }
    return `${urlParts[0]}?${newQuery.join("&")}`;
  }
  // if params is empty, remove all query params
  return urlParts[0];
}

function extractQueryParamKeys(rawUrl: string): string[] {
  try {
    const parsed = new URL(rawUrl);
    const keys = [...parsed.searchParams.keys()].filter(Boolean);
    return Array.from(new Set(keys));
  } catch {
    return [];
  }
}

export { extractQueryParamKeys, findURLs, removeQueryParams, replaceURLs };
