# Third-party work and credits

This repository grew out of studying existing agent skills and tutorials, then merging what worked with lessons from
producing two narrated videos. Only MIT-licensed material was copied; everything else is credited as inspiration.

## Copied or adapted (MIT)

| Source | What was used |
|---|---|
| [claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts) by Mr omi, MIT | The pipeline this repo grew from (topic → script → voice → shot plan → stills → render), the short-form beat formula, camera rules and look values. Files: `skills/animated-story/scripts/dsp.py`, `sfx_gen.py`, `instruments.py` (unchanged), `short_qa.py` (landscape support added); `assets/starter/src/lib/*.ts` (ink, lens blur, grade, two-tone shading, card shading, Pen; adapted); `assets/starter/scripts/stills.mjs` (adapted). Licence text: `skills/animated-story/scripts/LICENSE.claude-animated-shorts` |
| [screenwriting-skills](https://github.com/jtydhr88/screenwriting-skills) by Terry Jia, MIT | Dramaturgy principles, rewritten in our own words in `story-script/references/story-craft.md`: premise and controlling idea, desire versus misbelief, value turns per scene, enter late and leave early, detail over concept, recurring objects, openings and endings. No quoted passages from the craft books it cites |
| [explainer-video-skills](https://github.com/iart-ai/explainer-video-skills) by iart.ai, MIT | One sentence of narration = one picture; the script-to-storyboard flow; the explainer beat order |
| [javascript-animation-skills](https://github.com/iart-ai/javascript-animation-skills) by iart.ai, MIT | Soundtrack placement: change harmony on cuts or pauses, no hard accents on cuts, silence before a climax |

## Read for ideas only (nothing copied)

| Source | Ideas |
|---|---|
| [motion-skills](https://github.com/iart-ai/motion-skills) by iart.ai | Map of motion-graphics skill packs; the render-then-check loop |
| [jarmen423/skills](https://github.com/jarmen423/skills): tts-script-writer | Normalizing text for TTS, pronunciation notes, pause control (no licence: rules rewritten from our own practice) |
| [jwynia/agent-skills](https://github.com/jwynia/agent-skills): document-to-narration | Adapting written text to spoken text (no licence: rules rewritten from our own practice) |
| Videos by [Mr omi](https://www.youtube.com/watch?v=OtbLL6OBNE4), [Nalarka](https://www.youtube.com/watch?v=C1Ul4viinEM), [Success With Sam](https://www.youtube.com/watch?v=8400Bkm214E) | Voice-over first, measure instead of opinion, check stills first, agent teams split by file, resuming after plan limits |

## Not included

The reference frames and contact sheets in `claude-animated-shorts/references/`: third-party study material.

## Ours

Both `SKILL.md` files and all references, `scripts/align_pauses.py`, `assets/starter/scripts/sheet.py`, and the
starter's example video (`assets/starter/src/videos/example/`, built from the timeline and composition of our two
test videos).
