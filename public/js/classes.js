
const FLOATS_PER_SURFACE = 26;

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
    this.surfaceType = -1;
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
    this.preallocDrawables();
    this.preallocLights();
  }

  preallocDrawables () {
    const { drawables } = this;

    let numSurfaces = 0;

    for (let d = 0; d < drawables.length; d++) {
      numSurfaces += drawables[d].surfaces.length;
    }

    // Pad with zero-bytes so that floats line up
    const padding = 4 - numSurfaces % 4;

    /*
    Triangles are represented by FLOATS_PER_SURFACE floats
    1x uint8 (1B) + (FLOATS_PER_SURFACE)x float32 (4B)
    Additional 4B for meta followed by padding at start
    */
    const bytesPerSurface = 1 + 4 * FLOATS_PER_SURFACE;
    const buffer = new SharedArrayBuffer(4 + padding + bytesPerSurface * numSurfaces);

    // Array of surfaceType
    const types = new Int8Array(buffer, 4 + padding);

    // The number of surfaces
    const meta = new Uint32Array(buffer);
    const offset = 4 + padding + numSurfaces;
    meta[0] = numSurfaces;

    let i = 0;

    for (let d = 0; d < drawables.length; d++) {
      const surfaces = drawables[d].surfaces;
      for (let s = 0; s < surfaces.length; s++) {
        const surface = surfaces[s];
        types[i] = surface.surfaceType;
        i++;
      }
    }

    this.surfacesBuffer = buffer;
    this.surfacesOffset = offset;
  }

  preallocLights () {
    this.lightsBuffer = new SharedArrayBuffer(4 * 6 * this.lights.length);
  }

  serializeDrawables () {
    const { drawables, surfacesBuffer: buffer, surfacesOffset: offset } = this;

    // Array of actual surface data
    const data = new Float32Array(buffer, offset);

    let o = 0;

    for (let d = 0; d < drawables.length; d++) {
      const surfaces = drawables[d].surfaces;
      for (let s = 0; s < surfaces.length; s++) {
        const surface = surfaces[s];
        surface.serialize(data, o);
        o += FLOATS_PER_SURFACE;
      }
    }

    return buffer;
  }

  serializeLights () {
    const { lights, lightsBuffer: buffer } = this;

    const data = new Float32Array(buffer);

    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      const offset = i * 6;

      data[offset + 0] = light.relPos[0];
      data[offset + 1] = light.relPos[1];
      data[offset + 2] = light.relPos[2];

      data[offset + 3] = light.color[0];
      data[offset + 4] = light.color[1];
      data[offset + 5] = light.color[2];
    }

    return buffer;
  }

  relative (pos, invmatrix) {
    for (const light of this.lights) {
      light.relative(pos, invmatrix)
    }
    for (const drawable of this.drawables) {
      drawable.relative(pos, invmatrix)
    }
  }

  tick (t) {
    /*
    Idea:
    Introduce a tickPosDelta or similar

    1. Set to 0 vector at start of tick
    2. obj.tick()
    3. Each animation can iadd the delta
    4. obj.pos = obj.origPos + tickPosDelta

    This should allow for combining animations?
    */
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

    this.rebind = false;

    // create worker threads for rendering
    this.renderers = [];
    this.numRenderers = navigator.hardwareConcurrency;
    for (let i = 0; i < this.numRenderers; i++) {
      const worker = new Worker("./js/renderer.js");
      this.renderers.push(worker);
    }

    this.frameId = 0;
    this.frameIdBuffer = new SharedArrayBuffer(4);
    this.frameIdData = new Uint32Array(this.frameIdBuffer);
  }

  bind (ctx) {
    this.ctx = ctx;
    const { width, height } = ctx.canvas;
    this.image = new ImageData(width, height);

    // shared image data
    this.sharedBuffer = new SharedArrayBuffer(4 * width * height);
    this.sharedData = new Uint8ClampedArray(this.sharedBuffer);
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

    this.frameId++;
    this.frameIdData[0] = this.frameId;

    const { width, height } = this.ctx.canvas;
    const buffer = this.sharedBuffer;
    const data = this.sharedData;

    // Distance from camera to screen
    const dis = 0.5 * width / Math.tan(this.fov / 2);

    scene.relative(this.pos, this.invmatrix());
    
    // Serialize lights and surfaces
    const surfacesSer = scene.serializeDrawables();
    const lightsSer = scene.serializeLights();

    /*
    const [cursorX, cursorY] = this.cursorPos;
    const lock = document.pointerLockElement === this.ctx.canvas;
    */

    // Divide into stripes
    const numStripes = this.renderers.length;
    const stripeHeight = Math.floor(height / numStripes);

    // Send to workers
    for (let i = 0; i < numStripes; i++) {
      const worker = this.renderers[i];

      const startY = stripeHeight * i;
      const stopY = i + 1 === numStripes // Last stripe?
        ? height // Yes: Render to y = height
        : stripeHeight * (i + 1); // No: Render to next stripe

      const options = { startY, stopY, width, height, dis, surfacesSer, lightsSer };

      worker.postMessage({
        buffer, options, frameId: this.frameId,
        frameIdBuffer: this.frameIdBuffer
      });
    }

    this.image.data.set(data);
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