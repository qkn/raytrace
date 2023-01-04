
importScripts("./intersect.js");

const result = {
  surface: null,
  t: Infinity,
  p: null,
  normal: null
};

const output = {

};

const surfaceMap = {
  1: Triangle.rayIntersect,
  2: Sphere.rayIntersect,
  3: Cylinder.rayIntersect
};

// Find the first surface that ray intersects
function rayHitSurface (rayOrigin, rayDirection, surfaces, surfaceTypes) {
  result.surfaceIndex = null;
  result.surfaceType = null;
  result.t = Infinity;
  result.p = null;
  result.normal = null;

  for (let i = 0, s = 0; i < surfaceTypes.length; i++, s += FLOATS_PER_SURFACE) {
    const surfaceType = surfaceTypes[i];
    const rayIntersect = surfaceMap[surfaceType];

    rayIntersect(surfaces, i, rayOrigin, rayDirection, result.t, false, output);

    if (output.t !== null) {
      result.surfaceIndex = i;
      result.surfaceType = surfaceType;
      result.t = output.t;
      result.p = output.p;
      result.normal = output.normal;
    }
  }

  return result;
}

// Checks whether a surface is the first one hit by a ray
function firstHitIs (rayOrigin, rayDirection, surfaces, surfaceTypes, surfaceIndex, surfaceType) {
  const rayIntersect = surfaceMap[surfaceType];

  rayIntersect(surfaces, surfaceIndex, rayOrigin, rayDirection, Infinity, true, output);

  const t0 = output.t;

  if (t0 === null) {
    return false;
  }

  for (let i = 0, s = 0; i < surfaceTypes.length; i++, s += FLOATS_PER_SURFACE) {
    if (i === surfaceIndex) {
      continue;
    }

    const surfaceType = surfaceTypes[i];
    const rayIntersect = surfaceMap[surfaceType];

    rayIntersect(surfaces, surfaceIndex, rayOrigin, rayDirection, t0, false, output);

    if (output.t !== null) {
      return false;
    }
  }

  return true;
}