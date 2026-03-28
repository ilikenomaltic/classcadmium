import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BottomNav from '@/components/student/BottomNav'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
}))

describe('BottomNav', () => {
  it('renders all five navigation items', () => {
    render(<BottomNav />)
    expect(screen.getByText('홈')).toBeInTheDocument()
    expect(screen.getByText('학습')).toBeInTheDocument()
    expect(screen.getByText('퀴즈')).toBeInTheDocument()
    expect(screen.getByText('내 반')).toBeInTheDocument()
    expect(screen.getByText('설정')).toBeInTheDocument()
  })

  it('renders five anchor links with correct hrefs', () => {
    render(<BottomNav />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
    const hrefs = links.map(l => l.getAttribute('href'))
    expect(hrefs).toContain('/dashboard')
    expect(hrefs).toContain('/study')
    expect(hrefs).toContain('/quiz')
    expect(hrefs).toContain('/classes')
    expect(hrefs).toContain('/settings')
  })

  it('applies active style to the link matching the current pathname', () => {
    render(<BottomNav />)
    const homeLink = screen.getByRole('link', { name: /홈/i })
    expect(homeLink).toHaveClass('text-indigo-600')
  })

  it('applies inactive style to links not matching the current pathname', () => {
    render(<BottomNav />)
    const studyLink = screen.getByRole('link', { name: /학습/i })
    expect(studyLink).toHaveClass('text-gray-400')
  })

  it('each nav item has the 48px minimum touch target class', () => {
    render(<BottomNav />)
    const links = screen.getAllByRole('link')
    links.forEach(link => {
      expect(link.className).toMatch(/min-h/)
    })
  })

  it('has a navigation landmark', () => {
    render(<BottomNav />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
