#!/usr/bin/env python3
"""Descriptive, criterion-level analysis of the authenticated research export.
No total score, imputation, significance testing or causal interpretation.
"""
import argparse
import json
import statistics
from collections import Counter


def analyze(data):
    protocol = data.get('protocol') or {}
    output = {'protocol': protocol.get('version'), 'primary_criterion': protocol.get('primary_criterion'),
              'protocol_status': protocol.get('status'), 'aggregation_enabled': False,
              'interpretation': 'Descripción por criterio. No demuestra eficacia, causalidad ni competencia clínica.',
              'criteria': {}, 'agreement': data.get('joint', {}).get('agreement', [])}
    pairs = data.get('joint', {}).get('pairs', [])
    for criterion in ('selection', 'evidence', 'alternatives', 'uncertainty'):
        rows = [r for r in pairs if r.get('criterion') == criterion]
        usable = [r for r in rows if isinstance(r.get('pre'), (int, float)) and isinstance(r.get('post'), (int, float)) and not isinstance(r.get('pre'), bool) and not isinstance(r.get('post'), bool)]
        differences = [r['post'] - r['pre'] for r in usable]
        n = len(usable)
        output['criteria'][criterion] = {
            'paired_n': n, 'missing_or_pending_n': len(rows) - n,
            'pre_levels': dict(sorted(Counter(r['pre'] for r in usable).items())),
            'post_levels': dict(sorted(Counter(r['post'] for r in usable).items())),
            'decreased': sum(d < 0 for d in differences), 'unchanged': sum(d == 0 for d in differences),
            'increased': sum(d > 0 for d in differences),
            'median_change': statistics.median(differences) if n else None,
            'mean_change_descriptive': statistics.mean(differences) if n else None,
            'sd_change_descriptive': statistics.stdev(differences) if n > 1 else None,
            'inference': 'Pendiente del plan final de análisis, validación de medida y revisión de supuestos.'}
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export', help='JSON descargado desde Equipo investigador')
    parser.add_argument('--output', help='Archivo JSON de salida; si se omite se imprime en pantalla')
    args = parser.parse_args()
    with open(args.export, encoding='utf-8') as handle:
        result = analyze(json.load(handle))
    text = json.dumps(result, ensure_ascii=False, indent=2)
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as handle:
            handle.write(text + '\n')
    else:
        print(text)
