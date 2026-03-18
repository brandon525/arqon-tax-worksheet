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
            2024 & 2025 Tax Years · IRS Form 1040 Flow
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: '#0a1628' }}>
            Your tax return, finally making sense
          </h1>
          <p className="text-lg mb-4" style={{ color: '#0a162880' }}>
            Plug in your numbers from your 1040 — box by box — and see exactly where your money went, how much you owe or get back, and what you could do differently.
          </p>
          <div className="flex flex-wrap gap-4">
            {['Takes 3 minutes', 'Uses real IRS brackets', 'Shows your deduction gap'].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <span style={{ color: '#c9a84c' }}>✓</span>
                <span className="text-sm font-medium" style={{ color: '#0a1628' }}>{item}</span>
              </div>
            ))}
          </div>
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
            <div className="text-2xl mb-2">🎉</div>
            <h3 className="text-lg font-bold mb-1" style={{ color: '#0a1628' }}>You did it — great work!</h3>
            <p className="text-sm mb-4" style={{ color: '#0a162870' }}>
              Your results are ready. Drop your email so we can send you a copy and keep you in the loop on strategies that could improve your outcome.
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
