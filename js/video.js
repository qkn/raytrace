
export function startRecording (canvas) {
  const chunks = [];
  const stream = canvas.captureStream();
  const rec = new MediaRecorder(stream);
  rec.addEventListener("dataavailable", (e) => {
    chunks.push(e.data);
  });
  rec.start();
  return { rec, chunks };
}

export function exportVideo (link, blob) {
  const src = URL.createObjectURL(blob);
  link.download = "recording.webm";
  link.href = src;
}