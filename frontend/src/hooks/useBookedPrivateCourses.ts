import { useCallback, useEffect, useState } from 'react'
import { getBookedPrivateCourses } from '../lib/privateCoursesStorage'
import type { BookedPrivateCourse } from '../types/marketplace'

export const useBookedPrivateCourses = () => {
  const [courses, setCourses] = useState<BookedPrivateCourse[]>(() => getBookedPrivateCourses())

  const refresh = useCallback(() => {
    setCourses(getBookedPrivateCourses())
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('private-courses:updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('private-courses:updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [refresh])

  return { courses, refresh }
}
