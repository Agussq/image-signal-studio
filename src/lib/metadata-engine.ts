// ============================================
// METADATA ENGINE v1 - Single Source of Truth
// ============================================

import { slugify } from './slug-utils';

// ============================================
// A) SPACE TAXONOMY - 12 categories for SoHo studio/venue
// ============================================

export const SPACE_CATEGORIES = [
  'exterior',
  'entrance_access',
  'main_room_wide',
  'natural_light_windows',
  'cyclorama_backdrop',
  'gallery_walls_exhibition',
  'event_setup_seating',
  'lounge_client_area',
  'kitchen_bar',
  'projector_screening',
  'gear_production',
  'bts_shoot',
] as const;

export type SpaceCategory = typeof SPACE_CATEGORIES[number];

// Human-readable labels for UI
export const CATEGORY_LABELS: Record<SpaceCategory, string> = {
  exterior: 'Exterior',
  entrance_access: 'Entrance & Access',
  main_room_wide: 'Main Room (Wide)',
  natural_light_windows: 'Natural Light / Windows',
  cyclorama_backdrop: 'Cyclorama / Backdrop',
  gallery_walls_exhibition: 'Gallery Walls / Exhibition',
  event_setup_seating: 'Event Setup / Seating',
  lounge_client_area: 'Lounge / Client Area',
  kitchen_bar: 'Kitchen / Bar',
  projector_screening: 'Projector / Screening',
  gear_production: 'Gear / Production',
  bts_shoot: 'BTS / Shoot',
};

// ============================================
// CATEGORY -> KEYWORD_MASTER mapping (1 phrase per category)
// ============================================

export const CATEGORY_KEYWORD_MASTER: Record<SpaceCategory, string> = {
  exterior: 'SoHo photo studio exterior',
  entrance_access: 'creative space entrance NYC',
  main_room_wide: 'open floor plan studio',
  natural_light_windows: 'natural light photography studio',
  cyclorama_backdrop: 'white cyclorama wall rental',
  gallery_walls_exhibition: 'gallery exhibition space SoHo',
  event_setup_seating: 'event venue seating NYC',
  lounge_client_area: 'client lounge creative space',
  kitchen_bar: 'studio kitchen bar area',
  projector_screening: 'screening room projector rental',
  gear_production: 'production gear storage',
  bts_shoot: 'behind the scenes photo shoot',
};

// ============================================
// DESCRIPTORS - for variety in captions/alt text
// ============================================

export const SPACE_DESCRIPTORS = [
  'floor-to-ceiling windows',
  'industrial chic interior',
  'minimalist white walls',
  'high ceilings with natural light',
  'exposed brick accents',
  'flexible open layout',
  'gallery-style white walls',
  'modern lounge seating',
  'professional lighting setup',
  'versatile production space',
  'downtown Manhattan views',
  'curated design details',
] as const;

// ============================================
// B) TEMPLATE FUNCTIONS
// ============================================

/**
 * Build deterministic slug base for an image
 */
