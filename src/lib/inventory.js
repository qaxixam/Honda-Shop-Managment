export function productQuantityInCart(cart, productId) {
  return cart
    .filter((item) => item.type === "product" && item.id === productId)
    .reduce((sum, item) => sum + Number(item.qty || 0), 0);
}

export function findStockIssue(cart, products) {
  const productMap = new Map(products.map((product) => [product.id, product]));

  for (const item of cart) {
    if (item.type !== "product") continue;

    const product = productMap.get(item.id);
    const requested = productQuantityInCart(cart, item.id);
    const available = Math.max(0, Number(product?.stock || 0));

    if (!product) {
      return {
        item,
        product,
        requested,
        available,
        message: `${item.name} is no longer available in inventory.`,
      };
    }

    if (requested > available) {
      return {
        item,
        product,
        requested,
        available,
        message: `${item.name} has only ${available} in stock.`,
      };
    }
  }

  return null;
}
