'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Modal from 'react-modal'

interface Submission {
  username: string
  submission_link: string
  wallet_address: string
  email: string
}

interface Winner {
  username: string
  position: {
    place: number
    amount: number
  }
}

interface BountyBreakdown {
  place: number
  amount: number
}

export default function SubmissionsPage() {
  const params = useParams()
  const gigId = params.gigId as string
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const [winners, setWinners] = useState<Winner[]>([])
  const [bountyBreakdown, setBountyBreakdown] = useState<BountyBreakdown[]>([])
  const [winnersAnnounced, setWinnersAnnounced] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('sb-vldhwuxhpskjvcdbwrir-auth-token')
    if (token) {
      const json = JSON.parse(token)
      if (json.user?.user_metadata?.role === 'freelancer') {
        alert('Permission denied')
      }
    }

    const fetchSubmissionsAndWinners = async () => {
      if (!gigId) return

      setLoading(true)
      try {
        const { data: submissionData, error: submissionError } = await supabase
          .from('submissions')
          .select('username, submission_link, wallet_address, email')
          .eq('gigid', gigId)

        if (submissionError) throw submissionError
        setSubmissions(submissionData)

        const { data: gigData, error: gigError } = await supabase
          .from('gigs')
          .select('bounty_breakdown')
          .eq('gigid', gigId)
          .single()

        if (gigError) throw gigError
        setBountyBreakdown(gigData.bounty_breakdown)

        const { data: winnersData, error: winnersError } = await supabase
          .from('winners')
          .select('*')
          .eq('gigid', gigId)

        if (winnersError) throw winnersError

        if (winnersData && winnersData.length > 0) {
          setWinners(winnersData)
          setWinnersAnnounced(true)
        }
      } catch (error: any) {
        setError('Failed to fetch data: ' + error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissionsAndWinners()
  }, [gigId])

  const announceWinners = async () => {
    try {
      for (let winner of winners) {
        await supabase.from('winners').insert({
          gigid: gigId,
          username: winner.username,
          position: winner.position,
        })
      }

      const { error: updateError } = await supabase
      .from('gigs')
      .update({ winners_announced: true })
      .eq('gigid', gigId);

      alert('Winners announced successfully!')
      setModalIsOpen(false)
      setWinnersAnnounced(true)
    } catch (error: any) {
      alert('Error announcing winners: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono">
        <p className="text-black">Loading submissions...</p>
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

  if (submissions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-mono">
        <p className="text-black">No submissions found for this gig.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 font-mono p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg p-8">

        <div className="space-y-6">
          {submissions.map((submission, index) => (
            <div key={index} className="border border-black p-4 rounded-lg">
              <p className="text-xl font-semibold text-black">Submission Link:</p>
              <a href={submission.submission_link} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
                {submission.submission_link}
              </a>

              <p className="mt-4 text-xl font-semibold text-black">Username:</p>
              <p className="text-gray-700">{submission.username}</p>

              <p className="mt-4 text-xl font-semibold text-black">email:</p>
              <p className="text-gray-700">{submission.email}</p>

              <p className="mt-4 text-xl font-semibold text-black">Wallet Address:</p>
              <p className="text-gray-700">{submission.wallet_address}</p>
            </div>
          ))}
        </div>

        {winnersAnnounced ? (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-black">Winners Announced</h2>
            <div className="space-y-4">
              {winners.map((winner, index) => (
                <div key={index} className="border border-black p-4 rounded-lg">
                  <p className="text-xl font-semibold text-black">Place: {winner.position.place}</p>
                  <p className="text-gray-700">Username: {winner.username}</p>
                  <p className="text-gray-700">Prize: ${winner.position.amount}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <button
              className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition duration-200"
              onClick={() => setModalIsOpen(true)}
            >
              Announce Winners
            </button>

            <Modal
              isOpen={modalIsOpen}
              onRequestClose={() => setModalIsOpen(false)}
              contentLabel="Announce Winners Modal"
              className="bg-white p-8 rounded-lg shadow-2xl max-w-md mx-auto mt-20"
              overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <h2 className="text-2xl font-bold mb-6 text-black">Announce Winners</h2>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {bountyBreakdown.map((prize, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="text-xl font-semibold text-black">Place {prize.place}</h3>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder={`Enter username for place ${prize.place}`}
                      onChange={(e) => {
                        const updatedWinners = [...winners]
                        updatedWinners[index] = {
                          username: e.target.value,
                          position: {
                            place: prize.place,
                            amount: prize.amount,
                          },
                        }
                        setWinners(updatedWinners)
                      }}
                    />
                    <p className="text-gray-700">Prize: ${prize.amount}</p>
                  </div>
                ))}

                <button
                  className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 transition duration-200"
                  onClick={announceWinners}
                >
                  Submit Winners
                </button>
              </form>
            </Modal>
          </div>
        )}
      </div>
    </div>
  )
}