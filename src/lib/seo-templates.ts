// Master keywords for the SoHo NYC studio/venue space
export const masterKeywords = [
  "photo studio",
  "creative space",
  "event venue",
  "natural light",
  "cyclorama",
  "rental studio",
  "production space",
  "gallery space",
  "lounge area",
  "downtown location",
];

// Category to keyword mapping
export const categoryKeywords: Record<string, string[]> = {
  "Studio Photography": ["professional studio", "photo shoot", "creative lighting", "white backdrop", "cyclorama wall"],
  "Event Coverage": ["event photography", "celebration", "gathering", "party venue", "special occasion"],
  "Fashion / Editorial": ["fashion shoot", "editorial photography", "model photography", "lookbook", "high fashion"],
  "Product Photography": ["product shoot", "commercial photography", "e-commerce", "still life", "catalog"],
  "Portrait / Headshots": ["portrait photography", "headshots", "professional portrait", "personal branding", "corporate headshots"],
  "Architecture / Interiors": ["interior design", "architectural photography", "space design", "real estate", "venue photos"],
};

// Unique descriptors for the space
export const spaceDescriptors = [
  "natural light studio",
  "floor-to-ceiling windows",
  "white cyclorama wall",
  "industrial chic interior",
  "minimalist design",
  "gallery-style walls",
  "lounge seating area",
  "projector setup",
  "open floor plan",
  "high ceilings",
  "exposed brick accents",
  "flexible layout",
];

// Caption templates per platform
export const captionTemplates = {
  web: (keywords: string[], location: string, category: string) => 
    `Our ${location} studio offers a premium ${keywords[0] || 'creative space'} experience. Perfect for ${category.toLowerCase()}, featuring ${keywords.slice(1, 3).join(', ')}. Book your session today and elevate your visual content.`,
  
  "google-business": (keywords: string[], location: string, category: string) =>
    `Professional ${keywords[0] || 'photo studio'} in ${location}. Specializing in ${category.toLowerCase()}. Features include ${keywords.slice(1, 4).join(', ')}. Available for hourly and daily rentals. Contact us for availability.`,
  
  instagram: (keywords: string[], location: string, category: string) => {
    const hashtags = [
      location.toLowerCase().replace(/[,\s]+/g, ''),
      'photostudio',
      'creativespace',
      keywords[0]?.replace(/\s+/g, '') || 'photography',
      'nycphotographer',
      'studioshoot',
    ].map(tag => `#${tag}`).join(' ');
    
    return `Where creativity meets ${keywords[0] || 'vision'} ✨ Our ${location} space is ready for your next ${category.toLowerCase().replace(' / ', ' or ')} project.\n\n${hashtags}`;
  },
  
  pinterest: (keywords: string[], location: string, category: string) =>
    `${category} Inspiration | ${location} | ${keywords.slice(0, 5).map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' | ')}`,
  
  messaging: (keywords: string[], location: string, _category: string) =>
    `Check out this ${keywords[0] || 'studio space'} in ${location}! 📸`,
  
  print: (keywords: string[], location: string, category: string) =>
    `${category} — ${location} © ${new Date().getFullYear()}`,
};

// Alt text templates per platform
export const altTextTemplates = {
  website: (keywords: string[], location: string, category: string, descriptor: string) =>
    `Professional ${category.toLowerCase()} studio in ${location} featuring ${descriptor}, ${keywords.slice(0, 2).join(' and ')} for commercial and creative photography`,
  
  "google-maps": (keywords: string[], location: string, category: string, _descriptor: string) =>
    `${keywords[0] || 'Photo studio'} ${location} ${category.toLowerCase()} professional photography space rental`,
  
  instagram: (keywords: string[], location: string, category: string, descriptor: string) =>
    `${category} at ${location} studio with ${descriptor}`,
  
  pinterest: (keywords: string[], location: string, category: string, descriptor: string) =>
    `${category} inspiration ${descriptor} ${location} ${keywords.slice(0, 3).join(' ')} creative studio space`,
  
  messaging: (_keywords: string[], _location: string, category: string, _descriptor: string) =>
    `${category} studio space preview`,
  
  print: (keywords: string[], location: string, category: string, descriptor: string) =>
    `High resolution ${category.toLowerCase()} photograph featuring ${descriptor} at professional studio in ${location}`,
};

