export type ProblemKind =
  | 'addition-no-carry'
  | 'addition-carry'
  | 'subtraction-no-borrow'
  | 'subtraction-borrow'
  | 'multiplication'

export type Operator = '+' | '-' | '×'

export type TopDigits = 1 | 2 | 3
export type MultiplierDigits = 1 | 2
export type AddSubDigits = 2 | 3 | 4

export type WorksheetProblem = {
  left: number
  right: number
  operator: Operator
  answer: number
  kind: ProblemKind
}

export type ProblemOptions = {
  additionNoCarry: boolean
  additionCarry: boolean
  subtractionNoBorrow: boolean
  subtractionBorrow: boolean
  multiplication: boolean
  multiplicationTopDigits: TopDigits
  multiplicationMultiplierDigits: MultiplierDigits
  additionDigits: AddSubDigits
  subtractionDigits: AddSubDigits
}

export function enabledKinds(options: ProblemOptions): ProblemKind[] {
  const kinds: ProblemKind[] = []
  if (options.additionNoCarry) {
    kinds.push('addition-no-carry')
  }
  if (options.additionCarry) {
    kinds.push('addition-carry')
  }
  if (options.subtractionNoBorrow) {
    kinds.push('subtraction-no-borrow')
  }
  if (options.subtractionBorrow) {
    kinds.push('subtraction-borrow')
  }
  if (options.multiplication) {
    kinds.push('multiplication')
  }
  return kinds
}

export function worksheetLetter(index: number): string {
  return String.fromCharCode(65 + index)
}

function digitPhrase(digits: number): string {
  return `${digits}-digit`
}

export function worksheetTitle(kinds: ProblemKind[], options: ProblemOptions): string {
  const hasAdd = kinds.some((kind) => kind.startsWith('addition'))
  const hasSub = kinds.some((kind) => kind.startsWith('subtraction'))
  const hasMul = kinds.includes('multiplication')

  if (hasMul && !hasAdd && !hasSub) {
    return `Multiplying ${digitPhrase(options.multiplicationTopDigits)} by ${digitPhrase(options.multiplicationMultiplierDigits)} Numbers`
  }
  if (hasAdd && !hasSub && !hasMul) {
    return `Adding ${digitPhrase(options.additionDigits)} Numbers`
  }
  if (hasSub && !hasAdd && !hasMul) {
    return `Subtracting ${digitPhrase(options.subtractionDigits)} Numbers`
  }
  if (hasAdd && hasSub && !hasMul) {
    if (options.additionDigits === options.subtractionDigits) {
      return `Adding and Subtracting ${digitPhrase(options.additionDigits)} Numbers`
    }
    return 'Adding and Subtracting Numbers'
  }
  if (hasAdd && hasMul && !hasSub) {
    return 'Adding and Multiplying Numbers'
  }
  if (hasSub && hasMul && !hasAdd) {
    return 'Subtracting and Multiplying Numbers'
  }
  return 'Calculation Practice'
}

function randomInt(min: number, maxInclusive: number): number {
  return min + Math.floor(Math.random() * (maxInclusive - min + 1))
}

function randomNDigit(digits: number): number {
  if (digits <= 1) {
    return randomInt(1, 9)
  }
  const min = 10 ** (digits - 1)
  const max = 10 ** digits - 1
  return randomInt(min, max)
}

function makeAddition(left: number, right: number, kind: ProblemKind): WorksheetProblem {
  return {
    left,
    right,
    operator: '+',
    answer: left + right,
    kind,
  }
}

function makeSubtraction(
  left: number,
  right: number,
  kind: ProblemKind,
): WorksheetProblem {
  return {
    left,
    right,
    operator: '-',
    answer: left - right,
    kind,
  }
}

function makeMultiplication(left: number, right: number): WorksheetProblem {
  return {
    left,
    right,
    operator: '×',
    answer: left * right,
    kind: 'multiplication',
  }
}

function fromDigits(digits: number[]): number {
  return digits.reduce((total, digit) => total * 10 + digit, 0)
}

function digitAt(value: number, placeFromRight: number): number {
  return Math.floor(Math.abs(value) / 10 ** placeFromRight) % 10
}

function hasColumnBorrow(left: number, right: number, digitCount: number): boolean {
  for (let i = 0; i < digitCount; i++) {
    if (digitAt(left, i) < digitAt(right, i)) {
      return true
    }
  }
  return false
}

function randomAdditionNoCarry(digitCount: AddSubDigits): WorksheetProblem {
  const left: number[] = []
  const right: number[] = []
  for (let i = 0; i < digitCount; i++) {
    const leading = i === 0
    const leftDigit = randomInt(leading ? 1 : 0, leading ? 8 : 9)
    const rightDigit = randomInt(leading ? 1 : 0, 9 - leftDigit)
    left.push(leftDigit)
    right.push(rightDigit)
  }
  return makeAddition(fromDigits(left), fromDigits(right), 'addition-no-carry')
}

