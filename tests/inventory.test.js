import test from "node:test";
import assert from "node:assert/strict";
import { findStockIssue, productQuantityInCart } from "../src/lib/inventory.js";

test("counts product quantities across matching cart lines", () => {
  const cart = [
    { type: "product", id: "HBP-001", qty: 2 },
    { type: "service", id: "HBP-001", qty: 5 },
    { type: "product", id: "HBP-001", qty: 3 },
  ];

  assert.equal(productQuantityInCart(cart, "HBP-001"), 5);
});

test("reports a stock issue when cart quantity exceeds available stock", () => {
  const issue = findStockIssue(
    [{ type: "product", id: "HBP-001", name: "Brake Pad", qty: 4 }],
    [{ id: "HBP-001", stock: 3 }],
  );

  assert.equal(issue.available, 3);
  assert.equal(issue.requested, 4);
});

test("allows cart quantities within stock", () => {
  const issue = findStockIssue(
    [{ type: "product", id: "HBP-001", name: "Brake Pad", qty: 3 }],
    [{ id: "HBP-001", stock: 3 }],
  );

  assert.equal(issue, null);
});
