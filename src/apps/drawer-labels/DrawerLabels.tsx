import { useEffect, useId, useRef, useState } from 'react'
import { RiFontSize, RiSquareLine } from 'react-icons/ri'
import { Link } from 'react-router'
import { ColorField } from '../../components/ColorField'
import { FontPicker } from '../../components/FontPicker'
import {
  DEFAULT_FONT_ID,
  ensureDisplayFontsLoaded,
  getDisplayFont,
} from '../../lib/fonts'
import { useDocumentTitle } from '../../useDocumentTitle'
import {
  DEFAULT_LABEL_COLOR,
  DEFAULT_TEXT_COLOR,
  LABEL_COLOR_PRESETS,
} from './lib/colors'
import {
  generateDrawerLabelsPdf,
  LABEL_HEIGHT_MM,
  LABELS_PER_PAGE,
  PAGE_MARGIN_X_MM,
  SLOT_GAP_MM,
  pageCountFor,
  type DrawerLabel,
} from './lib/pdf'
import {
  loadSavedProjects,
  persistSavedProjects,
  projectNameFromLabels,
  type DrawerLabelsProject,
} from './lib/projects'

function createLabel(name: string, outlineColor: string): DrawerLabel {
  return {
    id: crypto.randomUUID(),
    name,
    textColor: DEFAULT_TEXT_COLOR,
    outlineColor,
  }
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}

