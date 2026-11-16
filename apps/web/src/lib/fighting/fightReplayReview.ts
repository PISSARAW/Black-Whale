export interface ReplayReviewActions {
  seek: (packet: number) => void
  takeover: () => void
  repeat: () => void
  returnToReplay: () => void
}
