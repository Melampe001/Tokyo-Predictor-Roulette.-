Fecha: 2025-11-19
Autor: Melampe001

# Actualización de .proto: Resumen y guía de migración

## Resumen
Este cambio añade documentación sobre el estado actual de los archivos .proto y procedimientos para regenerar artefactos.

- Se añade documentación informativa; no se modifican archivos .proto en este PR.

## Archivos modificados
- (documentación) docs/proto-update-20251119.md
- (documentación) docs/REPO-STATUS.md

## Compatibilidad
No aplica (no se tocan los .proto en este PR).

## Instrucciones para desarrolladores
1. Regenerar bindings (si se modifica proto): `make proto`
2. Formatear código: `make fmt`
3. Compilar: `make build`
4. Ejecutar tests: `make test`
5. Ejecutar CI completo (opcional): `make ci`

## Notas adicionales / TODO
- Si se requieren cambios en proto, abrir un PR separado incluyendo `make proto` y artefactos generados.
