import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { setupAnimatedFavicon } from './favicon'

setupAnimatedFavicon(450)

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

