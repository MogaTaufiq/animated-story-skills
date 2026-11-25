// Timeline: one row per shot, timed from the narration SRT. Every value here is a pure function of the frame number
// (Remotion renders frames out of order and in parallel, so nothing may carry over from the previous frame).
// Replace SETS, the staging names and ROWS with your story; keep the helpers, SHOTS, layersAt and camAt.
import type { Light } from "./lights";

export const FPS = 30;
export const VO_S = 16.0;              // length of narration.wav in seconds
export const DURATION_S = VO_S + 2.5;  // tail for the fade to black
export const TOTAL = Math.ceil(DURATION_S * FPS);
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
/** smootherstep: slow in, slow out. Used for every camera glide. */
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const span = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

// Each set lives at its own origin, far apart, so the fog keeps them from seeing each other.
export type SetId = "village" | "hill";
export const SETS: Record<SetId, V3> = { village: [0, 0, 0], hill: [4000, 0, 0] };

// Staging modes: world.ts / cast.ts decide who stands where for each one.
export type Crowd = "none" | "walker" | "lookout";

/** camera key: t = seconds since the shot started; pos and look are local to the shot's set */
type Key = [t: number, pos: V3, look: V3, fov?: number, roll?: number];
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type ShotDef = {
  id: number; a: number; b: number; set: SetId; light: Light; crowd: Crowd; keys: Key[];
  dof?: number;   // lens blur strength (px at 1080 for an infinitely far point); 0 = sharp (wides)
  focus?: V3;     // focus point (local); default = the camera's look point
  xfade?: number; // frames of crossfade into this shot (place or time change), centred on the cut
  sunAz?: number; sunEl?: number; // per-shot override of the light preset's sun
};

const f = (s: number) => Math.round(s * FPS);
const K = (t: number, pos: V3, look: V3, fov = 38): Key => [t, pos, look, fov];

// [start in s, set, light, crowd, camera keys, extra]. A shot starts ~0.1 s (3 frames) before its paragraph's first
// word in narration.srt and ends where the next one starts. Every hold creeps: the second key is a little closer.
type Row = [number, SetId, Light, Crowd, Key[], Partial<ShotDef>?];
const ROWS: Row[] = [
  // establishing wide: sharp, slow push-in
  [0, "village", "day", "none", [K(0, [0, 7, 34], [0, 2, 0], 42), K(5.4, [0, 6.4, 30], [0, 2, 0], 42)]],
  // medium on the walker: soft background, focus on the character
  [5.4, "village", "day", "walker", [K(0, [4.5, 1.7, 9.5], [0, 1.3, 2], 32), K(5.2, [4.0, 1.65, 8.6], [0, 1.3, 2], 32)], { dof: 10, focus: [0, 1.3, 2] }],
  // place and time change: crossfade to the hill at golden hour
  [10.6, "hill", "golden", "lookout", [K(0, [-6, 4.2, 12], [0, 4, 0], 36), K(7.9, [-5.2, 4.1, 10.6], [0, 4, 0], 36)], { xfade: 24, dof: 6, focus: [0, 4, 0] }],
];

export const SHOTS: ShotDef[] = ROWS.map(([a, set, light, crowd, keys, extra], i) => ({
  id: i + 1, a: f(a), b: i === ROWS.length - 1 ? TOTAL : f(ROWS[i + 1][0]), set, light, crowd, keys, ...(extra ?? {}),
}));

/** impact shakes (global seconds): sign flips every frame, decays over ~12 frames */
const KICKS: number[] = [];

export const shotAt = (fr: number) => SHOTS.find((s) => fr >= s.a && fr < s.b) ?? SHOTS[SHOTS.length - 1];
/** layers at frame fr: the base shot, plus the next shot fading in during its crossfade (centred on the cut) */
export const layersAt = (fr: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = s.xfade;
    if (x && fr >= s.a - x / 2 && fr < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: smooth((fr - (s.a - x / 2) + 1) / (x + 1)) }];
  }
  return [{ id: shotAt(fr).id, alpha: 1 }];
};

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const toWorld = (s: ShotDef, p: V3) => add(SETS[s.set], p);

/** camera for shot id at absolute frame fr: smootherstep between keys, then kicks */
export const camAt = (id: number, fr: number): Cam => {
  const s = SHOTS[id - 1], u = (fr - s.a) / FPS, ks = s.keys;
  let k = 0;
  while (k < ks.length - 1 && u > ks[k + 1][0]) k++;
  const A = ks[k], B = ks[Math.min(k + 1, ks.length - 1)];
  const w = B === A ? 0 : glide((u - A[0]) / (B[0] - A[0]));
  const mixV = (p: V3, q: V3): V3 => [lerp(p[0], q[0], w), lerp(p[1], q[1], w), lerp(p[2], q[2], w)];
  const cam: Cam = { pos: toWorld(s, mixV(A[1], B[1])), look: toWorld(s, mixV(A[2], B[2])), fov: lerp(A[3] ?? 38, B[3] ?? 38, w), roll: lerp(A[4] ?? 0, B[4] ?? 0, w) };
  for (const kt of KICKS) {
    const d = fr - Math.round(kt * FPS);
    if (d >= 0 && d < 12 && kt * FPS >= s.a && kt * FPS < s.b) {
      const amp = 0.035 * (d % 2 ? -1 : 1) * (1 - d / 12);
      cam.pos = [cam.pos[0] + amp, cam.pos[1] + amp * 0.5, cam.pos[2]];
      cam.roll += amp * 0.3;
    }
  }
  return cam;
};
