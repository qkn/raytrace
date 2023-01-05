
importScripts("./rays.js", "./vec3.js");

// Will be reused on every render
const direction = new Float32Array(3);
const incoming = new Float32Array(3);
const relPos = new Float32Array(3);
const color = new Float32Array(3);
const origin = [0, 0, 0];
const rayHitOutput = {
  normal: new Float32Array(3)
};

function render (buffer, options) {
  const { yOffset, yJump, width, height, dis, surfacesSer, lightsSer } = options;

  // Image data
  const data = new Uint8ClampedArray(buffer);

  // Where to start reading surface data
  const surfacesMeta = new Uint32Array(surfacesSer);
  const numSurfaces = surfacesMeta[0];
  const padding = 4 - numSurfaces % 4;
  const offset = 4 + padding + numSurfaces;
  
  const surfaceTypes = new Uint8Array(surfacesSer, 4 + padding);
  const surfaces = new Float32Array(surfacesSer, offset);

  const lights = new Float32Array(lightsSer);

  const halfWidth = width / 2;
  const halfHeight = height / 2;

  let index = 4 * yOffset * width - 4;
  const jump = 4 * yJump * width;

  for (let screenY = yOffset; screenY < height; screenY += yJump) {
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
      rayHitSurface(rayHitOutput, origin, direction,
        surfaces, surfaceTypes, numSurfaces);

      const { surfaceIndex, p, normal } = rayHitOutput;

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
          incoming[i] = p[i] - relPos[i];
        }

        const norm = Vector3.norm(incoming);
        Vector3.iscale(incoming, 1 / norm); // Normalize

        const dot = Vector3.dot(normal, incoming);

        if (dot > 0) {
          continue;
        }

        if (
          !firstHitIs(relPos, incoming, surfaces,
            surfaceTypes, norm - 0.1, numSurfaces)
        ) {
          // Light is obstructed
          continue;
        }

        const b = -0xff * dot / norm**2; 

        const o = FLOATS_PER_SURFACE * surfaceIndex;

        for (let i = 0; i < 3; i++) {
          data[index + i] += surfaces[o + i] * b * color[i];
        }
      }
    }

    index += jump;
  }
}

onmessage = (e) => {
  const { buffer, options, frameId, frameIdBuffer } = e.data;

  const frameIdData = new Uint32Array(frameIdBuffer);
  const currentFrameId = frameIdData[0];

  if (frameId < currentFrameId) {
    // frame is already old, do not render it
    return;
  }

  render(buffer, options);
};