import { useState, useCallback, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Package,
  Globe,
  MapPin,
  Instagram,
  Share2,
  Printer,
  MessageCircle,
  FileText,
  ImageIcon,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useImageContext, UploadedImage, ImageMetadata } from "@/context/ImageContext";
import { platformExportConfigs, getKeywordsForCategory, getRandomDescriptor } from "@/lib/seo-templates";
import { stripExtension, slugify, buildSlugBase, buildFilename, PLATFORM_KEYS, PlatformKey } from "@/lib/slug-utils";
import JSZip from "jszip";
import Papa from "papaparse";

// Normalized platform keys matching folder names and metadataMap keys
const exportPresets: Array<{
  id: string;
  platformKey: PlatformKey;
  icon: typeof Globe;
  label: string;
  format: string;
  dimensions: string;
  desc: string;
}> = [
  { 
    id: "web", 
    platformKey: "web",
    icon: Globe, 
    label: "Web-Optimized",
    format: "WebP",
    dimensions: "1920 × 1280",
    desc: "SEO-ready, fast loading"
  },
  { 
    id: "google-business", 
    platformKey: "google-business",
    icon: MapPin, 
    label: "Google Business",
    format: "WebP",
    dimensions: "1200 × 900",
    desc: "Maps & Business Profile"
  },
  { 
    id: "instagram", 
    platformKey: "instagram",
    icon: Instagram, 
    label: "Instagram-Ready",
    format: "JPG",
    dimensions: "1080 × 1350",
    desc: "Portrait ratio, high quality"
  },
  { 
    id: "pinterest", 
    platformKey: "pinterest",
    icon: Share2, 
    label: "Pinterest-Ready",
    format: "PNG",
    dimensions: "1000 × 1500",
    desc: "Vertical pin format"
  },
  { 
    id: "messaging", 
    platformKey: "messaging",
    icon: MessageCircle, 
    label: "Messaging-Ready",
    format: "JPG",
    dimensions: "800 × 600",
    desc: "Fast preview loading"
  },
  { 
    id: "print", 
    platformKey: "print",
    icon: Printer, 
    label: "Print-Ready",
    format: "TIFF",
    dimensions: "6000 × 4000",
    desc: "Full resolution, 300 DPI"
  },
];

interface ExportProgress {
  step: string;
  percentage: number;
  isComplete: boolean;
}

interface ExportError {
  message: string;
  details: string[];
}

// Extended metadata stored in metadataMap
interface ExtendedMetadata extends ImageMetadata {
  descriptor: string;
  keywordMaster: string;
  slugBase: string;
  neighborhood: string;
  city: string;
}

// Default space configuration
const SPACE_CONFIG = {
  spaceName: "Studio",
  neighborhood: "SoHo",
  city: "NYC",
};

// CSV row structure for long format
interface CSVRow {
  platformKey: string;
  newFilename: string;
  altText: string;
  caption: string;
  keywordMaster: string;
  descriptor: string;
  slugBase: string;
  neighborhood: string;
  city: string;
  category: string;
  originalFilename: string;
}

