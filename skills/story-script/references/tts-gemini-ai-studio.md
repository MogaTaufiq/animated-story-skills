# Generating the narration in Google AI Studio (Gemini TTS)

Free with a Google account at the time of writing (2026-11); usage limits may apply. Labels in the page may change
slightly over time; the steps stay the same.

## Steps

1. **Open** https://aistudio.google.com/generate-speech?model=gemini-3.8-flash-tts and sign in with a Google account.
2. **Choose single-speaker mode**: one narrator.
3. **Speaker: pick a voice that fits your story.** Listen to several before deciding; the voice is half the mood.
   Check that it suits the audience (children or adults), the genre (documentary, drama, bedtime story) and the
   narration language. Keep the same voice for the whole video.
4. **Style: describe the delivery in one line**: texture, pace, genre and atmosphere. Our setting for a story with an
   evening mood:

   ```
   Speaker: Riko
   Style: Rich, velvety, unhurried audiobook narration setting an atmospheric evening scene
   ```

   Starting points for other moods:

   | Story mood | Style line |
   |---|---|
   | Documentary, history | Calm, clear documentary narration, steady pace, quiet authority |
   | Bedtime, family | Soft, gentle bedtime storytelling, slow and soothing |
   | Drama, tension | Deep, measured narration with quiet tension, a pause before key words |
   | Kids, playful | Bright, playful narration for children, lively but clear |
   | Explainer, science | Friendly, curious explainer voice, conversational pace |

   For long-form, keep "unhurried" or "slow" in the line: a slower narrator is clearer.
5. **Test first.** Paste two or three sentences that include the hardest names and terms. Listen. If a word sounds
   wrong, fix its spelling in the TTS text (phonetic respelling), not the voice.
6. **Paste the narration** from `story/NARRATION_TTS.txt` **without the `##` chapter lines**. One take keeps the voice
   consistent: a script of about seven minutes has worked in one go. If the script is longer, or the voice drifts
   partway, generate chapter by chapter with the same voice and style instruction.
7. **Run, then listen to everything.** Any word that is hard to catch: rewrite that sentence in the script and
   regenerate (the whole take, or that chapter). Do not hope the mix will fix it.
8. **Download** the audio (WAV) and save it as `story/tts.wav`. The next step is timing (`align_pauses.py` in the
   `animated-story` skill).

## Joining chapters

If you generated per chapter, save them as `story/tts_01.wav`, `story/tts_02.wav`, … and join them:

```bash
for f in story/tts_*.wav; do echo "file '$PWD/$f'"; done > story/tts_list.txt
ffmpeg -f concat -safe 0 -i story/tts_list.txt -c copy story/tts.wav
```

No ffmpeg installed? Inside a Remotion project, `npx remotion ffmpeg` runs the bundled one with the same arguments.

## Other TTS tools

Any TTS that exports WAV works the same way: pick the voice for your story, test the hard names, generate, save as
`story/tts.wav`. For tag-based voices, see "Delivery direction" in `narration-for-tts.md`.
