
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
      return null;
    }

    const t = -(Vector.dot(this.normal, rayOrigin) + this.d) / denom;

    if (t < 0) {
      return null;
    }

    const p = Vector.add(rayOrigin, Vector.scale(rayDirection, t));

    if (this.containsPoint(p)) {
      return { t, p, normal: this.normal };
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
    return (u >= 0) && (v >= 0) && (u + v < 1);
  }
}

class SphereSurface extends Surface {
  constructor ({ color, pos, r }) {
    super({ color });
    this.pos = pos;
    this.relPos = pos;
    this.r = r;

    this.r2 = r ** 2;
  }

  rayIntersect (rayOrigin, rayDirection) {
    // Make sphere center the new origin
    const relOrigin = Vector.sub(rayOrigin, this.relPos);

    const [x0, y0, z0] = relOrigin;
    const [xd, yd, zd] = rayDirection;

    const a = xd**2 + yd**2 + zd**2;
    const b = 2 * (x0*xd + y0*yd + z0*zd);
    const c = x0**2 + y0**2 + z0**2 - this.r2;

    const discrim = b**2 - 4 * a * c;

    if (discrim < 0) {
      return null;
    }

    const t = (-b - Math.sqrt(discrim)) / (2 * a);

    if (t < 0) {
      return null;
    }

    const p = Vector.add(rayOrigin, Vector.scale(rayDirection, t));

    const normal = Vector.sub(p, this.relPos);
    Vector.inormalize(normal);

    return { t, p, normal };
  }

  relative (pos, invmatrix) {
    this.relPos = Vector.sub(this.pos, pos);

    this.relPos = Matrix.pmultiply(invmatrix, this.relPos);
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
  const result = {
    surface: null,
    t: Infinity,
    p: null,
    normal: null
  }

  for (let i = 0; i < surfaces.length; i++) {
    const s = surfaces[i];
    const hit = s.rayIntersect(rayOrigin, rayDirection);
    if (hit !== null && hit.t < result.t) {
      result.surface = s;
      result.t = hit.t;
      result.p = hit.p;
      result.normal = hit.normal;
    }
  }

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
  constructor ({ pos, direction }) {
    this.pos = pos;
    this.fov = Math.PI / 2;

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

    scene.relative(this.pos, this.invmatrix());
    const { surfaces, lights } = scene;

    const origin = [0, 0, 0];

    const direction = new Array(3);
    const color = new Array(3);
    
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
          origin, direction, surfaces);

        if (surface === null) {
          continue;
        }

        Vector.inormalize(p);
        const b = Math.abs(Vector.dot(normal, p));

        for (let i = 0; i < 3; i++) {
          color[i] = surface.color[i] * 0xff * b;
        }

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
}

const surfaces = [
  new TriangleSurface({
    color: [0, 1, 0],
    vertices: [
      [20, 10, 10],
      [30, 10, 10],
      [20, -10, -10]
    ]
  }),
  new TriangleSurface({
    color: [0, 1, 0],
    vertices: [
      [30, 10, 10],
      [30, -10, -10],
      [20, -10, -10]
    ]
  }),
  new TriangleSurface({
    color: [0, 1, 0],
    vertices: [
      [30, 10, 10],
      [30, -10, 10],
      [30, -10, -10]
    ]
  }),
  new TriangleSurface({
    color: [0, 1, 0],
    vertices: [
      [20, 10, 10],
      [20, -10, 10],
      [20, -10, -10]
    ]
  })
];

const lights = [
  new LightSource({
    pos: [-10, 0, 0]
  })
];

const scene = new Scene({
  surfaces,
  lights
});

const camera = new Camera({
  pos: [0, 0, -30],
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

addEventListener("load", () => {
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext("2d");

  const fpsCounter = document.getElementById("fps-counter");
  const fovCounter = document.getElementById("fov-counter");
  const resCounter = document.getElementById("res-counter");

  document.getElementById("fov-input").addEventListener("input", (ev) => {
    const { value } = ev.target;
    const radians = value * Math.PI / 180;
    camera.fov = radians;
    fovCounter.innerText = value;
  });
  
  document.getElementById("res-input").addEventListener("input", (ev) => {
    const { value } = ev.target;
    canvas.width = value;
    canvas.height = value;
    resCounter.innerText = value;
  });

  addEventListener("mousemove", (ev) => {
    if (document.pointerLockElement !== canvas) {
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
    const dt = Math.min(t - t0, 100);
    t0 = t;
    times.push(t);

    if (t - stats0 > 500) {
      while (times.length > 0 && times[0] <= t - 1000) {
        times.shift();
      }
  
      fpsCounter.innerText = times.length;
      stats0 = t;
    }

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

    camera.render(ctx, scene);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });
});