/**
 * Black Whale Worker
 *
 * Handles asynchronous calculations:
 * - World state snapshot generation
 * - Perspective cache warming
 * - Simulation branch processing
 */

console.log('[worker] Black Whale worker starting...')

// TODO: initialize job queues (Bull/BullMQ)
// TODO: register processors

process.on('SIGTERM', () => {
  console.log('[worker] Shutting down gracefully...')
  process.exit(0)
})
