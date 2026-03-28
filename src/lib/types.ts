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
