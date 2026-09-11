# Verificación local y controlada de Escucha Viva

Se adapta la secuencia de verificación de ECC: comprobar el proyecto, ejecutar pruebas,
revisar cambios y registrar evidencia con sus límites. La implementación usa las auditorías
propias de Escucha Viva. No instala ECC, agentes, hooks, MCP, memoria automática ni servicios externos.

Referencia consultada: [verification-loop de ECC](https://github.com/affaan-m/ECC/blob/c9148d0bb239ed01a95724a5928b98cdf9c30658/skills/verification-loop/SKILL.md),
repositorio de Affaan Mustafa, licencia MIT. El código de esta adaptación se escribió para este
proyecto; no se copiaron scripts ejecutables de ECC. La referencia fija la versión revisada,
sin incorporar actualizaciones automáticas. Fecha de revisión: 11 de septiembre de 2026.

## Ejecución

Usar una copia del repositorio, sin archivos `.env` (se admite `.env.example`), con Node.js 22.12+
o 24, Python 3 y Linux con libseccomp. La instalación de dependencias es un paso separado y
requiere red; el ejecutor de verificación no instala nada.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run verify:safe
```

Las pruebas negativas del ejecutor se pueden repetir con `python3 scripts/verification/test-runner.py`.
Comprueban rechazo de `.env`, invalidación de informes anteriores, bloqueo de auditorías nuevas,
retiro de credenciales ficticias y de NODE_OPTIONS, y herencia del filtro de red.

Se conservan las versiones exactas de `package-lock.json`. `--ignore-scripts` evita ejecutar
scripts de instalación de paquetes; no certifica que esos paquetes sean seguros. En otros
sistemas se requiere un entorno Linux adecuado: el comando se detiene si falta la protección,
sin ofrecer una ejecución equivalente sin restricciones.

## Protecciones concretas

- Un filtro seccomp deniega la creación de sockets de todas las familias excepto Unix IPC;
  bloquea también `socketcall` e `io_uring_setup`. Se hereda en los procesos de Node y esbuild.
- Antes de probar el proyecto se comprueba denegación TCP/UDP, IPv4/IPv6 y herencia en un
  subproceso. Los intentos son locales, sin enviar datos a un servicio externo.
- Los procesos reciben solo PATH, LANG, TZ, TMPDIR y el indicador del filtro. No se heredan
  claves de Gemini/Supabase, tokens, proxies, variables VITE ni NODE_OPTIONS.
- Se rechazan archivos `.env*` del directorio raíz porque Vite puede cargarlos aunque se
  limpie el entorno. Usar una copia sin credenciales es un requisito adicional.
- Las auditorías se ejecutan mediante una lista explícita de archivos revisados, sin shell,
  sin `npx`, sin resolver `latest` y sin ejecutar nuevos comandos añadidos al paquete.
- Los patrones seleccionados de credenciales se informan solo por archivo y tipo, sin
  imprimir la coincidencia. Esta detección es parcial, no una auditoría integral de secretos.
- Se registra commit, huella del código antes/después, lockfile, versiones, resultado y
  tiempo por comprobación. Cada proceso tiene un límite de 60 segundos.

El filtro restringe red: **no es un aislamiento del sistema de archivos ni un entorno para
ejecutar código malicioso**. Unix IPC permanece disponible para esbuild. Se trabaja con código
revisado y una copia sin secretos. No debe emplearse para evaluar paquetes desconocidos.

## Cobertura

La lista incluye las 24 auditorías existentes y `test-simulator-enrollment.mjs`, que no estaba
incluida en `audit:all`, más compilación, prueba del filtro y revisión de patrones de credenciales.
Las auditorías originales se conservan. Algunas combinan comportamiento con comprobaciones
del código fuente; no todas son pruebas de integración.

| Área | Evidencia ejecutada |
| --- | --- |
| Acceso | Consentimiento, aprobación, asignación, suspensión y propiedad con clientes ficticios |
| Agenda | Horarios, cruces, anticipación, persistencia simulada y reintento |
| Sesión | Duración, vencimiento, reanudación, cierre y conservación ante fallos simulados |
| Retroalimentación | Evidencia textual, negaciones, límites, citas y mediación con proveedor ficticio |
| Recorrido | Componentes reales renderizados con React Test Renderer; servicios sustituidos |
| Motor | Escenarios, biografías y consistencia de casos locales |

El resultado se escribe en `.audit-verification/report.md` y `report.json`. Los registros
detallados son locales y están ignorados por Git. No se suben automáticamente. Un fallo
produce salida distinta de cero; no se convierten comprobaciones fallidas en aprobadas.
Cada intento invalida el informe anterior; una ejecución interrumpida conserva INCOMPLETE.
No hay publicación, migración SQL ni actualización automática de otros proyectos.

## Ejecución automática en GitHub

El workflow `.github/workflows/verify-safe.yml` ejecuta el comando en propuestas hacia `main`,
en cambios integrados en `main` y, para comprobar la activación inicial, en la rama de esta
implementación. También admite ejecución manual. Su control se llama `verify-safe`.
Usa Ubuntu 24.04, Node 24.19.0 y acciones oficiales fijadas por SHA. La instalación desde el
lockfile precede a las pruebas sin red; no utiliza secretos del repositorio ni deja credenciales
de Git persistidas. No usa `pull_request_target`, permisos de escritura o publicación automática.

Se ejecutan primero las pruebas negativas del propio ejecutor. Los reportes se adjuntan al
resumen y como artefacto por 14 días, incluidos los fallos. No se suben los registros detallados.
Una comprobación cancelada, pendiente, bloqueada o fallida no equivale a PASS.

Para exigir esta comprobación antes de integrar un cambio, la protección administrativa de
`main` debe requerir un pull request, el estado `verify-safe` satisfactorio y una rama actualizada
con `main`. No habilitar bypass para administradores ni actores adicionales. La presencia del
workflow por sí sola no activa esa protección; debe comprobarse por separado en GitHub.

La regla importable está en `docs/escucha-viva-protection-ruleset.json`. El identificador
15368 corresponde a GitHub Actions, comprobado en los controles reales de esta implementación.
Exige un pull request y el control aprobado, sin exigir un segundo revisor humano. También
impide borrar `main` o reemplazar su historia con un push forzado. No tiene excepciones de bypass.

**Estado al preparar esta activación:** la conexión de GitHub permite integrar el workflow,
pero no expone una operación para modificar reglas administrativas. Este archivo NO activa
la protección por existir en el repositorio. Un administrador debe hacer lo siguiente:

1. Descargar el JSON y abrir Settings → Rules → Rulesets en este repositorio.
2. Elegir New ruleset → Import a ruleset y seleccionar el archivo.
3. Comprobar que la aplicación está en Active, la rama es `main`, el control obligatorio es
   `verify-safe` de GitHub Actions, se exige actualizar la rama y la lista de bypass está vacía.
4. Pulsar Create y volver a abrir la regla para confirmar que quedó activa.

Guía oficial: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository

## Interpretación y continuidad

Un PASS indica que se cumplieron estas comprobaciones locales con datos ficticios. Quedan
fuera la sesión autenticada real, configuración productiva, políticas SQL en la base activa,
concurrencia real, revisión visual en navegador/móvil y validación clínica o pedagógica.
El informe los conserva explícitamente como no verificados. Este proyecto no declara TypeScript
ni lint como comandos: no se atribuye aprobación a controles que no existen.

Para retomar: revisar el commit base y las huellas del informe, comprobar cambios nuevos,
revisar cualquier auditoría nueva antes de incorporarla a la lista y ejecutar el comando de nuevo.
No reutilizar un PASS anterior como evidencia de otra versión. La prueba real con Gemini exige
una cuenta de pruebas autorizada y un entorno de pruebas configurado por separado.

Para retirar esta adaptación, desactivar primero la regla administrativa si se importó y pausar
la revisión programada si está activa; luego revertir el cambio que añade `verify:safe`, el
workflow, esta documentación y `scripts/verification/`. No hay cambios de base de datos ni de
lógica del simulador que revertir.
