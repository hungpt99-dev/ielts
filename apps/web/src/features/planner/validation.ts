import { z } from 'zod'
import type { TaskCategory } from '../../models'

export interface TaskFormData {
  title: string
  description: string
  category: TaskCategory
  date: string
  timeMinutes: number
  notes: string
}

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(500, 'Description is too long'),
  category: z.enum([
    'Vocabulary', 'Reading', 'Listening',
    'Writing Task 1', 'Writing Task 2',
    'Speaking Part 1', 'Speaking Part 2', 'Speaking Part 3',
    'Grammar', 'Mock Test',
  ]),
  date: z.string().min(1, 'Date is required'),
  timeMinutes: z.coerce.number().int().min(0).max(480),
  notes: z.string().max(2000, 'Notes are too long'),
})

export interface ScheduleConfigData {
  targetBand: number
  dailyMinutes: number
  examDate: string
}

export const scheduleConfigSchema = z.object({
  targetBand: z.coerce.number().min(1, 'Minimum band is 1').max(9, 'Maximum band is 9'),
  dailyMinutes: z.coerce.number().min(15, 'Minimum 15 minutes').max(480, 'Maximum 480 minutes'),
  examDate: z.string(),
})
