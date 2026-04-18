export const CATEGORIES = {
  mac: "Mac",
  ipad: "iPad",
  iphone: "iPhone",
  watch: "Apple Watch",
  airpods: "AirPods",
  appletv: "Apple TV",
  accessories: "Accessories",
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
