'use client'
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const ImageUpload = () => {
  const [imageUrl, setImageUrl] = useState(String);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (imageUrl) downloadImage(imageUrl);
  }, [imageUrl]);

  async function downloadImage(path: any) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) {
        throw error;
      }
      const url = URL.createObjectURL(data);
      setImageUrl(url);
    } catch (error: any) {
      console.log('Error downloading image: ', error.message);
    }
  }

  async function uploadImage(event: any) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file , {
            cacheControl: '3600',
            upsert: false
          });

      if (uploadError) {
        throw uploadError;
      }

      setImageUrl(filePath);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Uploaded image"
          className="w-64 h-64 object-cover rounded-lg mb-4"
        />
      ) : (
        <div className="w-64 h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
          <p className="text-gray-500">No image uploaded</p>
        </div>
      )}
      <label className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
        {uploading ? 'Uploading...' : 'Upload Image'}
        <input
          type="file"
          accept="image/*"
          onChange={uploadImage}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default ImageUpload;