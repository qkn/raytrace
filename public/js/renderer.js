
importScripts("./rays.js", "./vec3.js");

// Will be reused on every render
const direction = new Float32Array(3);
const incoming = new Float32Array(3);
const relPos = new Float32Array(3);
const color = new Float32Array(3);
const origin = [0, 0, 0];

function render (buffer, options) {
  const { startY, stopY, width, height, dis, surfacesSer, lightsSer } = options;

  preRenderOpti(surfaces);

  // Image data
  const data = new Uint8ClampedArray(buffer);

  const surfacesMeta = new Uint32Array(surfacesSer);
  const surfaceTypes = new Uint8Array(surfacesSer, 4);
  const surfaces = new Float32Array(surfacesSer, surfacesMeta[0]);

  const lights = new Float32Array(lightsSer);

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  let index = 4 * startY - 4;

  for (let screenY = startY; screenY < stopY; screenY++) {
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
      const { surfaceIndex, surfaceType, t, p, normal } = rayHitSurface(
        origin, direction, surfaces, surfaceTypes);

      // Set pixel to black by default
      for (let i = 0; i < 3; i++) {
        data[index + i] = 0;
      }
      data[index + 3] = 0xff;

      if (surfaceIndex === null) {
        continue;
      }

      /*
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
      */

      for (let j = 0; j < lights.length; j += 6) {

        for (let i = 0; i < 3; i++) {
          relPos[i] = lights[j + i];
          color[i] = lights[j + 3 + i];
          incoming[i] = p[i] - color[i];
        }

        const norm = Vector3.norm(incoming);
        Vector3.iscale(incoming, 1 / norm); // Normalize

        if (!firstHitIs(relPos, incoming, surfaces, surfaceTypes, surfaceIndex, surfaceType)) {
          // Light is obstructed
          continue;
        }

        const dot = Vector3.dot(normal, incoming);

        if (dot > 0) {
          continue;
        }

        const b = -0xff * dot / norm**2; 

        const o = FLOATS_PER_SURFACE * surfaceIndex;

        for (let i = 0; i < 3; i++) {
          data[index + i] += surfaces[o + i] * b * color[i];
        }
      }
    }
  }
}

onmessage = (e) => {
  const { buffer, options } = e.data;

  render(buffer, options);
};