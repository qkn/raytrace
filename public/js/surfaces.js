
import { Vector3, Matrix, Surface } from "./classes.js";

/*
Todo:
* Remove redundancy from protocol
* Include boolean attributes i.e. noShadow (bitmask?)
*/

const NEG_EPSILON = -Number.EPSILON;
const ONE_PLUS_EPSILON = 1 + Number.EPSILON;

export class TriangleSurface extends Surface {
  constructor ({ color, vertices }) {
    super({ color });
    this.surfaceType = 1;
    this.vertices = vertices;
    this.relVertices = vertices;
  }

  relative (pos, invmatrix) {
    this.relVertices = this.vertices.map(
      vertex => Vector3.sub(vertex, pos));
    
    this.relVertices = this.relVertices.map(
      vertex => Matrix.pmultiply(invmatrix, vertex));

    this.precompute();
  }

  precompute () {
    const [A, B, C] = this.relVertices;
    
    // Basis vectors
    this.vec1 = Vector3.sub(B, A);
    this.vec2 = Vector3.sub(C, A);

    // Plane
    this.normal = Vector3.normalize(Vector3.cross(this.vec1, this.vec2));
    this.negNormal = Vector3.scale(this.normal, -1);
    this.dTri = -Vector3.dot(this.normal, A);
    this.plane = [...this.normal, this.dTri];

    // Dot products for point in triangle check
    this.dot11 = Vector3.dot(this.vec1, this.vec1);
    this.dot12 = Vector3.dot(this.vec1, this.vec2);
    this.dot22 = Vector3.dot(this.vec2, this.vec2);
    this.invDenom = 1 / (this.dot11 * this.dot22 - this.dot12 * this.dot12);
  }

  rayIntersect (rayOrigin, rayDirection, tMax, planeOnly) {
    // All values here can be computed from the 3 vertices
    const denom = Vector3.dot(this.normal, rayDirection);

    if (denom === 0) {
      // Ray is parallel to plane, thus no intersect
      return null;
    }

    const t = -(Vector3.dot(this.normal, rayOrigin) + this.dTri) / denom;

    if (t < 0 || t >= tMax) {
      return null;
    }

    const p = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t));

    if (planeOnly || this.containsPoint(p)) {
      return { t, p, normal: denom > 0 ? this.negNormal : this.normal };
    } else {
      return null;
    }
  }

  containsPoint (p) {
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

  serialize (data, offset) {
    /*
    Todo:
    Vertices 1 and 2 are not even used when rendering
    Do workers have any other use for these?
    If not, we can save 6 floats by omitting these
    */ 
    for (let i = 0; i < 3; i++) {
      data[offset + 0 + i] = this.color[i];
      data[offset + 16 + i] = this.vec1[i];
      data[offset + 19 + i] = this.vec2[i];
      for (let j = 0; j < 3; j++) {
        data[offset + 3 + 3 * i + j] = this.relVertices[i][j];
      }
      data[offset + 12 + i] = this.normal[i];
    }
    data[offset + 15] = this.dTri;
    data[offset + 22] = this.dot11;
    data[offset + 23] = this.dot12;
    data[offset + 24] = this.dot22;
    data[offset + 25] = this.invDenom;
  }
}

export class SphereSurface extends Surface {
  constructor ({ color, pos, r, glow, noShadow }) {
    super({ color, glow, noShadow });
    this.surfaceType = 2;
    this.pos = pos;
    this.relPos = pos;
    this.r = r;
    this.r2 = r ** 2;
  }

  rayIntersect (rayOrigin, rayDirection, tMax, planeOnly) {
    // Make sphere center the new origin
    const relOrigin = Vector3.sub(rayOrigin, this.relPos);

    const bHalf = Vector3.dot(relOrigin, rayDirection);
    const c = Vector3.norm(relOrigin) ** 2 - this.r2;

    const discrim = bHalf**2 - c;

    if (discrim < 0) {
      return null;
    }
    
    const root = Math.sqrt(discrim);

    const t1 = -bHalf - root;

    if (t1 > 0 && t1 < tMax) {
      const p = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t1));
      const normal = Vector3.sub(p, this.relPos);
      Vector3.inormalize(normal);

