import { z } from 'zod'

export const courseStatusSchema = z.enum(['active', 'unavailable', 'practice_exam'])

export const practiceExamSchema = z.object({
  name: z.string(),
  questions: z.number().int().nullable(),
})

export const courseSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  status: courseStatusSchema,
  category: z.string(),
  progress: z.number().min(0).max(100),
  sections: z.number().int().nullable(),
  lectures: z.number().int().nullable(),
  durationMinutes: z.number().int().nullable(),
  students: z.number().int().nullable(),
  instructors: z.array(z.string()),
  technologies: z.array(z.string()),
  learningObjectives: z.array(z.string()),
  practiceExams: z.array(practiceExamSchema),
  totalQuestions: z.number().int().nullable(),
  unavailableReason: z.string().nullable(),
  hasCurriculum: z.boolean(),
})

export const datasetSchema = z.object({
  generatedAt: z.string(),
  source: z.string(),
  stats: z.object({
    totalCourses: z.number().int(),
    activeCourses: z.number().int(),
    completedCourses: z.number().int(),
    inProgressCourses: z.number().int(),
    notStartedCourses: z.number().int(),
    totalMinutes: z.number().int(),
    watchedMinutes: z.number().int(),
    remainingMinutes: z.number().int(),
    categories: z.array(z.string()),
    technologies: z.array(z.string()),
  }),
  courses: z.array(courseSchema),
})

export const lectureSchema = z.object({
  title: z.string(),
  durationSeconds: z.number().int().nullable(),
  freePreview: z.boolean(),
})

export const sectionSchema = z.object({
  title: z.string(),
  lectureCount: z.number().int().nullable(),
  durationMinutes: z.number().int().nullable(),
  lectures: z.array(lectureSchema),
})

export const curriculumSchema = z.record(z.string(), z.array(sectionSchema))

export type Course = z.infer<typeof courseSchema>
export type CourseStatus = z.infer<typeof courseStatusSchema>
export type Dataset = z.infer<typeof datasetSchema>
export type Section = z.infer<typeof sectionSchema>
export type Curriculum = z.infer<typeof curriculumSchema>
