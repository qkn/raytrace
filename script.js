
class Vector {
  // vec1 + vec2
  static add (vec1, vec2) {
    let result = new Array(vec1.length);
    for (let i = 0; i < vec1.length; i++) {
      result[i] = vec1[i] + vec2[i];
    }
    return result;
  }

  static iadd (vec1, vec2) {
    for (let i = 0; i < vec1.length; i++) {
      vec1[i] = vec1[i] + vec2[i];
    }
  }

  // vec1 - vec2
  static sub (vec1, vec2) {
    let result = new Array(vec1.length);
    for (let i = 0; i < vec1.length; i++) {
      result[i] = vec1[i] - vec2[i];
    }
    return result;
  }

  // scalar * vec
  static scale (vec, scalar) {
    let result = new Array(vec.length);
    for (let i = 0; i < vec.length; i++) {
      result[i] = scalar * vec[i];
    }
    return result;
  }

  static iscale (vec, scalar) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] = scalar * vec[i];
    }
  }

  // get norm of vec
  static norm (vec) {
    let sum = 0;
    for (let i = 0; i < vec.length; i++) {
      sum += vec[i] ** 2;
    }
    return Math.sqrt(sum);
  }

  // scale vec to norm 1
  static normalize (vec) {
    return Vector.scale(vec, 1 / Vector.norm(vec))
  }

  static inormalize (vec) {
    Vector.iscale(vec, 1 / Vector.norm(vec));
  }

  // vec1 x vec2
  static cross (vec1, vec2) {
    return [
      vec1[1] * vec2[2] - vec1[2] * vec2[1],
      vec1[2] * vec2[0] - vec1[0] * vec2[2],
      vec1[0] * vec2[1] - vec1[1] * vec2[0],
    ];
  }

  // vec1 . vec2
  static dot (vec1, vec2) {
    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      sum += vec1[i] * vec2[i];
    }
    return sum;
  }
}

class Matrix {
  // matrix * matrix
  static multiply (mat1, mat2) {
    let result = [];

    for (let i = 0; i < mat1.length; i++) {
      result[i] = [];
      for (let j = 0; j < mat2[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < mat1[0].length; k++) {
          sum += mat1[i][k] * mat2[k][j];
        }
        result[i][j] = sum;
      }
    }

    return result;
  }

  // matrix x point
  static pmultiply (mat, p) {
    let result = [];

    const m = mat.length;
    const n = mat[0].length;

    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += p[j] * mat[i][j];
      }
      result[i] = sum;
    }

    return result;
  }

  static yaw (yaw) {
    return [
      [Math.cos(yaw), 0, Math.sin(yaw)],
      [0, 1, 0],
      [-Math.sin(yaw), 0, Math.cos(yaw)]
    ];
  }

  static pitch (pitch) {
    return [
      [1, 0, 0],
      [0, Math.cos(-pitch), -Math.sin(-pitch)],
      [0, Math.sin(-pitch), Math.cos(-pitch)]
    ];
  }
}

class Surface {
  constructor ({ color, glow, noShadow }) {
    this.color = color;
    this.glow = glow;
    this.noShadow = noShadow;
  }
}

class TriangleSurface extends Surface {
  constructor ({ color, vertices }) {
    super({ color });
    this.vertices = vertices;
    this.relVertices = vertices;
  }

  relative (pos, invmatrix) {
    this.relVertices = this.vertices.map(
      vertex => Vector.sub(vertex, pos));
    
    this.relVertices = this.relVertices.map(
      vertex => Matrix.pmultiply(invmatrix, vertex));

    this.precompute();
  }

  precompute () {
    const [A, B, C] = this.relVertices;
    
    // Basis vectors
    this.vec1 = Vector.sub(B, A);
    this.vec2 = Vector.sub(C, A);

    // Plane
    this.normal = Vector.normalize(Vector.cross(this.vec1, this.vec2));
    this.negNormal = Vector.scale(this.normal, -1);
    this.d = -Vector.dot(this.normal, A);
    this.plane = [...this.normal, this.d];

    // Dot products for point in triangle check
    this.dot11 = Vector.dot(this.vec1, this.vec1);
    this.dot12 = Vector.dot(this.vec1, this.vec2);
    this.dot22 = Vector.dot(this.vec2, this.vec2);
    this.invDenom = 1 / (this.dot11 * this.dot22 - this.dot12 * this.dot12);
  }

