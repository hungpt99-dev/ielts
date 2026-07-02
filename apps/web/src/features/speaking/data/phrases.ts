export interface SpeakingPhrase {
  category: string
  phrases: string[]
}

export const COMMON_PHRASES: SpeakingPhrase[] = [
  {
    category: 'Giving Your Opinion',
    phrases: [
      'In my opinion, ...',
      'From my perspective, ...',
      'As far as I\'m concerned, ...',
      'It seems to me that ...',
      'I would say that ...',
      'Personally, I believe that ...',
      'The way I see it, ...',
      'I firmly believe that ...',
      'I am convinced that ...',
      'My view on this is that ...',
    ],
  },
  {
    category: 'Agreeing',
    phrases: [
      'I completely agree.',
      'That\'s exactly what I think.',
      'You\'re absolutely right.',
      'I couldn\'t agree more.',
      'That\'s a good point.',
      'I\'m of the same opinion.',
      'Exactly.',
      'I think so too.',
    ],
  },
  {
    category: 'Disagreeing Politely',
    phrases: [
      'I see your point, but ...',
      'I\'m not sure I agree with you there.',
      'I respect your opinion, however ...',
      'That\'s one way of looking at it, but ...',
      'I tend to disagree because ...',
      'While I understand your view, I think ...',
      'I\'m afraid I see things differently.',
    ],
  },
  {
    category: 'Giving Examples',
    phrases: [
      'For example, ...',
      'For instance, ...',
      'A good example of this is ...',
      'Such as ...',
      'To illustrate this point, ...',
      'This can be seen in ...',
      'Let me give you an example.',
    ],
  },
  {
    category: 'Adding Ideas',
    phrases: [
      'Furthermore, ...',
      'Moreover, ...',
      'In addition to that, ...',
      'Not only that, but ...',
      'Another point is that ...',
      'On top of that, ...',
      'Besides that, ...',
      'What is more, ...',
    ],
  },
  {
    category: 'Contrasting Ideas',
    phrases: [
      'However, ...',
      'On the other hand, ...',
      'Nevertheless, ...',
      'Although ...',
      'In contrast, ...',
      'Despite this, ...',
      'Having said that, ...',
      'While it is true that ...',
    ],
  },
  {
    category: 'Expressing Cause & Effect',
    phrases: [
      'As a result, ...',
      'Consequently, ...',
      'Therefore, ...',
      'This leads to ...',
      'One of the main causes is ...',
      'This results in ...',
      'Due to ...',
      'Because of this, ...',
    ],
  },
  {
    category: 'Buying Time / Thinking',
    phrases: [
      'That\'s an interesting question.',
      'Let me think about that for a moment.',
      'Well, that depends on the situation.',
      'I\'ve never really thought about that before.',
      'How can I put this?',
      'Let me see ...',
      'That\'s a good question.',
    ],
  },
  {
    category: 'Part 2 Opening',
    phrases: [
      'I\'d like to talk about ...',
      'The person/place/thing I want to describe is ...',
      'I\'ve chosen to talk about ...',
      'When it comes to ..., I\'d say ...',
      'If I had to talk about ..., I would choose ...',
    ],
  },
  {
    category: 'Describing Trends',
    phrases: [
      'There has been a significant increase in ...',
      'The number of ... has risen dramatically.',
      'This has led to a steady decline in ...',
      'We have seen a sharp rise in ...',
      'There has been a gradual decrease over the years.',
      'The trend shows a steady upward trajectory.',
    ],
  },
  {
    category: 'Making Suggestions',
    phrases: [
      'One possible solution is to ...',
      'The government should consider ...',
      'I would recommend that ...',
      'A good way to address this would be ...',
      'It would be beneficial to ...',
      'Steps should be taken to ...',
    ],
  },
  {
    category: 'Concluding / Summarizing',
    phrases: [
      'In conclusion, ...',
      'To sum up, ...',
      'Overall, I believe that ...',
      'Taking everything into account, ...',
      'All things considered, ...',
      'To summarize the main points, ...',
    ],
  },
]
