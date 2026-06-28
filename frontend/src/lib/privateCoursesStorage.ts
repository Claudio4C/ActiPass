import type { BookedPrivateCourse } from '../types/marketplace'

const STORAGE_KEY = 'actipass_private_courses'

export const getBookedPrivateCourses = (): BookedPrivateCourse[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BookedPrivateCourse[]
    return Array.isArray(parsed) ? parsed.filter(c => c.status === 'confirmed') : []
  } catch {
    return []
  }
}

export const bookPrivateCourse = (
  input: Omit<BookedPrivateCourse, 'id' | 'bookedAt' | 'status'>,
): BookedPrivateCourse => {
  const course: BookedPrivateCourse = {
    ...input,
    id: `pc-${Date.now()}`,
    status: 'confirmed',
    bookedAt: new Date().toISOString(),
  }
  const existing = getBookedPrivateCourses()
  localStorage.setItem(STORAGE_KEY, JSON.stringify([course, ...existing]))
  dispatchPrivateCoursesUpdated()
  return course
}

export const removeBookedSlot = (slotId: string, listingId: string): void => {
  const key = 'actipass_marketplace_slots_removed'
  const removed = JSON.parse(localStorage.getItem(key) ?? '[]') as string[]
  if (!removed.includes(slotId)) {
    localStorage.setItem(key, JSON.stringify([...removed, `${listingId}:${slotId}`]))
  }
}

export const isSlotBooked = (listingId: string, slotId: string): boolean => {
  const key = 'actipass_marketplace_slots_removed'
  const removed = JSON.parse(localStorage.getItem(key) ?? '[]') as string[]
  return removed.includes(`${listingId}:${slotId}`)
}

export const dispatchPrivateCoursesUpdated = (): void => {
  window.dispatchEvent(new Event('private-courses:updated'))
}
