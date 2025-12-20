import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from './sanity';
import type { SanityImage } from '@/types/post';

const builder = createImageUrlBuilder(client);

export interface ImageOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100, default is usually 75
  format?: 'webp' | 'jpg' | 'png'; // Auto-format based on browser support (AVIF not directly supported, but Next.js handles it)
  fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'; // Default: 'clip'
  crop?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

/**
 * Get optimized image URL from Sanity CDN
 *
 * Best practices:
 * - Use width/height appropriate for display size (reduces file size)
 * - Quality: 75-85 for general use, 90-100 for hero images
 * - Format: let Sanity auto-detect (don't specify) for best browser support
 * - Use fit: 'crop' with hotspot for better composition
 */
export function getImageUrl(
  source: SanityImage | undefined,
  width?: number,
  height?: number,
  options?: Omit<ImageOptions, 'width' | 'height'>
): string | null {
  if (!source) return null;

  // Debug: log image structure in development (only if needed)
  // Uncomment if debugging is needed:
  // if (process.env.NODE_ENV === 'development') {
  //   console.log('Image source:', JSON.stringify(source, null, 2));
  // }

  try {
    const image = builder.image(source);
    let urlBuilder = image;

    // Apply dimensions
    if (width) urlBuilder = urlBuilder.width(width);
    if (height) urlBuilder = urlBuilder.height(height);

    // Apply quality (1-100, higher = better quality but larger file)
    const quality = options?.quality ?? (width && width > 1000 ? 85 : 75);
    urlBuilder = urlBuilder.quality(quality);

    // Apply format (let Sanity auto-detect if not specified for best browser support)
    // Note: AVIF conversion is handled by Next.js Image component, not Sanity CDN
    if (options?.format) {
      urlBuilder = urlBuilder.format(options.format);
    }

    // Apply fit mode
    if (options?.fit) {
      urlBuilder = urlBuilder.fit(options.fit);
    } else if (width && height) {
      // Default to 'crop' if both dimensions specified
      urlBuilder = urlBuilder.fit('crop');
    }

    const url = urlBuilder.url();

    return url;
  } catch (error) {
    console.error('Error generating image URL:', error);
    console.error('Image source:', source);
    return null;
  }
}

/**
 * Get image URL optimized for Next.js Image component
 * Returns URL with automatic format and quality optimization
 */
export function getOptimizedImageUrl(
  source: SanityImage | undefined,
  width: number,
  height?: number,
  highQuality = false
): string | null {
  return getImageUrl(source, width, height, {
    quality: highQuality ? 90 : 80,
    // Don't specify format - let Sanity auto-detect based on browser
    fit: height ? 'crop' : 'clip',
  });
}

