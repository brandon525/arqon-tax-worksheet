export default function SuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#f9f7f4' }}>
      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl"
          style={{ backgroundColor: '#c9a84c20' }}
        >
          ✓
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: '#0a1628' }}>
          You&apos;re all set!
        </h1>
        <p className="mb-6" style={{ color: '#0a162870' }}>
          Your subscription is active. You can now save your assessments and track your tax picture year over year.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 rounded-xl font-semibold transition-colors"
          style={{ backgroundColor: '#0a1628', color: 'white' }}
        >
          Back to Worksheet
        </a>
      </div>
    </div>
  )
}
