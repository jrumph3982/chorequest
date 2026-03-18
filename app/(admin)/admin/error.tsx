'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="py-20 text-center">
      <p className="text-5xl mb-4">⚠️</p>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h2>
      <p className="text-sm text-gray-500 mb-6">Failed to load this page. Please try again.</p>
      <button
        onClick={reset}
        className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
      >
        Try Again
      </button>
    </main>
  )
}
