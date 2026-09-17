import test from "node:test";
import assert from "node:assert/strict";
import { localISODate } from "../src/lib/utils.js";

test("formats a local calendar date without UTC conversion", () => {
  const localMidnight = new Date(2026, 8, 17, 0, 30, 0);

  assert.equal(localISODate(localMidnight), "2026-09-17");
});
