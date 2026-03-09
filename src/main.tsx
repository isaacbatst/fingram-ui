import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const DesignConceptsV2 = lazy(() => import('./design-concepts-v2.tsx'))

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

function Root() {
  const path = window.location.pathname

  if (path === '/design-v2') {
    return (
      <Suspense fallback={null}>
        <DesignConceptsV2 />
      </Suspense>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
