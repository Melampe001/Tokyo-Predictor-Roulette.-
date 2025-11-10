# 🚀 Guía de Inicio Rápido - Tokyo Predictor Roulette

¡Bienvenido! Esta guía te ayudará a poner en marcha el proyecto en **menos de 5 minutos**.

## ⚡ Inicio en 3 Pasos

### 1️⃣ Instalar Dependencias

```bash
npm install
```

**Nota**: Requiere Node.js 18+ ([descargar aquí](https://nodejs.org))

### 2️⃣ Iniciar el Servidor

```bash
npm start
```

Verás algo como:
```
✓ TokioAI module loaded successfully
info: Tokyo Predictor server started
info: HTTP server listening on port 8080
info: WebSocket server ready at ws://localhost:8080
```

### 3️⃣ Verificar que Funciona

Abre otra terminal y ejecuta:

```bash
curl http://localhost:8080/health
```

Deberías ver: `{"status":"healthy",...}`

**¡Listo!** 🎉 El servidor está funcionando.

---

## 🎯 Prueba la API

### Enviar un Resultado

```bash
curl -X POST http://localhost:8080/api/result \
  -H "Content-Type: application/json" \
  -d '{"value": 12}'
```

### Obtener Análisis

```bash
curl http://localhost:8080/api/analysis
```

### Ver Resultados Recientes

```bash
curl http://localhost:8080/api/results
```

---

## 🌐 Usar el Dashboard Web

En otra terminal:

```bash
cd web-dashboard
npm install
npm run dev
```

Abre el navegador en: **http://localhost:3000**

---

## 🧪 Ejecutar Tests

```bash
npm test
```

Deberías ver: **16 passed** ✅

---

## 🐳 Usar con Docker (Opcional)

Si prefieres Docker:

```bash
docker-compose up -d
```

- Backend: http://localhost:8080
- Dashboard: http://localhost:3000

Para detener:
```bash
docker-compose down
```

---

## 📚 Próximos Pasos

### Aprender Más

- **[HELP.md](./HELP.md)** - Guía completa con ejemplos y solución de problemas
- **[README.md](./README.md)** - Documentación principal del proyecto
- **[TOKIOAI_README.md](./TOKIOAI_README.md)** - API del módulo TokioAI

### Probar Funcionalidades

**1. Usar el Módulo TokioAI Directamente**

Crea un archivo `test-tokio.js`:

```javascript
import TokioAI from './src/tokioai.js';

const tokio = new TokioAI({
  batchSize: 10,
  encryption: true
});

// Capturar resultados
console.log('Capturando resultados...');
for (let i = 0; i < 10; i++) {
  const num = Math.floor(Math.random() * 37);
  tokio.captureResult(num);
  console.log(`✓ Capturado: ${num}`);
}

// Analizar
const analysis = tokio.analyzeBatch();
console.log('\n📊 Análisis:');
console.log('Sugerencia:', analysis.suggestion);
console.log('Tendencia:', analysis.trends.dominant);

// Generar PDF
await tokio.generatePDF('./mi-reporte.pdf');
console.log('\n✓ PDF generado: mi-reporte.pdf');
```

Ejecutar:
```bash
node test-tokio.js
```

**2. Cliente WebSocket**

Crea `websocket-client.js`:

```javascript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('✓ Conectado al servidor');
  
  // Enviar resultado
  ws.send(JSON.stringify({
    type: 'result',
    value: 25
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Mensaje recibido:', message.type);
  console.log('Data:', message.data || message.message);
});
```

Ejecutar (con el servidor corriendo):
```bash
node websocket-client.js
```

---

## 🔧 Problemas Comunes

### Puerto 8080 ocupado

```bash
# Usar otro puerto
PORT=3000 npm start
```

### Tests no pasan

```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm test
```

### Docker no inicia

```bash
# Ver logs
docker-compose logs

# Rebuild
docker-compose build --no-cache
```

---

## 💡 Comandos Útiles

```bash
# Desarrollo con hot-reload
npm run dev

# Tests con coverage
npm test -- --coverage

# Ver logs en tiempo real
tail -f logs/app.log

# Limpiar logs
rm -rf logs/*.log

# Verificar versión de Node
node --version  # Debe ser >= 18

# Ver todas las dependencias
npm list --depth=0
```

---

## 🆘 Necesitas Ayuda?

1. **Consulta [HELP.md](./HELP.md)** - Guía completa de solución de problemas
2. **Revisa los logs**: `cat logs/error.log`
3. **Abre un Issue** en GitHub con detalles del problema

---

## ✅ Checklist de Verificación

Marca cada item al completarlo:

- [ ] Node.js 18+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Servidor inicia sin errores (`npm start`)
- [ ] Health check responde (`curl http://localhost:8080/health`)
- [ ] Tests pasan (`npm test`)
- [ ] Dashboard web funciona (opcional)
- [ ] Docker funciona (opcional)

Si todos los items están marcados, ¡estás listo para usar el proyecto! 🎉

---

## 🎓 Recursos de Aprendizaje

- **Node.js**: https://nodejs.org/docs
- **Express**: https://expressjs.com
- **WebSockets**: https://github.com/websockets/ws
- **React**: https://react.dev
- **Docker**: https://docs.docker.com

---

**¡Éxito con tu proyecto!** 🚀

Para más información, consulta la [documentación completa](./README.md).
