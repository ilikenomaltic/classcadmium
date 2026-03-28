import { describe, it, expect } from 'vitest'
import { buildElementItems, getElementName } from '@/lib/utils/buildElementItems'
import type { QuizSetItemResolved } from '@/lib/types'

function makeElementItem(overrides: Partial<QuizSetItemResolved> = {}): QuizSetItemResolved {
  return {
    id: 'qsi-1',
    quiz_set_id: 'qs-1',
    item_id: 'item-11',
    front: 'Na (11)',
    back: '나트륨 — 알칼리 금속, 물과 격렬 반응',
    front_override: null,
    back_override: null,
    category_id: 'cat-1',
    atomic_number: 11,
    valence_electrons: 1,
    element_group: '알칼리 금속',
    ...overrides,
  }
}

const elementPool = [
  { id: 'item-1',  category_id: 'cat-1', front: 'H (1)',   back: '수소 — 비금속',           atomic_number: 1,  valence_electrons: 1, element_group: '비금속'      },
  { id: 'item-2',  category_id: 'cat-1', front: 'He (2)',  back: '헬륨 — 비활성 기체',       atomic_number: 2,  valence_electrons: 2, element_group: '비활성 기체' },
  { id: 'item-3',  category_id: 'cat-1', front: 'Li (3)',  back: '리튬 — 알칼리 금속',       atomic_number: 3,  valence_electrons: 1, element_group: '알칼리 금속' },
  { id: 'item-11', category_id: 'cat-1', front: 'Na (11)', back: '나트륨 — 알칼리 금속',     atomic_number: 11, valence_electrons: 1, element_group: '알칼리 금속' },
  { id: 'item-9',  category_id: 'cat-1', front: 'F (9)',   back: '플루오린 — 할로겐',        atomic_number: 9,  valence_electrons: 7, element_group: '할로겐'      },
]

describe('getElementName', () => {
  it('back 텍스트에서 원소 이름을 추출한다', () => {
    expect(getElementName('나트륨 — 알칼리 금속, 물과 격렬 반응')).toBe('나트륨')
  })
  it('구분자 없으면 전체 반환', () => {
    expect(getElementName('나트륨')).toBe('나트륨')
  })
})

describe('buildElementItems', () => {
  it('atomic_number 없는 item은 제외된다', () => {
    const nonElement = makeElementItem({ atomic_number: null })
    const result = buildElementItems([nonElement], elementPool)
    expect(result).toHaveLength(0)
  })

  it('각 문제에 선택지 4개', () => {
    const result = buildElementItems([makeElementItem()], elementPool)
    expect(result[0].choices).toHaveLength(4)
  })

  it('정답이 선택지에 포함', () => {
    const result = buildElementItems([makeElementItem()], elementPool)
    expect(result[0].choices).toContain(result[0].correctAnswer)
  })

  it('symbol_to_atomic — 질문에 원소기호 포함', () => {
    const result = buildElementItems([makeElementItem()], elementPool)
    if (result[0].questionType === 'symbol_to_atomic') {
      expect(result[0].questionText).toContain('Na')
      expect(result[0].correctAnswer).toBe('11')
    }
  })

  it('atomic_to_name — 질문에 원자번호 포함', () => {
    const items = [
      makeElementItem({ id: 'q1' }),
      makeElementItem({ id: 'q2', item_id: 'item-3',
        front: 'Li (3)', back: '리튬 — 알칼리 금속', atomic_number: 3 }),
    ]
    const result = buildElementItems(items, elementPool)
    const atomicQ = result.find(r => r.questionType === 'atomic_to_name')
    expect(atomicQ?.questionText).toContain('3')
    expect(atomicQ?.correctAnswer).toBe('리튬')
  })

  it('선택지에 중복 없음', () => {
    const result = buildElementItems([makeElementItem()], elementPool)
    const unique = new Set(result[0].choices)
    expect(unique.size).toBe(result[0].choices.length)
  })
})
