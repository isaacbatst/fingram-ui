# PWA Configuration - Carteira

## ✅ PWA Setup Complete

O Carteira agora está configurado como uma Progressive Web App (PWA) para o domínio **carteira.isaacbatst.com.br** com as seguintes funcionalidades:

### 🚀 Funcionalidades PWA

- **Instalável**: Pode ser instalado como app nativo no dispositivo
- **Offline Ready**: Funciona offline com cache inteligente
- **Auto Update**: Atualizações automáticas quando disponíveis
- **Responsive**: Interface adaptada para mobile e desktop
- **Fast Loading**: Cache otimizado para carregamento rápido

### 📱 Como Instalar

1. **Desktop (Chrome/Edge)**:
   - Acesse o app no navegador
   - Clique no ícone de instalação na barra de endereços
   - Ou vá em Menu > Instalar Fingram

2. **Mobile (Android)**:
   - Acesse carteira.isaacbatst.com.br no Chrome
   - Toque em "Adicionar à tela inicial"
   - Ou vá em Menu > Instalar app

3. **Mobile (iOS)**:
   - Acesse carteira.isaacbatst.com.br no Safari
   - Toque no botão de compartilhar
   - Selecione "Adicionar à Tela de Início"

### 🔧 Arquivos PWA Gerados

- `manifest.webmanifest` - Configuração do app
- `sw.js` - Service Worker para cache offline
- `pwa-192x192.png` - Ícone 192x192
- `pwa-512x512.png` - Ícone 512x512
- `apple-touch-icon.png` - Ícone para iOS
- `masked-icon.svg` - Ícone SVG

### 🛠️ Comandos Úteis

```bash
# Gerar ícones PWA
npm run generate-icons

# Build com PWA
npm run build

# Preview do build
npm run preview
```

### 📋 Configurações

- **Nome**: Carteira - Controle Financeiro
- **Short Name**: Carteira
- **Domain**: carteira.isaacbatst.com.br
- **Theme Color**: #3B82F6 (Azul)
- **Background Color**: #ffffff
- **Display**: standalone
- **Orientation**: portrait

### 🔄 Service Worker

O Service Worker está configurado para:
- Cache automático de recursos estáticos
- Cache de API com estratégia NetworkFirst
- Atualizações automáticas
- Funcionamento offline

### 🌐 Deploy

Para deploy em produção no domínio **carteira.isaacbatst.com.br**:
1. Certifique-se de usar HTTPS (obrigatório para PWA)
2. Execute `npm run build`
3. Sirva os arquivos da pasta `dist/` no subdomínio carteira.isaacbatst.com.br
4. O PWA funcionará automaticamente
5. Configure o DNS para apontar carteira.isaacbatst.com.br para o servidor

### 📊 Teste PWA

Use o Chrome DevTools:
1. Abra DevTools (F12)
2. Vá em Application > Manifest
3. Verifique se todas as configurações estão corretas
4. Teste a instalação e funcionamento offline
