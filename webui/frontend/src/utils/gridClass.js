// Shared helper to build responsive grid column classes based on desired density
// Base/mobile is capped small; wider breakpoints allow more columns up to 20.
export const buildResponsiveGridClass = (size) => {
  const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

  const base = clamp(size, 2, 4); // phones: keep readable
  const sm = clamp(size, 2, 4); // small screens: similar to base
  const md = clamp(size, 3, 8); // tablets: allow a bit more
  const lg = clamp(size, 4, 12); // desktops: roomy but not tiny
  const xl = clamp(size, 6, 20); // wide screens: full range up to 20

  const classFor = (cols, prefix = "") =>
    cols <= 12
      ? `${prefix}grid-cols-${cols}`
      : `${prefix}grid-cols-[repeat(${cols},minmax(0,1fr))]`;

  return [
    classFor(base),
    classFor(sm, "sm:"),
    classFor(md, "md:"),
    classFor(lg, "lg:"),
    classFor(xl, "xl:"),
    classFor(xl, "2xl:"),
  ].join(" ");
};
