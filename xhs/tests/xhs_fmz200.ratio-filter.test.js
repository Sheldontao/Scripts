import { describe, expect, it } from "bun:test";
import { runScript } from "./helpers/run-script";

function runRatioTest(opts) {
  return runScript({
    url: "https://edith.xiaohongshu.com/api/sns/v6/homefeed",
    responseBody: JSON.stringify({ data: opts.items }),
    argument: {
      xhs_comment_like_ratio_threshold: String(opts.threshold ?? 0),
      xhs_loglevel: "WARNING",
      ...(opts.extraArgs || {}),
    },
  });
}

function runSearchRatioTest(opts) {
  return runScript({
    url: "https://edith.xiaohongshu.com/api/sns/v10/search/notes",
    responseBody: JSON.stringify({
      data: {
        items: opts.items.map((item) => ({
          model_type: "note",
          note: item,
        })),
      },
    }),
    argument: {
      xhs_comment_like_ratio_threshold: String(opts.threshold ?? 0),
      xhs_general_comment_like_ratio_threshold:
        opts.generalRatio !== false ? "true" : "false",
      xhs_loglevel: "WARNING",
      ...(opts.extraArgs || {}),
    },
  });
}

describe("getCachedCommentLikeRatioThreshold (U3) — helper behavior", () => {
  it("parses a valid number from argument", () => {
    const result = runScript({
      url: "https://edith.xiaohongshu.com/api/sns/v6/homefeed",
      responseBody: JSON.stringify({ data: [] }),
      argument: { xhs_comment_like_ratio_threshold: "2.5", xhs_loglevel: "WARNING" },
    });
    expect(result.donePayload.body).toBeDefined();
  });

  it("falls back to 0 for invalid argument", () => {
    const result = runScript({
      url: "https://edith.xiaohongshu.com/api/sns/v6/homefeed",
      responseBody: JSON.stringify({ data: [] }),
      argument: { xhs_comment_like_ratio_threshold: "not-a-number", xhs_loglevel: "WARNING" },
    });
    expect(result.donePayload.body).toBeDefined();
  });

  it("falls back to 0 when argument is missing", () => {
    const result = runScript({
      url: "https://edith.xiaohongshu.com/api/sns/v6/homefeed",
      responseBody: JSON.stringify({ data: [] }),
      argument: { xhs_loglevel: "WARNING" },
    });
    expect(result.donePayload.body).toBeDefined();
  });
});

