#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable caching-free local dev
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def run(port=PORT):
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    # Try port, fall back to next if busy
    for p in range(port, port + 10):
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                print(f"Sequence Game running at: http://localhost:{p}")
                sys.stdout.flush()
                httpd.serve_forever()
        except OSError:
            continue

if __name__ == '__main__':
    run()