  rayIntersect (rayOrigin, rayDirection, planeOnly=false) {
    const denom = Vector.dot(this.normal, rayDirection);

    if (denom === 0) {
      // Ray is parallel to plane, thus no intersect
      return null;
    }

    const t = -(Vector.dot(this.normal, rayOrigin) + this.d) / denom;

    if (t < 0) {
      return null;
    }

    const p = Vector.add(rayOrigin, Vector.scale(rayDirection, t));

    if (planeOnly || this.containsPoint(p)) {
      return { t, p, normal: denom > 0 ? this.negNormal : this.normal };
    } else {
      return null;
    }
  }

  containsPoint (p) {
    const vec3 = Vector.sub(p, this.relVertices[0]);

    // Compute dot products
    const dot13 = Vector.dot(this.vec1, vec3);
    const dot23 = Vector.dot(this.vec2, vec3);

    // Compute barycentric coordinates
    const u = (this.dot22 * dot13 - this.dot12 * dot23) * this.invDenom;
    const v = (this.dot11 * dot23 - this.dot12 * dot13) * this.invDenom;

    // Check if point is in triangle
    return (
      (u >= -Number.EPSILON)
      && (v >= -Number.EPSILON)
      && (u + v <= 1 + Number.EPSILON)
    );
  }
}

class SphereSurface extends Surface {
  constructor ({ color, pos, r, glow, noShadow }) {
    super({ color, glow, noShadow });
    this.pos = pos;
    this.relPos = pos;
    this.r = r;
    this.r2 = r ** 2;
  }

  rayIntersect (rayOrigin, rayDirection) {
    // Make sphere center the new origin
    const relOrigin = Vector.sub(rayOrigin, this.relPos);

    if (Math.abs(Vector.norm(rayDirection) - 1) > 0.1) {
      alert(Vector.norm(rayDirection));
    }
    const bHalf = Vector.dot(relOrigin, rayDirection);
    const c = Vector.norm(relOrigin) ** 2 - this.r2;

    const discrim = bHalf**2 - c;

    if (discrim < 0) {
      return null;
    }
    
    const root = Math.sqrt(discrim);

    const t1 = -bHalf - root;

    if (t1 > 0) {
      const p = Vector.add(rayOrigin, Vector.scale(rayDirection, t1));
      const normal = Vector.sub(p, this.relPos);
      Vector.inormalize(normal);

      return { t: t1, p, normal };
    }

    const t2 = -bHalf + root;

    if (t2 > 0) {
      const p = Vector.add(rayOrigin, Vector.scale(rayDirection, t2));
      const normal = Vector.sub(this.relPos, p);
      Vector.inormalize(normal);

      return { t: t2, p, normal };
    }
    
    return null;
  }

  relative (pos, invmatrix) {
    this.relPos = Vector.sub(this.pos, pos);

    this.relPos = Matrix.pmultiply(invmatrix, this.relPos);
  }
}

class CylinderSurface extends Surface {
  constructor ({ pos, color, r, height }) {
    super({ color });
    this.pos = pos;
    this.relPos = pos;
    this.r = r;
    this.r2 = r ** 2;
    this.height = height;
    this.end = Vector.add(pos, [0, height, 0]);
    this.relEnd = this.end;
  }

