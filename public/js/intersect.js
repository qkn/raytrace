
const NEG_EPSILON = -Number.EPSILON;
const ONE_PLUS_EPSILON = 1 + Number.EPSILON;

// Maximum number of floats per surface
const FLOATS_PER_SURFACE = 26;

const normal = new Float32Array(3);
const vec1 = new Float32Array(3);
const vec2 = new Float32Array(3);
const vec3 = new Float32Array(3);
const circRelPos = new Float32Array(3);
const relAxis = new Float32Array(3);

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

    if (Triangle.containsPoint(surfaces, surfaceIndex, p)) {
      output.t = t;
      output.p = p;
      if (denom > 0) {
        // Reverse normal
        for (let i = 0; i < 3; i++) {
          normal[i] = -normal[i];
        }
      }
      output.normal = normal;
      return;
    }
    
    output.t = null;
  }

  static containsPoint (surfaces, surfaceIndex, p) {
    const o = surfaceIndex * FLOATS_PER_SURFACE;

    for (let i = 0; i < 3; i++) {
      normal[i] = surfaces[o + 12 + i];
      vec1[i] = surfaces[o + 16 + i];
      vec2[i] = surfaces[o + 19 + i];
      vec3[i] = p[i] - surfaces[o + 3 + i];
    }
    // do declaring these consts affect memory or performance?
    const dot11 = surfaces[o + 22];
    const dot12 = surfaces[o + 23];
    const dot22 = surfaces[o + 24];
    const invDenom = surfaces[o + 25];

    // Compute dot products
    const dot13 = Vector3.dot(vec1, vec3);
    const dot23 = Vector3.dot(vec2, vec3);

    // Compute barycentric coordinates
    const u = (dot22 * dot13 - dot12 * dot23) * invDenom;
    const v = (dot11 * dot23 - dot12 * dot13) * invDenom;

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
    const o = surfaceIndex * FLOATS_PER_SURFACE;
    
    for (let i = 0; i < 3; i++) {
      circRelPos[i] = surfaces[o + 3 + i];
    }
    const r2 = surfaces[o + 6];
    
    // Make sphere center the new origin
    const relOrigin = Vector3.sub(rayOrigin, circRelPos);

    const bHalf = Vector3.dot(relOrigin, rayDirection);
    const c = Vector3.norm(relOrigin) ** 2 - r2;

    const discrim = bHalf**2 - c;

    if (discrim < 0) {
      output.t = null;
      return;
    }
    
    const root = Math.sqrt(discrim);

    const t1 = -bHalf - root;

    if (t1 > 0 && t1 < tMax) {
      const p = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t1));
      const normal = Vector3.sub(p, circRelPos);
      Vector3.inormalize(normal);

      output.t = t1;
      output.p = p;
      output.normal = normal;
      return;
    }

    const t2 = -bHalf + root;

    if (t2 > 0 && t2 < tMax) {
      const p = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t2));
      const normal = Vector3.sub(circRelPos, p);
      Vector3.inormalize(normal);

      output.t = t2;
      output.p = p;
      output.normal = normal;
      return;
    }

    output.t = null;
  }
}

class Cylinder {
  static rayIntersect (output, surfaces, surfaceIndex, rayOrigin, rayDirection, tMax, planeOnly) {
    const o = surfaceIndex * FLOATS_PER_SURFACE;
    
    for (let i = 0; i < 3; i++) {
      circRelPos[i] = surfaces[o + 3 + i];
      relAxis[i] = surfaces[o + 6 + i];
    }
    const r2 = surfaces[o + 9];
    const height = surfaces[o + 10];
    
    // Make sphere center the new origin
    const relOrigin = Vector3.sub(rayOrigin, circRelPos);

    const x0 = relOrigin[0];
    const y0 = relOrigin[1];
    const z0 = relOrigin[2];

    const xd = rayDirection[0];
    const yd = rayDirection[1];
    const zd = rayDirection[2];

    const dot1 = Vector3.dot(relAxis, rayDirection);
    const dot2 = Vector3.dot(relAxis, relOrigin);

    const a = xd ** 2 + yd ** 2 + zd ** 2 - dot1 ** 2;
    const bHalf = x0 * xd + y0 * yd + z0 * zd - dot2 * dot1;
    const c = x0 ** 2 + y0 ** 2 + z0 ** 2 - dot2 ** 2 - r2;

    const discrim = bHalf**2 - a * c;

    if (discrim < 0) {
      output.t = null;
      return;
    }

    const root = Math.sqrt(discrim);

    const t1 = (-bHalf - root) / a;

    if (t1 > 0 && t1 < tMax) {
      const p1 = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t1));
      const c1 = Vector3.sub(p1, circRelPos);
      const d1 = Vector3.dot(relAxis, c1);

      if (d1 > 0 && d1 < height) {
        const offset = Vector3.add(circRelPos, Vector3.scale(relAxis, d1));
        const normal = Vector3.sub(p1, offset);
        Vector3.inormalize(normal);

        output.t = t1;
        output.p = p1;
        output.normal = normal;
        return;
      }
    }

    const t2 = (-bHalf + root) / a;

    if (t2 > 0 && t2 < tMax) {
      const p2 = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t2));
      const c2 = Vector3.sub(p2, circRelPos);
      const d2 = Vector3.dot(relAxis, c2);

      if (d2 > 0 && d2 < height) {
        const offset = Vector3.add(circRelPos, Vector3.scale(relAxis, d2));
        const normal = Vector3.sub(offset, p2);
        Vector3.inormalize(normal);

        output.t = t2;
        output.p = p2;
        output.normal = normal;
        return;
      }
    }

    output.t = null;
  }
}