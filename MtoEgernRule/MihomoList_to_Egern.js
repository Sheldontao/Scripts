// Mihomo .list → Egern rule_set 转换器
// 支持 geosite/*.list（域名规则）和 geoip/*.list（IP CIDR 规则）

let body = $response.body;
let url = $request.url;

let lines = body.split("\n").filter((line) => {
  const t = line.trim();
  return t && !t.startsWith("#") && !t.startsWith("//");
});

// ===== 判断是 geosite 还是 geoip =====
if (url.includes("/geoip/")) {
  // ===== geoip/*.list → ip_cidr_set =====
  // 格式：纯文本，一行一个 CIDR，如 1.0.0.0/24
  let ipv4 = [];
  let ipv6 = [];

  lines.forEach((line) => {
    line = line.trim();
    // 去掉可能存在的 YAML 列表前缀（某些工具可能生成）
    if (line.startsWith("- ")) line = line.substring(2);
    if (line.startsWith("'") && line.endsWith("'")) line = line.slice(1, -1);
    if (line.startsWith('"') && line.endsWith('"')) line = line.slice(1, -1);

    line = line.trim();
    if (!line) return;

    if (line.includes(":")) {
      // IPv6 CIDR
      ipv6.push(line);
    } else {
      // IPv4 CIDR
      ipv4.push(line);
    }
  });

  let output = [];
  if (ipv4.length > 0) {
    output.push("ip_cidr_set:");
    ipv4.forEach((c) => output.push("  - " + c));
  }
  if (ipv6.length > 0) {
    output.push("ip_cidr6_set:");
    ipv6.forEach((c) => output.push('  - "' + c + '"'));
  }
  $done({ body: output.join("\n") });
} else {
  // ===== geosite/*.list → domain 规则 =====
  // 格式：一行一个域名简写，如 +.google.com / .google.com / *.google.com / google.com

  let domain_set = [];
  let domain_suffix_set = [];
  let domain_wildcard_set = [];
  let domain_keyword_set = [];
  let domain_regex_set = [];

  lines.forEach((line) => {
    line = line.trim();

    // 处理完整 Clash DOMAIN-* 格式
    if (line.startsWith("DOMAIN-SUFFIX,")) {
      domain_suffix_set.push(line.substring(14));
    } else if (line.startsWith("DOMAIN-KEYWORD,")) {
      domain_keyword_set.push(line.substring(15));
    } else if (line.startsWith("DOMAIN,")) {
      domain_set.push(line.substring(7));
    } else if (line.startsWith("DOMAIN-WILDCARD,")) {
      let d = line.substring(16);
      // Egern 的 Glob * 可以匹配任意字符含点号
      domain_wildcard_set.push(d);

      // 处理 Mihomo 简写格式
    } else if (line.startsWith("+.")) {
      // +.google.com → 后缀匹配（含根域 google.com 本身）
      domain_suffix_set.push(line.substring(2));
    } else if (line.startsWith(".")) {
      // .google.com → 子域匹配（不含根域）
      // Egern: *.google.com → Glob 匹配多级子域
      domain_wildcard_set.push("*" + line);
    } else if (line.startsWith("*.")) {
      // *.google.com → 单级通配符（只匹配一级子域）
      // 方案 A（推荐，实际够用）：转 suffix_set，多匹配了根域但影响很小
      domain_suffix_set.push(line.substring(2));
      // 方案 B（完全精确）：转 regex_set
      // let d = line.substring(2).replace(/\./g, '\\.');
      // domain_regex_set.push(`^[^.]+\\.${d}$`);
    } else if (line.startsWith("*")) {
      // * → 通配符，按 Mihomo 规则仅匹配 localhost 这种无点域名
      // 但 Egern 的 Glob * 匹配任意，所以原样输出到 wildcard
      domain_wildcard_set.push(line);
    } else if (line.includes("*")) {
      // 域名中含通配符，如 google.* 或 *.google.*
      domain_wildcard_set.push(line);
    } else if (line.includes("/")) {
      // 包含 / 的可能是 CLASSICAL 格式，跳过
      // 或 URL 正则，跳过
    } else {
      // 纯域名 → 精确匹配
      domain_set.push(line);
    }
  });

  // 组装输出
  let output = [];

  if (domain_set.length > 0) {
    output.push("domain_set:");
    domain_set.forEach((d) => output.push("  - " + d));
  }
  if (domain_keyword_set.length > 0) {
    output.push("domain_keyword_set:");
    domain_keyword_set.forEach((d) => output.push("  - " + d));
  }
  if (domain_suffix_set.length > 0) {
    output.push("domain_suffix_set:");
    domain_suffix_set.forEach((d) => output.push("  - " + d));
  }
  if (domain_regex_set.length > 0) {
    output.push("domain_regex_set:");
    domain_regex_set.forEach((d) => output.push('  - "' + d + '"'));
  }
  if (domain_wildcard_set.length > 0) {
    output.push("domain_wildcard_set:");
    domain_wildcard_set.forEach((d) => output.push('  - "' + d + '"'));
  }

  $done({ body: output.join("\n") });
}
