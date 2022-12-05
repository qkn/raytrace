
class Vector {
  // vec1 + vec2
  static add (vec1, vec2) {
    return vec1.map((v, i) => vec2[i] + v);
  }

  // vec1 - vec2
  static sub (vec1, vec2) {
    return vec1.map((v, i) => v - vec2[i]);
  }

  // scalar * vec
  static scale (vec, scalar) {
    return vec.map(v => scalar * v);
  }

  // get norm of vec
  static norm (vec) {
    return Math.hypot(...vec);
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

  // vec1 . vec2
  static dot (vec1, vec2) {
    let sum = 0;
    vec1.forEach((v, i) => sum += v * vec2[i]);
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
  constructor ({ color }) {
    this.color = color;
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
    const vec3 = Vector.sub(p, this.relVertices[0]);

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
    this.relPos = pos;
  }

  relative (pos, invmatrix) {
    this.relPos = Vector.sub(this.pos, pos);

    this.relPos = Matrix.pmultiply(invmatrix, this.relPos);
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

class Scene {
  constructor ({ surfaces, lights }) {
    this.surfaces = surfaces;
    this.lights = lights;
  }

  relative (pos, invmatrix) {
    this.surfaces.forEach(surface => surface.relative(pos, invmatrix));
    this.lights.forEach(light => light.relative(pos, invmatrix));
  }
}

class Camera {
  constructor ({ ctx, pos, direction }) {
    this.ctx = ctx;
    this.pos = pos;

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
      Matrix.pitch(this.pitch),
      Matrix.yaw(this.yaw)
    );
  }

  invmatrix () {
    return Matrix.multiply(
      Matrix.yaw(-this.yaw),
      Matrix.pitch(-this.pitch)
    );
  }

  render (scene) {
    const { width, height } = this.ctx.canvas;
    const image = this.ctx.createImageData(width, height);
    const { data } = image;
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Field of view in radians
    const fov = Math.PI / 2;

    // Distance from camera to screen
    const dis = halfWidth / Math.tan(fov / 2);

    scene.relative(this.pos, this.invmatrix());
    const { surfaces, lights } = scene;

    const origin = [0, 0, 0];
    
    for (let screenY = 0; screenY < height; screenY++) {
      for (let screenX = 0; screenX < width; screenX++) {
        const x = screenX - halfWidth;
        const y = halfHeight - screenY;

        // Ray passing through camera (0, 0, 0) and pixel on screen
        const direction = Vector.normalize([x, y, dis]);

        // Find the first surface the ray hits
        const { surface, t, p } = rayHitSurface(origin, direction, surfaces);

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

    this.ctx.putImageData(image, 0, 0);
  }
}

addEventListener("load", () => {
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext("2d");

  const surfaces = [
    new TriangleSurface({
      color: [1, 0, 0],
      vertices: [
        [-10, 10, 10],
        [-10, -10, 10],
        [10, -10, -10]
      ]
    }),
    new TriangleSurface({
      color: [0, 0, 1],
      vertices: [
        [10, 10, 10],
        [10, -10, 10],
        [-10, -10, -10]
      ]
    }),
    new TriangleSurface({
      color: [0, 1, 0],
      vertices: [
        [-10, -10, -10],
        [-10, -10, 10],
        [10, -10, -10]
      ]
    }),
    new TriangleSurface({
      color: [0, 1, 0],
      vertices: [
        [10, -10, 10],
        [10, -10, -10],
        [-10, -10, -10]
      ]
    })
  ];

  const lights = [
    new LightSource({
      pos: [10, 10, 5]
    })
  ];

  const scene = new Scene({
    surfaces,
    lights
  });

  const camera = new Camera({
    ctx,
    pos: [0, 0, -30],
    direction: [0, 0, 1]
  });

  camera.render(scene);

  // for easy debug
  window.scene = scene;
  window.camera = camera;
  console.log(camera);
});