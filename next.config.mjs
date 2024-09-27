/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['vldhwuxhpskjvcdbwrir.supabase.co'], // Add the Supabase storage domain here
    },
  };
  
  export default nextConfig; // Only export the configuration object once
  