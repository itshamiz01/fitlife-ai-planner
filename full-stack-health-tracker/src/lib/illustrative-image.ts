// Older plans may still store these retired paths. Resolve them at display time
// without changing historical records or treating the illustration as a food photo.
const legacyImages: Record<string, string> = {
  '/images/banana-oats.jpg': '/images/recipe-breakfast.png',
  '/images/toast.jpg': '/images/recipe-breakfast.png',
  '/images/snack.jpg': '/images/recipe-workout.png',
  '/images/chana.jpg': '/images/recipe-main.png',
  '/images/chicken-bowl.jpg': '/images/recipe-main.png',
  '/images/dal-rice.jpg': '/images/recipe-main.png',
  '/images/roti-dal.jpg': '/images/recipe-main.png',
  '/images/salad.jpg': '/images/recipe-main.png',
  '/images/salmon.jpg': '/images/recipe-main.png',
};
export function illustrativeImage(path: string): string { return legacyImages[path] ?? path; }
