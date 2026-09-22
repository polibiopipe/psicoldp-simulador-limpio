import document from './rutaSeminarioDocument.js';
import workshop from './researchWorkshop.js?raw';
import styles from './researchWorkshop.css?raw';

// Keep the existing task positions: saved work uses stage/task indices.
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error('Seminar integration anchor changed: ' + before.slice(0, 80));
  return source.replace(before, after);
}

let enhanced = document;
enhanced = replaceOnce(enhanced, '</style>', styles + '\n</style>');
enhanced = replaceOnce(enhanced, "};render();\n</script>", '};\n' + workshop + '\nrender();\n</script>');
// The completion flag is retained as history; current verification also checks
// the review record and the exact draft/evidence that was reviewed.
enhanced = enhanced.replaceAll("s.tasks.every((_,j)=>state[key(i,'task'+j)])", 'stageIsVerified(i)');
enhanced = enhanced.replaceAll("s.tasks.every((_,j)=>state[key(current,'task'+j)])", 'stageIsVerified(current)');
enhanced = enhanced.replaceAll("s.tasks.filter((_,j)=>state[key(current,'task'+j)]).length", 's.tasks.filter((_,j)=>taskIsVerified(current,j)).length');
enhanced = enhanced.replaceAll("if(state[key(i,'task'+j)])done++", 'if(taskIsVerified(i,j))done++');
enhanced = enhanced.replaceAll("!!state[key(current,'task'+j)]", 'taskIsVerified(current,j)');
enhanced = enhanced.replaceAll("!!state[key(current,'task'+(j-1))]", 'taskIsVerified(current,j-1)');
enhanced = enhanced.replaceAll("${state[key(current,'task'+selectedTask)]?'verificado':'en construcción'}", "${taskIsVerified(current,selectedTask)?'verificado':'en construcción'}");
enhanced = enhanced.replaceAll("${done?'Paso verificado. '", "${done?'Revisión registrada. '");
enhanced = enhanced.replaceAll("'Evidencia completa · etapa verificada'", "'Criterios de cierre revisados por el equipo'");
enhanced = replaceOnce(enhanced, "if(!savedDraft||!savedEvidence){flash(!savedDraft?'Falta construir el borrador':'Falta pegar el enlace de evidencia');return}state[key(current,'task'+selectedTask)]=true", "if(!confirmTaskReview(current,selectedTask))return;state[key(current,'task'+selectedTask)]=true");
enhanced = replaceOnce(enhanced, 'renderAiCoach();}\nconst coachRequests', 'renderAiCoach();renderTaskReview();}\nconst coachRequests');
enhanced = replaceOnce(enhanced, '<div><strong>✓</strong><span>${x}</span></div>', '<div><strong>${i+1}</strong><span>${x}</span></div>');
// A record cannot be closed just by changing the status select.
enhanced = replaceOnce(enhanced, "items[index][el.dataset.f]=el.value;state[key(current,'feedback')]=items;save()", "const previous=items[index][el.dataset.f];items[index][el.dataset.f]=el.value;if(el.dataset.f==='status'&&el.value==='Verificada y cerrada'&&!feedbackIsVerified(items[index])){items[index][el.dataset.f]=previous;el.value=previous;flash('Falta registrar el antes, el resultado, la justificación y la revisión con evidencia');}state[key(current,'feedback')]=items;save();renderFeedbackReview()" );
enhanced = replaceOnce(enhanced, 'renderLesson();renderFeedback();', 'renderLesson();renderFeedback();renderStageMap();renderWorkshop();');
enhanced = replaceOnce(enhanced, "list.appendChild(box)});}\nfunction esc", "list.appendChild(box)});renderFeedbackReview();}\nfunction esc");
export default enhanced;
