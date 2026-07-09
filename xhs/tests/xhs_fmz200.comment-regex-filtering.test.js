import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { runScript } from "./helpers/run-script";

function loadFixture(name) {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url)),
  );
}

const surgeContext = { $httpClient: {}, $loon: undefined };

function runSurgeScript(opts) {
  return runScript({ ...opts, contextExtensions: { ...surgeContext, ...opts.contextExtensions } });
}

function parseBody(payload) {
  return JSON.parse(payload.body);
}

const defaultRegexArg = JSON.stringify({
  author_comment_regex: ["^私$"],
  general_comment_regex: ["神经病"],
});

describe("getCachedCommentRegex (U1) — helper behavior", () => {
  it("returns regex pairs that match content correctly", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: { comments: [{ id: "c1", content: "私", show_tags_v2: [{ type: "is_author" }], sub_comments: [] }] },
      }),
      argument: { xhs_comment_regex: defaultRegexArg, xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(1);
    expect(body.data.comments[0].content).toBe("命中xhs_comment_regex:^私$");
  });

  it("handles missing argument gracefully — no filtering applied", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: { comments: [{ id: "c1", content: "私", show_tags_v2: [{ type: "is_author" }], sub_comments: [] }] },
      }),
      argument: { xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(1);
    expect(body.data.comments[0].content).toBe("私");
  });

  it("handles invalid JSON argument gracefully", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: { comments: [{ id: "c1", content: "私", show_tags_v2: [{ type: "is_author" }], sub_comments: [] }] },
      }),
      argument: { xhs_comment_regex: "not valid json", xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(1);
    expect(body.data.comments[0].content).toBe("私");
  });

  it("handles invalid regex strings gracefully", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: { comments: [{ id: "c1", content: "[", show_tags_v2: [{ type: "is_author" }], sub_comments: [] }] },
      }),
      argument: {
        xhs_comment_regex: JSON.stringify({
          author_comment_regex: ["["],
          general_comment_regex: [],
        }),
        xhs_loglevel: "ERROR",
      },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(1);
  });
});

describe("Comment filtering (U2) — author_comment_regex", () => {
  it("AE1: author comment matching author_comment_regex preserves and marks all matched comments", () => {
    const fixture = loadFixture("comment-list-filterable");
    const result = runSurgeScript({
      url: fixture.url,
      responseBody: JSON.stringify(fixture.responseBody),
      argument: { xhs_comment_regex: defaultRegexArg, xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(4);
    const authorMatch = body.data.comments.find(c => c.id === "author-comment-1");
    expect(authorMatch.content).toBe("命中xhs_comment_regex:^私$");
    expect(authorMatch.sub_comments).toBeUndefined();
    const generalMatch = body.data.comments.find(c => c.id === "general-comment-1");
    expect(generalMatch.content).toBe("命中xhs_comment_regex:神经病");
    const clean = body.data.comments.find(c => c.id === "clean-comment-1");
    expect(clean.content).toBe("正常评论内容");
    const parentWithSub = body.data.comments.find(c => c.id === "author-sub-comment");
    expect(parentWithSub.content).toBe("正常评论");
    expect(parentWithSub.sub_comments[0].content).toBe("命中xhs_comment_regex:^私$");
  });

  it("author sub-comment matching author_comment_regex preserves both comments, marks the sub-comment", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            {
              id: "c1", content: "正常评论",
              show_tags_v2: [],
              sub_comments: [
                { id: "s1", content: "author-only-content", show_tags_v2: [{ type: "is_author" }] },
              ],
            },
            { id: "c2", content: "其他评论", show_tags_v2: [], sub_comments: [] },
          ],
        },
      }),
      argument: {
        xhs_comment_regex: JSON.stringify({
          author_comment_regex: ["author-only-content"],
          general_comment_regex: [],
        }),
        xhs_loglevel: "WARNING",
      },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(2);
    const c1 = body.data.comments.find(c => c.id === "c1");
    expect(c1.content).toBe("正常评论");
    expect(c1.sub_comments[0].content).toBe("命中xhs_comment_regex:author-only-content");
    expect(body.data.comments.find(c => c.id === "c2").content).toBe("其他评论");
  });

  it("author_comment_regex matches sub_comments endpoint — preserves all, marks matched", () => {
    const fixture = loadFixture("sub-comments-filterable");
    const result = runSurgeScript({
      url: fixture.url,
      responseBody: JSON.stringify(fixture.responseBody),
      argument: { xhs_comment_regex: defaultRegexArg, xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(3);
    const matched = body.data.comments.find(c => c.content.includes("命中xhs_comment_regex:"));
    expect(matched).toBeDefined();
  });
});

describe("Comment filtering (U2) — general_comment_regex", () => {
  it("AE2: non-author comment matching general_comment_regex is preserved and marked", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            { id: "c1", content: "正常内容", show_tags_v2: [], sub_comments: [] },
            { id: "c2", content: "神经病", show_tags_v2: [], sub_comments: [] },
            { id: "c3", content: "其他内容", show_tags_v2: [], sub_comments: [] },
          ],
        },
      }),
      argument: { xhs_comment_regex: defaultRegexArg, xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(3);
    expect(body.data.comments.find(c => c.id === "c2").content).toBe("命中xhs_comment_regex:神经病");
    expect(body.data.comments.find(c => c.id === "c1").content).toBe("正常内容");
  });

  it("AE3: no regex matches — all comments pass through unchanged", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            { id: "c1", content: "完全正常的内容", show_tags_v2: [], sub_comments: [] },
            { id: "c2", content: "也很正常", show_tags_v2: [], sub_comments: [] },
          ],
        },
      }),
      argument: { xhs_comment_regex: defaultRegexArg, xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(2);
    expect(body.data.comments[0].id).toBe("c1");
    expect(body.data.comments[1].id).toBe("c2");
  });

  it("multiple general regex matches — all matching comments preserved and marked", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            { id: "c1", content: "神经病", show_tags_v2: [], sub_comments: [] },
            { id: "c2", content: "也是神经病", show_tags_v2: [], sub_comments: [] },
            { id: "c3", content: "正常内容", show_tags_v2: [], sub_comments: [] },
          ],
        },
      }),
      argument: { xhs_comment_regex: defaultRegexArg, xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(3);
    expect(body.data.comments.find(c => c.id === "c1").content).toBe("命中xhs_comment_regex:神经病");
    expect(body.data.comments.find(c => c.id === "c2").content).toBe("命中xhs_comment_regex:神经病");
    expect(body.data.comments.find(c => c.id === "c3").content).toBe("正常内容");
  });

  it("general_comment_regex preserves and marks sub_comments within a comment", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            {
              id: "c1",
              content: "正常内容",
              show_tags_v2: [],
              sub_comments: [
                { id: "s1", content: "神经病" },
                { id: "s2", content: "好内容" },
              ],
            },
          ],
        },
      }),
      argument: { xhs_comment_regex: defaultRegexArg, xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(1);
    expect(body.data.comments[0].sub_comments).toHaveLength(2);
    expect(body.data.comments[0].sub_comments.find(s => s.id === "s1").content).toBe("命中xhs_comment_regex:神经病");
    expect(body.data.comments[0].sub_comments.find(s => s.id === "s2").content).toBe("好内容");
  });

  it("general_comment_regex applies to sub_comments endpoint — preserves and marks", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v3/note/comment/sub_comments?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            { id: "s1", content: "正常", show_tags_v2: [] },
            { id: "s2", content: "神经病", show_tags_v2: [] },
          ],
        },
      }),
      argument: { xhs_comment_regex: defaultRegexArg, xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(2);
    expect(body.data.comments.find(c => c.id === "s2").content).toBe("命中xhs_comment_regex:神经病");
    expect(body.data.comments.find(c => c.id === "s1").content).toBe("正常");
  });
});

