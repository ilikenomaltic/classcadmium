# Learning Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4지선다·원소 퀴즈 모드 추가, 틀린 문제 다시 풀기, 포인트·반 내 랭킹, 학습 카드 UX 개선.

**Architecture:** DB 마이그레이션 1개(profiles.points, items 원소 컬럼, quiz_assignments.difficulty, RLS 2개). 유틸 함수 3개(calculatePoints, buildMultipleItems, buildElementItems)를 순수 함수로 추출해 테스트. 새 컴포넌트 MultipleQuiz·ElementQuiz는 기존 quiz session 페이지에 조건부로 삽입. submitQuizResult 서버 액션이 포인트 계산 후 DB에 적립하고 earnedPoints 반환.

**Tech Stack:** Next.js App Router, Supabase, Framer Motion, Tailwind CSS, Vitest + React Testing Library

---

## File Map

| 상태 | 경로 |
|------|------|
| 신규 | `supabase/migrations/20240009_learning_improvements.sql` |
| 수정 | `supabase/seed.sql` |
| 수정 | `src/lib/types.ts` |
| 신규 | `src/lib/utils/points.ts` |
| 신규 | `src/lib/utils/buildMultipleItems.ts` |
| 신규 | `src/lib/utils/buildElementItems.ts` |
| 신규 | `src/components/quiz/MultipleQuiz.tsx` |
| 신규 | `src/components/quiz/ElementQuiz.tsx` |
| 수정 | `src/components/student/FlashCard.tsx` |
| 수정 | `src/app/(student)/study/session/page.tsx` |
| 수정 | `src/app/(teacher)/teacher/assignments/AssignmentForm.tsx` |
| 수정 | `src/app/(teacher)/teacher/actions.ts` |
| 수정 | `src/app/(student)/quiz/[assignmentId]/page.tsx` |
| 수정 | `src/app/(student)/quiz/[assignmentId]/result/page.tsx` |
| 수정 | `src/app/(student)/classes/page.tsx` |
| 신규 | `__tests__/lib/utils/points.test.ts` |
| 신규 | `__tests__/lib/utils/buildMultipleItems.test.ts` |
| 신규 | `__tests__/lib/utils/buildElementItems.test.ts` |
| 신규 | `__tests__/components/quiz/MultipleQuiz.test.tsx` |
| 신규 | `__tests__/components/quiz/ElementQuiz.test.tsx` |

---

## Task 1: DB Migration

**Files:**
- Create: `supabase/migrations/20240009_learning_improvements.sql`

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 1. profiles에 포인트 컬럼
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- 2. items에 원소 데이터 컬럼
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS atomic_number INTEGER;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS valence_electrons INTEGER;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS element_group TEXT;

-- 3. quiz_assignments에 난이도 컬럼 + mode CHECK 업데이트
ALTER TABLE public.quiz_assignments ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE public.quiz_assignments DROP CONSTRAINT IF EXISTS quiz_assignments_mode_check;
ALTER TABLE public.quiz_assignments ADD CONSTRAINT quiz_assignments_mode_check
  CHECK (mode IN ('flashcard', 'ox', 'blank', 'multiple', 'element'));
ALTER TABLE public.quiz_assignments ADD CONSTRAINT quiz_assignments_difficulty_check
  CHECK (difficulty IN ('easy', 'normal', 'hard'));

-- 4. 포인트 적립 RPC (atomic increment)
CREATE OR REPLACE FUNCTION public.add_points(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.profiles SET points = points + p_amount WHERE id = p_user_id;
$$;

-- 5. RLS: 학생이 같은 반 학우 class_members 조회 허용
CREATE POLICY "class_members: student read classmates" ON public.class_members
  FOR SELECT USING (public.is_member_of_class(class_id));

-- 6. RLS: 학생이 같은 반 학우 프로필(name, points) 조회 허용
CREATE POLICY "profiles: classmate read" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.class_id IN (
        SELECT class_id FROM public.class_members WHERE student_id = auth.uid()
      )
      AND cm.student_id = profiles.id
    )
  );
```

- [ ] **Step 2: 마이그레이션 적용**

```bash
cd /home/hyeonjae/class_cd
npx supabase db push
```

Expected: 마이그레이션 성공 메시지, 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20240009_learning_improvements.sql
git commit -m "feat: add points, element columns, difficulty, new quiz modes migration"
```

---

## Task 2: Seed Data — 원소 데이터 추가

**Files:**
- Modify: `supabase/seed.sql`

- [ ] **Step 1: seed.sql 끝에 원소 데이터 UPDATE 추가**

`supabase/seed.sql` 파일 맨 아래에 아래 내용을 추가한다.

