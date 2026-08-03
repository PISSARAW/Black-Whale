import { PrismaClient } from '@prisma/client'
import { loadCatalogue } from '../catalogue.js'
import { compileMap } from '../map/run.js'
import { run } from './run.js'

run(async (prisma: PrismaClient) => {
  const catalogue = loadCatalogue()
  return compileMap({
    prisma,
    catalogue: { characters: catalogue.characters, locations: catalogue.locations },
    report: (message) => console.warn(message),
  })
})
