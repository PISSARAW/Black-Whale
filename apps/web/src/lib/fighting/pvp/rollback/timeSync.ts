const FRAME_MS = 1000 / 60
const WINDOW = 40
/** At most one waited frame in this many, so a correction is never a visible freeze. */
const WAIT_SPACING = 10

/**
 * Keeps two clients on the same frame, after GGPO: each one estimates how many frames it runs
 * ahead of its peer; the one further ahead than the other waits a frame now and then. Without
 * it, the faster or closer machine keeps rolling the other back further.
 */
export class TimeSync {
  private rttMs: number | null = null
  private local: number[] = []
  private remoteAdvantage = 0
  private lastWait = -WAIT_SPACING

  /** Round trip from an echoed ping. */
  observePong(sentAt: number, now: number): void {
    const sample = Math.max(0, now - sentAt)
    this.rttMs = this.rttMs === null ? sample : this.rttMs * 0.875 + sample * 0.125
  }

  /** A frame message: the peer's frame when it sent, and its own advantage estimate. */
  observeRemote(options: { remoteFrame: number; remoteAdvantage: number; localFrame: number }) {
    const transit = (this.rttMs ?? 0) / 2 / FRAME_MS
    this.local.push(options.localFrame - (options.remoteFrame + transit))
    if (this.local.length > WINDOW) this.local.shift()
    this.remoteAdvantage = options.remoteAdvantage
  }

  /** Frames this client runs ahead of its peer, as sent in each frame message. */
  get advantage(): number {
    if (!this.local.length) return 0
    return this.local.reduce((sum, value) => sum + value, 0) / this.local.length
  }

  get roundTripMs(): number | null {
    return this.rttMs
  }

  /** Half the gap between both estimates: how far this side should fall back. */
  get skew(): number {
    return (this.advantage - this.remoteAdvantage) / 2
  }

  /** Whether to skip simulating on this wall-clock frame. */
  shouldWait(localFrame: number): boolean {
    if (this.skew < 1 || localFrame - this.lastWait < WAIT_SPACING) return false
    this.lastWait = localFrame
    return true
  }
}
