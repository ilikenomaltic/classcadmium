import { describe, it, expect } from 'vitest'
import { buildMultipleItems } from '@/lib/utils/buildMultipleItems'
import type { QuizSetItemResolved } from '@/lib/types'

function makeItem(overrides: Partial<QuizSetItemResolved> = {}): QuizSetItemResolved {
  return {
    id: 'qsi-1',
    quiz_set_id: 'qs-1',
    item_id: 'item-1',
    front: 'Na',
    back: '나트륨',
    front_override: null,
    back_override: null,
    category_id: 'cat-1',
    atomic_number: null,
    valence_electrons: null,
    element_group: null,
    ...overrides,
  }
}

const pool = [
  { id: 'item-1', category_id: 'cat-1', front: 'Na', back: '나트륨' },
  { id: 'item-2', category_id: 'cat-1', front: 'K',  back: '칼륨' },
  { id: 'item-3', category_id: 'cat-1', front: 'Li', back: '리튬' },
  { id: 'item-4', category_id: 'cat-1', front: 'Ca', back: '칼슘' },
  { id: 'item-5', category_id: 'cat-2', front: 'H₂O', back: '물' },
]

describe('buildMultipleItems', () => {
  it('각 문제에 선택지 4개를 반환한다', () => {
    const items = [makeItem()]
    const result = buildMultipleItems(items, pool)
    expect(result[0].choices).toHaveLength(4)
  })

  it('정답이 선택지에 포함된다', () => {
    const items = [makeItem()]
    const result = buildMultipleItems(items, pool)
    expect(result[0].choices).toContain('나트륨')
    expect(result[0].correctAnswer).toBe('나트륨')
  })

  it('오답은 같은 카테고리에서 추출된다', () => {
    const items = [makeItem()]
    const result = buildMultipleItems(items, pool)
    expect(result[0].choices).not.toContain('물')
  })

  it('같은 카테고리 풀이 부족하면 다른 카테고리로 보완한다', () => {
    const smallPool = [
      { id: 'item-1', category_id: 'cat-1', front: 'Na', back: '나트륨' },
      { id: 'item-2', category_id: 'cat-1', front: 'K',  back: '칼륨' },
      { id: 'item-3', category_id: 'cat-1', front: 'Li', back: '리튬' },
      { id: 'item-5', category_id: 'cat-2', front: 'H₂O', back: '물' },
    ]
    const items = [makeItem()]
    const result = buildMultipleItems(items, smallPool)
    expect(result[0].choices).toHaveLength(4)
  })

  it('선택지에 중복이 없다', () => {
    const items = [makeItem()]
    const result = buildMultipleItems(items, pool)
    const unique = new Set(result[0].choices)
    expect(unique.size).toBe(4)
  })

  it('여러 문제에 대해 각각 처리한다', () => {
    const items = [
      makeItem({ id: 'qsi-1', item_id: 'item-1', front: 'Na', back: '나트륨' }),
      makeItem({ id: 'qsi-2', item_id: 'item-2', front: 'K',  back: '칼륨', category_id: 'cat-1' }),
    ]
    const result = buildMultipleItems(items, pool)
    expect(result).toHaveLength(2)
    expect(result[0].correctAnswer).toBe('나트륨')
    expect(result[1].correctAnswer).toBe('칼륨')
  })
})
