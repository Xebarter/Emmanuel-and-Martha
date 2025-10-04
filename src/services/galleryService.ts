import { supabase } from '../lib/supabase';

export interface GalleryImage {
  id: string;
  url: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const galleryService = {
  // Get all gallery images
  async getGalleryImages(): Promise<GalleryImage[]> {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching gallery images:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Network or other error fetching gallery images:', error);
      throw new Error('Failed to fetch gallery images. Please check your internet connection and Supabase configuration.');
    }
  },

  // Upload a new gallery image (without authentication requirement)
  async uploadImage(file: File, title: string, description?: string): Promise<GalleryImage> {
    const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'gallery';
    
    try {
      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = fileName; // Direct path in the bucket

      console.log('Uploading file:', { bucketName, filePath });
      
      // 3. Upload the file to storage with explicit content type
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful, getting public URL...');
      
      // 4. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      
      // 5. Save the image metadata to the database
      const { data: imageData, error: dbError } = await supabase
        .from('gallery')
        .insert([
          {
            url: publicUrl,
            title,
            description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Try to clean up the uploaded file if database insert fails
        await supabase.storage
          .from(bucketName)
          .remove([filePath])
          .catch(console.error);
          
        throw new Error(`Failed to save image metadata: ${dbError.message}`);
      }
      
      console.log('Image saved successfully:', imageData);
      return imageData;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred during image upload');
      }
    }
  },

  // Delete a gallery image
  async deleteImage(imageId: string, imageUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const url = new URL(imageUrl);
      const filePath = url.pathname.split('/').pop();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'gallery')
        .remove([filePath || '']);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        throw new Error(`Failed to delete image from storage: ${storageError.message}`);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('gallery')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw new Error(`Failed to delete image from database: ${dbError.message}`);
      }
    } catch (error) {
      console.error('Error in deleteImage:', error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An unexpected error occurred during image deletion');
      }
    }
  }
};