      return { t: t1, p, normal };
    }

    const t2 = -bHalf + root;

    if (t2 > 0 && t2 < tMax) {
      const p = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t2));
      const normal = Vector3.sub(this.relPos, p);
      Vector3.inormalize(normal);

      return { t: t2, p, normal };
    }
    
    return null;
  }

  relative (pos, invmatrix) {
    this.relPos = Vector3.sub(this.pos, pos);

    this.relPos = Matrix.pmultiply(invmatrix, this.relPos);
  }

  serialize (data, offset) {
    for (let i = 0; i < 3; i++) {
      data[offset + 0 + i] = this.color[i];
      data[offset + 3 + i] = this.relPos[i];
    }
    data[offset + 6] = this.r2;
  }
}

export class CylinderSurface extends Surface {
  constructor ({ pos, axis, color, r }) {
    super({ color });
    this.surfaceType = 3;
    this.pos = pos;
    this.relPos = pos;
    this.end = Vector3.add(pos, axis);
    this.relEnd = this.end;
    this.r = r;
    this.r2 = r ** 2;
    this.height = Vector3.norm(axis);
    this.axis = axis;
  }

  rayIntersect (rayOrigin, rayDirection, tMax, planeOnly) {
    // Make cylinder center the new origin
    const relOrigin = Vector3.sub(rayOrigin, this.relPos);

    const x0 = relOrigin[0];
    const y0 = relOrigin[1];
    const z0 = relOrigin[2];

    const xd = rayDirection[0];
    const yd = rayDirection[1];
    const zd = rayDirection[2];

    const dot1 = Vector3.dot(this.relAxis, rayDirection);
    const dot2 = Vector3.dot(this.relAxis, relOrigin);

    const a = xd ** 2 + yd ** 2 + zd ** 2 - dot1 ** 2;
    const bHalf = x0 * xd + y0 * yd + z0 * zd - dot2 * dot1;
    const c = x0 ** 2 + y0 ** 2 + z0 ** 2 - dot2 ** 2 - this.r2;

    const discrim = bHalf**2 - a * c;

    if (discrim < 0) {
      return null;
    }

    const root = Math.sqrt(discrim);

    const t1 = (-bHalf - root) / a;

    if (t1 > 0 && t1 < tMax) {
      const p1 = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t1));
      const c1 = Vector3.sub(p1, this.relPos);
      const d1 = Vector3.dot(this.relAxis, c1);

      if (d1 > 0 && d1 < this.height) {
        const offset = Vector3.add(this.relPos, Vector3.scale(this.relAxis, d1));
        const normal = Vector3.sub(p1, offset);
        Vector3.inormalize(normal);

        return { t: t1, p: p1, normal };
      }
    }

    const t2 = (-bHalf + root) / a;

    if (t2 > 0 && t2 < tMax) {
      const p2 = Vector3.add(rayOrigin, Vector3.scale(rayDirection, t2));
      const c2 = Vector3.sub(p2, this.relPos);
      const d2 = Vector3.dot(this.relAxis, c2);

      if (d2 > 0 && d2 < this.height) {
        const offset = Vector3.add(this.relPos, Vector3.scale(this.relAxis, d2));
        const normal = Vector3.sub(offset, p2);
        Vector3.inormalize(normal);

        return { t: t2, p: p2, normal }; 
      }
    }

    return null;
  }

  relative (pos, invmatrix) {
    this.relPos = Vector3.sub(this.pos, pos);
    this.relPos = Matrix.pmultiply(invmatrix, this.relPos);

    this.relEnd = Vector3.sub(this.end, pos);
    this.relEnd = Matrix.pmultiply(invmatrix, this.relEnd);

    this.relAxis = Vector3.sub(this.relEnd, this.relPos);
    Vector3.inormalize(this.relAxis);
  }

  serialize (data, offset) {
    for (let i = 0; i < 3; i++) {
      data[offset + 0 + i] = this.color[i];
      data[offset + 3 + i] = this.relPos[i];
      data[offset + 6 + i] = this.relAxis[i];
    }
    data[offset + 9] = this.r2;
    data[offset + 10] = this.height;
  }
}