  rayIntersect (rayOrigin, rayDirection) {
    // Make sphere center the new origin
    const relOrigin = Vector.sub(rayOrigin, this.relPos);

    const [x0, y0, z0] = relOrigin;
    const [xd, yd, zd] = rayDirection;

    const dot1 = Vector.dot(this.relAxis, rayDirection);
    const dot2 = Vector.dot(this.relAxis, relOrigin);

    const a = xd ** 2 + yd ** 2 + zd ** 2 - dot1 ** 2;
    const bHalf = x0 * xd + y0 * yd + z0 * zd - dot2 * dot1;
    const c = x0 ** 2 + y0 ** 2 + z0 ** 2 - dot2 ** 2 - this.r2;

    const discrim = bHalf**2 - a * c;

    if (discrim < 0) {
      return null;
    }

    const root = Math.sqrt(discrim);

    const t1 = (-bHalf - root) / a;
    const t2 = (-bHalf + root) / a;

    if (t1 < 0 && t2 < 0) {
      return null;
    }

    const p1 = Vector.add(rayOrigin, Vector.scale(rayDirection, t1));
    const c1 = Vector.sub(p1, this.relPos);
    const d1 = Vector.dot(this.relAxis, c1);

    if (d1 > 0 && d1 < this.height) {
      const offset = Vector.add(this.relPos, Vector.scale(this.relAxis, d1));
      const normal = Vector.sub(p1, offset);
      Vector.inormalize(normal);

      return { t: t1, p: p1, normal };
    }

    const p2 = Vector.add(rayOrigin, Vector.scale(rayDirection, t2));
    const c2 = Vector.sub(p2, this.relPos);
    const d2 = Vector.dot(this.relAxis, c2);

    if (d2 > 0 && d2 < this.height) {
      const offset = Vector.add(this.relPos, Vector.scale(this.relAxis, d2));
      const normal = Vector.sub(offset, p2);
      Vector.inormalize(normal);

      return { t: t2, p: p2, normal }; 
    }

    return null;
  }

  relative (pos, invmatrix) {
    this.relPos = Vector.sub(this.pos, pos);
    this.relPos = Matrix.pmultiply(invmatrix, this.relPos);

    this.relEnd = Vector.sub(this.end, pos);
    this.relEnd = Matrix.pmultiply(invmatrix, this.relEnd);

    this.relAxis = Vector.sub(this.relEnd, this.relPos);
    Vector.inormalize(this.relAxis);
  }
}

class Tickable {
  constructor ({ pos, tick }) {
    this.pos = pos;
    this.origPos = pos.slice();
    if (tick !== undefined) {
      this.tick = (t) => tick(this, t);
    }
  }

  tick (t) {

  }
}

class LightSource extends Tickable {
  constructor ({ pos, color, tick }) {
    super({ pos, tick });
    this.color = color;
    this.relPos = pos;
  }

  relative (pos, invmatrix) {
    this.relPos = Vector.sub(this.pos, pos);

    this.relPos = Matrix.pmultiply(invmatrix, this.relPos);
  }
}

