import type { VocabularyEntry } from '../../models'
import type { ReviewMode } from './reviewService'

function maskWord(word: string): string {
  if (word.length <= 2) return '\u200B' + '_'.repeat(word.length)
  return word[0] + '\u200B' + '_'.repeat(word.length - 2) + '\u200B' + word[word.length - 1]
}

function generateGapFill(sentence: string | undefined, word: string): { before: string; blank: string; after: string } {
  if (!sentence) return { before: '', blank: '', after: '' }
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const match = regex.exec(sentence)
  if (!match) return { before: sentence, blank: '', after: '' }
  const idx = match.index
  return {
    before: sentence.slice(0, idx),
    blank: sentence.slice(idx, idx + word.length),
    after: sentence.slice(idx + word.length),
  }
}

function playPronunciation(word: string): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = navigator.language || 'en-US'
    utterance.rate = 0.9
    try {
      window.speechSynthesis.speak(utterance)
    } catch {
      /* speech synthesis not available */
    }
  }
}

interface ModeRendererProps {
  vocab: VocabularyEntry
  onReveal?: () => void
  revealed?: boolean
}

export function WordToMeaning({ vocab, onReveal, revealed }: ModeRendererProps) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-3">
        <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {vocab.word}
        </p>
        <button
          onClick={() => playPronunciation(vocab.word)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          aria-label="Pronounce word"
          title="Listen to pronunciation"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        </button>
      </div>
      {vocab.pronunciation && (
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          /{vocab.pronunciation}/
        </p>
      )}
      {vocab.partOfSpeech && (
        <p className="mt-1 text-xs italic text-slate-400 dark:text-slate-500">
          {vocab.partOfSpeech}
        </p>
      )}
      {!revealed && onReveal && (
        <button
          onClick={onReveal}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Tap to reveal meaning
        </button>
      )}
      {revealed && (
        <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Meaning</p>
          <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">
            {vocab.meaning}
          </p>
          {vocab.meaningVi && (
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              {vocab.meaningVi}
            </p>
          )}
          {vocab.exampleSentence && (
            <p className="mt-3 text-sm italic text-slate-500 dark:text-slate-400">
              &ldquo;{vocab.exampleSentence}&rdquo;
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function MeaningToWord({ vocab, onReveal, revealed }: ModeRendererProps) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {vocab.meaning}
      </p>
      {vocab.meaningVi && (
        <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
          {vocab.meaningVi}
        </p>
      )}
      {vocab.partOfSpeech && (
        <p className="mt-1 text-xs italic text-slate-400 dark:text-slate-500">
          {vocab.partOfSpeech}
        </p>
      )}
      {!revealed && onReveal && (
        <button
          onClick={onReveal}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Tap to reveal word
        </button>
      )}
      {revealed && (
        <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Word</p>
          <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">
            {vocab.word}
          </p>
          {vocab.pronunciation && (
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              /{vocab.pronunciation}/
            </p>
          )}
          <button
            onClick={() => playPronunciation(vocab.word)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Listen
          </button>
        </div>
      )}
    </div>
  )
}

export function GapFill({ vocab }: ModeRendererProps) {
  const gap = generateGapFill(vocab.exampleSentence, vocab.word)
  return (
    <div className="text-center">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Fill in the blank
      </p>
      <p className="mt-4 text-lg leading-relaxed text-slate-900 dark:text-slate-100">
        {gap.before}
        <span className="rounded-md px-1 font-bold" style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
          {maskWord(vocab.word)}
        </span>
        {gap.after}
      </p>
      <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Answer</p>
        <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">
          {vocab.word}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {vocab.meaning}
        </p>
      </div>
    </div>
  )
}

export function Collocation({ vocab }: ModeRendererProps) {
  return (
    <div className="text-center">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Recall collocations and related words
      </p>
      <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">
        {vocab.word}
      </p>
      {vocab.collocations.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Collocations</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {vocab.collocations.map((c, i) => (
              <span
                key={i}
                className="rounded-lg px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
      {vocab.synonyms.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Synonyms</p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {vocab.synonyms.map((s, i) => (
              <span
                key={i}
                className="rounded-lg px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {vocab.antonyms.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Antonyms</p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {vocab.antonyms.map((a, i) => (
              <span
                key={i}
                className="rounded-lg px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function MultipleChoice({
  vocab,
  distractors,
  onAnswer,
  answered,
  selected,
}: ModeRendererProps & {
  distractors: string[]
  onAnswer: (selected: string) => void
  answered: boolean
  selected: string | null
}) {
  const options = [...distractors, vocab.meaning]

  return (
    <div className="text-center">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Choose the correct meaning
      </p>
      <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-100">
        {vocab.word}
      </p>
      {vocab.pronunciation && (
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          /{vocab.pronunciation}/
        </p>
      )}
      <div className="mt-6 space-y-2">
        {options.map((opt, i) => {
          const isCorrect = opt === vocab.meaning
          const isSelected = opt === selected
          let bg = 'bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600'
          if (answered) {
            if (isCorrect) bg = 'bg-[var(--color-success-light)] border-[var(--color-success)]'
            else if (isSelected && !isCorrect) bg = 'bg-[var(--color-danger-light)] border-[var(--color-danger)]'
          } else if (isSelected) {
            bg = 'bg-[var(--color-primary-light)] border-[var(--color-primary)]'
          }
          return (
            <button
              key={i}
              onClick={() => !answered && onAnswer(opt)}
              disabled={answered}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${bg}`}
              style={{ borderColor: answered && isCorrect ? 'var(--color-success)' : 'var(--color-border)' }}
            >
              <span className="font-medium text-slate-500 dark:text-slate-400">{String.fromCharCode(65 + i)}.</span>
              {' '}
              <span className="text-slate-900 dark:text-slate-100">{opt}</span>
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {selected === vocab.meaning ? 'Correct!' : `The answer is: ${vocab.meaning}`}
          </p>
        </div>
      )}
    </div>
  )
}

export function TypingMode({ vocab, onReveal, revealed }: ModeRendererProps) {
  return (
    <div className="text-center">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Type the word from memory
      </p>
      <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Meaning</p>
        <p className="mt-1 text-lg text-slate-900 dark:text-slate-100">
          {vocab.meaning}
        </p>
        {vocab.meaningVi && (
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            {vocab.meaningVi}
          </p>
        )}
      </div>
      {!revealed && onReveal && (
        <button
          onClick={onReveal}
          className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Show answer
        </button>
      )}
      {revealed && (
        <div className="mt-4">
          <p className="text-2xl font-bold text-[var(--color-success)]">
            {vocab.word}
          </p>
          {vocab.pronunciation && (
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
              /{vocab.pronunciation}/
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function getModeRenderer(mode: ReviewMode) {
  switch (mode) {
    case 'word-to-meaning': return WordToMeaning
    case 'meaning-to-word': return MeaningToWord
    case 'gap-fill': return GapFill
    case 'collocation': return Collocation
    case 'multiple-choice': return MultipleChoice
    case 'typing': return TypingMode
    default: return WordToMeaning
  }
}
