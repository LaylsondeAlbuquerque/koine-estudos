"""Preview only the compiled Angular site, with the GitHub Pages base path."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

BUILD = (Path(__file__).resolve().parents[1] / 'dist/koine/browser').resolve()

class BuiltSiteHandler(SimpleHTTPRequestHandler):
    def allowed_path(self, value):
        try:
            path = unquote(urlsplit(value).path, errors='strict')
        except (ValueError, UnicodeError):
            return None
        prefix = '/koine-estudos/'
        if not path.startswith(prefix):
            return None
        name = path[len(prefix):] or 'index.html'
        target = (BUILD / name).resolve()
        return target if target.is_relative_to(BUILD) and target.is_file() else None

    def send_head(self):
        if self.allowed_path(self.path) is None:
            self.send_error(404, 'Not found')
            return None
        return super().send_head()

    def translate_path(self, value):
        return str(self.allowed_path(value) or BUILD / '__unavailable__')

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4181)
    args = parser.parse_args()
    if not BUILD.joinpath('index.html').is_file():
        parser.error('Run npm run build:pages first.')
    with ThreadingHTTPServer(('127.0.0.1', args.port), BuiltSiteHandler) as server:
        print(f'Angular preview: http://127.0.0.1:{server.server_port}/koine-estudos/', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass

if __name__ == '__main__':
    main()
