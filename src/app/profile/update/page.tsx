'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient'; // Adjust path as needed
import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import 'dotenv/config';
require('dotenv').config();

const profileSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters long' }),
  role: z.string().min(2, { message: 'Role is required' }),
  about: z.string().optional(),
  avatar_url: z.string().optional(),
  twitter_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  telegram_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const UpdateProfile: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      role: '',
      about: '',
      avatar_url: '',
      twitter_url: '',
      github_url: '',
      telegram_url: '',
      website_url: '',
    },
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sb-vldhwuxhpskjvcdbwrir-auth-token');
    if (!token) {
      router.push('/login');
    }
    if (token) {
      const json = JSON.parse(token);

      const fetchProfile = async () => {
        try {
          setLoading(true);
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('id, username, role, about, avatar_url, twitter_url, github_url, telegram_url, website_url')
            .eq('id', json.user.id)
            .single();

          if (error) {
            throw error;
          }

          Object.entries(profileData).forEach(([key, value]) => {
            setValue(key as keyof ProfileFormData, value);
          });

          if (profileData?.avatar_url) {
            downloadImage(profileData.avatar_url);
          } else {
            setImageUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/bp.jpeg`);
          }
        } catch (error: any) {
          setError('Error fetching profile: ' + error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    } else {
      setError('No token found in local storage.');
      setLoading(false);
    }
  }, [setValue]);

  const downloadImage = async (path: string) => {
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
  };

  const deleteExistingImage = async (avatar_url: string) => {
    try {
      const { error } = await supabase.storage.from('avatars').remove([avatar_url]);
      if (error) {
        throw error;
      }
      console.log('Previous avatar deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting avatar: ', error.message);
    }
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Delete the previous image if it exists
      const currentAvatarUrl = (await supabase.auth.getUser()).data.user?.user_metadata.avatar_url;
      if (currentAvatarUrl) {
        await deleteExistingImage(currentAvatarUrl);
      }

      // Create local preview URL
      const previewUrl = URL.createObjectURL(file);
      setLocalAvatarPreview(previewUrl);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setImageUrl(filePath);
      setValue('avatar_url', filePath);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setError(null);
    setMessage(null);

    try {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          about: data.about,
          avatar_url: data.avatar_url,
          twitter_url: data.twitter_url,
          github_url: data.github_url,
          telegram_url: data.telegram_url,
          website_url: data.website_url,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setError('Error updating profile: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono p-4">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8 text-black text-center">Update Profile</h1>
        </div>

        <div className="h-[calc(100vh-16rem)] overflow-y-auto px-8 pb-8">
          {loading ? (
            <p className="text-center text-black">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <label className="block">
                      <span className="text-black">Username:</span>
                      <input {...field} type="text" placeholder="Enter your username" disabled
                        className="mt-1 block w-full rounded-md border-black bg-gray-100 focus:border-gray-500 focus:bg-white focus:ring-0 text-black" />
                    </label>
                  )}
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
              </div>

              <div>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <label className="block">
                      <span className="text-black">Role:</span>
                      <input {...field} type="text" placeholder="Enter your role" disabled
                        className="mt-1 block w-full rounded-md border-black bg-gray-100 focus:border-gray-500 focus:bg-white focus:ring-0 text-black" />
                    </label>
                  )}
                />
                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
              </div>

              <div>
                <Controller
                  name="about"
                  control={control}
                  render={({ field }) => (
                    <label className="block">
                      <span className="text-black">About:</span>
                      <textarea {...field} placeholder="Tell us about yourself"
                        className="mt-1 block w-full rounded-md border-black focus:border-gray-500 focus:ring-0 text-black" />
                    </label>
                  )}
                />
              </div>

              <div className="my-4">
                {localAvatarPreview ? (
                  <img
                    src={localAvatarPreview}
                    alt="Local preview"
                    className="w-64 h-64 object-cover rounded-lg mb-4"
                  />
                ) : imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Profile Avatar"
                    className="w-64 h-64 object-cover rounded-lg mb-4"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <p className="text-gray-500">No image uploaded</p>
                  </div>
                )}
                <label className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded cursor-pointer">
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

              <div>
                <Controller
                  name="twitter_url"
                  control={control}
                  render={({ field }) => (
                    <label className="block">
                      <span className="text-black">Twitter URL:</span>
                      <input {...field} type="text" placeholder="https://x.com/bitcoin"
                        className="mt-1 block w-full rounded-md border-black focus:border-gray-500 focus:ring-0 text-black" />
                    </label>
                  )}
                />
                {errors.twitter_url && <p className="text-red-500 text-sm mt-1">{errors.twitter_url.message}</p>}
              </div>

              <div>
                <Controller
                  name="github_url"
                  control={control}
                  render={({ field }) => (
                    <label className="block">
                      <span className="text-black">GitHub URL:</span>
                      <input {...field} type="text" placeholder="https://github.com/username"
                        className="mt-1 block w-full rounded-md border-black focus:border-gray-500 focus:ring-0 text-black" />
                    </label>
                  )}
                />
                {errors.github_url && <p className="text-red-500 text-sm mt-1">{errors.github_url.message}</p>}
              </div>

              <div>
                <Controller
                  name="telegram_url"
                  control={control}
                  render={({ field }) => (
                    <label className="block">
                      <span className="text-black">Telegram URL:</span>
                      <input {...field} type="text" placeholder="https://t.me/username"
                        className="mt-1 block w-full rounded-md border-black focus:border-gray-500 focus:ring-0 text-black" />
                    </label>
                  )}
                />
                {errors.telegram_url && <p className="text-red-500 text-sm mt-1">{errors.telegram_url.message}</p>}
              </div>

              <div>
                <Controller
                  name="website_url"
                  control={control}
                  render={({ field }) => (
                    <label className="block">
                      <span className="text-black">Website URL:</span>
                      <input {...field} type="text" placeholder="https://www.example.com"
                        className="mt-1 block w-full rounded-md border-black focus:border-gray-500 focus:ring-0 text-black" />
                    </label>
                  )}
                />
                {errors.website_url && <p className="text-red-500 text-sm mt-1">{errors.website_url.message}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition duration-200"
              >
                Update Profile
              </button>

              {message && <p className="text-green-500 mt-4 text-center">{message}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default UpdateProfile;
