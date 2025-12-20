/**
 * Tag formatting utilities
 * Ensures consistent tag title formatting (Title Case)
 */

/**
 * Common acronyms that should remain all caps
 */
const COMMON_ACRONYMS = new Set([
  'AI', 'API', 'APIs', 'AWS', 'CDN', 'CI', 'CD', 'CRM', 'CSS', 'DB', 'DNS',
  'ETL', 'GDPR', 'GPU', 'HTML', 'HTTP', 'HTTPS', 'ID', 'IDE', 'IoT', 'IP',
  'JSON', 'JS', 'ML', 'NLP', 'OS', 'OSS', 'OWASP', 'PEER', 'RAG', 'REST',
  'SDK', 'SEO', 'SQL', 'SSH', 'SSL', 'UI', 'URL', 'UX', 'VPN', 'XML',
  'DeFi', 'NFT', 'NFTs', 'DAO', 'Web3', 'CISO', 'NIST', 'ETL', 'CSP',
  'CBDC', 'DePIN', 'YOLO', 'OCR', 'TRUEBench', 'IFA', 'n8n', 'N8n',
]);

/**
 * Converts a string to Title Case
 * Handles hyphens, underscores, and spaces properly
 * Examples:
 * - "machine-learning" -> "Machine Learning"
 * - "ai_models" -> "AI Models"
 * - "edge computing" -> "Edge Computing"
 * - "DeFi" -> "DeFi" (preserves acronyms)
 */
export function toTitleCase(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  // Split by hyphens, underscores, and spaces
  return str
    .split(/[\s_-]+/)
    .map((word) => {
      // Skip empty strings
      if (!word) return word;

      const upperWord = word.toUpperCase();

      // Check if it's a known acronym (case-insensitive)
      if (COMMON_ACRONYMS.has(upperWord)) {
        // Return the acronym in its canonical form
        for (const acronym of COMMON_ACRONYMS) {
          if (acronym.toUpperCase() === upperWord) {
            return acronym;
          }
        }
      }

      // Preserve all-caps acronyms (2-5 chars, all letters)
      if (word.length >= 2 && word.length <= 5 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)) {
        return word;
      }

      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .trim();
}

/**
 * Generates a slug from a title
 * Converts to lowercase, replaces spaces/special chars with hyphens
 */
export function titleToSlug(title: string): string {
  if (!title || typeof title !== 'string') {
    return '';
  }

  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .trim();
}

/**
 * Normalizes a tag name:
 * 1. Converts to Title Case
 * 2. Generates a slug
 * Returns both for use in Sanity
 */
export function normalizeTag(tagName: string): { title: string; slug: string } {
  const title = toTitleCase(tagName.trim());
  const slug = titleToSlug(title);

  return { title, slug };
}

