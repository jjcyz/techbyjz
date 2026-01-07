/**
 * Utility functions for generating Sanity Studio URLs
 * Uses embedded Sanity Studio URL (works reliably)
 */

import { sanityConfig } from './sanity.config';

/**
 * Generate Sanity Studio URL for editing a document
 * Uses embedded Sanity Studio URL (works reliably)
 */
export function getSanityStudioUrl(documentType: string, documentId: string): string {
  // Use embedded Sanity Studio URL
  // Format: /studio/desk/{type};{id}
  return `/studio/desk/${documentType};${documentId}`;
}

/**
 * Generate Sanity Studio URL for the studio home
 */
export function getSanityStudioHomeUrl(): string {
  return `/studio`;
}

/**
 * Generate direct Sanity Studio URL (only if studio is deployed separately)
 * Note: This requires the studio to be deployed to sanity.studio
 */
export function getDirectSanityStudioUrl(documentType: string, documentId: string): string {
  // Only use if you've deployed your studio separately
  // Format: https://{projectId}.sanity.studio/desk/{type};{id}
  return `https://${sanityConfig.projectId}.sanity.studio/desk/${documentType};${documentId}`;
}

