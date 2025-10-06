#!/usr/bin/env python3
import http.server, socketserver, os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'public'
PORT = int(os.environ.get('PORT', '8888'))

class SPARequestHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Serve from public directory
        # Base implementation maps to current working directory; we chdir to ROOT below
        return super().translate_path(path)

    def do_GET(self):
        # Try to serve the requested file; if it doesn't exist, serve index.html
        requested_path = self.translate_path(self.path)
        if os.path.isdir(requested_path):
            # If directory, try index.html inside it
            index_in_dir = os.path.join(requested_path, 'index.html')
            if os.path.exists(index_in_dir):
                self.path = os.path.join(self.path.rstrip('/'), 'index.html')
                return http.server.SimpleHTTPRequestHandler.do_GET(self)
        if os.path.exists(requested_path):
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        # Fallback for SPA routes like /:code
        self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

if __name__ == '__main__':
    os.chdir(str(ROOT))
    with socketserver.TCPServer(("", PORT), SPARequestHandler) as httpd:
        print(f"Serving SPA on http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            httpd.server_close() 