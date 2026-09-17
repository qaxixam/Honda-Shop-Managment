export function lineRevenue(item) {
  return Number(item.price || 0) * Number(item.qty || 0);
}

export function lineCost(item) {
  return Number(item.purchasePrice || item.cost || 0) * Number(item.qty || 0);
}

export function billMetrics(items = [], discountAmount = 0) {
  const productRevenue = items
    .filter((item) => item.type === "product")
    .reduce((sum, item) => sum + lineRevenue(item), 0);
  const serviceRevenue = items
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + lineRevenue(item), 0);
  const productCost = items
    .filter((item) => item.type === "product")
    .reduce((sum, item) => sum + lineCost(item), 0);
  const serviceCost = items
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + lineCost(item), 0);
  const subtotal = productRevenue + serviceRevenue;
  const safeDiscount = Math.min(
    subtotal,
    Math.max(0, Number(discountAmount) || 0),
  );
  const total = Math.max(0, subtotal - safeDiscount);
  const totalCost = productCost + serviceCost;
  const grossProfit = subtotal - totalCost;
  const netProfit = total - totalCost;

  return {
    productRevenue,
    serviceRevenue,
    productCost,
    serviceCost,
    productProfit: productRevenue - productCost,
    serviceProfit: serviceRevenue - serviceCost,
    subtotal,
    discountAmount: safeDiscount,
    total,
    totalCost,
    grossProfit,
    netProfit,
  };
}

export function saleMetrics(sale) {
  return billMetrics(sale.lineItems || [], sale.discountAmount || 0);
}