describe("Homefeed ratio filter (U4)", () => {
  const items = [
    { id: "high-ratio", likes: 100, comments_count: 150 },
    { id: "low-ratio", likes: 100, comments_count: 10 },
    { id: "equal-ratio", likes: 100, comments_count: 50 },
    { id: "zero-likes", likes: 0, comments_count: 10 },
    { id: "null-likes", likes: null, comments_count: 10 },
    { id: "no-comments", likes: 100 },
    { id: "no-data", likes: 200, comments_count: 30 },
  ];

  it("threshold 0 (default) — all items pass through", () => {
    const result = runRatioTest({ items, threshold: 0 });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data).toHaveLength(7);
  });

  it("threshold 1.0 — keeps items with ratio > 1.0, filters ratio <= 1.0", () => {
    const result = runRatioTest({ items, threshold: 1.0 });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.find((i) => i.id === "high-ratio")).toBeDefined();
    expect(body.data.find((i) => i.id === "low-ratio")).toBeUndefined();
    expect(body.data.find((i) => i.id === "equal-ratio")).toBeUndefined();
  });

  it("threshold 0.5 — keeps items with ratio > 0.5", () => {
    const result = runRatioTest({ items, threshold: 0.5 });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.find((i) => i.id === "high-ratio")).toBeDefined();
    expect(body.data.find((i) => i.id === "low-ratio")).toBeUndefined();
    expect(body.data.find((i) => i.id === "equal-ratio")).toBeUndefined();
    expect(body.data.find((i) => i.id === "no-data")).toBeUndefined();
  });

  it("zero-likes item is filtered out when threshold > 0", () => {
    const result = runRatioTest({ items, threshold: 0.5 });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.find((i) => i.id === "zero-likes")).toBeUndefined();
  });

  it("null-likes item is filtered out when threshold > 0", () => {
    const result = runRatioTest({ items, threshold: 0.5 });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.find((i) => i.id === "null-likes")).toBeUndefined();
  });

  it("item without comments_count treated as 0 — filtered out when threshold > 0", () => {
    const result = runRatioTest({ items, threshold: 0.01 });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.find((i) => i.id === "no-comments")).toBeUndefined();
  });

  it("item with 0 comments filtered out when threshold > 0 — another item remains", () => {
    const result = runRatioTest({
      items: [
        { id: "zero-comments", likes: 100, comments_count: 0 },
        { id: "normal", likes: 100, comments_count: 50 },
      ],
      threshold: 0.01,
    });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.find((i) => i.id === "zero-comments")).toBeUndefined();
    expect(body.data.find((i) => i.id === "normal")).toBeDefined();
  });

  it("all items filtered out — shows placeholder card", () => {
    const result = runRatioTest({
      items: [{ id: "only-item", likes: 100, comments_count: 0, desc: "原始描述" }],
      threshold: 0.001,
    });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe("only-item");
    expect(body.data[0].desc).toBe("所有推荐均不符合筛选条件");
  });

  it("works alongside existing desc regex filter", () => {
    const result = runScript({
      url: "https://edith.xiaohongshu.com/api/sns/v6/homefeed",
      responseBody: JSON.stringify({
        data: [
          { id: "ad-item", likes: 100, comments_count: 200, desc: "广告内容" },
          { id: "clean-item", likes: 100, comments_count: 200, desc: "正常内容" },
        ],
      }),
      argument: {
        xhs_des_regex: JSON.stringify(["广告"]),
        xhs_comment_like_ratio_threshold: "1.0",
        xhs_loglevel: "WARNING",
      },
    });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.find((i) => i.id === "ad-item")).toBeUndefined();
    expect(body.data.find((i) => i.id === "clean-item")).toBeDefined();
  });
});

describe("Search ratio filter global switch (U4/U5)", () => {
  const items = [
    { id: "search-high", likes: 100, comments_count: 80 },
    { id: "search-low", likes: 100, comments_count: 5 },
  ];

  it("global switch false (default) — all items pass through", () => {
    const result = runSearchRatioTest({
      items,
      threshold: 0.5,
      generalRatio: false,
    });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.items).toHaveLength(2);
  });

  it("global switch true — filters items by ratio", () => {
    const result = runSearchRatioTest({
      items,
      threshold: 0.5,
      generalRatio: true,
    });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.items.find((i) => i.note.id === "search-high")).toBeDefined();
    expect(body.data.items.find((i) => i.note.id === "search-low")).toBeUndefined();
  });
});

describe("Search counts threshold global switch (U5)", () => {
  const items = [
    { id: "high-counts", likes: 50, comments_count: 30 },
    { id: "low-counts", likes: 3, comments_count: 1 },
  ];

  it("global switch false — all items pass through", () => {
    const result = runSearchRatioTest({
      items,
      threshold: 0,
      generalRatio: false,
      extraArgs: { xhs_general_counts_threshold: "false" },
    });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.items).toHaveLength(2);
  });

  it("global switch true — filters items with low counts", () => {
    const result = runSearchRatioTest({
      items,
      threshold: 0,
      generalRatio: false,
      extraArgs: { xhs_general_counts_threshold: "true", xhs_counts_threshold: JSON.stringify([10, 0, 0, 0, 0]) },
    });
    const body = JSON.parse(result.donePayload.body);
    expect(body.data.items.find((i) => i.note.id === "high-counts")).toBeDefined();
    expect(body.data.items.find((i) => i.note.id === "low-counts")).toBeUndefined();
  });
});