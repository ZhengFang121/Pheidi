import { equipmentArticles } from './equipment.js'
import { eventArticles } from './events.js'
import { learningArticles } from './learning.js'
import { nutritionArticles } from './nutrition.js'

export const academyArticles = [
  ...learningArticles,
  ...equipmentArticles,
  ...nutritionArticles,
  ...eventArticles,
]
