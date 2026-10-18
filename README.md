# solus-slides

Generates TikTok photo slideshows (1080x1920 PNGs + caption) for Solus.

## Setup

    npm install
    npm run setup          # downloads Chromium for Playwright
    cp .env.example .env   # add your ANTHROPIC_API_KEY

## Use

    npm run build                                   # generate + render everything in topics.json
    npm run generate -- --topic "why we dream" --format myths --variants 5
    npm run render -- --force                       # re-render after editing the template

Formats: `explainer`, `myths`, `path`, `counterintuitive`.

Output lands in `out/<date>-<topic>-<format>-v<n>/` as `slide-1.png ... slide-N.png`,
`caption.txt` and `slideshow.json`.

## Customise

- `src/config.ts`: product name, CTA copy, model.
- `src/template.ts`: all visuals. Slides are plain HTML/CSS, so tweak and re-run `render --force`.
- `data/winners.json`: array of hook strings that performed well. They are fed back into the
  generation prompt, which is your feedback loop.
- `topics.json`: the batch queue.

## Posting

Upload the PNGs in order as a TikTok photo post, paste `caption.txt`, and add a trending
sound in the app. Automating the upload is a later step (TikTok Content Posting API needs an
app audit before posts can be public).

Fonts load from Google Fonts at render time. Offline, the system sans-serif is used.
