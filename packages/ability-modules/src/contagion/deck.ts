export type AnswerCard = 'yes' | 'no' | 'back' | 'joker' | 'x'

export type QuestionCard = 'goal' | 'power' | 'if-yes' | 'if-no' | 'contract' | 'origin' | 'price'

export const ANSWER_CARDS: readonly AnswerCard[] = ['yes', 'no', 'back', 'joker', 'x']

export const QUESTION_CARDS: readonly QuestionCard[] = [
  'goal',
  'power',
  'if-yes',
  'if-no',
  'contract',
  'origin',
  'price',
]

/** The three cards that are not Yes and are not No. */
export const WIDER_VOCABULARY: readonly AnswerCard[] = ['back', 'joker', 'x']
