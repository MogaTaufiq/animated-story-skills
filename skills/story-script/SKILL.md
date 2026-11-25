---
name: story-script
description: Use when developing a story and writing the voice-over script for a narrated video (animation, explainer, documentary short, any topic or tool), including finding the angle in source material, premise and structure, scene and beat design, writing narration for text-to-speech, generating the narrator audio (for example in Google AI Studio), or fixing a draft that feels flat, list-like, like a chronological summary, or hard to follow by ear.
---

# Story script for narrated video

A narrated video is heard once, at the narrator's speed, with no way to re-read. The script has three jobs: a story
worth following, sentences a listener catches on first hearing, and a concrete picture for every paragraph, so the
animation can be built from it without guessing.

This skill covers four stages. Each has a reference with the details:

| Stage | What happens | Reference |
|---|---|---|
| 1. Make the story | Material, premise, spine, structure | `references/story-craft.md` |
| 2. Write the story | Beats and scenes that turn, openings and endings | `references/story-craft.md` |
| 3. Script best practice | Narration for the ear + the picture column (the descriptive script) | `references/narration-for-tts.md` |
| 4. Narrator audio | TTS text file, voice choice, generating and checking the audio | `references/tts-gemini-ai-studio.md` |

## What you hand over

`story/SCRIPT.md`, in this order:
1. **Facts** with a source for every claim the narration makes. Unsure → mark it or cut it. Never invent.
2. **Premise**, one sentence: who wants what, what stands in the way, what changes by the end.
3. **The question** the opening raises, and the line that answers it.
4. **Beat list**, one line per beat: what happens and which value turns (+/−).
5. **Descriptive script** by chapter (`## 01 Title`): a table with one row per paragraph: narration, core picture,
   place/time, light and mood, sound idea for the pause after it.
6. **Pronunciation notes** for names and terms, with a test sentence for the TTS voice.

`story/NARRATION_TTS.txt`: only the narration, with `##` chapter lines, ready to paste into a TTS tool (the `##` lines
are not pasted). After stage 4: `story/tts.wav` from the user.

## 1–2. Make and write the story

- **Find the kernel and the premise first** (five questions: who, wants what, against what, why now, what changes).
- **One spine.** One subject, one want, one change. True but off-spine material is cut.
- **Find the surprise**: it becomes the first sentence.
- **Dramatize 3–5 moments, summarize the rest.** Giving every period equal time turns a story into a list.
- **Budget** about one new place per minute and three or four named people per video.
- **Every scene or chapter turns a value.** No turn → merge or cut.
- **Plant and pay off.** The last image answers the first.

Short (45–90 s): hook paradox → setting in one line → three or four escalating beats → turn → payoff → twist or
callback. Long (3–10 min): chapters that each open with a question and end on a turn, never a summary.

## 3. Write the script for the ear

- One idea and one picture per sentence; average 6–10 words, varied length.
- **A moment, not a trait.** Not "his father loved him", but the thing the father did.
- **Never narrate what the picture already shows.** Narration adds why, inside, before, after.
- Numbers, symbols, dates and abbreviations written as spoken. Hard names respelled in the TTS text and tested.
- Key word at the end of a short sentence, so a pause follows: that pause is where the picture reacts and a sound
  accent may go.
- Pace about 2.2–2.6 words per second for long-form, 3.5–4 for shorts.
- Fill the picture column concretely: who, where, doing what, how the camera feels.

## 4. Narrator audio

The user generates the voice (the agent prepares everything). Default: Google AI Studio, Gemini TTS, following
`references/tts-gemini-ai-studio.md`: pick a voice that fits the story, write one style instruction, test the hard
names, generate, listen, regenerate unclear parts, save as `story/tts.wav`.

## Check before handing over

| # | Check | If no |
|---|---|---|
| 1 | Does the first sentence make you want the second? | Rewrite the hook around the surprise |
| 2 | Can you say the premise in one sentence? | The spine is unclear: cut until you can |
| 3 | Does every chapter end somewhere other than where it began? | Merge or cut it |
| 4 | Is every sentence one idea and under ~15 words? | Split it |
| 5 | Will a listener catch every name and term the first time? | Cut, replace with a role, or explain |
| 6 | Does any sentence only describe what is on screen? | Cut it |
| 7 | Does the ending pay off something from the start? | Plant it earlier or change the ending |
| 8 | Is every fact traced to a source? | Find the source or cut the claim |
| 9 | Does every paragraph have a concrete core picture? | Write it, or the build will guess |

Then listen to the generated voice. A word that is hard to catch means rewriting that sentence. The mix cannot fix it.

## Approval gates

1. The user approves the script before any audio is made.
2. The user approves the narrator audio before any animation work. A script change after timing exists means redoing
   the timing, storyboard and sound.

## Common mistakes

| Mistake | Fix |
|---|---|
| Chronological summary of a whole life or event | 3–5 moments that change things, one line for the rest |
| Opening with an intro ("In this video…", "Long ago…") | Open with the surprising fact |
| Telling traits ("he was brave") | Show the moment that proves it |
| Too many places, names, dates | Merge, drop, refer by role |
| Ending on a lecture or moral | End on an image or line that calls back the opening |
| Sentences written for reading (long, nested) | Short spoken sentences |
| Vague picture column ("scene of the village") | Who, where, doing what, camera feel |
| Copying another channel's story or characters | Copy a style if you like, never the content |
