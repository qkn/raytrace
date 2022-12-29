
import { Scene, Drawable, LightSource } from "./classes.js";
import { Ramp, Sphere, Cylinder, House } from "./drawables.js";
import { TriangleSurface } from "./surfaces.js";
import { Animation } from "./classes.js";

const scene1 = new Scene({
  drawables: [
    new Ramp({
      pos: [0, 0, 10],
      color: [0, 1, 0]
    }),
    new Ramp({
      pos: [20, 0, 10],
      color: [1, 0, 0]
    }),
    new Sphere({
      pos: [0, 0, 10],
      color: [0, 0, 1],
      r: 5
    }),
    new Sphere({
      pos: [0, 10, 5],
      color: [1, 1, 0.8],
      r: 1,
      tick: Animation.circle({ r: 25, speed: 1 }),
      glow: true,
      noShadow: true
    }),
    new Sphere({
      pos: [10, 20, -30],
      color: [1, 1, 0.8],
      r: 1,
      glow: true,
      noShadow: true
    }),
    new Cylinder({
      pos: [20, -10, -10],
      color: [0, 0.5, 0.5],
      r: 5,
      height: 10,
      transform: [
        [1, 0, 0],
        [0, 5, 0],
        [0, 0, 1]
      ]
    }),
    new Drawable({
      pos: [0, 0, 0],
      surfaces: [
        new TriangleSurface({
          color: [0, 0, 1],
          vertices: [
            [-50, -10, -50],
            [50, -10, -50],
            [-50, -10, 50]
          ]
        }),
        new TriangleSurface({
          color: [0, 0, 1],
          vertices: [
            [-50, -10, 50],
            [50, -10, -50],
            [50, -10, 50]
          ]
        })
      ]
    })
  ],
  lights: [
    new LightSource({
      pos: [0, 20, 5],
      color: [500, 500, 500],
      tick: Animation.circle({ r: 25, speed: 1 })
    }),
    new LightSource({
      pos: [10, 20, -30],
      color: [500, 500, 500],
    })
  ]
});

const scene2 = new Scene({
  drawables: [
    new Drawable({
      pos: [0, 0, 0],
      surfaces: [
        new TriangleSurface({
          color: [0.6, 0.4, 0.2],
          vertices: [
            [-50, -10, -50],
            [50, -10, -50],
            [-50, -10, 50]
          ]
        }),
        new TriangleSurface({
          color: [0.2, 0.4, 0.6],
          vertices: [
            [-50, -10, 50],
            [50, -10, -50],
            [50, -10, 50]
          ]
        })
      ]
    }),
    new House({
      pos: [0, -10, 0]
    }),
    new Sphere({
      pos: [0, 0, 0],
      r: 2,
      color: [1, 0, 1]
    }),
    new Sphere({
      pos: [0, 5, 0],
      r: 1,
      color: [1, 1, 0.8],
      tick: Animation.circle({ r: 8, speed: 1 }),
      glow: true,
      noShadow: true
    }),
    new Cylinder({
      pos: [-10, -10, -10],
      r: 3,
      height: 5,
      color: [0.7, 0.9, 0.7]
    })
  ],
  lights: [
    new LightSource({
      pos: [0, 5, 0],
      color: [80, 80, 80],
      tick: Animation.circle({ r: 8, speed: 5 })
    }),
    new LightSource({
      pos: [0, 50, 0],
      color: [1000, 1000, 1000],
    }),
    new LightSource({
      pos: [-60, 20, -60],
      color: [1000, 1000, 1000],
    })
  ]
});

// todo: add scene selection
export const scene = scene2;