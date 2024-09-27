'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // Adjust path as needed

const Navbar = () => {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null); // State to hold user role

  useEffect(() => {
    // Fetch the current session and username from Supabase
    const getUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUsername(session.user.user_metadata.username || 'profile');
        setIsLoggedIn(true);
        setRole(session.user.user_metadata.role || null); // Set role from user_metadata
      }
    };

    getUserData();

    // Listen for auth state changes to update navbar dynamically
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUsername(session.user.user_metadata.username || 'profile');
        setIsLoggedIn(true);
        setRole(session.user.user_metadata.role || null); // Update role on auth state change
      } else {
        setUsername(null);
        setIsLoggedIn(false);
        setRole(null); // Reset role when user logs out
      }
    });

    // Clean up the listener when the component unmounts
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    } else {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <nav className="bg-white p-4 shadow-md flex justify-center">
      <ul className="flex space-x-8 font-mono"> 
        {isLoggedIn ? (
          <>
            <li>
              <a href="/" className="text-black font-bold underline">
                Home
              </a>
            </li>
            {role === 'business' && ( // Conditionally render Dashboard link
              <li>
                <a href="/dashboard" className="text-black font-bold underline">
                  Dashboard
                </a>
              </li>
            )}
            <li>
              <a href={`/p/${username}`} className="text-black font-bold underline">
                Profile
              </a>
            </li>
            <li>
              <a href={`/leaderboard`} className="text-black font-bold underline">
                Leaderboard
              </a>
            </li>
            <li>
              <button onClick={handleLogout} className="text-black font-bold underline">
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <a href="/login" className="text-black font-bold underline">
                Login
              </a>
            </li>
            <li>
              <a href="/register" className="text-black font-bold underline">
                Register
              </a>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
