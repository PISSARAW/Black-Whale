import type { PaperKit } from './kallutoMaterials'

/** Gallery Fake copies physical contents with new identities and the replica's own lifetime. */
export function copyPaperKit(kit: PaperKit, id: string): PaperKit {
  return {
    ...kit,
    sourceId: id,
    copyId: id,
    serial: 0,
    integrity: 40,
    confetti: kit.confetti?.map((entry, index) => ({
      ...entry,
      id: `${id}:stored-confetti:${index}`,
      material: 'nen',
      paperScatter: {
        ...entry.paperScatter!,
        paperId: `${id}:stored-paper:${index}`,
        materialCopyId: id,
        controlled: false,
        hidden: false,
        burst: undefined,
        flight: undefined,
        vacuum: undefined,
      },
    })),
  }
}
