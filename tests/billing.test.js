import test from "node:test";
import assert from "node:assert/strict";
import { billMetrics } from "../src/lib/billing.js";

test("calculates product and service profit separately", () => {
  const metrics = billMetrics([
    {
      type: "product",
      price: 1000,
      purchasePrice: 700,
      qty: 2,
    },
    {
      type: "service",
      price: 500,
      purchasePrice: 100,
      qty: 1,
    },
  ]);

  assert.equal(metrics.productRevenue, 2000);
  assert.equal(metrics.productProfit, 600);
  assert.equal(metrics.serviceRevenue, 500);
  assert.equal(metrics.serviceProfit, 400);
  assert.equal(metrics.netProfit, 1000);
});

test("applies discounts against total bill profit", () => {
  const metrics = billMetrics(
    [{ type: "product", price: 1000, purchasePrice: 700, qty: 1 }],
    100,
  );

  assert.equal(metrics.grossProfit, 300);
  assert.equal(metrics.netProfit, 200);
});
