
import { Drawable } from "./classes.js";
import { TriangleSurface, SphereSurface, CylinderSurface } from "./surfaces.js";

export class Sphere extends Drawable {
  constructor ({ pos, r, color, tick, transform, glow, noShadow }) {
    super({
      pos,
      tick,
      transform,
      surfaces: [
        new SphereSurface({
          color,
          pos: [0, 0, 0],
          r,
          glow,
          noShadow
        })
      ]
    });
    this.r = r;
    this.color = color;
  }
}

export class Cylinder extends Drawable {
  constructor({ pos, color, r, height, tick, transform }) {
    super({
      pos,
      tick,
      transform,
      surfaces: [
        new CylinderSurface({
          pos: [0, 0, 0],
          color,
          r,
          height
        })
      ]
    });
    this.r = r;
    this.color = color;
    this.height = height;
  }
}

export class Ramp extends Drawable {
  constructor ({ pos, color, tick, transform }) {
    super({
      pos,
      tick,
      transform,
      surfaces: [
        new TriangleSurface({
          color,
          vertices: [
            [-5, 10, 10],
            [-5, -10, -10],
            [5, 10, 10]
          ]
        }),
        new TriangleSurface({
          color,
          vertices: [
            [5, 10, 10],
            [-5, -10, -10],
            [5, -10, -10]
          ]
        }),
        new TriangleSurface({
          color,
          vertices: [
            [5, 10, 10],
            [5, -10, 10],
            [5, -10, -10]
          ]
        }),
        new TriangleSurface({
          color,
          vertices: [
            [-5, 10, 10],
            [-5, -10, 10],
            [-5, -10, -10]
          ]
        })
      ]
    });
    this.color = color;
  }
}

export class House extends Drawable {
  constructor ({ pos, tick, transform }) {
    super({
      pos,
      tick,
      transform,
      surfaces: [
        // Roof
        new TriangleSurface({
          vertices: [
            [0, 30, 0],
            [-20, 20, -20],
            [20, 20, -20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [0, 30, 0],
            [-20, 20, 20],
            [20, 20, 20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [0, 30, 0],
            [20, 20, -20],
            [20, 20, 20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [0, 30, 0],
            [-20, 20, -20],
            [-20, 20, 20]
          ]
        }),
        // Door side
        new TriangleSurface({
          vertices: [
            [-20, 20, -20],
            [-20, 0, -20],
            [-5, 0, -20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-20, 20, -20],
            [-5, 20, -20],
            [-5, 0, -20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 20, -20],
            [20, 0, -20],
            [5, 0, -20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 20, -20],
            [5, 20, -20],
            [5, 0, -20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [5, 20, -20],
            [-5, 20, -20],
            [-5, 15, -20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-5, 15, -20],
            [5, 15, -20],
            [5, 20, -20]
          ]
        }),
        // Back side
        new TriangleSurface({
          vertices: [
            [-20, 20, 20],
            [-20, 0, 20],
            [-5, 0, 20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-20, 20, 20],
            [-5, 20, 20],
            [-5, 0, 20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 20, 20],
            [20, 0, 20],
            [5, 0, 20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 20, 20],
            [5, 20, 20],
            [5, 0, 20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [5, 20, 20],
            [-5, 20, 20],
            [-5, 15, 20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-5, 15, 20],
            [5, 15, 20],
            [5, 20, 20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [5, 5, 20],
            [-5, 5, 20],
            [-5, 0, 20]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-5, 0, 20],
            [5, 0, 20],
            [5, 5, 20]
          ]
        }),
        // Right side
        new TriangleSurface({
          vertices: [
            [20, 20, -20],
            [20, 0, -20],
            [20, 0, -5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 20, -20],
            [20, 20, -5],
            [20, 0, -5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 20, 20],
            [20, 0, 20],
            [20, 0, 5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 20, 20],
            [20, 20, 5],
            [20, 0, 5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 20, 5],
            [20, 20, -5],
            [20, 15, -5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 15, -5],
            [20, 15, 5],
            [20, 20, 5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 5, 5],
            [20, 5, -5],
            [20, 0, -5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [20, 0, -5],
            [20, 0, 5],
            [20, 5, 5]
          ]
        }),
        // Left side
        new TriangleSurface({
          vertices: [
            [-20, 20, -20],
            [-20, 0, -20],
            [-20, 0, -5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-20, 20, -20],
            [-20, 20, -5],
            [-20, 0, -5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-20, 20, 20],
            [-20, 0, 20],
            [-20, 0, 5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-20, 20, 20],
            [-20, 20, 5],
            [-20, 0, 5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-20, 20, 5],
            [-20, 20, -5],
            [-20, 15, -5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-20, 15, -5],
            [-20, 15, 5],
            [-20, 20, 5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-20, 5, 5],
            [-20, 5, -5],
            [-20, 0, -5]
          ]
        }),
        new TriangleSurface({
          vertices: [
            [-20, 0, -5],
            [-20, 0, 5],
            [-20, 5, 5]
          ]
        })
      ]
    });

    const colors = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0]
    ];

    for (let i = 0; i < this.surfaces.length; i++) {
      this.surfaces[i].color = colors[i % colors.length];
    }
  }
}