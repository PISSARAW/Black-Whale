import { Fullscreen } from './fullscreen.svelte'
import { viewpointUrl } from './pageNavigation'

export class TourChromeState {
  reveal = $state(false)
  copied = $state<'idle' | 'done' | 'failed'>('idle')
  planOpen = $state(false)
  planDialog = $state<HTMLDialogElement | null>(null)
  findOpen = $state(false)
  panelOpen = $state(true)
  calm = $state(false)

  private readonly screen = new Fullscreen()
  private copyTimer: ReturnType<typeof setTimeout> | null = null
  immersive = $derived(this.screen.immersive)

  get nativeFullscreen(): boolean {
    return this.screen.native
  }

  watch(): void {
    $effect(() => this.screen.watch())
    $effect(() => {
      if (!this.planDialog) return
      if (this.planOpen && !this.planDialog.open) this.planDialog.showModal()
      else if (!this.planOpen && this.planDialog.open) this.planDialog.close()
    })
  }

  toggleFullscreen(): void {
    void this.screen.toggle()
  }

  async copyViewpoint(options: {
    current: URL
    spaceId: string | null
    tierId: string
  }): Promise<void> {
    const url = viewpointUrl(options)
    try {
      await navigator.clipboard.writeText(url.toString())
      this.copied = 'done'
    } catch {
      this.copied = 'failed'
    }
    if (this.copyTimer) clearTimeout(this.copyTimer)
    this.copyTimer = setTimeout(() => (this.copied = 'idle'), 2500)
  }

  dispose(): void {
    if (this.copyTimer) clearTimeout(this.copyTimer)
    this.screen.leave()
  }
}
