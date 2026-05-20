let body = $response.body;

// 1. 去掉注释和空行
let lines = body.split("\n").filter((line) => {
  const trimmed = line.trim();
  return trimmed && !trimmed.startsWith("#");
});

// 2. 转换成 Egern rule_set 格式（Surge DOMAIN-SET 兼容格式）
let result = [];
lines.forEach((line) => {
  line = line.trim();

  if (line.startsWith("+.")) {
    // +.google.com → .google.com (Egern 用 .前缀 表示 suffix)
    result.push("." + line.substring(2));
  } else if (line.startsWith("*.")) {
    // *.google.com → .google.com (Clash 一级wildcard 转为 suffix)
    // 注意：这会有轻微语义差异（多匹配了更深层级），但在实际使用中可接受
    result.push("." + line.substring(2));
  } else if (line.startsWith(".")) {
    // .google.com → .google.com (保持不变)
    result.push(line);
  } else if (line.startsWith("DOMAIN-SUFFIX,")) {
    // DOMAIN-SUFFIX,google.com → .google.com
    result.push("." + line.substring(14));
  } else if (line.startsWith("DOMAIN,")) {
    // DOMAIN,google.com → google.com (精确匹配)
    result.push(line.substring(7));
  } else if (line.startsWith("DOMAIN-KEYWORD,")) {
    // DOMAIN-KEYWORD,google → keyword:google
    result.push("keyword:" + line.substring(15));
  } else {
    // 普通域名，精确匹配
    result.push(line);
  }
});

$done({ body: result.join("\n") });
