import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Check, 
  FileImage, 
  Package,
  Globe,
  MapPin,
  Instagram,
  Share2,
  Printer
} from "lucide-react";
import studioImage from "@/assets/studio-hero.jpg";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const exportPresets = [
  { 
    id: "web", 
    icon: Globe, 
    label: "Web-Optimized",
    format: "WebP",
    size: "284 KB",
    dimensions: "1920 × 1280",
    desc: "SEO-ready, fast loading"
  },
  { 
    id: "google", 
    icon: MapPin, 
    label: "Google-Ready",
    format: "WebP",
    size: "320 KB",
    dimensions: "1200 × 900",
    desc: "Maps & Business Profile"
  },
  { 
    id: "instagram", 
    icon: Instagram, 
    label: "Instagram-Ready",
    format: "JPG",
    size: "450 KB",
    dimensions: "1080 × 1350",
    desc: "Portrait ratio, high quality"
  },
  { 
    id: "pinterest", 
    icon: Share2, 
    label: "Pinterest-Ready",
    format: "PNG",
    size: "380 KB",
    dimensions: "1000 × 1500",
    desc: "Vertical pin format"
  },
  { 
    id: "print", 
    icon: Printer, 
    label: "Print-Ready",
    format: "TIFF",
    size: "48.2 MB",
    dimensions: "6000 × 4000",
    desc: "Full resolution, 300 DPI"
  },
];

// Demo export item
const demoExportItem = {
  preview: studioImage,
  originalName: "IMG_4521.jpg",
  optimizedName: "soho-photo-studio-natural-light-nyc",
  altText: "Professional photo studio in SoHo NYC featuring natural lighting setup",
  caption: "Our SoHo studio space offers 2,000 sq ft of versatile shooting area...",
};

export default function Export() {
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(["web"]));
  const [downloading, setDownloading] = useState<string | null>(null);
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

  const downloadFormat = (id: string) => {
    setDownloading(id);
    setTimeout(() => {
      setDownloading(null);
      setDownloaded(prev => new Set([...prev, id]));
    }, 1500);
  };

  const downloadAll = () => {
    setDownloading("all");
    setTimeout(() => {
      setDownloading(null);
      setDownloaded(new Set(exportPresets.map(p => p.id)));
    }, 2000);
  };

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 lg:py-20 px-6 lg:px-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-caption text-muted-foreground mb-4">Export</p>
              <h1 className="heading-editorial">
                Download & deploy
              </h1>
            </div>
            <Button 
              onClick={downloadAll}
              disabled={downloading === "all"}
              variant="editorial-filled" 
              size="editorial-lg"
            >
              {downloading === "all" ? (
                <>
                  <Package className="w-4 h-4 mr-2 animate-pulse" />
                  Preparing...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Download All Formats
                </>
              )}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left - Image Preview */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-6">
                {/* Image */}
                <div className="aspect-[4/3] bg-muted border border-border overflow-hidden">
                  <img 
                    src={demoExportItem.preview} 
                    alt="Export preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Metadata Summary */}
                <div className="space-y-4 p-6 bg-muted/50 border border-border">
                  <h3 className="text-caption text-muted-foreground">Embedded Metadata</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Filename</p>
                      <p className="font-mono text-xs">{demoExportItem.optimizedName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Alt Text</p>
                      <p className="text-xs leading-relaxed">{demoExportItem.altText}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Caption</p>
                      <p className="text-xs leading-relaxed line-clamp-2">{demoExportItem.caption}</p>
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
              <h2 className="text-caption text-muted-foreground mb-6">Export Formats</h2>
              
              <div className="space-y-4">
                {exportPresets.map((preset) => {
                  const isDownloaded = downloaded.has(preset.id);
                  const isDownloading = downloading === preset.id || downloading === "all";
                  
                  return (
                    <div 
                      key={preset.id}
                      className={cn(
                        "border p-6 transition-all duration-200",
                        isDownloaded 
                          ? "border-foreground bg-muted/30" 
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <preset.icon className="w-5 h-5 mt-0.5 text-muted-foreground" />
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-medium">{preset.label}</h3>
                              {isDownloaded && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Check className="w-3 h-3" />
                                  Downloaded
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{preset.desc}</p>
                          </div>
                        </div>

                        <Button 
                          onClick={() => downloadFormat(preset.id)}
                          disabled={isDownloading}
                          variant={isDownloaded ? "editorial-ghost" : "editorial"}
                          size="sm"
                        >
                          {isDownloading ? (
                            <FileImage className="w-4 h-4 animate-pulse" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* Specs */}
                      <div className="flex items-center gap-6 mt-4 pl-9 text-xs text-muted-foreground">
                        <span className="font-mono">{preset.format}</span>
                        <span>{preset.size}</span>
                        <span>{preset.dimensions}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Usage Tips */}
              <div className="mt-12 p-6 bg-muted/30 border border-border">
                <h3 className="text-caption text-muted-foreground mb-4">Quick Reference</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">Web-Optimized</p>
                    <p className="text-muted-foreground text-xs">
                      Use for website uploads, blog posts, and anywhere page speed matters
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Google-Ready</p>
                    <p className="text-muted-foreground text-xs">
                      Upload to Google Business Profile, Maps, and local SEO listings
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Instagram-Ready</p>
                    <p className="text-muted-foreground text-xs">
                      Portrait format optimized for feed posts and maximum engagement
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Print-Ready</p>
                    <p className="text-muted-foreground text-xs">
                      Full resolution for physical prints, magazines, and publications
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">Ready to optimize more images?</p>
                <Button asChild variant="editorial" size="editorial">
                  <Link to="/library">
                    Back to Library
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
