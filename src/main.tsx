import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AnimationShowcase } from './components/AnimationShowcase.tsx'
import { AccentGlow } from './components/AccentGlow.tsx'
import { GrainOverlay } from './components/GrainOverlay.tsx'

// PWA Service Worker Registration
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onNeedRefresh() {
    // Mostrar notificação de atualização disponível
    console.log('🔄 Nova versão disponível! Recarregue a página para atualizar.')
  },
  onOfflineReady() {
    // App está pronto para funcionar offline
    console.log('📱 App pronto para uso offline!')
  },
})

const isShowcase = new URLSearchParams(window.location.search).has('showcase')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isShowcase ? (
      <div className="min-h-dvh bg-background text-foreground">
        <AnimationShowcase />
        <AccentGlow />
        <GrainOverlay />
      </div>
    ) : (
      <App />
    )}
  </StrictMode>,
)