// Filename templates per platform
export const filenameTemplates = {
  website: (keywords: string[], location: string, _category: string) => {
    const slug = `${location.toLowerCase().replace(/[,\s]+/g, '-')}-${keywords[0]?.replace(/\s+/g, '-') || 'studio'}`;
    return `${slug}.webp`;
  },
  
  "google-maps": (keywords: string[], location: string, _category: string) => {
    const slug = `${location.toLowerCase().replace(/[,\s]+/g, '-')}-${keywords[0]?.replace(/\s+/g, '-') || 'photo-studio'}`;
    return `${slug}.webp`;
  },
  
  instagram: (_keywords: string[], location: string, category: string) => {
    const slug = `${location.toLowerCase().replace(/[,\s]+/g, '-')}-${category.toLowerCase().replace(/[\s/]+/g, '-')}`;
    return `${slug}.jpg`;
  },
  
  pinterest: (keywords: string[], _location: string, category: string) => {
    const slug = `${category.toLowerCase().replace(/[\s/]+/g, '-')}-${keywords[0]?.replace(/\s+/g, '-') || 'inspiration'}`;
    return `${slug}-pin.webp`;
  },
  
  messaging: (_keywords: string[], _location: string, _category: string) =>
    `studio-preview.jpg`,
  
  print: (_keywords: string[], location: string, category: string) => {
    const slug = `${location.toLowerCase().replace(/[,\s]+/g, '-')}-${category.toLowerCase().replace(/[\s/]+/g, '-')}`;
    return `${slug}-highres.tiff`;
  },
};

// Get random descriptor
export function getRandomDescriptor(): string {
  return spaceDescriptors[Math.floor(Math.random() * spaceDescriptors.length)];
}

// Get keywords for a category
export function getKeywordsForCategory(category: string): string[] {
  const categorySpecific = categoryKeywords[category] || [];
  // Mix category keywords with some master keywords
  const mixedKeywords = [...categorySpecific];
  const masterSample = masterKeywords
    .filter(k => !categorySpecific.includes(k))
    .slice(0, 3);
  return [...mixedKeywords, ...masterSample];
}

// Generate metadata for a specific platform and category
export function generateMetadata(
  platform: string,
  category: string,
  location: string,
  imageIndex?: number
): { filename: string; altText: string; caption: string } {
  const keywords = getKeywordsForCategory(category);
  const descriptor = getRandomDescriptor();
  
  // Add variation based on image index
  const suffix = imageIndex !== undefined && imageIndex > 0 ? `-${imageIndex + 1}` : '';
  
  const platformKey = platform as keyof typeof filenameTemplates;
  const captionKey = platform === "google-maps" ? "google-business" : platform;
  
  let filename = filenameTemplates[platformKey]?.(keywords, location, category) || `image${suffix}.jpg`;
  if (suffix && filename.includes('.')) {
    const [name, ext] = filename.split('.');
    filename = `${name}${suffix}.${ext}`;
  }
  
  const altText = altTextTemplates[platformKey]?.(keywords, location, category, descriptor) ||
    `${category} image from ${location}`;
    
  const caption = captionTemplates[captionKey as keyof typeof captionTemplates]?.(keywords, location, category) ||
    `${category} at ${location}`;
  
  return { filename, altText, caption };
}

// Platform export configurations
export const platformExportConfigs = {
  web: { format: "WebP", dimensions: "1920 × 1280", quality: 85, folder: "web" },
  "google-business": { format: "WebP", dimensions: "1200 × 900", quality: 90, folder: "google-business" },
  instagram: { format: "JPG", dimensions: "1080 × 1350", quality: 95, folder: "instagram" },
  pinterest: { format: "PNG", dimensions: "1000 × 1500", quality: 90, folder: "pinterest" },
  messaging: { format: "JPG", dimensions: "800 × 600", quality: 80, folder: "messaging" },
  print: { format: "TIFF", dimensions: "6000 × 4000", quality: 100, folder: "print" },
};
