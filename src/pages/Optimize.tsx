import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  MapPin, 
  Instagram, 
  Share2, 
  MessageCircle, 
  Printer,
  Sparkles,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "react-router-dom";
import { useImageContext } from "@/context/ImageContext";
import { categoryKeywords } from "@/lib/seo-templates";

const platforms = [
  { id: "website", icon: Globe, label: "Website (SEO)", desc: "Optimized for search engines" },
  { id: "google-maps", icon: MapPin, label: "Google Maps", desc: "Local business visibility" },
  { id: "instagram", icon: Instagram, label: "Instagram", desc: "Engagement-focused" },
  { id: "pinterest", icon: Share2, label: "Pinterest", desc: "Discovery optimized" },
  { id: "messaging", icon: MessageCircle, label: "WhatsApp/iMessage", desc: "Fast loading previews" },
  { id: "print", icon: Printer, label: "Hi-Res Print", desc: "Maximum quality" },
];

const categories = Object.keys(categoryKeywords);

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export default function Optimize() {
  const navigate = useNavigate();
  const {
    getSelectedImages,
    metadataMap,
    generateMetadataForImage,
    generateMetadataForAll,
    updateMetadata,
    markAsOptimized,
    currentPlatform,
    setCurrentPlatform,
    currentCategory,
    setCurrentCategory,
    currentLocation,
    setCurrentLocation,
  } = useImageContext();

  const selectedImages = getSelectedImages();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentImage = selectedImages[currentImageIndex];
  const currentMetadata = currentImage 
    ? metadataMap.get(currentImage.id)?.get(currentPlatform) 
    : null;

  const platform = platforms.find(p => p.id === currentPlatform);

  // Redirect if no images selected
  useEffect(() => {
    if (selectedImages.length === 0) {
      // Don't redirect immediately, give context time to load
      const timer = setTimeout(() => {
        if (selectedImages.length === 0) {
          navigate("/library");
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedImages.length, navigate]);

  const handleGenerateCurrent = () => {
    if (!currentImage) return;
    setIsGenerating(true);
    setTimeout(() => {
      generateMetadataForImage(currentImage.id, currentPlatform, currentCategory, currentLocation);
      setIsGenerating(false);
    }, 800);
  };

  const handleGenerateAll = () => {
    setIsGenerating(true);
    setTimeout(() => {
      generateMetadataForAll(currentPlatform, currentCategory, currentLocation);
      markAsOptimized(selectedImages.map(img => img.id));
      setIsGenerating(false);
    }, 1200);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => Math.min(selectedImages.length - 1, prev + 1));
  };

  const handleContinueToExport = () => {
    markAsOptimized(selectedImages.map(img => img.id));
    navigate("/export");
  };

  if (selectedImages.length === 0) {
    return (
      <Layout>
        <section className="py-16 lg:py-20 px-6 lg:px-12 border-b border-border">
          <div className="max-w-7xl mx-auto">
            <p className="text-caption text-muted-foreground mb-4">Optimization Panel</p>
            <h1 className="heading-editorial">Configure & generate</h1>
          </div>
        </section>
        <section className="py-24 px-6 lg:px-12 text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-6 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-6">No images selected. Please select images from the library first.</p>
          <Button asChild variant="editorial" size="editorial">
            <Link to="/library">Go to Library</Link>
          </Button>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 lg:py-20 px-6 lg:px-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-caption text-muted-foreground mb-4">Optimization Panel</p>
              <h1 className="heading-editorial">Configure & generate</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Column - Image List + Preview */}
            <div className="lg:col-span-5 space-y-6">
              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 border-2 overflow-hidden transition-all",
                      idx === currentImageIndex
                        ? "border-foreground"
                        : "border-border hover:border-muted-foreground opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Main Preview */}
              <div className="relative aspect-[4/3] bg-muted border border-border overflow-hidden">
                <img 
                  src={currentImage?.preview} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                
                {/* Navigation */}
                {selectedImages.length > 1 && (
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                    <Button
                      variant="editorial-ghost"
                      size="sm"
                      onClick={handlePrevImage}
                      disabled={currentImageIndex === 0}
                      className="bg-background/80 backdrop-blur-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="bg-background/80 backdrop-blur-sm px-3 py-1 text-sm">
                      {currentImageIndex + 1} / {selectedImages.length}
                    </span>
                    <Button
                      variant="editorial-ghost"
                      size="sm"
                      onClick={handleNextImage}
                      disabled={currentImageIndex === selectedImages.length - 1}
                      className="bg-background/80 backdrop-blur-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Image Info */}
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Original</p>
                  <p className="font-mono text-sm truncate max-w-[200px]">{currentImage?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Size</p>
                  <p className="text-sm">{currentImage ? formatFileSize(currentImage.size) : '-'}</p>
                </div>
              </div>
            </div>

            {/* Right Column - Settings & Generated Metadata */}
            <div className="lg:col-span-7 space-y-10">
              {/* Platform Selection */}
              <div>
                <h3 className="text-caption text-muted-foreground mb-4">Platform Preset</h3>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setCurrentPlatform(p.id)}
                      className={cn(
                        "p-4 border text-left transition-all duration-200",
                        currentPlatform === p.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <p.icon className={cn(
                        "w-5 h-5 mb-2",
                        currentPlatform === p.id ? "text-background" : "text-muted-foreground"
                      )} />
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        currentPlatform === p.id ? "text-background/70" : "text-muted-foreground"
                      )}>
                        {p.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <h3 className="text-caption text-muted-foreground mb-4">Content Category</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCurrentCategory(cat)}
                      className={cn(
                        "px-4 py-2 text-sm border transition-all duration-200",
                        currentCategory === cat
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-caption text-muted-foreground mb-4">Location Context</h3>
                <input
                  type="text"
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  placeholder="e.g., SoHo, New York City"
                  className="w-full px-4 py-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              {/* Generate Buttons */}
              <div className="flex gap-3">
                <Button 
                  onClick={handleGenerateCurrent}
                  disabled={isGenerating}
                  variant="editorial" 
                  size="editorial"
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate for Current
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  variant="editorial-filled" 
                  size="editorial"
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate for All ({selectedImages.length})
                    </>
                  )}
                </Button>
              </div>

              {/* Generated Metadata */}
              {currentMetadata ? (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-foreground rounded-full" />
                    <span>Generated for {platform?.label}</span>
                    <span className="text-caption bg-muted text-muted-foreground px-2 py-0.5 ml-2">
                      AI-Generated
                    </span>
                  </div>

                  {/* Filename */}
                  <div>
                    <label className="text-caption text-muted-foreground block mb-2">
                      Optimized Filename
                    </label>
                    <input
                      type="text"
                      value={currentMetadata.filename}
                      onChange={(e) => updateMetadata(currentImage!.id, currentPlatform, { filename: e.target.value })}
                      className="w-full px-4 py-3 border border-border bg-transparent font-mono text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>

                  {/* Alt Text */}
                  <div>
                    <label className="text-caption text-muted-foreground block mb-2">
                      Alt Text
                    </label>
                    <textarea
                      value={currentMetadata.altText}
                      onChange={(e) => updateMetadata(currentImage!.id, currentPlatform, { altText: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                    />
                    <p className={cn(
                      "text-xs mt-1",
                      currentMetadata.altText.length >= 80 && currentMetadata.altText.length <= 125
                        ? "text-muted-foreground"
                        : "text-destructive"
                    )}>
                      {currentMetadata.altText.length} characters • Recommended: 80–125
                    </p>
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="text-caption text-muted-foreground block mb-2">
                      Caption
                    </label>
                    <textarea
                      value={currentMetadata.caption}
                      onChange={(e) => updateMetadata(currentImage!.id, currentPlatform, { caption: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                    />
                  </div>

                  {/* Export Button */}
                  <Button 
                    onClick={handleContinueToExport}
                    variant="editorial" 
                    size="editorial-lg" 
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Continue to Export
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Sparkles className="w-8 h-8 mx-auto mb-4 opacity-50" />
                  <p>Select your platform and click generate to create optimized metadata</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
