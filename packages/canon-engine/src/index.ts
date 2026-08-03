/**
 * The canon engine: one package for the six that used to be six.
 *
 * `world`, `timeline`, `identity`, `knowledge`, `perspective` and `spoiler`
 * were separate packages of 76 to 854 lines each — five package manifests,
 * five tsconfigs, five build steps and a divergent test runner, protecting
 * boundaries nothing was crossing. Three of `spoiler`'s four exports were
 * called only by its own test. ADR-001 §2.4 judged that the frontier cost more
 * than it protected, and chantier 6 collects them.
 *
 * The boundaries themselves are kept, as directories: `world/` still owns the
 * reducer and the event stream, `timeline/` the queries against Prisma,
 * `spoiler/` the cap. What is gone is the packaging around them, not the
 * separation — a module that wants only the reducer imports `./world/reducer`
 * exactly as it did before, and every test came along unchanged.
 *
 * The six export ninety-one names between them and not one collides, which is
 * what makes a flat re-export honest here rather than a merge that hides
 * something.
 */
export * from './world/index.js'
export * from './timeline/index.js'
export * from './identity/index.js'
export * from './knowledge/index.js'
export * from './perspective/index.js'
export * from './spoiler/index.js'
