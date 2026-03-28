import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ElementQuiz from '@/components/quiz/ElementQuiz'
import type { ElementQuestion } from '@/lib/utils/buildElementItems'

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) =>
      <button onClick={onClick} className={className}>{children}</button>,
  },
}))

const question: ElementQuestion = {
  id: 'qsi-1',
  realItemId: 'item-11',
  questionType: 'symbol_to_atomic',
  questionText: 'Na의 원자번호는?',
  choices: ['11', '19', '3', '1'],
  correctAnswer: '11',
}

describe('ElementQuiz', () => {
  it('질문 텍스트를 표시한다', () => {
    render(<ElementQuiz question={question} onAnswer={vi.fn()} />)
    expect(screen.getByText('Na의 원자번호는?')).toBeInTheDocument()
  })

  it('선택지 4개를 표시한다', () => {
    render(<ElementQuiz question={question} onAnswer={vi.fn()} />)
    question.choices.forEach(c => expect(screen.getByText(c)).toBeInTheDocument())
  })

  it('정답 선택 시 onAnswer(id, given, true) 호출', () => {
    vi.useFakeTimers()
    const onAnswer = vi.fn()
    render(<ElementQuiz question={question} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('11'))
    vi.advanceTimersByTime(800)
    expect(onAnswer).toHaveBeenCalledWith('qsi-1', '11', true)
    vi.useRealTimers()
  })

  it('오답 선택 시 onAnswer(id, given, false) 호출', () => {
    vi.useFakeTimers()
    const onAnswer = vi.fn()
    render(<ElementQuiz question={question} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('19'))
    vi.advanceTimersByTime(800)
    expect(onAnswer).toHaveBeenCalledWith('qsi-1', '19', false)
    vi.useRealTimers()
  })
})
