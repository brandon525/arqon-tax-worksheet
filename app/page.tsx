'use client'

import { useState } from 'react'
import WorksheetForm from '@/components/WorksheetForm'
import { type TaxInput, type TaxResult } from '@/lib/tax'

export default function Home() {
  const [leadSaved, setLeadSaved] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [pendingData, setPendingData] = useState<{ input: TaxInput; result: TaxResult } | null>(null)

  async function saveLead(name: string, email: string, input: TaxInput, result: TaxResult) {
    try {
      await fetch('/api/save-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, input, result }),
      })
      setLeadSaved(true)
    } catch {
      // silent
    }
  }

  function handleComplete(input: TaxInput, result: TaxResult) {
    setPendingData({ input, result })
    if (!leadSaved) setShowLeadForm(true)
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingData) return
    await saveLead(leadName, leadEmail, pendingData.input, pendingData.result)
    setShowLeadForm(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#0a1628' }} className="px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <a href="https://arqontax.com" className="flex items-center gap-2">
            <span className="font-bold text-xl text-white">ARQON</span>
            <span className="font-bold text-xl" style={{ color: '#c9a84c' }}>TAX</span>
          </a>
          <a
            href="https://calendly.com/brandon-arqontax/arqon-tax-discovery-call"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#c9a84c', color: '#0a1628' }}
          >
            Free Consultation
          </a>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-6">
        <div className="mb-8">
          <div
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
            style={{ backgroundColor: '#c9a84c20', color: '#c9a84c' }}
          >
            2024 Tax Year · Federal Estimate
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#0a1628' }}>
            Find out where your money is really going
          </h1>
          <p className="text-lg" style={{ color: '#0a162880' }}>
            Answer a few questions and get a clear picture of your federal tax estimate — plus personalized opportunities you might be missing.
          </p>
        </div>

        <WorksheetForm onComplete={handleComplete} />
      </div>

      {/* Lead capture modal */}
      {showLeadForm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-4"
          style={{ backgroundColor: '#0a162880' }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-1" style={{ color: '#0a1628' }}>Save your results</h3>
            <p className="text-sm mb-4" style={{ color: '#0a162870' }}>
              Enter your info to get a copy of your results and receive tips from the Arqon Tax team.
            </p>
            <form onSubmit={handleLeadSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={leadName}
                onChange={e => setLeadName(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none"
                style={{ borderColor: '#0a162820' }}
              />
              <input
                type="email"
                placeholder="Your email"
                required
                value={leadEmail}
                onChange={e => setLeadEmail(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none"
                style={{ borderColor: '#0a162820' }}
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: '#0a1628', color: 'white' }}
              >
                Save My Results
              </button>
              <button
                type="button"
                onClick={() => setShowLeadForm(false)}
                className="w-full py-2 text-xs"
                style={{ color: '#0a162840' }}
              >
                Skip for now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className="max-w-2xl mx-auto px-6 py-8 mt-8 border-t"
        style={{ borderColor: '#0a162815' }}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: '#0a162850' }}>
            This tool provides estimates only — not tax advice. Consult a qualified tax professional for your specific situation.
          </p>
          <a href="https://arqontax.com" className="text-xs font-medium" style={{ color: '#c9a84c' }}>
            arqontax.com
          </a>
        </div>
      </footer>
    </div>
  )
}
