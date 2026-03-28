import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MultipleQuiz from '@/components/quiz/MultipleQuiz'
import type { QuizSetItemResolved } from '@/lib/types'

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) =>
      <button onClick={onClick} className={className}>{children}</button>,
  },
}))

const item: QuizSetItemResolved = {
  id: 'qsi-1', quiz_set_id: 'qs-1', item_id: 'item-1',
  front: 'Na', back: '나트륨',
  front_override: null, back_override: null,
  category_id: 'cat-1', atomic_number: null,
  valence_electrons: null, element_group: null,
}
const choices = ['나트륨', '칼륨', '리튬', '칼슘']

describe('MultipleQuiz', () => {
  it('질문(front)을 표시한다', () => {
    render(<MultipleQuiz item={item} choices={choices} correctAnswer="나트륨" onAnswer={vi.fn()} />)
    expect(screen.getByText('Na')).toBeInTheDocument()
  })

  it('선택지 4개를 표시한다', () => {
    render(<MultipleQuiz item={item} choices={choices} correctAnswer="나트륨" onAnswer={vi.fn()} />)
    choices.forEach(c => expect(screen.getByText(c)).toBeInTheDocument())
  })

  it('정답 선택 시 onAnswer(id, given, true) 호출', () => {
    vi.useFakeTimers()
    const onAnswer = vi.fn()
    render(<MultipleQuiz item={item} choices={choices} correctAnswer="나트륨" onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('나트륨'))
    vi.advanceTimersByTime(800)
    expect(onAnswer).toHaveBeenCalledWith('qsi-1', '나트륨', true)
    vi.useRealTimers()
  })

  it('오답 선택 시 onAnswer(id, given, false) 호출', () => {
    vi.useFakeTimers()
    const onAnswer = vi.fn()
    render(<MultipleQuiz item={item} choices={choices} correctAnswer="나트륨" onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('칼륨'))
    vi.advanceTimersByTime(800)
    expect(onAnswer).toHaveBeenCalledWith('qsi-1', '칼륨', false)
    vi.useRealTimers()
  })
})
