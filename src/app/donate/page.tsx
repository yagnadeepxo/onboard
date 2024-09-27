'use client';

import { useState } from 'react';

const Donate = () => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(text);
  };

  return (
    <div className="font-mono w-screen h-screen flex flex-col justify-center items-center">
      <h2 className="text-lg font mb-4">
        If this platform helped you in any way to onboard users, please consider donating :)
      </h2>
      <div className="mb-6">
        <h1 className="text-xl font mb-2">Ethereum Address:</h1>
        <div className="flex items-center space-x-4">
          <span className="font-bold">0xFd91967c58BC4e38B54EDEC9b6aD3366A93244FB</span>
          <button
            onClick={() => copyToClipboard('0xFd91967c58BC4e38B54EDEC9b6aD3366A93244FB')}
            className="text-sm px-2 py-1 border rounded bg-gray-200 hover:bg-gray-300"
          >
            {copiedAddress === '0xFd91967c58BC4e38B54EDEC9b6aD3366A93244FB' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-xl font mb-2">Bitcoin Address:</h1>
        <div className="flex items-center space-x-4">
          <span className="font-bold">bc1q84md53k03ru5ce7w5n3zsfqu04j86ch0pmcf33</span>
          <button
            onClick={() => copyToClipboard('bc1q84md53k03ru5ce7w5n3zsfqu04j86ch0pmcf33')}
            className="text-sm px-2 py-1 border rounded bg-gray-200 hover:bg-gray-300"
          >
            {copiedAddress === 'bc1q84md53k03ru5ce7w5n3zsfqu04j86ch0pmcf33' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Donate;