export function makeSlugBase(params: {
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
  // Take first 2 words of keyword for brevity
  const keywordSlug = slugify(params.keywordMaster.split(' ').slice(0, 2).join(' '));
  const descriptorSlug = slugify(params.descriptor.split(' ').slice(0, 2).join(' '));
  const photoIdSlug = slugify(params.photoId);

  return `${spaceSlug}-${neighborhoodSlug}-${citySlug}__${keywordSlug}__${descriptorSlug}__${photoIdSlug}`;
}

/**
 * Generate deterministic filenames for all platforms
 * All output as .jpg until real conversion exists
 */
export function makeFilenames(slugBase: string): Record<string, string> {
  return {
    web: `${slugBase}__web.jpg`,
    instagram: `${slugBase}__ig.jpg`,
    pinterest: `${slugBase}__pin.jpg`,
    'google-business': `${slugBase}__gbp.jpg`,
    messaging: `${slugBase}__msg.jpg`,
    print: `${slugBase}__print.jpg`,
  };
}

/**
 * Generate web alt text
 */
export function makeAltWeb(
  spaceName: string,
  neighborhood: string,
  city: string,
  descriptor: string
): string {
  return `${descriptor} at ${spaceName} in ${neighborhood}, ${city}`;
}

/**
 * Generate web caption
 */
export function makeCaptionWeb(
  spaceName: string,
  neighborhood: string,
  city: string,
  descriptor: string
): string {
  return `${spaceName} in ${neighborhood}, ${city} featuring ${descriptor}. Perfect for photo shoots, events, and creative productions.`;
}

/**
 * Generate Instagram caption with hashtags
 */
export function makeCaptionInstagram(
  spaceName: string,
  descriptor: string,
  features: string[],
  cta: string,
  hashtags: string[]
): string {
  const featuresList = features.slice(0, 3).join(', ');
  const hashtagString = hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ');
  return `✨ ${spaceName} — ${descriptor}\n\nFeatures: ${featuresList}\n\n${cta}\n\n${hashtagString}`;
}

/**
 * Generate Google Business caption
 */
export function makeCaptionGoogleBusiness(
  neighborhood: string,
  city: string,
  descriptor: string,
  bookingsPlaceholder: string = 'Book now via our website'
): string {
  return `Professional creative space in ${neighborhood}, ${city}. ${descriptor}. ${bookingsPlaceholder}.`;
}

/**
 * Generate Pinterest title
 */
export function makePinterestTitle(
  keywordMaster: string,
  descriptor: string,
  neighborhood: string,
  city: string
): string {
  return `${keywordMaster} | ${descriptor} | ${neighborhood} ${city}`;
}

/**
 * Generate Pinterest description
 */
export function makePinterestDescription(
  keywordMaster: string,
  descriptor: string,
  neighborhood: string,
  city: string,
  cta: string = 'Save for your next shoot!'
): string {
  return `Discover this ${keywordMaster} featuring ${descriptor} in ${neighborhood}, ${city}. ${cta}`;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get keyword master for a category
 */
export function getKeywordMasterForCategory(category: SpaceCategory): string {
  return CATEGORY_KEYWORD_MASTER[category] || CATEGORY_KEYWORD_MASTER.main_room_wide;
}

/**
 * Get a deterministic descriptor based on image name (stable, not random)
 */
export function getDescriptorForImage(imageName: string): string {
  const hash = imageName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return SPACE_DESCRIPTORS[hash % SPACE_DESCRIPTORS.length];
}

/**
 * Generate default hashtags for a category
 */
export function generateHashtags(
  category: SpaceCategory,
  neighborhood: string,
  city: string
): string[] {
  const baseHashtags = [
    neighborhood.replace(/\s+/g, '').toLowerCase(),
    city.replace(/\s+/g, '').toLowerCase(),
    'photostudio',
    'creativespace',
    'nycphotography',
  ];

  const categoryHashtags: Record<SpaceCategory, string[]> = {
    exterior: ['studiofacade', 'streetview'],
    entrance_access: ['studioentrance', 'welcomespace'],
    main_room_wide: ['openfloorplan', 'studioshoot'],
    natural_light_windows: ['naturallight', 'windowlight'],
    cyclorama_backdrop: ['cyclorama', 'whitebackdrop'],
    gallery_walls_exhibition: ['galleryspace', 'artexhibition'],
    event_setup_seating: ['eventvenue', 'privateevents'],
    lounge_client_area: ['clientlounge', 'greenroom'],
    kitchen_bar: ['studioamenities', 'cateringspace'],
    projector_screening: ['screeningroom', 'projectorroom'],
    gear_production: ['productionspace', 'studiogear'],
    bts_shoot: ['behindthescenes', 'bts'],
  };

  return [...baseHashtags, ...(categoryHashtags[category] || [])];
}

/**
 * Auto-generate photoId from filename if not provided
 */
export function generatePhotoId(imageName: string, index: number): string {
  const ext = imageName.lastIndexOf('.');
  const baseName = ext > 0 ? imageName.substring(0, ext) : imageName;
  // If base name is too long, use index-based ID
  if (baseName.length > 20) {
    return String(index + 1).padStart(3, '0');
  }
  return slugify(baseName);
}

// ============================================
// MASTER METADATA GENERATION
// ============================================

export interface MasterImageMetadata {
  photoId: string;
  category: SpaceCategory;
  descriptor: string;
  keywordMaster: string;
  hashtags: string[];
  notes: string;
}

export interface FullExportMetadata {
  photoId: string;
  originalFilename: string;
  category: SpaceCategory;
  descriptor: string;
  spaceName: string;
  neighborhood: string;
  city: string;
  keywordMaster: string;
  slugBase: string;
  filenameWeb: string;
  filenameInstagram: string;
  filenamePinterest: string;
  filenameGbp: string;
  filenameMessaging: string;
  filenamePrint: string;
  altWeb: string;
  captionWeb: string;
  captionInstagram: string;
  captionGoogleBusiness: string;
  pinterestTitle: string;
  pinterestDescription: string;
  hashtags: string;
  notes: string;
}

/**
 * Generate full export metadata for an image
 * Computes any missing fields using template functions
 */
export function generateFullExportMetadata(params: {
  originalFilename: string;
  photoId?: string;
  category?: SpaceCategory;
  descriptor?: string;
  spaceName?: string;
  neighborhood?: string;
  city?: string;
  keywordMaster?: string;
  hashtags?: string[];
  notes?: string;
  imageIndex?: number;
}): FullExportMetadata {
  const spaceName = params.spaceName || 'Studio';
  const neighborhood = params.neighborhood || 'SoHo';
  const city = params.city || 'NYC';
  const category = params.category || 'main_room_wide';
  const descriptor = params.descriptor || getDescriptorForImage(params.originalFilename);
  const keywordMaster = params.keywordMaster || getKeywordMasterForCategory(category);
  const photoId = params.photoId || generatePhotoId(params.originalFilename, params.imageIndex || 0);
  const hashtags = params.hashtags || generateHashtags(category, neighborhood, city);
  const notes = params.notes || '';

  const slugBase = makeSlugBase({
    spaceName,
    neighborhood,
    city,
    keywordMaster,
    descriptor,
    photoId,
  });

  const filenames = makeFilenames(slugBase);

  const altWeb = makeAltWeb(spaceName, neighborhood, city, descriptor);
  const captionWeb = makeCaptionWeb(spaceName, neighborhood, city, descriptor);
  const captionInstagram = makeCaptionInstagram(
    spaceName,
    descriptor,
    [keywordMaster, 'natural light', 'flexible layout'],
    'Book your session today! 📸',
    hashtags
  );
  const captionGoogleBusiness = makeCaptionGoogleBusiness(neighborhood, city, descriptor);
  const pinterestTitle = makePinterestTitle(keywordMaster, descriptor, neighborhood, city);
  const pinterestDescription = makePinterestDescription(keywordMaster, descriptor, neighborhood, city);

  return {
    photoId,
    originalFilename: params.originalFilename,
    category,
    descriptor,
    spaceName,
    neighborhood,
    city,
    keywordMaster,
    slugBase,
    filenameWeb: filenames.web,
    filenameInstagram: filenames.instagram,
    filenamePinterest: filenames.pinterest,
    filenameGbp: filenames['google-business'],
    filenameMessaging: filenames.messaging,
    filenamePrint: filenames.print,
    altWeb,
    captionWeb,
    captionInstagram,
    captionGoogleBusiness,
    pinterestTitle,
    pinterestDescription,
    hashtags: hashtags.join(' '),
    notes,
  };
}

// ============================================
// CSV MASTER v1 COLUMN HEADERS
// ============================================

export const CSV_MASTER_COLUMNS = [
  'photo_id',
  'original_filename',
  'category',
  'descriptor',
  'space_name',
  'neighborhood',
  'city',
  'keyword_master',
  'slug_base',
  'filename_web',
  'filename_instagram',
  'filename_pinterest',
  'filename_gbp',
  'filename_messaging',
  'filename_print',
  'alt_web',
  'caption_web',
  'caption_instagram',
  'caption_google_business',
  'pinterest_title',
  'pinterest_description',
  'hashtags',
  'notes',
] as const;
