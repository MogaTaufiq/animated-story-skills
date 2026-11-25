// Composition: one ThreeCanvas per visible shot (two during a crossfade), our own post chain built synchronously
// (ink -> lens blur -> bloom -> neutral tone map -> grade), a fade to black at the end, and the mix from public/<SLUG>/.
// Input props: { post: { ink, lens, bloom, grade, audio } } to switch passes off (the stills script sets audio: false),
// and { audio: "mix_no_music.wav" } for the no-music render.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, getInputProps, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import { BlendFunction, BloomEffect, EffectComposer as PPComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../../lib/ink";
import { LensBlur } from "../../lib/lensblur";
import { GradeEffect, GRADES } from "../../lib/grade";
import { World } from "./world";
import { LIGHTS } from "./lights";
import { TOTAL, SHOTS, layersAt } from "./timeline";

export const SLUG = "example";          // folder in public/ that holds mix.wav and mix_no_music.wav
export const EXAMPLE_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean; audio: boolean };
const props = () => getInputProps() as { post?: Partial<PostToggles>; audio?: string };
const toggles = (): PostToggles => ({ ink: true, lens: true, bloom: true, grade: true, audio: true, ...(props().post ?? {}) });

const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  // same bloom size at every render scale: long side = 1920
  mip.setSize = (w: number, h: number) => { const k = 1920 / Math.max(w, h, 1); setSize(Math.round(w * k), Math.round(h * k)); };
  return b;
};
const fwd = new THREE.Vector3();

const Inner: React.FC<{ id: number }> = ({ id }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl, size } = useThree();
  const world = useMemo(() => new World(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera, { widthNear: 4.2, widthFar: 2.8, distFar: 120 }),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, 1),
  }), [camera, scene]);
  // built synchronously: @react-three/postprocessing v3 builds its composer async and Remotion captures empty frames
  const composer = useMemo(() => {
    gl.toneMapping = THREE.NoToneMapping; gl.autoClear = false;
    const c = new PPComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, camera));
    if (on.ink) c.addPass(fx.ink); // ink is its own pass before the blur, or the blur wipes it out
    if (on.lens) { c.addPass(new EffectPass(camera, fx.lens.pre)); c.addPass(new EffectPass(camera, fx.lens.main)); }
    c.addPass(new EffectPass(camera, ...[on.bloom ? fx.bloom : null, fx.tone, on.grade ? fx.grade : null].filter((e): e is NonNullable<typeof e> => !!e)));
    return c;
  }, [gl, scene, camera, fx, on]);
  useEffect(() => () => { composer.dispose(); fx.ink.dispose(); }, [composer, fx]);
  useFrame(() => {
    const w = size.width * gl.getPixelRatio(), h = size.height * gl.getPixelRatio();
    if (composer.inputBuffer.width !== w || composer.inputBuffer.height !== h) composer.setSize(size.width, size.height);
    composer.render();
  }, 1);

  const cam = camera as THREE.PerspectiveCamera;
  const s = SHOTS[id - 1], L = LIGHTS[s.light];
  const focus = world.update(id, f, cam, scene);
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  fx.lens.focus = Math.max(0.15, focus.clone().sub(cam.position).dot(fwd));
  fx.lens.cInf = s.dof ?? 0;
  fx.grade.set(GRADES[L.grade]);
  fx.grade.amount = L.gradeK;
  return <primitive object={world.root} dispose={null} />;
};

const ShotView: React.FC<{ id: number; alpha: number }> = ({ id, alpha }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      <ThreeCanvas width={width} height={height} shadows
        gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 40, near: 0.05, far: 1500 }}>
        <Inner id={id} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const Example: React.FC = () => {
  const f = useCurrentFrame();
  const on = useMemo(toggles, []);
  const fade = interpolate(f, [TOTAL - 45, TOTAL - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#120e14" }}>
      {layersAt(f).map((l, i) => <ShotView key={i ? "over" : "base"} id={l.id} alpha={l.alpha} />)}
      {fade > 0 && <AbsoluteFill style={{ background: "#000", opacity: fade }} />}
      {on.audio && <Audio src={staticFile(`${SLUG}/${props().audio ?? "mix.wav"}`)} />}
    </AbsoluteFill>
  );
};
