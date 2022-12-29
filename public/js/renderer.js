
importScripts("./rays.js", "./vec3.js", "./deserialize.js");

const direction = new Array(3);

function render (data, options) {
  const { startY, stopY, width, height, dis, drawablesSer, lightsSer } = options;

  const drawables = deserializeDrawables(drawablesSer);
  const lights = deserializeLights(lightsSer);

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
      */

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
}

onmessage = (e) => {
  const { data, options } = e.data;

  render(data, options);
};