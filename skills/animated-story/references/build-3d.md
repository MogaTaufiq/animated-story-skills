# Building the picture (three.js inside Remotion)

## Set up the project

`assets/starter/` is a complete Remotion project with one working example video (two sets, day and golden light, a
crossfade, a character card, ink outlines, depth of field, grade). Copy it, install, and check that it renders before
writing anything new:

```bash
cp -R <skill>/assets/starter studio && cd studio
npm install
npx tsc --noEmit
node scripts/stills.mjs out/s/x_ 30,240,318,450 0.5 Example
python3 scripts/sheet.py out/s/sheet.jpg out/s/x_*.jpg
```

Stack (pinned in `package.json`): Remotion 4, `@remotion/three`, `@react-three/fiber`, `three`, `postprocessing`.
Node 20+. 3D needs a GPU path in headless Chrome: `--gl angle` on macOS and Windows.

## Make a new video

1. Copy `src/videos/example/` to `src/videos/<slug>/` and register its composition in `src/Root.tsx` (id, width,
   height, 30 fps, duration in frames from `timeline.ts`). Set `SLUG` in `Composition.tsx`.
2. `timeline.ts`: set `VO_S` to the length of `narration.wav`, define the sets, staging names and `ROWS` from the
   storyboard and the SRT.
3. `lights.ts`: keep `day` and `golden`, add presets the story needs (night, interior …). No preset animates brightness.
4. `world.ts`: build the sets and stage the cast for each staging name.
5. Put the mix in `public/<slug>/`. Until it exists, render with `--props '{"post":{"audio":false}}'`.

## File contracts

| File | Owns | Exposes |
|---|---|---|
| `timeline.ts` | shots, sets, camera keys, timing | `SHOTS`, `layersAt(frame)`, `camAt(id, frame)`, `toWorld`, easing helpers |
| `lights.ts` | light presets | `LIGHTS[light]`: sun, two-tone colours, card shading, sky and fog colours, grade |
| `world.ts` | geometry, materials, cast staging | `class World { root; update(id, frame, camera, scene) → focus point }` |
| `Composition.tsx` | canvases, post chain, crossfades, audio | the composition component and its frame count |
| `src/lib/*` | the look: ink, lens blur, grade, two-tone shading, card shading, Pen | shared by every video, rarely edited |

`World.update` runs once per frame for one shot: it places the camera from `camAt`, sets the sun (frozen per shot,
relative to the camera), writes the shading uniforms (`TONE`, `CHAR`) from the light preset, sets sky and fog
(written as `untone(colour)` so they land on screen as that colour after tone mapping), stages the cast, and returns
the focus point for the lens blur.

## Timeline

- **Every frame is a pure function of its frame number.** Remotion renders frames out of order and in parallel tabs.
  No `Math.random()`, no `Date.now()`, no state carried from the previous frame. Use a seeded hash (`rnd(i, k)` in
  `lib/pen.ts`).
- A shot starts about 3 frames before its paragraph's first word and ends where the next shot starts.
- Camera: hard cut on big jumps; otherwise smootherstep glides of 18–40 frames. Every hold pushes in about
  0.15–0.35 % per frame. Impact shakes flip sign every frame and decay over about 12 frames. Rolls ≤ 5°.
- Depth of field (`dof`) on close and medium shots, wides sharp (`dof: 0`), focus on the subject.
- Place or time change: `xfade` of about 24 frames, inside a pause.

## World

- Procedural: three.js geometry with two-tone materials (`twoTone(new MeshLambertMaterial(…))`), Canvas2D painted
  textures when a surface needs detail. No downloads unless the user supplies assets.
- Each set at its own origin far from the others (`SETS`), so fog keeps them apart.
- Cone mountains: base radius ≤ 0.85 × height, or they swallow the valley.
- Fog colour close to the horizon colour. No pure black outside the ink. Shadows cool, highlights warm.
- Before a camera moves, check what is near its path: props within about 2 m of the lens become huge blurred blobs.

## Characters (flat cards in a 3D world)

- Drawn with `Pen` on a 600 × 1000 design canvas, soles at y = 975 (see `drawPerson` in the example). About 3.5
  heads tall, thin limbs, their own outline colour.
- Lit by the scene through `cardShade`, casting real shadows through a `customDepthMaterial` cut-out. Cards sit on the
  `NOINK` layer because they carry their own ink.
- Turn to face the camera around the vertical axis only.
- Faces are a project choice (brief). A faceless style is valid and avoids expression work.
- A recurring character keeps one identifying feature in every shot (garment colour, hat, prop).
- Cards closer than about 2.2 m to the camera turn into giant blurred heads: skip them unless the close-up is meant.
- When the cast grows, move staging into `cast.ts` and keep `world.ts` for the sets. Walk cycles = a few drawings
  swapped by time, plus a 3–7 % bob and a slight lean.

## Post (already wired in `Composition.tsx`)

- Order: ink → lens blur → bloom (threshold 1.0) → neutral tone map → grade; MSAA 4. Film grain off.
- The `EffectComposer` from `postprocessing` is built synchronously in `useMemo` and rendered in `useFrame(…, 1)`.
  `@react-three/postprocessing` v3 builds its composer asynchronously, and Remotion captures empty frames.
- Ink is its own pass before the blur, or the blur wipes it out.
- Pixel sizes (ink width, blur radius, bloom) are tuned for 1920 on the long side.

## Fonts, text and Canvas2D

- Release a font `delayRender` handle in an effect after the canvas mounts, not in the font-load callback.
- A text reveal box uses the width from `measureText`, never a fixed box (this matters most for right-to-left scripts).
- `stroke()` after `restore()` strokes the last path, not the one you meant. Keep shapes in `Path2D`.

## Look check (cheap)

```bash
node scripts/stills.mjs out/s/x_ <frames> 0.4 <CompositionId>
python3 scripts/sheet.py out/s/sheet.jpg out/s/x_*.jpg
```

Pick the first frame of each shot, the middle of long holds, and the middle of each crossfade. Look for: a camera
inside geometry, props covering a character, blobs at the frame edge, wrong colours, silhouettes that read as
something else (a single rope reads as a hanging; an invented flag can read as a real country's flag).

## Test render

Render 10–20 s around the hardest shots at full resolution (`--frames=<from>-<to>`), watch at full speed, then run the
frame-by-frame report (specs, loudness, black or frozen frames, 2-second contact sheets):

```bash
npx remotion render src/index.ts <CompositionId> out/test.mp4 --frames=300-750 --gl angle
uv run --no-project --with numpy --with pillow python3 <skill>/scripts/short_qa.py out/test.mp4 out/qa
```

## Disk

Every Remotion bundle copies `public/` into the system temp folder and leaves it there. Point the temp folder to a
drive with room and, when a project is finished, remove old `remotion-webpack-bundle-*` folders (ask the user first).