```sql
-- ============================================================
-- 원소주기율표 — 원소 데이터 (atomic_number, valence_electrons, element_group)
-- ============================================================
UPDATE public.items SET atomic_number=1,  valence_electrons=1, element_group='비금속'       WHERE front='H (1)'   AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=2,  valence_electrons=2, element_group='비활성 기체'  WHERE front='He (2)'  AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=3,  valence_electrons=1, element_group='알칼리 금속'  WHERE front='Li (3)'  AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=4,  valence_electrons=2, element_group='알칼리 토금속' WHERE front='Be (4)'  AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=5,  valence_electrons=3, element_group='준금속'       WHERE front='B (5)'   AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=6,  valence_electrons=4, element_group='비금속'       WHERE front='C (6)'   AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=7,  valence_electrons=5, element_group='비금속'       WHERE front='N (7)'   AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=8,  valence_electrons=6, element_group='비금속'       WHERE front='O (8)'   AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=9,  valence_electrons=7, element_group='할로겐'       WHERE front='F (9)'   AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=10, valence_electrons=8, element_group='비활성 기체'  WHERE front='Ne (10)' AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=11, valence_electrons=1, element_group='알칼리 금속'  WHERE front='Na (11)' AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=12, valence_electrons=2, element_group='알칼리 토금속' WHERE front='Mg (12)' AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=13, valence_electrons=3, element_group='금속'         WHERE front='Al (13)' AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=14, valence_electrons=4, element_group='준금속'       WHERE front='Si (14)' AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=15, valence_electrons=5, element_group='비금속'       WHERE front='P (15)'  AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=16, valence_electrons=6, element_group='비금속'       WHERE front='S (16)'  AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=17, valence_electrons=7, element_group='할로겐'       WHERE front='Cl (17)' AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=18, valence_electrons=8, element_group='비활성 기체'  WHERE front='Ar (18)' AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=19, valence_electrons=1, element_group='알칼리 금속'  WHERE front='K (19)'  AND category_id='11111111-0000-0000-0000-000000000001';
UPDATE public.items SET atomic_number=20, valence_electrons=2, element_group='알칼리 토금속' WHERE front='Ca (20)' AND category_id='11111111-0000-0000-0000-000000000001';
```

- [ ] **Step 2: 시드 재적용**

```bash
npx supabase db reset
```

Expected: 마이그레이션 + 시드 모두 성공. `items` 테이블에서 Na 행의 `atomic_number=11` 확인.

- [ ] **Step 3: 커밋**

```bash
git add supabase/seed.sql
git commit -m "feat: add element data (atomic_number, valence_electrons, element_group) to seed"
```

---

## Task 3: Types 업데이트

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: types.ts 전체 교체**

```typescript
export type Role = 'student' | 'teacher' | 'admin'
export type QuizMode = 'flashcard' | 'ox' | 'blank' | 'multiple' | 'element'
export type Difficulty = 'easy' | 'normal' | 'hard'

export interface Profile {
  id: string
  email: string
  role: Role
  name: string
  points: number
}

export interface Category {
  id: string
  name: string
}

export interface Item {
  id: string
  category_id: string
  front: string
  back: string
  image_url: string | null
  atomic_number: number | null
  valence_electrons: number | null
  element_group: string | null
}

export interface Class {
  id: string
  name: string
  teacher_id: string
  invite_code: string
}

export interface ClassMember {
  class_id: string
  student_id: string
}

export interface QuizSet {
  id: string
  title: string
  teacher_id: string
  created_at: string
}

export interface QuizSetItem {
  id: string
  quiz_set_id: string
  item_id: string | null
  front_override: string | null
  back_override: string | null
}

export interface QuizAssignment {
  id: string
  quiz_set_id: string
  class_id: string
  due_date: string | null
  mode: QuizMode
  difficulty: Difficulty
}

export interface QuizResult {
  id: string
  student_id: string
  quiz_set_id: string
  assignment_id: string | null
  score: number
  answers: { itemId: string; given: string; correct: boolean }[]
  submitted_at: string
}

// Composite types for joined queries
export interface AssignmentWithSet extends QuizAssignment {
  quiz_sets: Pick<QuizSet, 'title'>
  classes: Pick<Class, 'name'>
}

export interface ResultWithProfile extends QuizResult {
  profiles: Pick<Profile, 'name'>
}

export interface ItemWithCategory extends Item {
  categories: Pick<Category, 'name'>
}

export interface QuizSetItemResolved {
  id: string
  quiz_set_id: string
  item_id: string | null
  front: string
  back: string
  front_override: string | null
  back_override: string | null
  category_id: string | null
  atomic_number: number | null
  valence_electrons: number | null
  element_group: string | null
}
```

- [ ] **Step 2: 타입 에러 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 0개 또는 기존 에러만 (새로 추가한 타입으로 인한 에러 없어야 함).

- [ ] **Step 3: 커밋**

```bash
git add src/lib/types.ts
git commit -m "feat: update types for new quiz modes, difficulty, points, element data"
```

---

## Task 4: calculatePoints 유틸 + 테스트

**Files:**
- Create: `src/lib/utils/points.ts`
- Create: `__tests__/lib/utils/points.test.ts`

- [ ] **Step 1: 테스트 파일 작성 (먼저 실패하는 테스트)**

```typescript
// __tests__/lib/utils/points.test.ts
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx vitest run __tests__/lib/utils/points.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/utils/points'"

- [ ] **Step 3: 구현**

```typescript
// src/lib/utils/points.ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/lib/utils/points.test.ts
```

Expected: 7 tests passed.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/utils/points.ts __tests__/lib/utils/points.test.ts
git commit -m "feat: add calculatePoints utility with tests"
```

---

## Task 5: buildMultipleItems 유틸 + 테스트

**Files:**
- Create: `src/lib/utils/buildMultipleItems.ts`
- Create: `__tests__/lib/utils/buildMultipleItems.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// __tests__/lib/utils/buildMultipleItems.test.ts
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
    // 선택지에 다른 카테고리 항목(물)이 없어야 함 (같은 카테고리로 충분할 때)
    expect(result[0].choices).not.toContain('물')
  })

  it('같은 카테고리 풀이 부족하면 다른 카테고리로 보완한다', () => {
    const smallPool = [
      { id: 'item-1', category_id: 'cat-1', front: 'Na', back: '나트륨' },
      { id: 'item-2', category_id: 'cat-1', front: 'K',  back: '칼륨' },
      // 같은 카테고리에 오답 2개뿐
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx vitest run __tests__/lib/utils/buildMultipleItems.test.ts
```

