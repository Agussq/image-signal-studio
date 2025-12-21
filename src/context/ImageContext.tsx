import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { generateMetadata } from "@/lib/seo-templates";
import { PlatformKey } from "@/lib/slug-utils";

export interface UploadedImage {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string;
  status: "raw" | "optimized";
  tags: string[];
}

export interface ImageMetadata {
  filename: string;
  altText: string;
  caption: string;
  // Extended fields for persisted metadata
  descriptor?: string;
  keywordMaster?: string;
  slugBase?: string;
  neighborhood?: string;
  city?: string;
}

export interface ImagePlatformMetadata {
  imageId: string;
  platform: string;
  metadata: ImageMetadata;
}

interface ImageContextType {
  // Uploaded images
  images: UploadedImage[];
  addImages: (files: File[]) => void;
  removeImages: (ids: string[]) => void;
  clearImages: () => void;
  
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
}

const ImageContext = createContext<ImageContextType | null>(null);

export function ImageProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<string>>(new Set());
  const [metadataMap, setMetadataMap] = useState<Map<string, Map<string, ImageMetadata>>>(new Map());
  
  // Optimization settings
  const [currentPlatform, setCurrentPlatform] = useState("website");
  const [currentCategory, setCurrentCategory] = useState("Studio Photography");
  const [currentLocation, setCurrentLocation] = useState("SoHo, New York City");

  const addImages = useCallback((files: File[]) => {
    const newImages: UploadedImage[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      status: "raw" as const,
      tags: [],
    }));
    setImages(prev => [...prev, ...newImages]);
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

  const generateMetadataForImage = useCallback((
    imageId: string,
    platform: string,
    category: string,
    location: string
  ) => {
    const imageIndex = images.findIndex(img => img.id === imageId);
    const metadata = generateMetadata(platform, category, location, imageIndex);
    
    setMetadataMap(prev => {
      const next = new Map(prev);
      const imageMap = next.get(imageId) || new Map<string, ImageMetadata>();
      imageMap.set(platform, metadata);
      next.set(imageId, imageMap);
      return next;
    });
  }, [images]);

  const generateMetadataForAll = useCallback((
    platform: string,
    category: string,
    location: string
  ) => {
    const selected = getSelectedImages();
    
    setMetadataMap(prev => {
      const next = new Map(prev);
      selected.forEach((img, index) => {
        const metadata = generateMetadata(platform, category, location, index);
        const imageMap = next.get(img.id) || new Map<string, ImageMetadata>();
        imageMap.set(platform, metadata);
        next.set(img.id, imageMap);
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
      const existing = imageMap.get(platform) || { filename: '', altText: '', caption: '' };
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
      selectedImageIds,
      setSelectedImageIds,
      toggleSelection,
      selectAll,
      clearSelection,
      metadataMap,
      generateMetadataForImage,
      generateMetadataForAll,
      updateMetadata,
      getSelectedImages,
      markAsOptimized,
      currentPlatform,
      setCurrentPlatform,
      currentCategory,
      setCurrentCategory,
      currentLocation,
      setCurrentLocation,
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
