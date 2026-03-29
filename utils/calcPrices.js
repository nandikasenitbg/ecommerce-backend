/**
 * Calculate order prices from cart items.
 * @param {Array} orderItems - Array of { price, quantity }
 * @returns {{ itemsPrice, shippingPrice, taxPrice, totalPrice }}
 */
const calculatePrices = (orderItems) => {
  // Sum all items
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Free shipping over $100, otherwise $10
  const shippingPrice = itemsPrice > 100 ? 0 : 10;

  // 15% tax rate
  const taxPrice = parseFloat((itemsPrice * 0.15).toFixed(2));

  const totalPrice = parseFloat(
    (itemsPrice + shippingPrice + taxPrice).toFixed(2)
  );

  return {
    itemsPrice: parseFloat(itemsPrice.toFixed(2)),
    shippingPrice,
    taxPrice,
    totalPrice,
  };
};

module.exports = { calculatePrices };
