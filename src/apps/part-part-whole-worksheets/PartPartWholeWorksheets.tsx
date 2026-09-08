import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ensureDisplayFontsLoaded } from '../../lib/fonts'
import { useDocumentTitle } from '../../useDocumentTitle'
import { generatePartWholePdf, renderWorksheetJpeg } from './lib/pdf'
import {
  DEFAULT_MAX_NUMBER,
  MAX_NUMBER_LIMIT,
  PROBLEMS_PER_PAGE,
  WORKSHEET_COUNT_MAX,
  generateProblems,
  generateWorksheets,
  type PartsMode,
} from './lib/problems'

const TITLE = 'Part Part Whole Worksheets'
const DESCRIPTION = 'Make Part Part Whole worksheets quickly and easily'

const fieldClass =
  'h-[3.25rem] w-full rounded-lg border border-beige-dark/40 bg-white px-3 text-sm text-ink outline-none ring-beige-dark/30 placeholder:text-muted/50 focus:ring-2'

const radioClass = 'size-4 border-beige-dark/40 accent-ink'

const PARTS_OPTIONS: { value: PartsMode; label: string }[] = [
  { value: '2', label: '2 parts' },
  { value: '3', label: '3 parts' },
  { value: 'mix', label: 'Mix' },
]

function RadioRow<T extends string>({
  labelledBy,
  name,
  value,
  options,
  onChange,
}: {
  labelledBy: string
  name: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="flex w-full justify-around gap-y-2 rounded-lg border-2 border-beige-dark/30 bg-beige-dark/50 p-4"
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`
        return (
          <label
            key={option.value}
            htmlFor={id}
            className="flex items-center gap-2 text-sm text-ink"
          >
            <input
              id={id}
              type="radio"
              name={name}
              className={radioClass}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        )
      })}
    </div>
  )
}

export function PartPartWholeWorksheets() {
  useDocumentTitle(TITLE)

  const partsId = useId()
  const blankId = useId()
  const maxId = useId()
  const countId = useId()

  const [partsMode, setPartsMode] = useState<PartsMode>('2')
  const [blank, setBlank] = useState(false)
  const [worksheetCount, setWorksheetCount] = useState(1)
  const [maxNumberInput, setMaxNumberInput] = useState(String(DEFAULT_MAX_NUMBER))
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedMax = Number(maxNumberInput)
  const minWhole = partsMode === '2' ? 2 : 3
  const maxNumberOk =
    blank ||
    (Number.isInteger(parsedMax) &&
      parsedMax >= minWhole &&
      parsedMax <= MAX_NUMBER_LIMIT)
  const maxNumber = maxNumberOk ? parsedMax : DEFAULT_MAX_NUMBER

  const problems = useMemo(
    () => generateProblems(PROBLEMS_PER_PAGE, partsMode, maxNumber, blank),
    [partsMode, maxNumber, blank],
  )

  useEffect(() => {
    ensureDisplayFontsLoaded()
  }, [])

  useEffect(() => {
    if (!blank && !maxNumberOk) {
      return
    }

    let cancelled = false
    renderWorksheetJpeg(
      problems,
      blank,
      worksheetCount > 1 ? 'A' : null,
    )
      .then((url) => {
        if (!cancelled) {
          setPreviewUrl(url)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [problems, blank, maxNumberOk, worksheetCount])

  async function handleDownload() {
    setError(null)
    if (!blank && !maxNumberOk) {
      setError(`Enter a whole number from ${minWhole} to ${MAX_NUMBER_LIMIT}.`)
      return
    }

    setIsGenerating(true)
    try {
      await generatePartWholePdf({
        worksheets: generateWorksheets(
          worksheetCount,
          partsMode,
          maxNumber,
          blank,
        ),
        blank,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate PDF.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-10">
        <Link
          to="/"
          className="mb-4 inline-block text-sm font-medium text-muted transition hover:text-ink"
        >
          ← All apps
        </Link>
        <p className="mb-2 text-sm font-medium tracking-wide text-muted uppercase">
          Classroom printables
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {TITLE}
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted">{DESCRIPTION}</p>
      </header>

      <main className="flex flex-1 flex-col gap-8">
        <section className="flex flex-col gap-3">
          <span id={partsId} className="text-sm font-medium text-ink">
            Parts
          </span>
          <RadioRow
            labelledBy={partsId}
            name="parts-mode"
            value={partsMode}
            options={PARTS_OPTIONS}
            onChange={(value) => {
              setPartsMode(value)
              setError(null)
            }}
          />
        </section>

        <section className="flex flex-col gap-3">
          <span id={blankId} className="text-sm font-medium text-ink">
            Blank worksheet
          </span>
          <RadioRow
            labelledBy={blankId}
            name="blank-worksheet"
            value={blank ? 'yes' : 'no'}
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
            ]}
            onChange={(value) => {
              setBlank(value === 'yes')
              setError(null)
            }}
          />
        </section>

        {blank ? null : (
          <section className="flex flex-col gap-2">
            <label htmlFor={maxId} className="text-sm font-medium text-ink">
              Maximum number
            </label>
            <input
              id={maxId}
              type="number"
              min={minWhole}
              max={MAX_NUMBER_LIMIT}
              value={maxNumberInput}
              onChange={(event) => {
                setMaxNumberInput(event.target.value)
                setError(null)
              }}
              className={`${fieldClass} max-w-xs`}
            />
            {!maxNumberOk ? (
              <p className="text-sm text-red-700" role="alert">
                Enter a whole number from {minWhole} to {MAX_NUMBER_LIMIT}.
              </p>
            ) : null}
          </section>
        )}

        <section className="flex flex-col gap-2">
          <label htmlFor={countId} className="text-sm font-medium text-ink">
            Number of worksheets
          </label>
          <input
            id={countId}
            type="number"
            min={1}
            max={WORKSHEET_COUNT_MAX}
            value={worksheetCount}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (Number.isNaN(next)) {
                return
              }
              setWorksheetCount(Math.min(WORKSHEET_COUNT_MAX, Math.max(1, next)))
            }}
            className={`${fieldClass} max-w-xs`}
          />
          <p className="text-xs text-muted">
            Each sheet has a unique set of problems
            {worksheetCount > 1 ? ' and is labelled A, B, C…' : ''}.
          </p>
        </section>

        <section aria-label="Page preview" className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-ink">Preview</h2>
          {previewUrl && (blank || maxNumberOk) ? (
            <div className="overflow-hidden rounded-lg border border-beige-dark/30 bg-white shadow-sm">
              <img
                src={previewUrl}
                alt="Worksheet preview"
                className="mx-auto aspect-[210/297] w-full max-w-md bg-white object-contain"
              />
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-beige-dark/50 bg-white/60 px-4 py-10 text-center text-muted">
              Generating preview…
            </p>
          )}
        </section>

        <section className="mt-auto flex flex-col gap-3 border-t border-beige-dark/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {PROBLEMS_PER_PAGE} problems per A4 page
            {blank ? ' · blank diagrams' : ` · max ${maxNumberOk ? parsedMax : '—'}`}
            {worksheetCount > 1 ? ` · ${worksheetCount} worksheets` : ''}
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              disabled={isGenerating || (!blank && !maxNumberOk)}
              onClick={handleDownload}
              className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition enabled:hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isGenerating ? 'Generating PDF…' : 'Download PDF'}
            </button>
            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
