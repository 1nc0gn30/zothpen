#!/usr/bin/env python3
"""enrich_aliases.py - fill the search-alias field + a missing lab link.

Why: app.js:759 (findCmd) and app.js:804 / views-arsenal.js:246 (console
search) all match on `al`, so a console entry with `al: []` is invisible
under any name but its exact binary. 13 of 41 entries had an empty alias
list. Same for modules: m00 shipped `labs: []` while every other module
points at least one lab.

Contract per row: locate the owning object literal, assert the field is
currently empty (safe anchor), write the new list. Already-written ->
"-- already applied". Missing/not-empty-but-different -> abort.
Dry-run by default, --apply writes.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPLY = "--apply" in sys.argv
TERM = "assets/data-terminal.js"

ALIASES = [
    # entry, aliases - peers, common names and the words people search with
    ("ffuf", None),        # cleanup row: 'gobuster' now has its own entry, so stop
                           # letting it resolve to ffuf (findCmd is first-match-wins)
    ("masscan", ["zmap", "udp-scan", "internet-scale"]),
    ("smbclient", ["cifs", "smb", "net-use"]),
    ("ldapsearch", ["ldap", "ldapwhoami", "windapsearch"]),
    ("gobuster", ["dirb", "dirbuster", "vhost"]),
    ("nikto", ["wapiti", "whatweb", "webserver-scan"]),
    ("sqlmap", ["sqli", "sql-injection", "sqlinjection"]),
    ("nuclei", ["vuln-scan", "templates", "template-scan"]),
    ("msfvenom", ["payload", "payload-gen", "meterpreter-payload"]),
    ("hashcat", ["crack", "mdxfind", "gpu-crack"]),
    ("john", ["jumbo", "johnny", "cpu-crack"]),
    ("responder", ["llmnr", "ntlmrelayx", "poisoning"]),
    ("sudo", ["sudoers", "privilege-escalation", "gtfobins"]),
    ("pspy", ["pspy64", "procmon", "process-snoop"]),
]
LABS = [("assets/data-modules.js", "m00", ["lab-setup", "lab-shell"])]


def alias_rows():
    path = os.path.join(ROOT, TERM)
    text = open(path, encoding="utf-8").read()
    out = []
    for name, al in ALIASES:
        if al is None:                                  # cleanup row: drop a now-shadowing alias
            mk = "c:'" + name + "'"
            if text.count(mk) != 1:
                print("!! %r matched %d times in %s" % (mk, text.count(mk), TERM))
                sys.exit(2)
            i = text.index(mk)
            j = text.find("al:[", i)
            k = text.find("]", j)
            cur = text[j:k + 1]
            keep = [t for t in re.findall(r"'([^']+)'", cur) if t.lower() != 'gobuster']
            new = "al:['" + "','".join(keep) + "']" if keep else "al:[]"
            if new == cur:
                continue                                # already applied
            out.append((path, j, cur, new))
            continue
        has = "al:['" + al[0] + "'"
        if has in text:
            continue                                    # already applied
        mk = "c:'" + name + "'"
        if text.count(mk) != 1:
            print("!! %r matched %d times in %s" % (mk, text.count(mk), TERM))
            sys.exit(2)
        i = text.index(mk)
        j = text.find("al:[", i)
        k = text.find("]", j)
        cur = text[j:k + 1]
        if j < 0 or k < 0 or cur != "al:[]" or text[i:j].count("\n") > 1:
            print("!! %s: al field is not empty on the entry (%r)" % (name, cur))
            sys.exit(2)
        out.append((path, j, "al:[]", "al:[" + "','".join(al) + "]"))
    return out


def labs_rows():
    out = []
    for rel, mid, ids in LABS:
        path = os.path.join(ROOT, rel)
        text = open(path, encoding="utf-8").read()
        want = "labs:[" + ", ".join("'%s'" % i for i in ids) + "]"
        if want in text:
            continue
        mk = "id:'" + mid + "'"
        if text.count(mk) != 1:
            print("!! %r matched %d times in %s" % (mk, text.count(mk), rel))
            sys.exit(2)
        i = text.index(mk)
        j = text.find("labs:[", i)
        k = text.find("]", j)
        if j < 0 or k < 0 or text[j:k + 1] != "labs:[]":
            print("!! %s: labs is not empty (%r)" % (mid, text[j:k + 1]))
            sys.exit(2)
        cur = "labs:[]"
        out.append((path, j, "labs:[]", "labs:[" + ", ".join("'%s'" % i for i in ids) + "]"))
    return out


def main():
    rows = alias_rows() + labs_rows()
    if not rows:
        print("nothing to do - every row already applied")
        return
    rows.sort(key=lambda r: (r[0], -r[1]))          # descending offset per file
    for path, at, old, new in rows:
        print("%s  @%d\n  - %s\n  + %s" % (os.path.relpath(path, ROOT), at, old, new))
        if APPLY:
            t = open(path, encoding="utf-8").read()
            if t[at:at + len(old)] != old:          # file moved under us -> refuse
                print("!! anchor drifted at %d in %s" % (at, path))
                sys.exit(3)
            open(path, "w", encoding="utf-8").write(t[:at] + new + t[at + len(old):])
    print("\nrows: %d   mode: %s" % (len(rows), "APPLY" if APPLY else "dry-run"))


if __name__ == "__main__":
    main()
