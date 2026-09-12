import json
from pathlib import Path
import threading
import unittest
import urllib.error
import urllib.request
from server import create_server, allowed_origin


class ServerTest(unittest.TestCase):
    def setUp(self):
        self.calls = []
        self.directories = []
        def render(text, directory):
            self.calls.append(text)
            self.directories.append(directory)
            return b'test-video'
        self.server = create_server(render, 'a' * 43, port=0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f'http://127.0.0.1:{self.server.server_port}'
        self.headers = {'Origin': 'http://127.0.0.1:5173', 'Authorization': 'Bearer ' + 'a' * 43, 'Content-Type': 'application/json'}

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()

    def request(self, path, headers=None, body=None, method=None):
        request = urllib.request.Request(self.url + path, headers=self.headers if headers is None else headers,
            data=json.dumps(body).encode() if body is not None else None, method=method)
        try:
            return urllib.request.urlopen(request, timeout=5)
        except urllib.error.HTTPError as error:
            return error

    def test_render_and_ephemeral_files(self):
        answer = 'Me cuesta explicar lo que siento.'
        with self.request('/render', body={'text': answer}) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.headers['Content-Type'], 'video/mp4')
            self.assertEqual(response.read(), b'test-video')
        self.assertEqual(self.calls, [answer])
        self.assertTrue(all(not Path(path).exists() for path in self.directories))

    def test_auth_origin_and_host_boundaries(self):
        for headers in [{}, {**self.headers, 'Origin': 'https://evil.example'},
                        {**self.headers, 'Authorization': 'Bearer wrong'}, {**self.headers, 'Host': 'evil.example'}]:
            with self.request('/render', headers=headers, body={'text': 'No'}) as response:
                self.assertEqual(response.status, 403)
        self.assertEqual(self.calls, [])

    def test_invalid_text_is_not_rendered(self):
        for payload in [{}, {'text': ''}, {'text': 9}, {'text': 'x' * 4001}]:
            with self.request('/render', body=payload) as response:
                self.assertEqual(response.status, 400)
        self.assertEqual(self.calls, [])

    def test_pair_and_preflight(self):
        with self.request('/pair?origin=https%3A%2F%2Fevil.example', headers={}) as response:
            self.assertEqual(response.status, 403)
        with self.request('/pair?origin=http%3A%2F%2F127.0.0.1%3A5173', headers={}) as response:
            self.assertEqual(response.status, 200)
            self.assertIn(b'Conectar con el piloto', response.read())
        with self.request('/render', method='OPTIONS') as response:
            self.assertEqual(response.status, 204)
            self.assertEqual(response.headers['Access-Control-Allow-Private-Network'], 'true')
        self.assertTrue(allowed_origin('https://psicoldp-simulador-limpio-git-pil-6bdb5f-polibio-solis-projects.vercel.app'))
        self.assertFalse(allowed_origin('https://psicoldp-simulador-limpio.evil.example'))


if __name__ == '__main__':
    unittest.main()
