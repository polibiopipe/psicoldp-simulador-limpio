# Verificación local de Escucha Viva

Resultado local: **PASS**.
Commit base: `f1aa0bb095a9867731dabcf19eccfa899d4006c4`.
SHA-256 del código: `556adc7c98f603eec2a20049c14f25f982fc3cb680f669b2a5331c88f44a93db`.
Inicio UTC: 2026-09-11T20:14:22.710Z. Node: v24.19.0.

Las auditorías usan datos ficticios y servicios simulados. Este resultado no certifica producción.

| Verificación | Estado |
| --- | --- |
| network-and-environment | PASS |
| credential-patterns | PASS |
| preparation-session-plan | PASS |
| basic-interview | PASS |
| claudio | PASS |
| clinical-claudio | PASS |
| clinical-all | PASS |
| phase3a-safety | PASS |
| adult-avatars | PASS |
| encoding | PASS |
| feedback | PASS |
| session-expiration | PASS |
| session-resume-auth | PASS |
| session-duration-policy | PASS |
| agenda | PASS |
| persistence-ui | PASS |
| canonical-biographies | PASS |
| narratives | PASS |
| narrative-disclosure | PASS |
| narrative-integration | PASS |
| conversation-scenarios | PASS |
| simulator-flow | PASS |
| research-consent | PASS |
| access-consent | PASS |
| feedback-academic | PASS |
| feedback-mediation | PASS |
| simulator-enrollment | PASS |
| build | PASS |
| source-unchanged-by-tests | PASS |

## Advertencias

- Vite reports a chunk larger than 500 kB.
- Vite reports mixed static/dynamic imports.

## No verificado

- Authenticated live Supabase/Gemini flow and production configuration
- Live database policies, SQL migrations, and concurrent database transactions
- Visual browser, mobile, and accessibility behavior
- Clinical or educational validity of AI feedback
- Complete dependency vulnerability audit or safety of the full ECC package

## Pruebas del ejecutor

- Se rechazó una copia con `.env.local`; un PASS anterior se sustituyó por BLOCKED.
- Una auditoría nueva sin revisar fue rechazada y no ejecutó su archivo de prueba.
- Se retiraron claves ficticias de servicios, variables VITE y NODE_OPTIONS antes de ejecutar Node.
- Se comprobó bloqueo TCP/UDP en IPv4/IPv6 y su herencia en un proceso hijo.

Estas pruebas se ejecutaron con `python3 scripts/verification/test-runner.py` en directorios temporales.

## Alcance del cambio

Se añade `npm run verify:safe` y documentación. No se instala ECC ni se cambia la aplicación, la base de datos o la configuración de producción. Las dependencias proceden del lockfile existente; no se añadieron paquetes.

La huella del código corresponde al estado verificado antes de agregar este informe documental. Los registros detallados permanecen en la copia local y no se incorporan al repositorio.
