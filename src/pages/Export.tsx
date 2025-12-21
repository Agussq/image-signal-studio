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
import { getKeywordsForCategory } from "@/lib/seo-templates";
import { stripExtension, buildFilename, PLATFORM_KEYS, PlatformKey } from "@/lib/slug-utils";
import JSZip from "jszip";
import Papa from "papaparse";

// Normalized platform keys - single source of truth
const PLATFORMS_TO_EXPORT: PlatformKey[] = ['web', 'instagram', 'pinterest', 'google-business', 'messaging', 'print'];

// UI presets mapping to normalized platform keys
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
    format: "JPG",
    dimensions: "1920 × 1280",
    desc: "SEO-ready, fast loading"
  },
  { 
    id: "google-business", 
    platformKey: "google-business",
    icon: MapPin, 
    label: "Google Business",
    format: "JPG",
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
    format: "JPG",
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
    format: "JPG",
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

// Extended metadata structure expected in metadataMap
interface PersistedMetadata extends ImageMetadata {
  descriptor: string;
  keywordMaster: string;
  slugBase: string;
  neighborhood: string;
  city: string;
  newFilename: string;
}

// CSV row structure for long format (row-per-file) - exact schema required
interface CSVRow {
  original_filename: string;
  platform: string;
  new_filename: string;
  alt_text: string;
  caption: string;
  category: string;
  location: string;
  keyword_master: string;
  descriptor: string;
  slug_base: string;
}

// Export manifest for debug/verification
interface ExportManifest {
  selectedImageCount: number;
  platformCount: number;
  expectedTotalFiles: number;
  actualZipFiles: number;
  csvRowsGenerated: number;
}

export default function Export() {
  const {
    images,
    selectedImageIds,
    getSelectedImages,
    metadataMap,
    currentCategory,
  } = useImageContext();

  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(["web"]));
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress>({ step: "", percentage: 0, isComplete: false });
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());
  const [exportError, setExportError] = useState<ExportError | null>(null);
  const [manifest, setManifest] = useState<ExportManifest | null>(null);

  // Single source of truth: imagesToExport
  const imagesToExport = useMemo((): UploadedImage[] => {
    if (selectedImageIds.size > 0) {
      return getSelectedImages();
    }
    return images;
  }, [selectedImageIds, getSelectedImages, images]);

  // Selected platform keys (normalized) from UI selection
  const selectedPlatformKeys = useMemo((): PlatformKey[] => {
    return Array.from(selectedFormats)
      .map(id => exportPresets.find(p => p.id === id)?.platformKey)
      .filter((pk): pk is PlatformKey => pk !== undefined);
  }, [selectedFormats]);

  // Check for missing metadata - returns list of missing pairs
  const checkMissingMetadata = useCallback((): Array<{ imageId: string; imageName: string; platformKey: PlatformKey }> => {
    const missing: Array<{ imageId: string; imageName: string; platformKey: PlatformKey }> = [];
    
    imagesToExport.forEach(image => {
      selectedPlatformKeys.forEach(platformKey => {
        const platformMap = metadataMap.get(image.id);
        const meta = platformMap?.get(platformKey) as PersistedMetadata | undefined;
        
        // Metadata is missing if not present or missing required fields
        if (!meta || !meta.slugBase || !meta.newFilename) {
          missing.push({ imageId: image.id, imageName: image.name, platformKey });
        }
      });
    });
    
    return missing;
  }, [imagesToExport, selectedPlatformKeys, metadataMap]);

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

  // Escape caption for CSV - replace real newlines with literal \n
  const sanitizeCaption = useCallback((caption: string): string => {
    // Replace actual newlines with literal \n for CSV readability
    return caption.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n');
  }, []);

  // Build export data from PERSISTED metadata only (no regeneration)
  // CRITICAL: NO truncation - use full values for export
  const buildExportData = useCallback((): { csvRows: CSVRow[]; fileEntries: Array<{ platformKey: PlatformKey; filename: string; image: UploadedImage }> } | null => {
    const csvRows: CSVRow[] = [];
    const fileEntries: Array<{ platformKey: PlatformKey; filename: string; image: UploadedImage }> = [];

    for (const image of imagesToExport) {
      for (const platformKey of selectedPlatformKeys) {
        const platformMap = metadataMap.get(image.id);
        const meta = platformMap?.get(platformKey) as PersistedMetadata | undefined;

        // If metadata missing, return null (caller should handle)
        if (!meta || !meta.slugBase || !meta.newFilename) {
          return null;
        }

        // Use persisted filename directly - FULL filename, no truncation
        const filename = meta.newFilename;

        // Build location string (will be properly escaped by PapaParse)
        const location = `${meta.neighborhood}, ${meta.city}`;

        // CSV row with exact schema required
        // CRITICAL: Use full values, no truncation, no ellipses
        csvRows.push({
          original_filename: image.name,
          platform: platformKey,
          new_filename: filename,
          alt_text: meta.altText,
          caption: sanitizeCaption(meta.caption),
          category: currentCategory,
          location: location,
          keyword_master: meta.keywordMaster,
          descriptor: meta.descriptor,
          slug_base: meta.slugBase,
        });

        // File entry
        fileEntries.push({
          platformKey,
          filename,
          image,
        });
      }
    }

    return { csvRows, fileEntries };
  }, [imagesToExport, selectedPlatformKeys, metadataMap, currentCategory, sanitizeCaption]);

  // Self-test: verify counts match before download
  const runSelfTest = useCallback((
    expectedFiles: number,
    actualZipFiles: number,
    csvRowCount: number
  ): { valid: boolean; error: string | null } => {
    if (expectedFiles !== actualZipFiles) {
      return { 
        valid: false, 
        error: `ZIP file count mismatch: expected ${expectedFiles}, got ${actualZipFiles}` 
      };
    }
    if (expectedFiles !== csvRowCount) {
      return { 
        valid: false, 
        error: `CSV row count mismatch: expected ${expectedFiles}, got ${csvRowCount}` 
      };
    }
    return { valid: true, error: null };
  }, []);

  // Generate RFC-compliant CSV using PapaParse
  // All fields are quoted to ensure proper escaping of commas, quotes, newlines
  const generateCSV = useCallback((rows: CSVRow[]): string => {
    return Papa.unparse(rows, {
      quotes: true, // Quote ALL fields for safety
      quoteChar: '"',
      escapeChar: '"',
      header: true,
    });
  }, []);

  // Generate master CSV (wide format - row per photo)
  const generateMasterCSV = useCallback((): string | null => {
    const rows: Array<Record<string, string>> = [];

    for (const image of imagesToExport) {
      const allMeta: Partial<Record<PlatformKey, PersistedMetadata>> = {};
      
      // Gather all platform metadata for this image
      for (const pk of PLATFORM_KEYS) {
        const platformMap = metadataMap.get(image.id);
        const meta = platformMap?.get(pk) as PersistedMetadata | undefined;
        if (meta && meta.slugBase && meta.newFilename) {
          allMeta[pk] = meta;
        }
      }

      const webMeta = allMeta['web'];
      if (!webMeta) continue; // Skip if no web metadata

      const keywords = getKeywordsForCategory(currentCategory);
      const hashtags = keywords.slice(0, 5).map(k => `#${k.replace(/\s+/g, '')}`).join(' ');

      rows.push({
        photo_id: stripExtension(image.name),
        original_filename: image.name,
        category: currentCategory,
        neighborhood: webMeta.neighborhood,
        city: webMeta.city,
        descriptor: webMeta.descriptor,
        keyword_master: webMeta.keywordMaster,
        slug_base: webMeta.slugBase,
        filename_web: allMeta['web']?.newFilename || '',
        filename_instagram: allMeta['instagram']?.newFilename || '',
        filename_pinterest: allMeta['pinterest']?.newFilename || '',
        filename_gbp: allMeta['google-business']?.newFilename || '',
        filename_messaging: allMeta['messaging']?.newFilename || '',
        filename_print: allMeta['print']?.newFilename || '',
        alt_web: allMeta['web']?.altText || '',
        caption_web: allMeta['web']?.caption || '',
        caption_instagram: allMeta['instagram']?.caption || '',
        caption_google_business: allMeta['google-business']?.caption || '',
        pinterest_title: `${currentCategory} Ideas | ${webMeta.neighborhood} ${webMeta.city}`,
        pinterest_description: `${webMeta.descriptor} perfect for ${currentCategory.toLowerCase()}. Book now!`,
        hashtags,
        notes: '',
      });
    }

    return Papa.unparse(rows, { quotes: true, header: true });
  }, [imagesToExport, metadataMap, currentCategory]);

  const handleExportPack = useCallback(async () => {
    setExportError(null);
    setManifest(null);

    // Step 1: Check for missing metadata FIRST
    const missing = checkMissingMetadata();
    if (missing.length > 0) {
      const details = missing.slice(0, 10).map(m => `${m.imageName} → ${m.platformKey}`);
      if (missing.length > 10) {
        details.push(`... and ${missing.length - 10} more`);
      }
      setExportError({
        message: "Missing metadata. Please run Optimize first.",
        details,
      });
      return;
    }

    setIsExporting(true);
    setProgress({ step: "Reading persisted metadata...", percentage: 0, isComplete: false });

    const zip = new JSZip();
    const exportData = buildExportData();

    if (!exportData) {
      setExportError({
        message: "Failed to read metadata. Please run Optimize first.",
        details: [],
      });
      setIsExporting(false);
      return;
    }

    const { csvRows, fileEntries } = exportData;
    const expectedFileCount = imagesToExport.length * selectedPlatformKeys.length;
    let addedFileCount = 0;

    const totalSteps = 2 + fileEntries.length + 3;
    let currentStep = 0;

    try {
      // Step: Building metadata rows
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
          addedFileCount++;
        } catch {
          console.warn(`Could not process ${entry.image.name}`);
        }

        await new Promise(resolve => setTimeout(resolve, 20));
      }

      // Update manifest with current counts
      const currentManifest: ExportManifest = {
        selectedImageCount: imagesToExport.length,
        platformCount: selectedPlatformKeys.length,
        expectedTotalFiles: expectedFileCount,
        actualZipFiles: addedFileCount,
        csvRowsGenerated: csvRows.length,
      };
      setManifest(currentManifest);

      // Step: Self-test before download
      currentStep++;
      setProgress({ step: "Running self-test...", percentage: Math.round((currentStep / totalSteps) * 100), isComplete: false });
      await new Promise(resolve => setTimeout(resolve, 50));

      const selfTest = runSelfTest(expectedFileCount, addedFileCount, csvRows.length);
      if (!selfTest.valid) {
        setExportError({
          message: "Self-test failed: ZIP/CSV mismatch",
          details: [selfTest.error || "Unknown error"],
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
      if (masterCsv) {
        zip.file("metadata_master.csv", masterCsv);
      }
      await new Promise(resolve => setTimeout(resolve, 50));

      // Finalize
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
      setExportError({
        message: "Export failed unexpectedly.",
        details: [String(error)],
      });
      setIsExporting(false);
      setProgress({ step: "", percentage: 0, isComplete: false });
    }
  }, [
    checkMissingMetadata, 
    buildExportData, 
    imagesToExport.length, 
    selectedPlatformKeys, 
    runSelfTest, 
    generateCSV, 
    generateMasterCSV,
    selectedFormats
  ]);

  const handleDownloadCSV = useCallback(() => {
    setExportError(null);
    
    const missing = checkMissingMetadata();
    if (missing.length > 0) {
      const details = missing.slice(0, 10).map(m => `${m.imageName} → ${m.platformKey}`);
      setExportError({
        message: "Missing metadata. Please run Optimize first.",
        details,
      });
      return;
    }

    const exportData = buildExportData();
    if (!exportData) {
      setExportError({
        message: "Failed to read metadata.",
        details: [],
      });
      return;
    }

    // Update manifest for visibility
    const expectedCount = imagesToExport.length * selectedPlatformKeys.length;
    setManifest({
      selectedImageCount: imagesToExport.length,
      platformCount: selectedPlatformKeys.length,
      expectedTotalFiles: expectedCount,
      actualZipFiles: exportData.fileEntries.length,
      csvRowsGenerated: exportData.csvRows.length,
    });

    const csv = generateCSV(exportData.csvRows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metadata-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [checkMissingMetadata, buildExportData, generateCSV, imagesToExport.length, selectedPlatformKeys.length]);

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
                variant="outline"
                size="editorial"
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Export CSV Only
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Error Display */}
      {exportError && (
        <section className="py-6 px-6 lg:px-12 border-b border-destructive/30 bg-destructive/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-destructive">{exportError.message}</p>
                {exportError.details.length > 0 && (
                  <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                    {exportError.details.map((detail, i) => (
                      <li key={i}>• {detail}</li>
                    ))}
                  </ul>
                )}
                <Button
                  variant="link"
                  className="mt-2 p-0 h-auto text-sm"
                  onClick={() => setExportError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Image Count Summary */}
      <section className="py-8 px-6 lg:px-12 border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm">
                {selectedImageIds.size > 0 ? (
                  <>Exporting <strong>{selectedImageIds.size}</strong> selected image{selectedImageIds.size !== 1 ? 's' : ''}</>
                ) : (
                  <>Exporting <strong>all {images.length}</strong> image{images.length !== 1 ? 's' : ''}</>
                )}
              </span>
            </div>
            {selectedFormats.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {expectedFileCount} files will be generated ({imagesToExport.length} × {selectedPlatformKeys.length} platforms)
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Format Selection */}
      <section className="py-16 lg:py-20 px-6 lg:px-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-medium mb-8">Select export formats</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportPresets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedFormats.has(preset.id);
              const isDownloaded = downloaded.has(preset.id);
              
              return (
                <button
                  key={preset.id}
                  onClick={() => toggleFormat(preset.id)}
                  disabled={isExporting}
                  className={cn(
                    "group relative p-6 border text-left transition-all duration-200",
                    "hover:border-foreground/50",
                    isSelected 
                      ? "border-foreground bg-foreground/5" 
                      : "border-border",
                    isDownloaded && "border-green-500/50 bg-green-500/5"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className={cn(
                      "w-6 h-6 transition-colors",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )} />
                    {isSelected && !isDownloaded && (
                      <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-background" />
                      </div>
                    )}
                    {isDownloaded && (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium mb-1">{preset.label}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{preset.desc}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{preset.format}</span>
                    <span>•</span>
                    <span>{preset.dimensions}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Progress UI */}
      {isExporting && (
        <section className="py-12 px-6 lg:px-12 border-b border-border bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              {progress.isComplete ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
              <span className="text-sm">{progress.step}</span>
            </div>
            <div className="w-full bg-border h-2 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300",
                  progress.isComplete ? "bg-green-500" : "bg-foreground"
                )}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Export Manifest Panel - Debug/Verification */}
      {manifest && (
        <section className="py-8 px-6 lg:px-12 border-b border-border bg-muted/20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Export Manifest</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="p-3 border border-border bg-background">
                <p className="text-muted-foreground text-xs mb-1">Selected Images</p>
                <p className="font-mono font-medium">{manifest.selectedImageCount}</p>
              </div>
              <div className="p-3 border border-border bg-background">
                <p className="text-muted-foreground text-xs mb-1">Platforms</p>
                <p className="font-mono font-medium">{manifest.platformCount}</p>
              </div>
              <div className="p-3 border border-border bg-background">
                <p className="text-muted-foreground text-xs mb-1">Expected Files</p>
                <p className="font-mono font-medium">{manifest.expectedTotalFiles}</p>
              </div>
              <div className="p-3 border border-border bg-background">
                <p className="text-muted-foreground text-xs mb-1">ZIP Files Added</p>
                <p className={cn(
                  "font-mono font-medium",
                  manifest.actualZipFiles === manifest.expectedTotalFiles ? "text-green-600" : "text-destructive"
                )}>{manifest.actualZipFiles}</p>
              </div>
              <div className="p-3 border border-border bg-background">
                <p className="text-muted-foreground text-xs mb-1">CSV Rows</p>
                <p className={cn(
                  "font-mono font-medium",
                  manifest.csvRowsGenerated === manifest.expectedTotalFiles ? "text-green-600" : "text-destructive"
                )}>{manifest.csvRowsGenerated}</p>
              </div>
            </div>
            {manifest.actualZipFiles === manifest.expectedTotalFiles && 
             manifest.csvRowsGenerated === manifest.expectedTotalFiles && (
              <p className="text-xs text-green-600 mt-3 flex items-center gap-2">
                <Check className="w-3 h-3" />
                All counts match — export is consistent
              </p>
            )}
          </div>
        </section>
      )}

      {/* Export Button */}
      <section className="py-16 lg:py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <Button 
            onClick={handleExportPack}
            disabled={!canExport || isExporting}
            variant="editorial"
            size="editorial"
            className="gap-3"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                Download Export Pack
              </>
            )}
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            ZIP includes platform folders, metadata.csv, and metadata_master.csv
          </p>
        </div>
      </section>
    </Layout>
  );
}
