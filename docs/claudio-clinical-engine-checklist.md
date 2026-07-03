# Checklist manual - ClinicalSimulationEngine para Claudio

Objetivo: validar que Claudio use el nuevo motor clinico-formativo sin afectar los otros casos.

## Preparacion

1. Iniciar sesion con un usuario aprobado.
2. Abrir el caso Claudio.
3. Seleccionar la sesion que se quiera probar.
4. Mantener los otros casos sin cambios: solo Claudio debe usar `ClinicalSimulationEngine`.

## Pruebas minimas

1. Saludo inicial
   - Estudiante: `hola`
   - Esperado: Claudio saluda breve, contenido, sin abrir informacion profunda.

2. Pregunta por motivo de consulta
   - Estudiante: `quiero saber por que estas aqui`
   - Esperado: responde sobre funcionamiento en automatico, desgaste o sensacion de estar detenido.

3. Pregunta emocional
   - Estudiante: `que sientes cuando hablas de eso`
   - Esperado: habla de cansancio, incomodidad o apagamiento sin diagnosticar.

4. Pregunta directa o confrontativa
   - Estudiante: `tienes que decidir de una vez`
   - Esperado: Claudio se cierra o racionaliza de manera sobria.

5. Pregunta confusa
   - Estudiante: `eso`
   - Esperado: pide aclaracion breve y humana, sin inventar antecedentes.

6. Cierre de sesion
   - Estudiante: `dejamos hasta aqui, nos vemos la proxima`
   - Esperado: responde cierre, agradece o acepta continuidad, sin abrir temas nuevos.

7. Repeticion de una pregunta ya hecha
   - Estudiante: preguntar dos veces por el motivo.
   - Esperado: no repite la misma frase exacta; matiza o resume.

8. Profundidad antes de tiempo
   - Estudiante: `cuentame de tu separacion`
   - Esperado en sesion 1 o baja alianza: marca limite suave y vuelve a rutina/desgaste.

9. Intervencion empatica
   - Estudiante: `entiendo, podemos ir a tu ritmo`
   - Esperado: sube apertura, reconoce alivio y elabora un poco.

10. Agenda o proxima sesion
    - Estudiante: `te parece si vienes en 4 dias mas a las 17 hrs?`
    - Esperado: responde sobre disponibilidad/asistencia, no con reflexion clinica general.

## Criterios de exito

- Claudio responde como paciente, no como terapeuta.
- No inventa crisis, diagnosticos ni antecedentes fuera de ficha.
- No revela contenido profundo antes de alianza o pregunta pertinente.
- No repite frases exactas en 10 a 15 turnos.
- Responde primero la intencion concreta del estudiante.
- Cierra sin abrir informacion nueva.
- Los otros avatares siguen usando el motor anterior.

## Auditoria rapida por consola

Ejecutar:

```bash
npm run audit:clinical-claudio
```

Luego ejecutar:

```bash
npm run build
```
