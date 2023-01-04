
// Maximum number of floats per surface
const FLOATS_PER_SURFACE = 16;

const normal = new Float32Array(3);

class Triangle {
  static rayIntersect (output, surfaces, surfaceIndex, rayOrigin, rayDirection, tMax, planeOnly) {
    const o = surfaceIndex * FLOATS_PER_SURFACE;

    for (let i = 0; i < 3; i++) {
      normal[i] = surfaces[o + 12 + i];
    }
    const dTri = surfaces[o + 15];

    // All values here can be computed from the 3 vertices
    const denom = Vector3.dot(normal, rayDirection);

    if (denom === 0) {
      // Ray is parallel to plane, thus no intersect
      output.t = null;
      return;
    }

    const t = -(Vector3.dot(normal, rayOrigin) + dTri) / denom;

    if (t < 0 || t >= tMax) {
      output.t = null;
      return;
    }

    if (planeOnly) {
      output.t = t;
      return;
    }

    const p = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t));

    if (Triangle.containsPoint(p)) {
      output.t = t;
      output.p = p;
      if (denom > 0) {
        // Reverse normal
        for (let i = 0; i < 3; i++) {
          normal[i] = -normal[i];
        }
      }
      output.normal = normal;
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
  static rayIntersect (output, surfaces, surfaceIndex, rayOrigin, rayDirection, tMax, planeOnly) {
    output.t = null;
  }
}

class Cylinder {
  static rayIntersect (output, surfaces, surfaceIndex, rayOrigin, rayDirection, tMax, planeOnly) {
    output.t = null;
  }
}