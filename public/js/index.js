
import { Camera, Vector3, Matrix } from "./classes.js";
import { scene } from "./scene.js";
import { startRecording, exportVideo } from "./video.js";

if (!crossOriginIsolated) {
  throw new Error("Cannot use SharedArrayBuffer");
}

const camera = new Camera({
  pos: [0, 0, -40],
  direction: [0, 0, 1]
});

console.log(camera);

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

addEventListener("load", () => {
  const canvas = document.querySelector("#canvas");
  const ctx = canvas.getContext("2d");

  camera.bind(ctx);

  // Get option elements
  const surfaceDisplay = document.getElementById("surface-display");
  const fpsCounter = document.getElementById("fps-counter");
  const fovCounter = document.getElementById("fov-counter");
  const resCounter = document.getElementById("res-counter");
  const fovInput = document.getElementById("fov-input");
  const resInput = document.getElementById("res-input");
  const recBtn = document.getElementById("rec-btn");
  const recLink = document.getElementById("rec-link");
  const realtimeInput = document.getElementById("realtime-input");

  // Dsiplay information about the current surface
  camera.surfaceDisplay = surfaceDisplay;

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

    // schedule rebind for next render
    camera.rebind = true;
  });

  recBtn.addEventListener("click", () => {
    if (recBtn.rec) { // Stop recording
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
    } else { // Start recording
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
    
    if (Vector3.norm(delta) !== 0) {
      Vector3.inormalize(delta);
      Vector3.iadd(camera.pos, Vector3.scale(delta, speed * dt));
    }

    scene.tick(realtime ? t : t2);

    camera.render(scene);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });
});