"""Serve only public study-site files on loopback; never expose project caches.

Run from any directory: python scripts/dev-server.py --port 4173
No directory listing, repository metadata or private tmp/ material is served.
"""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_FILES = frozenset({
    'index.html', 'app.js', 'core.js', 'appearance.js', 'catalog.js',
    'styles.css', 'study.css', 'home.css', 'theme.css', 'learning.css', 'readings.css',
    'data/morphology.json', 'data/syntax.json', 'data/vocabulary-lessons.json',
    'data/vocabulary.json', 'data/articles-morphology.json',
    'data/articles-syntax.json', 'data/articles-vocabulary.json',
    'assets/favicon.svg', 'assets/EncodeSans.ttf', 'assets/EncodeSans-OFL.txt',
    'assets/GFSDidot.ttf', 'assets/GFSDidot-OFL.txt',
    'assets/Manrope.ttf', 'assets/Manrope-OFL.txt',
    'LICENSE', 'CONTENT-LICENSE.md', 'THIRD_PARTY_NOTICES.md',
})


def public_file(request_path):
    """Resolve an explicitly public URL, including version queries, or None."""
    if not request_path.startswith('/') or request_path.startswith('//'):
        return None
    try:
        path = unquote(urlsplit(request_path).path, errors='strict')
    except (ValueError, UnicodeError):
        return None
    name = 'index.html' if path == '/' else path.removeprefix('/')
    if name not in PUBLIC_FILES:
        return None
    target = (ROOT / name).resolve()
    if not target.is_relative_to(ROOT) or not target.is_file():
        return None
    return target


class PublicRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_head(self):
        if public_file(self.path) is None:
            self.send_error(404, 'Not found')
            return None
        return super().send_head()

    def translate_path(self, path):
        return str(public_file(path) or (ROOT / '__unavailable_public_file__'))

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4173)
    args = parser.parse_args()
    if not 0 <= args.port <= 65535:
        parser.error('--port must be between 0 and 65535')
    with ThreadingHTTPServer(('127.0.0.1', args.port), PublicRequestHandler) as server:
        print(f'Public site preview: http://127.0.0.1:{server.server_port}/', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
