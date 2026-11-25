// Minimal world: two procedural sets, a camera-relative sun frozen per shot, two-tone shading, and one flat character
// card drawn with Pen and lit by the scene. No downloaded assets. Grow this file per video: more sets in build(),
// more staging in stage(). Contract with the composition: `root` holds everything, and update() is called once per
// frame for one shot. It places the camera, sets the lights and uniforms, stages the cast, and returns the focus point.
import * as THREE from "three";
import { twoTone, untone, TONE, CHAR } from "../../lib/shade";
import { cardShade } from "../../lib/cardshade";
import { NOINK } from "../../lib/ink";
import { Pen, SKIN, ellPts, rrect, shade, rnd } from "../../lib/pen";
import { LIGHTS, LightPreset } from "./lights";
import { FPS, SHOTS, SETS, ShotDef, V3, camAt, toWorld, lerp, span, smooth } from "./timeline";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const lam = (color: string, flat = false) => twoTone(new THREE.MeshLambertMaterial({ color, flatShading: flat }));

/** a person on a 600 x 1000 design canvas, soles at y = 975, light from the upper left. Faceless by default. */
function drawPerson(p: Pen, coat: string) {
  const light = -Math.PI * 0.75;
  p.line([[272, 640], [264, 958]], "#4a4458", 26);
  p.line([[328, 640], [338, 958]], "#4a4458", 26);
  p.ell(252, 966, 34, 13, "#2e2a36", 8);
  p.ell(350, 966, 34, 13, "#2e2a36", 8);
  const body = rrect(208, 330, 392, 680, 70);
  p.gradFill(body, coat, shade(coat, 0.72), light);
  p.poly(body, null);
  p.line([[222, 385], [184, 600]], coat, 30);
  p.line([[378, 385], [416, 600]], coat, 30);
  p.dot(184, 612, 17, SKIN);
  p.dot(416, 612, 17, SKIN);
  const head = ellPts(300, 215, 104, 112);
  p.shadedFill(head, SKIN, shade(SKIN, 0.8), light, 110);
  p.poly(head, null);
}

/** camera-facing card lit by the scene light; carries its own ink, so it sits on the NOINK layer */
class Card {
  mesh: THREE.Mesh;
  constructor(parent: THREE.Object3D, coat: string, heightM = 1.75) {
    const cv = document.createElement("canvas");
    cv.width = 600; cv.height = 1000;
    drawPerson(new Pen(cv.getContext("2d")!), coat);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const w = heightM * 0.6, sole = (25 / 1000) * heightM;
    const geo = new THREE.PlaneGeometry(w, heightM).translate(0, heightM / 2 - sole, 0);
    this.mesh = new THREE.Mesh(geo, cardShade(new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide })));
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    this.mesh.castShadow = true; this.mesh.receiveShadow = true;
    this.mesh.layers.set(NOINK); this.mesh.visible = false;
    parent.add(this.mesh);
  }
  place(p: V3, cam: THREE.Camera) {
    this.mesh.position.set(...p);
    this.mesh.rotation.set(0, Math.atan2(cam.position.x - p[0], cam.position.z - p[2]), 0);
    this.mesh.visible = true;
  }
}

export class World {
  root = new THREE.Group();
  private sun = new THREE.DirectionalLight("#ffffff", 2.8);
  private fog = new THREE.Fog("#ffffff", 50, 600);
  private bg = new THREE.Color();
  private sunCache = new Map<number, THREE.Vector3>();
  private walker: Card;
  private lookout: Card;

  constructor() {
    const s = this.sun;
    s.castShadow = true; s.shadow.mapSize.set(2048, 2048);
    this.root.add(s, s.target);
    this.build();
    this.walker = new Card(this.root, "#c4573a");
    this.lookout = new Card(this.root, "#3f6fa8");
  }

