import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  // Decode URL in case of special characters
  const decodedUrl = decodeURIComponent(req.url);
  
  // Strip query parameters
  const pathname = decodedUrl.split('?')[0];

  // Resolve file path
  let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  // If path doesn't have an extension, assume it is an SPA route and serve index.html
  const ext = path.extname(filePath);
  if (!ext) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const fileExt = path.extname(filePath);
  const contentType = MIME_TYPES[fileExt] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // If any asset is missing, serve index.html as a fallback for React Router SPA routes
      fs.readFile(path.join(DIST_DIR, 'index.html'), (errIndex, indexContent) => {
        if (errIndex) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error: Index not found.');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent);
        }
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
