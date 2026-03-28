export const MODE_MULTIPLIER: Record<string, number> = {
  flashcard: 1,
  ox: 1.5,
  blank: 2,
  multiple: 2.5,
  element: 3,
}

export const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 1,
  normal: 1.5,
  hard: 2,
}

export function calculatePoints(
  questionCount: number,
  mode: string,
  difficulty: string,
  scorePercent: number
): number {
  const modeM = MODE_MULTIPLIER[mode] ?? 1
  const diffM = DIFFICULTY_MULTIPLIER[difficulty] ?? 1.5
  return Math.floor(questionCount * modeM * diffM * (scorePercent / 100))
}
