/** The WebGL renderer owns the canvas; its Svelte action owns the host. */
export function attachArchiveCanvas(host: HTMLElement, canvas: HTMLCanvasElement): void {
  host.appendChild(canvas)
}
