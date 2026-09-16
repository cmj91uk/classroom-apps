import { useEffect, useId, useState } from 'react'
import { AppHeader } from '../../components/AppHeader'
import { ColorField } from '../../components/ColorField'
import { FontPicker } from '../../components/FontPicker'
import { useDocumentTitle } from '../../useDocumentTitle'
import {
  DEFAULT_DISPLAY_COLORS,
  DISPLAY_COLOR_FIELDS,
  getPresetColors,
  type DisplayColors,
} from './lib/colors'
import {
  DEFAULT_FONT_ID,
  ensureDisplayFontsLoaded,
  getDisplayFont,
} from '../../lib/fonts'
import { extractDisplayCharacters } from './lib/letters'
import {
  buildLetterSvgPreview,
  generateDisplayPdf,
  LETTERS_PER_PAGE_OPTIONS,
  pageCountFor,
  type LettersPerPage,
} from './lib/pdf'
import {
  DEFAULT_TEMPLATE_ID,
  DISPLAY_TEMPLATES,
  getDisplayTemplate,
  type TemplateId,
} from './lib/templates'

export function BuntingLetters() {
  useDocumentTitle('Bunting Letters')

  const textId = useId()
  const lettersPerPageId = useId()
  const fontId = useId()
  const colorsId = useId()
  const styleId = useId()

  const [text, setText] = useState('HELLO')
  const [lettersPerPage, setLettersPerPage] = useState<LettersPerPage>(1)
  const [fontOptionId, setFontOptionId] = useState(DEFAULT_FONT_ID)
  const [templateId, setTemplateId] = useState<TemplateId>(DEFAULT_TEMPLATE_ID)
  const [colors, setColors] = useState<DisplayColors>(DEFAULT_DISPLAY_COLORS)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedFont = getDisplayFont(fontOptionId)
  const selectedTemplate = getDisplayTemplate(templateId)
  const characters = extractDisplayCharacters(text)
  const pageCount = pageCountFor(text, lettersPerPage)

  useEffect(() => {
    ensureDisplayFontsLoaded()
  }, [])

  function updateColor(key: keyof DisplayColors, hex: string) {
    setColors((current) => ({ ...current, [key]: hex }))
  }

  async function handleDownload() {
    setError(null)
    setIsGenerating(true)
    try {
      const slug = characters.join('').slice(0, 24) || 'bunting'
      await generateDisplayPdf({
        text,
        lettersPerPage,
        fontFamily: selectedFont.family,
        colors,
        templateId,
        filename: `${slug}-bunting.pdf`,
      })
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
        eyebrow="School display"
        title="Bunting Letters"
        subtitle="Type a short message. We turn each letter into printable A4 pages ready for classroom bunting."
      />

      <main className="flex flex-1 flex-col gap-8">
        <section className="flex flex-col gap-3">
          <label htmlFor={textId} className="text-sm font-medium text-ink">
            Bunting text
          </label>
          <input
            id={textId}
            type="text"
            value={text}
            maxLength={40}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. WELCOME"
            onChange={(event) => {
              setText(event.target.value)
              setError(null)
            }}
            className="w-full rounded-lg border border-beige-dark/40 bg-white px-4 py-3 text-2xl font-semibold tracking-[0.12em] text-ink uppercase outline-none ring-beige-dark/30 placeholder:font-normal placeholder:tracking-normal placeholder:normal-case placeholder:text-muted/50 focus:ring-2"
          />
          <p className="text-sm text-muted">
            Letters A–Z and digits 0–9 only. Spaces are skipped when printing.
            {pageCount > 0
              ? ` ${pageCount} page${pageCount === 1 ? '' : 's'} of A4.`
              : ''}
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <span id={styleId} className="text-sm font-medium text-ink">
            Bunting style
          </span>
          <div
            role="group"
            aria-labelledby={styleId}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {DISPLAY_TEMPLATES.map((template) => {
              const selected = templateId === template.id
              const previewSvg = buildLetterSvgPreview(
                'A',
                selectedFont.family,
                colors,
                template.id,
                `style-${template.id}`,
              )
              return (
                <button
                  key={template.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTemplateId(template.id)}
                  className={[
                    'overflow-hidden rounded-lg border bg-white text-left transition',
                    selected
                      ? 'border-ink ring-2 ring-ink/20'
                      : 'border-beige-dark/40 hover:border-beige-dark',
                  ].join(' ')}
                >
                  <div
                    className="aspect-square w-full bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: previewSvg }}
                  />
                  <div className="border-t border-beige-dark/20 px-2 py-2">
                    <p className="text-sm font-medium text-ink">
                      {template.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {template.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span
              id={lettersPerPageId}
              className="text-sm font-medium text-ink"
            >
              Letters per page
            </span>
            <div
              role="group"
              aria-labelledby={lettersPerPageId}
              className="flex rounded-lg border border-beige-dark/40 bg-white p-1"
            >
              {LETTERS_PER_PAGE_OPTIONS.map((count) => {
                const selected = lettersPerPage === count
                return (
                  <button
                    key={count}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setLettersPerPage(count)}
                    className={[
                      'flex-1 rounded-md px-3 py-2 text-sm font-medium transition',
                      selected
                        ? 'bg-ink text-white'
                        : 'text-muted hover:bg-beige/50 hover:text-ink',
                    ].join(' ')}
                  >
                    {count}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={fontId} className="text-sm font-medium text-ink">
              Letter font
            </label>
            <FontPicker
              id={fontId}
              value={fontOptionId}
              selectedFont={selectedFont}
              onChange={setFontOptionId}
            />
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span id={colorsId} className="text-sm font-medium text-ink">
              Colours
            </span>
            <button
              type="button"
              onClick={() => setColors(DEFAULT_DISPLAY_COLORS)}
              className="rounded-md border border-beige-dark/40 bg-white px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-beige/40"
            >
              Reset colours
            </button>
          </div>
          <div
            role="group"
            aria-labelledby={colorsId}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {DISPLAY_COLOR_FIELDS.map((field) => (
              <ColorField
                key={field.key}
                label={
                  field.key === 'dot'
                    ? selectedTemplate.patternLabel
                    : field.label
                }
                value={colors[field.key]}
                presetColors={getPresetColors(field.key)}
                onChange={(hex) => updateColor(field.key, hex)}
              />
            ))}
          </div>
        </section>

        <section aria-label="Letter preview">
          {characters.length === 0 ? (
            <p className="rounded-lg border border-dashed border-beige-dark/50 bg-white/60 px-4 py-10 text-center text-muted">
              Enter some letters to preview your bunting.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {characters.map((char, index) => {
                const pageNumber = Math.floor(index / lettersPerPage) + 1
                const svg = buildLetterSvgPreview(
                  char,
                  selectedFont.family,
                  colors,
                  templateId,
                  `${index}`,
                )
                return (
                  <li
                    key={`${char}-${index}`}
                    className="overflow-hidden rounded-lg border border-beige-dark/30 bg-white shadow-sm"
                  >
                    <div
                      className="aspect-square w-full p-2 [&_svg]:h-full [&_svg]:w-full"
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                    <p className="border-t border-beige-dark/20 py-1.5 text-center text-xs text-muted">
                      Page {pageNumber}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="mt-auto flex flex-col gap-3 border-t border-beige-dark/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {selectedTemplate.label} · {lettersPerPage}{' '}
            {lettersPerPage === 1 ? 'letter' : 'letters'} per A4 page ·{' '}
            {selectedFont.label}
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              disabled={pageCount === 0 || isGenerating}
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
    </>
  )
}
