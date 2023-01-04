
// 12 floats per surface
const FLOATS_PER_SURFACE = 12;

const optiCache = {};

function preRenderOpti (surfaces) {
  for (let i = 0; i < surfaces.length; i++) {
    optiCache[i] 
  }
}

class Triangle {
  static calculateOpti (surfaces, surfaceIndex) {
    const o = surfaceIndex * FLOATS_PER_SURFACE;

    const entry = optiCache[surfaceIndex];
    
    if (surfaceIndex) {
      entry[0] = 0;
    }

    return opti;
  }

  static rayIntersect (surfaces, surfaceIndex, rayOrigin, rayDirection, tMax, planeOnly, output) {
    const o = surfaceIndex * FLOATS_PER_SURFACE;

    const opti = optiCache[surfaceIndex] ?? this.calculateOpti(surfaces, surfaceIndex);

    const normal = opti[0];
    const negNormal = opti[1];
    const d = opti[2];

    // All values here can be computed from the 3 vertices
    const denom = Vector3.dot(normal, rayDirection);

    if (denom === 0) {
      // Ray is parallel to plane, thus no intersect
      output.t = null;
      return;
    }

    const t = -(Vector3.dot(normal, rayOrigin) + d) / denom;

    if (t < 0 || t >= tMax) {
      output.t = null;
      return;
    }

    const p = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t));

    if (planeOnly || this.containsPoint(p)) {
      output.t = t;
      output.p = p;
      output.normal = denom > 0 ? negNormal : normal;
    } else {
      output.t = null;
    }
  }

  static containsPoint (p) {
    return true; // placeholder

    const vec3 = Vector3.sub(p, this.relVertices[0]);

    // Compute dot products
    const dot13 = Vector3.dot(this.vec1, vec3);
    const dot23 = Vector3.dot(this.vec2, vec3);

    // Compute barycentric coordinates
    const u = (this.dot22 * dot13 - this.dot12 * dot23) * this.invDenom;
    const v = (this.dot11 * dot23 - this.dot12 * dot13) * this.invDenom;

    // Check if point is in triangle
    return (
      (u >= NEG_EPSILON)
      && (v >= NEG_EPSILON)
      && (u + v <= ONE_PLUS_EPSILON)
    );
  }
}

class Sphere {
  static rayIntersect (surfaces, surfaceIndex, rayOrigin, rayDirection, tMax, output) {
    output.t = null;
  }
}

class Cylinder {
  static rayIntersect (surfaces, surfaceIndex, rayOrigin, rayDirection, tMax, output) {
    output.t = null;
  }
}