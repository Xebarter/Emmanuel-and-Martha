import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { galleryService } from '../services/galleryService';

export function GallerySection() {
  const [images, setImages] = useState<{ id: string; url: string; title: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ id: string; url: string; title: string; description?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayedIndices, setDisplayedIndices] = useState<number[]>([0, 1, 2, 3]); // Indices of currently displayed images
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null); // Index of the position that's animating
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionIndexRef = useRef(0); // Which position (0-3) to update next
  const nextImageIndexRef = useRef(4); // Index of the next image to show (not currently displayed)

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        const galleryImages = await galleryService.getGalleryImages();
        setImages(galleryImages);
        
        // Initialize displayed indices based on available images
        const initialIndices = [];
        for (let i = 0; i < Math.min(4, galleryImages.length); i++) {
          initialIndices.push(i);
        }
        setDisplayedIndices(initialIndices);
        nextImageIndexRef.current = initialIndices.length;
      } catch (err) {
        console.error('Failed to load gallery images:', err);
        setError('Failed to load gallery. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  // Function to get next available image index that's not currently displayed
  const getNextAvailableIndex = useCallback(() => {
    if (images.length <= 4) return nextImageIndexRef.current % images.length;
    
    // Find the next image that's not currently displayed
    let nextIndex = nextImageIndexRef.current % images.length;
    while (displayedIndices.includes(nextIndex)) {
      nextIndex = (nextIndex + 1) % images.length;
    }
    return nextIndex;
  }, [images.length, displayedIndices]);

  // Set up carousel rotation - one position at a time
  useEffect(() => {
    if (images.length <= 4) return;

    carouselIntervalRef.current = setInterval(() => {
      setAnimatingIndex(positionIndexRef.current);
      setTimeout(() => {
        setDisplayedIndices(prev => {
          const newIndices = [...prev];
          // Update the image at the current position with an image not currently displayed
          newIndices[positionIndexRef.current] = getNextAvailableIndex();
          return newIndices;
        });
        setAnimatingIndex(null);
        // Move to the next position for the next update
        positionIndexRef.current = (positionIndexRef.current + 1) % 4;
        // Update nextImageIndexRef to point to the next potential image
        nextImageIndexRef.current = (nextImageIndexRef.current + 1) % images.length;
      }, 300);
    }, 3000); // Change one position every 3 seconds

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [images.length, getNextAvailableIndex]);

  // Function to navigate to the next image
  const nextImage = useCallback(() => {
    if (!selectedImage || images.length === 0) return;
    
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIndex]);
  }, [selectedImage, images]);

  // Function to navigate to the previous image
  const prevImage = useCallback(() => {
    if (!selectedImage || images.length === 0) return;
    
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIndex]);
  }, [selectedImage, images]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;
      
      if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, nextImage, prevImage]);

  // Reset carousel when user interacts
  const resetCarouselInterval = useCallback(() => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
    }
    
    if (images.length > 4) {
      carouselIntervalRef.current = setInterval(() => {
        setAnimatingIndex(positionIndexRef.current);
        setTimeout(() => {
          setDisplayedIndices(prev => {
            const newIndices = [...prev];
            // Update the image at the current position with an image not currently displayed
            newIndices[positionIndexRef.current] = getNextAvailableIndex();
            return newIndices;
          });
          setAnimatingIndex(null);
          // Move to the next position for the next update
          positionIndexRef.current = (positionIndexRef.current + 1) % 4;
          // Update nextImageIndexRef to point to the next potential image
          nextImageIndexRef.current = (nextImageIndexRef.current + 1) % images.length;
        }, 300);
      }, 3000);
    }
  }, [images.length, getNextAvailableIndex]);

  if (loading) {
    return (
      <section id="gallery" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              Our Gallery
            </h2>
            <p className="text-lg text-gray-600">
              Loading beautiful moments from our journey...
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="h-64 w-64 bg-gray-200 rounded-lg"></div>
              <div className="h-64 w-64 bg-gray-200 rounded-lg hidden md:block"></div>
              <div className="h-64 w-64 bg-gray-200 rounded-lg hidden lg:block"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="gallery" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              Our Gallery
            </h2>
            <p className="text-lg text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  // Get the actual image objects to display
  const displayedImages = displayedIndices
    .filter(index => index < images.length)
    .map(index => images[index]);

  return (
    <section id="gallery" className="py-16 md:py-20 relative bg-gradient-to-br from-rose-50 via-white to-amber-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-3 md:mb-4">
            Our Gallery
          </h2>
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-3">
            <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent via-rose-300 to-transparent"></div>
            <ImageIcon className="w-4 h-4 text-rose-500" />
            <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent via-rose-300 to-transparent"></div>
          </div>
          <p className="text-base md:text-lg text-gray-600">
            Beautiful moments from our journey together
          </p>
        </div>

        <div className="relative">
          {/* Navigation arrows for carousel */}
          {images.length > 4 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetCarouselInterval();
                  // Manually update current position
                  setAnimatingIndex(positionIndexRef.current);
                  setTimeout(() => {
                    setDisplayedIndices(prev => {
                      const newIndices = [...prev];
                      // Update the image at the current position with an image not currently displayed
                      newIndices[positionIndexRef.current] = getNextAvailableIndex();
                      return newIndices;
                    });
                    setAnimatingIndex(null);
                    // Move to the next position for the next update
                    positionIndexRef.current = (positionIndexRef.current + 1) % 4;
                    // Update nextImageIndexRef to point to the next potential image
                    nextImageIndexRef.current = (nextImageIndexRef.current + 1) % images.length;
                  }, 300);
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetCarouselInterval();
                  // Manually update current position
                  setAnimatingIndex(positionIndexRef.current);
                  setTimeout(() => {
                    setDisplayedIndices(prev => {
                      const newIndices = [...prev];
                      // Update the image at the current position with an image not currently displayed
                      newIndices[positionIndexRef.current] = getNextAvailableIndex();
                      return newIndices;
                    });
                    setAnimatingIndex(null);
                    // Move to the next position for the next update
                    positionIndexRef.current = (positionIndexRef.current + 1) % 4;
                    // Update nextImageIndexRef to point to the next potential image
                    nextImageIndexRef.current = (nextImageIndexRef.current + 1) % images.length;
                  }, 300);
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {displayedImages.map((image, index) => (
              <div
                key={`${image.id}-${displayedIndices[index]}`} // Key includes position to trigger animation
                className={`relative group aspect-square overflow-hidden rounded-2xl bg-white/60 backdrop-blur-sm border border-white/50 cursor-pointer transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 ${
                  animatingIndex === index ? 'animate-fadeIn' : ''
                }`}
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-center p-3 md:p-4">
                    {image.description && (
                      <p className="text-white text-xs md:text-sm opacity-90 line-clamp-2">{image.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel indicators */}
        {images.length > 4 && (
          <div className="flex justify-center mt-8 space-x-2">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  displayedIndices.includes(index)
                    ? 'bg-rose-500' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" 
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="relative max-w-6xl w-full max-h-[90vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              {/* Navigation arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white transition-colors p-3 z-10 bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/50 border border-white/10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white transition-colors p-3 z-10 bg-black/30 rounded-full backdrop-blur-sm hover:bg-black/50 border border-white/10"
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
              
              {/* Close button at the top right */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors p-2 z-10"
                aria-label="Close"
              >
                <X className="w-10 h-10" />
              </button>
              
              {/* Image container with premium styling */}
              <div className="flex-1 flex items-center justify-center rounded-2xl overflow-hidden bg-black/30 backdrop-blur md:backdrop-blur-sm border border-white/10 shadow-2xl">
                <img
                  src={selectedImage.url}
                  alt="Gallery image preview"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
              
              {/* Image details with premium styling */}
              <div className="mt-6 text-center">
                {selectedImage.description && (
                  <p className="text-gray-300 text-base md:text-lg max-w-3xl mx-auto">{selectedImage.description}</p>
                )}
                {/* Image counter */}
                <div className="mt-4 text-gray-400 text-sm">
                  {images.findIndex(img => img.id === selectedImage.id) + 1} of {images.length}
                </div>
                {/* Navigation dots */}
                <div className="mt-4 flex justify-center space-x-2">
                  {images.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        images[index].id === selectedImage.id 
                          ? 'bg-rose-500' 
                          : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add fade-in animation for new images */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </section>
  );
}