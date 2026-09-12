"""Descarga modelos públicos y verifica los SHA-256 usados en esta muestra.

Wav2Lip: exclusivamente investigación, uso académico o personal no comercial.
Kokoro: pesos Apache 2.0. No se necesita una cuenta ni una clave de pago.
"""
from pathlib import Path
import hashlib
import json
import urllib.request


def checksum(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        while chunk := source.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def main():
    root = Path(__file__).resolve().parent
    destination = root / 'models'
    destination.mkdir(exist_ok=True)
    entries = json.loads((root / 'model-sources.json').read_text(encoding='utf-8'))
    for entry in entries:
        target = (root if entry['name'] == 'claudio.png' else destination) / entry['name']
        if target.exists() and checksum(target) == entry['sha256']:
            print('Verificado:', target.name, flush=True)
            continue
        print('Descargando:', target.name, flush=True)
        temporary = target.with_suffix('.part')
        with urllib.request.urlopen(entry['url'], timeout=120) as response, temporary.open('wb') as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
        if checksum(temporary) != entry['sha256']:
            raise RuntimeError(f'La verificación de {target.name} falló; no se usará ese archivo.')
        temporary.replace(target)
        print('Descargado y verificado:', target.name, flush=True)


if __name__ == '__main__':
    main()
