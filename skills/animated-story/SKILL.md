---
name: animated-story
description: Use when making a narrated animated story or explainer video rendered entirely from code (three.js inside Remotion, characters drawn in code, synthesized sound, no AI video generator), from a topic to an MP4, or when continuing or fixing such a project, including building scenes from a descriptive script, syncing animation to a narrator's audio, sound design under a voice-over, or rendering the final video.
---

# Narrated animated story, rendered from code

Every frame comes from code: a three.js world rendered by Remotion, flat characters drawn with Canvas2D, sound
synthesized in Python. Nothing comes from an AI video generator, and nothing is downloaded unless the user supplies it.
Everything needed is in this repository: the `story-script` skill for the story and the narration, and this skill's
starter project, look modules and scripts for the rest.

## Priorities, in order

1. **Story first.** The script decides the shots, the sets and the sound.
2. **The narration is the clock, and it is always heard.** Every cut, move and sound sits on a sentence's time.
3. **Check cheap before expensive:** text → low-res stills → short test render → full render.
4. **The project files are the memory.** Each stage writes its result to disk and updates `PROGRESS.md`, so any agent,
   session or plan limit can resume from there.

## Brief (ask first, save as `BRIEF.md`)

- Topic and source material, audience, narration language, target length.
- Format: 16:9 at 1920×1080 (default) or 9:16 at 1080×1920; 30 fps.
- Look: the default is flat 2D characters in a painted 3D world with ink outlines. A reference image may steer it:
  copy its style, never its characters or stories.
- **Content rules for this project:** what must never be drawn (real faces, violence, brands, sacred figures …),
  whether characters have faces, and whether any on-screen text is allowed. Default: no captions or labels.
- Music or not. Always deliver a no-music version as well.
- Which text-to-speech tool the user will use (default: Google AI Studio).

## Pipeline

| # | Stage | Output | Sign-off |
|---|---|---|---|
| 1–3 | Story, writing, descriptive script (skill `story-script`) | `story/SCRIPT.md`, `story/NARRATION_TTS.txt` | user approves the script |
| 4 | Narrator audio (user, with TTS) | `story/tts.wav` | user approves the voice |
| 5 | Timing | `story/narration.srt`, `story/narration.wav` | spot-check by ear |
| 6 | Storyboard | `story/STORYBOARD.md` | user approves |
| 7 | Shot plan | `src/videos/<slug>/timeline.ts` | |
| 8 | World, cast, light | `world.ts`, `lights.ts` (+ `cast.ts` when the cast grows) | |
| 9 | Look check | low-res stills + contact sheet | show the user |
| 10 | Sound | `public/<slug>/mix.wav`, `mix_no_music.wav` | user listens |
| 11 | Test render | 10–20 s clips around the hardest shots | |
| 12 | Final render | MP4, rendered by the user in a terminal | |

**5 · Timing.** If a speech-to-text tool with reliable word times is available, use it. Otherwise the script is known
exactly, so only the pauses need finding: `scripts/align_pauses.py` matches the script's sentences to the pauses in
the audio and writes the SRT (see `references/sound.md`). The SRT text is always the script's text.

**6 · Storyboard.** From the descriptive script and the SRT: one row per paragraph with time, narration, core
picture, set, light, camera. The picture shows what the sentence means without repeating it word for word.

**7 · Shot plan.** One row per shot in `timeline.ts`:
- A visual reaction lands 0–3 frames before its word. A cut lands about 3 frames before a paragraph's first word.
- Changing place or time = a crossfade of about 0.8 s, inside a pause.
- Every hold keeps moving (a slow push-in). A static hold of 12+ frames reads as a freeze.
- Fade to black over the last 1.5 s.

**8–9 · Build and look check:** start from `assets/starter/` and follow `references/build-3d.md`.
**10 · Sound:** `references/sound.md`. **11 · Test render:** render short clips, watch them at full speed, and run
`scripts/short_qa.py` for specs, loudness, black or frozen frames and contact sheets.

**12 · Final render.** It takes a long time, so the agent hands the user the commands instead of running them:

```bash
npx remotion render src/index.ts <CompositionId> out/<slug>.mp4 --codec h264 --crf 18 --gl angle --concurrency 50%
npx remotion render src/index.ts <CompositionId> out/<slug>_no_music.mp4 --codec h264 --crf 18 --gl angle --concurrency 50% --props '{"audio":"mix_no_music.wav"}'
```

`--gl angle` suits macOS and Windows; on Linux try `--gl angle-egl` or `--gl egl`.

## Project layout

```
<project>/
  BRIEF.md  PROGRESS.md
  story/   SCRIPT.md  NARRATION_TTS.txt  tts.wav  narration.wav  narration.srt  STORYBOARD.md
  studio/  copy of assets/starter: one Remotion project for all videos
    src/lib/             shared look modules (ink, lens blur, grade, two-tone shading, card shading, Pen)
    src/videos/<slug>/   timeline.ts  lights.ts  world.ts  Composition.tsx
    audio/<slug>.py      sound script       public/<slug>/  mix.wav  mix_no_music.wav
    out/                 stills, test clips, finals (not in git)
```

## Working in different agents

- **Sub-agents available:** split independent work by file ownership (camera / world / characters / sound), each in
  its own copy, then merge file by file. **Not available:** do the stages in order.
- **Limited plans or short context:** one stage per session. Start the next session with "continue from PROGRESS.md".
- The agent renders low-res stills and short test clips only; the final render is the user's.
- Run bundled scripts through their interpreter (`python3 …`, `node …`). Paths here are relative to this skill folder.

## Red flags

| Thought | Reality |
|---|---|
| "The music will carry the weak part" | Fix the script. A mix never rescues a story or an unclear word |
| "Render the whole video to check" | Stills first, then 10–20 s clips around risky shots |
| "Small timing change, the sound will still fit" | Any timing change means re-running the sound script |
| "Random motion will make it feel alive" | Every frame must be a pure function of its frame number; use seeded noise |
| "I'll match the reference channel's characters" | Style only. Story, characters and voice are always original |
