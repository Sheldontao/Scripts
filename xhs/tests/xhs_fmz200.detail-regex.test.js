import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { runScript } from "./helpers/run-script.js";

function loadFixture(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/replay/${name}.json`, import.meta.url)));
}

function runImageFeed({ fixture, regexList, store = {} }) {
  const result = runScript({
    url: "https://edith.xiaohongshu.com/api/sns/v1/note/imagefeed?note_id=6a6afcd5",
    responseBody: JSON.stringify(fixture),
    argument: { xhs_des_regex: JSON.stringify(regexList), xhs_loglevel: "WARNING" },
    initialStore: store,
  });
  return JSON.parse(result.donePayload.body);
}

describe("detail regex filter — soft-mark instead of hard-block (白屏修复)", () => {
  it("matched note: desc replaced with hit notice, response stays valid (code 0, images intact)", () => {
    const fixture = loadFixture("imagefeed-4-images");
    const note = fixture.data[0].note_list[0];
    note.desc = "早上擦完脸很水润干干净净的状态"; // contains 润 → matches user's regex
    const out = runImageFeed({ fixture, regexList: ["(内卷|卷王|躺平|摆烂|润)"] });

    expect(out.code).toBe(0);
    expect(out.data).not.toBe({});
    const outNote = out.data[0].note_list[0];
    expect(outNote.desc).toBe("命中xhs_des_regex:(内卷|卷王|躺平|摆烂|润)");
    // images untouched → no white screen
    expect(out.data[0].note_list[0].images_list).toHaveLength(4);
  });

  it("unmatched note: desc unchanged", () => {
    const fixture = loadFixture("imagefeed-4-images");
    const out = runImageFeed({ fixture, regexList: ["(内卷|卷王|躺平|摆烂|润)"] });
    const outNote = out.data[0].note_list[0];
    expect(outNote.desc).toBe(fixture.data[0].note_list[0].desc);
    expect(out.code).toBe(0);
  });

  it("multi-note feed (/note/feed): only the matched note is marked, others untouched", () => {
    const fixture = loadFixture("imagefeed-4-images");
    const noteA = fixture.data[0].note_list[0];
    noteA.desc = "这段描述没有关键词";
    const noteB = { ...noteA, id: "second", desc: "这款面霜很滋润", images_list: [] };
    const body = { code: 0, success: true, data: [{ note_list: [noteA, noteB] }] };
    const out = runImageFeed({ fixture: body, regexList: ["润"] });
    const notes = out.data[0].note_list;
    expect(notes[0].desc).toBe("这段描述没有关键词");
    expect(notes[1].desc).toBe("命中xhs_des_regex:润");
    expect(out.code).toBe(0);
  });
});