Expected: FAIL

- [ ] **Step 3: 구현**

```typescript
// src/lib/utils/buildMultipleItems.ts
import { shuffle } from './shuffle'
import type { QuizSetItemResolved } from '@/lib/types'

export interface PoolItem {
  id: string
  category_id: string
  back: string
}

export interface MultipleItem {
  item: QuizSetItemResolved
  choices: string[]
  correctAnswer: string
}

export function buildMultipleItems(
  quizItems: QuizSetItemResolved[],
  pool: PoolItem[]
): MultipleItem[] {
  return quizItems.map(item => {
    const correctAnswer = item.back

    // 같은 카테고리에서 정답을 제외한 오답 후보
    const sameCategory = pool.filter(
      p => p.category_id === item.category_id && p.back !== correctAnswer
    )
    let distractors = shuffle(sameCategory).slice(0, 3).map(p => p.back)

    // 부족하면 다른 카테고리에서 보완 (이미 선택된 값 제외)
    if (distractors.length < 3) {
      const otherCategory = pool.filter(
        p => p.back !== correctAnswer && !distractors.includes(p.back)
      )
      distractors = [
        ...distractors,
        ...shuffle(otherCategory).slice(0, 3 - distractors.length).map(p => p.back),
      ]
    }

    return {
      item,
      choices: shuffle([correctAnswer, ...distractors.slice(0, 3)]),
      correctAnswer,
    }
  })
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/lib/utils/buildMultipleItems.test.ts
```

