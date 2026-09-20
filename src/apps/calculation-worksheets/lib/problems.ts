export type ProblemKind =
  | 'addition-no-carry'
  | 'addition-carry'
  | 'subtraction-no-borrow'
  | 'subtraction-borrow'
  | 'multiplication'

export type Operator = '+' | '-' | '×'

export type TopDigits = 1 | 2 | 3
export type MultiplierDigits = 1 | 2

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
    return 'Adding 2-digit Numbers'
  }
  if (hasSub && !hasAdd && !hasMul) {
    return 'Subtracting 2-digit Numbers'
  }
  if (hasAdd && hasSub && !hasMul) {
    return 'Adding and Subtracting 2-digit Numbers'
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

function randomAdditionNoCarry(): WorksheetProblem {
  const tensLeft = randomInt(1, 8)
  const tensRight = randomInt(1, 9 - tensLeft)
  const onesLeft = randomInt(0, 9)
  const onesRight = randomInt(0, 9 - onesLeft)
  return makeAddition(
    tensLeft * 10 + onesLeft,
    tensRight * 10 + onesRight,
    'addition-no-carry',
  )
}

function randomAdditionCarry(): WorksheetProblem {
  const onesLeft = randomInt(1, 9)
  const onesRight = randomInt(10 - onesLeft, 9)
  const tensLeft = randomInt(1, 9)
  const tensRight = randomInt(1, 9)
  return makeAddition(
    tensLeft * 10 + onesLeft,
    tensRight * 10 + onesRight,
    'addition-carry',
  )
}

function randomSubtractionNoBorrow(): WorksheetProblem {
  const tensLeft = randomInt(1, 9)
  const tensRight = randomInt(1, tensLeft)
  const onesLeft =
    tensLeft === tensRight ? randomInt(1, 9) : randomInt(0, 9)
  const onesMax = tensLeft === tensRight ? onesLeft - 1 : onesLeft
  const onesRight = randomInt(0, onesMax)
  return makeSubtraction(
    tensLeft * 10 + onesLeft,
    tensRight * 10 + onesRight,
    'subtraction-no-borrow',
  )
}

function randomSubtractionBorrow(): WorksheetProblem {
  const tensLeft = randomInt(2, 9)
  const tensRight = randomInt(1, tensLeft - 1)
  const onesLeft = randomInt(0, 8)
  const onesRight = randomInt(onesLeft + 1, 9)
  return makeSubtraction(
    tensLeft * 10 + onesLeft,
    tensRight * 10 + onesRight,
    'subtraction-borrow',
  )
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
      return randomAdditionNoCarry()
    case 'addition-carry':
      return randomAdditionCarry()
    case 'subtraction-no-borrow':
      return randomSubtractionNoBorrow()
    case 'subtraction-borrow':
      return randomSubtractionBorrow()
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
