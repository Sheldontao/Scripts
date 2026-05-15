export default async function (ctx) {
  // 请求基础汇率数据
  const apiUrl = "https://api.exchangerate-api.com/v4/latest/USD";
  // 1. 统一 UI 规范颜色
  const C = {
    bg: { light: "#FFFFFF", dark: "#121212" }, // 背景色
    text: { light: "#1C1C1E", dark: "#FFFFFF" }, // 主文字颜色
    dim: { light: "#8E8E93", dark: "#8E8E93" }, // 次要文字/更新时间颜色
    line: { light: "#34C759", dark: "#30D158" }, // 汇率数字颜色（绿色）
  };
  let rates = {};
  let isError = false;

  try {
    const resp = await ctx.http.get(apiUrl, { timeout: 5000 });
    const data = await resp.json();
    const cny = data.rates.CNY;

    rates = {
      USD: cny.toFixed(2),
      EUR: (cny / data.rates.EUR).toFixed(2),
      GBP: (cny / data.rates.GBP).toFixed(2),
      JPY: ((cny / data.rates.JPY) * 100).toFixed(2),
      HKD: (cny / data.rates.HKD).toFixed(2),
      KRW: ((cny / data.rates.KRW) * 1000).toFixed(2),
    };
  } catch (e) {
    isError = true;
  }

  const family = ctx.widgetFamily || "systemSmall";

  // ====== 锁屏小组件逻辑 ======
  if (family === "accessoryInline") {
    return {
      type: "widget",
      children: [
        {
          type: "text",
          text: isError
            ? "获取失败"
            : `🇺🇸${rates.USD} 🇪🇺${rates.EUR} 🇯🇵${rates.JPY}`,
        },
      ],
    };
  }
  if (family === "accessoryRectangular") {
    if (isError)
      return {
        type: "widget",
        children: [{ type: "text", text: "网络请求失败" }],
      };
    return {
      type: "widget",
      gap: 4,
      children: [
        {
          type: "text",
          text: `🇺🇸 USD: ${rates.USD}`,
          font: { size: "headline", weight: "bold" },
        },
        {
          type: "text",
          text: `🇪🇺 EUR: ${rates.EUR}`,
          font: { size: "headline", weight: "bold" },
        },
        {
          type: "text",
          text: `🇯🇵 JPY: ${rates.JPY}`,
          font: { size: "headline", weight: "bold" },
        },
      ],
    };
  }
  if (family === "accessoryCircular") {
    if (isError)
      return { type: "widget", children: [{ type: "text", text: "Error" }] };
    return {
      type: "widget",
      children: [
        {
          type: "stack",
          direction: "column",
          alignItems: "center",
          gap: 2,
          children: [
            {
              type: "image",
              src: "sf-symbol:dollarsign.circle",
              width: 18,
              height: 18,
            },
            {
              type: "text",
              text: rates.USD,
              font: { size: "caption1", weight: "bold" },
            },
          ],
        },
      ],
    };
  }

  // ====== 主屏幕小组件 ======
  const isSmall = family === "systemSmall";
  const isMedium = family === "systemMedium";
  const isLarge = family === "systemLarge" || family === "systemExtraLarge";

  // 动态间距和内边距配置
  const rowSpacing = isLarge ? 24 : isSmall ? 4 : 8;
  const titleSpacing = isLarge ? 28 : isSmall ? 8 : 12;
  const paddingVal = isLarge ? 24 : 16;
  const titleText = isSmall ? "汇率 (CNY)" : "汇率看板 (CNY)";

  const contentChildren = [];

  if (!isError) {
    const list = [
      { name: "🇺🇸 USD", rate: rates.USD },
      { name: "🇪🇺 EUR", rate: rates.EUR },
      { name: "🇬🇧 GBP", rate: rates.GBP },
      { name: "🇭🇰 HKD", rate: rates.HKD },
      { name: "🇯🇵 JPY(100)", rate: rates.JPY },
      { name: "🇰🇷 KRW(1000)", rate: rates.KRW },
    ];

    if (isMedium) {
      // --- 中号尺寸：左右双列排版逻辑 ---
      const leftColChildren = [];
      const rightColChildren = [];

      // 左列放前3个，右列放后3个
      const leftList = list.slice(0, 3);
      const rightList = list.slice(3, 6);

      const buildColItem = (item) => ({
        type: "stack",
        direction: "row",
        alignItems: "center",
        children: [
          {
            type: "text",
            text: item.name,
            font: { size: "subheadline", weight: "medium" },
            textColor: C.text,
            flex: 1,
          },
          {
            type: "text",
            text: item.rate,
            font: { size: "subheadline", weight: "bold" },
            textColor: C.line,
          },
        ],
      });

      leftList.forEach((item, index) => {
        leftColChildren.push(buildColItem(item));
        if (index < leftList.length - 1)
          leftColChildren.push({ type: "spacer", length: rowSpacing });
      });

      rightList.forEach((item, index) => {
        rightColChildren.push(buildColItem(item));
        if (index < rightList.length - 1)
          rightColChildren.push({ type: "spacer", length: rowSpacing });
      });

      // 将左右两列放入一个横向并排的 Stack 中，中间用一个 spacer 隔开
      contentChildren.push({
        type: "stack",
        direction: "row",
        alignItems: "start",
        children: [
          {
            type: "stack",
            direction: "column",
            children: leftColChildren,
            flex: 1,
          },
          { type: "spacer", length: 24 }, // 左右两列的列间距
          {
            type: "stack",
            direction: "column",
            children: rightColChildren,
            flex: 1,
          },
        ],
      });
    } else {
      // --- 小号和大号：保持单列排版逻辑 ---
      list.forEach((item, index) => {
        contentChildren.push({
          type: "stack",
          direction: "row",
          alignItems: "center",
          children: [
            {
              type: "text",
              text: item.name,
              font: {
                size: isSmall ? "footnote" : "subheadline",
                weight: "medium",
              },
              textColor: C.text,
              flex: 1,
            },
            {
              type: "text",
              text: item.rate,
              font: {
                size: isSmall ? "footnote" : "subheadline",
                weight: "bold",
              },
              textColor: C.line,
            },
          ],
        });
        if (index < list.length - 1)
          contentChildren.push({ type: "spacer", length: rowSpacing });
      });
    }
  } else {
    contentChildren.push({
      type: "text",
      text: "网络请求失败",
      textColor: "#FF3B30",
      font: { size: "subheadline" },
    });
  }

  // 构建最终配置
  return {
    type: "widget",
    backgroundColor: C.bg,
    padding: paddingVal,
    gap: 0,
    children: [
      // 标题行
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 6,
        children: [
          {
            type: "image",
            src: "sf-symbol:banknote.fill",
            color: C.text,
            width: 16,
            height: 16,
          },
          {
            type: "text",
            text: titleText,
            font: { size: "headline", weight: "bold" },
            textColor: C.text,
          },
        ],
      },
      { type: "spacer", length: titleSpacing },

      // 汇率内容区 (单列或双列)
      ...contentChildren,

      { type: "spacer" },

      // 底部时间区
      {
        type: "stack",
        direction: "row",
        alignItems: "center",
        gap: 4,
        children: [
          {
            type: "text",
            text: "更新于",
            font: { size: "caption2" },
            textColor: C.dim,
          },
          {
            type: "date",
            date: new Date().toISOString(),
            format: "time",
            font: { size: "caption2" },
            textColor: C.text,
          },
        ],
      },
    ],
  };
}
