import { z } from 'zod'

/**
 * The two identifier forms every file in `data/` is built out of.
 *
 * They lived in `schemas.ts` until `appearance.ts` needed them too. Moving them
 * down here rather than importing them upward is what keeps the module graph a
 * tree: `appearance.ts` declares a catalogue file, so `schemas.ts` has to
 * import *it* in order to register the file — and a schema that also imported
 * back out of `schemas.ts` would be a cycle whose failure mode is a zod schema
 * that is `undefined` at the moment it is used, depending on which module the
 * process happened to load first.
 *
 * `schemas.ts` re-exports both, so nothing downstream had to change.
 */

/** Kebab-case, the one identifier form `data/CONVENTIONS.md` allows. */
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a kebab-case slug')

/**
 * A chapter reference: `ch-<number>`, optionally pinned to one event of that
 * chapter with `ch-<number>.<sequence>`.
 *
 * The dotted form is finer than a chapter and the map needs it — a chapter
 * holds several events and a victim rarely falls in the first one. `ch-unknown`
 * is the explicit "no chapter names this", and it is spelled out rather than
 * left to `null` so the difference between undated and never-dated survives.
 */
export const chapterRef = z
  .string()
  .regex(
    /^ch-(?:unknown|\d+(?:\.\d+)?)$/,
    'must be ch-<number>, ch-<number>.<sequence> or ch-unknown',
  )
