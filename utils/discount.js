const discount = (price, discount) => {
  let discountedPrice = 0;
  if (discount === 0) {
    discountedPrice = price;
  } else {
    discountedPrice = price - (price * discount) / 100;
  }

  return discountedPrice;
};

module.exports = discount;
