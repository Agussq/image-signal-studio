import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ChevronDown, FileText, Type, Image, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface EducationCardProps {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function EducationCard({ icon: Icon, title, subtitle, content, isOpen, onToggle }: EducationCardProps) {
  return (
    <div className="border border-border hover:border-foreground/50 transition-colors duration-300">
      <button
        onClick={onToggle}
        className="w-full p-8 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-6">
          <Icon className="w-6 h-6 text-muted-foreground" />
          <div>
            <h3 className="font-serif text-xl lg:text-2xl mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <ChevronDown 
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-500 ease-out",
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-8 pb-8 pt-0">
          <div className="pl-12 border-l border-border">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Education() {
  const [openCards, setOpenCards] = useState<Set<string>>(new Set(['alt-text']));

  const toggleCard = (id: string) => {
    setOpenCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const educationItems = [
    {
      id: "alt-text",
      icon: Type,
      title: "What is Alt Text?",
      subtitle: "The invisible layer that makes images visible to machines",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Alt text (alternative text) is a written description embedded in an image's HTML code. 
            While invisible to most users, it's read by search engines, AI systems, and screen readers.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-muted/50 p-6">
              <p className="text-caption text-muted-foreground mb-3">Who Reads Alt Text</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground rounded-full" />
                  Google Image Search
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground rounded-full" />
                  ChatGPT & Gemini
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground rounded-full" />
                  Screen Readers (Accessibility)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground rounded-full" />
                  Pinterest Algorithm
                </li>
              </ul>
            </div>
            <div className="bg-muted/50 p-6">
              <p className="text-caption text-muted-foreground mb-3">Impact on Discovery</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground rounded-full" />
                  +40% image search visibility
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground rounded-full" />
                  AI search inclusion
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground rounded-full" />
                  ADA compliance
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-foreground rounded-full" />
                  Better context for algorithms
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-card border border-border p-6">
            <p className="text-caption text-muted-foreground mb-3">Example</p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="text-destructive text-xs font-medium">✕</span>
                <div>
                  <p className="font-mono text-xs text-muted-foreground">alt=""</p>
                  <p className="text-sm mt-1">Empty — invisible to all systems</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="text-foreground text-xs font-medium">✓</span>
                <div>
                  <p className="font-mono text-xs text-muted-foreground">alt="Professional headshot photography session in SoHo NYC studio with natural lighting"</p>
                  <p className="text-sm mt-1">Descriptive, keyword-rich, context-aware</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "captions",
      icon: FileText,
      title: "What is a Caption?",
      subtitle: "Human-readable context that appears alongside images",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Unlike alt text (which is hidden), captions are visible text that accompanies an image. 
            They serve different purposes across platforms but always add context for both humans and algorithms.
          </p>
          
          <div className="bg-muted/50 p-6">
            <p className="text-caption text-muted-foreground mb-4">Caption vs Alt Text</p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium mb-2">Caption</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Visible to users</li>
                  <li>• Adds story or context</li>
                  <li>• Can include hashtags (social)</li>
                  <li>• Varies by platform</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Alt Text</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Hidden in code</li>
                  <li>• Describes what's visible</li>
                  <li>• Consistent format</li>
                  <li>• For machines + accessibility</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { platform: "Website/Blog", example: "Behind the scenes at our SoHo studio during a fashion editorial shoot." },
              { platform: "Instagram", example: "Magic happens when natural light meets great energy ✨ Shot at our downtown studio." },
              { platform: "Google Business", example: "Professional photo studio in SoHo, NYC — 2,000 sq ft with natural lighting and event space." },
            ].map((item) => (
              <div key={item.platform} className="bg-card border border-border p-4">
                <p className="text-caption text-muted-foreground mb-2">{item.platform}</p>
                <p className="text-sm leading-relaxed">{item.example}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "filenames",
      icon: Image,
      title: "Filename Optimization",
      subtitle: "The first signal search engines see",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Before Google even looks at your image, it reads the filename. A descriptive filename 
            provides immediate context and can significantly impact search rankings.
          </p>

          <div className="bg-card border border-border p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-destructive text-sm font-medium">✕ Before</span>
                <span className="font-mono text-xs">IMG_3847.jpg</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-destructive text-sm font-medium">✕ Also Bad</span>
                <span className="font-mono text-xs">photo1.jpeg</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-foreground text-sm font-medium">✓ Better</span>
                <span className="font-mono text-xs">soho-studio-nyc.jpg</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-foreground text-sm font-medium">✓ Best</span>
                <span className="font-mono text-xs">soho-photo-studio-natural-light-nyc.webp</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-6">
            <p className="text-caption text-muted-foreground mb-3">Filename Best Practices</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-foreground rounded-full" />
                Use hyphens between words (not underscores)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-foreground rounded-full" />
                Include location when relevant
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-foreground rounded-full" />
                Add descriptive keywords
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-foreground rounded-full" />
                Keep it under 50-60 characters
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 bg-foreground rounded-full" />
                Use modern formats (.webp) when possible
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "weight",
      icon: Gauge,
      title: "Image Weight & Performance",
      subtitle: "Speed matters — for users and algorithms",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Image file size directly impacts page speed, which Google uses as a ranking factor. 
            Heavy images slow down your site, hurt user experience, and reduce search visibility.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-6 text-center">
              <p className="text-4xl font-serif mb-2">53%</p>
              <p className="text-sm text-muted-foreground">of mobile users leave if a page takes more than 3 seconds</p>
            </div>
            <div className="bg-muted/50 p-6 text-center">
              <p className="text-4xl font-serif mb-2">-7%</p>
              <p className="text-sm text-muted-foreground">conversion rate drop for each additional second of load time</p>
            </div>
            <div className="bg-muted/50 p-6 text-center">
              <p className="text-4xl font-serif mb-2">98%</p>
              <p className="text-sm text-muted-foreground">size reduction possible with proper optimization</p>
            </div>
          </div>

          <div className="bg-card border border-border p-6">
            <p className="text-caption text-muted-foreground mb-4">Size Recommendations by Use Case</p>
            <div className="space-y-3">
              {[
                { use: "Hero/Banner", size: "200-400 KB", format: "WebP" },
                { use: "Product Photos", size: "100-200 KB", format: "WebP/AVIF" },
                { use: "Blog Images", size: "50-150 KB", format: "WebP" },
                { use: "Thumbnails", size: "10-30 KB", format: "WebP" },
                { use: "Social Sharing", size: "100-300 KB", format: "JPG/PNG" },
              ].map((item) => (
                <div key={item.use} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm">{item.use}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{item.size}</span>
                    <span className="font-mono text-xs bg-muted px-2 py-1">{item.format}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-caption text-muted-foreground mb-4 animate-fade-in-up">Education</p>
          <h1 className="heading-editorial mb-6 animate-fade-in-up animation-delay-100">
            How image optimization works.
          </h1>
          <p className="text-body-large text-muted-foreground max-w-2xl animate-fade-in-up animation-delay-200">
            Understanding the technical and strategic elements that make images 
            discoverable across search engines, AI platforms, and social networks.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* Education Cards */}
      <section className="py-16 lg:py-24 px-6 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-4">
          {educationItems.map((item) => (
            <EducationCard
              key={item.id}
              {...item}
              isOpen={openCards.has(item.id)}
              onToggle={() => toggleCard(item.id)}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32 px-6 lg:px-12 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-section mb-4">Ready to put this into practice?</h2>
          <p className="text-muted-foreground mb-8">
            Upload your images and let the system generate optimized metadata for every platform.
          </p>
          <a 
            href="/library" 
            className="inline-block text-caption bg-foreground text-background px-8 py-4 hover:bg-foreground/90 transition-colors"
          >
            Go to Library
          </a>
        </div>
      </section>
    </Layout>
  );
}
