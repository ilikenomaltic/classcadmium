import { describe, it, expect } from 'vitest'
import { calculatePoints, MODE_MULTIPLIER, DIFFICULTY_MULTIPLIER } from '@/lib/utils/points'

describe('calculatePoints', () => {
  it('기본 계산 — 원소퀴즈 10문제 어려움 90점 = 54pt', () => {
    expect(calculatePoints(10, 'element', 'hard', 90)).toBe(54)
  })

  it('플래시카드 10문제 보통 100점 = 15pt', () => {
    expect(calculatePoints(10, 'flashcard', 'normal', 100)).toBe(15)
  })

  it('4지선다 5문제 쉬움 80점 = 10pt', () => {
    expect(calculatePoints(5, 'multiple', 'easy', 80)).toBe(10)
  })

  it('점수 0점이면 포인트 0', () => {
    expect(calculatePoints(10, 'element', 'hard', 0)).toBe(0)
  })

  it('알 수 없는 모드는 배율 1 적용', () => {
    expect(calculatePoints(10, 'unknown', 'normal', 100)).toBe(15)
  })

  it('알 수 없는 난이도는 배율 1.5 적용', () => {
    expect(calculatePoints(10, 'flashcard', 'unknown', 100)).toBe(15)
  })

  it('소수점은 버림(floor)', () => {
    // 10 * 1 * 1.5 * 0.33 = 4.95 → 4
    expect(calculatePoints(10, 'flashcard', 'normal', 33)).toBe(4)
  })
})

describe('MODE_MULTIPLIER', () => {
  it('모드별 배율이 올바르다', () => {
    expect(MODE_MULTIPLIER.flashcard).toBe(1)
    expect(MODE_MULTIPLIER.ox).toBe(1.5)
    expect(MODE_MULTIPLIER.blank).toBe(2)
    expect(MODE_MULTIPLIER.multiple).toBe(2.5)
    expect(MODE_MULTIPLIER.element).toBe(3)
  })
})

describe('DIFFICULTY_MULTIPLIER', () => {
  it('난이도별 배율이 올바르다', () => {
    expect(DIFFICULTY_MULTIPLIER.easy).toBe(1)
    expect(DIFFICULTY_MULTIPLIER.normal).toBe(1.5)
    expect(DIFFICULTY_MULTIPLIER.hard).toBe(2)
  })
})