describe("Comment filtering (U2) — author vs general priority", () => {
  it("author match takes priority over general match — both comments preserved", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            {
              id: "c1",
              content: "私",
              show_tags_v2: [{ type: "is_author" }],
              sub_comments: [
                { id: "s1", content: "神经病" },
              ],
            },
            { id: "c2", content: "神经病", show_tags_v2: [], sub_comments: [] },
          ],
        },
      }),
      argument: { xhs_comment_regex: defaultRegexArg, xhs_loglevel: "WARNING" },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(2);
    expect(body.data.comments.find(c => c.id === "c1").content).toBe("命中xhs_comment_regex:^私$");
    expect(body.data.comments.find(c => c.id === "c2").content).toBe("命中xhs_comment_regex:神经病");
  });
});

describe("Comment filtering (U2) — edge cases", () => {
  it("empty author_comment_regex skips author filter, still applies general filter — preserves with mark", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            {
              id: "c1",
              content: "神经病",
              show_tags_v2: [{ type: "is_author" }],
              sub_comments: [],
            },
          ],
        },
      }),
      argument: {
        xhs_comment_regex: JSON.stringify({
          author_comment_regex: [],
          general_comment_regex: ["神经病"],
        }),
        xhs_loglevel: "WARNING",
      },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(1);
    expect(body.data.comments[0].content).toBe("命中xhs_comment_regex:神经病");
  });

  it("empty general_comment_regex skips general filter, still applies author filter", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            {
              id: "c1",
              content: "私",
              show_tags_v2: [{ type: "is_author" }],
              sub_comments: [],
            },
          ],
        },
      }),
      argument: {
        xhs_comment_regex: JSON.stringify({
          author_comment_regex: ["^私$"],
          general_comment_regex: [],
        }),
        xhs_loglevel: "WARNING",
      },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(1);
    expect(body.data.comments[0].content).toBe("命中xhs_comment_regex:^私$");
  });

  it("both regex arrays empty passes through", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            { id: "c1", content: "私", show_tags_v2: [{ type: "is_author" }], sub_comments: [] },
          ],
        },
      }),
      argument: {
        xhs_comment_regex: JSON.stringify({
          author_comment_regex: [],
          general_comment_regex: [],
        }),
        xhs_loglevel: "WARNING",
      },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(1);
    expect(body.data.comments[0].content).toBe("私");
  });

  it("skips empty strings in regex arrays", () => {
    const result = runSurgeScript({
      url: "https://edith.xiaohongshu.com/api/sns/v5/note/comment/list?note_id=test",
      responseBody: JSON.stringify({
        data: {
          comments: [
            { id: "c1", content: "anything", show_tags_v2: [], sub_comments: [] },
          ],
        },
      }),
      argument: {
        xhs_comment_regex: JSON.stringify({
          author_comment_regex: [""],
          general_comment_regex: [""],
        }),
        xhs_loglevel: "WARNING",
      },
    });
    const body = parseBody(result.donePayload);
    expect(body.data.comments).toHaveLength(1);
  });
});