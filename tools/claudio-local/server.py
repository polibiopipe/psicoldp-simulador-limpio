"""Loopback-only, paired renderer. No LLM calls, accounts or clinical database access."""
import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import re
import secrets
import tempfile
import threading
from urllib.parse import parse_qs, urlsplit

PORT = 8765


def allowed_origin(origin):
    if origin in ('http://127.0.0.1:5173', 'http://localhost:5173'):
        return True
    return bool(re.fullmatch(r'https://psicoldp-simulador-limpio(?:-[a-z0-9-]+-polibio-solis-projects)?\.vercel\.app', origin or ''))


def create_server(render, token=None, port=PORT):
    secret = token or secrets.token_urlsafe(32)
    gate = threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass  # Never log text or the pairing code.

        def valid_host(self):
            return self.headers.get('Host') in (f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}')

        def reply(self, status, body, content_type='application/json'):
            if not isinstance(body, bytes):
                body = json.dumps(body, ensure_ascii=False).encode()
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Referrer-Policy', 'no-referrer')
            self.send_header('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors 'none'")
            origin = self.headers.get('Origin')
            if allowed_origin(origin):
                self.send_header('Access-Control-Allow-Origin', origin)
                self.send_header('Vary', 'Origin')
            self.end_headers()
            try:
                self.wfile.write(body)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def authorized(self):
            return (self.valid_host() and allowed_origin(self.headers.get('Origin'))
                and secrets.compare_digest(self.headers.get('Authorization', ''), 'Bearer ' + secret))

        def do_OPTIONS(self):
            if not self.valid_host() or not allowed_origin(self.headers.get('Origin')):
                self.reply(403, {'error': 'Origen no permitido.'})
                return
            self.send_response(204)
            self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
            self.send_header('Vary', 'Origin')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
            self.send_header('Access-Control-Allow-Private-Network', 'true')
            self.send_header('Content-Length', '0')
            self.end_headers()

        def do_GET(self):
            url = urlsplit(self.path)
            if url.path == '/pair' and self.valid_host():
                origin = parse_qs(url.query).get('origin', [''])[0]
                if not allowed_origin(origin):
                    self.reply(403, {'error': 'Abre la conexión desde el piloto de Claudio.'})
                    return
                page = ('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
                    '<title>Conectar a Claudio</title><style>body{font:18px system-ui;background:#102c35;color:#eefaf8;max-width:520px;margin:12vh auto;padding:24px;line-height:1.6}button{font:inherit;padding:14px;background:#c2ede5;border:0;border-radius:10px}</style>'
                    '<h1>Motor de Claudio listo</h1><p>Conecta este computador al piloto para generar voz y vídeo de sus respuestas.</p>'
                    '<button id="pair">Conectar con el piloto</button><p id="status"></p><script>'
                    f'const target={json.dumps(origin)};'
                    'document.getElementById("pair").onclick=()=>{if(!window.opener){document.getElementById("status").textContent="Vuelve al piloto y pulsa Conectar motor local.";return;}'
                    f'window.opener.postMessage({{type:"claudio-local-pair",token:{json.dumps(secret)}}},target);'
                    'document.getElementById("status").textContent="Vuelve a la pestaña del piloto. Puedes cerrar esta ventana.";};</script></html>')
                self.reply(200, page.encode(), 'text/html; charset=utf-8')
            elif url.path == '/health' and self.authorized():
                self.reply(200, {'ok': True, 'engine': 'claudio-local-v1'})
            else:
                self.reply(403, {'error': 'Conecta el motor desde el piloto.'})

        def do_POST(self):
            if self.path != '/render' or not self.authorized():
                self.reply(403, {'error': 'Conecta el motor desde el piloto.'})
                return
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 < size <= 16000 or self.headers.get('Content-Type', '').split(';')[0] != 'application/json':
                    raise ValueError()
                payload = json.loads(self.rfile.read(size))
                text = payload.get('text')
                if not isinstance(text, str) or not text.strip() or len(text) > 4000:
                    raise ValueError()
            except (ValueError, TypeError, AttributeError, json.JSONDecodeError):
                self.reply(400, {'error': 'La respuesta no tiene un formato válido.'})
                return
            if not gate.acquire(blocking=False):
                self.reply(409, {'error': 'Claudio está terminando otro vídeo. Repite la respuesta en unos segundos.'})
                return
            try:
                with tempfile.TemporaryDirectory(prefix='claudio-') as directory:
                    video = render(text, directory)
                self.reply(200, video, 'video/mp4')
            except Exception:
                self.reply(500, {'error': 'No se pudo generar el vídeo. La respuesta sigue en el chat.'})
            finally:
                gate.release()

    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    server.daemon_threads = True
    return server


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--device', choices=['CPU', 'GPU', 'AUTO'], default='CPU')
    args = parser.parse_args()
    print('Preparando el motor de Claudio. La primera vez puede tardar unos minutos.', flush=True)
    from render_engine import LocalAvatarEngine
    engine = LocalAvatarEngine(Path(__file__).resolve().parent, args.device)
    server = create_server(engine.render)
    print('Listo. En el piloto pulsa Conectar motor local. Deja esta ventana abierta.', flush=True)
    print('Para detenerlo pulsa Ctrl+C. Dispositivo:', ', '.join(engine.devices), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
