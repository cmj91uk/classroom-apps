import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ensureDisplayFontsLoaded } from '../../lib/fonts'
import { useDocumentTitle } from '../../useDocumentTitle'
import {
  PROBLEMS_PER_PAGE_MAX,
  PROBLEMS_PER_PAGE_MIN,
  WORKSHEET_COUNT_MAX,
  generateWorksheetsPdf,
  renderWorksheetJpeg,
} from './lib/pdf'
import {
  enabledKinds,
  generateWorksheets,
  type MultiplierDigits,
  type ProblemOptions,
  type TopDigits,
} from './lib/problems'

const TITLE = 'Calculation Worksheets'
const DESCRIPTION =
  'Column addition, subtraction and multiplication worksheets'

const checkboxClass = 'size-4 rounded border-beige-dark/40 accent-ink'
const radioClass = 'size-4 border-beige-dark/40 accent-ink'
const fieldClass =
  'h-[3.25rem] w-full rounded-lg border border-beige-dark/40 bg-white px-3 text-sm text-ink outline-none ring-beige-dark/30 placeholder:text-muted/50 focus:ring-2'

const TOP_DIGIT_OPTIONS: { value: TopDigits; label: string }[] = [
  { value: 1, label: '1 digit' },
  { value: 2, label: '2 digits' },
  { value: 3, label: '3 digits' },
]

const MULTIPLIER_DIGIT_OPTIONS: { value: MultiplierDigits; label: string }[] = [
  { value: 1, label: '1 digit' },
  { value: 2, label: '2 digits' },
]

