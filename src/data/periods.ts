import cambrian from '../../data/cambrian.json'
import carboniferous from '../../data/carboniferous.json'
import permian from '../../data/permian.json'
import type { PeriodData } from './types'

export const periods: PeriodData[] = [
  cambrian as PeriodData,
  carboniferous as PeriodData,
  permian as PeriodData,
]