
class Vector {
  // vec1 + vec2
  static add (vec1, vec2) {
    return vec1.map((v, i) => vec2[i] + v);
  }

  // vec1 - vec2
  static sub (vec1, vec2) {
    return vec1.map((v, i) => vec2[i] - v);
  }

  // scalar * vec
  static scale (vec, scalar) {
    return vec.map(v => scalar * v);
  }

  // get norm of vec
  static norm (vec) {
    let sum = 0;
    vec.forEach(v => sum += v ** 2);
    return Math.sqrt(sum);
  }

  // scale vec to norm 1
  static normalize (vec) {
    return Vector.scale(vec, 1 / Vector.norm(vec))
  }

  // vec1 x vec2
  static cross (vec1, vec2) {
    return [
      vec1[1] * vec2[2] - vec1[2] * vec2[1],
      vec1[2] * vec2[0] - vec1[0] * vec2[2],
      vec1[0] * vec2[1] - vec1[1] * vec2[0],
    ];
  }

  // vec1 * vec2
  static dot (vec1, vec2) {
    let sum = 0;
    vec1.forEach((v, i) => sum += v * vec2[i]);
    return sum;
  }
}

class Surface {
  constructor ({ color }) {
    this.color = color;
  }
}

class TriangleSurface extends Surface {
  constructor ({ color, vertices }) {
    super({ color });
    this.vertices = vertices;
    this.precompute();
  }

  precompute () {
    const [A, B, C] = this.vertices;
    
    // Basis vectors
    this.vec1 = Vector.sub(B, A);
    this.vec2 = Vector.sub(C, A);

    // Plane
    this.normal = Vector.normalize(Vector.cross(this.vec1, this.vec2));
    this.d = -Vector.dot(this.normal, A);
    this.plane = [...this.normal, this.d];

    // Dot products for point in triangle check
    this.dot11 = Vector.dot(this.vec1, this.vec1);
    this.dot12 = Vector.dot(this.vec1, this.vec2);
    this.dot22 = Vector.dot(this.vec2, this.vec2);
    this.invDenom = 1 / (this.dot11 * this.dot22 - this.dot12 * this.dot12);
  }

  rayIntersect (rayOrigin, rayDirection) {
    const denom = Vector.dot(this.normal, rayDirection);

    if (denom === 0) {
      // Ray is parallel to plane, thus no intersect
      return { t: null, p: null };
    }

    const t = -(Vector.dot(this.normal, rayOrigin) + this.d) / denom;

    if (t < 0) {
      return { t: null, p: null };
    }

    const p = Vector.add(rayOrigin, Vector.scale(rayDirection, t));

    if (this.containsPoint(p)) {
      return { t, p };
    } else {
      return { t: null, p: null };
    }
  }

  containsPoint (p) {
    const vec3 = Vector.sub(p, this.vertices[0]);

    // Compute dot products
    const dot13 = Vector.dot(this.vec1, vec3);
    const dot23 = Vector.dot(this.vec2, vec3);

    // Compute barycentric coordinates
    const u = (this.dot22 * dot13 - this.dot12 * dot23) * this.invDenom;
    const v = (this.dot11 * dot23 - this.dot12 * dot13) * this.invDenom;

    // Check if point is in triangle
    return (u >= 0) && (v >= 0) && (u + v < 1);
  }
}

class LightSource {
  constructor ({ pos }) {
    this.pos = pos;
  }
}

// Find the first surface that ray intersects
function rayHitSurface (rayOrigin, rayDirection, surfaces) {
  let result = { surface: null, t: Infinity, p: null };
  surfaces.forEach(surface => {
    const { t, p } = surface.rayIntersect(rayOrigin, rayDirection);
    if (t !== null && t < result.t) {
      result = { surface, t, p };
    }
  });
  return result;
}

// List of triangle surfaces
const surfaces = [
  new TriangleSurface({
    color: [1, 0, 0],
    vertices: [
      [-10, 10, 50],
      [-10, -10, 50],
      [10, -10, 40]
    ]
  }),
  new TriangleSurface({
    color: [0, 0, 1],
    vertices: [
      [10, 10, 50],
      [10, -10, 50],
      [-10, -10, 40]
    ]
  })
];

// List of light sources
const lights = [
  new LightSource({
    pos: [10, 10, 5]
  })
];

function render (ctx) {
  const { width, height } = ctx.canvas;
  const image = ctx.createImageData(width, height);
  const { data } = image;
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  // Field of view in radians
  const fov = Math.PI / 2;

  // Distance from camera to screen
  const dis = halfWidth / Math.tan(fov / 2);

  const cameraPos = [0, 0, 0];
  
  for (let screenY = 0; screenY < height; screenY++) {
    for (let screenX = 0; screenX < width; screenX++) {
      const x = screenX - halfWidth;
      const y = halfHeight - screenY;

      // Ray passing through camera (0, 0, 0) and pixel on screen
      const direction = Vector.normalize([x, y, dis]);

      // Find the first surface the ray hits
      const { surface, t, p } = rayHitSurface(cameraPos, direction, surfaces);

      if (surface === null) {
        continue;
      }

      const color = surface.color.map(v => v * 0xff);

      // Draw the pixel
      const index = 4 * (width * screenY + screenX);
      data[index + 0] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = 0xff;
    }
  }

  ctx.putImageData(image, 0, 0);
}

addEventListener("load", () => {
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext("2d");

  render(ctx);
});