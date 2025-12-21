import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { 
  SpaceCategory, 
  getKeywordMasterForCategory, 
  getDescriptorForImage,
  generatePhotoId,
  generateHashtags,
  makeSlugBase,
  makeFilenames,
  makeAltWeb,
  makeCaptionWeb,
  makeCaptionInstagram,
  makeCaptionGoogleBusiness,
  makePinterestTitle,
  makePinterestDescription,
} from "@/lib/metadata-engine";
import { PlatformKey, PLATFORM_KEYS } from "@/lib/slug-utils";

// ============================================
// IMAGE DATA MODEL - Extended with metadata fields
// ============================================

export interface UploadedImage {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
  status: "raw" | "optimized";
  tags: string[];
  // Extended fields for metadata engine
  photoId: string;
  category: SpaceCategory;
  descriptor: string;
  keywordMaster: string;
  hashtags: string[];
  notes: string;
}

// Extended metadata structure for persisted data per platform
export interface ImageMetadata {
  filename: string;
  altText: string;
  caption: string;
  descriptor: string;
  keywordMaster: string;
  slugBase: string;
  neighborhood: string;
  city: string;
  newFilename: string;
  // Pinterest-specific
  pinterestTitle?: string;
  pinterestDescription?: string;
}

export interface ImagePlatformMetadata {
  imageId: string;
  platform: string;
  metadata: ImageMetadata;
}

// Default space configuration
const SPACE_CONFIG = {
  spaceName: "Studio",
  neighborhood: "SoHo",
  city: "NYC",
};

interface ImageContextType {
  // Uploaded images
  images: UploadedImage[];
  addImages: (files: File[]) => void;
  removeImages: (ids: string[]) => void;
  clearImages: () => void;
  
  // Update image metadata fields
  updateImageField: (id: string, field: keyof Pick<UploadedImage, 'category' | 'descriptor' | 'photoId' | 'hashtags' | 'notes'>, value: any) => void;
  bulkUpdateCategory: (ids: string[], category: SpaceCategory) => void;
  bulkUpdateHashtags: (ids: string[], hashtags: string[]) => void;
  
  // Selection
  selectedImageIds: Set<string>;
  setSelectedImageIds: (ids: Set<string>) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  
  // Metadata per image per platform
  metadataMap: Map<string, Map<string, ImageMetadata>>;
  generateMetadataForImage: (imageId: string, platform: string, category: string, location: string) => void;
  generateMetadataForAll: (platform: string, category: string, location: string) => void;
  generateMetadataForAllPlatforms: (category: string, location: string) => void;
  updateMetadata: (imageId: string, platform: string, metadata: Partial<ImageMetadata>) => void;
  
  // Get selected images
  getSelectedImages: () => UploadedImage[];
  
  // Mark images as optimized
  markAsOptimized: (ids: string[]) => void;
  
  // Current optimization settings
  currentPlatform: string;
  setCurrentPlatform: (platform: string) => void;
  currentCategory: string;
  setCurrentCategory: (category: string) => void;
  currentLocation: string;
  setCurrentLocation: (location: string) => void;
  
  // Space config
  spaceConfig: typeof SPACE_CONFIG;
}

const ImageContext = createContext<ImageContextType | null>(null);

// Parse location into neighborhood and city
function parseLocation(location: string): { neighborhood: string; city: string } {
  const parts = location.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return { neighborhood: parts[0], city: parts.slice(1).join(' ').trim() };
  }
  return { neighborhood: location || SPACE_CONFIG.neighborhood, city: SPACE_CONFIG.city };
}

