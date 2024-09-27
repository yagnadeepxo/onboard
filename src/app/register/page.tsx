'use client'
import React, { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import debounce from 'lodash/debounce'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

// Zod validation schema with display_name and username restriction
const registerSchema = z.object({
    display_name: z.string().min(1, 'Display name is required'), // Display Name is mandatory
    username: z.string()
        .min(3, 'Username must be at least 3 characters long')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'), // No spaces or special characters
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['freelancer', 'business']),
    about: z.string().optional(),
    avatarUrl: z.string().optional(),
    twitterUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    telegramUrl: z.string().optional(),
    websiteUrl: z.string().optional(),
});

export default function Register() {
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('');
    const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);
    const [usernameAvailable, setUsernameAvailable] = useState<null | boolean>(null);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const token = localStorage.getItem('sb-vldhwuxhpskjvcdbwrir-auth-token');
    const router = useRouter();
    let json: any;
    if (token) {
        json = JSON.parse(token);
    }
    const userRole = json?.user?.user_metadata?.role;
    if (userRole === 'business') {
        router.push('/dashboard');
    } else if (userRole === 'freelancer') {
        router.push('/');
    }

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(registerSchema),
    });

    const username = watch('username');

    const checkUsernameAvailability = useCallback(
        debounce(async (username: string) => {
            if (username.length < 3) {
                setUsernameAvailable(false);
                return;
            }

            setCheckingUsername(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('username', username)
                .single();

            if (error) {
                console.error('Error checking username', error);
            }

            setUsernameAvailable(!data);
            setCheckingUsername(false);
        }, 300),
        []
    );

    useEffect(() => {
        if (username) {
            checkUsernameAvailability(username);
        } else {
            setUsernameAvailable(null);
        }
    }, [username, checkUsernameAvailability]);

    async function uploadAvatar(event: any) {
        try {
            setLoading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];

            const previewUrl = URL.createObjectURL(file);
            setLocalAvatarPreview(previewUrl);

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) {
                throw uploadError;
            }

            setAvatarUrl(filePath);
            setValue('avatarUrl', filePath); // Set avatarUrl in the form
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(formData: any) {
        if (!usernameAvailable) {
            alert('Please choose an available username.');
            return;
        }

        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        role: formData.role,
                        username: formData.username,
                        display_name: formData.display_name, 
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        username: formData.username,
                        role: formData.role,
                        about: formData.about,
                        display_name: formData.display_name, // Added display name to profile insert
                        avatar_url: formData.avatarUrl,
                        twitter_url: formData.twitterUrl,
                        github_url: formData.githubUrl,
                        telegram_url: formData.telegramUrl,
                        website_url: formData.websiteUrl
                    });

                if (profileError) throw profileError;
            }

            alert('Registration successful! Please check your email to verify your account.');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono">
            <div className="bg-white shadow-2xl rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-center text-black">Register</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block mb-1 text-black">Avatar</label>
                        <div className="flex items-center space-x-4">
                            {localAvatarPreview ? (
                                <img
                                    src={localAvatarPreview}
                                    alt="Avatar Preview"
                                    className="w-16 h-16 rounded-full object-cover border-2 border-black"
                                />
                            ) : avatarUrl ? (
                                <img
                                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${avatarUrl}`}
                                    alt="Avatar"
                                    className="w-16 h-16 rounded-full object-cover border-2 border-black"
                                />
                            ) : (
                                <div className="w-16 h-16 bg-gray-200 rounded-full border-2 border-black"></div>
                            )}
                            <label className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded cursor-pointer">
                                {loading ? 'Uploading...' : 'Upload Avatar'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={uploadAvatar}
                                    disabled={loading}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-black">Display Name</label>
                        <input
                            type="text"
                            {...register('display_name')}
                            className="w-full px-3 py-2 border border-black rounded bg-white text-black"
                        />
                        {errors.display_name && <span className="text-red-500">{errors.display_name.message as React.ReactNode}</span>}
                    </div>

                    <div>
                        <label className="block mb-1 text-black">Username/Company name</label>
                        <div className="relative">
                            <input
                                type="text"
                                {...register('username')}
                                className={`w-full px-3 py-2 border rounded bg-white text-black ${usernameAvailable === true ? 'border-green-500' :
                                    usernameAvailable === false ? 'border-red-500' : 'border-black'
                                }`}
                            />
                            {errors.username && <span className="text-red-500">{errors.username.message as React.ReactNode}</span>}
                            {checkingUsername && (
                                <span className="absolute right-3 top-2 text-gray-400">Checking...</span>
                            )}
                            {!checkingUsername && usernameAvailable !== null && (
                                <span className={`absolute right-3 top-2 ${usernameAvailable ? 'text-green-500' : 'text-red-500'}`}>
                                    {usernameAvailable ? 'Available' : 'Not available'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 text-black">Email</label>
                        <input
                            type="email"
                            {...register('email')}
                            className="w-full px-3 py-2 border border-black rounded bg-white text-black"
                        />
                        {errors.email && <span className="text-red-500">{errors.email.message as React.ReactNode}</span>}
                    </div>
                    <div>
                        <label className="block mb-1 text-black">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}  // Toggle between text and password
                                {...register('password')}
                                className="w-full px-3 py-2 border border-black rounded bg-white text-black"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}  // Toggle the showPassword state
                                className="absolute right-3 top-2 text-sm text-blue-500"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && <span className="text-red-500">{errors.password.message as React.ReactNode}</span>}
                    </div>
                    <div>
                        <label className="block mb-1 text-black">Role</label>
                        <select
                            {...register('role')}
                            className="w-full px-3 py-2 border border-black rounded bg-white text-black"
                        >
                            <option value="freelancer">Freelancer</option>
                            <option value="business">Business</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 text-black">About</label>
                        <textarea
                            {...register('about')}
                            className="w-full px-3 py-2 border border-black rounded bg-white text-black"
                            rows={3}
                        ></textarea>
                    </div>

                    {/* Social Media Links */}
                    <div>
                        <label className="block mb-1 text-black">Twitter URL</label>
                        <input
                            type="text"
                            {...register('twitterUrl')}
                            placeholder="https://x.com/username"
                            className="w-full px-3 py-2 border border-black rounded bg-white text-black"
                        />
                        {errors.twitterUrl && <span className="text-red-500">{errors.twitterUrl.message as React.ReactNode}</span>}
                    </div>
                    <div>
                        <label className="block mb-1 text-black">GitHub URL</label>
                        <input
                            type="text"
                            {...register('githubUrl')}
                            placeholder="https://github.com/username"
                            className="w-full px-3 py-2 border border-black rounded bg-white text-black"
                        />
                        {errors.githubUrl && <span className="text-red-500">{errors.githubUrl.message as React.ReactNode}</span>}
                    </div>
                    <div>
                        <label className="block mb-1 text-black">Telegram URL</label>
                        <input
                            type="text"
                            {...register('telegramUrl')}
                            placeholder="https://t.me/username"
                            className="w-full px-3 py-2 border border-black rounded bg-white text-black"
                        />
                        {errors.telegramUrl && <span className="text-red-500">{errors.telegramUrl.message as React.ReactNode}</span>}
                    </div>
                    <div>
                        <label className="block mb-1 text-black">Website URL</label>
                        <input
                            type="text"
                            {...register('websiteUrl')}
                            placeholder="https://yourwebsite.com"
                            className="w-full px-3 py-2 border border-black rounded bg-white text-black"
                        />
                        {errors.websiteUrl && <span className="text-red-500">{errors.websiteUrl.message as React.ReactNode}</span>}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded"
                        disabled={loading || !usernameAvailable}
                    >
                        {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            </div>
        </div>
    )
}
