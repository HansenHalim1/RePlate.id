export const PRODUCTS = Array.from({ length: 6 }, (_, i) => ({
  id: `lunch-${i + 1}`,
  name: "Lunch Package",
  price: 15000,
  image: "/lunch.webp",
  description: "Hearty rice, protein, and veggies prepared by our hotel chefs and rescued fresh for you.",
  allergen: "Gluten (wheat), Soy",
}));

export const DESSERTS = Array.from({ length: 6 }, (_, i) => ({
  id: `dessert-${i + 1}`,
  name: "Dessert Package",
  price: 15000,
  image: "/lunch.webp",
  description: "Sweet cakes and pastries crafted by the pastry team, ready to enjoy today.",
  allergen: "Milk, Eggs, Gluten (wheat)",
}));

export const BREADS = Array.from({ length: 6 }, (_, i) => ({
  id: `bread-${i + 1}`,
  name: "Bread Package",
  price: 15000,
  image: "/lunch.webp",
  description: "Warm artisan breads and rolls baked this morning and rescued at peak freshness.",
  allergen: "Gluten (wheat)",
}));
