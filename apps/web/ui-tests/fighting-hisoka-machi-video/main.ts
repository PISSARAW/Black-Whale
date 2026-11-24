import { mount } from 'svelte'
import '../../src/app.css'
import Fixture from './Fixture.svelte'
import TikTok from './TikTok.svelte'

Object.assign(window, {
  hisokaMachiVideo: mount(location.search === '?tiktok' ? TikTok : Fixture, {
    target: document.getElementById('app')!,
  }),
})
