import { DEFAULT_TEXT_COLOR } from './colors'
import type { DrawerLabel } from './pdf'

export type DrawerLabelsProject = {
  id: string
  name: string
  savedAt: string
  fontOptionId: string
  defaultColor: string
  labels: DrawerLabel[]
}

const STORAGE_KEY = 'drawer-labels.projects'

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function normalizeLabel(value: unknown): DrawerLabel | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const label = value as Partial<DrawerLabel> & { color?: string }
  if (typeof label.id !== 'string' || typeof label.name !== 'string') {
    return null
  }

  const outlineColor = isHexColor(label.outlineColor)
    ? label.outlineColor
    : isHexColor(label.color)
      ? label.color
      : null
  if (!outlineColor) {
    return null
  }

  return {
    id: label.id,
    name: label.name,
    textColor: isHexColor(label.textColor) ? label.textColor : DEFAULT_TEXT_COLOR,
    outlineColor,
  }
}

function isProject(value: unknown): value is DrawerLabelsProject {
  if (!value || typeof value !== 'object') {
    return false
  }
  const project = value as Partial<DrawerLabelsProject>
  return (
    typeof project.id === 'string' &&
    typeof project.name === 'string' &&
    typeof project.savedAt === 'string' &&
    typeof project.fontOptionId === 'string' &&
    typeof project.defaultColor === 'string' &&
    Array.isArray(project.labels) &&
    project.labels.every((label) => normalizeLabel(label) !== null)
  )
}

function normalizeProject(value: unknown): DrawerLabelsProject | null {
  if (!isProject(value)) {
    return null
  }
  const labels = value.labels
    .map((label) => normalizeLabel(label))
    .filter((label): label is DrawerLabel => label !== null)
  return { ...value, labels }
}

export function loadSavedProjects(): DrawerLabelsProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .map((project) => normalizeProject(project))
      .filter((project): project is DrawerLabelsProject => project !== null)
  } catch {
    return []
  }
}

export function persistSavedProjects(projects: DrawerLabelsProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function projectNameFromLabels(labels: DrawerLabel[]): string {
  const names = labels
    .map((label) => label.name.trim())
    .filter(Boolean)
    .slice(0, 3)
  if (names.length === 0) {
    return 'Untitled labels'
  }
  return names.join(', ')
}
