import { Rule } from "../types/rule";
import { buildRuleKey } from "./rule-matcher";

const builtinRules: Rule[] = [
  {
    name: "Google Search",
    target: { host: "google.com", path: "/", key: buildRuleKey("google.com", "/") },
    allowParams: ["q", "ie"],
    source: "builtin",
    updatedAt: 0,
  },
  {
    name: "Baidu Search",
    target: { host: "baidu.com", path: "/", key: buildRuleKey("baidu.com", "/") },
    allowParams: ["wd", "ie"],
    source: "builtin",
    updatedAt: 0,
  },
  {
    name: "Bing Search",
    target: { host: "bing.com", path: "/", key: buildRuleKey("bing.com", "/") },
    allowParams: ["q"],
    source: "builtin",
    updatedAt: 0,
  },
  {
    name: "Netease Music",
    target: { host: "music.163.com", path: "/", key: buildRuleKey("music.163.com", "/") },
    allowParams: ["id"],
    source: "builtin",
    updatedAt: 0,
  },
  {
    name: "Youtube",
    target: { host: "youtube.com", path: "/", key: buildRuleKey("youtube.com", "/") },
    allowParams: ["v", "search_query"],
    source: "builtin",
    updatedAt: 0,
  },
  {
    name: "Instagram Reel",
    target: { host: "instagram.com", path: "/reel", key: buildRuleKey("instagram.com", "/reel") },
    allowParams: [],
    source: "builtin",
    updatedAt: 0,
  },
];

export { builtinRules };
