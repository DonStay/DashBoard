import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type NotesState = {
  notes: Record<string, string>
  setNote: (courseId: string, note: string) => void
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: {},
      setNote: (courseId, note) =>
        set((state) => {
          const notes = { ...state.notes }
          if (note.trim() === '') delete notes[courseId]
          else notes[courseId] = note
          return { notes }
        }),
    }),
    { name: 'udemy-analytics-notes' },
  ),
)
