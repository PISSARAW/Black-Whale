import { mount } from 'svelte'
import PursuitReview from './PursuitReview.svelte'

const target = document.querySelector('#app')!
if (new URLSearchParams(location.search).has('montage'))
  void import('./PursuitMontage.svelte').then(({ default: Montage }) => mount(Montage, { target }))
else mount(PursuitReview, { target })
