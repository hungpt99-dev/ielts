import type { WritingTaskType } from '../../../models'

export interface WritingPrompt {
  id: string
  taskType: WritingTaskType
  question: string
  topic: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export const SAMPLE_PROMPTS: WritingPrompt[] = [
  {
    id: 'w-task1-1',
    taskType: 'task1',
    topic: 'Education',
    difficulty: 'medium',
    description: 'Bar chart - university enrollment by gender',
    question: `The chart below shows the number of male and female students enrolled in different faculties at a Canadian university in 2010 and 2020.

Summarize the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
  },
  {
    id: 'w-task1-2',
    taskType: 'task1',
    topic: 'Environment',
    difficulty: 'medium',
    description: 'Line graph - CO2 emissions over time',
    question: `The graph below shows the amount of carbon dioxide emissions per person in three countries from 2000 to 2020.

Summarize the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
  },
  {
    id: 'w-task1-3',
    taskType: 'task1',
    topic: 'Work',
    difficulty: 'easy',
    description: 'Pie chart - employment sectors',
    question: `The pie charts below show the percentage of people employed in different sectors in Country A in 2000 and 2020.

Summarize the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
  },
  {
    id: 'w-task1-4',
    taskType: 'task1',
    topic: 'Technology',
    difficulty: 'hard',
    description: 'Table - internet usage statistics',
    question: `The table below shows the percentage of households with internet access in five countries between 2010 and 2020.

Summarize the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
  },
  {
    id: 'w-task1-5',
    taskType: 'task1',
    topic: 'Health',
    difficulty: 'easy',
    description: 'Bar chart - exercise frequency by age group',
    question: `The bar chart below shows how often people in different age groups exercise per week in the UK.

Summarize the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
  },
  {
    id: 'w-task1-6',
    taskType: 'task1',
    topic: 'Travel',
    difficulty: 'medium',
    description: 'Map comparison - town development',
    question: `The maps below show the development of a seaside town between 2000 and 2020.

Summarize the information by selecting and reporting the main features, and make comparisons where relevant.

Write at least 150 words.`,
  },
  {
    id: 'w-task2-1',
    taskType: 'task2',
    topic: 'Education',
    difficulty: 'medium',
    description: 'Opinion essay - university vs practical skills',
    question: `Some people believe that the primary purpose of education is to prepare individuals for the workforce. Others argue that education should be about personal development and acquiring knowledge for its own sake.

Discuss both these views and give your own opinion.

Write at least 250 words.`,
  },
  {
    id: 'w-task2-2',
    taskType: 'task2',
    topic: 'Technology',
    difficulty: 'medium',
    description: 'Discussion essay - technology and social interaction',
    question: `In recent years, technology has changed the way people interact with each other. While some argue that this has had a positive effect on social relationships, others believe it has caused people to become more isolated.

Discuss both these views and give your own opinion.

Write at least 250 words.`,
  },
  {
    id: 'w-task2-3',
    taskType: 'task2',
    topic: 'Environment',
    difficulty: 'hard',
    description: 'Problem-solution essay - environmental issues',
    question: `The environmental problems facing the world today are becoming increasingly severe. Some people believe that individuals are responsible for solving these problems, while others argue that only governments and large organizations can make a meaningful difference.

Discuss both these views and give your opinion.

Write at least 250 words.`,
  },
  {
    id: 'w-task2-4',
    taskType: 'task2',
    topic: 'Health',
    difficulty: 'easy',
    description: 'Opinion essay - healthy lifestyle',
    question: `In many countries, people are living longer than ever before. Some think this is a positive development, while others believe it creates problems for society.

Discuss both sides and give your own opinion.

Write at least 250 words.`,
  },
  {
    id: 'w-task2-5',
    taskType: 'task2',
    topic: 'Society',
    difficulty: 'medium',
    description: 'Advantages-disadvantages essay - work-life balance',
    question: `More and more people are working remotely from home instead of commuting to an office.

What are the advantages and disadvantages of this trend?

Give reasons for your answer and include any relevant examples from your own knowledge or experience.

Write at least 250 words.`,
  },
  {
    id: 'w-task2-6',
    taskType: 'task2',
    topic: 'Crime',
    difficulty: 'hard',
    description: 'Agree-disagree essay - crime and technology',
    question: `Some people believe that technological advancements have led to an increase in crime, while others argue that technology can be used effectively to reduce crime rates.

To what extent do you agree or disagree with these statements?

Give reasons for your answer and include any relevant examples.

Write at least 250 words.`,
  },
  {
    id: 'w-task2-7',
    taskType: 'task2',
    topic: 'Globalization',
    difficulty: 'medium',
    description: 'Two-part question - global culture',
    question: `In many countries, the influence of Western culture is growing, and some people feel that local cultures are being lost as a result.

Why is this happening? What can be done to preserve local cultures?

Give reasons for your answer and include any relevant examples.

Write at least 250 words.`,
  },
  {
    id: 'w-task2-8',
    taskType: 'task2',
    topic: 'Government',
    difficulty: 'hard',
    description: 'Opinion essay - government spending',
    question: `Some people think that governments should spend more money on public services such as healthcare and education, rather than on the arts.

To what extent do you agree or disagree?

Give reasons for your answer and include any relevant examples.

Write at least 250 words.`,
  },
]
