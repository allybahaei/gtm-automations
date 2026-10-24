export const brand = {
  name: "Solus",
  // Final slide, added by code so the generated copy never has to mention the product.
  cta: {
    heading: "Turn anything you're curious about into a map you can learn from.",
    sub: "App I use: solus.so",
  },
  // Content slides between the hook and the CTA, so a deck is 4-5 slides in total.
  contentSlides: { min: 2, max: 3 },
  size: { width: 1080, height: 1440 },
  model: process.env.MODEL ?? "claude-sonnet-5-5",
};
