export const colors = {
  primary: {
    DEFAULT: '#6366F1',  // indigo-500
    light:   '#818CF8',  // indigo-400
    dark:    '#4338CA',  // indigo-700
  },
  correct:   '#4ECDC4',  // mint
  incorrect: '#FF6B6B',  // coral
  bg: {
    page:  '#F9FAFB',    // gray-50
    card:  '#FFFFFF',
    muted: '#F3F4F6',    // gray-100
  },
  text: {
    primary:   '#111827', // gray-900
    secondary: '#6B7280', // gray-500
  },
} as const

export const radius = {
  card:   'rounded-2xl',
  button: 'rounded-full',
  input:  'rounded-xl',
} as const

export const touchTarget = 'min-h-[48px] min-w-[48px]' as const
