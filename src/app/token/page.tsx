'use client'
import type { NextPage } from 'next';
import Head from 'next/head';

const TokenPage: NextPage = () => {
  const token = localStorage.getItem('sb-vldhwuxhpskjvcdbwrir-auth-token');
  let json
  if(token){
    json = JSON.parse(token)
  }
  return (
    <div>
      <Head>
        <title>Token Page</title>
      </Head>

      <h1>Token Page</h1>

      {token ? (
        <div>
          <h2>Token:</h2>
          <pre>{json.user.id}</pre>
        </div>
      ) : (
        <p>No token found in local storage.</p>
      )}
    </div>
  );
};

export default TokenPage;