import { useState } from "react";
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
  Check,
  ChevronRight
} from "lucide-react";
import studioImage from "@/assets/studio-hero.jpg";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const platforms = [
  { id: "website", icon: Globe, label: "Website (SEO)", desc: "Optimized for search engines" },
  { id: "google-maps", icon: MapPin, label: "Google Maps", desc: "Local business visibility" },
  { id: "instagram", icon: Instagram, label: "Instagram", desc: "Engagement-focused" },
  { id: "pinterest", icon: Share2, label: "Pinterest", desc: "Discovery optimized" },
  { id: "messaging", icon: MessageCircle, label: "WhatsApp/iMessage", desc: "Fast loading previews" },
  { id: "print", icon: Printer, label: "Hi-Res Print", desc: "Maximum quality" },
];

const categories = [
  "Studio Photography",
  "Event Coverage", 
  "Fashion / Editorial",
  "Product Photography",
  "Portrait / Headshots",
  "Architecture / Interiors",
];

// Demo image for the optimization panel
const demoImage = {
  id: "demo",
  name: "IMG_4521.jpg",
  preview: studioImage,
  originalSize: "18.4 MB",
};

export default function Optimize() {
  const [selectedPlatform, setSelectedPlatform] = useState("website");
  const [selectedCategory, setSelectedCategory] = useState("Studio Photography");
  const [location, setLocation] = useState("SoHo, New York City");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const [metadata, setMetadata] = useState({
    filename: "",
    altText: "",
    caption: "",
  });

  const generateMetadata = () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const platformConfig = {
        "website": {
          filename: "soho-photo-studio-natural-light-nyc.webp",
          altText: "Professional photo studio in SoHo NYC featuring natural lighting setup, white cyclorama wall, and minimalist interior design for commercial photography",
          caption: "Our SoHo studio space offers 2,000 sq ft of versatile shooting area with floor-to-ceiling windows providing exceptional natural light throughout the day.",
        },
        "google-maps": {
          filename: "soho-nyc-photo-studio.webp",
          altText: "Photo studio SoHo New York City professional photography space rental",
          caption: "Professional photo studio in the heart of SoHo, NYC. 2,000 sq ft with natural lighting, cyclorama, and event space. Available for hourly and daily rentals.",
        },
        "instagram": {
          filename: "soho-studio-vibes.jpg",
          altText: "Creative photo studio space in SoHo New York",
          caption: "Where the magic happens ✨ Natural light flooding through our downtown studio. This is what 2PM in SoHo looks like 🌤️\n\n#sohonyc #photostudio #naturallight #creativespace #nycphotographer",
        },
        "pinterest": {
          filename: "nyc-photo-studio-inspiration-soho.webp",
          altText: "Minimalist photo studio interior design inspiration with natural lighting - SoHo New York photography space",
          caption: "Photo Studio Design Inspiration | SoHo NYC | Natural Light Photography Space | Minimalist Interior | White Cyclorama | Creative Studio Rental",
        },
        "messaging": {
          filename: "studio-preview.jpg",
          altText: "Photo studio space",
          caption: "Here's the studio I was telling you about! Check it out 📸",
        },
        "print": {
          filename: "soho-studio-interior-highres.tiff",
          altText: "High resolution interior photograph of professional photography studio in SoHo Manhattan",
          caption: "Interior view - SoHo Photography Studio © 2024",
        },
      };

      const config = platformConfig[selectedPlatform as keyof typeof platformConfig];
      setMetadata(config);
      setIsGenerating(false);
      setGenerated(true);
    }, 1500);
  };

  const platform = platforms.find(p => p.id === selectedPlatform);

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 lg:py-20 px-6 lg:px-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <p className="text-caption text-muted-foreground mb-4">Optimization Panel</p>
          <h1 className="heading-editorial">
            Configure & generate
          </h1>
        </div>
      </section>

      <section className="py-12 lg:py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Column - Settings */}
            <div className="lg:col-span-5 space-y-10">
              {/* Platform Selection */}
              <div>
                <h3 className="text-caption text-muted-foreground mb-4">Platform Preset</h3>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPlatform(p.id);
                        setGenerated(false);
                      }}
                      className={cn(
                        "p-4 border text-left transition-all duration-200",
                        selectedPlatform === p.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <p.icon className={cn(
                        "w-5 h-5 mb-2",
                        selectedPlatform === p.id ? "text-background" : "text-muted-foreground"
                      )} />
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className={cn(
                        "text-xs mt-1",
                        selectedPlatform === p.id ? "text-background/70" : "text-muted-foreground"
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
                      onClick={() => {
                        setSelectedCategory(cat);
                        setGenerated(false);
                      }}
                      className={cn(
                        "px-4 py-2 text-sm border transition-all duration-200",
                        selectedCategory === cat
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
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setGenerated(false);
                  }}
                  placeholder="e.g., SoHo, New York City"
                  className="w-full px-4 py-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateMetadata}
                disabled={isGenerating}
                variant="editorial-filled" 
                size="editorial-lg"
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : generated ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Metadata
                  </>
                )}
              </Button>
            </div>

            {/* Right Column - Preview & Results */}
            <div className="lg:col-span-7 space-y-8">
              {/* Image Preview */}
              <div className="aspect-[4/3] bg-muted border border-border overflow-hidden">
                <img 
                  src={demoImage.preview} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Original Info */}
              <div className="flex items-center justify-between py-4 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Original</p>
                  <p className="font-mono text-sm">{demoImage.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Size</p>
                  <p className="text-sm">{demoImage.originalSize}</p>
                </div>
              </div>

              {/* Generated Metadata */}
              {generated && (
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
                      value={metadata.filename}
                      onChange={(e) => setMetadata(prev => ({ ...prev, filename: e.target.value }))}
                      className="w-full px-4 py-3 border border-border bg-transparent font-mono text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>

                  {/* Alt Text */}
                  <div>
                    <label className="text-caption text-muted-foreground block mb-2">
                      Alt Text
                    </label>
                    <textarea
                      value={metadata.altText}
                      onChange={(e) => setMetadata(prev => ({ ...prev, altText: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {metadata.altText.length} characters • Recommended: 80-125
                    </p>
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="text-caption text-muted-foreground block mb-2">
                      Caption
                    </label>
                    <textarea
                      value={metadata.caption}
                      onChange={(e) => setMetadata(prev => ({ ...prev, caption: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-border bg-transparent text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                    />
                  </div>

                  {/* Export Button */}
                  <Link to="/export">
                    <Button variant="editorial" size="editorial-lg" className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Continue to Export
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}

              {/* Empty State */}
              {!generated && !isGenerating && (
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
