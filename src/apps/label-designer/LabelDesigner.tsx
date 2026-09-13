import { useEffect, useId, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { AppHeader } from '../../components/AppHeader'
import { ColorField } from '../../components/ColorField'
import { useDocumentTitle } from '../../useDocumentTitle'
import { DatePicker } from './components/DatePicker'
import { SelectMenu } from './components/SelectMenu'
import { SheetLayoutPicker } from './components/SheetLayoutPicker'
import { DEFAULT_LABEL_COLOR, LABEL_COLOR_PRESETS } from './lib/colors'
import { LABEL_FORMATS } from './lib/formats'
import {
  Ascenders,
  Capital,
  FingerSpace,
  Formation,
  FullStop,
  GreatIdeas,
  PencilGrip,
  PhonicsSkills,
  Punctuation,
  Spade,
  Target,
} from './lib/icons'
import type { DateFormat, LabelSpec } from './lib/label-spec'
import { buildPdf, type MultiLabelSpec } from './lib/pdf'

type IconOption = {
  name: string
  enabled: boolean
  image: string
}

type LabelRow = {
  lessonObjective: string
  useDate: boolean
  date: string
  dateFormat: DateFormat
  icons: IconOption[]
  quantity: number
}

type FormData = {
  labelsPerSheet: string
  labels: LabelRow[]
  color: string
}

const AVAILABLE_ICONS: IconOption[] = [
  { name: 'Finger Spaces', enabled: false, image: FingerSpace },
  { name: 'Full Stop', enabled: false, image: FullStop },
  { name: 'Letter Formation', enabled: false, image: Formation },
  { name: 'Punctuation', enabled: false, image: Punctuation },
  { name: 'Capital Letters', enabled: false, image: Capital },
  { name: 'Pencil Grip', enabled: false, image: PencilGrip },
  { name: 'Phonics Skills', enabled: false, image: PhonicsSkills },
  { name: 'Great Ideas', enabled: false, image: GreatIdeas },
  { name: 'Ascenders', enabled: false, image: Ascenders },
  { name: 'Target', enabled: false, image: Target },
  { name: 'Digging Deeper', enabled: false, image: Spade },
]

const fieldClass =
  'h-[3.25rem] w-full rounded-lg border border-beige-dark/40 bg-white px-3 text-sm text-ink outline-none ring-beige-dark/30 placeholder:text-muted/50 focus:ring-2'

const textareaClass =
  'w-full rounded-lg border border-beige-dark/40 bg-white px-3 py-2.5 text-sm text-ink outline-none ring-beige-dark/30 placeholder:text-muted/50 focus:ring-2'

const DATE_FORMAT_OPTIONS = [
  { value: 'short' as const, label: 'Short (1/1/2024)' },
  {
    value: 'long' as const,
    label: 'Long (Monday 1st January 2024)',
  },
]

function emptyLabel(quantity: number): LabelRow {
  return {
    lessonObjective: '',
    useDate: false,
    date: '',
    dateFormat: 'short',
    icons: AVAILABLE_ICONS.map((icon) => ({ ...icon })),
    quantity,
  }
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function LabelDesigner() {
  useDocumentTitle('Label Designer')

  const sheetId = useId()
  const colorId = useId()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      labelsPerSheet: '8',
      color: DEFAULT_LABEL_COLOR,
      labels: [emptyLabel(8)],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'labels',
  })

  const labelsPerSheet = useWatch({ control, name: 'labelsPerSheet' })
  const color = useWatch({ control, name: 'color' })
  const labels = useWatch({ control, name: 'labels' })
  const format = LABEL_FORMATS[labelsPerSheet]
  const totalPositions = format ? format.countX * format.countY : 0
  const previousLabelsPerSheetRef = useRef(labelsPerSheet)

  useEffect(() => {
    if (previousLabelsPerSheetRef.current === labelsPerSheet) {
      return
    }
    fields.forEach((_, index) => {
      setValue(`labels.${index}.quantity`, totalPositions)
    })
    previousLabelsPerSheetRef.current = labelsPerSheet
  }, [fields, labelsPerSheet, setValue, totalPositions])

  const totalLabels = (labels ?? []).reduce(
    (sum, label) => sum + (Number(label?.quantity) || 0),
    0,
  )
  const pageCount =
    totalPositions > 0 ? Math.ceil(totalLabels / totalPositions) : 0

  async function onSubmit(data: FormData) {
    const selectedFormat = LABEL_FORMATS[data.labelsPerSheet]
    if (!selectedFormat) {
      setError('Choose a valid labels-per-sheet layout.')
      return
    }

    setError(null)
    setIsGenerating(true)
    try {
      const labelsPerPage = selectedFormat.countX * selectedFormat.countY
      const total = data.labels.reduce((sum, label) => sum + label.quantity, 0)
      const totalPages = Math.ceil(total / labelsPerPage)
      const totalSpecs = totalPages * labelsPerPage
      const specs: (LabelSpec | null)[] = new Array(totalSpecs).fill(null)
      let currentPosition = 0

      for (const label of data.labels) {
        const selectedIcons = label.icons
          .filter((icon) => icon.enabled)
          .map((icon) => icon.image)

        const spec: LabelSpec = {
          date: label.useDate && label.date ? parseLocalDate(label.date) : undefined,
          objective: label.lessonObjective,
          images: selectedIcons,
          dateFormat: label.dateFormat,
        }

        for (let i = 0; i < label.quantity; i++) {
          specs[currentPosition] = spec
          currentPosition++
        }
      }

      const multiPageSpec: MultiLabelSpec = { specs }
      await buildPdf(selectedFormat, multiPageSpec, data.color)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate PDF.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <AppHeader
        backToApps
        eyebrow="Classroom printables"
        title="Label Designer"
        subtitle="Build lesson-objective sticker sheets. Pick a layout, add objectives, dates and icons, then print on A4 label paper."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-1 flex-col gap-8"
      >
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor={sheetId} className="text-sm font-medium text-ink">
              Labels per sheet
            </label>
            <SheetLayoutPicker
              id={sheetId}
              value={labelsPerSheet}
              onChange={(nextValue) => setValue('labelsPerSheet', nextValue)}
            />
            {errors.labelsPerSheet ? (
              <p className="text-sm text-red-700" role="alert">
                {errors.labelsPerSheet.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <span id={colorId} className="text-sm font-medium text-ink">
              Text colour
            </span>
            <ColorField
              label="Text colour"
              value={color}
              presetColors={LABEL_COLOR_PRESETS}
              onChange={(hex) => setValue('color', hex)}
              showLabel={false}
            />
          </div>
        </section>

        {fields.map((field, index) => {
          const useDate = labels?.[index]?.useDate
          const iconValues = labels?.[index]?.icons
          const selectedIconsCount =
            iconValues?.filter((icon) => icon.enabled).length ?? 0

          return (
            <section
              key={field.id}
              className="relative rounded-xl border border-beige-dark/40 bg-white p-5 shadow-sm"
            >
              {fields.length > 1 ? (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-3 right-3 rounded px-2 py-1 text-xs text-muted hover:bg-beige/60 hover:text-ink"
                >
                  Remove
                </button>
              ) : null}

              <h2 className="mb-4 text-sm font-semibold text-ink">
                Label {index + 1}
              </h2>

              <div className="mb-4 flex flex-col gap-2">
                <label
                  htmlFor={`objective-${field.id}`}
                  className="text-sm font-medium text-ink"
                >
                  Lesson objective
                </label>
                <textarea
                  id={`objective-${field.id}`}
                  rows={3}
                  className={textareaClass}
                  {...register(`labels.${index}.lessonObjective`)}
                />
              </div>

              <div className="mb-4 flex flex-col gap-2">
                <label
                  htmlFor={`quantity-${field.id}`}
                  className="text-sm font-medium text-ink"
                >
                  Quantity
                </label>
                <input
                  id={`quantity-${field.id}`}
                  type="number"
                  min={1}
                  className={fieldClass}
                  {...register(`labels.${index}.quantity`, {
                    required: 'Quantity is required',
                    valueAsNumber: true,
                    min: { value: 1, message: 'Quantity must be at least 1' },
                  })}
                />
                {errors.labels?.[index]?.quantity ? (
                  <p className="text-sm text-red-700" role="alert">
                    {errors.labels[index].quantity.message}
                  </p>
                ) : null}
              </div>

              <label className="mb-4 flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="size-4 rounded border-beige-dark/40"
                  {...register(`labels.${index}.useDate`)}
                />
                Include date
              </label>

              {useDate ? (
                <div className="mb-4 grid items-stretch gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`date-${field.id}`}
                      className="text-sm font-medium text-ink"
                    >
                      Date
                    </label>
                    <DatePicker
                      id={`date-${field.id}`}
                      value={labels?.[index]?.date ?? ''}
                      onChange={(nextValue) =>
                        setValue(`labels.${index}.date`, nextValue, {
                          shouldValidate: true,
                        })
                      }
                    />
                    <input
                      type="hidden"
                      {...register(`labels.${index}.date`, {
                        validate: (value) => {
                          if (useDate && !value) {
                            return 'Date is required when Include date is checked'
                          }
                          return true
                        },
                      })}
                    />
                    {errors.labels?.[index]?.date ? (
                      <p className="text-sm text-red-700" role="alert">
                        {errors.labels[index].date.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={`date-format-${field.id}`}
                      className="text-sm font-medium text-ink"
                    >
                      Date format
                    </label>
                    <SelectMenu
                      id={`date-format-${field.id}`}
                      value={labels?.[index]?.dateFormat ?? 'short'}
                      options={DATE_FORMAT_OPTIONS}
                      listLabel="Date format"
                      onChange={(nextValue) =>
                        setValue(`labels.${index}.dateFormat`, nextValue)
                      }
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <p className="mb-2 text-sm font-medium text-ink">
                  Icons (up to 3)
                  <span className="ml-2 font-normal text-muted">
                    {selectedIconsCount} of 3 selected
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {AVAILABLE_ICONS.map((icon, iconIndex) => {
                    const inputId = `icon-${field.id}-${iconIndex}`
                    const isSelected = iconValues?.[iconIndex]?.enabled
                    const isDisabled = !isSelected && selectedIconsCount >= 3

                    return (
                      <label
                        key={icon.name}
                        htmlFor={inputId}
                        className={[
                          'flex h-14 cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-sm font-medium transition',
                          isSelected
                            ? 'border-ink bg-beige/50 text-ink ring-2 ring-ink/15'
                            : isDisabled
                              ? 'cursor-not-allowed border-beige-dark/20 bg-paper text-muted/50'
                              : 'border-beige-dark/40 bg-white text-ink hover:border-beige-dark',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          id={inputId}
                          disabled={isDisabled}
                          className="sr-only"
                          {...register(
                            `labels.${index}.icons.${iconIndex}.enabled`,
                          )}
                        />
                        {icon.name}
                      </label>
                    )
                  })}
                </div>
              </div>
            </section>
          )
        })}

        <section className="mt-auto flex flex-col gap-3 border-t border-beige-dark/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => append(emptyLabel(totalPositions))}
              className="rounded-lg border border-beige-dark/40 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-beige/40"
            >
              Add another label
            </button>
            <p className="text-sm text-muted">
              {totalLabels} label{totalLabels === 1 ? '' : 's'}
              {pageCount > 0
                ? ` · ${pageCount} page${pageCount === 1 ? '' : 's'}`
                : ''}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="submit"
              disabled={totalLabels === 0 || isGenerating}
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
      </form>
    </>
  )
}
