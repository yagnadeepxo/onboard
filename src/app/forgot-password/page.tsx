'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function RequestPasswordReset() {
  const [email, setEmail] = useState<string>('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        throw error
      }

      setMessage('Password reset email sent. Please check your inbox.')
    } catch (error: any) {
      setError('Error sending password reset email: ' + error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-lg overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-black text-center">Forgotten Password</h1>
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
                Enter your email:
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white text-black"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition duration-200"
            >
              Send Reset Link
            </button>
          </form>

          {message && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}