import { slugify } from "./slugify";

export function getCategoryThemeClass(category = "") {
  return `category-theme-${slugify(category)}`;
}