export default function Export() {
  const {
    images,
    selectedImageIds,
    getSelectedImages,
    metadataMap,
    currentCategory,
    currentLocation,
    generateMetadataForImage,
  } = useImageContext();

  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(["web"]));
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress>({ step: "", percentage: 0, isComplete: false });
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [exportError, setExportError] = useState<ExportError | null>(null);

  // Single source of truth: imagesToExport
  const imagesToExport = useMemo((): UploadedImage[] => {
    if (selectedImageIds.size > 0) {
      return getSelectedImages();
    }
    return images;
  }, [selectedImageIds, getSelectedImages, images]);

  // Selected platform keys (normalized)
  const selectedPlatformKeys = useMemo((): PlatformKey[] => {
    return Array.from(selectedFormats)
      .map(id => exportPresets.find(p => p.id === id)?.platformKey)
      .filter((pk): pk is PlatformKey => pk !== undefined);
  }, [selectedFormats]);

  // Ensure metadata exists for image/platform, generate if missing, return persisted copy
  const ensureMetadata = useCallback((
    imageId: string,
    platformKey: PlatformKey,
    image: UploadedImage,
    imageIndex: number
  ): ExtendedMetadata => {
    let platformMap = metadataMap.get(imageId);
    let metadata = platformMap?.get(platformKey) as ExtendedMetadata | undefined;

    // Generate once if missing
    if (!metadata) {
      generateMetadataForImage(imageId, platformKey, currentCategory, currentLocation);
      platformMap = metadataMap.get(imageId);
      metadata = platformMap?.get(platformKey) as ExtendedMetadata | undefined;
    }

    // Build deterministic slug parts (stable per image, not random each call)
    const keywords = getKeywordsForCategory(currentCategory);
    const keywordMaster = keywords.slice(0, 3).join('; ');
    
    // Use image name hash for stable descriptor instead of random
    const descriptorIndex = image.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const descriptors = [
      "natural light studio",
      "floor-to-ceiling windows",
      "white cyclorama wall",
      "industrial chic interior",
      "minimalist design",
      "gallery-style walls",
    ];
    const descriptor = descriptors[descriptorIndex % descriptors.length];
    
    const photoId = stripExtension(image.name);
    
    const slugBase = buildSlugBase({
      spaceName: SPACE_CONFIG.spaceName,
      neighborhood: SPACE_CONFIG.neighborhood,
      city: SPACE_CONFIG.city,
      keywordMaster: keywords[0] || 'studio',
      descriptor,
      photoId,
    });
    
    const newFilename = buildFilename(slugBase, platformKey, image.name);

    return {
      filename: metadata?.filename || newFilename,
      altText: metadata?.altText || `${descriptor} at ${SPACE_CONFIG.spaceName}, ${SPACE_CONFIG.neighborhood}, ${SPACE_CONFIG.city}.`,
      caption: metadata?.caption || `${SPACE_CONFIG.spaceName} in ${SPACE_CONFIG.neighborhood}, ${SPACE_CONFIG.city} — ${descriptor}. Ideal for shoots/events.`,
      descriptor,
      keywordMaster,
      slugBase,
      neighborhood: SPACE_CONFIG.neighborhood,
      city: SPACE_CONFIG.city,
    };
  }, [metadataMap, generateMetadataForImage, currentCategory, currentLocation]);

  const toggleFormat = (id: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Build export data: files and CSV rows from persisted metadata
  const buildExportData = useCallback(() => {
    const csvRows: CSVRow[] = [];
    const fileEntries: Array<{ platformKey: PlatformKey; filename: string; image: UploadedImage }> = [];

    imagesToExport.forEach((image, imageIndex) => {
      selectedPlatformKeys.forEach(platformKey => {
        const meta = ensureMetadata(image.id, platformKey, image, imageIndex);
        const filename = buildFilename(meta.slugBase, platformKey, image.name);

        // CSV row
        csvRows.push({
          platformKey,
          newFilename: filename,
          altText: meta.altText,
          caption: meta.caption,
          keywordMaster: meta.keywordMaster,
          descriptor: meta.descriptor,
          slugBase: meta.slugBase,
          neighborhood: meta.neighborhood,
          city: meta.city,
          category: currentCategory,
          originalFilename: image.name,
        });

        // File entry
        fileEntries.push({
          platformKey,
          filename,
          image,
        });
      });
    });

    return { csvRows, fileEntries };
  }, [imagesToExport, selectedPlatformKeys, ensureMetadata, currentCategory]);

  // Integrity check: verify CSV rows match file entries
  const runIntegrityCheck = useCallback((
    csvRows: CSVRow[],
    addedFiles: Set<string>
  ): { valid: boolean; missing: string[] } => {
    const missing: string[] = [];

    csvRows.forEach(row => {
      const filePath = `${row.platformKey}/${row.newFilename}`;
      if (!addedFiles.has(filePath)) {
        missing.push(filePath);
      }
    });

    return { valid: missing.length === 0, missing };
  }, []);

  // Generate RFC-compliant CSV using PapaParse
  const generateCSV = useCallback((rows: CSVRow[]): string => {
    return Papa.unparse(rows, {
      quotes: true, // Quote all fields
      header: true,
    });
  }, []);

  // Generate master CSV (wide format)
  const generateMasterCSV = useCallback((): string => {
    const rows = imagesToExport.map((image, imageIndex) => {
      const allMeta: Record<PlatformKey, ExtendedMetadata> = {} as Record<PlatformKey, ExtendedMetadata>;
      PLATFORM_KEYS.forEach(pk => {
        allMeta[pk] = ensureMetadata(image.id, pk, image, imageIndex);
      });

      const webMeta = allMeta['web'];
      const keywords = getKeywordsForCategory(currentCategory);
      const hashtags = keywords.slice(0, 5).map(k => `#${k.replace(/\s+/g, '')}`).join(' ');

      return {
        photo_id: stripExtension(image.name),
        original_filename: image.name,
        category: currentCategory,
        neighborhood: SPACE_CONFIG.neighborhood,
        city: SPACE_CONFIG.city,
        descriptor: webMeta.descriptor,
        keyword_master: webMeta.keywordMaster,
        slug_base: webMeta.slugBase,
        filename_web: buildFilename(allMeta['web'].slugBase, 'web', image.name),
        filename_instagram: buildFilename(allMeta['instagram'].slugBase, 'instagram', image.name),
        filename_pinterest: buildFilename(allMeta['pinterest'].slugBase, 'pinterest', image.name),
        filename_gbp: buildFilename(allMeta['google-business'].slugBase, 'google-business', image.name),
        filename_messaging: buildFilename(allMeta['messaging'].slugBase, 'messaging', image.name),
        filename_print: buildFilename(allMeta['print'].slugBase, 'print', image.name),
        alt_web: allMeta['web'].altText,
        caption_web: allMeta['web'].caption,
        caption_instagram: allMeta['instagram'].caption,
        caption_google_business: allMeta['google-business'].caption,
        pinterest_title: `${currentCategory} Ideas | ${SPACE_CONFIG.neighborhood} ${SPACE_CONFIG.city}`,
        pinterest_description: `${webMeta.descriptor} perfect for ${currentCategory.toLowerCase()}. Book now!`,
        hashtags,
        notes: '',
      };
    });

    return Papa.unparse(rows, { quotes: true, header: true });
  }, [imagesToExport, ensureMetadata, currentCategory]);

  const handleExportPack = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    setProgress({ step: "Preparing export...", percentage: 0, isComplete: false });

    const zip = new JSZip();
    const { csvRows, fileEntries } = buildExportData();
    const addedFiles = new Set<string>();

    // Steps: building metadata + files + integrity check + CSVs + finalization
    const totalSteps = 1 + fileEntries.length + 4;
    let currentStep = 0;

    try {
      // Step 1: Building metadata rows
      currentStep++;
      setProgress({ step: "Building metadata rows...", percentage: Math.round((currentStep / totalSteps) * 100), isComplete: false });
      await new Promise(resolve => setTimeout(resolve, 50));

      // Create folders for each selected platform
      const folders: Record<PlatformKey, JSZip | null> = {} as Record<PlatformKey, JSZip | null>;
      selectedPlatformKeys.forEach(pk => {
        folders[pk] = zip.folder(pk);
      });

      // Add files to ZIP
      for (const entry of fileEntries) {
        currentStep++;
        const pct = Math.round((currentStep / totalSteps) * 100);
        setProgress({ step: `Processing ${entry.filename}...`, percentage: pct, isComplete: false });

        try {
          const response = await fetch(entry.image.preview);
          const blob = await response.blob();
          folders[entry.platformKey]?.file(entry.filename, blob);
          addedFiles.add(`${entry.platformKey}/${entry.filename}`);
        } catch {
          console.warn(`Could not process ${entry.image.name}`);
        }

        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Step: Integrity check
      currentStep++;
      setProgress({ step: "Running integrity check...", percentage: Math.round((currentStep / totalSteps) * 100), isComplete: false });
      await new Promise(resolve => setTimeout(resolve, 50));

      const integrityResult = runIntegrityCheck(csvRows, addedFiles);
      
      if (!integrityResult.valid) {
        setExportError({
          message: "ZIP/CSV mismatch detected",
          details: integrityResult.missing.slice(0, 10), // Show first 10
        });
        setIsExporting(false);
        setProgress({ step: "", percentage: 0, isComplete: false });
        return;
      }

      // Add metadata.csv (long format)
      currentStep++;
      setProgress({ step: "Generating metadata.csv...", percentage: Math.round((currentStep / totalSteps) * 100), isComplete: false });
      const csv = generateCSV(csvRows);
      zip.file("metadata.csv", csv);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Add metadata_master.csv (wide format)
      currentStep++;
      setProgress({ step: "Generating metadata_master.csv...", percentage: Math.round((currentStep / totalSteps) * 100), isComplete: false });
      const masterCsv = generateMasterCSV();
      zip.file("metadata_master.csv", masterCsv);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Finalize
      currentStep++;
      setProgress({ step: "Compressing files...", percentage: 95, isComplete: false });

      const content = await zip.generateAsync({ type: "blob" });

      // Download
      setProgress({ step: "Download ready!", percentage: 100, isComplete: true });
      
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `studio-export-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloaded(new Set(Array.from(selectedFormats)));

      setTimeout(() => {
        setIsExporting(false);
        setProgress({ step: "", percentage: 0, isComplete: false });
      }, 2000);

    } catch (error) {
      console.error("Export failed:", error);
      setProgress({ step: "Export failed. Please try again.", percentage: 0, isComplete: false });
      setTimeout(() => {
        setIsExporting(false);
        setProgress({ step: "", percentage: 0, isComplete: false });
      }, 2000);
    }
  }, [selectedFormats, selectedPlatformKeys, buildExportData, runIntegrityCheck, generateCSV, generateMasterCSV]);

  const handleDownloadCSV = useCallback(() => {
    const { csvRows } = buildExportData();
    const csv = generateCSV(csvRows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metadata-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [buildExportData, generateCSV]);

  // Redirect if no images at all
  if (images.length === 0) {
    return (
      <Layout>
        <section className="py-16 lg:py-20 px-6 lg:px-12 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <p className="text-caption text-muted-foreground mb-4">Export</p>
            <h1 className="heading-editorial">Download & deploy</h1>
          </div>
        </section>
        <section className="py-24 px-6 lg:px-12 text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-6">No images to export. Please upload images first.</p>
          <Button asChild variant="editorial" size="editorial">
            <Link to="/library">Go to Library</Link>
          </Button>
        </section>
      </Layout>
    );
  }

  // Always have images to export (fallback to all if none selected)
  const canExport = imagesToExport.length > 0 && selectedFormats.size > 0;
  const expectedFileCount = imagesToExport.length * selectedPlatformKeys.length;

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 lg:py-20 px-6 lg:px-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-caption text-muted-foreground mb-4">Export</p>
              <h1 className="heading-editorial">Download & deploy</h1>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleDownloadCSV}
                disabled={!canExport || isExporting}
                variant="editorial-ghost" 
                size="editorial"
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV Only
              </Button>
              <Button 
                onClick={handleExportPack}
                disabled={!canExport || isExporting}
                variant="editorial-filled"
                size="editorial-lg"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 mr-2" />
                    Download Pack ({expectedFileCount} files)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {exportError && (
        <section className="py-4 px-6 lg:px-12 bg-destructive/10 border-b border-destructive/20">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">{exportError.message}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Missing files: {exportError.details.join(', ')}
                {exportError.details.length >= 10 && '...'}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 h-7 px-2"
                onClick={() => setExportError(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Progress Bar */}
      {isExporting && (
        <section className="py-6 px-6 lg:px-12 bg-muted/30 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-foreground transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-[200px]">
                {progress.isComplete ? (
                  <Check className="w-4 h-4 text-foreground" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span className="text-sm">{progress.step}</span>
                <span className="text-sm text-muted-foreground">{progress.percentage}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-12 lg:py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left - Image Previews */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-6">
                {/* Image Grid Preview */}
                <div className="grid grid-cols-3 gap-2">
                  {imagesToExport.slice(0, 6).map((img) => (
                    <div key={img.id} className="aspect-square bg-muted border border-border overflow-hidden relative">
                      <img 
                        src={img.preview} 
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {imagesToExport.length > 6 && (
                    <div className="aspect-square bg-muted border border-border flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">+{imagesToExport.length - 6}</span>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 border border-border bg-card">
                  <p className="text-sm font-medium mb-2">Export Summary</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{imagesToExport.length} images × {selectedPlatformKeys.length} platforms</p>
                    <p>= {expectedFileCount} total files</p>
                    <p className="text-xs mt-2">+ metadata.csv + metadata_master.csv</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Format Selection */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium">Select Formats</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedFormats.size} of {exportPresets.length} selected
                </p>
              </div>

              <div className="grid gap-3">
                {exportPresets.map((preset) => {
                  const isSelected = selectedFormats.has(preset.id);
                  const wasDownloaded = downloaded.has(preset.id);
                  const Icon = preset.icon;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => toggleFormat(preset.id)}
                      disabled={isExporting}
                      className={cn(
                        "w-full p-4 border text-left transition-all",
                        "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
                        isSelected 
                          ? "border-foreground bg-muted/30" 
                          : "border-border",
                        isExporting && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 flex items-center justify-center border",
                          isSelected ? "border-foreground" : "border-border"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{preset.label}</span>
                            {wasDownloaded && (
                              <Check className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{preset.desc}</p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{preset.format}</p>
                          <p>{preset.dimensions}</p>
                        </div>
                        <div className={cn(
                          "w-5 h-5 border flex items-center justify-center",
                          isSelected 
                            ? "border-foreground bg-foreground" 
                            : "border-muted-foreground"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-background" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Folder structure preview */}
              <div className="mt-8 p-4 border border-border bg-card/50">
                <p className="text-sm font-medium mb-3">ZIP Structure Preview</p>
                <div className="font-mono text-xs text-muted-foreground space-y-1">
                  {selectedPlatformKeys.map(pk => (
                    <p key={pk}>/{pk}/ ({imagesToExport.length} files)</p>
                  ))}
                  <p className="mt-2 text-foreground">/metadata.csv</p>
                  <p className="text-foreground">/metadata_master.csv</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
