#!/usr/bin/env python3
"""Run the documented primary paired-mean analysis on a frozen research export.
Requires an active analysis plan and an explicitly recorded validation/assumption review.
Uses SciPy >=1.10; does not validate the design or assumptions automatically.
"""
import argparse
import json
import math
import statistics


def infer(data):
    protocol = data.get('protocol') or {}
    plans = sorted((e for e in data.get('framework', {}).get('entries', []) if e.get('entry_type') == 'analysis_plan'), key=lambda e: e.get('created_at', ''))
    plan = plans[-1] if plans else None
    p = (plan or {}).get('payload') or {}
    criterion = protocol.get('primary_criterion')
    if protocol.get('status') != 'frozen' or not criterion or p.get('status') != 'active' or p.get('method') != 'paired_t' or p.get('primaryCriterion') != criterion or plan.get('protocol_version') != protocol.get('version'):
        raise ValueError('Se requiere protocolo congelado y último plan activo de la misma versión y criterio principal.')
    if len(p.get('validationReference', '').strip()) < 10 or len(p.get('assumptionsReview', '').strip()) < 40:
        raise ValueError('Faltan referencia de validación y revisión documentada de supuestos.')
    rubric_version = (protocol.get('document') or {}).get('rubricVersion')
    if not rubric_version:
        raise ValueError('El protocolo debe identificar la versión de la rúbrica utilizada.')
    # Rebuild pairs from quality-reviewed assessments and assigned human ratings.
    assessments = {a['id']: a for a in data.get('assessments', []) if a.get('status') == 'submitted' and a.get('quality') == 'valid' and a.get('protocol_version') == protocol.get('version')}
    latest = {}
    for rating in data.get('ratings', []):
        old = latest.get(rating.get('assignment_id'))
        if old is None or rating.get('version', 0) > old.get('version', 0):
            latest[rating['assignment_id']] = rating
    by_slot = {}
    for assignment in data.get('assignments', []):
        assessment = assessments.get(assignment.get('assessment_id'))
        rating = latest.get(assignment.get('id'))
        if not assignment.get('is_primary') or not assessment or not rating or rating.get('rubric_version') != rubric_version or assessment.get('stage') not in ('pre', 'post'):
            continue
        score = rating.get('criteria', {}).get(criterion, {}).get('score')
        if isinstance(score, bool) or not isinstance(score, int) or not 0 <= score <= 3:
            continue
        participant = by_slot.setdefault(assessment['slot'], {})
        if assessment['stage'] in participant:
            raise ValueError('Hay más de una evaluación principal para una etapa del mismo participante.')
        participant[assessment['stage']] = score
    pairs = [(slot, r['pre'], r['post']) for slot, r in sorted(by_slot.items()) if 'pre' in r and 'post' in r]
    if len(pairs) < 2:
        raise ValueError('Se requieren al menos dos pares válidos y evaluados; esto no garantiza precisión ni potencia suficiente.')
    differences = [post - pre for _, pre, post in pairs]
    mean = statistics.mean(differences)
    sd = statistics.stdev(differences)
    result = {'protocol': protocol['version'], 'analysis_plan_id': plan.get('id'), 'analysis_plan_recorded_at': plan.get('created_at'), 'primary_criterion': criterion,
              'paired_n': len(pairs), 'rubric_version': rubric_version, 'planning_target_pairs': (protocol.get('document') or {}).get('targetCompletePairs', 34),
              'below_planning_target': len(pairs) < (protocol.get('document') or {}).get('targetCompletePairs', 34), 'orientation': 'post menos pre', 'mean_change': mean, 'sd_change': sd,
              'observed_difference_distribution': differences, 't': None, 'df': len(pairs) - 1, 'p_two_sided': None,
              'mean_change_ci95': None, 'dz': None,
              'interpretation': 'Cambio intraindividual observado. No permite atribución causal ni transferencia profesional real.',
              'assumptions_review': p['assumptionsReview'], 'validation_reference': p['validationReference']}
    if sd == 0:
        result['limitation'] = 'Diferencias sin variabilidad: no se estiman t, intervalo basado en t ni dz.'
        return result
    from scipy.stats import ttest_rel
    test = ttest_rel([r[2] for r in pairs], [r[1] for r in pairs], alternative='two-sided', nan_policy='raise')
    ci = test.confidence_interval(confidence_level=0.95)
    result.update(t=float(test.statistic), p_two_sided=float(test.pvalue), mean_change_ci95=[float(ci.low), float(ci.high)], dz=mean/sd)
    if not all(math.isfinite(x) for x in [result['t'], result['p_two_sided'], *result['mean_change_ci95'], result['dz']]):
        raise ValueError('El cálculo produjo un valor no finito; revisar datos y plan antes de interpretar.')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export', help='JSON seudonimizado descargado desde coordinación')
    parser.add_argument('--output', help='Archivo JSON de salida')
    args = parser.parse_args()
    try:
        with open(args.export, encoding='utf-8') as handle:
            text = json.dumps(infer(json.load(handle)), ensure_ascii=False, indent=2, allow_nan=False)
    except (ValueError, ImportError) as exc:
        parser.error(str(exc))
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as handle:
            handle.write(text + '\n')
    else:
        print(text)