// Find the first surface that ray intersects
function rayHitSurface (rayOrigin, rayDirection, drawables) {
  const result = {
    surface: null,
    t: Infinity,
    p: null,
    normal: null
  }

  for (const drawable of drawables) {
    for (const surface of drawable.surfaces) {
      const hit = surface.rayIntersect(rayOrigin, rayDirection);
      if (hit !== null && hit.t < result.t) {
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
  const hit0 = target.rayIntersect(rayOrigin, rayDirection, true);

  if (hit0 === null) {
    return false;
  }

  const t0 = hit0.t;

  for (const drawable of drawables) {
    for (const surface of drawable.surfaces) {
      if (surface === target || surface.noShadow) {
        continue;
      }
      const hit = surface.rayIntersect(rayOrigin, rayDirection);
      if (hit !== null && hit.t < t0) {
        return false;
      }
    }
  }

  return true;
}

class Scene {
  constructor ({ drawables, lights }) {
    this.drawables = drawables;
    this.lights = lights;
  }

  relative (pos, invmatrix) {
    this.drawables.forEach(drawable => drawable.relative(pos, invmatrix));
    this.lights.forEach(light => light.relative(pos, invmatrix));
  }

  tick (t) {
    for (const light of this.lights) {
      light.tick(t);
    }
    for (const drawable of this.drawables) {
      drawable.tick(t);
    }
  }
}

class Camera {
  constructor ({ pos, direction }) {
    this.pos = pos;
    this.fov = Math.PI / 2;

    this.cursorPos = [null, null];

    this.setDirection(direction);
  }

  setDirection (direction) {
    this.direction = direction;
    const [x, y, z] = direction;
    this.yaw = Math.atan2(x, z);
    this.pitch = Math.atan2(y, Math.hypot(x, z));
  }

  setRotation (yaw, pitch) {
    this.yaw = yaw;
    this.pitch = pitch;
    this.direction = Matrix.pmultiply(this.matrix(), [0, 0, 1]);
  }
  
  matrix () {
    return Matrix.multiply(
      Matrix.yaw(this.yaw),
      Matrix.pitch(this.pitch)
    );
  }

  invmatrix () {
    return Matrix.multiply(
      Matrix.pitch(-this.pitch),
      Matrix.yaw(-this.yaw)
    );
  }

  render (ctx, scene) {
    const { width, height } = ctx.canvas;
    const image = ctx.createImageData(width, height);
    const { data } = image;
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Distance from camera to screen
    const dis = halfWidth / Math.tan(this.fov / 2);
    
    // Get lights and surfaces
    const { drawables, lights } = scene;

    scene.relative(this.pos, this.invmatrix());

    const origin = [0, 0, 0];

    const direction = new Array(3);

    const [cursorX, cursorY] = camera.cursorPos;
    const lock = document.pointerLockElement === ctx.canvas;
    
    for (let screenY = 0; screenY < height; screenY++) {
      for (let screenX = 0; screenX < width; screenX++) {
        const x = screenX - halfWidth;
        const y = halfHeight - screenY;

        // Ray passing through camera (0, 0, 0) and pixel on screen
        direction[0] = x;
        direction[1] = y;
        direction[2] = dis;
        Vector.inormalize(direction);

        // Find the first surface the ray hits
        const { surface, t, p, normal } = rayHitSurface(
          origin, direction, drawables);

        if (surface === null) {
          continue;
        }

        // Draw the pixel
        const index = 4 * (width * screenY + screenX);
        data[index + 3] = 0xff;

        if (!lock && cursorX === screenX && cursorY === screenY) {
          if (this.surfaceDisplay !== undefined) {
            this.surfaceDisplay.innerText = JSON.stringify({
              normal
            });

            data[index] = 0xff;
            continue;
          }
        }

        if (surface.glow) {
          for (let i = 0; i < 3; i++) {
            data[index + i] += surface.color[i] * 0xff;
          }
          continue;
        }

        for (const light of lights) {
          const incoming = Vector.sub(p, light.relPos);

          const norm = Vector.norm(incoming);
          Vector.iscale(incoming, 1 / norm); // Normalize

          if (!firstHitIs(light.relPos, incoming, drawables, surface)) {
            // Light is obstructed
            continue;
          }

          const b = -Vector.dot(normal, incoming) / norm**2;

          if (b < 0) {
            continue;
          }

          for (let i = 0; i < 3; i++) {
            data[index + i] += surface.color[i] * 0xff * b * light.color[i];
          }
        }
      }
    }

    ctx.putImageData(image, 0, 0);
  }
}

class Drawable extends Tickable {
  constructor({ pos, surfaces, tick, transform }) {
    super({ pos, tick })
    this.pos = pos;
    this.surfaces = surfaces;
    this.transform = transform;
  }

  relative (pos, invmatrix) {
    const relPos = Vector.sub(pos, this.pos);
    this.surfaces.forEach(surface => {
      surface.relative(relPos, invmatrix);
    });
  }
}

class Ball extends Drawable {
  constructor ({ pos, r, color, tick, transform, glow, noShadow }) {
    super({
      pos,
      tick,
      transform,
      surfaces: [
        new SphereSurface({
          color,
          pos: [0, 0, 0],
          r,
          glow,
          noShadow
        })
      ]
    });
    this.r = r;
    this.color = color;
  }
}

class Cylinder extends Drawable {
  constructor({ pos, color, r, height, tick, transform }) {
    super({
      pos,
      tick,
      transform,
      surfaces: [
        new CylinderSurface({
          pos: [0, 0, 0],
          color,
          r,
          height
        })
      ]
    });
    this.r = r;
    this.color = color;
    this.height = height;
  }
}

class Ramp extends Drawable {
  constructor ({ pos, color, tick, transform }) {
    super({
      pos,
      tick,
      transform,
      surfaces: [
        new TriangleSurface({
          color,
          vertices: [
            [-5, 10, 10],
            [-5, -10, -10],
            [5, 10, 10]
          ]
        }),
        new TriangleSurface({
          color,
          vertices: [
            [5, 10, 10],
            [-5, -10, -10],
            [5, -10, -10]
          ]
        }),
        new TriangleSurface({
          color,
          vertices: [
            [5, 10, 10],
            [5, -10, 10],
            [5, -10, -10]
          ]
        }),
        new TriangleSurface({
          color,
          vertices: [
            [-5, 10, 10],
            [-5, -10, 10],
            [-5, -10, -10]
          ]
        })
      ]
    });
    this.color = color;
  }
}

class House extends Drawable {
  constructor ({ pos, tick, transform }) {
    let i = 0;
    const colors = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0]
    ];
    const color = () => {
      i++;
      return colors[i % colors.length];
    };
    super({
      pos,
      tick,
      transform,
      surfaces: [
        // Roof
        new TriangleSurface({
          color: color(),
          vertices: [
            [0, 30, 0],
            [-20, 20, -20],
            [20, 20, -20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [0, 30, 0],
            [-20, 20, 20],
            [20, 20, 20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [0, 30, 0],
            [20, 20, -20],
            [20, 20, 20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [0, 30, 0],
            [-20, 20, -20],
            [-20, 20, 20]
          ]
        }),
        // Door side
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 20, -20],
            [-20, 0, -20],
            [-5, 0, -20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 20, -20],
            [-5, 20, -20],
            [-5, 0, -20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 20, -20],
            [20, 0, -20],
            [5, 0, -20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 20, -20],
            [5, 20, -20],
            [5, 0, -20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [5, 20, -20],
            [-5, 20, -20],
            [-5, 15, -20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-5, 15, -20],
            [5, 15, -20],
            [5, 20, -20]
          ]
        }),
        // Back side
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 20, 20],
            [-20, 0, 20],
            [-5, 0, 20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 20, 20],
            [-5, 20, 20],
            [-5, 0, 20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 20, 20],
            [20, 0, 20],
            [5, 0, 20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 20, 20],
            [5, 20, 20],
            [5, 0, 20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [5, 20, 20],
            [-5, 20, 20],
            [-5, 15, 20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-5, 15, 20],
            [5, 15, 20],
            [5, 20, 20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [5, 5, 20],
            [-5, 5, 20],
            [-5, 0, 20]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-5, 0, 20],
            [5, 0, 20],
            [5, 5, 20]
          ]
        }),
        // Right side
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 20, -20],
            [20, 0, -20],
            [20, 0, -5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 20, -20],
            [20, 20, -5],
            [20, 0, -5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 20, 20],
            [20, 0, 20],
            [20, 0, 5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 20, 20],
            [20, 20, 5],
            [20, 0, 5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 20, 5],
            [20, 20, -5],
            [20, 15, -5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 15, -5],
            [20, 15, 5],
            [20, 20, 5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 5, 5],
            [20, 5, -5],
            [20, 0, -5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [20, 0, -5],
            [20, 0, 5],
            [20, 5, 5]
          ]
        }),
        // Left side
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 20, -20],
            [-20, 0, -20],
            [-20, 0, -5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 20, -20],
            [-20, 20, -5],
            [-20, 0, -5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 20, 20],
            [-20, 0, 20],
            [-20, 0, 5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 20, 20],
            [-20, 20, 5],
            [-20, 0, 5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 20, 5],
            [-20, 20, -5],
            [-20, 15, -5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 15, -5],
            [-20, 15, 5],
            [-20, 20, 5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 5, 5],
            [-20, 5, -5],
            [-20, 0, -5]
          ]
        }),
        new TriangleSurface({
          color: color(),
          vertices: [
            [-20, 0, -5],
            [-20, 0, 5],
            [-20, 5, 5]
          ]
        }),
      ]
    });
  }
}

