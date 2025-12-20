import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-5">
            <span className="font-serif text-2xl tracking-tight">OPTIX</span>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-sm">
              A system designed to transform how images are discovered, indexed, 
              and understood across search engines, AI platforms, and social networks.
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-3">
            <h4 className="text-caption text-muted-foreground mb-4">Navigate</h4>
            <div className="space-y-3">
              <Link to="/" className="block text-sm hover:text-muted-foreground transition-colors">
                Overview
              </Link>
              <Link to="/education" className="block text-sm hover:text-muted-foreground transition-colors">
                How It Works
              </Link>
              <Link to="/library" className="block text-sm hover:text-muted-foreground transition-colors">
                Library
              </Link>
              <Link to="/optimize" className="block text-sm hover:text-muted-foreground transition-colors">
                Optimize
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div className="lg:col-span-2">
            <h4 className="text-caption text-muted-foreground mb-4">Learn</h4>
            <div className="space-y-3">
              <Link to="/education#alt-text" className="block text-sm hover:text-muted-foreground transition-colors">
                Alt Text
              </Link>
              <Link to="/education#captions" className="block text-sm hover:text-muted-foreground transition-colors">
                Captions
              </Link>
              <Link to="/education#filenames" className="block text-sm hover:text-muted-foreground transition-colors">
                Filenames
              </Link>
              <Link to="/education#weight" className="block text-sm hover:text-muted-foreground transition-colors">
                Image Weight
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-2">
            <h4 className="text-caption text-muted-foreground mb-4">Connect</h4>
            <div className="space-y-3">
              <a href="#" className="block text-sm hover:text-muted-foreground transition-colors">
                Instagram
              </a>
              <a href="#" className="block text-sm hover:text-muted-foreground transition-colors">
                LinkedIn
              </a>
              <a href="mailto:hello@optix.studio" className="block text-sm hover:text-muted-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <p className="text-sm text-muted-foreground">
              System developed by{" "}
              <span className="text-foreground">Agustin Squassi</span>
              {" "}— photographer, filmmaker, and founder of a SoHo-based photo studio 
              and event space in New York City.
            </p>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} OPTIX. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
