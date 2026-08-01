import { describe, expect, it } from "bun:test";
import { runScript } from "./helpers/run-script";

function runImageFeed({ images, quality = "original", url = "https://edith.xiaohongshu.com/api/sns/v1/note/imagefeed?note_id=abc" }) {
  const note = { note_id: "abc", type: "normal", images_list: images };
  const result = runScript({
    url,
    responseBody: JSON.stringify({ code: 0, success: true, data: [note] }),
    argument: { xhs_loglevel: "WARNING" },
    initialStore: { "fmz200.xiaohongshu.imageQuality": quality },
  });
  return JSON.parse(result.donePayload.body).data[0].images_list;
}

function staticImg(id) {
  return {
    file_id: id,
    url_default: `https://sns-img-qc.xhscdn.com/s/${id}?imageView2/2/w/1080/format/jpg`,
    url_pre: `https://sns-img-qc.xhscdn.com/s/${id}?imageView2/2/w/540/format/jpg`,
  };
}

function liveImg(id) {
  return {
    file_id: id,
    url_default: `https://sns-na-i1.xhscdn.com/s/${id}?imageView2/2/w/1440/format/heif/q/45&redImage/frame/0&ap=11&sc=NB_DTL&sign=abc&t=1&origin=2`,
    url_pre: `https://sns-na-i1.xhscdn.com/s/${id}?imageView2/2/w/540/format/heif/q/45&redImage/frame/0&ap=11&sc=NB_PRV&sign=abc&t=1&origin=2`,
  };
}

describe("imageEnhance — original mode (原始分辨率)", () => {
  it("rewrites a single live-photo URL to PNG frame cleanly", () => {
    const il = runImageFeed({ images: [liveImg("l1")] });
    expect(il).toHaveLength(1);
    expect(il[0].url_default).toBe(
      "https://sns-na-i1.xhscdn.com/s/l1?imageView2/0/format/png&redImage/frame/0&ap=11&sc=NB_DTL&sign=abc&t=1&origin=2",
    );
  });

  it("preserves ALL images of a multi-image note when a later image contains redImage", () => {
    // Bug repro: `[^&]*` in the original-mode regex spans across JSON field
    // separators, so the match starts at the first ?imageView2/2 URL and ends
    // at a &redImage/frame/0 in a LATER URL — deleting image entries between.
    const il = runImageFeed({ images: [staticImg("s1"), staticImg("s2"), liveImg("l3")] });
    expect(il).toHaveLength(3);
    // static images stay untouched (no redImage in their own URL)
    expect(il[0].url_default).toBe(`https://sns-img-qc.xhscdn.com/s/s1?imageView2/2/w/1080/format/jpg`);
    expect(il[1].url_default).toBe(`https://sns-img-qc.xhscdn.com/s/s2?imageView2/2/w/1080/format/jpg`);
    // live photo gets the clean PNG rewrite
    expect(il[2].url_default).toBe(
      "https://sns-na-i1.xhscdn.com/s/l3?imageView2/0/format/png&redImage/frame/0&ap=11&sc=NB_DTL&sign=abc&t=1&origin=2",
    );
  });

  it("preserves all images of a pure static note (no redImage anywhere)", () => {
    const il = runImageFeed({ images: [staticImg("s1"), staticImg("s2"), staticImg("s3")] });
    expect(il).toHaveLength(3);
    expect(il[2].url_default).toBe(`https://sns-img-qc.xhscdn.com/s/s3?imageView2/2/w/1080/format/jpg`);
  });
});

describe("imageEnhance — high-pixel mode (高像素输出, default)", () => {
  it("rewrites all image widths to 2160 and keeps every image", () => {
    const il = runImageFeed({ images: [staticImg("s1"), staticImg("s2"), liveImg("l3")], quality: "highPixels" });
    expect(il).toHaveLength(3);
    expect(il[0].url_default).toBe(`https://sns-img-qc.xhscdn.com/s/s1?imageView2/2/w/2160/format/jpg`);
    expect(il[2].url_default).toContain("imageView2/2/w/2160/format/heif/q/45&redImage/frame/0");
  });
});
