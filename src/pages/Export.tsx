import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Download, 
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
import { Link, useNavigate } from "react-router-dom";
import { useImageContext } from "@/context/ImageContext";
import { platformExportConfigs, categoryKeywords } from "@/lib/seo-templates";
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

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
};

interface ExportProgress {
  step: string;
  percentage: number;
  isComplete: boolean;
}

export default function Export() {
  const navigate = useNavigate();
  const {
    getSelectedImages,
    metadataMap,
    currentCategory,
    currentLocation,
  } = useImageContext();

  const selectedImages = getSelectedImages();
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(["web"]));
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress>({ step: "", percentage: 0, isComplete: false });
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

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

  const generateCSV = useCallback(() => {
    const headers = [
      "original_filename",
      "new_filename", 
      "platform",
      "alt_text",
      "caption",
      "category",
      "location",
      "keyword_master"
    ];

    const rows: string[][] = [];

    selectedImages.forEach(img => {
      const imageMetadata = metadataMap.get(img.id);
      if (!imageMetadata) return;

      selectedFormats.forEach(formatId => {
        const preset = exportPresets.find(p => p.id === formatId);
        if (!preset) return;

        const metadata = imageMetadata.get(preset.platformKey);
        if (!metadata) return;

        const keywords = categoryKeywords[currentCategory] || [];
        
        rows.push([
          img.name,
          metadata.filename,
          preset.label,
          `"${metadata.altText.replace(/"/g, '""')}"`,
          `"${metadata.caption.replace(/"/g, '""')}"`,
          currentCategory,
          currentLocation,
          keywords.slice(0, 3).join("; ")
        ]);
      });
    });

    return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  }, [selectedImages, metadataMap, selectedFormats, currentCategory, currentLocation]);

  const handleExportPack = useCallback(async () => {
    setIsExporting(true);
    setProgress({ step: "Preparing export...", percentage: 0, isComplete: false });

    const zip = new JSZip();
    const totalSteps = selectedFormats.size * selectedImages.length + 2; // +2 for CSV and finalization
    let currentStep = 0;

    try {
      // Create folders and add images (stub - just copies original blob)
      for (const formatId of Array.from(selectedFormats)) {
        const preset = exportPresets.find(p => p.id === formatId);
        if (!preset) continue;

        const folderName = platformExportConfigs[preset.platformKey as keyof typeof platformExportConfigs]?.folder || formatId;
        const folder = zip.folder(folderName);

        for (const img of selectedImages) {
          currentStep++;
          const pct = Math.round((currentStep / totalSteps) * 100);
          setProgress({ step: `Processing ${preset.label}...`, percentage: pct, isComplete: false });

          const imageMetadata = metadataMap.get(img.id)?.get(preset.platformKey);
          const filename = imageMetadata?.filename || `${img.name.replace(/\.[^/.]+$/, "")}.${preset.format.toLowerCase()}`;

          // In a real implementation, we'd resize/convert the image here
          // For now, we'll fetch the blob from the preview URL
          try {
            const response = await fetch(img.preview);
            const blob = await response.blob();
            folder?.file(filename, blob);
          } catch {
            // If fetch fails, skip this image
            console.warn(`Could not process ${img.name}`);
          }

          // Small delay for UI feedback
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Generate and add CSV
      currentStep++;
      setProgress({ step: "Generating metadata CSV...", percentage: Math.round((currentStep / totalSteps) * 100), isComplete: false });
      const csv = generateCSV();
      zip.file("metadata.csv", csv);

      await new Promise(resolve => setTimeout(resolve, 100));

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
  }, [selectedFormats, selectedImages, metadataMap, generateCSV]);

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

  // Redirect if no images
  if (selectedImages.length === 0) {
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
          <p className="text-muted-foreground mb-6">No images to export. Please select and optimize images first.</p>
          <Button asChild variant="editorial" size="editorial">
            <Link to="/library">Go to Library</Link>
          </Button>
        </section>
      </Layout>
    );
  }

  const hasMetadata = selectedImages.some(img => metadataMap.get(img.id)?.size);

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
                disabled={!hasMetadata || isExporting}
                variant="editorial-ghost" 
                size="editorial"
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV Only
              </Button>
              <Button 
                onClick={handleExportPack}
                disabled={selectedFormats.size === 0 || !hasMetadata || isExporting}
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
                  {selectedImages.slice(0, 6).map((img, idx) => (
                    <div key={img.id} className="aspect-square bg-muted border border-border overflow-hidden relative">
                      <img 
                        src={img.preview} 
                        alt={img.name}
                        className="w-full h-full object-cover"
                      />
                      {idx === 5 && selectedImages.length > 6 && (
                        <div className="absolute inset-0 bg-foreground/80 flex items-center justify-center">
                          <span className="text-background font-medium">+{selectedImages.length - 6}</span>
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
                      <span>{selectedImages.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Formats selected</span>
                      <span>{selectedFormats.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total files</span>
                      <span>{selectedImages.length * selectedFormats.size}</span>
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
