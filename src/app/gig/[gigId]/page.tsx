'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabaseClient'
import Chat from '@/components/chat'
import Modal from 'react-modal'
import Image from 'next/image'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface Gig {
  gigid: string
  company: string
  title: string
  description: string
  deadline: string
  total_bounty: number
  bounty_breakdown: { place: number; amount: number }[]
  skills_required: string
  created_at: string
  updated_at: string
  business: string
  type: string
  winners_announced: boolean
}

interface BusinessProfile {
  avatar_url: string | null
}

interface Winner {
  username: string
  position: {
    place: number
    amount: number
  }
}

export default function GigPage() {
  const params = useParams()
  const gigId = params.gigId as string
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [submissionLink, setSubmissionLink] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [role, setRole] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isPastDeadline, setIsPastDeadline] = useState(false)
  const [isSubmissionChecked, setIsSubmissionChecked] = useState(false) // Added state for checkbox
  const [winners, setWinners] = useState<Winner[]>([])
  const [winnersAnnounced, setWinnersAnnounced] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  useEffect(() => {
    const fetchGigData = async () => {
      if (!gigId) return
      setLoading(true)
      try {
        // Fetch the gig data
        const { data: gigData, error: gigError } = await supabase
          .from('gigs')
          .select('*')
          .eq('gigid', gigId)
          .single()
        if (gigError) throw gigError
        setGig(gigData)

        const currentDate = new Date()
        const gigDeadline = new Date(gigData.deadline)
        if (currentDate > gigDeadline) {
          setIsPastDeadline(true)
        }

        // Check if winners are announced
        if (gigData.winners_announced) {
          setWinnersAnnounced(true)

          // Fetch winners
          const { data: winnersData, error: winnersError } = await supabase
            .from('winners')
            .select('*')
            .eq('gigid', gigId)

          if (winnersError) throw winnersError
          setWinners(winnersData)
        }

        // Fetch business profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', gigData.business)
          .single()
        if (profileError) throw profileError
        setBusinessProfile(profileData)
      } catch (err: any) {
        setError('Failed to fetch gig: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGigData()
  }, [gigId])

  useEffect(() => {
    const token = localStorage.getItem('sb-vldhwuxhpskjvcdbwrir-auth-token')
    if (token) {
      const json = JSON.parse(token)
      setRole(json?.user?.user_metadata?.role)
      setUsername(json?.user?.user_metadata?.username)

      const checkUserSubmission = async () => {
        if (json?.user?.user_metadata?.username && gigId) {
          const { data: submissions, error } = await supabase
            .from('submissions')
            .select('username')
            .eq('gigid', gigId)
            .eq('username', json?.user?.user_metadata?.username)

          if (error) {
            console.error('Error checking submissions:', error.message)
          }

          if (submissions && submissions.length > 0) {
            setHasSubmitted(true)
          }
        }
      }

      checkUserSubmission()
    }
  }, [gigId])

  const handleSubmit = async () => {
    if (!submissionLink || !walletAddress) {
      alert('Please fill in all fields.')
      return
    }

    try {
      const token = localStorage.getItem('sb-vldhwuxhpskjvcdbwrir-auth-token')
      if (!token) throw new Error('No authentication token found')
      const json = JSON.parse(token)
      const email = json.user?.user_metadata?.email

      const { error } = await supabase.from('submissions').insert([
        {
          gigid: gigId,
          username: username,
          company_name: gig?.company,
          submission_link: submissionLink,
          wallet_address: walletAddress,
          email: email
        },
      ])

      if (error) {
        throw error
      }

      alert('Submission successful!')
      setShowModal(false)
      setHasSubmitted(true)
    } catch (err: any) {
      alert('Failed to submit: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono">
        <p className="text-black">Loading...</p>
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

  if (!gig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono">
        <p className="text-black">No gig found with this ID.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 font-mono p-4">
      <div className="max-w-full mx-auto h-screen flex flex-col">
        <h1 className="text-3xl font-bold mb-4 text-black text-center">Gig Details</h1>
        <div className="flex flex-grow overflow-hidden">
          {/* Gig Details - Left Side */}
          <div className="w-1/2 bg-white shadow-2xl rounded-lg p-4 overflow-y-auto mr-2">
            <div className="flex items-center mb-4">
              <Image
                src={
                  businessProfile?.avatar_url
                    ? `${supabaseUrl}/storage/v1/object/public/avatars/${businessProfile.avatar_url}`
                    : `${supabaseUrl}/storage/v1/object/public/avatars/bp.jpeg`
                }
                alt="Business Avatar"
                width={64}
                height={64}
                className="rounded-full mr-4"
              />
              <div>
                <h2 className="text-xl font-semibold text-black">{gig?.company}</h2>
                <p className="text-gray-700 text-sm">{gig?.title}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-black">Description</h3>
                <div className="text-gray-700 text-sm">
                  <ReactQuill value={gig.description} readOnly={true} theme="bubble"/>
                </div>
              </div>

              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-black">Deadline</h3>
                  <p className="text-gray-700 text-sm">{new Date(gig.deadline).toLocaleDateString()}</p>
                  {isPastDeadline && (
                    <p className="text-red-500 text-xs mt-1">The deadline for this gig has passed.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">Total Bounty</h3>
                  <p className="text-gray-700 text-sm">${gig.total_bounty}</p>
                  <br></br>
                  <strong>type: {gig.type}</strong>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black">Bounty Breakdown</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm">
                  {gig.bounty_breakdown.map((prize, index) => (
                    <li key={index}>
                      Place {prize.place}: ${prize.amount}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-black">Skills Required</h3>
                <p className="text-gray-700 text-sm">{gig.skills_required}</p>
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <p>Created: {new Date(gig.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Show winners if announced */}
            {winnersAnnounced && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-black">Winners</h3>
                <ul className="list-disc list-inside text-gray-700 text-sm">
                  {winners.map((winner, index) => (
                    <li key={index}>
                      {winner.username}: Place {winner.position.place}, ${winner.position.amount}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submission Button */}
            {role !== 'business' && !isPastDeadline && !winnersAnnounced && (
              <div className="mt-4">
                {hasSubmitted ? (
                  <p className="text-green-500 text-sm">You have submitted your work.</p>
                ) : (
                  <button
                    className="w-full bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800 transition-colors"
                    onClick={() => setShowModal(true)}
                  >
                    Submit
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Chat - Right Side */}
          <div className="w-1/2 ml-2">
            <Chat gigId={String(gigId)} />
          </div>
        </div>

        <Modal
  isOpen={showModal}
  onRequestClose={() => setShowModal(false)}
  className="bg-white p-8 rounded-lg shadow-2xl max-w-2xl mx-auto mt-10 w-11/12"
  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
>
  <h2 className="text-2xl font-semibold mb-6 text-black font-mono">Submit Your Work</h2>
  <div className="space-y-6">
    <div>
      <label className="block text-gray-700 text-base mb-2 font-mono">Submission Link</label>
      <input
        type="text"
        className="border border-black p-3 w-full text-base rounded-md font-mono"
        placeholder="Link to your submission as specified in gig"
        value={submissionLink}
        onChange={(e) => setSubmissionLink(e.target.value)}
      />
    </div>

    <div>
      <label className="block text-gray-700 text-base mb-2 font-mono">Wallet Address</label>
      <input
        type="text"
        className="border border-black p-3 w-full text-base rounded-md font-mono"
        placeholder="Wallet address of the blockchain/L2 specified in the gig"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />
    </div>

    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="submission-checkbox"
        checked={isSubmissionChecked}
        onChange={(e) => setIsSubmissionChecked(e.target.checked)}
        className="form-checkbox h-5 w-5 text-gray-600 transition duration-150 ease-in-out"
      />
      <label htmlFor="submission-checkbox" className="block text-gray-800 sm:text-sm font-mono">
        Review carefully, submission cannot be revoked or edited.
      </label>
    </div>

    <div className="flex justify-end space-x-4 mt-6">
      <button
        className="bg-black text-white px-6 py-3 rounded-md text-base font-medium hover:bg-gray-800 transition-colors font-mono"
        onClick={handleSubmit}
        disabled={!isSubmissionChecked}
      >
        Submit
      </button>
      <button
        className="bg-gray-300 text-black px-6 py-3 rounded-md text-base font-medium hover:bg-gray-400 transition-colors font-mono"
        onClick={() => setShowModal(false)}
      >
        Cancel
      </button>
    </div>
  </div>
</Modal>
      </div>
    </div>
  );
}
