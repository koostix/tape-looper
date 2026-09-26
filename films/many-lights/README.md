# Many Lights

*un film en cinq lumières* — a 1 min 52 s impressionist short, painted and scored entirely in code.

- **`many-lights.mp4`** — the rendered film (1280×720, 30 fps, AAC stereo).
- **`many-lights.html`** — the film as a live player. Open it in a browser: every frame is painted in real time and the soundtrack is synthesized on load.
- **`render.cjs`** — renders the HTML to MP4, frame-exact, through headless Chromium and ffmpeg.

## Chapters

| | | |
|---|---|---|
| 0:08 | I. *Aube* | Dawn over the harbour at Le Havre. A rower's oar strokes splash and creak; each glint of the sun on the water sounds a felt-piano note, higher toward the horizon. |
| 0:28 | II. *Le jardin d'eau* | Noon under the Japanese bridge. A harp plays in 6/8; every note flashes on the water, placed left to right by pitch. Lilies open on the chord changes and birds chirp as they cross. |
| 0:48 | III. *Pluie sur le boulevard* | Evening rain. The gas lamps light in pairs down the street, each with a bell, and each puddle ripple is a water drop. A passer-by's wet footsteps keep pace with their walk. |
| 1:06 | IV. *Le bal* | A musette waltz in D. The lanterns pulse on the downbeat, the dancers turn once every two bars, and the last bars end in fireworks, each with its own whistle, boom and crackle. |
| 1:26 | V. *Lucioles* | Crickets and an owl. Each firefly blink is a glass note. The fireflies rise and become stars, then dawn returns and the title is painted once more. |

## How it works

One score (`buildScore`) drives both picture and sound, so they are synchronized by construction.

**Picture.** Each scene is drawn as a crude 256×144 sketch. A painter samples it with ~1,000 short, curved brush strokes per frame on a persistent 1280×720 canvas. Stroke direction follows a per-scene flow field (horizontal on water, vertical in rain, swirling in the night sky). Colour is "broken", with jittered value and complementary accents. Strokes are weighted toward places where the canvas differs from the sketch, so moving things stay defined while still areas keep their brushwork. Lights (sun, glints, lamps, lanterns, fireflies, fireworks) are added as additive glows. A canvas-weave grain and a vignette finish each frame.

**Sound.** A small synthesizer in plain JavaScript: Karplus-Strong harp and guitar, an additive felt piano with inharmonic partials, a three-reed musette accordion, Risset-style church bells, bowed-string pads, and filtered-noise textures for wind, water, rain, murmur and crickets. It all runs through a Freeverb-style reverb and a soft limiter. The whole 112-second mix renders in about six seconds.

## Re-rendering

```sh
pip install imageio-ffmpeg          # or any ffmpeg with libx264
NODE_PATH=$(npm root -g) FFMPEG=$(python3 -c "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())") \
  node render.cjs many-lights.mp4
```

Playwright must be installed globally. The committed MP4 was re-encoded at CRF 25 with a 3.5 Mbit/s cap to keep it under 50 MB.
