
export function serializeDrawables (drawables) {
  const buffer = new SharedArrayBuffer(4 * drawables.length);
  return new Float32Array(buffer);
}

export function serializeLights (lights) {
  const buffer = new SharedArrayBuffer(4 * 6 * lights.length);
  return new Float32Array(buffer);
}