class Animation {
  static circle ({ r, speed }) {
    return (obj, t) => {
      const p = speed * t / 1000;
      const delta = [Math.cos(p), 0, -Math.sin(p)];
      obj.pos = Vector.add(obj.origPos, Vector.scale(delta, r));
    }
  }
}

const drawables1 = [
  new Ramp({
    pos: [0, 0, 10],
    color: [0, 1, 0]
  }),
  new Ramp({
    pos: [20, 0, 10],
    color: [1, 0, 0]
  }),
  new Ball({
    pos: [0, 0, 10],
    color: [0, 0, 1],
    r: 5
  }),
  new Ball({
    pos: [0, 10, -5],
    color: [1, 1, 0.8],
    r: 1,
    tick: Animation.circle({ r: 20, speed: 1 }),
    glow: true,
    noShadow: true
  }),
  new Ball({
    pos: [10, 20, -30],
    color: [1, 1, 0.8],
    r: 1,
    glow: true,
    noShadow: true
  }),
  new Cylinder({
    pos: [20, -10, -10],
    color: [0, 0.5, 0.5],
    r: 5,
    height: 10,
    transform: [
      [1, 0, 0],
      [0, 5, 0],
      [0, 0, 1]
    ]
  }),
  new Drawable({
    pos: [0, 0, 0],
    surfaces: [
      new TriangleSurface({
        color: [0, 0, 1],
        vertices: [
          [-50, -10, -50],
          [50, -10, -50],
          [-50, -10, 50]
        ]
      }),
      new TriangleSurface({
        color: [0, 0, 1],
        vertices: [
          [-50, -10, 50],
          [50, -10, -50],
          [50, -10, 50]
        ]
      })
    ]
  })
];

