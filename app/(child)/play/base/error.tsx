'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="py-20 text-center">
      <p className="text-5xl mb-4">🏚️</p>
      <h2 className="text-lg font-bold text-gray-300 mb-2">Base offline</h2>
      <p className="text-sm text-gray-500 mb-6">Something went wrong loading your base.</p>
      <button
        onClick={reset}
        className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
      >
        Try Again
      </button>
    </main>
  )
}