Expected: 6 tests passed.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/utils/buildMultipleItems.ts __tests__/lib/utils/buildMultipleItems.test.ts
git commit -m "feat: add buildMultipleItems utility with tests"
```

---

## Task 6: buildElementItems 유틸 + 테스트

**Files:**
- Create: `src/lib/utils/buildElementItems.ts`
- Create: `__tests__/lib/utils/buildElementItems.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// __tests__/lib/utils/buildElementItems.test.ts
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
  { id: 'item-1',  category_id: 'cat-1', front: 'H (1)',   back: '수소 — 비금속',           atomic_number: 1,  valence_electrons: 1, element_group: '비금속',      valence_electrons_num: 1 },
  { id: 'item-2',  category_id: 'cat-1', front: 'He (2)',  back: '헬륨 — 비활성 기체',       atomic_number: 2,  valence_electrons: 2, element_group: '비활성 기체'  },
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
    // index 0 → symbol_to_atomic
    const result = buildElementItems([makeElementItem()], elementPool)
    if (result[0].questionType === 'symbol_to_atomic') {
      expect(result[0].questionText).toContain('Na')
      expect(result[0].correctAnswer).toBe('11')
    }
  })

  it('atomic_to_name — 질문에 원자번호 포함', () => {
    const items = [
      makeElementItem({ id: 'q1' }),                              // index 0 → symbol_to_atomic
      makeElementItem({ id: 'q2', item_id: 'item-3',            // index 1 → atomic_to_name
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx vitest run __tests__/lib/utils/buildElementItems.test.ts
```

Expected: FAIL

- [ ] **Step 3: 구현**

```typescript
// src/lib/utils/buildElementItems.ts
import { shuffle } from './shuffle'
import type { QuizSetItemResolved } from '@/lib/types'

export type ElementQuestionType = 'symbol_to_atomic' | 'atomic_to_name' | 'valence_to_group'

export interface ElementQuestion {
  id: string                    // quiz_set_item id
  realItemId: string | null     // items.id
  questionType: ElementQuestionType
  questionText: string
  choices: string[]
  correctAnswer: string
}

export interface ElementPoolItem {
  id: string
  category_id: string
  front: string
  back: string
  atomic_number: number | null
  valence_electrons: number | null
  element_group: string | null
}

export function getElementName(back: string): string {
  return back.split(' — ')[0].trim()
}

const QUESTION_TYPES: ElementQuestionType[] = [
  'symbol_to_atomic',
  'atomic_to_name',
  'valence_to_group',
]

export function buildElementItems(
  quizItems: QuizSetItemResolved[],
  pool: ElementPoolItem[]
): ElementQuestion[] {
  const elementItems = quizItems.filter(item => item.atomic_number != null)
  const elementPool = pool.filter(
    (p): p is ElementPoolItem & { atomic_number: number; valence_electrons: number; element_group: string } =>
      p.atomic_number != null && p.valence_electrons != null && p.element_group != null
  )

  return elementItems.map((item, i) => {
    const questionType = QUESTION_TYPES[i % 3]
    const symbol = item.front.split(' ')[0]

    switch (questionType) {
      case 'symbol_to_atomic': {
        const correctAnswer = String(item.atomic_number)
        const distractors = shuffle(
          elementPool
            .filter(p => p.id !== item.item_id && String(p.atomic_number) !== correctAnswer)
            .map(p => String(p.atomic_number))
        ).slice(0, 3)
        return {
          id: item.id,
          realItemId: item.item_id,
          questionType,
          questionText: `${symbol}의 원자번호는?`,
          choices: shuffle([correctAnswer, ...distractors]),
          correctAnswer,
        }
      }

      case 'atomic_to_name': {
        const correctAnswer = getElementName(item.back)
        const distractors = shuffle(
          elementPool
            .filter(p => p.id !== item.item_id)
            .map(p => getElementName(p.back))
            .filter(name => name !== correctAnswer)
        ).slice(0, 3)
        return {
          id: item.id,
          realItemId: item.item_id,
          questionType,
          questionText: `원자번호 ${item.atomic_number}번 원소의 이름은?`,
          choices: shuffle([correctAnswer, ...distractors]),
          correctAnswer,
        }
      }

      case 'valence_to_group': {
        const correctAnswer = item.element_group!
        const allGroups = [...new Set(elementPool.map(p => p.element_group))]
        const distractors = shuffle(allGroups.filter(g => g !== correctAnswer)).slice(0, 3)
        return {
          id: item.id,
          realItemId: item.item_id,
          questionType,
          questionText: `${symbol}의 원자가전자가 ${item.valence_electrons}개일 때, 어느 족(族)에 속하나요?`,
          choices: shuffle([correctAnswer, ...distractors]),
          correctAnswer,
        }
      }
    }
  })
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/lib/utils/buildElementItems.test.ts
```

Expected: 8 tests passed.

- [ ] **Step 5: 커밋**

```bash
git add src/lib/utils/buildElementItems.ts __tests__/lib/utils/buildElementItems.test.ts
git commit -m "feat: add buildElementItems utility with tests"
```

---

## Task 7: MultipleQuiz 컴포넌트 + 테스트

**Files:**
- Create: `src/components/quiz/MultipleQuiz.tsx`
- Create: `__tests__/components/quiz/MultipleQuiz.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// __tests__/components/quiz/MultipleQuiz.test.tsx
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx vitest run __tests__/components/quiz/MultipleQuiz.test.tsx
```

- [ ] **Step 3: 구현**

```typescript
// src/components/quiz/MultipleQuiz.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { QuizSetItemResolved } from '@/lib/types'

interface MultipleQuizProps {
  item: QuizSetItemResolved
  choices: string[]
  correctAnswer: string
  onAnswer: (itemId: string, given: string, correct: boolean) => void
}

export default function MultipleQuiz({ item, choices, correctAnswer, onAnswer }: MultipleQuizProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  function handleSelect(choice: string) {
    if (showFeedback) return
    setSelected(choice)
    setShowFeedback(true)
    const correct = choice === correctAnswer
    setTimeout(() => {
      setSelected(null)
      setShowFeedback(false)
      onAnswer(item.id, choice, correct)
    }, 800)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
        <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">앞면</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{item.front}</p>
      </div>

      <div className="space-y-2.5">
        {choices.map((choice, i) => {
          let cls = 'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left font-medium text-sm transition-colors'
          if (showFeedback) {
            if (choice === correctAnswer) cls += ' bg-teal-50 border-[#4ECDC4] text-teal-700'
            else if (choice === selected) cls += ' bg-red-50 border-[#FF6B6B] text-red-600'
            else cls += ' bg-gray-50 border-gray-200 text-gray-400'
          } else {
            cls += ' bg-gray-50 border-gray-200 text-gray-700 active:border-indigo-400'
          }
          return (
            <motion.button
              key={choice}
              whileTap={{ scale: 0.98 }}
              className={cls}
              onClick={() => handleSelect(choice)}
            >
              <span className="bg-indigo-100 text-indigo-600 rounded-lg px-2 py-0.5 text-xs font-bold min-w-[24px] text-center shrink-0">
                {['①', '②', '③', '④'][i]}
              </span>
              {choice}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/quiz/MultipleQuiz.test.tsx
```

Expected: 4 tests passed.

- [ ] **Step 5: 커밋**

```bash
git add src/components/quiz/MultipleQuiz.tsx __tests__/components/quiz/MultipleQuiz.test.tsx
git commit -m "feat: add MultipleQuiz component with tests"
```

---

## Task 8: ElementQuiz 컴포넌트 + 테스트

**Files:**
- Create: `src/components/quiz/ElementQuiz.tsx`
- Create: `__tests__/components/quiz/ElementQuiz.test.tsx`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// __tests__/components/quiz/ElementQuiz.test.tsx
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
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

```bash
npx vitest run __tests__/components/quiz/ElementQuiz.test.tsx
```

- [ ] **Step 3: 구현**

```typescript
// src/components/quiz/ElementQuiz.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { ElementQuestion } from '@/lib/utils/buildElementItems'

interface ElementQuizProps {
  question: ElementQuestion
  onAnswer: (itemId: string, given: string, correct: boolean) => void
}

export default function ElementQuiz({ question, onAnswer }: ElementQuizProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  function handleSelect(choice: string) {
    if (showFeedback) return
    setSelected(choice)
    setShowFeedback(true)
    const correct = choice === question.correctAnswer
    setTimeout(() => {
      setSelected(null)
      setShowFeedback(false)
      onAnswer(question.id, choice, correct)
    }, 800)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
        <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">⚗️ 원소 퀴즈</p>
        <p className="text-xl font-bold text-gray-900 leading-relaxed">{question.questionText}</p>
      </div>

      <div className="space-y-2.5">
        {question.choices.map((choice, i) => {
          let cls = 'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left font-medium text-sm transition-colors'
          if (showFeedback) {
            if (choice === question.correctAnswer) cls += ' bg-teal-50 border-[#4ECDC4] text-teal-700'
            else if (choice === selected) cls += ' bg-red-50 border-[#FF6B6B] text-red-600'
            else cls += ' bg-gray-50 border-gray-200 text-gray-400'
          } else {
            cls += ' bg-gray-50 border-gray-200 text-gray-700 active:border-indigo-400'
          }
          return (
            <motion.button
              key={choice}
              whileTap={{ scale: 0.98 }}
              className={cls}
              onClick={() => handleSelect(choice)}
            >
              <span className="bg-indigo-100 text-indigo-600 rounded-lg px-2 py-0.5 text-xs font-bold min-w-[24px] text-center shrink-0">
                {['①', '②', '③', '④'][i]}
              </span>
              {choice}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run __tests__/components/quiz/ElementQuiz.test.tsx
```

Expected: 4 tests passed.

- [ ] **Step 5: 커밋**

```bash
git add src/components/quiz/ElementQuiz.tsx __tests__/components/quiz/ElementQuiz.test.tsx
git commit -m "feat: add ElementQuiz component with tests"
```

---

## Task 9: 학습 세션 카운터 UI

**Files:**
- Modify: `src/app/(student)/study/session/page.tsx`

- [ ] **Step 1: StudySession 컴포넌트에 카운터 추가**

`src/app/(student)/study/session/page.tsx`에서 버튼 위에 카운터 3개 표시 추가.

아래 코드에서 `<p className="text-center text-xs text-gray-400 mt-3">...` 위에 카운터 div를 삽입한다.

```typescript
// 버튼 위, 스와이프 힌트 텍스트 위에 삽입
<div className="flex justify-center gap-2 mt-4">
  <span className="bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">
    ✓ {known.length}
  </span>
  <span className="bg-red-50 border border-red-200 text-red-600 rounded-full px-3 py-1 text-xs font-semibold">
    ✗ {unknown.length}
  </span>
  <span className="bg-purple-50 border border-purple-200 text-purple-600 rounded-full px-3 py-1 text-xs font-semibold">
    — {cards.length - index}
  </span>
</div>
```

최종 위치 — `return` 내부에서 `<div className="flex gap-3 mt-6">` (버튼 row) 바로 위에 삽입.

- [ ] **Step 2: 개발 서버에서 확인**

```bash
pnpm dev
```

`/study` → 카테고리 선택 → 학습 시작 → 카드 화면에서 ✓0 / ✗0 / —N 카운터 표시 확인.

- [ ] **Step 3: 커밋**

```bash
git add src/app/\(student\)/study/session/page.tsx
git commit -m "feat: add known/unknown/remaining counter to study session"
```

---

## Task 10: AssignmentForm + createAssignment (난이도 + 새 모드)

**Files:**
- Modify: `src/app/(teacher)/teacher/assignments/AssignmentForm.tsx`
- Modify: `src/app/(teacher)/teacher/actions.ts`

- [ ] **Step 1: AssignmentForm.tsx 수정**

`MODES` 상수에 새 모드 추가, `DIFFICULTIES` 상수 추가, 난이도 select 필드 추가.

```typescript
const MODES = [
  { value: 'flashcard', label: '플래시카드' },
  { value: 'ox', label: 'OX 퀴즈' },
  { value: 'blank', label: '빈칸 채우기' },
  { value: 'multiple', label: '4지선다' },
  { value: 'element', label: '원소 퀴즈' },
]

const DIFFICULTIES = [
  { value: 'easy', label: '쉬움' },
  { value: 'normal', label: '보통' },
  { value: 'hard', label: '어려움' },
]
```

`grid grid-cols-2` 아래에 난이도 필드를 추가한다:

```tsx
<div>
  <label className="block text-xs font-medium text-gray-600 mb-1">난이도</label>
  <select name="difficulty" required defaultValue="normal"
    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
    {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
  </select>
</div>
```

- [ ] **Step 2: actions.ts의 createAssignment에 difficulty 추가**

`createAssignment` 함수에서 insert 시 `difficulty` 포함:

```typescript
const { error } = await supabase.from('quiz_assignments').insert({
  quiz_set_id: quizSetId,
  class_id: classId,
  due_date: (formData.get('due_date') as string) || null,
  mode: formData.get('mode') as string,
  difficulty: (formData.get('difficulty') as string) || 'normal',
})
```

- [ ] **Step 3: 개발 서버에서 확인**

`/teacher/assignments` 접속 → "새 배정 만들기" 열기 → 모드 드롭다운에 "4지선다", "원소 퀴즈" 확인 → 난이도 드롭다운 확인.

- [ ] **Step 4: 커밋**

```bash
git add src/app/\(teacher\)/teacher/assignments/AssignmentForm.tsx src/app/\(teacher\)/teacher/actions.ts
git commit -m "feat: add difficulty field and new quiz modes to assignment form"
```

---

## Task 11: submitQuizResult에 포인트 계산 추가

**Files:**
- Modify: `src/app/(teacher)/teacher/actions.ts`

- [ ] **Step 1: submitQuizResult 수정**

`calculatePoints` import 추가 후 함수 수정:

```typescript
import { calculatePoints } from '@/lib/utils/points'

export async function submitQuizResult(
  assignmentId: string,
  score: number,
  detail: { itemId: string; given: string; correct: boolean }[]
): Promise<{ earnedPoints: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { earnedPoints: 0 }

  await supabase.from('quiz_results').upsert(
    { student_id: user.id, assignment_id: assignmentId, score, answers: detail },
    { onConflict: 'student_id,assignment_id' }
  )

  const { data: assignment } = await supabase
    .from('quiz_assignments')
    .select('mode, difficulty')
    .eq('id', assignmentId)
    .single()

  const earnedPoints = calculatePoints(
    detail.length,
    assignment?.mode ?? 'flashcard',
    assignment?.difficulty ?? 'normal',
    score
  )

  if (earnedPoints > 0) {
    await supabase.rpc('add_points', { p_user_id: user.id, p_amount: earnedPoints })
  }

  return { earnedPoints }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/\(teacher\)/teacher/actions.ts
git commit -m "feat: calculate and award points on quiz submission"
```

---

## Task 12: Quiz Session 페이지 — multiple·element 모드 + wrongIds 추적

**Files:**
- Modify: `src/app/(student)/quiz/[assignmentId]/page.tsx`

- [ ] **Step 1: 전체 파일 교체**

```typescript
'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp } from '@/lib/constants/animation'
import FlashcardQuiz from '@/components/quiz/FlashcardQuiz'
import OxQuiz from '@/components/quiz/OxQuiz'
import BlankQuiz from '@/components/quiz/BlankQuiz'
import MultipleQuiz from '@/components/quiz/MultipleQuiz'
import ElementQuiz from '@/components/quiz/ElementQuiz'
import { submitQuizResult } from '@/app/(teacher)/teacher/actions'
import { buildMultipleItems } from '@/lib/utils/buildMultipleItems'
import { buildElementItems } from '@/lib/utils/buildElementItems'
import type { QuizSetItemResolved } from '@/lib/types'
import type { MultipleItem } from '@/lib/utils/buildMultipleItems'
import type { ElementQuestion } from '@/lib/utils/buildElementItems'

interface OxItem extends QuizSetItemResolved {
  isDecoy: boolean
  displayBack: string
}

interface Answer {
  itemId: string
  realItemId: string | null
  given: string
  correct: boolean
}

interface Assignment {
  id: string
  mode: string
  quiz_set_id: string
  difficulty: string
}

function buildOxItems(items: QuizSetItemResolved[]): OxItem[] {
  return items.map(item => {
    const isDecoy = Math.random() < 0.5 && items.length > 1
    let displayBack = item.back
    if (isDecoy) {
      const others = items.filter(i => i.id !== item.id)
      const other = others[Math.floor(Math.random() * others.length)]
      displayBack = other.back
    }
    return { ...item, isDecoy, displayBack }
  })
}

export default function QuizSessionPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params)
  const router = useRouter()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [items, setItems] = useState<QuizSetItemResolved[]>([])
  const [oxItems, setOxItems] = useState<OxItem[]>([])
  const [multipleItems, setMultipleItems] = useState<MultipleItem[]>([])
  const [elementItems, setElementItems] = useState<ElementQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: assign } = await supabase
        .from('quiz_assignments')
        .select('id, mode, quiz_set_id, difficulty')
        .eq('id', assignmentId)
        .single()

      if (!assign) { router.push('/quiz'); return }
      setAssignment(assign as Assignment)

      type RawSetItem = {
        id: string; quiz_set_id: string; item_id: string | null
        front_override: string | null; back_override: string | null
        items: { front: string; back: string; category_id: string; atomic_number: number | null; valence_electrons: number | null; element_group: string | null } | null
      }

      const { data: rawItems } = await supabase
        .from('quiz_set_items')
        .select('id, quiz_set_id, item_id, front_override, back_override, items(front, back, category_id, atomic_number, valence_electrons, element_group)')
        .eq('quiz_set_id', assign.quiz_set_id)

      const resolved: QuizSetItemResolved[] = ((rawItems ?? []) as unknown as RawSetItem[]).map(si => ({
        id: si.id,
        quiz_set_id: si.quiz_set_id,
        item_id: si.item_id,
        front: si.front_override ?? si.items?.front ?? '',
        back: si.back_override ?? si.items?.back ?? '',
        front_override: si.front_override,
        back_override: si.back_override,
        category_id: si.items?.category_id ?? null,
        atomic_number: si.items?.atomic_number ?? null,
        valence_electrons: si.items?.valence_electrons ?? null,
        element_group: si.items?.element_group ?? null,
      }))

      setItems(resolved)

      if (assign.mode === 'ox') {
        setOxItems(buildOxItems(resolved))
      } else if (assign.mode === 'multiple' || assign.mode === 'element') {
        const categoryIds = [...new Set(resolved.map(i => i.category_id).filter(Boolean))] as string[]
        if (categoryIds.length > 0) {
          const { data: pool } = await supabase
            .from('items')
            .select('id, category_id, front, back, atomic_number, valence_electrons, element_group')
            .in('category_id', categoryIds)
          if (assign.mode === 'multiple') {
            setMultipleItems(buildMultipleItems(resolved, pool ?? []))
          } else {
            setElementItems(buildElementItems(resolved, pool ?? []))
          }
        }
      }

      setLoading(false)
    }
    load()
  }, [assignmentId, router])

  function getTotalCount() {
    switch (assignment?.mode) {
      case 'ox':       return oxItems.length
      case 'multiple': return multipleItems.length
      case 'element':  return elementItems.length
      default:         return items.length
    }
  }

  function getRealItemId(idx: number): string | null {
    switch (assignment?.mode) {
      case 'ox':       return oxItems[idx]?.item_id ?? null
      case 'multiple': return multipleItems[idx]?.item.item_id ?? null
      case 'element':  return elementItems[idx]?.realItemId ?? null
      default:         return items[idx]?.item_id ?? null
    }
  }

  async function handleAnswer(itemId: string, given: string, correct: boolean) {
    const realItemId = getRealItemId(currentIndex)
    const newAnswers = [...answers, { itemId, given, correct, realItemId }]
    setAnswers(newAnswers)

    const totalItems = getTotalCount()
    const isLast = currentIndex >= totalItems - 1

    if (isLast) {
      setSubmitting(true)
      const correctCount = newAnswers.filter(a => a.correct).length
      const score = Math.round((correctCount / newAnswers.length) * 100)
      const detail = newAnswers.map(a => ({ itemId: a.itemId, given: a.given, correct: a.correct }))

      const result = await submitQuizResult(assignmentId, score, detail)
      const earnedPoints = result?.earnedPoints ?? 0

      const wrongIds = newAnswers
        .filter(a => !a.correct && a.realItemId)
        .map(a => a.realItemId)
        .join(',')

      router.push(
        `/quiz/${assignmentId}/result?score=${score}&total=${newAnswers.length}&correct=${correctCount}&earnedPoints=${earnedPoints}&wrongIds=${wrongIds}`
      )
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  function handleExit() {
    if (confirm('퀴즈를 종료하시겠습니까? 진행 상황이 저장되지 않습니다.')) {
      router.push('/quiz')
    }
  }

  if (loading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  const totalCount = getTotalCount()
  const progress = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0

  return (
    <div className="py-6 space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={handleExit} className="text-gray-400 text-sm hover:text-gray-600">✕ 종료</button>
        <span className="text-xs text-gray-400">{currentIndex + 1} / {totalCount}</span>
      </div>

      <div>
        <div className="flex items-center justify-end text-xs text-gray-400 mb-2">
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {submitting ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">결과 저장 중...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} variants={fadeInUp} initial="hidden" animate="visible">
            {assignment?.mode === 'flashcard' && items[currentIndex] && (
              <FlashcardQuiz item={items[currentIndex]} index={currentIndex} total={totalCount} onAnswer={handleAnswer} />
            )}
            {assignment?.mode === 'ox' && oxItems[currentIndex] && (
              <OxQuiz item={oxItems[currentIndex]} onAnswer={handleAnswer} />
            )}
            {assignment?.mode === 'blank' && items[currentIndex] && (
              <BlankQuiz item={items[currentIndex]} onAnswer={handleAnswer} />
            )}
            {assignment?.mode === 'multiple' && multipleItems[currentIndex] && (
              <MultipleQuiz
                item={multipleItems[currentIndex].item}
                choices={multipleItems[currentIndex].choices}
                correctAnswer={multipleItems[currentIndex].correctAnswer}
                onAnswer={handleAnswer}
              />
            )}
            {assignment?.mode === 'element' && elementItems[currentIndex] && (
              <ElementQuiz question={elementItems[currentIndex]} onAnswer={handleAnswer} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/\(student\)/quiz/\[assignmentId\]/page.tsx
git commit -m "feat: add multiple and element quiz modes to quiz session page"
```

---

## Task 13: 퀴즈 결과 페이지 — 포인트 + 틀린 문제 다시 풀기

**Files:**
- Modify: `src/app/(student)/quiz/[assignmentId]/result/page.tsx`

- [ ] **Step 1: 전체 파일 교체**

```typescript
'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp, scaleOnTap } from '@/lib/constants/animation'

function QuizResult() {
  const sp = useSearchParams()

  const score       = Number(sp.get('score') ?? 0)
  const total       = Number(sp.get('total') ?? 0)
  const correct     = Number(sp.get('correct') ?? 0)
  const earnedPoints = Number(sp.get('earnedPoints') ?? 0)
  const wrongIds    = sp.get('wrongIds') ?? ''

  const ringColor =
    score >= 80 ? '#4ECDC4' :
    score >= 50 ? '#6366F1' :
    '#FF6B6B'

  const message =
    score >= 80 ? '훌륭해요! 🎉' :
    score >= 50 ? '잘 했어요! 조금만 더!' :
    '다시 도전해보세요 💪'

  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference * (1 - score / 100)

  return (
    <div className="py-6">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {/* Score ring */}
        <motion.div variants={fadeInUp} className="flex flex-col items-center py-8">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#F3F4F6" strokeWidth="10" />
              <motion.circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{score}</span>
              <span className="text-xs text-gray-400">점</span>
            </div>
          </div>
          <p className="mt-4 text-xl font-bold text-gray-900">{message}</p>
          <p className="text-sm text-gray-500 mt-1">{total}문제 중 {correct}개 정답</p>
        </motion.div>

        {/* Points earned */}
        {earnedPoints > 0 && (
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4"
          >
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-xs text-amber-700 font-medium">포인트 획득!</p>
              <p className="text-xl font-bold text-amber-800">+{earnedPoints} pt</p>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-3">
          {[
            { label: '총 문제', value: total,           color: 'text-gray-900' },
            { label: '정답',   value: correct,          color: 'text-[#4ECDC4]' },
            { label: '오답',   value: total - correct,  color: 'text-[#FF6B6B]' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp} className="space-y-3">
          {wrongIds && total - correct > 0 && (
            <Link href={`/study/session?ids=${wrongIds}`}>
              <motion.div
                {...scaleOnTap}
                className="block w-full py-4 rounded-full bg-indigo-600 text-white font-semibold text-sm text-center"
              >
                틀린 문제 다시 풀기 ({total - correct}개)
              </motion.div>
            </Link>
          )}
          <Link href="/quiz">
            <motion.div
              {...scaleOnTap}
              className="block w-full py-4 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm text-center"
            >
              퀴즈 목록으로
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function QuizResultPage() {
  return (
    <Suspense fallback={<div className="py-6"><div className="h-36 w-36 mx-auto bg-gray-100 rounded-full animate-pulse" /></div>}>
      <QuizResult />
    </Suspense>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/\(student\)/quiz/\[assignmentId\]/result/page.tsx
git commit -m "feat: add earned points display and retry wrong answers to quiz result page"
```

---

## Task 14: 내 반 탭 — 반 내 랭킹

**Files:**
- Modify: `src/app/(student)/classes/page.tsx`

- [ ] **Step 1: ClassesPage 수정 — 랭킹 섹션 추가**

`classes/page.tsx`에서 `ClassInfo` 인터페이스와 데이터 페칭, 렌더링을 수정한다.

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import JoinClassModal from '@/components/student/JoinClassModal'
import { motion } from 'framer-motion'
import { scaleOnTap, staggerContainer, fadeInUp } from '@/lib/constants/animation'
import { PlusIcon } from '@heroicons/react/24/outline'

interface ClassInfo {
  class_id: string
  classes: { id: string; name: string; invite_code: string } | null
}

interface RankEntry {
  student_id: string
  name: string
  points: number
}

interface ClassRanking {
  classId: string
  entries: RankEntry[]
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [rankings, setRankings] = useState<ClassRanking[]>([])
  const [myId, setMyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  async function fetchClasses() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyId(user.id)

    const { data } = await supabase
      .from('class_members')
      .select('class_id, classes(id, name, invite_code)')
      .eq('student_id', user.id)
    const classData = (data as unknown as ClassInfo[]) ?? []
    setClasses(classData)

    // 각 반의 랭킹 로드
    const rankingResults = await Promise.all(
      classData.map(async ({ class_id }) => {
        const { data: members } = await supabase
          .from('class_members')
          .select('student_id, profiles(name, points)')
          .eq('class_id', class_id)

        type MemberRow = { student_id: string; profiles: { name: string; points: number } | null }
        const entries: RankEntry[] = ((members ?? []) as unknown as MemberRow[])
          .filter(m => m.profiles)
          .map(m => ({
            student_id: m.student_id,
            name: m.profiles!.name,
            points: m.profiles!.points,
          }))
          .sort((a, b) => b.points - a.points)

        return { classId: class_id, entries }
      })
    )
    setRankings(rankingResults)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchClasses() }, [])

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 반</h1>
          <p className="text-gray-500 text-sm mt-1">참여한 반 목록</p>
        </div>
        <motion.button
          {...scaleOnTap}
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          반 참여
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏫</p>
          <p className="text-gray-500 mb-2">아직 참여한 반이 없어요.</p>
          <motion.button {...scaleOnTap} onClick={() => setModalOpen(true)} className="text-indigo-600 font-medium">
            반 참여하기 →
          </motion.button>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          {classes.map(({ class_id, classes: cls }) => {
            const ranking = rankings.find(r => r.classId === class_id)
            return (
              <motion.div key={class_id} variants={fadeInUp} className="space-y-3">
                {/* 반 카드 */}
                <div className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{cls?.name}</p>
                  <span className="text-xs text-indigo-500 font-mono bg-indigo-50 px-2 py-1 rounded-lg">
                    {cls?.invite_code}
                  </span>
                </div>

                {/* 랭킹 */}
                {ranking && ranking.entries.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🏆 반 내 랭킹</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {ranking.entries.slice(0, 5).map((entry, idx) => (
                        <div
                          key={entry.student_id}
                          className={`flex items-center gap-3 px-4 py-3 ${entry.student_id === myId ? 'bg-indigo-50' : ''}`}
                        >
                          <span className={`w-6 text-center text-sm font-bold ${
                            idx === 0 ? 'text-yellow-500' :
                            idx === 1 ? 'text-gray-400' :
                            idx === 2 ? 'text-amber-600' :
                            'text-gray-400'
                          }`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                          </span>
                          <span className={`flex-1 text-sm ${entry.student_id === myId ? 'font-bold text-indigo-700' : 'text-gray-700'}`}>
                            {entry.name} {entry.student_id === myId && '(나)'}
                          </span>
                          <span className="text-sm font-semibold text-gray-500">{entry.points.toLocaleString()} pt</span>
                        </div>
                      ))}
                      {/* 내 순위가 5위 밖인 경우 */}
                      {(() => {
                        const myRank = ranking.entries.findIndex(e => e.student_id === myId)
                        if (myRank >= 5) {
                          return (
                            <>
                              <div className="px-4 py-1 text-center text-xs text-gray-400">···</div>
                              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50">
                                <span className="w-6 text-center text-sm font-bold text-gray-400">{myRank + 1}</span>
                                <span className="flex-1 text-sm font-bold text-indigo-700">{ranking.entries[myRank].name} (나)</span>
                                <span className="text-sm font-semibold text-gray-500">{ranking.entries[myRank].points.toLocaleString()} pt</span>
                              </div>
                            </>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <JoinClassModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onJoined={fetchClasses} />
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/app/\(student\)/classes/page.tsx
git commit -m "feat: add class ranking to classes page"
```

---

## Task 15: 전체 테스트 + 검증

- [ ] **Step 1: 전체 테스트 실행**

```bash
npx vitest run
```

Expected: 모든 테스트 통과. 기존 BottomNav 테스트 포함.

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit
```

Expected: 에러 없음.

- [ ] **Step 3: 개발 서버 End-to-End 검증**

```bash
pnpm dev
```

체크리스트:
1. `/teacher/assignments` → 새 배정 → 모드 드롭다운에 "4지선다", "원소 퀴즈" 확인
2. 4지선다 과제 생성 → 학생으로 `/quiz` → 과제 클릭 → 세로 리스트 선택지 4개 표시
3. 정답 클릭 → 초록 하이라이트 → 오답 클릭 → 빨강 + 정답 초록 확인
4. 퀴즈 완료 → 결과 화면에 "⭐ +N pt" 배너 표시
5. 오답 있으면 "틀린 문제 다시 풀기" 버튼 표시 → 클릭 시 `/study/session?ids=...` 이동
6. `/classes` → 반 내 랭킹 표시, 내 순위 인디고 하이라이트
7. `/study` → 학습 세션 → 카운터 3개(✓ ✗ —) 표시

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "chore: verify all learning improvements complete"
```
