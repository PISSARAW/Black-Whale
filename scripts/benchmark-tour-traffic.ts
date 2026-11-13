import { performance } from 'node:perf_hooks'

import { theShip } from '../apps/web/src/lib/tour/blueprint'
import { buildTierMesh } from '../apps/web/src/lib/tour/mesh'
import {
  clearTrafficCache,
  trafficAttribute,
  trafficCacheStats,
} from '../apps/web/src/lib/tour/surfaceCondition'

const plan = theShip().plans.get('tier-5')!
const meshes = Array.from({ length: 6 }, () => buildTierMesh(plan))

clearTrafficCache()
const coldStart = performance.now()
trafficAttribute(meshes[0], plan)
const coldMs = performance.now() - coldStart

const warmStart = performance.now()
for (const mesh of meshes.slice(1)) trafficAttribute(mesh, plan)
const warmMs = (performance.now() - warmStart) / (meshes.length - 1)

const result = { deck: plan.tier.id, coldMs, warmMs, ...trafficCacheStats() }
process.stdout.write(`${JSON.stringify(result)}\n`)

if (result.hits !== meshes.length - 1 || result.misses !== 1) process.exitCode = 1
