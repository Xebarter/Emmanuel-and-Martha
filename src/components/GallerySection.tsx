import { Image as ImageIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { galleryService } from '../services/galleryService';

export function GallerySection() {
  const [images, setImages] = useState<{ id: string; url: string; title: string; description?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ id: string; url: string; title: string; description?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        const galleryImages = await galleryService.getGalleryImages();
        setImages(galleryImages);
      } catch (err) {
        console.error('Failed to load gallery images:', err);
        setError('Failed to load gallery. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

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

  if (images.length === 0) {
    return (
      <section id="gallery" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              Our Gallery
            </h2>
            <p className="text-lg text-gray-600">
              Coming soon: Beautiful moments from our journey together
            </p>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-flex p-6 bg-white rounded-full shadow-lg mb-4">
                <ImageIcon className="w-16 h-16 text-gray-300" />
              </div>
              <p className="text-gray-500">Gallery images will appear here</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Our Gallery
          </h2>
          <p className="text-lg text-gray-600">
            Beautiful moments from our journey together
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 text-center p-4">
                  <h3 className="text-white font-medium text-sm mb-1">{image.title}</h3>
                  {image.description && (
                    <p className="text-white text-xs opacity-80">{image.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" 
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-medium text-white">{selectedImage.title}</h3>
                  {selectedImage.description && (
                    <p className="text-gray-300">{selectedImage.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-white hover:text-gray-300 transition-colors p-2"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.title}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
