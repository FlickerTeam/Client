export interface GifCategory {
  name: string;
  src: string;
}

export interface GifResult {
  id: string;
  fullUrl: string;
  previewUrl: string;
  title: string;
  aspectRatio?: number;
}

export interface RawGifResponse {
  id: string;
  title: string;
  gif_src: string;
  width: number;
  height: number;
}

export interface GifTrendingResponse {
  categories: GifCategory[];
}
