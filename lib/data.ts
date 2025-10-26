export const PRODUCTS = Array.from({ length: 6 }, (_, i) => ({
  id: `lunch-${i + 1}`,
  name: "Lunch Package",
  price: 15000,
  image: "/lunch.webp"
}));

export const DESSERTS = Array.from({ length: 6 }, (_, i) => ({
  id: `dessert-${i + 1}`,
  name: "Dessert Package",
  price: 15000,
  image: "/lunch.webp"
}));

export const BREADS = Array.from({ length: 6 }, (_, i) => ({
  id: `bread-${i + 1}`,
  name: "Bread Package",
  price: 15000,
  image: "/lunch.webp"
}));