const drawables2 = [
  new Drawable({
    pos: [0, 0, 0],
    surfaces: [
      new TriangleSurface({
        color: [0.6, 0.4, 0.2],
        vertices: [
          [-50, -10, -50],
          [50, -10, -50],
          [-50, -10, 50]
        ]
      }),
      new TriangleSurface({
        color: [0.2, 0.4, 0.6],
        vertices: [
          [-50, -10, 50],
          [50, -10, -50],
          [50, -10, 50]
        ]
      })
    ]
  }),
  new House({
    pos: [0, -10, 0]
  }),
  new Ball({
    pos: [0, 0, 0],
    r: 2,
    color: [1, 0, 1]
  }),
  new Ball({
    pos: [0, 5, 0],
    r: 1,
    color: [1, 1, 0.8],
    tick: Animation.circle({ r: 8, speed: 1 }),
    glow: true,
    noShadow: true
  }),
  new Cylinder({
    pos: [-10, -10, -10],
    r: 3,
    height: 5,
    color: [0.7, 0.9, 0.7]
  })
];

const lights1 = [
  new LightSource({
    pos: [0, 20, 0],
    color: [500, 500, 500],
    tick: Animation.circle({ r: 20, speed: 1 })
  }),
  new LightSource({
    pos: [10, 20, -30],
    color: [500, 500, 500],
  })
];

const lights2 = [
  new LightSource({
    pos: [0, 5, 0],
    color: [80, 80, 80],
    tick: Animation.circle({ r: 8, speed: 5 })
  }),
  new LightSource({
    pos: [0, 50, 0],
    color: [1000, 1000, 1000],
  }),
  new LightSource({
    pos: [-60, 20, -60],
    color: [1000, 1000, 1000],
  }),
];

const scene = new Scene({
  drawables: drawables1,
  lights: lights1
});

const camera = new Camera({
  pos: [0, 0, -40],
  direction: [0, 0, 1]
});

// Camera movement
const inputs = new Set();
const cache = new Set();
const pressed = (key) => cache.has(key) ? 1 : 0;
const speed = 0.04;

// fps
let t0 = 0;
let stats0 = 0;
const times = [];