function randomAdditionCarry(digitCount: AddSubDigits): WorksheetProblem {
  const carryIndex = randomInt(0, digitCount - 1)
  const left: number[] = []
  const right: number[] = []
  for (let i = 0; i < digitCount; i++) {
    const leading = i === 0
    if (i === carryIndex) {
      const leftDigit = randomInt(leading ? 1 : 1, 9)
      const rightDigit = randomInt(Math.max(leading ? 1 : 0, 10 - leftDigit), 9)
      left.push(leftDigit)
      right.push(rightDigit)
    } else {
      const leftDigit = randomInt(leading ? 1 : 0, leading ? 8 : 9)
      const rightDigit = randomInt(leading ? 1 : 0, 9 - leftDigit)
      left.push(leftDigit)
      right.push(rightDigit)
    }
  }
  return makeAddition(fromDigits(left), fromDigits(right), 'addition-carry')
}

function randomSubtractionNoBorrow(digitCount: AddSubDigits): WorksheetProblem {
  const left: number[] = []
  const right: number[] = []
  let equalSoFar = true
  for (let i = 0; i < digitCount; i++) {
    const leading = i === 0
    const last = i === digitCount - 1
    const leftMin = leading || (equalSoFar && last) ? 1 : 0
    const leftDigit = randomInt(leftMin, 9)
    const rightMin = leading ? 1 : 0
    const rightMax = equalSoFar && last ? leftDigit - 1 : leftDigit
    const rightDigit = randomInt(rightMin, Math.max(rightMin, rightMax))
    left.push(leftDigit)
    right.push(rightDigit)
    if (rightDigit < leftDigit) {
      equalSoFar = false
    }
  }
  return makeSubtraction(fromDigits(left), fromDigits(right), 'subtraction-no-borrow')
}

function randomSubtractionBorrow(digitCount: AddSubDigits): WorksheetProblem {
  for (let attempt = 0; attempt < 80; attempt++) {
    const left = randomNDigit(digitCount)
    const right = randomNDigit(digitCount)
    if (left > right && hasColumnBorrow(left, right, digitCount)) {
      return makeSubtraction(left, right, 'subtraction-borrow')
    }
  }

  const left: number[] = []
  const right: number[] = []
  for (let i = 0; i < digitCount - 1; i++) {
    const leading = i === 0
    const leftDigit = randomInt(leading ? 2 : 1, 9)
    const rightDigit = randomInt(leading ? 1 : 0, Math.max(leading ? 1 : 0, leftDigit - (leading ? 1 : 0)))
    left.push(leftDigit)
    right.push(rightDigit)
  }
  const onesLeft = randomInt(0, 8)
  left.push(onesLeft)
  right.push(randomInt(onesLeft + 1, 9))
  return makeSubtraction(fromDigits(left), fromDigits(right), 'subtraction-borrow')
}

function randomMultiplication(
  topDigits: TopDigits,
  multiplierDigits: MultiplierDigits,
): WorksheetProblem {
  return makeMultiplication(
    randomNDigit(topDigits),
    randomNDigit(multiplierDigits),
  )
}

function generateOne(kind: ProblemKind, options: ProblemOptions): WorksheetProblem {
  switch (kind) {
    case 'addition-no-carry':
      return randomAdditionNoCarry(options.additionDigits)
    case 'addition-carry':
      return randomAdditionCarry(options.additionDigits)
    case 'subtraction-no-borrow':
      return randomSubtractionNoBorrow(options.subtractionDigits)
    case 'subtraction-borrow':
      return randomSubtractionBorrow(options.subtractionDigits)
    case 'multiplication':
      return randomMultiplication(
        options.multiplicationTopDigits,
        options.multiplicationMultiplierDigits,
      )
  }
}

function problemKey(problem: WorksheetProblem): string {
  return `${problem.operator}:${problem.left},${problem.right}`
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    const current = items[i]!
    items[i] = items[j]!
    items[j] = current
  }
  return items
}

function kindQueue(count: number, kinds: ProblemKind[]): ProblemKind[] {
  const base = Math.floor(count / kinds.length)
  const extra = count % kinds.length
  const queue: ProblemKind[] = []
  kinds.forEach((kind, index) => {
    const n = base + (index < extra ? 1 : 0)
    for (let i = 0; i < n; i++) {
      queue.push(kind)
    }
  })
  return shuffleInPlace(queue)
}

export function generateWorksheetProblems(
  count: number,
  kinds: ProblemKind[],
  used: Set<string>,
  options: ProblemOptions,
): WorksheetProblem[] {
  if (kinds.length === 0 || count <= 0) {
    return []
  }

  const queue = kindQueue(count, kinds)
  const problems: WorksheetProblem[] = []
  const maxAttempts = count * 40

  for (let attempt = 0; problems.length < count && attempt < maxAttempts; attempt++) {
    const kind = queue[problems.length]!
    const problem = generateOne(kind, options)
    const key = problemKey(problem)
    if (used.has(key)) {
      continue
    }
    used.add(key)
    problems.push(problem)
  }

  while (problems.length < count) {
    const kind = queue[problems.length] ?? kinds[0]!
    problems.push(generateOne(kind, options))
  }

  return problems
}

export function generateWorksheets(
  worksheetCount: number,
  problemsPerPage: number,
  options: ProblemOptions,
): WorksheetProblem[][] {
  const kinds = enabledKinds(options)
  const used = new Set<string>()
  return Array.from({ length: worksheetCount }, () =>
    generateWorksheetProblems(problemsPerPage, kinds, used, options),
  )
}

export function formatAnswerLine(problem: WorksheetProblem, index: number): string {
  return `${index + 1}. ${problem.left} ${problem.operator} ${problem.right} = ${problem.answer}`
}
