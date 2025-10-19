# Deploy - Carteira.isaacbatst.com.br

## 🚀 Configuração de Deploy

### Domínio
- **URL**: https://carteira.isaacbatst.com.br
- **Tipo**: PWA (Progressive Web App)
- **HTTPS**: Obrigatório para PWA

### 📋 Checklist de Deploy

#### 1. **Build do Projeto**
```bash
npm run build
```
- ✅ Gera arquivos otimizados na pasta `dist/`
- ✅ Inclui manifest PWA e service worker
- ✅ Ícones PWA em múltiplos tamanhos

#### 2. **Configuração do Servidor Web**

**Nginx (Recomendado)**:
```nginx
server {
    listen 443 ssl http2;
    server_name carteira.isaacbatst.com.br;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # PWA Root
    root /var/www/carteira/dist;
    index index.html;
    
    # PWA Headers
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000, immutable" for static assets;
    }
    
    # Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        add_header Service-Worker-Allowed "/";
    }
    
    # Manifest
    location /manifest.webmanifest {
        add_header Content-Type "application/manifest+json";
    }
}
```

#### 3. **Configuração DNS**
```
carteira.isaacbatst.com.br    A    [IP_DO_SERVIDOR]
```

#### 4. **SSL Certificate**
- Use Let's Encrypt ou certificado comercial
- PWA requer HTTPS obrigatoriamente

### 🔧 Arquivos de Deploy

Após o build, os seguintes arquivos devem ser servidos:

```
dist/
├── index.html              # Página principal
├── manifest.webmanifest    # Manifest PWA
├── sw.js                   # Service Worker
├── workbox-*.js           # Workbox runtime
├── assets/                # CSS e JS otimizados
├── pwa-192x192.png        # Ícone PWA
├── pwa-512x512.png        # Ícone PWA
├── apple-touch-icon.png   # Ícone iOS
└── masked-icon.svg        # Ícone SVG
```

### 📱 Teste PWA

1. **Acesse**: https://carteira.isaacbatst.com.br
2. **Chrome DevTools**:
   - F12 > Application > Manifest
   - Verifique se todas as configurações estão corretas
3. **Teste de Instalação**:
   - Desktop: Ícone de instalação na barra de endereços
   - Mobile: "Adicionar à tela inicial"

### 🎯 Configurações PWA

- **Nome**: Carteira - Controle Financeiro
- **Short Name**: Carteira
- **Theme Color**: #3B82F6 (Azul)
- **Background**: #ffffff (Branco)
- **Display**: standalone
- **Orientation**: portrait

### 🔄 Atualizações

O PWA está configurado para:
- ✅ Auto-update quando nova versão estiver disponível
- ✅ Cache inteligente para funcionamento offline
- ✅ Notificações de atualização no console

### 📊 Monitoramento

Após o deploy, monitore:
- Performance do PWA
- Taxa de instalação
- Funcionamento offline
- Atualizações automáticas
