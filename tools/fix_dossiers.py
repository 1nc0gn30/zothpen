#!/usr/bin/env python3
"""fix_dossiers.py - repair window.ZT dossier `syntax` fields in place.

Why: the dossiers carried man-page *prose notation* -- "X   |   Y   |   Z"
alternates, "[opts]" placeholders, "use EXP/set OPT/run" console prose. The
terminal/console section was cleaned to one real command per line; the dossier
section has to read the same way or the same command looks like two things.

Contract per row: (id, expected_old, new).
  * find the object literal for `id`, read its `syntax:` literal
  * if it already equals `new`      -> "-- already applied", skip (idempotent)
  * if it differs from expected_old -> abort the whole run, print what is on
    disk, so a stale row can never silently rewrite newer content
  * otherwise rewrite the literal

Values are written with real \\n escapes, which is what codeBlock() splits on.

Usage:
  python3 tools/fix_dossiers.py            # dry run, prints diffs
  python3 tools/fix_dossiers.py --apply    # writes
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
FILES = ["data-tools.js", "data-tools2.js", "data-tools3.js", "data-tools4.js"]
APPLY = "--apply" in sys.argv

# ---------------------------------------------------------------- new values
# One real command per line. UPPERCASE = placeholder you substitute.
# '#' starts a comment. No angle brackets: bash reads < as a redirect.
ROWS = [
    ("t-grep",
     "grep [opts] PATTERN FILE | awk -F: '{print $2}' | sed 's/a/b/g' | cut -d/ -f1",
     "grep -rEi \"password\" /var/www --include='*.php'\n"
     "awk -F: '{print $1\":\"$3}' /etc/passwd | sort -t: -k2 -n\n"
     "sed -i 's/old-token/new-token/g' ./config.php"),

    ("t-tmux", "tmux new -s NAME   |   Ctrl-b d detach   |   tmux attach -t NAME",
     "tmux new -s RECON\n"
     "# Ctrl-b d detaches; reopen the session with:\n"
     "tmux attach -t RECON"),

    ("t-git", "git init/add/commit/push  |  git log --oneline --all  |  git log -p -- path",
     "git init && git add -A && git commit -m 'engagement notes'\n"
     "git log --oneline --all\n"
     "git log -p -- notes/recon.md"),

    ("t-ssh", "ssh [-i key] user@host  |  ssh -L lport:host:port  |  ssh -D 1080 -N -f",
     "ssh -i ~/.ssh/id_ed25519 USER@TARGET\n"
     "ssh -L 8080:127.0.0.1:80 USER@TARGET\n"
     "ssh -D 1080 -N -f USER@TARGET"),

    ("t-nc", "nc [opts] host port   |   nc -lvnp PORT",
     "nc -nv TARGET PORT\n"
     "nc -lvnp 4444"),

    ("t-amass", "amass enum -passive -d example.com -o out.txt   |   amass intel -asn 12345",
     "amass enum -passive -d example.com -o out.txt\n"
     "amass intel -asn 12345"),

    ("t-shodan", "shodan search QUERY   |   shodan host IP   |   shodan stats --facets ... QUERY",
     "shodan search 'product:nginx country:US'\n"
     "shodan host 8.8.8.8\n"
     "shodan stats --facets org 'apache'"),

    ("t-nmap", "nmap [scan type] [options] {targets}   e.g.  nmap -sS -sV -sC -p- -oA out -T4 10.10.10.5",
     "nmap -sS -sV -sC -p- -oA out -T4 TARGET\n"
     "nmap -sn 10.10.10.0/24"),

    ("t-enum4linux", "enum4linux-ng -A TARGET [-oJ out.json]   |   enum4linux -a TARGET",
     "enum4linux-ng -A TARGET -oJ out.json\n"
     "enum4linux -a TARGET"),

    ("t-netexec", "nxc PROTOCOL TARGET -u USER -p PASS ACTION [options]",
     "nxc smb TARGET -u USER -p 'PASS' --shares\n"
     "nxc ldap TARGET -u USER -p 'PASS' --users"),

    ("t-zap", "zap.sh -daemon -port 8090 -host 127.0.0.1   |   zap-cli / API calls",
     "zap.sh -daemon -port 8090 -host 127.0.0.1\n"
     "zap-cli quick-scan --self-contained --spider -r http://TARGET"),

    ("t-sqlmap", "sqlmap -u \"URL?id=1\" [--batch] [--dbs|--tables|--dump]  |  sqlmap -r request.txt -p id",
     "sqlmap -u 'http://TARGET/item.php?id=1' --batch --dbs\n"
     "sqlmap -r request.txt -p id --batch --tables"),

    ("t-curl", "curl [options] URL",
     "curl -sS -D- -o /dev/null http://TARGET\n"
     "curl -sS -x http://127.0.0.1:8080 http://TARGET"),

    ("t-searchsploit", "searchsploit TERM   |   searchsploit --nmap scan.xml   |   searchsploit -m ID",
     "searchsploit apache 2.4\n"
     "searchsploit --nmap scan.xml\n"
     "searchsploit -m 50383"),

    ("t-metasploit", "msfconsole -q -r script.rc   |   use EXPLOIT / set OPTION VALUE / run",
     "msfconsole -q -r handler.rc\n"
     "msfconsole -q -x 'use auxiliary/scanner/smb/smb_version; set RHOSTS TARGET; run'"),

    ("t-hashid", "hashid HASH   |   hashid -f file",
     "hashid -m 5f4dcc3b5aa765d61d8327deb882cf99\n"
     "hashid -f hashes.txt"),

    ("t-hashcat", "hashcat -m MODE -a ATTACK hashes.txt wordlist [rules]",
     "hashcat -m 1000 -a 0 ntlm.txt /usr/share/wordlists/rockyou.txt\n"
     "hashcat -m 1000 -a 0 ntlm.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule"),

    ("t-john", "john [--format=NAME] [--wordlist=LIST] hashes_file   |   TOOL2john file > hash.txt",
     "john --format=NT --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt\n"
     "python3 /usr/share/john/ssh2john.py id_rsa > id_rsa.hash"),

    ("t-hydra", "hydra -l USER -P wordlist.txt TARGET PROTOCOL [options]",
     "hydra -l admin -P /usr/share/wordlists/rockyou.txt TARGET ssh\n"
     "hydra -L users.txt -p 'Password1' TARGET smb"),

    ("t-responder", "sudo responder -I eth0 [-wv] [-A] [-F]   |   sudo responder -I eth0 -w -d",
     "sudo responder -I eth0 -wv\n"
     "sudo responder -I eth0 -w -d"),

    ("t-impacket", "impacket-TOOL [args]   |   e.g. impacket-psexec DOMAIN/user:pass@target",
     "impacket-psexec DOMAIN/USER:'PASS'@TARGET\n"
     "impacket-secretsdump DOMAIN/USER:'PASS'@TARGET\n"
     "impacket-GetUserSPNs DOMAIN/USER:'PASS' -dc-ip DC -request"),

    ("t-evilwinrm", "evil-winrm -i TARGET -u USER -p PASS   |   -H NTHASH   |   -c cert.pem -k key.pem",
     "evil-winrm -i TARGET -u USER -p 'PASS'\n"
     "evil-winrm -i TARGET -u USER -H NTHASH\n"
     "evil-winrm -i TARGET -u USER -c cert.pem -k key.pem -S"),

    ("t-linpeas",
     "curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh   |   ./linpeas.sh -a",
     "curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh -o linpeas.sh\n"
     "chmod +x linpeas.sh && ./linpeas.sh -a"),

    ("t-chisel", "server: chisel server -p 8000 --reverse      |      client: ./chisel client 10.10.14.9:8000 R:socks",
     "# attacker\n"
     "./chisel server -p 8000 --reverse\n"
     "# target\n"
     "./chisel client ATTACKER_IP:8000 R:socks"),

    ("t-proxychains", "proxychains4 -q COMMAND   |   proxychains4 TARGET DELAY PORT",
     "proxychains4 -q nmap -sT -Pn -p 445 10.10.10.5\n"
     "proxychains4 -q nxc smb TARGET -u USER -p 'PASS'"),

    ("t-socat", "socat [opts] ADDRESS1 ADDRESS2",
     "socat TCP-LISTEN:4444,reuseaddr,fork TCP:127.0.0.1:8080\n"
     "socat -d -d TCP-LISTEN:5353,fork UDP:8.8.8.8:53"),

    ("t-wireshark", "sudo tcpdump -i eth0 -w capture.pcap [BPF FILTER]   |   wireshark capture.pcap",
     "sudo tcpdump -i eth0 -w capture.pcap 'tcp port 445'\n"
     "wireshark capture.pcap"),

    ("t-markdown", "pandoc report.md -o report.pdf --pdf-engine=xelatex --toc   |   pandoc report.md -o report.docx",
     "pandoc report.md -o report.pdf --pdf-engine=xelatex --toc\n"
     "pandoc report.md -o report.docx"),

    ("t-mimikatz",
     "mimikatz # sekurlsa::logonpasswords   |   impacket-secretsdump DOMAIN/u:p@HOST   |   pypykatz lsa minidump lsass.dmp",
     "impacket-secretsdump DOMAIN/USER:'PASS'@TARGET\n"
     "pypykatz lsa minidump lsass.dmp\n"
     "# inside mimikatz itself:\n"
     "# sekurlsa::logonpasswords"),

    ("t-wifite", "sudo wifite --dict /usr/share/wordlists/rockyou.txt   |   --wpa --pmkid --kill",
     "sudo wifite --wpa --pmkid --kill --dict /usr/share/wordlists/rockyou.txt\n"
     "sudo wifite -i wlan0mon --wps"),
]


def jsq(s):
    """Encode for the inside of a JS single-quoted literal."""
    return (s.replace("\\", "\\\\").replace("'", "\\'")
             .replace("\r", "").replace("\n", "\\n"))


def unesc(raw):
    return (raw.replace("\\n", "\n").replace("\\'", "'")
               .replace('\\"', '"').replace("\\\\", "\\"))


def find_syntax_literal(text, entry_id):
    """(start, end, value) spanning the inside of the `syntax:` literal."""
    m = re.search(r"id\s*:\s*'%s'" % re.escape(entry_id), text)
    if not m:
        return None
    rest = text[m.end():]
    nxt = re.search(r"\bid\s*:\s*'", rest)
    window = rest[:nxt.start()] if nxt else rest
    s = re.search(r"[\s{,]" + r"syntax\s*:\s*", window)
    if not s:
        return None
    i = m.end() + s.end()
    quote = text[i]
    if quote not in "'\"":
        return None
    j, buf = i + 1, []
    while j < len(text):
        c = text[j]
        if c == "\\":
            buf.append(text[j:j + 2])
            j += 2
            continue
        if c == quote:
            break
        buf.append(c)
        j += 1
    return i + 1, j, unesc("".join(buf))


def main():
    resolved = 0
    for fn in FILES:
        path = os.path.join(ASSETS, fn)
        text = open(path, encoding="utf-8").read()
        orig = text
        for entry_id, want_old, new in ROWS:
            hit = find_syntax_literal(text, entry_id)
            if hit is None:
                continue
            a, b, on_disk = hit
            if on_disk == new:
                print("-- already applied: %s" % entry_id)
                continue
            if on_disk != want_old:
                print("!! STALE ROW for %s in %s\n   on disk : %r\n   expected: %r"
                      % (entry_id, fn, on_disk, want_old))
                sys.exit(2)
            print("=== %s (%s) ===" % (entry_id, fn))
            for l in want_old.split("\n"):
                print("  - %s" % l)
            for l in new.split("\n"):
                print("  + %s" % l)
            text = text[:a] + jsq(new) + text[b:]
            resolved += 1
        if text != orig:
            if APPLY:
                open(path, "w", encoding="utf-8").write(text)
                print(">> wrote %s" % fn)
            else:
                print(">> %s changed (%d rows in file)" % (fn, text.count("\n") and 1 or 1))
    print("\nrows: %d   edits resolved: %d   mode: %s"
          % (len(ROWS), resolved, "APPLY" if APPLY else "dry-run"))


if __name__ == "__main__":
    main()
