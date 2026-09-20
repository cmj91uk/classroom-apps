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
  type AddSubDigits,
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
const barClass =
  'flex w-full items-center justify-around gap-y-2 rounded-lg border-2 border-beige-dark/30 bg-beige-dark/50 p-4'

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
      className={barClass}
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

function CheckboxRow({
  labelledBy,
  options,
}: {
  labelledBy: string
  options: {
    id: string
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
  }[]
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className={barClass}
    >
      {options.map((option) => (
        <label
          key={option.id}
          htmlFor={option.id}
          className="flex items-center gap-2 text-sm text-ink"
        >
          <input
            id={option.id}
            type="checkbox"
            className={checkboxClass}
            checked={option.checked}
            onChange={(event) => option.onChange(event.target.checked)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

function DigitSlider({
  id,
  value,
  onChange,
}: {
  id: string
  value: AddSubDigits
  onChange: (value: AddSubDigits) => void
}) {
  return (
    <div className={`${barClass} gap-4`}>
      <span className="w-4 text-sm text-muted">2</span>
      <input
        id={id}
        type="range"
        min={2}
        max={4}
        step={1}
        value={value}
        onChange={(event) =>
          onChange(Number(event.target.value) as AddSubDigits)
        }
        className="w-full accent-ink"
      />
      <span className="w-4 text-sm text-muted">4</span>
      <span className="w-16 shrink-0 text-right text-sm font-medium text-ink">
        {value} digits
      </span>
    </div>
  )
}

export function CalculationWorksheets() {
  useDocumentTitle(TITLE)

  const additionId = useId()
  const additionKindId = useId()
  const additionDigitsId = useId()
  const additionNoCarryId = useId()
  const additionCarryId = useId()
  const subtractionId = useId()
  const subtractionKindId = useId()
  const subtractionDigitsId = useId()
  const subtractionNoBorrowId = useId()
  const subtractionBorrowId = useId()
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
  const [additionDigits, setAdditionDigits] = useState<AddSubDigits>(2)
  const [subtractionDigits, setSubtractionDigits] = useState<AddSubDigits>(2)
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
      additionDigits,
      subtractionDigits,
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
      additionDigits,
      subtractionDigits,
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
        <section className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-4">
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
            {includeAddition ? (
              <>
                <div className="flex flex-col gap-2 pl-6">
                  <p id={additionKindId} className="text-sm font-medium text-ink">
                    Carrying
                  </p>
                  <CheckboxRow
                    labelledBy={additionKindId}
                    options={[
                      {
                        id: additionNoCarryId,
                        label: 'Without carrying',
                        checked: additionNoCarry,
                        onChange: (checked) => {
                          setAdditionNoCarry(checked)
                          setError(null)
                        },
                      },
                      {
                        id: additionCarryId,
                        label: 'With carrying',
                        checked: additionCarry,
                        onChange: (checked) => {
                          setAdditionCarry(checked)
                          setError(null)
                        },
                      },
                    ]}
                  />
                  {additionMissingKind ? (
                    <p className="text-sm text-red-700" role="alert">
                      Choose carrying, no carrying, or both.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 pl-6">
                  <label
                    htmlFor={additionDigitsId}
                    className="text-sm font-medium text-ink"
                  >
                    Digits
                  </label>
                  <DigitSlider
                    id={additionDigitsId}
                    value={additionDigits}
                    onChange={(value) => {
                      setAdditionDigits(value)
                      setError(null)
                    }}
                  />
                </div>
              </>
            ) : null}
          </fieldset>

          <fieldset className="flex flex-col gap-4">
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
            {includeSubtraction ? (
              <>
                <div className="flex flex-col gap-2 pl-6">
                  <p
                    id={subtractionKindId}
                    className="text-sm font-medium text-ink"
                  >
                    Borrowing
                  </p>
                  <CheckboxRow
                    labelledBy={subtractionKindId}
                    options={[
                      {
                        id: subtractionNoBorrowId,
                        label: 'Without borrowing',
                        checked: subtractionNoBorrow,
                        onChange: (checked) => {
                          setSubtractionNoBorrow(checked)
                          setError(null)
                        },
                      },
                      {
                        id: subtractionBorrowId,
                        label: 'With borrowing',
                        checked: subtractionBorrow,
                        onChange: (checked) => {
                          setSubtractionBorrow(checked)
                          setError(null)
                        },
                      },
                    ]}
                  />
                  {subtractionMissingKind ? (
                    <p className="text-sm text-red-700" role="alert">
                      Choose borrowing, no borrowing, or both.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 pl-6">
                  <label
                    htmlFor={subtractionDigitsId}
                    className="text-sm font-medium text-ink"
                  >
                    Digits
                  </label>
                  <DigitSlider
                    id={subtractionDigitsId}
                    value={subtractionDigits}
                    onChange={(value) => {
                      setSubtractionDigits(value)
                      setError(null)
                    }}
                  />
                </div>
              </>
            ) : null}
          </fieldset>

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
            {includeMultiplication ? (
              <>
                <div className="flex flex-col gap-2 pl-6">
                  <p id={topDigitsId} className="text-sm font-medium text-ink">
                    Top number
                  </p>
                  <RadioRow
                    labelledBy={topDigitsId}
                    name="multiplication-top-digits"
                    value={multiplicationTopDigits}
                    options={TOP_DIGIT_OPTIONS}
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
                    onChange={(value) => {
                      setMultiplicationMultiplierDigits(value)
                      setError(null)
                    }}
                  />
                </div>
              </>
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
