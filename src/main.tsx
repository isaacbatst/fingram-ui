import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