// tick
let realtime = true;
let timestep = 1000 / 30;
let t2 = 0;

addEventListener("keydown", (ev) => {
  cache.add(ev.key);
  inputs.add(ev.key);
});

addEventListener("keyup", (ev) => {
  inputs.delete(ev.key);
});

addEventListener("blur", () => {
  inputs.forEach(key => {
    inputs.delete(key);
  });
});

function startRecording (canvas) {
  const chunks = [];
  const stream = canvas.captureStream();
  const rec = new MediaRecorder(stream);
  rec.addEventListener("dataavailable", (e) => {
    chunks.push(e.data);
  });
  rec.start();
  return { rec, chunks };
}

function exportVideo (link, blob) {
  const src = URL.createObjectURL(blob);
  link.download = "recording.webm";
  link.href = src;
}

addEventListener("load", () => {
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext("2d");

  camera.surfaceDisplay = document.getElementById("surface-display");

  const fpsCounter = document.getElementById("fps-counter");
  const fovCounter = document.getElementById("fov-counter");
  const resCounter = document.getElementById("res-counter");
  const fovInput = document.getElementById("fov-input");
  const resInput = document.getElementById("res-input");
  const recBtn = document.getElementById("rec-btn");
  const recLink = document.getElementById("rec-link");
  const realtimeInput = document.getElementById("realtime-input");

  fovInput.addEventListener("input", (ev) => {
    const { value } = ev.target;
    const radians = value * Math.PI / 180;
    camera.fov = radians;
    fovCounter.innerText = value;
  });
  
  resInput.addEventListener("input", (ev) => {
    const { value } = ev.target;
    canvas.width = value;
    canvas.height = value;
    resCounter.innerText = value;
  });

  recBtn.addEventListener("click", () => {
    if (recBtn.rec) {

      recBtn.rec.addEventListener("stop", () => {
        exportVideo(
          recLink,
          new Blob(recBtn.chunks, { type: "video/webm" })
        );
      });

      recBtn.rec.stop();
      recBtn.rec = undefined;
      recLink.innerText = "download";
      recBtn.value = "start";

    } else {

      const { rec, chunks } = startRecording(canvas);
      recBtn.rec = rec;
      recBtn.chunks = chunks;
      recBtn.value = "stop";
      recLink.innerText = "";

    }
  });

  realtimeInput.addEventListener("change", (ev) => {
    realtime = ev.target.checked;
  });

  canvas.addEventListener("mousemove", (ev) => {
    if (document.pointerLockElement !== canvas) {
      const scale = canvas.width / canvas.clientWidth;
      camera.cursorPos = [
        Math.round(ev.offsetX * scale),
        Math.round(ev.offsetY * scale)
      ];
      return;
    }
    
    const step = 0.08;
  
    const dx = ev.movementX * step;
    const dy = ev.movementY * step;
  
    camera.setRotation(
      (camera.yaw + dx * step) % (2 * Math.PI),
      (camera.pitch - dy * step) % (2 * Math.PI)
    );
  });

  function animate (t) {
    const dt = realtime ? Math.min(t - t0, 100) : timestep;
    t0 = t;
    t2 += dt;

    if (t - stats0 > 500) {
      while (times.length > 0 && times[0] <= t - 1000) {
        times.shift();
      }
  
      fpsCounter.innerText = times.length || "<1";
      stats0 = t;
    }

    times.push(t);

    const translate = [
      pressed("d") - pressed("a"),
      pressed(" ") - pressed("Shift"),
      pressed("w") - pressed("s")
    ];

    cache.forEach(key => {
      if (!inputs.has(key)) {
        cache.delete(key);
      }
    });

    const mat = Matrix.yaw(camera.yaw);
    const delta = Matrix.pmultiply(mat, translate);
    
    if (Vector.norm(delta) !== 0) {
      Vector.inormalize(delta);
      Vector.iadd(camera.pos, Vector.scale(delta, speed * dt));
    }

    scene.tick(realtime ? t : t2);

    camera.render(ctx, scene);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });
});