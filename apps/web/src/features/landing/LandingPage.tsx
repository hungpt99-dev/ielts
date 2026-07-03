import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'IELTS Journey - Free IELTS Learning from the Real Internet'
  }, [])

  const handleStart = () => {
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          Welcome to IELTS Journey
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
          Your personal IELTS preparation companion — free, private, and powered
          by real internet content.
        </p>

        <div className="mt-8 space-y-3 text-left">
          <div className="rounded-lg bg-white/80 p-4 shadow-sm dark:bg-slate-800/80">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Study with Real Content
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Read articles, news, and web content. Highlight vocabulary, save
              words, and generate IELTS exercises from anything you read.
            </p>
          </div>
          <div className="rounded-lg bg-white/80 p-4 shadow-sm dark:bg-slate-800/80">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Track All 4 Skills
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Practice Reading, Listening, Writing, and Speaking with
              AI-powered feedback and personalized study plans.
            </p>
          </div>
          <div className="rounded-lg bg-white/80 p-4 shadow-sm dark:bg-slate-800/80">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              100% Free & Private
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              No account required. No backend. Your data stays in your browser.
            </p>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-8 text-base font-semibold text-white shadow-sm transition-all hover:scale-105 hover:bg-blue-700"
        >
          Start Your Journey
        </button>

        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
          Built by Phạm Thanh Hưng · Free for all IELTS learners
        </p>
      </div>
    </div>
  )
}
