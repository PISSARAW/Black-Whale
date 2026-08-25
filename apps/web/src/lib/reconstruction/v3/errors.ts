/**
 * An error caused by the scenario the client submitted, safe to echo back.
 *
 * Anything else that escapes a run — Prisma failures, TypeErrors — must stay
 * server-side: its message can name internals the public endpoint should not
 * disclose.
 */
export class ScenarioInputError extends Error {}
