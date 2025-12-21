/**
 * Platform-specific image processing configuration and utilities
 * Handles resizing and JPEG compression for each export platform
 */

import { PlatformKey } from './slug-utils';

export interface PlatformExportConfig {
  maxDimension: number;
  quality: number;
  label: string;
}

// Platform export configurations - max dimension (longest edge) and JPEG quality
export const platformExportConfigs: Record<PlatformKey, PlatformExportConfig> = {
  web: { maxDimension: 2000, quality: 0.78, label: 'Web' },
  instagram: { maxDimension: 1080, quality: 0.82, label: 'Instagram' },
  pinterest: { maxDimension: 1500, quality: 0.82, label: 'Pinterest' },
  'google-business': { maxDimension: 1600, quality: 0.80, label: 'Google Business' },
  messaging: { maxDimension: 1600, quality: 0.70, label: 'Messaging' },
  print: { maxDimension: 4000, quality: 0.92, label: 'Print' },
};

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  sizeKB: number;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Load an image from a URL and return an HTMLImageElement
 */
export async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number
): { width: number; height: number } {
  const longestEdge = Math.max(originalWidth, originalHeight);
  
  // If image is smaller than max, keep original size
  if (longestEdge <= maxDimension) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const scale = maxDimension / longestEdge;
  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
  };
}

/**
 * Process an image for a specific platform
 * Resizes to platform max dimensions and compresses as JPEG
 */
export async function processImageForPlatform(
  imageUrl: string,
  platformKey: PlatformKey
): Promise<ProcessedImage> {
  const config = platformExportConfigs[platformKey];
  const img = await loadImage(imageUrl);
  
  const originalWidth = img.naturalWidth;
  const originalHeight = img.naturalHeight;
  
  const { width, height } = calculateDimensions(
    originalWidth,
    originalHeight,
    config.maxDimension
  );
  
  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Use high-quality image smoothing for downscaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(img, 0, 0, width, height);
  
  // Convert to JPEG blob with platform-specific quality
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      config.quality
    );
  });
  
  return {
    blob,
    width,
    height,
    sizeKB: Math.round(blob.size / 1024),
    originalWidth,
    originalHeight,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
