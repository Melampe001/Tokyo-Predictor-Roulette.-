# Instrucciones para Crear el Pull Request

## Estado Actual

✅ **Completado**: Toda la implementación está lista y pusheada a la rama `copilot/featurews-sync`

⚠️ **Pendiente**: Crear el Pull Request en GitHub (requiere permisos de GitHub)

## Rama

- **Rama origen**: `copilot/featurews-sync`
- **Rama destino**: Rama por defecto del repositorio (main, master, o la que corresponda)

## Cómo Crear el PR Manualmente

### Opción 1: Desde GitHub Web UI

1. Ir a: https://github.com/Melampe001/Tokyo-Predictor-Roulette.-
2. Hacer clic en "Pull requests"
3. Hacer clic en "New pull request"
4. Seleccionar:
   - **base**: rama por defecto (main/master)
   - **compare**: `copilot/featurews-sync`
5. Hacer clic en "Create pull request"

### Opción 2: Usando GitHub CLI

```bash
gh pr create \
  --base main \
  --head copilot/featurews-sync \
  --title "Implementar soporte WebSocket (ws) con modelo REST-write + WS-push" \
  --body-file PR_DESCRIPTION.md
```

## Información del PR

### Título

```
Implementar soporte WebSocket (ws) con modelo REST-write + WS-push
```

### Descripción

Copiar el contenido del archivo `PR_DESCRIPTION.md` o usar este resumen:

```markdown
## Implementación de WebSocket push support para Tokyo-Predictor-Roulette

Esta PR implementa soporte completo de WebSocket usando el patrón **REST-write + WS-push** para sincronización en tiempo real de todos.

### Archivos Añadidos

**Servidor** (`server/`)
- ✅ server.js - Express + WebSocket (286 líneas)
- ✅ package.json - express, cors, ws
- ✅ db.json - Storage JSON
- ✅ Dockerfile - Container Node
- ✅ README.md - Documentación completa
- ✅ jest.config.js - Config Jest
- ✅ tests/integration.test.js - 12 tests ✓

**Cliente**
- ✅ app.js - Cliente WS con reconnect + localStorage
- ✅ index.html - Demo interactivo

### Características

1. **Servidor REST + WebSocket**
   - REST API completa (GET/POST/PUT/DELETE /todos)
   - Broadcasting automático a clientes
   - Heartbeat cada 30s
   - Health check endpoint

2. **Cliente WebSocket**
   - Reconnection exponential backoff
   - Merge por timestamp
   - Soporte offline con localStorage
   - REST para writes, WS para push

3. **Tests**: 12/12 pasando ✅

### Testing

```bash
cd server && npm install && npm test  # 12/12 tests
cd server && npm start                # Iniciar servidor
# Abrir index.html en navegador       # Demo
```

### Seguridad

- ✅ CodeQL: 0 alertas
- ✅ GitHub Advisory: 0 vulnerabilidades
- ✅ Validación de inputs
- ✅ Sin secretos hardcoded

### Nota sobre make fmt

No hay archivos Go. Si se añaden en el futuro, ejecutar `make fmt` antes de commit.

### Relacionado

Relacionado con #58
```

### Labels Sugeridos

- `enhancement`
- `websocket`
- `backend`
- `feature`

### Reviewers

Asignar a los maintainers del proyecto.

## Verificación Pre-Merge

Antes de mergear, verificar:

### 1. Tests Pasando

```bash
cd server
npm install
npm test
```

Debe mostrar: `Tests: 12 passed, 12 total`

### 2. Servidor Inicia Correctamente

```bash
cd server
npm start
```

Debe mostrar:
```
Server running on port 3001
REST API: http://localhost:3001
WebSocket: ws://localhost:3001
```

### 3. Demo Funciona

1. Con el servidor corriendo, abrir `index.html` en navegador
2. Verificar que muestra "Conectado al servidor"
3. Crear una tarea
4. Verificar que aparece en la lista
5. Abrir en otra pestaña
6. Crear tarea en una pestaña
7. Verificar que aparece automáticamente en la otra

## Commits Incluidos en el PR

```
7c0a447 - Añadir resumen completo de implementación WebSocket
ef4db58 - Añadir descripción del PR
428429b - Añadir demo HTML para cliente WebSocket
3f1fcad - Añadir servidor REST + WebSocket con tests pasando
ecc4169 - Initial plan
```

## Archivos Modificados

```
Total: 11 archivos, 6,812+ líneas añadidas

app.js
index.html
PR_DESCRIPTION.md
IMPLEMENTATION_SUMMARY_WS.md
server/Dockerfile
server/README.md
server/db.json
server/jest.config.js
server/package.json
server/server.js
server/tests/integration.test.js
```

## Próximos Pasos Después del Merge

1. Actualizar documentación principal si es necesario
2. Considerar añadir autenticación para producción
3. Evaluar migrar de db.json a base de datos real
4. Añadir más tests end-to-end si se requiere
5. Configurar CI/CD para tests automáticos

## Soporte

Para preguntas:
- Ver `IMPLEMENTATION_SUMMARY_WS.md` para detalles técnicos
- Ver `server/README.md` para documentación del servidor
- Ver `PR_DESCRIPTION.md` para descripción completa del PR

---

**Preparado por**: Copilot Agent  
**Fecha**: 2025-11-20  
**Estado**: ✅ Listo para crear PR
