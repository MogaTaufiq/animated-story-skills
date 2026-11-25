// Light presets. The sun is placed relative to the camera and frozen per shot (world.ts): az = degrees from the
// shot's mean view direction toward screen right, el = elevation. No preset animates brightness.
type C3 = [number, number, number];
export type Light = "day" | "golden";
export type LightPreset = {
  az: number; el: number; shadows: boolean;
  // world two-tone shading (lib/shade.ts TONE)
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number; bounce: C3; sat: number;
  // character cards (lib/shade.ts CHAR, used by lib/cardshade.ts)
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3;
  sky: string; fog: string; fogNear: number; fogFar: number; // on-screen colours (world.ts writes untone(colour))
  sunCol: string; sunI: number; bias: number; normalBias: number;
  grade: "day" | "golden"; gradeK: number; // lib/grade.ts preset and strength
};

export const LIGHTS: Record<Light, LightPreset> = {
  day: {
    az: 75, el: 52, shadows: true,
    lit: [1.26, 1.2, 1.06], shade: [0.42, 0.4, 0.47], lift: [0.05, 0.05, 0.08], lambert: 0.35, sideK: 0.84, term: 0.2, bounce: [0.03, 0.02, 0], sat: 0.96,
    charTint: [1.0, 0.95, 0.9], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.9, 0.96],
    sky: "#93b9e0", fog: "#c9d8e6", fogNear: 50, fogFar: 620,
    sunCol: "#fff1d8", sunI: 2.8, bias: -0.00025, normalBias: 0.015,
    grade: "day", gradeK: 1,
  },
  // backlit low sun, warm key, violet-blue shade (never brown)
  golden: {
    az: 8, el: 9, shadows: true,
    lit: [1.32, 1.0, 0.72], shade: [0.34, 0.3, 0.42], lift: [0.05, 0.05, 0.1], lambert: 0.35, sideK: 0.82, term: 0.07, bounce: [0.04, 0.02, 0], sat: 0.95,
    charTint: [1.0, 0.8, 0.6], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.8, 0.95],
    sky: "#e28f78", fog: "#f0b585", fogNear: 60, fogFar: 520,
    sunCol: "#ffab5e", sunI: 5.5, bias: -0.0006, normalBias: 0.03,
    grade: "golden", gradeK: 1,
  },
};
