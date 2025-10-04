import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, Loader2, AlertTriangle } from 'lucide-react';
import { galleryService, GalleryImage } from '../../services/galleryService';

export function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newImage, setNewImage] = useState({
    file: null as File | null,
    title: '',
    description: ''
  });

  // Load gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('Fetching gallery images...');
        const galleryImages = await galleryService.getGalleryImages();
        console.log('Fetched images:', galleryImages);

        if (!galleryImages || !Array.isArray(galleryImages)) {
          throw new Error('Invalid response from server');
        }

        setImages(galleryImages);
      } catch (err) {
        console.error('Failed to load gallery images:', err);
        setError(`Failed to load gallery images: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadGalleryImages();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewImage({
        ...newImage,
        file: e.target.files[0],
        title: e.target.files[0].name.split('.')[0] // Use filename as default title
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newImage.file) {
      setError('Please select an image to upload');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      await galleryService.uploadImage(
        newImage.file,
        newImage.title,
        newImage.description
      );

      // Refresh the gallery
      const galleryImages = await galleryService.getGalleryImages();
      setImages(galleryImages);

      // Reset the form
      setNewImage({
        file: null,
        title: '',
        description: ''
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const filePath = url.split('/gallery/')[1];
      await galleryService.deleteImage(id, filePath);

      // Update the images state
      setImages(prev => prev.filter(img => img.id !== id));
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Failed to delete image. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-rose-500" />
        <p className="text-lg font-medium">Loading gallery...</p>
        <p className="text-sm text-gray-500">This may take a moment</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your wedding gallery images
          </p>
        </div>
        <button
          onClick={triggerFileInput}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Upload Image
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Gallery Grid */}
      {images.length === 0 ? (
        <div className="mt-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading a new image.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
          {images.map((image) => (
            <div key={image.id} className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 overflow-hidden">
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="p-4">
                <h4 className="font-medium text-gray-900">{image.title}</h4>
                {image.description && (
                  <p className="mt-1 text-sm text-gray-500">{image.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(image.id, image.url)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-red-600 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {newImage.file && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Upload Image</h3>
            <div className="mb-4">
              <img
                src={URL.createObjectURL(newImage.file)}
                alt="Preview"
                className="w-full h-48 object-cover rounded mb-4"
              />
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newImage.title}
                    onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                    placeholder="Enter a title"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={newImage.description}
                    onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500 sm:text-sm"
                    placeholder="Add a description"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setNewImage({ ...newImage, file: null })}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Uploading...
                  </>
                ) : 'Upload Image'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <h3 className="font-medium">Error loading gallery</h3>
          </div>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          
          <button
            onClick={() => window.location.reload()}
            className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
          >
            Try Again
          </button>

          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Information</h4>
            <div className="text-xs font-mono text-gray-600 space-y-1">
              <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}</div>
              <div>Storage Bucket: {import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'gallery (default)'}</div>
              <div>Authenticated: {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
              <div>User: {user ? user.email : 'None'}</div>
              <div>Images Loaded: {images.length}</div>
              {images.length > 0 && (
                <div className="mt-2">
                  <div>First image URL: </div>
                  <div className="truncate">{images[0]?.url}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
