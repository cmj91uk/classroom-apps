export type PartsMode = '2' | '3' | 'mix'

export type MissingSlot = 'whole' | number

export type PartWholeProblem = {
  partCount: 2 | 3
  whole: number
  parts: number[]
  missing: MissingSlot | null
}

export const PROBLEMS_PER_PAGE = 12
export const DEFAULT_MAX_NUMBER = 20
export const MAX_NUMBER_LIMIT = 999
export const WORKSHEET_COUNT_MAX = 26

export function worksheetLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

function randomInt(min: number, maxInclusive: number): number {
  return min + Math.floor(Math.random() * (maxInclusive - min + 1))
}

function randomPartCount(mode: PartsMode): 2 | 3 {
  if (mode === 'mix') {
    return Math.random() < 0.5 ? 2 : 3
  }
  return mode === '3' ? 3 : 2
}

function partsSummingTo(whole: number, partCount: 2 | 3): number[] {
  if (partCount === 2) {
    const left = randomInt(1, whole - 1)
    return [left, whole - left]
  }

  const first = randomInt(1, whole - 2)
  const second = randomInt(1, whole - first - 1)
  return [first, second, whole - first - second]
}

function randomMissing(partCount: 2 | 3): MissingSlot {
  const slot = randomInt(0, partCount)
  return slot === partCount ? 'whole' : slot
}

function problemKey(problem: PartWholeProblem): string {
  return `${problem.parts.join('+')}=${problem.whole}|${problem.missing}`
}

export function minWholeFor(partCount: 2 | 3): number {
  return partCount
}

export function generateProblems(
  count: number,
  mode: PartsMode,
  maxNumber: number,
  blank: boolean,
  used: Set<string> = new Set(),
): PartWholeProblem[] {
  const problems: PartWholeProblem[] = []
  const maxAttempts = count * 40

  for (let attempt = 0; problems.length < count && attempt < maxAttempts; attempt++) {
    const partCount = randomPartCount(mode)
    if (blank) {
      problems.push({
        partCount,
        whole: 0,
        parts: Array.from({ length: partCount }, () => 0),
        missing: null,
      })
      continue
    }

    const minWhole = minWholeFor(partCount)
    if (maxNumber < minWhole) {
      break
    }

    const whole = randomInt(minWhole, maxNumber)
    const parts = partsSummingTo(whole, partCount)
    const missing = randomMissing(partCount)
    const problem: PartWholeProblem = { partCount, whole, parts, missing }
    const key = problemKey(problem)
    if (used.has(key)) {
      continue
    }
    used.add(key)
    problems.push(problem)
  }

  while (problems.length < count) {
    const partCount = randomPartCount(mode)
    if (blank) {
      problems.push({
        partCount,
        whole: 0,
        parts: Array.from({ length: partCount }, () => 0),
        missing: null,
      })
      continue
    }
    const minWhole = minWholeFor(partCount)
    const whole = minWhole
    problems.push({
      partCount,
      whole,
      parts: partsSummingTo(whole, partCount),
      missing: randomMissing(partCount),
    })
  }

  return problems
}

export function generateWorksheets(
  worksheetCount: number,
  mode: PartsMode,
  maxNumber: number,
  blank: boolean,
): PartWholeProblem[][] {
  const used = new Set<string>()
  return Array.from({ length: worksheetCount }, () =>
    generateProblems(PROBLEMS_PER_PAGE, mode, maxNumber, blank, used),
  )
}

export function shownValue(
  problem: PartWholeProblem,
  slot: MissingSlot,
): number | null {
  if (problem.missing === null) {
    return null
  }
  if (problem.missing === slot) {
    return null
  }
  if (slot === 'whole') {
    return problem.whole
  }
  return problem.parts[slot] ?? null
}