export function DrawerLabels() {
  useDocumentTitle('Drawer Labels')

  const nameId = useId()
  const fontId = useId()
  const projectNameId = useId()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [draftName, setDraftName] = useState('')
  const [projectName, setProjectName] = useState('')
  const [fontOptionId, setFontOptionId] = useState(DEFAULT_FONT_ID)
  const [defaultColor, setDefaultColor] = useState(DEFAULT_LABEL_COLOR)
  const [labels, setLabels] = useState<DrawerLabel[]>([])
  const [projects, setProjects] = useState<DrawerLabelsProject[]>(loadSavedProjects)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)

  const selectedFont = getDisplayFont(fontOptionId)
  const pageCount = pageCountFor(labels.length)
  const canAdd = draftName.trim().length > 0
  const canSave = labels.length > 0
  const isNewProject = activeProjectId === null

  useEffect(() => {
    ensureDisplayFontsLoaded()
  }, [])

  function addLabel() {
    const name = draftName.trim()
    if (!name) {
      return
    }
    setLabels((current) => [...current, createLabel(name, defaultColor)])
    setDraftName('')
    setError(null)
    setSaveNotice(null)
    nameInputRef.current?.focus()
  }

  function updateLabel(
    id: string,
    patch: Partial<Pick<DrawerLabel, 'name' | 'textColor' | 'outlineColor'>>,
  ) {
    setLabels((current) =>
      current.map((label) => (label.id === id ? { ...label, ...patch } : label)),
    )
    setSaveNotice(null)
  }

  function removeLabel(id: string) {
    setLabels((current) => current.filter((label) => label.id !== id))
    setSaveNotice(null)
  }

  function startNewProject() {
    setActiveProjectId(null)
    setProjectName('')
    setDraftName('')
    setFontOptionId(DEFAULT_FONT_ID)
    setDefaultColor(DEFAULT_LABEL_COLOR)
    setLabels([])
    setError(null)
    setSaveNotice(null)
  }

  function openProject(project: DrawerLabelsProject) {
    setActiveProjectId(project.id)
    setProjectName(project.name)
    setDraftName('')
    setFontOptionId(project.fontOptionId)
    setDefaultColor(project.defaultColor)
    setLabels(project.labels)
    setError(null)
    setSaveNotice(null)
  }

  function saveProject() {
    if (!canSave) {
      return
    }

    const name = projectName.trim() || projectNameFromLabels(labels)
    const next: DrawerLabelsProject = {
      id: activeProjectId ?? crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      fontOptionId,
      defaultColor,
      labels,
    }

    try {
      const updated = [next, ...projects.filter((project) => project.id !== next.id)]
      persistSavedProjects(updated)
      setProjects(updated)
      setActiveProjectId(next.id)
      setProjectName(name)
      setError(null)
      setSaveNotice('Saved in this browser.')
    } catch {
      setError('Could not save this project in the browser.')
      setSaveNotice(null)
    }
  }

  function deleteProject(id: string) {
    try {
      const updated = projects.filter((project) => project.id !== id)
      persistSavedProjects(updated)
      setProjects(updated)
      if (activeProjectId === id) {
        startNewProject()
      }
    } catch {
      setError('Could not remove this project.')
    }
  }

  async function handleDownload() {
    setError(null)
    setIsGenerating(true)
    try {
      const slug = (projectName.trim() || projectNameFromLabels(labels))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40)
      await generateDrawerLabelsPdf({
        labels,
        fontFamily: selectedFont.family,
        filename: `${slug || 'drawer-labels'}.pdf`,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate PDF.')
    } finally {
      setIsGenerating(false)
    }
  }

  const pages = Array.from({ length: pageCount }, (_, pageIndex) =>
    labels.slice(
      pageIndex * LABELS_PER_PAGE,
      pageIndex * LABELS_PER_PAGE + LABELS_PER_PAGE,
    ),
  )

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
          Drawer Labels
        </h1>
        <p className="mt-3 max-w-xl text-base text-muted">
          Add names, pick a font and colours, then print four labels per A4 page.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-8">
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-ink">Projects</h2>
          <ul className="flex gap-3 overflow-x-auto pb-1">
            <li className="shrink-0">
              <button
                type="button"
                aria-pressed={isNewProject}
                onClick={startNewProject}
                className={[
                  'flex h-24 w-36 flex-col items-start justify-between rounded-xl border p-3 text-left transition',
                  isNewProject
                    ? 'border-ink bg-white ring-2 ring-ink/20'
                    : 'border-beige-dark/40 bg-white hover:border-beige-dark',
                ].join(' ')}
              >
                <span className="text-sm font-semibold text-ink">New project</span>
                <span className="text-xs text-muted">Blank sheet</span>
              </button>
            </li>
            {projects.map((project) => {
              const selected = project.id === activeProjectId
              return (
                <li key={project.id} className="shrink-0">
                  <div
                    className={[
                      'relative flex h-24 w-40 flex-col rounded-xl border bg-white p-3 text-left transition',
                      selected
                        ? 'border-ink ring-2 ring-ink/20'
                        : 'border-beige-dark/40 hover:border-beige-dark',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => openProject(project)}
                      className="flex min-h-0 flex-1 flex-col items-start text-left"
                    >
                      <span className="w-full truncate text-sm font-semibold text-ink">
                        {project.name}
                      </span>
                      <span className="mt-1 text-xs text-muted">
                        {project.labels.length} label
                        {project.labels.length === 1 ? '' : 's'}
                        {formatSavedAt(project.savedAt)
                          ? ` · ${formatSavedAt(project.savedAt)}`
                          : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${project.name}`}
                      onClick={() => deleteProject(project.id)}
                      className="absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 text-xs text-muted hover:bg-beige/60 hover:text-ink"
                    >
                      ×
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              saveProject()
            }}
          >
            <input
              id={projectNameId}
              type="text"
              value={projectName}
              autoComplete="off"
              spellCheck={false}
              placeholder="Project name (optional)"
              onChange={(event) => {
                setProjectName(event.target.value)
                setSaveNotice(null)
              }}
              className="w-full rounded-lg border border-beige-dark/40 bg-white px-4 py-3 text-base text-ink outline-none ring-beige-dark/30 placeholder:text-muted/50 focus:ring-2"
            />
            <button
              type="submit"
              disabled={!canSave}
              className="shrink-0 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition enabled:hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </form>
          {saveNotice ? <p className="text-sm text-muted">{saveNotice}</p> : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor={fontId} className="text-sm font-medium text-ink">
              Font
            </label>
            <FontPicker
              id={fontId}
              value={fontOptionId}
              selectedFont={selectedFont}
              onChange={(id) => {
                setFontOptionId(id)
                setSaveNotice(null)
              }}
              uppercasePreview={false}
              listLabel="Label fonts"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-ink">Default outline colour</span>
            <ColorField
              label="Default outline colour"
              value={defaultColor}
              presetColors={LABEL_COLOR_PRESETS}
              onChange={(hex) => {
                setDefaultColor(hex)
                setSaveNotice(null)
              }}
              showLabel={false}
            />
            <button
              type="button"
              disabled={
                labels.length === 0 ||
                labels.every((label) => label.outlineColor === defaultColor)
              }
              onClick={() => {
                setLabels((current) =>
                  current.map((label) => ({
                    ...label,
                    outlineColor: defaultColor,
                  })),
                )
                setSaveNotice(null)
              }}
              className="rounded-lg border border-beige-dark/40 bg-white px-4 py-2.5 text-sm font-medium text-ink transition enabled:hover:bg-beige/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Apply to all labels
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <label htmlFor={nameId} className="text-sm font-medium text-ink">
            Add a name
          </label>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              addLabel()
            }}
          >
            <input
              ref={nameInputRef}
              id={nameId}
              type="text"
              value={draftName}
              autoComplete="off"
              spellCheck={false}
              placeholder="e.g. Pencils"
              onChange={(event) => {
                setDraftName(event.target.value)
                setError(null)
              }}
              className="w-full rounded-lg border border-beige-dark/40 bg-white px-4 py-3 text-lg text-ink outline-none ring-beige-dark/30 placeholder:text-muted/50 focus:ring-2"
            />
            <button
              type="submit"
              disabled={!canAdd}
              aria-label="Add label"
              className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-lg bg-ink text-2xl font-semibold text-white transition enabled:hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              +
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-3" aria-label="Labels">
          {labels.length === 0 ? (
            <p className="rounded-lg border border-dashed border-beige-dark/50 bg-white/60 px-4 py-10 text-center text-muted">
              Add a name to start your sheet of drawer labels.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {labels.map((label, index) => (
                <li
                  key={label.id}
                  className="flex items-center gap-2 rounded-lg border border-beige-dark/30 bg-white p-2"
                >
                  <span className="w-6 shrink-0 text-center text-xs text-muted">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={label.name}
                    aria-label={`Label ${index + 1} name`}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(event) =>
                      updateLabel(label.id, { name: event.target.value })
                    }
                    className="min-w-0 flex-1 rounded-md border border-beige-dark/30 bg-white px-3 py-2 text-base text-ink outline-none ring-beige-dark/30 focus:ring-2"
                    style={{ fontFamily: selectedFont.family, color: label.textColor }}
                  />
                  <ColorField
                    compact
                    label={`Label ${index + 1} text colour`}
                    value={label.textColor}
                    presetColors={LABEL_COLOR_PRESETS}
                    onChange={(hex) => updateLabel(label.id, { textColor: hex })}
                    icon={<RiFontSize size={18} />}
                  />
                  <ColorField
                    compact
                    label={`Label ${index + 1} outline colour`}
                    value={label.outlineColor}
                    presetColors={LABEL_COLOR_PRESETS}
                    onChange={(hex) =>
                      updateLabel(label.id, { outlineColor: hex })
                    }
                    icon={<RiSquareLine size={18} />}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${label.name || `label ${index + 1}`}`}
                    onClick={() => removeLabel(label.id)}
                    className="rounded-md px-2 py-2 text-sm font-medium text-muted transition hover:bg-beige/50 hover:text-ink"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Page preview" className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-ink">Preview</h2>
          {pages.length === 0 ? (
            <p className="rounded-lg border border-dashed border-beige-dark/50 bg-white/60 px-4 py-10 text-center text-muted">
              Labels will preview four to an A4 page, stacked vertically.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {pages.map((pageLabels, pageIndex) => (
                <li
                  key={pageIndex}
                  className="overflow-hidden rounded-lg border border-beige-dark/30 bg-white shadow-sm"
                >
                  <div
                    className="flex aspect-[210/297] flex-col justify-center"
                    style={{
                      paddingLeft: `${(PAGE_MARGIN_X_MM / 210) * 100}%`,
                      paddingRight: `${(PAGE_MARGIN_X_MM / 210) * 100}%`,
                      gap: `${(SLOT_GAP_MM / 297) * 100}%`,
                    }}
                  >
                    {Array.from({ length: LABELS_PER_PAGE }, (_, slotIndex) => {
                      const label = pageLabels[slotIndex]
                      return (
                        <div
                          key={label?.id ?? `empty-${slotIndex}`}
                          className="flex w-full shrink-0 items-center justify-center rounded-md border-2 px-2"
                          style={{
                            aspectRatio: `${210 - PAGE_MARGIN_X_MM * 2} / ${LABEL_HEIGHT_MM}`,
                            borderColor: label?.outlineColor ?? '#e7ded2',
                            borderStyle: label ? 'solid' : 'dashed',
                          }}
                        >
                          {label ? (
                            <p
                              className="max-w-full truncate text-center text-2xl leading-none sm:text-3xl"
                              style={{
                                fontFamily: selectedFont.family,
                                color: label.textColor,
                              }}
                            >
                              {label.name}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                  <p className="border-t border-beige-dark/20 py-1.5 text-center text-xs text-muted">
                    Page {pageIndex + 1}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-auto flex flex-col gap-3 border-t border-beige-dark/30 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            4 labels per A4 page · {selectedFont.label}
            {pageCount > 0
              ? ` · ${pageCount} page${pageCount === 1 ? '' : 's'}`
              : ''}
          </p>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              disabled={labels.length === 0 || isGenerating}
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