function RadioRow<T extends number>({
  labelledBy,
  name,
  value,
  options,
  disabled,
  onChange,
}: {
  labelledBy: string
  name: string
  value: T
  options: { value: T; label: string }[]
  disabled: boolean
  onChange: (value: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className={`flex w-full justify-around gap-y-2 rounded-lg border-2 p-4 ${
        disabled
          ? 'border-beige-dark/20 bg-beige-dark/20 text-muted'
          : 'border-beige-dark/30 bg-beige-dark/50'
      }`}
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={`flex items-center gap-2 text-sm ${disabled ? 'text-muted' : 'text-ink'}`}
          >
            <input
              id={id}
              type="radio"
              name={name}
              className={radioClass}
              disabled={disabled}
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

export function CalculationWorksheets() {
  useDocumentTitle(TITLE)

  const additionId = useId()
  const subtractionId = useId()
  const multiplicationId = useId()
  const topDigitsId = useId()
  const multiplierDigitsId = useId()
  const perPageId = useId()
  const answersId = useId()
  const countId = useId()

  const [includeAddition, setIncludeAddition] = useState(true)
  const [additionNoCarry, setAdditionNoCarry] = useState(true)
  const [additionCarry, setAdditionCarry] = useState(false)
  const [includeSubtraction, setIncludeSubtraction] = useState(false)
  const [subtractionNoBorrow, setSubtractionNoBorrow] = useState(true)
  const [subtractionBorrow, setSubtractionBorrow] = useState(false)
  const [includeMultiplication, setIncludeMultiplication] = useState(false)
  const [multiplicationTopDigits, setMultiplicationTopDigits] =
    useState<TopDigits>(2)
  const [multiplicationMultiplierDigits, setMultiplicationMultiplierDigits] =
    useState<MultiplierDigits>(1)
  const [problemsPerPage, setProblemsPerPage] = useState(PROBLEMS_PER_PAGE_MIN)
  const [includeAnswerSheet, setIncludeAnswerSheet] = useState(false)
  const [worksheetCount, setWorksheetCount] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options: ProblemOptions = useMemo(
    () => ({
      additionNoCarry: includeAddition && additionNoCarry,
      additionCarry: includeAddition && additionCarry,
      subtractionNoBorrow: includeSubtraction && subtractionNoBorrow,
      subtractionBorrow: includeSubtraction && subtractionBorrow,
      multiplication: includeMultiplication,
      multiplicationTopDigits,
      multiplicationMultiplierDigits,
    }),
    [
      includeAddition,
      additionNoCarry,
      additionCarry,
      includeSubtraction,
      subtractionNoBorrow,
      subtractionBorrow,
      includeMultiplication,
      multiplicationTopDigits,
      multiplicationMultiplierDigits,
    ],
  )
  const kinds = useMemo(() => enabledKinds(options), [options])
  const canGenerate = kinds.length > 0
  const additionMissingKind = includeAddition && !additionNoCarry && !additionCarry
  const subtractionMissingKind =
    includeSubtraction && !subtractionNoBorrow && !subtractionBorrow

  const previewProblems = useMemo(() => {
    if (kinds.length === 0) {
      return []
    }
    return generateWorksheets(1, problemsPerPage, options)[0] ?? []
  }, [problemsPerPage, kinds, options])

  useEffect(() => {
    ensureDisplayFontsLoaded()
  }, [])

  useEffect(() => {
    if (!canGenerate || previewProblems.length === 0) {
      return
    }

    let cancelled = false
    renderWorksheetJpeg(
      previewProblems,
      kinds,
      options,
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
  }, [
    canGenerate,
    previewProblems,
    worksheetCount,
    kinds,
    options,
  ])

  async function handleDownload() {
    setError(null)
    if (!canGenerate) {
      setError(
        'Choose addition, subtraction and/or multiplication, and at least one carrying option where needed.',
      )
      return
    }

    setIsGenerating(true)
    try {
      const worksheets = generateWorksheets(
        worksheetCount,
        problemsPerPage,
        options,
      )
      await generateWorksheetsPdf({
        worksheets,
        kinds,
        options,
        includeAnswerSheet,
        filename: 'calculation-worksheets.pdf',
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
        <section className="grid gap-6 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-ink">
              <label htmlFor={additionId} className="flex items-center gap-2">
                <input
                  id={additionId}
                  type="checkbox"
                  className={checkboxClass}
                  checked={includeAddition}
                  onChange={(event) => {
                    setIncludeAddition(event.target.checked)
                    setError(null)
                  }}
                />
                Addition
              </label>
            </legend>
            <label className="flex items-center gap-2 pl-6 text-sm text-ink">
              <input
                type="checkbox"
                className={checkboxClass}
                disabled={!includeAddition}
                checked={additionNoCarry}
                onChange={(event) => {
                  setAdditionNoCarry(event.target.checked)
                  setError(null)
                }}
              />
              Without carrying
            </label>
            <label className="flex items-center gap-2 pl-6 text-sm text-ink">
              <input
                type="checkbox"
                className={checkboxClass}
                disabled={!includeAddition}
                checked={additionCarry}
                onChange={(event) => {
                  setAdditionCarry(event.target.checked)
                  setError(null)
                }}
              />
              With carrying
            </label>
            {additionMissingKind ? (
              <p className="pl-6 text-sm text-red-700" role="alert">
                Choose carrying, no carrying, or both.
              </p>
            ) : null}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium text-ink">
              <label htmlFor={subtractionId} className="flex items-center gap-2">
                <input
                  id={subtractionId}
                  type="checkbox"
                  className={checkboxClass}
                  checked={includeSubtraction}
                  onChange={(event) => {
                    setIncludeSubtraction(event.target.checked)
                    setError(null)
                  }}
                />
                Subtraction
              </label>
            </legend>
            <label className="flex items-center gap-2 pl-6 text-sm text-ink">
              <input
                type="checkbox"
                className={checkboxClass}
                disabled={!includeSubtraction}
                checked={subtractionNoBorrow}
                onChange={(event) => {
                  setSubtractionNoBorrow(event.target.checked)
                  setError(null)
                }}
              />
              Without borrowing
            </label>
            <label className="flex items-center gap-2 pl-6 text-sm text-ink">
              <input
                type="checkbox"
                className={checkboxClass}
                disabled={!includeSubtraction}
                checked={subtractionBorrow}
                onChange={(event) => {
                  setSubtractionBorrow(event.target.checked)
                  setError(null)
                }}
              />
              With borrowing
            </label>
            {subtractionMissingKind ? (
              <p className="pl-6 text-sm text-red-700" role="alert">
                Choose borrowing, no borrowing, or both.
              </p>
            ) : null}
          </fieldset>
        </section>

        <section>
          <fieldset className="flex flex-col gap-4">
            <legend className="text-sm font-medium text-ink">
              <label
                htmlFor={multiplicationId}
                className="flex items-center gap-2"
              >
                <input
                  id={multiplicationId}
                  type="checkbox"
                  className={checkboxClass}
                  checked={includeMultiplication}
                  onChange={(event) => {
                    setIncludeMultiplication(event.target.checked)
                    setError(null)
                  }}
                />
                Multiplication
              </label>
            </legend>
            <div className="flex flex-col gap-2 pl-6">
              <p id={topDigitsId} className="text-sm font-medium text-ink">
                Top number
              </p>
              <RadioRow
                labelledBy={topDigitsId}
                name="multiplication-top-digits"
                value={multiplicationTopDigits}
                options={TOP_DIGIT_OPTIONS}
                disabled={!includeMultiplication}
                onChange={(value) => {
                  setMultiplicationTopDigits(value)
                  setError(null)
                }}
              />
            </div>
            <div className="flex flex-col gap-2 pl-6">
              <p
                id={multiplierDigitsId}
                className="text-sm font-medium text-ink"
              >
                Multiplier
              </p>
              <RadioRow
                labelledBy={multiplierDigitsId}
                name="multiplication-multiplier-digits"
                value={multiplicationMultiplierDigits}
                options={MULTIPLIER_DIGIT_OPTIONS}
                disabled={!includeMultiplication}
                onChange={(value) => {
                  setMultiplicationMultiplierDigits(value)
                  setError(null)
                }}
              />
            </div>
          </fieldset>
        </section>

        <section className="flex flex-col gap-3">
          <label htmlFor={perPageId} className="text-sm font-medium text-ink">
            Problems per page
          </label>
          <div className="flex items-center gap-4">
            <span className="w-8 text-sm text-muted">{PROBLEMS_PER_PAGE_MIN}</span>
            <input
              id={perPageId}
              type="range"
              min={PROBLEMS_PER_PAGE_MIN}
              max={PROBLEMS_PER_PAGE_MAX}
              step={4}
              value={problemsPerPage}
              onChange={(event) =>
                setProblemsPerPage(Number(event.target.value))
              }
              className="w-full accent-ink"
            />
            <span className="w-8 text-sm text-muted">{PROBLEMS_PER_PAGE_MAX}</span>
            <span className="w-8 text-right text-sm font-medium text-ink">
              {problemsPerPage}
            </span>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              id={answersId}
              type="checkbox"
              className={checkboxClass}
              checked={includeAnswerSheet}
              onChange={(event) => setIncludeAnswerSheet(event.target.checked)}
            />
            Include answer sheet
          </label>
          <div className="flex flex-col gap-2">
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
                setWorksheetCount(
                  Math.min(WORKSHEET_COUNT_MAX, Math.max(1, next)),
                )
              }}
              className={fieldClass}
            />
            <p className="text-xs text-muted">
              Each sheet has a unique set of problems
              {worksheetCount > 1 ? ' and is labelled A, B, C…' : ''}.
            </p>
          </div>
        </section>

        <section aria-label="Page preview" className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-ink">Preview</h2>
          {canGenerate && previewUrl ? (
            <div className="overflow-hidden rounded-lg border border-beige-dark/30 bg-white shadow-sm">
              <img
                src={previewUrl}
                alt="Worksheet preview"
                className="mx-auto aspect-[210/297] w-full max-w-md bg-white object-contain"
              />
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-beige-dark/50 bg-white/60 px-4 py-10 text-center text-muted">
              {canGenerate
                ? 'Generating preview…'
                : 'Choose addition, subtraction and/or multiplication to preview a worksheet.'}
            </p>
          )}
        </section>

        <section className="mt-auto flex flex-col gap-3 border-t border-beige-dark/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {problemsPerPage} problems per A4 page · Montserrat
            {worksheetCount > 1
              ? ` · ${worksheetCount} worksheets`
              : ''}
            {includeAnswerSheet ? ' · answer sheet' : ''}
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              disabled={!canGenerate || isGenerating}
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
