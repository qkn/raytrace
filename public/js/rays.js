
importScripts("./intersect.js");

const result = {
  normal: new Float32Array(3)
};

const output = {};

const surfaceMap = {
  1: Triangle.rayIntersect,
  2: Sphere.rayIntersect,
  3: Cylinder.rayIntersect
};

// Find the first surface that ray intersects
function rayHitSurface (rayOrigin, rayDirection, surfaces, surfaceTypes, numSurfaces) {
  result.surfaceIndex = null;
  result.surfaceType = null;
  result.t = Infinity;
  result.p = null;

  for (let i = 0, s = 0; i < numSurfaces; i++, s += FLOATS_PER_SURFACE) {
    const surfaceType = surfaceTypes[i];
    const rayIntersect = surfaceMap[surfaceType];

    rayIntersect(output, surfaces, i, rayOrigin, rayDirection, result.t, false);

    if (output.t !== null) {
      result.surfaceIndex = i;
      result.surfaceType = surfaceType;
      result.t = output.t;
      result.p = output.p;

      // copy normal
      result.normal[0] = output.normal[0];
      result.normal[1] = output.normal[1];
      result.normal[2] = output.normal[2];
    }
  }

  return result;
}

// Checks whether a surface is the first one hit by a ray
function firstHitIs (rayOrigin, rayDirection, surfaces, surfaceTypes, surfaceIndex, surfaceType, numSurfaces) {
  const rayIntersect = surfaceMap[surfaceType];
  
  rayIntersect(output, surfaces, surfaceIndex, rayOrigin, rayDirection, Infinity, true);

  const t0 = output.t;

  if (t0 === null) {
    return false;
  }

  for (let i = 0, s = 0; i < numSurfaces; i++, s += FLOATS_PER_SURFACE) {
    if (i === surfaceIndex) {
      continue;
    }

    const surfaceType = surfaceTypes[i];
    const rayIntersect = surfaceMap[surfaceType];

    rayIntersect(output, surfaces, i, rayOrigin, rayDirection, t0, false);

    if (output.t !== null) {
      return false;
    }
  }

  return true;
}