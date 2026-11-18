import { mount } from 'svelte'
import '../../src/app.css'
import Showcase from './Showcase.svelte'
Object.assign(window, { nenFilm: mount(Showcase, { target: document.getElementById('app')! }) })
