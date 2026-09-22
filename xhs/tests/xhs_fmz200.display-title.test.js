import { describe, expect, it } from "bun:test";
import { runScript } from "./helpers/run-script.js";

describe("homefeed & search display_title filtering", () => {
  it("filters homefeed note matching regex via display_title when title and desc are empty", () => {
    const rawData = [
      {
        id: "note-with-title",
        title: "正常标题",
        name: "正常标题",
        display_title: "正常标题",
        desc: "",
        likes: 100,
      },
      {
        id: "note-without-title-hit",
        title: "",
        name: "",
        display_title: "一个破电瓶车，这么多型号的插口。手机插口都统一了。",
        desc: "",
        likes: 200,
      },
      {
        id: "note-without-title-keep",
        title: "",
        name: "",
        display_title: "今天天气真好，出去散步遇到了可爱的小猫咪。",
        desc: "",
        likes: 300,
      },
    ];

    const result = runScript({
      url: "https://edith.xiaohongshu.com/api/sns/v6/homefeed",
      responseBody: JSON.stringify({ data: rawData }),
      argument: {
        xhs_des_regex: JSON.stringify(["电瓶车"]),
        xhs_loglevel: "WARNING",
      },
    });

    const parsed = JSON.parse(result.donePayload.body);
    expect(parsed.data).toHaveLength(2);
    expect(parsed.data.map((item) => item.id)).toEqual([
      "note-with-title",
      "note-without-title-keep",
    ]);
  });

  it("filters search notes matching regex via display_title when title is empty", () => {
    const searchData = {
      items: [
        {
          model_type: "note",
          note: {
            id: "search-1",
            title: "",
            display_title: "急转租，房东直租无中介费精装修单间",
            desc: "",
            hash_tag: [],
            user: { nickname: "租客" },
          },
        },
        {
          model_type: "note",
          note: {
            id: "search-2",
            title: "普通租房日记",
            display_title: "普通租房日记",
            desc: "今天搬家好累",
            hash_tag: [],
            user: { nickname: "租客" },
          },
        },
      ],
    };

    const result = runScript({
      url: "https://edith.xiaohongshu.com/api/sns/v10/search/notes",
      responseBody: JSON.stringify({ data: searchData }),
      argument: {
        xhs_search_des_regex: JSON.stringify(["房东直租"]),
        xhs_loglevel: "WARNING",
      },
    });

    const parsed = JSON.parse(result.donePayload.body);
    expect(parsed.data.items).toHaveLength(1);
    expect(parsed.data.items[0].note.id).toBe("search-2");
  });
});
