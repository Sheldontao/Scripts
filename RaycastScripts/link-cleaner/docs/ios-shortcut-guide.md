# Link Cleaner — iOS Shortcut 构建指南

> 基于 Raycast extension [Link Cleaner](https://github.com/MisakiCoca/link-cleaner) 的逻辑移植。
> 纯 Shortcuts 原生 action 实现，无需额外 App。

## 架构

```
iCloud Drive/
└── Link Cleaner/
    ├── rules.json          ← 规则数据（动态读写）
    └── page.html           ← 用于 Run JavaScript 的空白页面
```

两个 Shortcut：

| Shortcut | 功能 |
|---|---|
| **Clean Link** | 主命令：读取剪贴板 → 清理 URL → 写回剪贴板 |
| **Link Cleaner - Manage Rules** | 辅助：增删改规则（写入 rules.json） |

---

## 一、初始化文件

### 1. 创建 rules.json

在 iOS **文件 App** → iCloud Drive → 新建文件夹 `Link Cleaner` → 新建文本文件 `rules.json`，内容：

```json
[
  {
    "host": "google.com",
    "allowParams": ["q", "ie"]
  },
  {
    "host": "baidu.com",
    "allowParams": ["wd", "ie"]
  },
  {
    "host": "bing.com",
    "allowParams": ["q"]
  },
  {
    "host": "music.163.com",
    "allowParams": ["id"]
  },
  {
    "host": "youtube.com",
    "allowParams": ["v", "search_query"]
  },
  {
    "host": "instagram.com",
    "path": "/reel",
    "allowParams": []
  }
]
```

### 2. 创建 page.html

在同一个 `Link Cleaner` 文件夹下创建 `page.html`，内容随意，仅需一个合法 HTML：

```html
<!DOCTYPE html><html><body></body></html>
```

---

## 二、构建主 Shortcut："Clean Link"

### 概述

```
获取剪贴板 → 读取规则 → 正则提取 URL → 循环处理每个 URL
→ 匹配 host → 过滤 query → 替换原文 → 设定剪贴板
```

### 分步构建

#### 第 1 步：获取输入

| Action | 参数 |
|---|---|
| **获取剪贴板** | — |
| **如果** | 剪贴板为空 → 显示"没有内容"，退出 |

#### 第 2 步：读取规则

| Action | 参数 |
|---|---|
| **获取文件** | 路径：`Link Cleaner/rules.json` (iCloud Drive) |
| **获取文件** | 路径：`Link Cleaner/page.html` (iCloud Drive) |

#### 第 3 步：提取 URL

| Action | 参数 |
|---|---|
| **匹配文本** | 输入：剪贴板内容<br>正则：`https?://[^\s]+` |
| **如果** | 匹配结果为空 → 显示"未找到 URL"，退出 |

#### 第 4 步：处理每个 URL

使用 **"重复每一项"** 遍历匹配到的 URL：

对每个 URL：

| # | Action | 参数/说明 |
|---|---|---|
| 4.1 | **URL 编码** | 输入：当前 URL<br>编码：`urldecode`（防止双重编码） |
| 4.2 | **获取 URL 组件** | 获取 `host`、`path`、`query` |
| 4.3 | **URL 主机名** | 获取 `hostname`（不含端口） |
| 4.4 | **获取 URL 组件** | 获取 `query` 字符串 |
| 4.5 | **计算** | 名称：`hostLower`<br>值：主机名转为小写 |

> **匹配规则：**
> 对 rules.json 中每条规则，检查：
> - 如果 `hostLower` 等于 `rule.host` **或** 以 `.rule.host` 结尾，则匹配
> - 如果规则有 `path`，还需检查 path 是否以该路径开头

由于 Shortcuts 的 **"重复每一项"** 不能嵌套遍历字典，这里需要用 **"Run JavaScript on Web Page"** 来执行匹配+过滤逻辑。

或者在 Shortcuts 中展开写——为每个预置规则创建条件分支（但那样就不动态了）。

#### 推荐方案：使用"在网页上运行 JavaScript"

直接用 JavaScript 处理全部逻辑。这才是真正动态的。

在 `page.html` 对应的 **"在网页上运行 JavaScript"** action 中，传入两个参数：

1. `clipboardText` — 剪贴板原文
2. `rulesJson` — rules.json 的内容

JavaScript 代码如下：

```javascript
const text = clipboardText;
const rules = JSON.parse(rulesJson);

function findURLs(text) {
  const regex = /(https?:\/\/[^\s]+)/g;
  return text.match(regex) || [];
}

function replaceURLs(text, newURLs) {
  let cursor = 0;
  return text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
    return newURLs[cursor++] || match;
  });
}

function removeQueryParams(url, allowParams) {
  const parts = url.split('?');
  if (parts.length < 2) return url;
  const query = parts[1].split('&');
  if (allowParams.length > 0) {
    const filtered = query.filter(p => allowParams.includes(p.split('=')[0]));
    if (filtered.length === 0) return parts[0];
    return parts[0] + '?' + filtered.join('&');
  }
  return parts[0];
}

function hostMatch(host, ruleHost) {
  const h = host.toLowerCase();
  const r = ruleHost.toLowerCase();
  return h === r || h.endsWith('.' + r);
}

function pathMatch(path, rulePath) {
  if (!rulePath || rulePath === '/') return true;
  return path === rulePath || path.startsWith(rulePath + '/');
}

const urls = findURLs(text);
const cleaned = urls.map(url => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/$/, '') || '/';
    for (const rule of rules) {
      if (hostMatch(host, rule.host) && pathMatch(path, rule.path)) {
        return removeQueryParams(url, rule.allowParams);
      }
    }
    return url;
  } catch {
    return url;
  }
});

const result = replaceURLs(text, cleaned);

// 返回给 Shortcuts
return result;
```

#### 第 5 步：写回剪贴板

| Action | 参数 |
|---|---|
| **设定剪贴板** | 输入：JavaScript 返回的结果 |
| **显示通知** | 标题："已移除追踪参数" |

---

## 三、构建规则管理 Shortcut："Link Cleaner - Manage Rules"

两个版本：

### 精简版（快速添加规则）

| Action | 参数 |
|---|---|
| **要求输入** | 提示："Host（如 example.com）" |
| **要求输入** | 提示："允许的参数（逗号分隔，如 q,ie）" |
| **要求输入** | 提示："路径（可选，默认 /）"<br>默认值：`/` |
| **获取文件** | iCloud Drive `Link Cleaner/rules.json` |
| **在网页上运行 JavaScript** | 参数：`existingRules`（文件内容） |

```javascript
const rules = JSON.parse(existingRules);
rules.push({
  host: host.trim().toLowerCase(),
  path: path || '/',
  allowParams: params.split(',').map(p => p.trim()).filter(Boolean)
});
return JSON.stringify(rules, null, 2);
```

| Action | 参数 |
|---|---|
| **存储文件** | 输入：JS 返回结果<br>路径：`Link Cleaner/rules.json`<br>覆盖：是 |
| **显示通知** | 标题："规则已添加" |

### 完整版（列出 + 删除）

由于 Shortcuts 没有原生列表 UI，完整 CRUD 会比较复杂。建议用 **Scriptable** App 来实现规则管理界面（如果需要）。

---

## 四、使用方式

1. 复制任意包含 URL 的文本
2. 运行 **"Clean Link"** Shortcut
3. 通知弹出 → 剪贴板已更新为清理后的文本
4. 直接粘贴即可

管理规则：运行 **"Link Cleaner - Manage Rules"** → 输入 host 和允许的参数 → 自动追加到 rules.json

---

## 五、局限 & 对比 Raycast 版本

| 功能 | Raycast | iOS Shortcuts |
|---|---|---|
| 内置规则 | ✅ | ✅ (JSON) |
| 动态用户规则 | ✅ (LocalStorage UI) | ✅ (JSON 文件) |
| 图形化规则编辑 | ✅ (Form UI) | ❌ (手动输入) |
| 选中文本清理 | ✅ | ❌ (仅剪贴板) |
| 未匹配 URL 交互式创建规则 | ✅ | ❌ |
| 退出后自动清理 | ✅ | ❌ |

如果需要完整的 CRUD 界面管理规则，建议配合 **Scriptable** App 使用（免费），可以获得接近 Raycast 的交互体验。