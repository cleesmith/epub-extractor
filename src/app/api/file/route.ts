import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, dirname, normalize } from 'path';

const MIME_TYPES: Record<string, string> = {
  '.xhtml': 'application/xhtml+xml',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.xml': 'application/xml',
  '.css': 'text/css',
  '.txt': 'text/plain',
  '.ncx': 'application/xml',
  '.opf': 'application/xml',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().match(/\.[^.]+$/)?.[0] || '';
  return MIME_TYPES[ext] || 'text/plain';
}

function isHtmlFile(filePath: string): boolean {
  return /\.(xhtml|html|htm)$/i.test(filePath);
}

function rewriteLinks(content: string, dir: string, currentFile: string): string {
  const currentDir = dirname(currentFile);

  // Rewrite href and src attributes with relative paths
  return content.replace(
    /(href|src)=["']([^"':#]+)["']/gi,
    (match, attr, path) => {
      // Skip absolute URLs, data URIs, and anchors
      if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('/')) {
        return match;
      }

      // Resolve relative path from current file's directory
      const resolvedPath = normalize(join(currentDir, path));
      // Use &amp; for XHTML/XML compatibility
      const apiUrl = `/api/file?dir=${encodeURIComponent(dir)}&amp;file=${encodeURIComponent(resolvedPath)}`;

      return `${attr}="${apiUrl}"`;
    }
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dir = searchParams.get('dir');
  const file = searchParams.get('file');

  if (!dir || !file) {
    return NextResponse.json(
      { error: 'Missing dir or file parameter' },
      { status: 400 }
    );
  }

  // Security: ensure file path doesn't escape the directory
  if (file.includes('..')) {
    return NextResponse.json(
      { error: 'Invalid file path' },
      { status: 400 }
    );
  }

  const filePath = join(dir, file);

  try {
    const content = await readFile(filePath);
    const mimeType = getMimeType(file);

    // Rewrite links in HTML files for navigation
    if (isHtmlFile(file)) {
      const text = content.toString('utf-8');
      const rewritten = rewriteLinks(text, dir, file);
      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': mimeType,
        },
      });
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}