export function ImageProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [metadataMap, setMetadataMap] = useState<Map<string, Map<string, ImageMetadata>>>(new Map());
  
  // Optimization settings
  const [currentPlatform, setCurrentPlatform] = useState("web");
  const [currentCategory, setCurrentCategory] = useState("main_room_wide");
  const [currentLocation, setCurrentLocation] = useState("SoHo, New York City");

  const addImages = useCallback((files: File[]) => {
    setImages(prev => {
      const startIndex = prev.length;
      const newImages: UploadedImage[] = files.map((file, idx) => {
        const photoId = generatePhotoId(file.name, startIndex + idx);
        const category: SpaceCategory = 'main_room_wide';
        const descriptor = getDescriptorForImage(file.name);
        const keywordMaster = getKeywordMasterForCategory(category);
        const { neighborhood, city } = parseLocation("SoHo, New York City");
        const hashtags = generateHashtags(category, neighborhood, city);
        
        return {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          preview: URL.createObjectURL(file),
          status: "raw" as const,
          tags: [],
          // Extended fields
          photoId,
          category,
          descriptor,
          keywordMaster,
          hashtags,
          notes: '',
        };
      });
      return [...prev, ...newImages];
    });
  }, []);

  const removeImages = useCallback((ids: string[]) => {
    setImages(prev => {
      const toRemove = new Set(ids);
      return prev.filter(img => {
        if (toRemove.has(img.id)) {
          URL.revokeObjectURL(img.preview);
          return false;
        }
        return true;
      });
    });
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    setMetadataMap(prev => {
      const next = new Map(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
  }, []);

  const clearImages = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setSelectedImageIds(new Set());
    setMetadataMap(new Map());
  }, [images]);

  // Update individual image field
  const updateImageField = useCallback((
    id: string, 
    field: keyof Pick<UploadedImage, 'category' | 'descriptor' | 'photoId' | 'hashtags' | 'notes'>, 
    value: any
  ) => {
    setImages(prev => prev.map(img => {
      if (img.id !== id) return img;
      
      const updated = { ...img, [field]: value };
      
      // If category changed, update keywordMaster and hashtags
      if (field === 'category') {
        const { neighborhood, city } = parseLocation(currentLocation);
        updated.keywordMaster = getKeywordMasterForCategory(value as SpaceCategory);
        updated.hashtags = generateHashtags(value as SpaceCategory, neighborhood, city);
      }
      
      return updated;
    }));
  }, [currentLocation]);

  // Bulk update category
  const bulkUpdateCategory = useCallback((ids: string[], category: SpaceCategory) => {
    const { neighborhood, city } = parseLocation(currentLocation);
    const keywordMaster = getKeywordMasterForCategory(category);
    const hashtags = generateHashtags(category, neighborhood, city);
    
    setImages(prev => prev.map(img => {
      if (!ids.includes(img.id)) return img;
      return { ...img, category, keywordMaster, hashtags };
    }));
  }, [currentLocation]);

  // Bulk update hashtags
  const bulkUpdateHashtags = useCallback((ids: string[], hashtags: string[]) => {
    setImages(prev => prev.map(img => {
      if (!ids.includes(img.id)) return img;
      return { ...img, hashtags };
    }));
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedImageIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedImageIds.size === images.length) {
      setSelectedImageIds(new Set());
    } else {
      setSelectedImageIds(new Set(images.map(img => img.id)));
    }
  }, [images, selectedImageIds.size]);

  const clearSelection = useCallback(() => {
    setSelectedImageIds(new Set());
  }, []);

  const getSelectedImages = useCallback(() => {
    return images.filter(img => selectedImageIds.has(img.id));
  }, [images, selectedImageIds]);

  // Generate complete metadata with all extended fields for export
  const generateMetadataForImage = useCallback((
    imageId: string,
    platform: string,
    _category: string,
    location: string
  ) => {
    const image = images.find(img => img.id === imageId);
    if (!image) return;

    const { neighborhood, city } = parseLocation(location);
    
    // Use image's stored fields
    const keywordMaster = image.keywordMaster;
    const descriptor = image.descriptor;
    const photoId = image.photoId;
    const hashtags = image.hashtags;

    const slugBase = makeSlugBase({
      spaceName: SPACE_CONFIG.spaceName,
      neighborhood,
      city,
      keywordMaster,
      descriptor,
      photoId,
    });

    const filenames = makeFilenames(slugBase);
    const newFilename = filenames[platform as keyof typeof filenames] || filenames.web;

    const altText = makeAltWeb(SPACE_CONFIG.spaceName, neighborhood, city, descriptor);
    
    // Platform-specific captions
    let caption = '';
    let pinterestTitle = '';
    let pinterestDescription = '';
    
    switch (platform) {
      case 'web':
        caption = makeCaptionWeb(SPACE_CONFIG.spaceName, neighborhood, city, descriptor);
        break;
      case 'instagram':
        caption = makeCaptionInstagram(
          SPACE_CONFIG.spaceName,
          descriptor,
          [keywordMaster, 'natural light', 'flexible layout'],
          'Book your session today! 📸',
          hashtags
        );
        break;
      case 'google-business':
        caption = makeCaptionGoogleBusiness(neighborhood, city, descriptor);
        break;
      case 'pinterest':
        caption = makePinterestDescription(keywordMaster, descriptor, neighborhood, city);
        pinterestTitle = makePinterestTitle(keywordMaster, descriptor, neighborhood, city);
        pinterestDescription = makePinterestDescription(keywordMaster, descriptor, neighborhood, city);
        break;
      default:
        caption = makeCaptionWeb(SPACE_CONFIG.spaceName, neighborhood, city, descriptor);
    }

    const metadata: ImageMetadata = {
      filename: newFilename,
      altText,
      caption,
      descriptor,
      keywordMaster,
      slugBase,
      neighborhood,
      city,
      newFilename,
      pinterestTitle,
      pinterestDescription,
    };
    
    setMetadataMap(prev => {
      const next = new Map(prev);
      const imageMap = next.get(imageId) || new Map<string, ImageMetadata>();
      imageMap.set(platform, metadata);
      next.set(imageId, imageMap);
      return next;
    });
  }, [images]);

  // Generate metadata for all selected images for a specific platform
  const generateMetadataForAll = useCallback((
    platform: string,
    _category: string,
    location: string
  ) => {
    const selected = getSelectedImages();
    const { neighborhood, city } = parseLocation(location);
    
    setMetadataMap(prev => {
      const next = new Map(prev);
      
      selected.forEach(image => {
        const keywordMaster = image.keywordMaster;
        const descriptor = image.descriptor;
        const photoId = image.photoId;
        const hashtags = image.hashtags;

        const slugBase = makeSlugBase({
          spaceName: SPACE_CONFIG.spaceName,
          neighborhood,
          city,
          keywordMaster,
          descriptor,
          photoId,
        });

        const filenames = makeFilenames(slugBase);
        const newFilename = filenames[platform as keyof typeof filenames] || filenames.web;

        const altText = makeAltWeb(SPACE_CONFIG.spaceName, neighborhood, city, descriptor);
        
        let caption = '';
        let pinterestTitle = '';
        let pinterestDescription = '';
        
        switch (platform) {
          case 'instagram':
            caption = makeCaptionInstagram(
              SPACE_CONFIG.spaceName, descriptor,
              [keywordMaster, 'natural light', 'flexible layout'],
              'Book your session today! 📸', hashtags
            );
            break;
          case 'google-business':
            caption = makeCaptionGoogleBusiness(neighborhood, city, descriptor);
            break;
          case 'pinterest':
            caption = makePinterestDescription(keywordMaster, descriptor, neighborhood, city);
            pinterestTitle = makePinterestTitle(keywordMaster, descriptor, neighborhood, city);
            pinterestDescription = caption;
            break;
          default:
            caption = makeCaptionWeb(SPACE_CONFIG.spaceName, neighborhood, city, descriptor);
        }

        const metadata: ImageMetadata = {
          filename: newFilename,
          altText,
          caption,
          descriptor,
          keywordMaster,
          slugBase,
          neighborhood,
          city,
          newFilename,
          pinterestTitle,
          pinterestDescription,
        };

        const imageMap = next.get(image.id) || new Map<string, ImageMetadata>();
        imageMap.set(platform, metadata);
        next.set(image.id, imageMap);
      });

      return next;
    });
  }, [getSelectedImages]);

  // Generate metadata for ALL platforms for all selected images
  const generateMetadataForAllPlatforms = useCallback((
    _category: string,
    location: string
  ) => {
    const selected = getSelectedImages();
    const { neighborhood, city } = parseLocation(location);
    
    setMetadataMap(prev => {
      const next = new Map(prev);
      
      selected.forEach(image => {
        const keywordMaster = image.keywordMaster;
        const descriptor = image.descriptor;
        const photoId = image.photoId;
        const hashtags = image.hashtags;

        const slugBase = makeSlugBase({
          spaceName: SPACE_CONFIG.spaceName,
          neighborhood,
          city,
          keywordMaster,
          descriptor,
          photoId,
        });

        const filenames = makeFilenames(slugBase);
        const imageMap = next.get(image.id) || new Map<string, ImageMetadata>();

        // Generate for each platform
        PLATFORM_KEYS.forEach(platformKey => {
          const newFilename = filenames[platformKey as keyof typeof filenames] || filenames.web;
          const altText = makeAltWeb(SPACE_CONFIG.spaceName, neighborhood, city, descriptor);
          
          let caption = '';
          let pinterestTitle = '';
          let pinterestDescription = '';
          
          switch (platformKey) {
            case 'instagram':
              caption = makeCaptionInstagram(
                SPACE_CONFIG.spaceName, descriptor,
                [keywordMaster, 'natural light', 'flexible layout'],
                'Book your session today! 📸', hashtags
              );
              break;
            case 'google-business':
              caption = makeCaptionGoogleBusiness(neighborhood, city, descriptor);
              break;
            case 'pinterest':
              pinterestTitle = makePinterestTitle(keywordMaster, descriptor, neighborhood, city);
              pinterestDescription = makePinterestDescription(keywordMaster, descriptor, neighborhood, city);
              caption = pinterestDescription;
              break;
            default:
              caption = makeCaptionWeb(SPACE_CONFIG.spaceName, neighborhood, city, descriptor);
          }

          const metadata: ImageMetadata = {
            filename: newFilename,
            altText,
            caption,
            descriptor,
            keywordMaster,
            slugBase,
            neighborhood,
            city,
            newFilename,
            pinterestTitle,
            pinterestDescription,
          };

          imageMap.set(platformKey, metadata);
        });

        next.set(image.id, imageMap);
      });

      return next;
    });
  }, [getSelectedImages]);

  const updateMetadata = useCallback((
    imageId: string,
    platform: string,
    updates: Partial<ImageMetadata>
  ) => {
    setMetadataMap(prev => {
      const next = new Map(prev);
      const imageMap = next.get(imageId) || new Map<string, ImageMetadata>();
      const existing = imageMap.get(platform) || { 
        filename: '', 
        altText: '', 
        caption: '',
        descriptor: '',
        keywordMaster: '',
        slugBase: '',
        neighborhood: '',
        city: '',
        newFilename: '',
      };
      imageMap.set(platform, { ...existing, ...updates });
      next.set(imageId, imageMap);
      return next;
    });
  }, []);

  const markAsOptimized = useCallback((ids: string[]) => {
    setImages(prev => prev.map(img => 
      ids.includes(img.id) ? { ...img, status: "optimized" as const } : img
    ));
  }, []);

  return (
    <ImageContext.Provider value={{
      images,
      addImages,
      removeImages,
      clearImages,
      updateImageField,
      bulkUpdateCategory,
      bulkUpdateHashtags,
      selectedImageIds,
      setSelectedImageIds,
      toggleSelection,
      selectAll,
      clearSelection,
      metadataMap,
      generateMetadataForImage,
      generateMetadataForAll,
      generateMetadataForAllPlatforms,
      updateMetadata,
      getSelectedImages,
      markAsOptimized,
      currentPlatform,
      setCurrentPlatform,
      currentCategory,
      setCurrentCategory,
      currentLocation,
      setCurrentLocation,
      spaceConfig: SPACE_CONFIG,
    }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImageContext() {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error("useImageContext must be used within an ImageProvider");
  }
  return context;
}
