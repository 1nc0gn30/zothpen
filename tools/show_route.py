#!/usr/bin/env python3
"""Render a ZothPen route headlessly and print every code block with visible
line ends, so blank lines / stray lines in the data are obvious.

usage: python3 tools/show_route.py '#/lab/lab-scan' [more routes...]
"""
import os, re, subprocess, sys, html, tempfile

SCRATCH = os.environ.get('BH_AGENT_WORKSPACE') or '/home/zoth/.hermes/cache/scratch'
BASE = os.environ.get('ZOTHPEN_URL', 'http://127.0.0.1:8000/')


def dump(route):
    out = os.path.join(SCRATCH, 'route.html')
    err = os.path.join(SCRATCH, 'route.err')
    url = BASE + route
    with open(out, 'w') as o, open(err, 'w') as e:
        subprocess.run(['google-chrome', '--headless=new', '--disable-gpu', '--no-sandbox',
                        '--virtual-time-budget=8000', '--dump-dom', url],
                       stdout=o, stderr=e, timeout=180)
    return open(out, encoding='utf-8', errors='replace').read()


def blocks(page):
    """every .code-body block plus its heading context."""
    res = []
    for m in re.finditer(r'<div class="code-body[^"]*"[^>]*>(.*?)</div>', page, re.S):
        res.append(m.group(1))
    return res


def show(route):
    page = dump(route)
    title = re.search(r'<h1[^>]*>(.*?)</h1>', page, re.S)
    print('#' * 78)
    print('ROUTE %s   title=%s' % (route, html.unescape(re.sub(r'<[^>]+>', '', title.group(1))).strip() if title else '?'))
    bl = blocks(page)
    print('%d code blocks' % len(bl))
    for i, b in enumerate(bl):
        txt = html.unescape(re.sub(r'<[^>]+>', '', b))
        lines = txt.split('\n')
        print('  --- block %d: %d line(s) ---' % (i + 1, len(lines)))
        for ln in lines:
            print('    %r' % ln)


if __name__ == '__main__':
    for r in sys.argv[1:]:
        show(r)
