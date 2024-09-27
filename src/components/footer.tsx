'use client';

import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white p-4 shadow-md flex justify-center">
      <ul className="flex space-x-8 font-mono">
        <li>
          <Link href="/about" className="text-black font-bold underline">
            About
          </Link>
        </li>
        <li>
          <Link href="/donate" className="text-black font-bold underline">
            Donate
          </Link>
        </li>
      </ul>
    </footer>
  );
};

export default Footer;
