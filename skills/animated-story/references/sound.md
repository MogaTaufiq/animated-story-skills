# Sound

## The narration always wins

- The voice is never processed beyond gain.
- SFX events sit 6 dB under their "naive" level. Music sits about 13 LU under the voice and drops another 4 dB while
  words are spoken. Master: −14 LUFS integrated, true peak ≤ −1 dBTP.
- **SFX accents go in pauses, never on a word.** The script puts key words at the end of short sentences so a pause
  follows; that pause is the accent's place.
- **Music never changes chord or swells under words.** Changes go in pauses or on cuts.
- Music is an ambient pad: no percussion, no melody, so it never competes with the voice.
- Silence before a climax works better than a hit on every cut.
- Always export `mix_no_music.wav` as well.

**Clarity check:** on frames with speech, the 5th percentile of (voice − (SFX + music)) short-term loudness must be at
least 12 LU. Below that, lower the bed. Never raise or compress the voice to win.

## Timing from the script (no transcriber needed)

The SRT is the clock. When no speech-to-text with reliable word times is available, `scripts/align_pauses.py` matches
the exact script to the pauses in the TTS audio. It chooses one pause per sentence boundary so each sentence's length
fits its syllable count, its internal pauses fit its commas, and paragraph breaks fall on long pauses.

```bash
uv run --no-project --with numpy --with scipy python3 <skill>/scripts/align_pauses.py \
  story/tts.wav story/NARRATION_TTS.txt story/narration.srt story/narration.wav
```

- Input text: `##` chapter headings, one paragraph per line, sentences ending in `.`, `!` or `?`.
- Output: the SRT (script text, exact) and `narration.wav` (the TTS with 1 s of silence added at each chapter break).
- Check: listen at 5–10 sentence starts. If sentences shift after a parameter change, check the ones with commas by
  ear (each comma is an expected pause).
- Comments are in Indonesian. Syllables are estimated from vowels with Indonesian rules: close enough for other
  Latin-script languages (check more sentences by ear), not usable for non-Latin scripts.

## Building the mix

One Python script per video, `audio/<slug>.py`, using the bundled modules:
- `dsp.py`: filters, reverb, loudness (LUFS, true peak), WAV read/write.
- `sfx_gen.py`: synthesized SFX (wood, metal, water, wind, footsteps, crowd murmur, birds, crickets …).
- `instruments.py`: simple synth voices for pads and tones.

Steps:
1. **Cue table** from the SRT and shot table: (time, event, gain). Place every accent in a pause.
2. **Ambience bed** per set, crossfaded at place changes.
3. **Pad** (optional), chord changes only in pauses or on cuts.
4. **Ducking** from the SRT: music −4 dB under every spoken span, with smooth ramps.
5. Write `mix.wav` and `mix_no_music.wav` at the exact video length, 48 kHz, plus stems for checking.
6. Measure: integrated loudness, true peak, the clarity check above. Write the numbers to `cues.md`.

Lock the picture timing first. Any later timing change means re-running the sound script.

Python needs numpy and scipy. Run through `uv run --no-project --with numpy --with scipy python3 …` rather than
installing packages globally.

**Recorded sounds** are allowed only after checking each file's licence: CC0 (Kenney, Pixabay) is free to use;
CC-BY (some Freesound files) needs credit; non-commercial licences are out for monetized channels.
