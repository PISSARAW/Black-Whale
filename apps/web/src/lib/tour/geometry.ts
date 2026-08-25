/**
 * The tour's planar geometry, one façade over four files.
 *
 * `geometry-math` holds the pure polygon maths, `geometry-doors` the openings
 * two neighbouring rooms cut into their shared wall, `geometry-features` the
 * things a room's floor and ceiling are built from (columns, grilles, plates,
 * lamps), and `geometry-movement` how standing things drift. Consumers import
 * from here; only these four files care where a function actually lives.
 */
export * from './geometry-math'
export * from './geometry-doors'
export * from './geometry-features'
export * from './geometry-movement'
