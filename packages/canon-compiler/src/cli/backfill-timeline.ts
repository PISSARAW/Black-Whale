import { loadCatalogue } from '../catalogue.js'
import { compileTimeline } from '../timeline/run.js'
import { run } from './run.js'

run((prisma) => compileTimeline({ prisma, events: loadCatalogue().events }))
