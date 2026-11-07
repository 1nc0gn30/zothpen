#!/usr/bin/env python3
"""Fix JS data files: escape unescaped backticks and ${ inside template literals."""
import sys, re

def fix(path):
    src = open(path).read()
    out = []
    i = 0
    n = len(src)
    in_tpl = False
    # states outside template: code, or ' or " string, or line comment, or block comment
    state = 'code'
    changed = 0
    while i < n:
        c = src[i]
        if in_tpl:
            if c == '\\':
                out.append(src[i:i+2]); i += 2; continue
            if c == '$' and i+1 < n and src[i+1] == '{':
                out.append('\\${'); changed += 1; i += 2; continue
            if c == '`':
                # terminator if next non-space char (up to 2 newlines) is in ,;)}]
                j = i+1; nl = 0
                while j < n and (src[j] in ' \t' or (src[j] == '\n' and nl < 2)):
                    if src[j] == '\n': nl += 1
                    j += 1
                nxt = src[j] if j < n else ''
                if nxt in ',;)}]' or nxt == '':
                    out.append('`'); in_tpl = False; i += 1; continue
                else:
                    out.append('\\`'); changed += 1; i += 1; continue
            out.append(c); i += 1; continue
        # not in template
        if state == 'code':
            if c == '`':
                in_tpl = True; out.append(c); i += 1; continue
            if c == "'":
                state = 'sq'; out.append(c); i += 1; continue
            if c == '"':
                state = 'dq'; out.append(c); i += 1; continue
            if c == '/' and i+1 < n and src[i+1] == '/':
                state = 'lc'; out.append('//'); i += 2; continue
            if c == '/' and i+1 < n and src[i+1] == '*':
                state = 'bc'; out.append('/*'); i += 2; continue
            out.append(c); i += 1; continue
        if state == 'sq':
            if c == '\\':
                out.append(src[i:i+2]); i += 2; continue
            if c == "'":
                state = 'code'; out.append(c); i += 1; continue
            if c == '\n':
                state = 'code'; out.append(c); i += 1; continue
            out.append(c); i += 1; continue
        if state == 'dq':
            if c == '\\':
                out.append(src[i:i+2]); i += 2; continue
            if c == '"':
                state = 'code'; out.append(c); i += 1; continue
            if c == '\n':
                state = 'code'; out.append(c); i += 1; continue
            out.append(c); i += 1; continue
        if state == 'lc':
            out.append(c)
            if c == '\n': state = 'code'
            i += 1; continue
        if state == 'bc':
            if c == '*' and i+1 < n and src[i+1] == '/':
                out.append('*/'); i += 2; state = 'code'; continue
            out.append(c); i += 1; continue
    new = ''.join(out)
    if new != src:
        open(path, 'w').write(new)
    print(f"{path}: {changed} escapes added, in_tpl_at_eof={in_tpl}, len {len(src)}->{len(new)}")

for p in sys.argv[1:]:
    fix(p)
