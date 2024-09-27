'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface Gig {
  gigid: string
  title: string
  company: string
  deadline: string
  total_bounty: number
  profiles: {
    avatar_url: string | null
  }
}

export default function Dashboard() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  useEffect(() => {
    const fetchGigsWithProfiles = async () => {
      const token = localStorage.getItem('sb-vldhwuxhpskjvcdbwrir-auth-token')
      if (!token) {
        router.push('/login')
        return
      }

      const json = JSON.parse(token)
      const companyName = json?.user?.user_metadata?.display_name

      if (!companyName) {
        setError('Company name not found in session')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data: gigsData, error: gigsError } = await supabase
          .from('gigs')
          .select(`
            *,
            profiles(avatar_url)
          `)
          .eq('company', companyName)

        if (gigsError) throw gigsError

        setGigs(gigsData)
      } catch (err: any) {
        setError('Failed to fetch gigs: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGigsWithProfiles()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono">
        <p className="text-black">Loading gigs...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 font-mono p-4">
      <div className="max-w-4xl mx-auto relative">
        <div className="absolute top-0 right-0">
          <Link href="/create-gig">
            <span className="inline-block bg-black text-white font-bold py-2 px-4 rounded cursor-pointer">
              Create Gig
            </span>
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-8 text-black text-center">Your Company Gigs</h1>
        {gigs.length === 0 ? (
          <p className="text-black text-center">No gigs found for your company.</p>
        ) : (
          <ul className="space-y-6">
            {gigs.map((gig) => (
              <li key={gig.gigid} className="bg-white shadow-2xl rounded-lg p-6 relative">
                <Link href={`/gig/${gig.gigid}`} className="block">
                  <div className="cursor-pointer">
                    <h2 className="text-xl font-semibold text-black mb-2">{gig.title}</h2>
                    <p className="text-gray-600 font-medium mb-4">Company: {gig.company}</p>

                    <div className="flex items-center mb-4">
                      <Image
                        src={
                          gig.profiles?.avatar_url
                            ? `${supabaseUrl}/storage/v1/object/public/avatars/${gig.profiles.avatar_url}`
                            : `${supabaseUrl}/storage/v1/object/public/avatars/bp.jpeg`
                        }
                        alt="Company Avatar"
                        width={48}
                        height={48}
                        className="rounded-full mr-4"
                      />
                    </div>
                    <p className="text-black mb-2">Deadline: {gig.deadline}</p>
                    <p className="text-black">Total Bounty: ${gig.total_bounty}</p>
                  </div>
                </Link>

                <Link
                  href={`/submissions/${gig.gigid}`}
                  className="absolute bottom-4 right-4 text-black hover:underline font-bold"
                >
                  View Submissions
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}