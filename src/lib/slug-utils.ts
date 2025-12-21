// Slug utilities for deterministic filenames

/**
 * Remove the file extension from a filename
 */
export function stripExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) return filename;
  return filename.substring(0, lastDotIndex);
}

/**
 * Convert text to URL-safe slug
 * - lowercase
 * - replace spaces with hyphens
 * - remove accents
 * - remove unsafe characters
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[,]/g, '') // Remove commas
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9-_]/g, '') // Remove unsafe characters
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Build a deterministic slug base from metadata
 */
export function buildSlugBase(params: {
  spaceName: string;
  neighborhood: string;
  city: string;
  keywordMaster: string;
  descriptor: string;
  photoId: string;
}): string {
  const spaceSlug = slugify(params.spaceName);
  const neighborhoodSlug = slugify(params.neighborhood);
  const citySlug = slugify(params.city);
  const keywordSlug = slugify(params.keywordMaster);
  const descriptorSlug = slugify(params.descriptor);
  const photoIdSlug = slugify(params.photoId);

  return `${spaceSlug}-${neighborhoodSlug}-${citySlug}__${keywordSlug}__${descriptorSlug}__${photoIdSlug}`;
}

/**
 * Platform to file extension mapping
 */
export const platformExtensions: Record<string, string> = {
  web: 'webp',
  instagram: 'jpg',
  pinterest: 'png',
  'google-business': 'webp',
  messaging: 'jpg',
  print: 'tiff',
};

/**
 * Build a deterministic filename for a specific platform
 */
export function buildFilename(slugBase: string, platform: string): string {
  const ext = platformExtensions[platform] || 'jpg';
  return `${slugBase}__${platform}.${ext}`;
}
