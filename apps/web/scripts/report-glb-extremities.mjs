import { readFile } from 'node:fs/promises'
import path from 'node:path'

const JSON_CHUNK = 0x4e4f534a
const files = process.argv.slice(2)
if (!files.length) throw new Error('Usage: node report-glb-extremities.mjs model.glb [...]')

const reports = []
for (const file of files) reports.push(await inspectGlb(file))
process.stdout.write(`${JSON.stringify(reports, null, 2)}\n`)

async function inspectGlb(file) {
  const buffer = await readFile(file)
  const json = glbJson(buffer)
  const primitives = (json.meshes ?? []).flatMap((mesh, meshIndex) =>
    (mesh.primitives ?? []).map((primitive, primitiveIndex) =>
      primitiveReport(json, { mesh, meshIndex, primitive, primitiveIndex }),
    ),
  )
  const candidates = extremityCandidates(json)
  return {
    file: path.basename(file),
    bytes: buffer.byteLength,
    meshes: json.meshes?.length ?? 0,
    primitives: primitives.length,
    vertices: sum(primitives, 'vertices'),
    triangles: sum(primitives, 'triangles'),
    materials: json.materials?.length ?? 0,
    skins: (json.skins ?? []).map((skin) => ({ joints: skin.joints?.length ?? 0 })),
    animations: json.animations?.length ?? 0,
    extremityCandidates: candidates,
  }
}

function glbJson(buffer) {
  if (buffer.toString('utf8', 0, 4) !== 'glTF') throw new Error('Not a binary glTF file')
  let offset = 12
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset)
    const type = buffer.readUInt32LE(offset + 4)
    if (type === JSON_CHUNK) {
      const text = buffer.toString('utf8', offset + 8, offset + 8 + length).replace(/\0+$/u, '')
      return JSON.parse(text)
    }
    offset += 8 + length
  }
  throw new Error('GLB JSON chunk not found')
}

function primitiveReport(json, options) {
  const { mesh, meshIndex, primitive, primitiveIndex } = options
  const position = json.accessors?.[primitive.attributes?.POSITION]
  const indices = json.accessors?.[primitive.indices]
  const vertices = position?.count ?? 0
  return {
    mesh: mesh.name ?? `mesh-${meshIndex}`,
    primitive: primitiveIndex,
    vertices,
    triangles: indices ? Math.floor(indices.count / 3) : Math.floor(vertices / 3),
  }
}

function extremityCandidates(json) {
  const pattern = /(hand|wrist|finger|thumb|foot|ankle|toe|heel)/iu
  return (json.nodes ?? [])
    .map((node, index) => ({ index, name: node.name ?? '', mesh: node.mesh }))
    .filter((node) => pattern.test(node.name))
}

function sum(items, field) {
  return items.reduce((total, item) => total + item[field], 0)
}
