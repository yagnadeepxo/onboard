'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Winner {
  username: string
  total_earnings: number
}

interface Position {
  place: number
  amount: number
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [topEarners, setTopEarners] = useState<Winner[]>([])

  useEffect(() => {
    const fetchTopEarners = async () => {
      setLoading(true)
      try {
        // Fetch the winners data including the position JSON
        const { data: winnersData, error: winnersError } = await supabase
          .from('winners')
          .select('username, position')

        if (winnersError) throw winnersError

        // Aggregate earnings per user
        const earningsMap: { [key: string]: number } = {}
        winnersData.forEach((winner: { username: string; position: Position }) => {
          const { username, position } = winner
          const amount = position.amount
          
          if (earningsMap[username]) {
            earningsMap[username] += amount
          } else {
            earningsMap[username] = amount
          }
        })

        // Convert the aggregated earnings into an array
        const earnersArray: Winner[] = Object.entries(earningsMap).map(([username, total_earnings]) => ({
          username,
          total_earnings,
        }))

        // Sort by total earnings and take top 20
        const sortedEarners = earnersArray
          .sort((a, b) => b.total_earnings - a.total_earnings)
          .slice(0, 20)

        setTopEarners(sortedEarners)
      } catch (err: any) {
        setError('Failed to fetch leaderboard: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTopEarners()
  }, [])

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

  return (
    <div className="min-h-screen bg-gray-100 font-mono p-4">
      <div className="max-w-3xl mx-auto h-screen flex flex-col">
        <h1 className="text-3xl font-bold mb-4 text-black text-center">Top Earners Leaderboard</h1>
        <div className="bg-white shadow-2xl rounded-lg p-4">
          <table className="table-auto w-full text-left">
            <thead>
              <tr>
                <th className="px-4 py-2 text-black">Rank</th>
                <th className="px-4 py-2 text-black">Username</th>
                <th className="px-4 py-2 text-black">Total Earnings</th>
              </tr>
            </thead>
            <tbody>
              {topEarners.map((earner, index) => (
                <tr key={earner.username} className="border-t">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{earner.username}</td>
                  <td className="px-4 py-2">${earner.total_earnings.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}