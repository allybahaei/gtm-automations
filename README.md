# solus-slides

Generates TikTok photo slideshows (1080x1440 (3:4) PNGs + caption) for Solus.

## Setup

    npm install
    npm run setup          # downloads Chromium for Playwright
    cp .env.example .env   # add your ANTHROPIC_API_KEY

## Use

    npm run build                                   # generate + render everything in topics.json
    npm run generate -- --topic "why we dream" --format myths --variants 5
    npm run render -- --force                       # re-render after editing the layout or photos

Formats: `explainer`, `myths`, `path`, `counterintuitive`.

Photos come from `images/`. Add jpg, png, or webp files there. Slides use them in
filename order, and start over at the first photo when a deck has more slides than photos.

Output lands in `out/<date>-<topic>-<format>-v<n>/` as `slide-1.png ... slide-N.png`,
`caption.txt` and `slideshow.json`.

## Customise

- `src/config.ts`: product name, CTA copy, model.
- `src/styles/overlay.ts`: the slide layout. Slides are plain HTML/CSS, so tweak and re-run `render --force`.
- `images/`: the photos behind every slide.
- `data/winners.json`: array of hook strings that performed well. They are fed back into the
  generation prompt, which is your feedback loop.
- `topics.json`: the batch queue.

## Posting

Upload the PNGs in order as a TikTok photo post, paste `caption.txt`, and add a trending
sound in the app. Automating the upload is a later step (TikTok Content Posting API needs an
app audit before posts can be public).

Slides use Inter, bundled in `assets/fonts`, so renders stay the same offline.
