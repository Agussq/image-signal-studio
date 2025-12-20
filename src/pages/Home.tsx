import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Eye, Search, Share2 } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center justify-center px-6 lg:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-caption text-muted-foreground mb-8 animate-fade-in-up">
            Image Optimization & Discovery System
          </p>
          <h1 className="heading-display mb-8 animate-fade-in-up animation-delay-100">
            Images are no longer
            <br />
            <span className="italic">just visuals.</span>
          </h1>
          <p className="text-body-large text-muted-foreground max-w-2xl mx-auto mb-12 animate-fade-in-up animation-delay-200">
            They are data, signals, and discovery engines. Transform how your images 
            are found across Google, AI search, and social platforms.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
            <Button asChild variant="editorial-filled" size="editorial-lg">
              <Link to="/library">
                Upload Images <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="editorial" size="editorial-lg">
              <Link to="/education">
                Learn How It Works
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* Before/After Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <p className="text-caption text-muted-foreground mb-4">The Difference</p>
              <h2 className="heading-editorial mb-6">
                The same image.<br />
                <span className="italic">Completely different reach.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                An unoptimized image is invisible to search engines, AI platforms, 
                and accessibility tools. Proper optimization transforms it into a 
                discoverable asset that works for your brand 24/7.
              </p>
              <Button asChild variant="editorial" size="editorial">
                <Link to="/education">
                  Explore the Details <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Comparison Cards */}
            <div className="space-y-6">
              {/* Before Card */}
              <div className="bg-muted/50 border border-border p-8 card-hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-caption">Before Optimization</span>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Filename</span>
                    <span className="font-mono text-xs">IMG_3847.jpg</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">File Size</span>
                    <span>18.4 MB</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Alt Text</span>
                    <span className="text-muted-foreground italic">None</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Discovery Score</span>
                    <span className="text-destructive font-medium">2%</span>
                  </div>
                </div>
              </div>

              {/* After Card */}
              <div className="bg-card border border-foreground p-8 card-hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-foreground" />
                  <span className="text-caption">After Optimization</span>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Filename</span>
                    <span className="font-mono text-xs">soho-photo-studio-nyc.webp</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">File Size</span>
                    <span>284 KB</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Alt Text</span>
                    <span className="text-right max-w-[200px] truncate">Professional photo studio in SoHo...</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Discovery Score</span>
                    <span className="font-medium">94%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* Platforms Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-caption text-muted-foreground mb-4">Where It Matters</p>
            <h2 className="heading-editorial">
              Optimized for every platform.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Search, title: "Google SEO", desc: "Rank higher in image search and web results" },
              { icon: Eye, title: "AI Search", desc: "Be discovered by ChatGPT, Gemini, and Perplexity" },
              { icon: Zap, title: "Google Maps", desc: "Stand out in local business listings" },
              { icon: Share2, title: "Social Media", desc: "Perfect sizing for Instagram, Pinterest, and more" },
            ].map((item, i) => (
              <div 
                key={item.title} 
                className="group p-8 border border-border hover:border-foreground transition-all duration-300 card-hover"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <item.icon className="w-6 h-6 mb-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                <h3 className="font-serif text-xl mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="section-divider" />

      {/* CTA Section */}
      <section className="py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="heading-editorial mb-6">
            Ready to transform your images?
          </h2>
          <p className="text-body-large text-muted-foreground mb-12">
            Upload your first batch and see the difference optimization makes.
          </p>
          <Button asChild variant="editorial-filled" size="editorial-lg">
            <Link to="/library">
              Start Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
