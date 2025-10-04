import React from 'react';
import GalleryManager from '../../admin/GalleryManager';

const GalleryPage: React.FC = () => {
  return (
    <div className="flex-1 p-6">
      <h1 className="text-2xl font-bold mb-2">Gallery</h1>
      <p className="text-gray-600 mb-6">Manage your wedding planning</p>
      <GalleryManager />
    </div>
  );
};

export default GalleryPage;