# -*- coding: utf-8 -*-
import http.server
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver

PORT = 8080

class MyHttpRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/board' or self.path.startswith('/region'):
            self.path = 'index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)


MyHttpRequestHandler.extensions_map={
	'.html': 'text/html',
    '.png': 'image/png',
	'.jpg': 'image/jpg',
	'.svg':	'image/svg+xml',
	'.css':	'text/css',
	'.js':	'application/x-javascript',
	'': 'text/html', # Default
    }

httpd = socketserver.TCPServer(("", PORT), MyHttpRequestHandler)

print("serving at port", PORT)
httpd.serve_forever()
