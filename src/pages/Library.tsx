import { useState, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Check, MoreHorizontal, Trash2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface UploadedImage {
  id: string;
  name: string;
  size: number;
  preview: string;
  status: "raw" | "optimized";
  tags: string[];
}

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
};

export default function Library() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    processFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    processFiles(files);
  };

  const processFiles = (files: File[]) => {
    const newImages: UploadedImage[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      status: "raw" as const,
      tags: [],
    }));
    
    setImages(prev => [...prev, ...newImages]);
  };

  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  };

  const deleteSelected = () => {
    setImages(prev => prev.filter(img => !selectedImages.has(img.id)));
    setSelectedImages(new Set());
  };

  const hasImages = images.length > 0;

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 lg:py-20 px-6 lg:px-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-caption text-muted-foreground mb-4">Library</p>
              <h1 className="heading-editorial">
                Your images
              </h1>
            </div>
            {hasImages && (
              <div className="flex items-center gap-3">
                <Button 
                  variant="editorial-ghost" 
                  size="editorial" 
                  onClick={selectAll}
                >
                  {selectedImages.size === images.length ? "Deselect All" : "Select All"}
                </Button>
                {selectedImages.size > 0 && (
                  <>
                    <Button 
                      variant="editorial-ghost" 
                      size="editorial" 
                      onClick={deleteSelected}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedImages.size})
                    </Button>
                    <Button 
                      asChild
                      variant="editorial-filled" 
                      size="editorial"
                    >
                      <Link to="/optimize">
                        <Settings className="w-4 h-4 mr-2" />
                        Optimize ({selectedImages.size})
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upload Zone or Grid */}
      <section className="py-16 lg:py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {!hasImages ? (
            /* Empty State - Upload Zone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-sm p-16 lg:p-24 text-center transition-all duration-300",
                isDragging 
                  ? "border-foreground bg-muted/50" 
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <Upload className="w-12 h-12 mx-auto mb-6 text-muted-foreground" />
              <h3 className="font-serif text-2xl mb-3">Drop images here</h3>
              <p className="text-muted-foreground mb-8">
                or click to browse your files
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button variant="editorial" size="editorial" asChild>
                  <span className="cursor-pointer">
                    Browse Files
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground mt-6">
                Supports JPG, PNG, WebP, HEIC • Up to 50MB per file
              </p>
            </div>
          ) : (
            /* Image Grid */
            <div className="space-y-8">
              {/* Add More Button */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {images.length} image{images.length !== 1 ? 's' : ''} uploaded
                </p>
                <label htmlFor="file-input-add">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-input-add"
                  />
                  <Button variant="editorial-ghost" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Add More
                    </span>
                  </Button>
                </label>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {images.map((image) => (
                  <div 
                    key={image.id}
                    onClick={() => toggleImageSelection(image.id)}
                    className={cn(
                      "group relative aspect-square cursor-pointer overflow-hidden border transition-all duration-200",
                      selectedImages.has(image.id) 
                        ? "border-foreground ring-2 ring-foreground ring-offset-2" 
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    {/* Image */}
                    <img 
                      src={image.preview} 
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Selection Indicator */}
                    <div className={cn(
                      "absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      selectedImages.has(image.id)
                        ? "bg-foreground border-foreground"
                        : "bg-background/80 border-muted-foreground opacity-0 group-hover:opacity-100"
                    )}>
                      {selectedImages.has(image.id) && (
                        <Check className="w-4 h-4 text-background" />
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider px-2 py-1",
                        image.status === "optimized" 
                          ? "bg-foreground text-background" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {image.status}
                      </span>
                    </div>

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/80 to-transparent p-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-background truncate mb-1">
                        {image.name}
                      </p>
                      <p className="text-[10px] text-background/70">
                        {formatFileSize(image.size)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Add More Card */}
                <label 
                  htmlFor="file-input-grid"
                  className="aspect-square border-2 border-dashed border-border hover:border-muted-foreground cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-input-grid"
                  />
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add more</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tips Section */}
      {!hasImages && (
        <section className="py-16 lg:py-24 px-6 lg:px-12 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl mb-8 text-center">What happens after upload?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Analyze", desc: "We scan your images for size, format, and missing metadata" },
                { step: "02", title: "Generate", desc: "AI creates optimized filenames, alt text, and captions" },
                { step: "03", title: "Export", desc: "Download ready-to-use files for any platform" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <span className="text-caption text-muted-foreground">{item.step}</span>
                  <h3 className="font-serif text-xl mt-2 mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
}
