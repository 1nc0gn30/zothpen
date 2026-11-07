/* ==========================================================================
   ZothPen — tool dossiers (part 4: foundations & protocol clients).
   Appends to window.ZT. Same schema as parts 1-3:
   {id,name,kind,phases,pkg,tagline,what,syntax,flags[{f,d}],examples[{t,cmd,out?}],
    opsec[],tips[],links[{t,u}],related[]}
   ========================================================================== */
window.ZT.push(

{ id:'t-linux-basics', name:'Linux that matters for pentesting', kind:'reference', phases:['FOUNDATION'],
  pkg:'every Kali/Parrot install',
  tagline:'Pipes, permissions, processes and permissions: the four things you will use in every single session.',
  what:'Before any security tool matters you need to move around a Linux host comfortably: find files by attribute, read permissions correctly, chain commands with pipes, manage processes and jobs, and understand who you are allowed to be. Everything in this manual assumes this layer.',
  syntax:'man TOPIC | cmd | cmd | cmd   # pipes: stdout of the left becomes stdin of the right',
  flags:[
    {f:'find', d:'Colloquially a search tool. Its real power is matching metadata: -perm, -user, -newer, -size, -exec.'},
    {f:'grep -rEi', d:'-r recursive, -E extended regex, -i case-insensitive. The single most used command in this manual.'},
    {f:'xargs -0', d:'Turn NUL-separated stdin (from find -print0) into arguments safely, even with spaces in filenames.'},
    {f:'awk / cut / sort -u', d:'Extract a column, dedupe, count. Most enumeration is: tool output -> extract -> sort -u -> feed the next tool.'},
    {f:'chmod / chown / ls -l', d:'Read permission triples as owner/group/other and always ask "who is the OTHER here?" That is the escalation.'},
    {f:'nohup … &  /  disown', d:'Detach a job so it survives your shell exiting — the difference between a scan that finishes and one that dies at logout.'},
    {f:'ss -tulpn', d:'Modern replacement for netstat -tulpn: TCP/UDP, listening only, with the owning process.'},
    {f:'journalctl -u X -f', d:'Follow a systemd unit\'s log. On modern hosts this is where service errors live, not /var/log/messages.'}
  ],
  examples:[
    {t:'Find every world-writable directory on the real filesystem (privesc recon in one line)',
     cmd:"find / -xdev -type d -perm -0002 ! -path '*/proc/*' ! -path '*/sys/*' 2>/dev/null",
     out:'/tmp\n/var/tmp\n/opt/backup   <- the interesting one'},
    {t:'Chain tools the way you will in every lab: output -> extract -> dedupe -> actionable list',
     cmd:"nmap -p- --min-rate 2000 -n 192.168.56.0/24 -oG - | grep -oE '[0-9]+/open/tcp' | cut -d/ -f1 | sort -un | paste -sd,",
     out:'22,80,139,445,3306,5985'},
    {t:'Read permissions correctly on a sensitive file',
     cmd:'ls -l /etc/shadow /root/.my.cnf; stat -c "%a %U:%G %n" /etc/shadow',
     out:'-rw-r----- 1 root shadow 1234 /etc/shadow\n640 root:shadow /etc/shadow'},
    {t:'Package management on both distributions (Kali is Debian/apt, Parrot is Debian/apt but adds its own repos)',
     cmd:'sudo apt update && sudo apt install -y netexec; apt-cache search kerberos | grep -i krb5; dpkg -S $(which nmap)',
     out:'netexec is already the newest version\nkrb5-user - Basic programs to authenticate using MIT Kerberos'}
  ],
  opsec:['`history` is evidence. Set HISTCONTROL=ignoreboth and prefix sensitive lines with a space, or the next person on that host reads your credentials.','Do not `chmod 777` to fix a problem on a live host. It is a finding you created. Find the correct ownership instead.'],
  tips:['Learn one pipeline deeply: grep -rEi PATTERN PATHS | awk -F: "{print $1}" | sort -u | tee hits.txt | xargs -r -I{} cmd {}. It covers most enumeration you will ever do.','When a tool outputs colours and boxes, pipe through `cat -v` or `sed -r "s/\\x1B\\[[0-9;]*[mK]//g"` to get text you can parse.'],
  links:[{t:'Linux man pages online', u:'https://man7.org/linux/man-pages/'},{t:'The Linux Command Line (free)', u:'https://linuxcommand.org/tlcl.php'}],
  related:['t-bash','t-gtfobins','t-linpeas'] },

{ id:'t-python', name:'Python for tooling and customisation', kind:'reference', phases:['FOUNDATION','MASTERY'],
  pkg:'preinstalled; pipx for tools',
  tagline:'Fastest route from "this output is unparseable" to "here is a script that chains it" — and the language every exploitation framework speaks.',
  what:'Python is the pentester\'s second language: impacket for Windows protocols, scapy for packets, pwntools for binary exploitation, and a hundred lines of argparse+requests when a web target needs bespoke handling. The skill is not writing frameworks — it is writing a 40-line parser in eight minutes because your next step depends on it.',
  syntax:'python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt',
  flags:[
    {f:'argparse', d:'Standard-library CLI parsing with help text. Use it the moment a script takes more than one argument.'},
    {f:'requests.Session + verify=False', d:'Deliberate session for cookie/header persistence; verify=False plus urllib3 warning suppression for the self-signed certs every lab target has.'},
    {f:'re / json / csv', d:'Parse, structure, emit. JSON on stdout makes your script composable with anything.'},
    {f:'concurrent.futures', d:'ThreadPoolExecutor for I/O-bound work: 20 concurrent checks with a fixed max_workers is the sweet spot.'},
    {f:'subprocess.run(capture_output=True, text=True)', d:'Wrap an existing tool, keep its exit code, and parse its stdout in the same script.'},
    {f:'pipx', d:'Install and run CLI tools from PyPI in isolated environments so they do not fight your distro Python.'},
    {f:'sys.stdin read loop', d:'Scripts that read stdin and write stdout chain with everything else. Build them that way by default.'}
  ],
  examples:[
    {t:'A parser that turns a tool\'s text output into JSON on stdout (the highest-value 20 lines you will write)',
     cmd:`#!/usr/bin/env python3
import sys, json, re
pat = re.compile(r"^\\s*(?P<host>[0-9.]+)\\s+(?P<port>\\d+)\\s+(?P<svc>\\S+).*?(?P<banner>\\S.*)?$")
out = [m.groupdict() for m in (pat.match(l) for l in sys.stdin) if m]
json.dump(out, sys.stdout, indent=1)`,
     out:'[\n {\n  "host": "192.168.56.20",\n  "port": "445",\n  "svc": "microsoft-ds"\n }\n]'},
    {t:'Wrap an existing tool so its output is parseable and its exit code is preserved',
     cmd:`python3 - <<'PY'
import subprocess, json
p = subprocess.run(["nmap","-sV","-p","22,80,445","-oX","-","192.168.56.20"], capture_output=True, text=True)
import xml.etree.ElementTree as ET
root = ET.fromstring(p.stdout)
ports = [{"port": pe.get("portid"), "svc": pe.find("service").get("name")}
         for pe in root.iter("port") if pe.find("state").get("state") == "open"]
print(json.dumps(ports, indent=1)); raise SystemExit(p.returncode)
PY`, out:'[\n {"port": "22", "svc": "ssh"},\n {"port": "445", "svc": "microsoft-ds"}\n]'},
    {t:'Concurrency for a slow check, bounded so you do not flood the target',
     cmd:`python3 - <<'PY'
from concurrent.futures import ThreadPoolExecutor
import socket
def check(h):
    s = socket.socket(); s.settimeout(1.5)
    try: s.connect((h, 5985)); return h
    except Exception: return None
    finally: s.close()
hosts = [f"192.168.56.{i}" for i in range(1, 255)]
with ThreadPoolExecutor(max_workers=20) as ex:
    hits = [h for h in ex.map(check, hosts) if h]
print("WinRM open:", hits)
PY`, out:'WinRM open: [\'192.168.56.20\', \'192.168.56.25\']'}
  ],
  opsec:['Never `pip install` untrusted packages into your system Python. Use a venv or pipx; a malicious typosquat on PyPI is a backdoor in your tooling.','Hash your own scripts before you copy them to a target, and delete them afterwards. A dropped script is an artefact a defender will find.'],
  tips:['Learn impacket as a library, not just its CLI scripts. `python3 -c "from impacket.smbconnection import SMBConnection"` plus 15 lines replaces most one-off SMB work.','Emit JSON from every custom script. It is the only format that composes with everything else you will build.'],
  links:[{t:'impacket', u:'https://github.com/fortra/impacket'},{t:'scapy', u:'https://scapy.readthedocs.io/'},{t:'pwntools', u:'https://docs.pwntools.com/'}],
  related:['t-impacket','t-bash','t-nmap'] },

{ id:'t-dns', name:'DNS enumeration and abuse', kind:'tool', phases:['RECON','EXPLOIT'],
  pkg:'dnsutils, dnsrecon, dnsenum, dnstt, iodine (preinstalled on Kali/Parrot)',
  tagline:'DNS is the most-forgotten protocol in scope and the best out-of-band channel in the room.',
  what:'DNS gives you two things: an inventory of the client\'s namespaces (often revealing internal hosts nothing else exposes) and, when port 53 egress is allowed, a tunnel that survives almost every firewall rule. Both live in the same toolkit.',
  syntax:'dig AXFR DOMAIN @NS | dnsrecon -d DOMAIN -t std,brt | dnsenum DOMAIN | dnstt/iodine for tunnels',
  flags:[
    {f:'dig +short', d:'Clean output for scripting. Add +noall +answer to see the record type and TTL when you need them.'},
    {f:'dig AXFR @ns1.domain.tld', d:'Zone transfer. A success is a critical finding: it hands over every hostname in the zone at once.'},
    {f:'dig ANY @ns', d:'With DNSSEC-algorithm 13 (RFC 8482) minimal responses this is mostly dead. Try it, then move on — do not over-invest.'},
    {f:'dig -x IP', d:'Reverse lookup. PTR records name internal hosts that forward lookups never expose.'},
    {f:'dnsrecon -t brt -D wordlist', d:'Dictionary brute force of subdomains, with -t std for standard records and -t axfr for transfers.'},
    {f:'dnsenum --enum', d:'Aggressive aggregate: transfer, brute force, Google scraping, reverse lookups.'},
    {f:'dnsx / puredns', d:'Fast resolver-based brute forcing on modern wordlists; puredns filters wildcards properly, which naive loops do not.'},
    {f:'iodine / dnstt', d:'Tunnel IP over DNS. The fallback when an egress firewall allows only a resolver and nothing else.'}
  ],
  examples:[
    {t:'Test zone transfer on every authoritative nameserver at once',
     cmd:'for ns in $(dig +short NS lab.local); do echo "== $ns"; dig AXFR lab.local @"$ns" +noall +answer | head -40; done',
     out:'== ns1.lab.local.\nlab.local.  3600  IN  SOA  ns1.lab.local. hostmaster.lab.local. 2026010101 ...\nintranet.lab.local. 3600 IN A 192.168.57.25\nvpn.lab.local.      3600 IN A 192.168.57.10   <- internal namespace leaked'},
    {t:'Brute force subdomains against a resolvable wordlist',
     cmd:'dnsrecon -d lab.local -t brt -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --iw',
     out:'[+] A intranet.lab.local 192.168.57.25\n[+] A web.lab.local 192.168.56.30\n[+] A dc01.lab.local 192.168.56.10'},
    {t:'Reverse-sweep a subnet for PTR names — the step everyone skips',
     cmd:'for i in $(seq 1 40); do dig +short -x 192.168.56.$i; done | grep -v "^$" | sort',
     out:'dc01.lab.local.\nwin-target.lab.local.\nlab-target.lab.local.'},
    {t:'Confirm whether DNS egress is a tunnel opportunity (lab only)',
     cmd:'dig +short TXT probe.$(hostname).lab.local @192.168.56.10; nc -zvu 192.168.56.10 53 && echo "UDP/53 open"',
     out:'UDP/53 open   # a resolver reachable from a compromised host is usually enough for iodine/dnstt'}
  ],
  opsec:['DNS brute forcing hits a resolver thousands of times per second. Throttle it and inform the client: a resolver outage is an own goal.','Tunnelling over the client\'s resolver generates traffic volume that a decent NDR will flag as beaconing. Know that you are choosing to be visible.','An AXFR is a finding, not a licence: do not exfiltrate the full zone if you only need three records — collect the proof and stop.'],
  tips:['Always try the transfer first: it is one packet, sometimes the whole namespace, and it is the cheapest recon win in the book.','Compare brute-forced hostnames with the certificate transparency logs (crt.sh) for the same domain. Between the two you rarely miss a public-facing host.'],
  links:[{t:'RFC 8482 (minimal ANY)', u:'https://datatracker.ietf.org/doc/html/rfc8482'},{t:'dnsrecon', u:'https://github.com/darkoperator/dnsrecon'},{t:'HackTricks — DNS', u:'https://book.hacktricks.xyz/network-services-pentesting/pentesting-dns'}],
  related:['t-dnsrecon-doc','t-subfinder','t-crt-sh'] },

{ id:'t-whois', name:'WHOIS, RDAP and public registries', kind:'tool', phases:['RECON'],
  pkg:'whois, rdap (Kali/Parrot)',
  tagline:'Ownership, nameservers and the contact that tells you whether you are allowed to scan at all.',
  what:'WHOIS and its modern replacement RDAP give you the registered owner, the authoritative nameservers (your next recon target), the registration dates, and the abuse contact. In an engagement it establishes scope; in an assessment it reveals where the perimeter actually is — including the acquisitions nobody told you about.',
  syntax:'whois DOMAIN\nrdap DOMAIN                    # same data as structured JSON\nwhois -h whois.arin.net \'!NET-1.2.3.0\'',
  flags:[
    {f:'-h HOST', d:'Query a specific registry directly: whois.arin.net, whois.ripe.net, whois.apnic.net, whois.afrinic.net.'},
    {f:'!  or  -r', d:'ARIN-style "!" prefix / -r for the raw referral records without their formatting.'},
    {f:'rdap URL', d:'Modern JSON API on port 443. Scriptable and stable: curl -s https://rdap.org/domain/lab.local | jq .'}
  ],
  examples:[
    {t:'Ownership and nameservers for a domain, scripted',
     cmd:'whois lab.local | grep -iE \"registrar|name server|creation|expiry|abuse|org\" | head -12',
     out:'Registrar: ...\nName Server: NS1.LAB.LOCAL\nCreation Date: 2021-03-04T00:00:00Z\nRegistrant Organization: Lab Holdings Ltd'},
    {t:'Who actually owns this IP block (and what netrange to put in scope)',
     cmd:'whois 192.168.56.20 | grep -iE \"netrange|cidr|orgname|country|abuse\"',
     out:'NetRange: 192.168.0.0 - 192.168.255.255\nOrgName: Lab Range (RFC1918 — private, ownership is the client\'s own)'},
    {t:'Small domains with a registrant caught in the record',
     cmd:'curl -s https://rdap.org/domain/example.com | jq \"{.ldhName, .nameservers[].ldhName, .events, .entities[].vcardArray[1][]}\" | head -30',
     out:'"example.com"\n"a.iana-servers.net"\n{"eventAction": "registration", "eventDate": "1995-08-14T04:00:00Z"}'}
  ],
  opsec:['WHOIS is public and logged by the registry, but brute-forcing contact details at scale gets your IP blocked and hints at your activity. Do it once, properly, then move on.','The abuse contact is not the person who authorised your test. Do not "call WHOIS" to establish permission you were not given in writing.'],
  tips:['Nameservers found in WHOIS are the first DNS targets: try the zone transfer against each of them before you brute force anything.','Reverse WHOIS is a genuine scope-expansion tool. When a client says "just this domain", the registrant\'s other domains are how you discover the subsidiary nobody mentioned — and the day they matter is the day you ask in writing before testing them.'],
  links:[{t:'RDAP.org aggregator', u:'https://rdap.org/'},{t:'IANA WHOIS registry list', u:'https://www.iana.org/domains/root/db'}],
  related:['t-dns','t-subfinder','t-legal'] },

{ id:'t-smbclient', name:'smbclient / SMB protocol clients', kind:'tool', phases:['RECON','EXPLOIT'],
  pkg:'smbclient, impacket (preinstalled on Kali/Parrot)',
  tagline:'The manual SMB client: when you need to see exactly what the server says, not a tool\'s summary of it.',
  what:'netexec is for scale; smbclient is for understanding. It speaks the protocol directly, so when an automated tool reports "access denied" you can see which phase failed, what dialect was negotiated and whether signing or hardening broke you. It also reads what a share actually contains.',
  syntax:'smbclient -L //HOST -N\nsmbclient //HOST/SHARE -U HOST/USER\nsmbclient.py USER:PASS@HOST    # impacket',
  flags:[
    {f:'-L //HOST', d:'List shares. Add -N for a null session and -U HOST/USER for authenticated.'},
    {f:'-N', d:'No password (null session). Increasingly refused by default, but on older hosts it is the first thing to try.'},
    {f:'-U DOMAIN/USER%PASS', d:'Credentials inline. Prefer an interactive prompt or a pass-the-hash form so the password never lands in shell history.'},
    {f:'--pw-nt-hash', d:'Pass-the-hash: supply the NT hash instead of a plaintext password.'},
    {f:'-m SMB3', d:'Force the dialect. When a modern host refuses ancient dialects, this is the difference between working and "protocol negotiation failed".'},
    {f:'-c "recurse ON; prompt OFF; mget *"', d:'The bulk-download one-liner. Run `ls` first and check the size, or you will pull a 400 GB backup over the tunnel.'},
    {f:'-D PATH  /  cd, ls, get, put', d:'Navigate and transfer within a session, like a crude FTP.'},
    {f:'-p 445 / -p 139', d:'Port selection when 445 is filtered and you must fall back to NetBIOS over TCP.'}
  ],
  examples:[
    {t:'List shares and read a share that should not be readable',
     cmd:"smbclient -L //192.168.56.20 -U 'LAB/alice%Password1' -m SMB3",
     out:'Sharename  Type  Comment\n---------  ----  -------\nSHARE      Disk\nIPC$       IPC   Remote IPC'},
    {t:'Download everything from a readable share and grep for credentials',
     cmd:"mkdir -p loot && cd loot && smbclient //192.168.56.20/SHARE -U 'LAB/alice%Password1' -c 'recurse ON; prompt OFF; mget *' >/dev/null && grep -rEli 'password|secret|api' . | head",
     out:'./scripts/deploy.bat\n./it/creds.txt'},
    {t:'Pass-the-hash, which netexec will do but smbclient shows you explicitly',
     cmd:'smbclient //192.168.56.20/C$ -U LAB/administrator --pw-nt-hash=aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c -m SMB3 -c "ls"',
     out:'  .                                   D        0  Mon Oct 20 09:00:00 2026\n  ..                                  D        0  Mon Oct 20 09:00:00 2026'},
    {t:'Diagnose why a scan failed: read the negotiation itself',
     cmd:'smbclient -L //192.168.56.20 -N -d 3 2>&1 | grep -iE "negotiated|dialect|signing|NT_STATUS" | head',
     out:'negotiated dialect[SMB3_11] ... signing required: yes\nNT_STATUS_ACCESS_DENIED listing \\\\192.168.56.20\\*'}
  ],
  opsec:['Every SMB session is logged on the target with your source IP and account. Null sessions are extremely loud on modern hosts.','Do not -mget * from a share you do not own: the transfer time itself is the detection, and you may pull data far outside the agreed scope.'],
  tips:['When netexec says "share not accessible" but you believe credentials work, run smbclient with -d 3: the NT_STATUS tells you whether it is credentials, signing, dialect or ACLs.','impacket\'s smbclient.py is the scriptable sibling. Use it when you want to loop over shares inside a Python script instead of shelling out.'],
  links:[{t:'Samba smbclient man page', u:'https://www.samba.org/samba/docs/current/man-html/smbclient.1.html'},{t:'impacket smbclient.py', u:'https://github.com/fortra/impacket/blob/master/examples/smbclient.py'}],
  related:['t-netexec','t-impacket','t-smb-enum-doc'] },

{ id:'t-recon-ng', name:'Recon-ng (recon framework)', kind:'suite', phases:['RECON'],
  pkg:'recon-ng  (apt install recon-ng)',
  tagline:'A database with modules bolted on: recon that compounds instead of scattering output across fifty terminal windows.',
  what:'Recon-ng\'s real value is that it stores everything in SQLite and lets one module consume another\'s output. You run a module, query the workspace, and pivot: contacts become email patterns, domains become hosts, hosts become shodan lookups. For engagements with dozens of domains it beats ad-hoc commands; for one host it is overhead.',
  syntax:'recon-ng -w lab            # then, at the recon-ng prompt:\nmarketplace install all\nrun recon/domains-hosts/hackertarget',
  flags:[
    {f:'workspaces create NAME', d:'One workspace per engagement. Keep client A\'s data out of client B\'s report — this is a data-handling requirement, not tidiness.'},
    {f:'marketplace search / install', d:'Modules are downloaded on demand. `marketplace search shodan` then `marketplace install recon/domains-hosts/shodan_hostname`.'},
    {f:'db insert domains', d:'Seed the run: one domain per line, then let modules expand it into hosts, contacts and ports.'},
    {f:'show hosts / show contacts / show ports', d:'Query the workspace. `db query SELECT host FROM hosts WHERE ip_address IS NULL` is the syntax when the built-ins are not enough.'},
    {f:'run <module>', d:'Execute against everything in scope by default. Set SOURCE/options first with `options set SOURCE x` to constrain it.'},
    {f:'spool / report', d:'Start logging to a file; generate a report from the workspace rather than reassembling output by hand.'},
    {f:'profiles', d:'Saves API keys (Shodan, Censys, HIBP) once and reuses them across modules.'}
  ],
  examples:[
    {t:'Standard pass over one client domain',
     cmd:`recon-ng -w lab
[recon-ng][lab] > db insert domains
domain (TEXT): lab.local

[recon-ng][lab] > run recon/domains-hosts/hackertarget
[*] [host] intranet.lab.local (192.168.57.25)
[recon-ng][lab] > show hosts`, out:'intranet.lab.local   192.168.57.25\nweb.lab.local        192.168.56.30'},
    {t:'Query the workspace directly instead of reading scrollback',
     cmd:'recon-ng -w lab -C "db query SELECT host,ip_address FROM hosts WHERE ip_address IS NOT NULL"',
     out:'intranet.lab.local|192.168.57.25\nweb.lab.local|192.168.56.30'},
    {t:'Chain a module onto an earlier module\'s output',
     cmd:`[recon-ng][lab] > run recon/companies-contacts/bing_linkedin_cache
[recon-ng][lab] > show contacts
[recon-ng][lab] > run recon/contacts-credentials/hibp_breach`, out:'alice@lab.local  -> 3 breaches (hibp)\nbob@lab.local    -> 1 breach (hibp)'}
  ],
  opsec:['Modules hit third-party APIs (Shodan, Censys, HIBP). That traffic tells those services what you are investigating, and free tiers rate-limit quickly.','Storing client data in a workspace means storing client data on your disk. Delete workspaces at the end of an engagement, as your data-handling agreement says.'],
  tips:['Recon-ng is the right tool when the client has 40 domains and you need to keep track. For one /24 it is extra ceremony — plain nmap and curl are faster.','`marketplace install all` is tempting and slow. Install the four or five modules that map to your methodology.'],
  links:[{t:'recon-ng', u:'https://github.com/lanmaster53/recon-ng'}],
  related:['t-theharvester','t-shodan-cli','t-amass'] },

{ id:'t-zothpen', name:'ZothPen & ZothPen-Lite (Sovereign Offensive OS)', kind:'suite', phases:['FOUNDATION','RECON','EXPLOIT','POST'],
  pkg:'zothpen-iso (Debian Bookworm Live toram) / zothpen-lite (https://zothos.nullai.tech)',
  tagline:'Amnesic RAM-only Debian Live ISO and zero-egress browser workstation with Pentesting Dojo, Chain of Thoughts MCP, and Vaelor Vault.',
  what:'ZothPen operates in two forms that share the exact same offensive methodology as Kali Linux and Parrot OS: (1) ZothPen Live ISO — a Debian Bookworm Live system built for `toram` RAM-only execution, nftables Tor kill-switch (`zoth-tor-switch`), and zero disk forensic residue; and (2) ZothPen-Lite (`zothos.nullai.tech`) — an instant in-browser desktop workstation featuring the interactive Pentesting Dojo (16 guided red-team missions + diploma), Chain of Thoughts DAG reasoning studio, Vaelor Zero-Knowledge Vault (Argon2id + AES-256-GCM), Neuro-Memory 3D engram graph, and Obsidian Second Brain.',
  syntax:'sudo zoth-tor-switch start | status | stop    # ZothPen Live ISO nftables Tor routing\ndojo start <mission-id>                       # ZothPen-Lite Pentesting Dojo CLI',
  flags:[
    {f:'toram (GRUB boot param)', d:'Copies the entire SquashFS root filesystem into volatile RAM at boot so the boot USB/NVMe can be physically removed.'},
    {f:'zoth-tor-switch start/stop/status', d:'Enforces transparent Tor routing via nftables and blocks non-Tor UDP traffic to prevent DNS or WebRTC leaks during passive OSINT.'},
    {f:'Pentesting Dojo (ZothPen-Lite)', d:'Interactive in-browser terminal training ground with 16 red-team missions across Recon, SQLi, Privesc, SMB/AD, and Cryptographic OpSec.'},
    {f:'Vaelor Zero-Knowledge Vault', d:'Client-side authenticated encryption (Argon2id + AES-256-GCM + Ed25519 signing) for storing recovered credentials and engagement notes.'},
    {f:'Obsidian Second Brain + Neuro-Memory 3D', d:'Links CVE notes, host dossiers, and lab findings into an interactive 3D STDP engram graph.'}
  ],
  examples:[
    {t:'Verify amnesic RAM boot and lock egress to Tor on ZothPen Live ISO',
     cmd:'grep -o "toram" /proc/cmdline && sudo zoth-tor-switch start && sudo zoth-tor-switch status',
     out:'toram\n[✓] zoth-tor-switch: ACTIVE (nftables UID->9040, DNS->9053, raw UDP blocked)'},
    {t:'Switch to direct interface routing before scanning a local 192.168.56.0/24 lab range',
     cmd:'sudo zoth-tor-switch stop && nmap -sS -p- --min-rate 2000 -n 192.168.56.20 -oA /dev/shm/scan',
     out:'[✓] zoth-tor-switch: DIRECT mode restored\nNmap scan report for 192.168.56.20 (5 open ports)'},
    {t:'Run the same workflow on any standard Linux (Kali, Parrot, Debian, Ubuntu) via /dev/shm',
     cmd:'mkdir -p /dev/shm/op && chmod 700 /dev/shm/op && cd /dev/shm/op',
     out:'Volatile tmpfs workspace ready on any POSIX Linux host'}
  ],
  opsec:['Never run high-rate port scans (nmap -sS, masscan) while zoth-tor-switch or Parrot anonsurf is active — Tor circuits are TCP-only and meant for passive OSINT, not active scanning.','In toram mode, everything in RAM vanishes on poweroff. Export your encrypted Vaelor archive or signed report before shutting down.'],
  tips:['Use ZothPen-Lite (https://zothos.nullai.tech) when you want to practice terminal drills, map attack trees in Chain of Thoughts, or test regex/parsers without spinning up a 16 GB hypervisor.','Every command taught for ZothPen works identically on Kali Linux, Parrot OS, Debian, Ubuntu, and Arch Linux.'],
  links:[{t:'ZothPen-Lite Live Web Workstation', u:'https://zothos.nullai.tech'},{t:'NullAI Platform & Research', u:'https://nullai.tech'}],
  related:['t-cot','t-kalitweaks','t-nmap','t-tmux'] },

{ id:'t-cot', name:'Chain of Thoughts MCP & Vaelor Vault', kind:'tool', phases:['FOUNDATION','RECON','EXPLOIT','POST'],
  pkg:'@nullaitech/chain-of-thoughts-mcp (npx / ZothPen-Lite built-in)',
  tagline:'Structured DAG hypothesis branching, counterfactual auditing, and zero-knowledge evidence encryption for red-team operations.',
  what:'During a complex penetration test, linear terminal scrollback hides dead ends and confirmation bias. Chain of Thoughts (CoT) is ZothPen\'s cognitive reasoning engine (available as an MCP server for AI agents and as a visual studio inside ZothPen-Lite): it structures your investigation as a Directed Acyclic Graph (DAG) of Observations, Hypotheses, Verifications, and Refutations, then exports a clean Markdown audit report. Paired with Vaelor Vault, sensitive proofs and hashes are sealed with Argon2id + AES-256-GCM.',
  syntax:'npx @nullaitech/chain-of-thoughts-mcp\ncot_init_session | cot_push_thought | cot_branch_hypothesis | cot_verify_step | cot_export_markdown',
  flags:[
    {f:'cot_init_session', d:'Initialise a scoped reasoning graph for a target domain, CIDR block, or vulnerability class.'},
    {f:'cot_push_thought', d:'Append a typed node (observation, hypothesis, verification, refutation, conclusion) with confidence score.'},
    {f:'cot_branch_hypothesis', d:'Fork parallel attack hypotheses (e.g., Branch A: SMB relay vs. Branch B: Web SQLi) so no path is forgotten.'},
    {f:'cot_verify_step / cot_audit_chain', d:'Attach command output as proof and audit the reasoning chain for circular logic or unverified assumptions.'},
    {f:'cot_export_markdown', d:'Compile the verified attack path and refuted branches directly into a client-ready Markdown deliverable.'}
  ],
  examples:[
    {t:'Branch two attack hypotheses during enumeration and verify the winning path',
     cmd:`# 1. Push initial recon observation
cot_push_thought --type observation --text "192.168.56.20 exposes SMB (445) with signing:false and HTTP (8080)"
# 2. Branch hypotheses
cot_branch_hypothesis --parent T1 --branches "H1: SMB NTLM relay to LDAP,H2:Werkzeug debug console RCE on 8080"
# 3. Verify H2 after confirming pin-less console on 192.168.56.20:8080/console
cot_verify_step --id H2 --status verified --evidence "curl -s http://192.168.56.20:8080/console -> interactive console"`,
     out:'[CoT] Node H2 marked VERIFIED (confidence: 0.98) -> ready for cot_export_markdown'},
    {t:'Export the reasoning DAG into your engagement report',
     cmd:'cot_export_markdown --session op-23462 > ~/engagements/current/report/attack-path-cot.md',
     out:'# Chain of Thoughts Audit Report (4 verified nodes, 1 refuted branch)'}
  ],
  opsec:['Store raw credential proofs inside Vaelor Vault (AES-256-GCM) rather than pasting plaintext passwords into unencrypted report drafts.','Include refuted branches in your final report\'s coverage section — clients pay to know what you tested that held up, not only what broke.'],
  tips:['Log each hypothesis before you run the exploit command. If the exploit fails, marking the branch refuted takes two seconds and prevents you from re-testing the same dead end three hours later.','Works both inside ZothPen-Lite (https://zothos.nullai.tech) and from any Linux terminal via JSONL or the MCP server.'],
  links:[{t:'ZothPen-Lite Chain of Thoughts Studio', u:'https://zothos.nullai.tech'},{t:'NullAITech GitHub (@NullAITech)', u:'https://github.com/NullAITech'}],
  related:['t-zothpen','t-markdown','t-legal'] }

);
