---
date: 2026-04-18
topic: user-defined-rules-for-unsupported-urls
---

# User-Defined Rules for Unsupported URLs

## Problem Frame

当前扩展只能按内置规则清洗链接。遇到未支持站点（例如 `h5.m.goofish.com/item?...`）时，用户无法指定保留参数，也无法把一次性决策沉淀为长期可复用规则，导致清洗结果不可控、重复操作成本高。

本文统一使用"未命中规则 URL"指代：当前没有任何内置或用户规则可命中的 URL。

## Requirements

**Unknown URL Handling**

- R1. 当检测到 URL 未命中任何规则时，系统必须明确提示"无可用规则"，且默认不静默删除全部参数。
- R2. 用户可基于该 URL 的查询参数列表选择"需要保留的参数"，并在同一操作流内看到清洗结果预览。
- R3. 用户可将本次选择保存为新规则；后续同一 `host + path` 的 URL 自动复用该规则。

**Rule Matching and Priority**

- R4. 用户自定义规则按 `host + path` 粒度匹配（例如 `h5.m.goofish.com/item`），避免误作用于同域下其他页面。
- R5. 当同一 URL 可被多条规则匹配时，优先级固定为：用户规则优先于内置规则；同一层内按更具体匹配优先（更长 path 优先）；若仍冲突，按最近更新规则优先。
- R6. 内置规则继续可用；对现有已支持站点，除非命中更高优先级的用户规则，否则清洗结果与当前版本保持一致。

**Rule Management Entry**

- R7. 提供单独的"规则入口"，允许用户查看、修改、删除、增减自定义规则。
- R8. 规则管理界面应能展示每条规则的匹配目标（host+path）与参数白名单，降低误改风险。
- R9. 用户修改或删除规则后，下一次清洗应立即按新规则生效。
- R11. 自定义规则必须本地持久化，重启 Raycast 后仍可用。
- R12. 当用户为同一 `host + path` 再次保存规则时，默认覆盖旧规则并立即生效。

**Batch Cleaning Behavior**

- R10. 当同一段文本包含多个 URL 时，已支持 URL 继续清洗；未命中规则 URL 保留原样并统一提示可新增规则，不整体中断。

## Success Criteria

- 用户在首次遇到未支持链接时，可在同一操作流中完成"选择参数 + 保存规则"。
- 对同一 `host + path` 的后续链接，清洗结果符合用户已保存规则，无需重复配置。
- 多 URL 文本处理时，未支持链接不会破坏已支持链接的清洗结果。
- 规则管理入口可完成增删改查，且变更对下一次清洗立即生效。

## Scope Boundaries

- 不在本次范围内：自动猜测"最佳参数"并替用户自动建规则。
- 不在本次范围内：跨设备或跨账号的规则云同步。
- 不在本次范围内：将规则设计为通配符 DSL 或复杂表达式系统。

## Key Decisions

- 按 `host + path` 匹配：在覆盖率与准确性之间平衡，优先降低误清洗风险。
- 多 URL 场景"部分成功"：优先保证主流程可用性，避免单个未知链接阻断整体结果。
- 增加独立规则入口：让规则可维护，避免只在异常流程中被动创建。
- 冲突优先级采用"用户优先 + 更具体优先 + 最近更新优先"：确保结果稳定且便于解释。
- 重复保存同一 `host + path` 默认覆盖：减少歧义与维护成本。

## Dependencies / Assumptions

- 假设现有清洗入口（选中文本、剪贴板）继续作为主入口，新增能力在其基础上扩展。

## Outstanding Questions

### Resolve Before Planning

- 无。

### Deferred to Planning

- [Affects R2, R7][Technical] 参数选择与规则管理的具体交互载体（命令形态与流程编排）由 planning 结合 Raycast 交互能力确定。
- [Affects R4, R5][Technical] `host + path` 规范化细则（如尾斜杠、大小写、异常 URL 解析失败处理）由 planning 定义。

## Next Steps

-> /ce:plan for structured implementation planning
