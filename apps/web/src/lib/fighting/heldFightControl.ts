/** One owner per held button; cancellation never commits a charged Hatsu. */
export function createHeldFightControl(options: {
  hold: (active: boolean) => void
  commit?: () => void
}) {
  let owner: string | null = null
  return {
    press(token: string) {
      if (owner !== null) return false
      owner = token
      options.hold(true)
      return true
    },
    release(token: string) {
      if (owner !== token) return
      owner = null
      options.commit?.()
      options.hold(false)
    },
    cancel() {
      if (owner === null) return
      owner = null
      options.hold(false)
    },
  }
}
