# Registro por simulador

El formulario de Escucha Viva permite elegir Escucha Viva o Umbral. La entrada desde Umbral usa `?registro=umbral-primera-infancia` para preseleccionarlo.

La elección del formulario se conserva durante siete días en el navegador y está vinculada al correo. Después de confirmar el correo, una cuenta sin asignación activa su elección mediante `enroll_in_simulator(requested_simulator, expected_user_id)`. Si la confirmación se abre en otro navegador o no queda una preferencia, el estudiante elige en una pantalla de activación.

La preferencia local no concede acceso. La función comprueba la identidad autenticada, correo verificado, cuenta activa y perfil estudiante. Asigna una sola vez y conserva cualquier asignación existente, incluidas suspensiones y reservas administrativas. No consulta metadata editable para autorizar.

Los registros nuevos conservan el rol estudiante. La antigua regla que forzaba el rol QA se retiró; los roles y permisos previos del equipo siguen intactos. La aceptación obligatoria de condiciones de acceso y el consentimiento de investigación mantienen su flujo existente.

Migración aplicada en Supabase: `verified_student_simulator_self_enrollment`. SQL reproducible en `supabase/simulator_self_enrollment.sql`. Se requiere la estructura compartida `simulator_access` ya existente. Las pruebas SQL aisladas están en `scripts/test-self-enrollment.mjs` del repositorio Umbral. Pruebas del cliente: `node scripts/test-simulator-enrollment.mjs`.

Para Umbral se muestra un enlace a https://psicoldp.org/umbral/ después de activar el acceso. Se utiliza la misma contraseña, pero la sesión de cada dominio es independiente.
