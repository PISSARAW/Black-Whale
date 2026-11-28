import { mount } from 'svelte'
import Edit from './Edit.svelte'
Object.assign(window, { comboEdit: mount(Edit, { target: document.getElementById('app')! }) })
