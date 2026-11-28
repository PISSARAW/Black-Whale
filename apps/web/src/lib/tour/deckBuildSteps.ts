/** Drain the same work synchronously for immediate jumps and non-interactive callers. */
export function finishDeckSteps<Result>(steps: Generator<void, Result>): Result {
  for (;;) {
    const step = steps.next()
    if (step.done) return step.value
  }
}
