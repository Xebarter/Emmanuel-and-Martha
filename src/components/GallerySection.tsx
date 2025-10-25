import { Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { galleryService } from '../services/galleryService';

export function GallerySection() {
  const [images, setImages] = useState<{ id: string; url: string; title: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ id: string; url: string; title: string; description?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayedIndices, setDisplayedIndices] = useState<number[]>([0, 1, 2, 3]);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const positionIndexRef = useRef(0);
  const nextImageIndexRef = useRef(4);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        const galleryImages = await galleryService.getGalleryImages();
        setImages(galleryImages);
        
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

  const getNextAvailableIndex = useCallback(() => {
    if (images.length <= 4) return nextImageIndexRef.current % images.length;
    
    let nextIndex = nextImageIndexRef.current % images.length;
    while (displayedIndices.includes(nextIndex)) {
      nextIndex = (nextIndex + 1) % images.length;
    }
    return nextIndex;
  }, [images.length, displayedIndices]);

  useEffect(() => {
    if (images.length <= 4) return;

    carouselIntervalRef.current = setInterval(() => {
      setAnimatingIndex(positionIndexRef.current);
      setTimeout(() => {
        setDisplayedIndices(prev => {
          const newIndices = [...prev];
          newIndices[positionIndexRef.current] = getNextAvailableIndex();
          return newIndices;
        });
        setAnimatingIndex(null);
        positionIndexRef.current = (positionIndexRef.current + 1) % 4;
        nextImageIndexRef.current = (nextImageIndexRef.current + 1) % images.length;
      }, 300);
    }, 3000);

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [images.length, getNextAvailableIndex]);

  const nextImage = useCallback(() => {
    if (!selectedImage || images.length === 0) return;
    
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % images.length;
    setSelectedImage(images[nextIndex]);
  }, [selectedImage, images]);

  const prevImage = useCallback(() => {
    if (!selectedImage || images.length === 0) return;
    
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setSelectedImage(images[prevIndex]);
  }, [selectedImage, images]);

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
            newIndices[positionIndexRef.current] = getNextAvailableIndex();
            return newIndices;
          });
          setAnimatingIndex(null);
          positionIndexRef.current = (positionIndexRef.current + 1) % 4;
          nextImageIndexRef.current = (nextImageIndexRef.current + 1) % images.length;
        }, 300);
      }, 3000);
    }
  }, [images.length, getNextAvailableIndex]);

  if (loading) {
    return (
      <section id="gallery" className="py-20 md:py-28 bg-gradient-to-b from-purple-950 via-purple-900 to-purple-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <div className="flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-purple-600/10 to-amber-500/10 rounded-full border border-purple-600/20 backdrop-blur-sm">
                <ImageIcon className="w-5 h-5 text-amber-400 animate-pulse" />
                <span className="text-sm font-medium text-amber-300 tracking-wider uppercase">Gallery</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold bg-gradient-to-r from-amber-100 via-purple-100 to-amber-100 bg-clip-text text-transparent mb-4 tracking-tight">
              Our Gallery
            </h2>
            <p className="text-lg text-amber-300 font-light">
              Loading beautiful moments from our journey...
            </p>
          </div>
          <div className="flex justify-center gap-4 md:gap-6">
            <div className="h-64 w-64 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-2xl animate-pulse border border-amber-400/10"></div>
            <div className="h-64 w-64 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-2xl animate-pulse border border-amber-400/10 hidden md:block"></div>
            <div className="h-64 w-64 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-2xl animate-pulse border border-amber-400/10 hidden lg:block"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="gallery" className="py-20 md:py-28 bg-gradient-to-b from-purple-950 via-purple-900 to-purple-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <div className="flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-purple-600/10 to-amber-500/10 rounded-full border border-purple-600/20 backdrop-blur-sm">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-medium text-amber-300 tracking-wider uppercase">Gallery</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-bold bg-gradient-to-r from-amber-100 via-purple-100 to-amber-100 bg-clip-text text-transparent mb-4 tracking-tight">
              Our Gallery
            </h2>
            <p className="text-lg text-rose-400/90">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  const displayedImages = displayedIndices
    .filter(index => index < images.length)
    .map(index => images[index]);

  return (
    <section id="gallery" className="py-20 md:py-28 relative bg-gradient-to-b from-purple-950 via-purple-900 to-purple-800 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(212,175,55,0.05),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.03),transparent_50%)]"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-3 px-6 py-2 bg-gradient-to-r from-purple-600/10 to-amber-500/10 rounded-full border border-purple-600/20 backdrop-blur-sm">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-medium text-amber-300 tracking-wider uppercase">Gallery</span>
            </div>
          </div>
          <h2 className="text-4xl md:text-6xl font-serif font-bold bg-gradient-to-r from-amber-100 via-purple-100 to-amber-100 bg-clip-text text-transparent mb-6 tracking-tight">
            Our Gallery
          </h2>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 md:w-24 bg-gradient-to-r from-transparent via-purple-400/50 to-amber-400"></div>
            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
            <div className="h-px w-16 md:w-24 bg-gradient-to-l from-transparent via-purple-400/50 to-amber-400"></div>
          </div>
          <p className="text-lg md:text-xl text-amber-300 max-w-2xl mx-auto font-light">
            Beautiful moments from our journey together
          </p>
        </div>

        <div className="relative">
          {images.length > 4 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetCarouselInterval();
                  setAnimatingIndex(positionIndexRef.current);
                  setTimeout(() => {
                    setDisplayedIndices(prev => {
                      const newIndices = [...prev];
                      newIndices[positionIndexRef.current] = getNextAvailableIndex();
                      return newIndices;
                    });
                    setAnimatingIndex(null);
                    positionIndexRef.current = (positionIndexRef.current + 1) % 4;
                    nextImageIndexRef.current = (nextImageIndexRef.current + 1) % images.length;
                  }, 300);
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-gradient-to-br from-purple-900/90 to-purple-800/90 hover:from-purple-800 hover:to-purple-700 text-amber-100 rounded-full p-3 shadow-2xl backdrop-blur-xl border border-amber-400/20 transition-all duration-300 hover:scale-110 hover:shadow-amber-500/20"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  resetCarouselInterval();
                  setAnimatingIndex(positionIndexRef.current);
                  setTimeout(() => {
                    setDisplayedIndices(prev => {
                      const newIndices = [...prev];
                      newIndices[positionIndexRef.current] = getNextAvailableIndex();
                      return newIndices;
                    });
                    setAnimatingIndex(null);
                    positionIndexRef.current = (positionIndexRef.current + 1) % 4;
                    nextImageIndexRef.current = (nextImageIndexRef.current + 1) % images.length;
                  }, 300);
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-gradient-to-br from-purple-900/90 to-purple-800/90 hover:from-purple-800 hover:to-purple-700 text-amber-100 rounded-full p-3 shadow-2xl backdrop-blur-xl border border-amber-400/20 transition-all duration-300 hover:scale-110 hover:shadow-amber-500/20"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayedImages.map((image, index) => (
              <div
                key={`${image.id}-${displayedIndices[index]}`}
                className={`relative group aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/50 to-purple-800/50 backdrop-blur-md border border-amber-400/20 cursor-pointer transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2 hover:border-amber-400/40 ${
                  animatingIndex === index ? 'animate-fadeIn' : ''
                }`}
                onClick={() => setSelectedImage(image)}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-100/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                  loading="lazy"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="absolute inset-0 flex items-end justify-center p-4 md:p-6">
                  <div className="opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 text-center w-full">
                    {image.description && (
                      <p className="text-amber-100 text-sm md:text-base font-light tracking-wide line-clamp-2 drop-shadow-lg">{image.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full"></div>
              </div>
            ))}
          </div>
        </div>

        {images.length > 4 && (
          <div className="flex justify-center mt-10 md:mt-12 space-x-3">
            {images.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  displayedIndices.includes(index)
                    ? 'w-8 bg-gradient-to-r from-amber-500 to-amber-400 shadow-lg shadow-amber-500/50' 
                    : 'w-1.5 bg-purple-600/30 hover:bg-purple-500/50'
                }`}
              />
            ))}
          </div>
        )}

        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl" 
            onClick={() => setSelectedImage(null)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-amber-500/5"></div>
            
            <div 
              className="relative max-w-6xl w-full max-h-[90vh] flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-100/90 hover:text-amber-100 transition-all duration-300 p-4 z-10 bg-gradient-to-br from-purple-900/80 to-purple-800/80 rounded-full backdrop-blur-xl hover:from-purple-800 hover:to-purple-700 border border-amber-400/20 hover:border-amber-400/40 shadow-2xl hover:scale-110 hover:shadow-amber-500/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-100/90 hover:text-amber-100 transition-all duration-300 p-4 z-10 bg-gradient-to-br from-purple-900/80 to-purple-800/80 rounded-full backdrop-blur-xl hover:from-purple-800 hover:to-purple-700 border border-amber-400/20 hover:border-amber-400/40 shadow-2xl hover:scale-110 hover:shadow-amber-500/20"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-14 right-0 text-amber-200/80 hover:text-amber-100 transition-all duration-300 p-3 z-10 bg-gradient-to-br from-purple-900/60 to-purple-800/60 rounded-full backdrop-blur-xl hover:from-purple-800 hover:to-purple-700 border border-amber-400/20 hover:border-amber-400/40 hover:scale-110"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex-1 flex items-center justify-center rounded-3xl overflow-hidden bg-gradient-to-br from-purple-950/50 to-purple-900/50 backdrop-blur-xl border border-amber-400/20 shadow-2xl p-4">
                <img
                  src={selectedImage.url}
                  alt="Gallery image preview"
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
                />
              </div>
              
              <div className="mt-8 text-center">
                {selectedImage.description && (
                  <p className="text-amber-200 text-base md:text-lg max-w-3xl mx-auto font-light tracking-wide leading-relaxed">{selectedImage.description}</p>
                )}
                
                <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-900/60 to-purple-800/60 rounded-full border border-amber-400/20 backdrop-blur-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <span className="text-amber-200 text-sm font-medium tracking-wider">
                    {images.findIndex(img => img.id === selectedImage.id) + 1} <span className="text-amber-300 mx-1">of</span> {images.length}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                </div>
                
                <div className="mt-6 flex justify-center space-x-2">
                  {images.map((_, index) => (
                    <div 
                      key={index}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        images[index].id === selectedImage.id 
                          ? 'w-8 bg-gradient-to-r from-amber-500 to-amber-400 shadow-lg shadow-amber-500/50' 
                          : 'w-1.5 bg-amber-400/20 hover:bg-amber-400/30 cursor-pointer'
                      }`}
                      onClick={() => images[index].id !== selectedImage.id && setSelectedImage(images[index])}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: scale(0.95) translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        ::-webkit-scrollbar {
          width: 12px;
        }
        
        ::-webkit-scrollbar-track {
          background: #312e81;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #fbbf24, #d97706);
          border-radius: 6px;
          border: 2px solid #312e81;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #f59e0b, #d97706);
        }
      `}</style>
    </section>
  );
}