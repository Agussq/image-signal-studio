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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useImageContext, UploadedImage, ImageMetadata } from "@/context/ImageContext";
import { platformExportConfigs, categoryKeywords, getKeywordsForCategory, getRandomDescriptor } from "@/lib/seo-templates";
import { stripExtension, slugify, buildSlugBase, buildFilename, platformExtensions } from "@/lib/slug-utils";
import JSZip from "jszip";

const exportPresets = [
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
    id: "google", 
    platformKey: "google-business",
    icon: MapPin, 
    label: "Google-Ready",
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

// Default space configuration
const SPACE_CONFIG = {
  spaceName: "Studio",
  neighborhood: "SoHo",
  city: "NYC",
};

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

  // Single source of truth: imagesToExport
  const imagesToExport = useMemo((): UploadedImage[] => {
    if (selectedImageIds.size > 0) {
      return getSelectedImages();
    }
    return images;
  }, [selectedImageIds, getSelectedImages, images]);

  // Get or generate metadata for an image/platform pair
  const getOrGenerateMetadata = useCallback((
    imageId: string, 
    platformKey: string,
    imageIndex: number
  ): ImageMetadata & { descriptor: string; keywordMaster: string; slugBase: string; deterministicFilename: string } => {
    // Check if metadata exists in map
    let metadata = metadataMap.get(imageId)?.get(platformKey);
    
    // Generate on-the-fly if missing
    if (!metadata) {
      generateMetadataForImage(imageId, platformKey, currentCategory, currentLocation);
      metadata = metadataMap.get(imageId)?.get(platformKey);
    }

    // Build deterministic slug parts
    const keywords = getKeywordsForCategory(currentCategory);
    const keywordMaster = keywords.slice(0, 3).join('; ');
    const descriptor = getRandomDescriptor();
    
    // Find original image for photo_id
    const image = imagesToExport.find(img => img.id === imageId);
    const photoId = image ? stripExtension(image.name) : `img-${imageIndex + 1}`;
    
    const slugBase = buildSlugBase({
      spaceName: SPACE_CONFIG.spaceName,
      neighborhood: SPACE_CONFIG.neighborhood,
      city: SPACE_CONFIG.city,
      keywordMaster: keywords[0] || 'studio',
      descriptor,
      photoId,
    });
    
    const deterministicFilename = buildFilename(slugBase, platformKey);

    return {
      filename: metadata?.filename || deterministicFilename,
      altText: metadata?.altText || `${currentCategory} at ${currentLocation}`,
      caption: metadata?.caption || `${currentCategory} in ${currentLocation}`,
      descriptor,
      keywordMaster,
      slugBase,
      deterministicFilename,
    };
  }, [metadataMap, generateMetadataForImage, currentCategory, currentLocation, imagesToExport]);

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

  // Generate LONG format CSV (one row per image per platform)
  const generateCSV = useCallback((): string => {
    const headers = [
      "original_filename",
      "new_filename", 
      "platform",
      "alt_text",
      "caption",
      "category",
      "location",
      "keyword_master",
      "descriptor",
      "slug_base"
    ];

    const rows: string[][] = [];

    imagesToExport.forEach((img, imgIndex) => {
      selectedFormats.forEach(formatId => {
        const preset = exportPresets.find(p => p.id === formatId);
        if (!preset) return;

        const meta = getOrGenerateMetadata(img.id, preset.platformKey, imgIndex);
        
        rows.push([
          img.name,
          meta.deterministicFilename,
          preset.label,
          `"${meta.altText.replace(/"/g, '""')}"`,
          `"${meta.caption.replace(/"/g, '""')}"`,
          currentCategory,
          currentLocation,
          meta.keywordMaster,
          meta.descriptor,
          meta.slugBase
        ]);
      });
    });

    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  }, [imagesToExport, selectedFormats, getOrGenerateMetadata, currentCategory, currentLocation]);

  // Generate WIDE format master CSV (one row per image with all platform columns)
  const generateMasterCSV = useCallback((): string => {
    const headers = [
      "photo_id",
      "original_filename",
      "category",
      "location",
      "descriptor",
      "keyword_master",
      "slug_base",
      "filename_web",
      "filename_instagram",
      "filename_pinterest",
      "filename_gbp",
      "filename_messaging",
      "filename_print",
      "alt_web",
      "caption_web",
      "caption_instagram",
      "caption_google_business",
      "pinterest_title",
      "pinterest_description",
      "hashtags",
      "notes"
    ];

    const platformKeys = ['web', 'instagram', 'pinterest', 'google-business', 'messaging', 'print'];
    const rows: string[][] = [];

    imagesToExport.forEach((img, imgIndex) => {
      const photoId = stripExtension(img.name);
      
      // Get metadata for all platforms
      const allMeta: Record<string, ReturnType<typeof getOrGenerateMetadata>> = {};
      platformKeys.forEach(pk => {
        allMeta[pk] = getOrGenerateMetadata(img.id, pk, imgIndex);
      });

      // Use web metadata for common fields
      const webMeta = allMeta['web'];
      const keywords = getKeywordsForCategory(currentCategory);
      const hashtags = keywords.slice(0, 5).map(k => `#${k.replace(/\s+/g, '')}`).join(' ');

      rows.push([
        photoId,
        img.name,
        currentCategory,
        currentLocation,
        webMeta.descriptor,
        webMeta.keywordMaster,
        webMeta.slugBase,
        allMeta['web'].deterministicFilename,
        allMeta['instagram'].deterministicFilename,
        allMeta['pinterest'].deterministicFilename,
        allMeta['google-business'].deterministicFilename,
        allMeta['messaging'].deterministicFilename,
        allMeta['print'].deterministicFilename,
        `"${allMeta['web'].altText.replace(/"/g, '""')}"`,
        `"${allMeta['web'].caption.replace(/"/g, '""')}"`,
        `"${allMeta['instagram'].caption.replace(/"/g, '""')}"`,
        `"${allMeta['google-business'].caption.replace(/"/g, '""')}"`,
        `"${currentCategory} Ideas | ${SPACE_CONFIG.neighborhood} ${SPACE_CONFIG.city}"`,
        `"${webMeta.descriptor} perfect for ${currentCategory.toLowerCase()}. Book now!"`,
        hashtags,
        "" // notes - empty by default
      ]);
    });

    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  }, [imagesToExport, getOrGenerateMetadata, currentCategory, currentLocation]);

  const handleExportPack = useCallback(async () => {
    setIsExporting(true);
    setProgress({ step: "Preparing export...", percentage: 0, isComplete: false });

    const zip = new JSZip();
    // Steps: building metadata + (formats * images) + 2 CSVs + finalization
    const totalSteps = 1 + (selectedFormats.size * imagesToExport.length) + 3;
    let currentStep = 0;

    try {
      // Step 1: Building metadata rows
      currentStep++;
      setProgress({ step: "Building metadata rows...", percentage: Math.round((currentStep / totalSteps) * 100), isComplete: false });
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create folders and add images
      for (const formatId of Array.from(selectedFormats)) {
        const preset = exportPresets.find(p => p.id === formatId);
        if (!preset) continue;

        const folderName = platformExportConfigs[preset.platformKey as keyof typeof platformExportConfigs]?.folder || formatId;
        const folder = zip.folder(folderName);

        for (let imgIndex = 0; imgIndex < imagesToExport.length; imgIndex++) {
          const img = imagesToExport[imgIndex];
          currentStep++;
          const pct = Math.round((currentStep / totalSteps) * 100);
          setProgress({ step: `Processing ${preset.label}...`, percentage: pct, isComplete: false });

          // Get deterministic filename
          const meta = getOrGenerateMetadata(img.id, preset.platformKey, imgIndex);

          // In a real implementation, we'd resize/convert the image here
          // For now, we'll fetch the blob from the preview URL
          try {
            const response = await fetch(img.preview);
            const blob = await response.blob();
            folder?.file(meta.deterministicFilename, blob);
          } catch {
            console.warn(`Could not process ${img.name}`);
          }

          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }

      // Generate and add long-format CSV
      currentStep++;
      setProgress({ step: "Generating metadata.csv...", percentage: Math.round((currentStep / totalSteps) * 100), isComplete: false });
      const csv = generateCSV();
      zip.file("metadata.csv", csv);
      await new Promise(resolve => setTimeout(resolve, 50));

      // Generate and add master CSV
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
      a.download = `optimized-images-${Date.now()}.zip`;
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
  }, [selectedFormats, imagesToExport, getOrGenerateMetadata, generateCSV, generateMasterCSV]);

  const handleDownloadCSV = useCallback(() => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metadata-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generateCSV]);

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
                    Download Pack ({selectedFormats.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

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
                  {imagesToExport.slice(0, 6).map((img, idx) => (
                    <div key={img.id} className="aspect-square bg-muted border border-border overflow-hidden relative">
                      <img 
                        src={img.preview} 
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      {idx === 5 && imagesToExport.length > 6 && (
                        <div className="absolute inset-0 bg-foreground/80 flex items-center justify-center">
                          <span className="text-background font-medium">+{imagesToExport.length - 6}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="space-y-4 p-6 bg-muted/50 border border-border">
                  <h3 className="text-caption text-muted-foreground">Export Summary</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Images</span>
                      <span>{imagesToExport.length} {selectedImageIds.size > 0 ? '(selected)' : '(all)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Formats selected</span>
                      <span>{selectedFormats.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total files</span>
                      <span>{imagesToExport.length * selectedFormats.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CSV rows</span>
                      <span>{imagesToExport.length * selectedFormats.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="truncate max-w-[150px]">{currentCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="truncate max-w-[150px]">{currentLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Back Link */}
                <Link 
                  to="/optimize" 
                  className="inline-block text-sm text-muted-foreground hover:text-foreground transition-colors link-editorial"
                >
                  ← Back to optimization
                </Link>
              </div>
            </div>

            {/* Right - Export Options */}
            <div className="lg:col-span-7">
              <h2 className="text-caption text-muted-foreground mb-6">Select Export Formats</h2>
              
              <div className="space-y-4">
                {exportPresets.map((preset) => {
                  const isSelected = selectedFormats.has(preset.id);
                  const isDownloaded = downloaded.has(preset.id);
                  
                  return (
                    <button
                      key={preset.id}
                      onClick={() => toggleFormat(preset.id)}
                      className={cn(
                        "w-full border p-6 transition-all duration-200 text-left",
                        isSelected 
                          ? "border-foreground bg-muted/30" 
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                            isSelected ? "border-foreground bg-foreground" : "border-muted-foreground"
                          )}>
                            {isSelected && <Check className="w-4 h-4 text-background" />}
                          </div>
                          <preset.icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-medium">{preset.label}</h3>
                              {isDownloaded && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Check className="w-3 h-3" />
                                  Exported
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{preset.desc}</p>
                          </div>
                        </div>
                      </div>

                      {/* Specs */}
                      <div className="flex items-center gap-6 mt-4 pl-16 text-xs text-muted-foreground">
                        <span className="font-mono">{preset.format}</span>
                        <span>{preset.dimensions}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ZIP Contents Info */}
              <div className="mt-12 p-6 bg-muted/30 border border-border">
                <h3 className="text-caption text-muted-foreground mb-4">Export Pack Contents</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">Folder Structure</p>
                    <p className="text-muted-foreground text-xs font-mono">
                      /web, /instagram, /pinterest,<br/>
                      /google-business, /messaging, /print
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Metadata CSV</p>
                    <p className="text-muted-foreground text-xs">
                      Includes original filename, new filename, platform, alt text, caption, category, location, keywords
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">Need to optimize more images?</p>
                <Button asChild variant="editorial" size="editorial">
                  <Link to="/library">Back to Library</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
