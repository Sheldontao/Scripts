import { findURLs } from "../url-utils";

describe("smoke", () => {
  it("imports utility modules", () => {
    expect(findURLs("hello https://example.com?a=1")).toEqual(["https://example.com?a=1"]);
  });
});
