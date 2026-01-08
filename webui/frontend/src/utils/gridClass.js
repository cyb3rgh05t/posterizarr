// Shared helper to build responsive grid column classes based on desired density
// Base/mobile is capped small; wider breakpoints allow more columns up to 20.
// All classes are pre-built Tailwind safe classes to work with JIT compiler.

const GRID_CLASSES = {
  2: "grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6",
  7: "grid-cols-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-7 2xl:grid-cols-7",
  8: "grid-cols-2 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-8 2xl:grid-cols-8",
  9: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-9 xl:grid-cols-9 2xl:grid-cols-9",
  10: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-10 xl:grid-cols-10 2xl:grid-cols-10",
  11: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-11 xl:grid-cols-11 2xl:grid-cols-11",
  12: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 xl:grid-cols-12 2xl:grid-cols-12",
  13: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 xl:grid-cols-13 2xl:grid-cols-13",
  14: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 xl:grid-cols-14 2xl:grid-cols-14",
  15: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 xl:grid-cols-15 2xl:grid-cols-15",
  16: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 xl:grid-cols-16 2xl:grid-cols-16",
  17: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 xl:grid-cols-17 2xl:grid-cols-17",
  18: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 xl:grid-cols-18 2xl:grid-cols-18",
  19: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 xl:grid-cols-19 2xl:grid-cols-19",
  20: "grid-cols-2 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 xl:grid-cols-20 2xl:grid-cols-20",
};

export const buildResponsiveGridClass = (size) => {
  const clamped = Math.max(2, Math.min(size, 20));
  return GRID_CLASSES[clamped] || GRID_CLASSES[5];
};
