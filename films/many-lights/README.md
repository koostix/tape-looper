# Many Lights

*un film en cinq lumières* — a 1 min 52 s impressionist short, painted and scored entirely in code.

- **`many-lights.mp4`** — the rendered film (1280×720, 30 fps, AAC stereo).
- **`many-lights.html`** — the film as a live player. Open it in a browser: every frame is painted in real time and the soundtrack is synthesized on load.
- **`render.cjs`** — renders the HTML to MP4, frame-exact, through headless Chromium and ffmpeg.

## The story

A love story in five lights, told in silent-film title cards (French, with English beneath). He wears a navy coat and a straw boater; she wears rose, with a white hat. A small lantern follows them through their life.

| | | |
|---|---|---|
| 0:08 | I. *Aube* | *Every morning, he rowed out toward the sun.* At Le Havre, a woman in rose on another boat, with a lantern at the bow, waves back. Their theme is heard for the first time, on piano. |
| 0:28 | II. *Le jardin d'eau* | *She showed him where the water lilies open.* They walk toward each other across the Japanese bridge as a harp plays. A violin takes up their theme, and they meet in the middle as the harp resolves. |
| 0:48 | III. *Pluie sur le boulevard* | *That evening, she waited for him under the first lamp.* She holds her lantern while he walks down the boulevard in the rain; a cello plays the theme in a minor key. *He had brought an umbrella.* The church bell rings as he reaches her, and the rain eases. |
| 1:06 | IV. *Le bal* | *And they danced until the sky caught fire.* They waltz in a warm spotlight to a musette waltz built on their theme, and the waltz ends in fireworks. |
| 1:26 | V. *Lucioles* | *Many years later, they still came to count the fireflies.* Grey-haired, they sit on a bench with the same lantern, and she rests her head on his shoulder as the cello plays the theme again. The fireflies rise and become stars. *Every light we have loved is still shining.* Dawn comes, the piano plays the theme one last time, and the title is painted again. |

Throughout, every sound matches something on screen: glints on the water, oar strokes, harp notes, lamps, footsteps, lantern beats, firework bursts and firefly blinks.

## How it works

One score (`buildScore`) drives both picture and sound, so they are synchronized by construction.

**Picture.** Each scene is drawn as a crude 256×144 sketch. A painter samples it with ~1,000 short, curved brush strokes per frame on a persistent 1280×720 canvas. Stroke direction follows a per-scene flow field (horizontal on water, vertical in rain, swirling in the night sky). Colour is "broken", with jittered value and complementary accents. Strokes are weighted toward places where the canvas differs from the sketch, so moving things stay defined while still areas keep their brushwork. Lights (sun, glints, lamps, lanterns, fireflies, fireworks) are added as additive glows. The two characters are also painted with a separate pass of small strokes from a full-resolution drawing, so they stay readable as they move. A canvas-weave grain and a vignette finish each frame.

**Sound.** A small synthesizer in plain JavaScript: Karplus-Strong harp and guitar, a bowed voice for the violin and cello, an additive felt piano with inharmonic partials, a three-reed musette accordion, Risset-style church bells, bowed-string pads, and filtered-noise textures for wind, water, rain, murmur and crickets. It all runs through a Freeverb-style reverb and a soft limiter. The whole 112-second mix renders in about six seconds.

## Re-rendering

```sh
pip install imageio-ffmpeg          # or any ffmpeg with libx264
NODE_PATH=$(npm root -g) FFMPEG=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())") \
  node render.cjs many-lights.mp4
```

Playwright must be installed globally. The committed MP4 was re-encoded at CRF 25 with a 3.5 Mbit/s cap to keep it under 50 MB.
