
import { rayHitSurface, firstHitIs } from "./rays.js";

export class Vector3 {
  // vec1 + vec2
  static add (vec1, vec2) {
    return [
      vec1[0] + vec2[0],
      vec1[1] + vec2[1],
      vec1[2] + vec2[2],
    ];
  }

  static iadd (vec1, vec2) {
    vec1[0] += vec2[0];
    vec1[1] += vec2[1];
    vec1[2] += vec2[2];
  }

  // vec1 - vec2
  static sub (vec1, vec2) {
    return [
      vec1[0] - vec2[0],
      vec1[1] - vec2[1],
      vec1[2] - vec2[2],
    ];
  }

  static isub (vec1, vec2) {
    vec1[0] -= vec2[0];
    vec1[1] -= vec2[1];
    vec1[2] -= vec2[2];
  }

  // scalar * vec
  static scale (vec, scalar) {
    return [
      vec[0] * scalar,
      vec[1] * scalar,
      vec[2] * scalar,
    ];
  }

  static iscale (vec, scalar) {
    vec[0] *= scalar;
    vec[1] *= scalar;
    vec[2] *= scalar;
  }

  // get norm of vec
  static norm (vec) {
    return Math.sqrt(
      vec[0]**2
      + vec[1]**2
      + vec[2]**2
    );
  }

  // scale vec to norm 1
  static normalize (vec) {
    return Vector3.scale(vec, 1 / Vector3.norm(vec))
  }

  static inormalize (vec) {
    Vector3.iscale(vec, 1 / Vector3.norm(vec));
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
    return (
      vec1[0] * vec2[0]
      + vec1[1] * vec2[1]
      + vec1[2] * vec2[2]
    );
  }
}

export class Matrix {
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

export class Surface {
  constructor ({ color, glow, noShadow }) {
    this.color = color;
    this.glow = glow;
    this.noShadow = noShadow;
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

export class LightSource extends Tickable {
  constructor ({ pos, color, tick }) {
    super({ pos, tick });
    this.color = color;
    this.relPos = pos;
  }

  relative (pos, invmatrix) {
    this.relPos = Vector3.sub(this.pos, pos);

    this.relPos = Matrix.pmultiply(invmatrix, this.relPos);
  }
}

export class Scene {
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

export class Camera {
  constructor ({ pos, direction }) {
    this.pos = pos;
    this.fov = Math.PI / 2;

    this.cursorPos = [null, null];

    this.setDirection(direction);

    this.rebind = true;
  }

  bind (ctx) {
    this.ctx = ctx;
    const { width, height } = ctx.canvas;
    this.image = ctx.createImageData(width, height);
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

  render (scene) {
    if (this.rebind) {
      this.bind(this.ctx);
      this.rebind = false;
    }

    const { width, height } = this.ctx.canvas;
    const { data } = this.image;
    
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Distance from camera to screen
    const dis = halfWidth / Math.tan(this.fov / 2);
    
    // Get lights and surfaces
    const { drawables, lights } = scene;

    scene.relative(this.pos, this.invmatrix());

    const origin = [0, 0, 0];

    const direction = new Array(3);

    const [cursorX, cursorY] = this.cursorPos;
    const lock = document.pointerLockElement === this.ctx.canvas;

    let index = -4;
    
    for (let screenY = 0; screenY < height; screenY++) {
      for (let screenX = 0; screenX < width; screenX++) {
        const x = screenX - halfWidth;
        const y = halfHeight - screenY;

        // Pixel index
        index += 4;

        // Ray passing through camera (0, 0, 0) and pixel on screen
        direction[0] = x;
        direction[1] = y;
        direction[2] = dis;
        Vector3.inormalize(direction);

        // Find the first surface the ray hits
        const { surface, t, p, normal } = rayHitSurface(
          origin, direction, drawables);

        // Set pixel to black by default
        for (let i = 0; i < 3; i++) {
          data[index + i] = 0;
        }
        data[index + 3] = 0xff;

        if (surface === null) {
          continue;
        }

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
            data[index + i] = surface.color[i] * 0xff;
          }
          continue;
        }

        for (const light of lights) {
          const incoming = Vector3.sub(p, light.relPos);

          const norm = Vector3.norm(incoming);
          Vector3.iscale(incoming, 1 / norm); // Normalize

          if (!firstHitIs(light.relPos, incoming, drawables, surface)) {
            // Light is obstructed
            continue;
          }

          const dot = Vector3.dot(normal, incoming);

          if (dot > 0) {
            continue;
          }

          const b = -0xff * dot / norm**2; 

          for (let i = 0; i < 3; i++) {
            data[index + i] += surface.color[i] * b * light.color[i];
          }
        }
      }
    }

    this.ctx.putImageData(this.image, 0, 0);
  }
}

export class Drawable extends Tickable {
  constructor({ pos, surfaces, tick, transform }) {
    super({ pos, tick })
    this.pos = pos;
    this.surfaces = surfaces;
    this.transform = transform;
  }

  relative (pos, invmatrix) {
    const relPos = Vector3.sub(pos, this.pos);
    this.surfaces.forEach(surface => {
      surface.relative(relPos, invmatrix);
    });
  }
}

export class Animation {
  static circle ({ r, speed }) {
    return (obj, t) => {
      const p = speed * t / 1000;
      const delta = [Math.cos(p), 0, -Math.sin(p)];
      obj.pos = Vector3.add(obj.origPos, Vector3.scale(delta, r));
    }
  }
}