# Aceptación obligatoria para ingresar

La cuenta aprobada debe aceptar expresamente las condiciones de uso educativo y el tratamiento necesario antes de montar el espacio de práctica o cargar su historial. Se exige mayoría de edad por las condiciones de Google Gemini. Las tres casillas empiezan desmarcadas. Rechazar cierra sesión; un error de guardado mantiene el bloqueo.

El registro pertenece a la cuenta y a una versión del documento. La base de datos genera su identificación, fecha y copia íntegra; el cliente no puede alterar ni borrar esa constancia. Cada nueva versión requiere otra aceptación. La pantalla de privacidad permite leer el texto, descargar la constancia y solicitar gestión de datos. La exportación propia incluye estas aceptaciones.

La aceptación de ingreso **no** inscribe en una investigación. El consentimiento de investigación existente continúa separado y voluntario; su rechazo o retiro no modifica el acceso educativo. No se ha abierto una convocatoria ni aceptado en nombre de usuarios reales.

## Publicación en dos etapas

1. Aplicar `supabase/simulation_access_consent.sql` al proyecto verificado `dstmscvnaziqptpomssv`. Añade documento 1.0, registro, evidencia y lectura de autorización sin restringir aún las prácticas de la versión anterior.
2. Desplegar la pantalla y la comprobación del endpoint de entrevista. El servidor utiliza la identidad validada del token, no un identificador enviado por el navegador. Un error de consulta bloquea la generación.
3. Con el despliegue listo, aplicar `supabase/simulation_access_consent_enforcement.sql`. Sus políticas restrictivas se suman a las de propietario y aprobación para insertar o actualizar sesiones, citas y disponibilidad. Las lecturas y eliminaciones ya autorizadas para gestión de privacidad se conservan.
4. Ejecutar las auditorías SQL de acceso, disponibilidad, cierre y consentimiento de investigación. Los usuarios y aceptaciones de prueba se crean dentro de transacciones que terminan en `ROLLBACK`.

Para publicar nuevas condiciones, crear una versión distinta y cambiar `is_current` en una transacción. No editar el texto de una versión existente. La comprobación del servidor y las políticas dejan de aceptar constancias de versiones anteriores. Una pestaña ya abierta puede necesitar recargarse para mostrar el texto nuevo.

## Comprobaciones

- `npm run audit:all`: incluye la App real con servicios simulados; verifica pantalla bloqueada, historial sin cargar, casillas desmarcadas, fallo de escritura, doble clic, persistencia tras recarga, separación de investigación y nuevas cuentas/versiones. Continúa luego el flujo de preparación, entrevista, pausa, reanudación y cierre.
- `npm run audit:access-consent`: prueba el handler real de entrevista con un cliente de datos de prueba. Rechaza aceptación ausente, incompleta, de otra cuenta o antigua; las consultas fallidas no llegan al proveedor.
- `npm run build`: compilación de producción.
- `scripts/audit-access-consent.sql`: declaraciones completas, evidencia del servidor, aislamiento, aprobación, texto inmutable, versiones, restricciones y gestión de privacidad.

El acceso autenticado se prueba con fixtures; no se registra una aceptación real mediante automatización. Las condiciones describen los proveedores existentes y no afirman una exclusión de entrenamiento de Google, porque su modalidad de facturación no se ha verificado. La referencia oficial es https://ai.google.dev/gemini-api/terms. Este cambio técnico no acredita por sí solo cumplimiento jurídico integral ni aprobación de un estudio.
