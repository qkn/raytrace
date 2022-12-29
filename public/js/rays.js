
// Find the first surface that ray intersects
function rayHitSurface (rayOrigin, rayDirection, drawables) {
  const result = {
    surface: null,
    t: Infinity,
    p: null,
    normal: null
  }

  for (let d = 0; d < drawables.length; d++) {
    const surfaces = drawables[d].surfaces;
    for (let s = 0; s < surfaces.length; s++) {
      const surface = surfaces[s];
      const hit = surface.rayIntersect(rayOrigin, rayDirection, result.t, false);
      if (hit !== null) {
        result.surface = surface;
        result.t = hit.t;
        result.p = hit.p;
        result.normal = hit.normal;
      }
    }
  }

  return result;
}

// Checks whether a surface is the first one hit by a ray
function firstHitIs (rayOrigin, rayDirection, drawables, target) {
  const hit0 = target.rayIntersect(rayOrigin, rayDirection, Infinity, true);

  if (hit0 === null) {
    return false;
  }

  const t0 = hit0.t;

  for (let d = 0; d < drawables.length; d++) {
    const surfaces = drawables[d].surfaces;
    for (let s = 0; s < surfaces.length; s++) {
      const surface = surfaces[s];
      if (surface === target || surface.noShadow) {
        continue;
      }
      const hit = surface.rayIntersect(rayOrigin, rayDirection, t0, false);
      if (hit !== null) {
        return false;
      }
    }
  }

  return true;
}