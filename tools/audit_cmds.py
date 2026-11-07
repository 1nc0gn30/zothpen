#!/usr/bin/env python3
"""Audit every command snippet in the ZothPen data layer.

Two passes:
  1. syntax — feed each snippet to the right parser (bash -n, shellcheck -S error,
     python3 ast, ruby -c, yaml) and report anything that would not run if you
     pasted it into a terminal.
  2. shape — mechanical style defects that make an example wrong or noisy:
     trailing whitespace, a blank first line inside a heredoc, stray blank
     lines at the head/tail of a block, runs of blank lines, `\\` continuation
     followed by a leading pipe, CRLF, tabs used for alignment in prose.

usage: python3 tools/audit_cmds.py [--json out.json] [--quiet]
"""
import json, re, subprocess, sys, os, ast, tempfile, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DUMP = os.path.join(ROOT, 'tools', 'dump_cmds.js')
SCRATCH = os.environ.get('BH_AGENT_WORKSPACE') or '/home/zoth/.hermes/cache/scratch'


def load():
    out = os.path.join(SCRATCH, 'cmds.json')
    subprocess.run(['node', DUMP, out], cwd=ROOT, check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return json.load(open(out))


def shape_flags(s):
    L = s.split('\n')
    f = []
    if '\r' in s:
        f.append('crlf')
    if any(l != l.rstrip() for l in L):
        i = next(i for i, l in enumerate(L) if l != l.rstrip())
        f.append('trailing-ws@L%d' % (i + 1))
    if s.startswith('\n'):
        f.append('lead-blank')
    if s.endswith('\n'):
        f.append('end-blank')
    if re.search(r'\n[ \t]*\n[ \t]*\n', s):
        f.append('blank-run')
    for i, l in enumerate(L):
        if l.strip() in ("<<'EOF'", '<<EOF', '<<"EOF"') and i + 1 < len(L) and L[i + 1].strip() == '':
            f.append('blank-after-heredoc@L%d' % (i + 1))
        if l.rstrip().endswith('\\') and i + 1 < len(L) and L[i + 1].lstrip().startswith('|'):
            f.append('continuation-pipe@L%d' % (i + 2))
        if re.match(r'\s*\|', l):
            f.append('leading-pipe@L%d' % (i + 1))
        if '\t' in l and not l.lstrip().startswith(('Host:', 'Ports:', '#')):
            f.append('tab@L%d' % (i + 1))
    return sorted(set(f))


def syntax_check(rec):
    s, lang = rec['s'], rec['lang']
    if lang == 'text':
        return []
    if lang == 'bash':
        p = subprocess.run(['bash', '-n'], input=s, text=True, capture_output=True)
        errs = []
        if p.returncode != 0:
            errs.append('bash -n: ' + ' '.join(p.stderr.strip().split('\n')[-2:])[:200])
        sc = subprocess.run(['shellcheck', '-s', 'bash', '-S', 'error', '-f', 'json', '-'],
                            input=s, text=True, capture_output=True)
        try:
            for m in json.loads(sc.stdout or '[]'):
                errs.append('SC%s: %s (line %s)' % (m['code'], m['message'][:120], m['line']))
        except Exception:
            pass
        return errs
    if lang == 'python':
        try:
            ast.parse(s)
            return []
        except SyntaxError as e:
            return ['python: %s (line %s)' % (e.msg, e.lineno)]
    if lang == 'ruby':
        p = subprocess.run(['ruby', '-c'], input=s, text=True, capture_output=True)
        return [] if p.returncode == 0 else ['ruby -c: ' + p.stdout.strip()[:160]]
    if lang == 'yaml':
        try:
            import yaml
            yaml.safe_load(s)
            return []
        except Exception as e:
            return ['yaml: %s' % str(e)[:160]]
    return []


def main():
    recs = load()
    bad, shape = [], []
    for r in recs:
        e = syntax_check(r)
        if e:
            bad.append((r, e))
        f = shape_flags(r['s'])
        if f:
            shape.append((r, f))
    print('audited %d snippets: %d syntax problems, %d shape problems'
          % (len(recs), len(bad), len(shape)))
    if bad:
        print('\n=== SYNTAX (would not run as pasted) ===')
        for r, e in bad:
            print('\n%-8s %-14s %s' % (r['file'].replace('data-', ''), r['id'][:14], r['where']))
            print('   ' + r['s'].split('\n')[0][:110])
            for x in e:
                print('   ! ' + x)
    if shape:
        print('\n=== SHAPE ===')
        for r, f in shape:
            print('%-8s %-14s %-8s %s' % (r['file'].replace('data-', ''), r['id'][:14], r['where'], ','.join(f)))
    if '--json' in sys.argv:
        out = sys.argv[sys.argv.index('--json') + 1]
        json.dump({'syntax': [{'rec': r, 'errors': e} for r, e in bad],
                   'shape': [{'rec': r, 'flags': f} for r, f in shape]},
                  open(out, 'w'), indent=1)
        print('\nwrote ' + out)
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
