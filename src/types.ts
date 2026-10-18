export interface ContentSlide {
  heading: string;
  body: string;
}

export interface Slideshow {
  topic: string;
  format: string;
  hook: string;
  slides: ContentSlide[];
  caption: string;
  hashtags: string[];
}
