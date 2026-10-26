import { describe, expect, it } from "vitest";
import { PLACES } from "./art";
import { PLACES_WITH_SOUND } from "./audio";

describe("story sound", () => {
  it("has a room for every place the art can draw", () => {
    expect([...PLACES_WITH_SOUND].sort()).toEqual(Object.keys(PLACES).sort());
  });
});