  private add(geo: THREE.BufferGeometry, mat: THREE.Material, p: V3, ry = 0) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...p); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true;
    this.root.add(m);
    return m;
  }

  private build() {
    const grass = lam("#9cba6a"), walls = ["#e8d6b0", "#c97f5a", "#d9b25f"].map((c) => lam(c)), roof = lam("#8a4a3a", true);
    const trunk = lam("#7a5638"), crown = lam("#5f9a4a", true), rock = lam("#8f8a9a", true);
    const ground = (o: V3) => {
      const g = this.add(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), grass, o);
      g.castShadow = false;
    };
    const tree = (x: number, z: number, k: number, y = 0) => {
      const h = 2.2 + rnd(k, 1) * 1.4;
      this.add(new THREE.CylinderGeometry(0.18, 0.28, h, 7).translate(0, h / 2, 0), trunk, [x, y, z]);
      this.add(new THREE.IcosahedronGeometry(1.3 + rnd(k, 2) * 0.6, 0), crown, [x, y + h + 0.9, z], rnd(k, 3) * 6);
    };
    const mountains = (o: V3, n: number, seed: number) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rnd(seed + i, 1), r = 260 + 140 * rnd(seed + i, 2), h = 50 + 60 * rnd(seed + i, 3);
        // base radius <= 0.85 x height, or the cones swallow the valley
        this.add(new THREE.ConeGeometry(0.8 * h, h, 7).translate(0, h / 2 - 2, 0), rock, [o[0] + Math.sin(a) * r, 0, o[2] + Math.cos(a) * r]);
      }
    };

    // village: a ring of houses around a green, trees between them
    const v = SETS.village;
    ground(v);
    for (let i = 0; i < 7; i++) {
      const a = -1.2 + i * 0.4, r = 15 + 3 * rnd(i, 4), w = 4 + 2 * rnd(i, 5), d = 4 + 1.5 * rnd(i, 6), h = 3 + 1.6 * rnd(i, 7);
      const x = v[0] + Math.sin(a) * r, z = v[2] - Math.cos(a) * r, ry = -a;
      this.add(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), walls[i % 3], [x, 0, z], ry);
      this.add(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.3, 2.2, 4).rotateY(Math.PI / 4).translate(0, h + 1.1, 0), roof, [x, 0, z], ry);
    }
    for (let i = 0; i < 12; i++) tree(v[0] + (rnd(i, 8) - 0.5) * 50, v[2] - 6 - rnd(i, 9) * 30, i);
    mountains(v, 9, 100);

    // hill: a low mound with one tree, open sky
    const o = SETS.hill;
    ground(o);
    this.add(new THREE.SphereGeometry(12, 32, 16).scale(1, 0.25, 1), grass, o);
    const moundY = (x: number, z: number) => 3 * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / 144)); // surface of the mound
    tree(o[0] + 3.5, o[2] - 2, 50, moundY(3.5, -2) - 0.1);
    mountains(o, 7, 200);
  }

  /** sun direction relative to the shot's mean view direction, computed once per shot so it never shifts */
  private shotSun(s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(s.id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let fr = s.a; fr < s.b; fr += 3) { const c = camAt(s.id, fr), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = V(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(s.id, v);
    return v;
  }

  /** who stands where: a pure function of the shot and the time t (s) */
  private stage(s: ShotDef, t: number, cam: THREE.Camera) {
    this.walker.mesh.visible = this.lookout.mesh.visible = false;
    if (s.crowd === "walker") {
      const u = smooth(span(t, s.a / FPS, s.b / FPS));
      const bob = 0.03 * Math.abs(Math.sin(t * Math.PI * 1.8));
      this.walker.place(toWorld(s, [lerp(-2.5, 2.5, u), bob, 2]), cam);
    }
    if (s.crowd === "lookout") this.lookout.place(toWorld(s, [0, 2.97, 0]), cam);
  }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene): THREE.Vector3 {
    const s = SHOTS[id - 1], L = LIGHTS[s.light], t = f / FPS;
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...(s.focus ? toWorld(s, s.focus) : c.look));

    // sun: frozen per shot, shadow box sized to the framing
    const sunDir = this.shotSun(s, L), R = THREE.MathUtils.clamp(cam.position.distanceTo(focus) * 1.15 + 7, 8, 110);
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI; this.sun.castShadow = L.shadows;
    this.sun.position.copy(focus).addScaledVector(sunDir, 260); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = 20; sc.far = 560; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (R / 12);

    // shading uniforms shared by every world material and character card
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...L.bounce); TONE.uSat.value = L.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);

    // sky and fog are written as untone(colour) so they land on screen as the preset colour after tone mapping
    untone(L.sky, this.bg); untone(L.fog, this.fog.color);
    this.fog.near = L.fogNear; this.fog.far = L.fogFar;
    scene.background = this.bg; scene.fog = this.fog;

    this.stage(s, t, cam);
    return focus;
  }
}
