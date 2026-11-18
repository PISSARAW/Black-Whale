import { mount } from 'svelte'
import('./LastContact.svelte')
  .then(({ default: LastContact }) => {
    Object.assign(window, {
      fightingShowcase: mount(LastContact, { target: document.getElementById('app')! }),
    })
  })
  .catch((error) => {
    Object.assign(window, { fightingShowcaseError: String(error) })
    console.error(error)
  })
