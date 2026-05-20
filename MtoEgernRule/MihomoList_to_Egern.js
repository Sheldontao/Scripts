// Mihomo .list → Egern rule_set 转换器
// 支持 geosite（域名规则）和 geoip（IP CIDR 规则）

export default async function (ctx) {
  const body = await ctx.response.text();
  const url = ctx.request.url;

  let lines = body.split("\n").filter((line) => {
    const t = line.trim();
    return t && !t.startsWith("#") && !t.startsWith("//");
  });

  // ===== geoip/*.list → ip_cidr_set / ip_cidr6_set =====
  if (url.includes("/geoip/")) {
    let ipv4 = [];
    let ipv6 = [];

    lines.forEach((line) => {
      line = line.trim();
      // 去掉可能的 YAML 列表前缀和引号
      if (line.startsWith("- ")) line = line.substring(2);
      line = line.replace(/^['"]|['"]$/g, "");
      line = line.trim();
      if (!line) return;

      if (line.includes(":")) {
        ipv6.push(line); // IPv6 CIDR
      } else {
        ipv4.push(line); // IPv4 CIDR
      }
    });

    let output = [];
    output.push("no_resolve: true");
    if (ipv4.length > 0) {
      output.push("ip_cidr_set:");
      ipv4.forEach((c) => output.push("  - " + c));
    }
    if (ipv6.length > 0) {
      output.push("ip_cidr6_set:");
      ipv6.forEach((c) => output.push('  - "' + c + '"'));
    }
    return { body: output.join("\n") };

    // ===== geosite/*.list → domain 规则 =====
  } else {
    let domain_set = [];
    let domain_suffix_set = [];
    let domain_wildcard_set = [];
    let domain_keyword_set = [];

    lines.forEach((line) => {
      line = line.trim();

      // 完整 Clash 格式
      if (line.startsWith("DOMAIN-SUFFIX,")) {
        domain_suffix_set.push(line.substring(14));
      } else if (line.startsWith("DOMAIN-KEYWORD,")) {
        domain_keyword_set.push(line.substring(15));
      } else if (line.startsWith("DOMAIN,")) {
        domain_set.push(line.substring(7));
      } else if (line.startsWith("DOMAIN-WILDCARD,")) {
        domain_wildcard_set.push(line.substring(16));

        // Mihomo 简写格式
      } else if (line.startsWith("+.")) {
        // +.google.com → 后缀匹配（含根域）
        domain_suffix_set.push(line.substring(2));
      } else if (line.startsWith(".")) {
        // .google.com → 子域匹配（不含根域）
        // Egern: *.google.com（Glob * 可匹配点号）
        domain_wildcard_set.push("*" + line);
      } else if (line.startsWith("*.")) {
        // *.google.com → 单级通配符
        // 实际推荐转 suffix_set（多匹配根域，影响极小）
        domain_suffix_set.push(line.substring(2));
      } else if (line.includes("*")) {
        // 含通配符的域名
        domain_wildcard_set.push(line);
      } else if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(line)) {
        // 纯域名 → 精确匹配
        domain_set.push(line);
      }
    });

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
    if (domain_wildcard_set.length > 0) {
      output.push("domain_wildcard_set:");
      domain_wildcard_set.forEach((d) => output.push('  - "' + d + '"'));
    }

    return { body: output.join("\n") };
  }
}
