
import { FLOATS_PER_SURFACE } from "./classes.js";
import { Triangle, Sphere, Cylinder } from "./intersect.js";

const hit = {
  normal: new Float32Array(3),
  p: new Float32Array(3)
};

const surfaceMap = {
  1: Triangle.rayIntersect,
  2: Sphere.rayIntersect,
  3: Cylinder.rayIntersect
};

// Find the first surface that ray intersects
export function rayHitSurface (output, rayOrigin, rayDirection, surfaces, surfaceTypes, numSurfaces) {
  output.surfaceIndex = null;
  output.surfaceType = null;
  output.t = Infinity;
  output.p = null;

  for (let i = 0, s = 0; i < numSurfaces; i++, s += FLOATS_PER_SURFACE) {
    const surfaceType = surfaceTypes[i];
    const rayIntersect = surfaceMap[surfaceType];

    rayIntersect(hit, surfaces, i, rayOrigin, rayDirection, output.t, false);

    if (hit.t !== null) {
      output.surfaceIndex = i;
      output.surfaceType = surfaceType;
      output.t = hit.t;
      output.p = hit.p;

      // copy normal
      output.normal[0] = hit.normal[0];
      output.normal[1] = hit.normal[1];
      output.normal[2] = hit.normal[2];
    }
  }
}

// Checks whether a surface is the first one hit by a ray
export function firstHitIs (rayOrigin, rayDirection, surfaces, surfaceTypes, t0, numSurfaces) {
  // t0 is simply the distance between the point and the light source

  for (let i = 0, s = 0; i < numSurfaces; i++, s += FLOATS_PER_SURFACE) {
    /*
    Note that we are also checking surfaces against themselves
    For instance, a cylinder can cast a shadow on itself
    */

    const surfaceType = surfaceTypes[i];
    const rayIntersect = surfaceMap[surfaceType];

    rayIntersect(hit, surfaces, i, rayOrigin, rayDirection, t0, false);

    if (hit.t !== null) {
      return false;
    }
  }

  return true;
}