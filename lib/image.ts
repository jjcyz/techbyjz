import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from './sanity';
import type { SanityImage } from '@/types/post';

const builder = createImageUrlBuilder(client);

export function getImageUrl(
  source: SanityImage | undefined,
  width?: number,
  height?: number
): string | null {
  if (!source) return null;

  const image = builder.image(source);
  let urlBuilder = image;

  if (width) urlBuilder = urlBuilder.width(width);
  if (height) urlBuilder = urlBuilder.height(height);

  return urlBuilder.url();
}

