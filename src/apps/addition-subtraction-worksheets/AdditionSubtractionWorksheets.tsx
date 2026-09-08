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
  type ProblemOptions,
} from './lib/problems'

const TITLE = 'Addition & Subtraction Worksheets'
const DESCRIPTION = 'Two digit addition and subtraction worksheets'

const checkboxClass = 'size-4 rounded border-beige-dark/40 accent-ink'
const fieldClass =
  'h-[3.25rem] w-full rounded-lg border border-beige-dark/40 bg-white px-3 text-sm text-ink outline-none ring-beige-dark/30 placeholder:text-muted/50 focus:ring-2'

export function AdditionSubtractionWorksheets() {
  useDocumentTitle(TITLE)

  const additionId = useId()
  const subtractionId = useId()
  const perPageId = useId()
  const answersId = useId()
  const countId = useId()

  const [includeAddition, setIncludeAddition] = useState(true)
  const [additionNoCarry, setAdditionNoCarry] = useState(true)
  const [additionCarry, setAdditionCarry] = useState(false)
  const [includeSubtraction, setIncludeSubtraction] = useState(false)
  const [subtractionNoBorrow, setSubtractionNoBorrow] = useState(true)
  const [subtractionBorrow, setSubtractionBorrow] = useState(false)
  const [problemsPerPage, setProblemsPerPage] = useState(PROBLEMS_PER_PAGE_MIN)
  const [includeAnswerSheet, setIncludeAnswerSheet] = useState(false)
  const [worksheetCount, setWorksheetCount] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const options: ProblemOptions = {
    additionNoCarry: includeAddition && additionNoCarry,
    additionCarry: includeAddition && additionCarry,
    subtractionNoBorrow: includeSubtraction && subtractionNoBorrow,
    subtractionBorrow: includeSubtraction && subtractionBorrow,
  }
  const kinds = enabledKinds(options)
  const canGenerate = kinds.length > 0
  const additionMissingKind = includeAddition && !additionNoCarry && !additionCarry
  const subtractionMissingKind =
    includeSubtraction && !subtractionNoBorrow && !subtractionBorrow

  const previewProblems = useMemo(() => {
    const nextOptions: ProblemOptions = {
      additionNoCarry: includeAddition && additionNoCarry,
      additionCarry: includeAddition && additionCarry,
      subtractionNoBorrow: includeSubtraction && subtractionNoBorrow,
      subtractionBorrow: includeSubtraction && subtractionBorrow,
    }
    if (enabledKinds(nextOptions).length === 0) {
      return []
    }
    return generateWorksheets(1, problemsPerPage, nextOptions)[0] ?? []
  }, [
    problemsPerPage,
    includeAddition,
    additionNoCarry,
    additionCarry,
    includeSubtraction,
    subtractionNoBorrow,
    subtractionBorrow,
  ])

  useEffect(() => {
    ensureDisplayFontsLoaded()
  }, [])

  useEffect(() => {
    if (!canGenerate || previewProblems.length === 0) {
      return
    }

    let cancelled = false
    const previewKinds = enabledKinds({
      additionNoCarry: includeAddition && additionNoCarry,
      additionCarry: includeAddition && additionCarry,
      subtractionNoBorrow: includeSubtraction && subtractionNoBorrow,
      subtractionBorrow: includeSubtraction && subtractionBorrow,
    })
    renderWorksheetJpeg(
      previewProblems,
      previewKinds,
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
    includeAddition,
    additionNoCarry,
    additionCarry,
    includeSubtraction,
    subtractionNoBorrow,
    subtractionBorrow,
  ])

  async function handleDownload() {
    setError(null)
    if (!canGenerate) {
      setError('Choose addition and/or subtraction, and at least one carrying option.')
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
        includeAnswerSheet,
        filename: 'addition-subtraction-worksheets.pdf',
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
                : 'Choose addition and/or subtraction to preview a worksheet.'}
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
