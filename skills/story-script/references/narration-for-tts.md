# Narration for a text-to-speech narrator

**Write for the ear.** If a line looks fine on paper but sounds wrong spoken, it is wrong. The listener hears it once,
at the narrator's speed.

## Sentences

- One idea and one picture per sentence. Average 6–10 words; vary the length (short, a bit longer, short again) so the
  read does not sound robotic.
- Subject first, verb early. No nested clauses, parentheses or "the former / the latter".
- Lists are spoken: "First, … Second, … And third, …".
- Rhetorical questions work well in audio. Use spoken transitions only where the jump would feel jarring:
  "But here is the thing:", "Back to our question:", "So what does this mean?".
- Key word at the end of a short sentence, so a pause follows it.
- Write natively in the narration language; never translate sentence by sentence.

## Normalize everything a TTS can misread

Write it exactly the way it should be spoken.

| Written | Spoken (English) | Spoken (Indonesian) |
|---|---|---|
| 1453 (a year) | fourteen fifty-three | empat belas lima puluh tiga |
| 297 | almost three hundred (round it) | hampir tiga ratus |
| $42.50 / Rp25.000 | forty-two dollars and fifty cents | dua puluh lima ribu rupiah |
| 75% | seventy-five percent | tujuh puluh lima persen |
| 5 km, 2 kg | five kilometres, two kilograms | lima kilometer, dua kilogram |
| 2nd, 7th century | second, seventh century | kedua, abad ketujuh |
| XIV | fourteenth (as a title) | keempat belas |
| Dr., St., e.g., etc. | Doctor, Street, for example, and so on | Doktor, Jalan, misalnya, dan lain-lain |
| NASA, UN | NASA (said as a word), U-N or United Nations | NASA, Perserikatan Bangsa-Bangsa |
| 14:30 | half past two in the afternoon | setengah tiga sore |
| & / + / = | and / plus / equals | dan / tambah / sama dengan |
| site.com/page | site dot com slash page | site titik com garis miring page |

## Names and pronunciation

- As few names as possible. After the first mention, refer by role ("the old monk", "the captain").
- A name the voice mispronounces gets a **phonetic respelling in the TTS text only**. `SCRIPT.md` keeps the correct
  spelling, with the respelling in the pronunciation notes.
- Before generating everything, run a **test sentence** with the hardest names and terms.

## Pauses and pacing

- Punctuation is the pause control: comma = short pause, period = pause, new paragraph = longer pause. Chapter breaks
  get extra silence later, from the timing tool.
- Every comma is a pause the timing tool expects. Use commas on purpose.
- An ellipsis gives a hesitation. Use it rarely.
- Avoid model-specific pause tags unless your TTS supports them. Too many of them cause speed-ups and artifacts.
- Pace: about 2.2–2.6 words per second for long-form (a slower narrator is clearer), 3.5–4 for shorts. If the voice
  runs fast, ask for a slower pace in the style direction rather than squeezing the text.

## Delivery direction

- **Gemini (Google AI Studio):** one natural-language style instruction for the whole read: who the narrator is, tone,
  pace, emotion. See `tts-gemini-ai-studio.md`.
- **Tag-based voices** (ElevenLabs v3 and similar): bracket tags such as `[softly]` or `[pause]` placed before a line
  or at a turn. Tags describe sounds only; `[smiling]` or `[walking]` get read aloud or ignored. A few per minute is
  enough.
- One steady narrator suits most stories. Big swings in emotion distract from the words.

## The descriptive script (what the animation is built from)

The narration is only half of the script. The other half is a **picture column** that says concretely what is seen,
so whoever builds the animation never has to guess:

| Narration (one paragraph) | Core picture | Place / time | Light, mood | Sound idea (in the pause after) |
|---|---|---|---|---|
| The well had been dry for three summers. | Close on a cracked rope over an empty well; slow push-in | Village square, noon | Harsh day, dusty | Wind, a bucket knocking once |

- One paragraph = one core picture. Who is there, where, doing what, and how the camera feels (close, wide, slow push).
- The picture shows what the sentence means without repeating it word for word.
- Sound ideas go in the pauses, never on top of a word.

## The TTS text file

`story/NARRATION_TTS.txt` holds only what the narrator says:
- `## 01 Title` lines mark chapters. They are for the timing tool; **do not paste them into the TTS**.
- One paragraph per line, a blank line between paragraphs.
- Every sentence ends with `.`, `!` or `?`.
- Phonetic respellings applied, numbers and symbols already normalized.

## Checklist

- [ ] Read aloud: no stumbles, no tongue-twisters.
- [ ] Every number, symbol, date, unit and abbreviation written as spoken.
- [ ] Hard names respelled in the TTS text and tested.
- [ ] Sentences mostly under ~15 words, with varied length.
- [ ] Paragraphs give the narrator room to breathe.
- [ ] Each paragraph has its core picture in the script table.
