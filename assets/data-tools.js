/* ==========================================================================
   ZothPen — tool dossiers (part 1: foundation / recon / web / exploit)
   shape: { id, name, kind, phases[], pkg, tagline, what, syntax, flags[], examples[],
            opsec[], tips[], links[], related[] }
   ========================================================================== */
window.ZT = [

{ id:'t-legal', name:'Rules of Engagement', kind:'reference', phases:['FOUNDATION'],
  pkg:'—', tagline:'The document that makes everything else legal. Read before you scan.',
  what:'A signed authorisation and scope agreement is the difference between a penetration test and a crime. It is also the first artefact of every professional engagement: it defines what you may touch, when, how, and who you call when you break something.',
  syntax:'authorisation → scope → window → techniques → contacts → data handling',
  flags:[
    {f:'Parties', d:'Legal names and the signatory with authority to authorise the test. A manager who "owns the website" is usually not that person.'},
    {f:'In scope', d:'Exact CIDR blocks, domains, subdomain sets, cloud accounts, physical sites. "The web app" is not a scope.'},
    {f:'Out of scope', d:'Production databases, third-party SaaS, other tenants, personal devices, and anything you discovered but were not told about.'},
    {f:'Window', d:'Dates and permitted hours. Include blackout periods (month-end close, exam season).'},
    {f:'Techniques', d:'Social engineering, physical, DoS/stress testing, credential stuffing — each is a separate yes/no.'},
    {f:'Contacts', d:'Two 24/7 numbers that answer. For "we took down production" and "we found live criminal activity".'},
    {f:'Data handling', d:'Where loot lives, encryption at rest, retention period, destruction date and certificate.'}
  ],
  examples:[
    { cmd:'mkdir -p ~/engagements/ACME-2026-04/{recon,scans,loot,evidence,exploits,report}', note:'One folder per engagement. Everything you do lives here.' },
    { cmd:'script -a ~/engagements/ACME-2026-04/evidence/session-$(date +%F-%H%M).log', note:'Log the shell session from minute one. This becomes your report appendix and your alibi.' },
    { cmd:'sha256sum evidence/*.txt >> evidence/CHAIN.txt && gpg --detach-sign --armor evidence/CHAIN.txt', note:'Hash and sign evidence as you collect it. Legal-grade chain of custody.' }
  ],
  opsec:['Never test anything because it is reachable. Reachability is not permission.','Verbal authorisation is not authorisation, however senior the person.','If recon surfaces out-of-scope data: stop, document, report. Do not look at it.'],
  tips:['Keep the scope file open in a pane while you work (tmux window "note"). Cross-check every new IP against it.'],
  links:[{t:'CFAA 18 U.S.C. §1030', u:'https://www.law.cornell.edu/uscode/text/18/1030'},{t:'UK Computer Misuse Act 1990', u:'https://www.legislation.gov.uk/ukpga/1990/18/contents'},{t:'NCSC Pen Test Checklist', u:'https://www.ncsc.gov.uk/guidance/penetration-testing'}],
  related:['t-shodan','t-nmap'] },

{ id:'t-kalitweaks', name:'kali-tweaks', kind:'tool', phases:['FOUNDATION'],
  pkg:'preinstalled on Kali', tagline:'The TUI that configures Kali properly: metapackages, mirrors, shell, hardening, VM guests.',
  what:'A menu-driven configurator shipped with Kali since 2019.x. It controls which metapackage collections are installed, customises the shell prompt, picks the fastest APT mirrors, applies basic hardening, and installs virtualisation guest tools. The single most under-used command on a fresh Kali install.',
  syntax:'kali-tweaks [--section metapackages|network|shell|hardening|virtualization]',
  flags:[
    {f:'Metapackages', d:'Pick tool collections: default, large, everything, or per-category (web, wireless, forensic, reverse-engineering, crypto, hardware, rfid).'},
    {f:'Network / APT', d:'Mirror selection with latency testing. A faster mirror saves hours over a year of full-upgrades.'},
    {f:'Shell', d:'Prompt style and prompt colour for zsh/bash.'},
    {f:'Hardening', d:'Toggles for some insecure defaults Kali ships for convenience.'},
    {f:'Virtualization', d:'Installs guest additions for VirtualBox/VMware/QEMU automatically.'}
  ],
  examples:[
    { cmd:'kali-tweaks', note:'Interactive. Requires root. Navigate with arrows/Tab.' },
    { cmd:'sudo apt install -y kali-tools-web kali-tools-windows-resources', note:'The non-interactive equivalent when you know what you want.' },
    { cmd:'cat /etc/apt/sources.list; grep -r . /etc/apt/sources.list.d/', note:'Confirm the mirror you selected actually took effect.' }
  ],
  opsec:['Do a full upgrade immediately after any mirror change — a stale mirror is a security problem, not just a convenience one.'],
  tips:['Run it right after first boot, before you install anything else. Retrofitting a clean tool layout afterwards is much slower.'],
  links:[{t:'kali-tweaks docs', u:'https://www.kali.org/docs/general-use/kali-linux-tweaks/'},{t:'Kali metapackages', u:'https://www.kali.org/docs/general-use/metapackages/'}],
  related:['t-anonsurf','t-bash'] },

{ id:'t-anonsurf', name:'AnonSurf', kind:'tool', phases:['FOUNDATION'],
  pkg:'apt install anonsurf-cli / anonsurf-gui (Parrot)', tagline:'System-wide Tor routing for Parrot OS. Privacy tool — not a legal shield, not a stealth mode.',
  what:'Parrot-specific utility that routes supported system traffic through Tor and scrambles DNS. Version 6 provides a quaesitor-like process cleaner, CLI, Qt6 GUI and a systemd service. Useful for OSINT research and privacy; actively harmful during authorised scanning (slower, breaks UDP, changes your source IP mid-engagement).',
  syntax:'anonsurf {start|stop|status|myip|restart}',
  flags:[
    {f:'start', d:'Enable Tor routing + DNS redirection. Verifies the Tor circuit before returning.'},
    {f:'status', d:'Current state and whether Tor is running.'},
    {f:'myip', d:'Reports your egress IP. The only honest test of whether it worked.'},
    {f:'stop', d:'Restore normal networking. Do this before any engagement work.'},
    {f:'restart', d:'Full cycle, useful when the circuit is dead.'}
  ],
  examples:[
    { cmd:'sudo anonsurf start && anonsurf myip', note:'Confirm the egress IP actually changed. Do not assume.' },
    { cmd:'anonsurf status; anonsurf stop', note:'Stop it before scanning anything — UDP and many tools will break.' },
    { cmd:'cat > ~/scripts/tor-mode.sh  # wrap start/stop/myip in one helper', note:'Script it so you never leave it on by accident during an engagement.' }
  ],
  opsec:['AnonSurf does not make you anonymous: browser fingerprinting, UDP, and application-level leaks are outside its scope.','Never treat Tor as legal cover. Offensive tooling through Tor against a third party is still a crime — logged somewhere else, and slower.','Leaving it enabled mid-engagement silently breaks your scans and taints your evidence. Script the stop.'],
  tips:['Selective control exists: anonsurf provides options to route only specific traffic (e.g. a browser or a single app) rather than the whole system.'],
  links:[{t:'Parrot AnonSurf docs', u:'https://parrotsec.org/docs/anonsurf/'},{t:'Tor Project', u:'https://www.torproject.org/'}],
  related:['t-kalitweaks','t-proxychains','t-curl'] },

{ id:'t-bash', name:'Bash / Zsh scripting', kind:'reference', phases:['FOUNDATION','MASTERY'],
  pkg:'preinstalled', tagline:'The language every tool on this system speaks. Pipes, redirection, loops, functions.',
  what:'Shell scripting is not a nice-to-have in offensive security — it is the medium. Every tool accepts and emits text, and the operator\'s job is chaining those streams into pipelines that log, filter, and produce report-ready artefacts.',
  syntax:'cmd1 | cmd2 > file 2>&1 ;  for x in $(cat list); do cmd "$x"; done ;  f(){ ...; }',
  flags:[
    {f:'> vs >>', d:'Overwrite vs append. Use >> on logs — losing a scan log to a stray > is a classic own goal.'},
    {f:'2>&1 / 2>/dev/null', d:'Merge or discard stderr. Enumeration tools are chatty on stderr.'},
    {f:'| tee -a log', d:'Show output now AND save it. Use on every scan, without exception.'},
    {f:'set -euo pipefail', d:'Fail fast, error on unset vars, and propagate pipe failures. First line of every script you write.'},
    {f:'"$var" quoting', d:'Always quote. Unquoted variables with spaces are the #1 source of broken scripts.'},
    {f:'xargs -I{} -P10', d:'Run a command per line, ten in parallel. The workhorse for mass operations.'},
    {f:'$( ) vs ` `', d:'Prefer $( ) — nestable and readable.'},
    {f:'trap \'echo cleaned\' EXIT', d:'Guarantee cleanup runs even on Ctrl-C. Matters when you spawn listeners.'}
  ],
  examples:[
    { cmd:`nmap -sV -p- -oG scan.gnmap 10.10.10.0/24 && grep 'Ports:' scan.gnmap | cut -d' ' -f2 | sort -u > hosts.txt`, note:'Host discovery → clean target list. The single most reused pipeline in recon.' },
    { cmd:`for h in $(cat hosts.txt); do echo "== $h"; nmap -sV --top-ports 100 "$h" -oN "scans/$h.txt"; done`, note:'Per-host scans with per-host output files.' },
    { cmd:`grep -Eo '([0-9]{1,3}\\.){3}[0-9]{1,3}' raw.txt | sort -u > ips.txt`, note:'Extract every IP from arbitrary text. Works on any scanner output.' },
    { cmd:`awk -F: '{print $1":"$2}' dump.txt | sort -u > creds.txt`, note:'Build a clean credential list from colon-delimited dumps.' },
    { cmd:`cat hosts.txt | xargs -I{} -P10 -n1 sh -c 'nmap -sT -Pn -p80 {} -oN scans/{}_80.txt'`, note:'Mass parallel port check. Tune -P to your target\'s tolerance.' }
  ],
  opsec:['Never run a script you have not read, especially from a root-writable path. Scripts from the internet are a supply chain.','A script is not safer than typing commands: it just does the damage faster and more consistently. Review, then run.'],
  tips:['Keep ~/scripts in git. Your toolchain is an asset; treat it like source code.','Test every pipeline on a tiny input first (head -3). Silent failure at stage 2 of 6 costs an hour.'],
  links:[{t:'Bash Hackers Wiki', u:'https://mywiki.wooledge.org/BashGuide'},{t:'ShellCheck (lint your scripts)', u:'https://www.shellcheck.net/'}],
  related:['t-grep','t-tmux','t-git'] },

{ id:'t-grep', name:'grep / awk / sed / cut', kind:'reference', phases:['FOUNDATION','MASTERY'],
  pkg:'preinstalled', tagline:'The text-mangling trio that turns any scanner output into exactly what you need.',
  what:'grep finds, awk selects columns and computes, sed substitutes. Between them they convert raw tool output into target lists, credential files, report tables and evidence extracts. This is where a huge fraction of real operator time is spent.',
  syntax:'grep -rEi "password" /var/www --include=\'*.php\'\nawk -F: \'{print $1":"$3}\' /etc/passwd | sort -t: -k2 -n\nsed -i \'s/old-token/new-token/g\' ./config.php',
  flags:[
    {f:'grep -Ei', d:'-E extended regex, -i case-insensitive. The pair you will type forever.'},
    {f:'grep -r --include=', d:'Recursive search restricted by glob. How you find secrets in a webroot.'},
    {f:'grep -c / -l / -o', d:'Count matches / list filenames only / print only the matched part.'},
    {f:'grep -A3 -B3', d:'Context lines after/before. Essential when grepping logs for an error.'},
    {f:'awk -F: \'{print $1,$3}\'', d:'Split on : and print fields 1 and 3.'},
    {f:'awk \'NR>1 && $3=="open"\'', d:'Conditional row selection — awk is a small language, use it.'},
    {f:'sed \'s/old/new/g\'', d:'Global substitution; sed -n \'10,20p\' prints a line range.'},
    {f:'sort -u | uniq -c | sort -rn', d:'Deduplicate, count, order by frequency. Your default for shortening any list.'}
  ],
  examples:[
    { cmd:`grep -rEi 'password|passwd|secret|api[_-]?key|token' /var/www /opt /home 2>/dev/null | head -40`, note:'The credential-hunting pass on a freshly compromised host.' },
    { cmd:`awk '{print $2}' live.txt | sort -u > urls.txt`, note:'Column extraction from httpx/subfinder style output.' },
    { cmd:`tr -d '\\r' output.txt | sort -u`, note:'Strip CRLF from Windows-generated files. You will hit this constantly.' },
    { cmd:`grep -Eo '[0-9]+/open/tcp//[a-z-]+' scan.gnmap | sort -u`, note:'Port + service pairs straight out of a gnmap scan.' }
  ],
  opsec:['Grepping a customer filesystem reads files nobody asked you to read. Stay inside the agreed paths, and log what you opened — the report has to be able to say so.','Anything matched goes in as evidence: record the path, owner and mtime and hash the file (`sha256sum`) before you copy it out.','Never paste recovered secrets into chat, tickets or shared notes. That is how an engagement becomes an incident. Keep them in the evidence store and cite them by reference.'],
  tips:['When a grep returns nothing, the next move is not a different regex — it is verifying the file is non-empty and has the encoding you expect.','grep -r on /proc is slow and useless. Exclude it: --exclude-dir=proc --exclude-dir=sys.'],
  links:[{t:'ripgrep (faster grep)', u:'https://github.com/BurntSushi/ripgrep'},{t:'awk one-liners explained', u:'https://catonmat.net/awk-one-liners-explained-part-one'}],
  related:['t-bash','t-tmux'] },

{ id:'t-tmux', name:'tmux', kind:'tool', phases:['FOUNDATION','MASTERY'],
  pkg:'apt install tmux', tagline:'Persistent terminal multiplexer: sessions survive disconnects, one window per engagement phase.',
  what:'tmux keeps a shell session alive independently of your terminal. For pentesting it means scans survive dropped VPNs, you can watch a listener and a shell at the same time, and you can hand a colleague a live session. Combined with script(1) it also gives you full transcripts for the report.',
  syntax:'tmux new -s RECON\n# Ctrl-b d detaches; reopen the session with:\ntmux attach -t RECON',
  flags:[
    {f:'Ctrl-b c / n / p', d:'Create window / next / previous. Your primary navigation.'},
    {f:'Ctrl-b % / "', d:'Split vertically / horizontally into panes.'},
    {f:'Ctrl-b z', d:'Zoom the current pane fullscreen. Enormous quality-of-life on a small screen.'},
    {f:'Ctrl-b [', d:'Copy mode: scrollback with arrow keys, / to search, Enter to select.'},
    {f:'Ctrl-b :', d:'Command prompt — resize-pane, split-window -c "#{pane_current_path}", etc.'},
    {f:'tmux ls / kill-session', d:'List and clean up. Do not leave sessions named session-2 around for months.'}
  ],
  examples:[
    { cmd:`tmux new -s acme -d && tmux rename-window -t acme:0 recon && tmux new-window -t acme -n shell && tmux attach -t acme`, note:'Engagement layout: recon, scans, shell, notes.' },
    { cmd:`bind | split-window -h -c "#{pane_current_path}"   # in ~/.tmux.conf`, note:'New panes inherit the current directory instead of $HOME. Small change, huge time saver.' },
    { cmd:`script -a ~/engagements/acme/evidence/session.log`, note:'Run inside a pane for a full transcript. Evidence for free.' }
  ],
  opsec:['Terminate sessions when an engagement ends — a live session with client credentials is a standing risk on your own machine.'],
  tips:['Set prefix to Ctrl-a (see the config in module 02) if Ctrl-b collides with readline.','history-limit 50000 saves you when a tool dumped 20k lines of output you need to scroll.'],
  links:[{t:'tmux wiki', u:'https://github.com/tmux/tmux/wiki'}],
  related:['t-bash','t-ssh','t-git'] },

{ id:'t-git', name:'git', kind:'tool', phases:['FOUNDATION','MASTERY'],
  pkg:'apt install git', tagline:'Version control for your dotfiles, scripts and wordlists — and a source of secrets in target repos.',
  what:'Two jobs: (1) keep your own tooling, aliases and scripts on a versioned, restorable basis so a rebuilt VM is operational in minutes; (2) read history in target repos for accidentally committed credentials.',
  syntax:'git init && git add -A && git commit -m \'engagement notes\'\ngit log --oneline --all\ngit log -p -- notes/recon.md',
  flags:[
    {f:'git log --oneline --all', d:'Every commit in every branch. Accidentally reverted secrets live in the history, not the current tree.'},
    {f:'git log -p -- config/', d:'Full diffs of a path. How you find a password that was committed and "removed".'},
    {f:'git grep -i password', d:'Search the working tree fast, including in tracked binaries.'},
    {f:'git status / diff', d:'What changed and what is about to be committed. Check before push.'},
    {f:'--depth 1 clone', d:'Shallow clone — faster recon pull of a large target repo.'}
  ],
  examples:[
    { cmd:`cd ~/scripts && git init && git add -A && git commit -m "arsenal baseline"`, note:'Version your operator toolkit from day one.' },
    { cmd:`git -C /var/www/html log --oneline --all 2>/dev/null`, note:'On a compromised host: what did the developers commit and revert?' },
    { cmd:`git grep -Ein 'password|secret|token|api[_-]?key' $(git rev-list --all | head -20) 2>/dev/null | head`, note:'Search across historical commits, not just HEAD.' }
  ],
  opsec:['Never commit engagement data, hashes, loot or client filenames to a public repo. Use .gitignore and separate private remotes.','Your dotfiles repo is a map of your habits and possibly your infrastructure. Keep private repos private.'],
  tips:['Add a sanity-check pre-commit grep for "password" and your clients\' names. Fifty characters of prevention.'],
  links:[{t:'Pro Git book (free)', u:'https://git-scm.com/book/en/v2'},{t:'gitleaks (secret scanning)', u:'https://github.com/gitleaks/gitleaks'}],
  related:['t-bash','t-markdown'] },

{ id:'t-ssh', name:'ssh / scp', kind:'tool', phases:['FOUNDATION','POST'],
  pkg:'preinstalled', tagline:'Remote access, key auth, local/remote/dynamic port forwarding — the cheapest pivot there is.',
  what:'SSH is simultaneously your access tool, your file transfer, and the simplest tunneling mechanism on any Linux host. The -L/-R/-D flags solve most pivoting problems before you reach for anything more elaborate.',
  syntax:'ssh -i ~/.ssh/id_ed25519 USER@TARGET\nssh -L 8080:127.0.0.1:80 USER@TARGET\nssh -D 1080 -N -f USER@TARGET',
  flags:[
    {f:'-i id_rsa', d:'Use a private key. chmod 600 it or ssh refuses outright.'},
    {f:'-L 8080:tgt:80', d:'Local forward: nothing listens on your machine, and forwarding opens on connection.'},
    {f:'-R 9001:127.0.0.1:9001', d:'Remote forward: expose YOUR service to the remote host. How you get a listener reachable from inside.'},
    {f:'-D 1080 -N -f', d:'Dynamic SOCKS proxy in the background. Pair with proxychains.'},
    {f:'-J user@jump', d:'ProxyJump: chain through a bastion without manual tunneling.'},
    {f:'-o StrictHostKeyChecking=accept-new', d:'Automation-friendly host key handling. Be deliberate about disabling checks.'},
    {f:'ControlMaster/ControlPath', d:'Session multiplexing: reuse one TCP connection for many SSH calls, huge speed-up in loops.'}
  ],
  examples:[
    { cmd:`ssh -i id_rsa -L 8080:10.10.20.5:80 user@10.10.10.5`, note:'Reach an internal web app on localhost:8080 through the pivot.' },
    { cmd:`ssh -D 1080 -N -f user@10.10.10.5 && proxychains4 -q nxc smb 10.10.20.0/24 -u u -p p --shares`, note:'SOCKS through the pivot for tools without native tunnel support.' },
    { cmd:`ssh -R 9001:127.0.0.1:9001 user@10.10.10.5`, note:'Serve your tools/wordlists back into the internal network.' },
    { cmd:`ssh -J bastion@1.2.3.4 user@10.10.10.5`, note:'Jump host chain in one command. Cleaner than nested tunnels.' }
  ],
  opsec:['Generate engagement-specific keys. Never reuse your personal SSH key on a client network — it ties their logs to your identity everywhere.','ssh -A (agent forwarding) on an untrusted host hands over your keys. Avoid it.'],
  tips:['~/.ssh/config with Host aliases saves typing and makes jump-host chaining a single word. Include it in your dotfiles repo.'],
  links:[{t:'OpenSSH manual', u:'https://man.openbsd.org/ssh'},{t:'SSH tunneling explained', u:'https://www.ssh.com/academy/ssh/tunneling'}],
  related:['t-chisel','t-proxychains','t-ligolo'] },

{ id:'t-nc', name:'netcat (nc / ncat)', kind:'tool', phases:['EXPLOIT','POST'],
  pkg:'preinstalled (netcat-traditional / ncat)', tagline:'The TCP/UDP Swiss army knife: listeners, shells, file transfer, banners, pivots.',
  what:'Reads and writes raw TCP/UDP. Its value is availability — nc exists almost everywhere, needs no dependencies, and does six different jobs: catch a reverse shell, transfer a file, grab a banner, relay a port, verify egress, serve a listener.',
  syntax:'nc -nv TARGET PORT\nnc -lvnp 4444',
  flags:[
    {f:'-l -v -n -p PORT', d:'Listen, verbose, numeric (no DNS), port. The classic catch-all: nc -lvnp 443.'},
    {f:'-e /bin/sh', d:'Execute on connect. Compiled out of most modern netcat builds — use a bash /dev/tcp or ncat --sh-exec instead.'},
    {f:'-k', d:'Keep listening after a client disconnects. Essential: without it your listener dies after one shell.'},
    {f:'-z -v', d:'Zero-I/O scan mode. Quick "is this port open" probe, no nmap needed.'},
    {f:'-u', d:'UDP mode.'},
    {f:'--sh-exec', d:'ncat-only: exec a command for every connection. How you build a relay.'}
  ],
  examples:[
    { cmd:`nc -lvnp 443`, note:'Catch a reverse shell. Use rlwrap -cAr nc -lvnp 443 for history and arrow keys.' },
    { cmd:`nc -lp 9001 < linpeas.sh`, note:'Attacker side of a file transfer with no HTTP server and no wget on target.' },
    { cmd:`nc -zv 10.10.10.5 20-1024 2>&1 | grep -v refused`, note:'Fast port probe when nmap is not available on the box you are on.' },
    { cmd:`ncat -l 4444 --sh-exec "ncat 10.10.20.5 3389" --keep-open`, note:'ncat as a TCP relay through a pivot that has no socat.' }
  ],
  opsec:['A bare nc listener on 4444 is the most signatured thing on any enterprise network. Use 443, and prefer a real C2 for anything long-running.','Remember to kill listeners. A forgotten nc -lvnp is an open door on your own machine.'],
  tips:['On Debian, choose the variant: update-alternatives --config nc (traditional has -e, openbsd has better flags). ncat is the most capable of the three.'],
  links:[{t:'ncat reference (nmap.org)', u:'https://nmap.org/ncat/guide/index.html'}],
  related:['t-socat','t-msfvenom','t-msf'] },

{ id:'t-subfinder', name:'subfinder', kind:'tool', phases:['RECON'],
  pkg:'apt install subfinder (or go install)', tagline:'Fast passive subdomain enumeration from 30+ sources. Silent, JSON, pipeline-friendly.',
  what:'Queries public data sources (certificate transparency, search engines, passive DNS, security datasets) to find subdomains without touching the target. ProjectDiscovery tool, so output is designed for piping into httpx/naabu/nuclei.',
  syntax:'subfinder -d example.com [-all] [-silent] [-o out.txt] [-json]',
  flags:[
    {f:'-d / -dL', d:'Single domain / file of domains.'},
    {f:'-all', d:'Use every available source, not just the default set. More results, slightly slower.'},
    {f:'-silent', d:'Hostnames only, no banner. What you want in a pipeline.'},
    {f:'-recursive', d:'Also enumerate subdomains of discovered subdomains. Finds the deep dev environments.'},
    {f:'-json', d:'Structured output including the source that found each name. Useful for reporting provenance.'},
    {f:'-o out.txt', d:'Write results to file — always do this.'},
    {f:'-rl / -t', d:'Rate limit and concurrency. Public APIs throttle: back off rather than get blocked.'}
  ],
  examples:[
    { cmd:`subfinder -d example.com -all -silent -o subs.txt`, note:'Baseline passive enumeration. No packets reach the target.' },
    { cmd:`subfinder -d example.com -all -silent | httpx -silent -title -tech-detect -o live.txt`, note:'The canonical pair: find, then probe.' },
    { cmd:`cat domains.txt | subfinder -all -silent | sort -u > all-subs.txt`, note:'Batch mode across an acquisition list.' },
    { cmd:`subfinder -d example.com -silent | dnsx -silent -a -resp`, note:'Resolve and confirm which names actually exist today.' }
  ],
  opsec:['Passive means third-party sources, so it is safe and in-scope anywhere — but the API keys in ~/.config/subfinder/provider-config.yaml are yours and rate-limited. Cache results to disk instead of re-running.'],
  tips:['Combine sources rather than trusting one: subfinder + amass passive + crt.sh catches different populations. Union them.'],
  links:[{t:'subfinder on GitHub', u:'https://github.com/projectdiscovery/subfinder'},{t:'ProjectDiscovery docs', u:'https://docs.projectdiscovery.io/'}],
  related:['t-amass','t-httpx','t-dnsrecon'] },

{ id:'t-amass', name:'amass', kind:'tool', phases:['RECON'],
  pkg:'apt install amass', tagline:'In-depth attack surface mapping: DNS, ASN, certificate and WHOIS graph in one place.',
  what:'Wider and slower than subfinder. Amass correlates DNS records, IP blocks (ASN/CIDR), certificate data and WHOIS into an asset graph — better for building a full picture of an organisation\'s footprint, worse for a quick subdomain list.',
  syntax:'amass enum -passive -d example.com -o out.txt\namass intel -asn 12345',
  flags:[
    {f:'enum', d:'Enumeration subcommand (subdomains of a domain).'},
    {f:'-passive', d:'No direct DNS queries to the target. The only safe mode before authorisation.'},
    {f:'-active', d:'Includes zone transfers and brute forcing. Requires authorisation.'},
    {f:'-brute', d:'Wordlist-based DNS brute force. Slow but finds internal-naming patterns.'},
    {f:'-asn', d:'intel mode: find netblocks and domains belonging to an ASN. Reveals acquisitions.'},
    {f:'-cidr', d:'Enumerate the reverse-DNS/domain space of a netblock ("which of your domains live in this /16?").'},
    {f:'-o / -json', d:'Text or JSON output. Store it — amass runs are expensive.'}
  ],
  examples:[
    { cmd:`amass enum -passive -d example.com -o amass.txt`, note:'Authorisation-free starting point.' },
    { cmd:`amass intel -asn 64500 -whois -d example.com`, note:'Map everything the organisation owns, including subsidiaries.' },
    { cmd:`amass db -names -d example.com`, note:'Re-query previous results from the local graph database without re-enumerating.' }
  ],
  opsec:['-active and -brute generate real DNS traffic to the target and can be logged. Do not run them without authorisation. Passive only until the scope document exists.'],
  tips:['Amass is slow by design. Run it in a tmux window in the background while you work with subfinder on the same target in the foreground.'],
  links:[{t:'OWASP Amass', u:'https://github.com/owasp-amass/amass'}],
  related:['t-subfinder','t-dnsrecon','t-theharvester'] },

{ id:'t-httpx', name:'httpx', kind:'tool', phases:['RECON'],
  pkg:'apt install httpx-toolkit (note the name clash)', tagline:'Probe a host list at HTTP level: which are alive, what title, what tech, what status.',
  what:'Takes a list of hosts and tells you which respond to HTTP/HTTPS, their status code, title, server header, detected technologies, TLS details, and content hash. Turns a raw subdomain list into a prioritised target list. (The ProjectDiscovery httpx, not the Python httpx library.)',
  syntax:'httpx -l hosts.txt [-silent] [-title] [-tech-detect] [-status-code] [-o out.txt]',
  flags:[
    {f:'-l / -u', d:'Input file of hosts, or single target.'},
    {f:'-title -status-code -tech-detect', d:'The standard trio for triage: who are you, did it work, what is it built on.'},
    {f:'-sc -cl -location', d:'Status code, content length, redirect target.'},
    {f:'-ports', d:'Probe additional ports as HTTP, e.g. -ports 80,443,8080,8443,8000,8888.'},
    {f:'-favicon', d:'Favicon mmh3 hash — fingerprint identical apps across many hosts instantly.'},
    {f:'-cdn -cname', d:'Detect CDN/WAF presence. Tells you where a direct-to-origin check would matter.'},
    {f:'-json -o', d:'Structured output for downstream processing.'},
    {f:'-mc / -fc', d:'Match/filter status codes. -mc 200,401,403 to show only the interesting ones.'}
  ],
  examples:[
    { cmd:`httpx -l subs.txt -silent -title -tech-detect -status-code -o live.txt`, note:'The triage pass after any subdomain enumeration.' },
    { cmd:`httpx -l ips.txt -ports 80,443,8080,8443,8000 -sc -title -silent`, note:'Discover HTTP services on non-standard ports across a netblock.' },
    { cmd:`httpx -l live.txt -favicon -silent | sort -k2 | uniq -f1 -c | sort -rn`, note:'Find clusters of identical apps — one exploit, many hosts.' },
    { cmd:`httpx -l subs.txt -asn -cdn -silent`, note:'Separate infrastructure you can reach from infrastructure parked behind a CDN.' }
  ],
  opsec:['Every request is logged by the target. This is active recon: authorised targets only.','Use -rl (rate limit) against fragile or closely monitored hosts. A burst of 500 requests is an alert.'],
  tips:['The binary clashing with the Python httpx library is a common trip-up on Kali. If "httpx" errors, try httpx-toolkit or call the PD binary by full path.'],
  links:[{t:'httpx on GitHub', u:'https://github.com/projectdiscovery/httpx'}],
  related:['t-subfinder','t-nuclei','t-curl'] },

{ id:'t-theharvester', name:'theHarvester', kind:'tool', phases:['RECON'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Emails, names, hosts and subdomains from public sources — the OSINT starting point.',
  what:'Aggregates search engines, certificate transparency, PGP keyservers, Shodan and other public sources for a domain. Its real output is people: email addresses and naming conventions that feed username generation, phishing scope discussions, and password spraying lists.',
  syntax:'theHarvester -d example.com -b SOURCES [-l LIMIT] [-f out.html]',
  flags:[
    {f:'-d', d:'Target domain.'},
    {f:'-b', d:'Sources: duckduckgo, bing, crtsh, otx, github-code, hackertarget, dnsdumpster, virustotal, etc. Comma-separate them.'},
    {f:'-l', d:'Result limit per source. Raise it for depth, expect more noise.'},
    {f:'-f', d:'Write an HTML/XML report alongside stdout.'},
    {f:'-c', d:'Perform DNS resolution of discovered hosts.'},
    {f:'-s', d:'Start result offset — used to page through large result sets.'}
  ],
  examples:[
    { cmd:`theHarvester -d example.com -b duckduckgo,bing,crtsh,otx -l 500`, note:'Broad passive sweep, no packets to the target.' },
    { cmd:`theHarvester -d example.com -b all -f harvest.html`, note:'Everything available, with a shareable report output.' },
    { cmd:`theHarvester -d example.com -b duckduckgo -l 200 | grep -oE '[^ ]+@example\\.com' | sort -u > emails.txt`, note:'Feed the email list into username generation for spraying (with authorisation).' }
  ],
  opsec:['Search-engine sources rate-limit and can block your IP for a while. Space out runs and cache results.','Emails and names are personal data. Retention and destruction rules from the engagement apply to your harvest files too.'],
  tips:['Cross-reference email formats to derive the username convention (first.last, flast, etc.) — that list is what AD spraying actually needs.'],
  links:[{t:'theHarvester on GitHub', u:'https://github.com/laramies/theHarvester'}],
  related:['t-subfinder','t-amass','t-shodan'] },

{ id:'t-dnsrecon', name:'dnsrecon', kind:'tool', phases:['RECON'],
  pkg:'preinstalled on Kali/Parrot', tagline:'DNS enumeration: records, zone transfers, brute force, reverse lookups, SRV hunting.',
  what:'A focused DNS tool. Finds the records that matter for attack surface — MX and TXT for email posture, SRV records for internal services, SPF/DMARC gaps — and attempts the zone transfer that occasionally hands you the whole namespace.',
  syntax:'dnsrecon -d example.com -t std,brt,axfr  [-D wordlist] [-a]',
  flags:[
    {f:'-t std', d:'Standard records: A, AAAA, MX, NS, TXT, SOA.'},
    {f:'-t axfr', d:'Attempt a zone transfer against every nameserver. Rare, and total when it works.'},
    {f:'-t brt', d:'Brute force hostnames from a wordlist (-D to specify).'},
    {f:'-t srv', d:'Enumerate SRV records — frequently reveals internal LDAP, SIP, RDP, and Exchange hosts.'},
    {f:'-t rvl', d:'Reverse lookup on a CIDR: "which names live in this netblock".'},
    {f:'-D -f', d:'Wordlist and output file (JSON/XML/CSV).'}
  ],
  examples:[
    { cmd:`dnsrecon -d example.com -t std,axfr`, note:'Records plus the zone-transfer lottery.' },
    { cmd:`dnsrecon -d example.com -t brt -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -f dnsrecon.json`, note:'Wordlist brute force with structured output.' },
    { cmd:`dig +short TXT example.com; dig +short TXT _dmarc.example.com`, note:'The fastest email-posture check: SPF and DMARC presence and strictness.' }
  ],
  opsec:['Zone transfer attempts and brute force are noisy and logged. Authorised targets only; prefer passive sources first.'],
  tips:['Also check _dmarc and DKIM selectors — a missing DMARC policy is a finding that costs the client nothing to fix and closes a real phishing vector.'],
  links:[{t:'dnsrecon on GitHub', u:'https://github.com/darkoperator/dnsrecon'},{t:'DNS security basics (Cloudflare)', u:'https://www.cloudflare.com/learning/dns/dns-security/'}],
  related:['t-subfinder','t-amass','t-nmap'] },

{ id:'t-shodan', name:'Shodan', kind:'tool', phases:['RECON','MASTERY'],
  pkg:'pip install shodan  (CLI + Python API)', tagline:'Search engine for exposed services. The fastest way to see an organisation from the outside.',
  what:'Continuously scans the internet and indexes banners: port, product, version, TLS certificate, hostnames, ASN. For an engagement it answers "what does this organisation expose to the internet" in one query, without sending a single packet to them.',
  syntax:'shodan search \'product:nginx country:US\'\nshodan host 8.8.8.8\nshodan stats --facets org \'apache\'',
  flags:[
    {f:'shodan host IP', d:'Full banner history for one IP: ports, products, last seen, vulns. Cheapest query type.'},
    {f:'org:"Name"', d:'Everything indexed for an ASN/organisation. The core recon query.'},
    {f:'ssl:"domain.com"', d:'Find hosts presenting a certificate for that domain — catches infrastructure the DNS does not reveal.'},
    {f:'net:10.0.0.0/24', d:'CIDR scope (works on public ranges; private ranges appear only in your own scan data).'},
    {f:'--facets country:10,port:20', d:'Aggregate counts instead of match lists. One query, whole-surface statistics.'},
    {f:'http.title / http.html', d:'Search page titles and body content — how you find "Index of" and login panels at scale.'},
    {f:'vuln:', d:'Filter by known CVE. Use carefully: it is Shodan\'s assertion, not proof.'}
  ],
  examples:[
    { cmd:`shodan search 'org:"Example Corp" port:3389'`, note:'How many RDP endpoints does this organisation expose?' },
    { cmd:`shodan search 'ssl:"example.com" -port:443 -port:8443'`, note:'Certificates on unexpected ports — frequently forgotten admin infrastructure.' },
    { cmd:`shodan stats --facets country:5,port:10 org:"Example Corp"`, note:'Surface summary in one query instead of fifty searches.' },
    { cmd:`python3 -c "import shodan,os;api=shodan.Shodan(os.environ['SHODAN_API_KEY']);print(api.host('198.51.100.10'))"`, note:'Host lookup from a script; env var, never a hardcoded key.' }
  ],
  opsec:['Query credits are finite and filtered queries cost more. Cache every result to disk before iterating.','A Shodan result is a third party\'s data about the target. It informs scope discussions; it does not authorise you to connect.'],
  tips:['Free API keys cannot use some filters (vuln, and certain facets) and are rate-limited to about one query per second. Plan your queries before spending them.','Alternative sources worth cross-referencing: Censys, FOFA, ZoomEye, Netlas, GreyNoise. Different crawlers see different things.'],
  links:[{t:'Shodan CLI docs', u:'https://cli.shodan.io/'},{t:'Shodan search filters', u:'https://www.shodan.io/search/filters'}],
  related:['t-nmap','t-masscan','t-httpx'] },

{ id:'t-nmap', name:'nmap', kind:'tool', phases:['RECON'],
  pkg:'preinstalled on Kali/Parrot', tagline:'The port scanner. Twenty flags cover 95% of real usage — learn those properly.',
  what:'Host discovery, port scanning (TCP SYN/connect/UDP/idle), service and version detection, OS fingerprinting, and ~600 NSE scripts for probing individual services. It also parses its own output back in, has a scripting language, and produces XML that every other tool consumes.',
  syntax:'nmap -sS -sV -sC -p- -oA out -T4 TARGET\nnmap -sn 10.10.10.0/24',
  flags:[
    {f:'-sn', d:'Ping sweep — host discovery only, no ports. "Who is alive?"'},
    {f:'-Pn', d:'Skip discovery, treat target as up. Required against firewall-protected hosts.'},
    {f:'-p- / -p1-65535', d:'All TCP ports. Never skip this on an engagement; the interesting service is always on 8443 or 31337.'},
    {f:'-sS', d:'TCP SYN half-open scan. Fast, stealthier, needs root.'},
    {f:'-sT', d:'TCP connect scan. No root needed; the only option through proxychains.'},
    {f:'-sU', d:'UDP scan. Slow, needs root, finds SNMP/DNS/tftp/NetBIOS — hugely under-tested.'},
    {f:'-sV --version-intensity', d:'Service/version detection. 0-9; 7 is a good default balance.'},
    {f:'-sC / --script', d:'Default scripts, or a specific script/category (vuln, smb-enum-shares, http-title, etc.).'},
    {f:'-O --osscan-guess', d:'OS fingerprinting. Needs root and at least one open and one closed port.'},
    {f:'-A', d:'-sV -sC -O --traceroute together. Convenient; slow.'},
    {f:'-T0..5', d:'Timing template. T4 aggressive (lab default), T2 polite (production).'},
    {f:'--min-rate / --max-rate', d:'Direct packets-per-second control. Better than -T5 for a fast-but-controlled scan.'},
    {f:'-oA prefix', d:'Output normal+grepable+XML at once. Always use this. The XML is your report evidence.'},
    {f:'-oX / -oG / -oN', d:'Individual formats: XML (tools), grepable (shell), normal (humans).'},
    {f:'-iL file / -iR n', d:'Targets from a file / random internet targets (never without authorisation).'},
    {f:'-v / --reason', d:'Verbosity and the reason for each port state. Essential when results look odd.'},
    {f:'--open', d:'Show only open ports. Cuts the noise from filtered/closed listings.'},
    {f:'-n / -R', d:'Never resolve DNS / always resolve. -n is much faster.'},
    {f:'--script-help NAME', d:'Read the docs for an NSE script before running it. Do this every time.'},
    {f:'-f --mtu / -D RND:10 / --source-port 53', d:'Fragmentation, decoys, source-port spoofing — the classic weak-ACL bypasses.'},
    {f:'-sI zombie', d:'Idle scan: genuinely blind, uses a third party\'s IP as the source. The stealthy option.'},
    {f:'--compare old.xml new.xml', d:'Diff two scans. Your monthly monitoring workflow.'}
  ],
  examples:[
    { cmd:`sudo nmap -sS -p- --min-rate 2000 -T4 --open -oA scans/lab-web01-tcp 10.10.10.5`, note:'The first real scan: all TCP ports, fast, saved in three formats.' },
    { cmd:`sudo nmap -sV -sC -p22,80,443,445 -oA scans/lab-web01-detail 10.10.10.5`, note:'Deep-dive the ports you found. -sC runs safe default scripts.' },
    { cmd:`sudo nmap -sU --top-ports 100 --open 10.10.10.5`, note:'UDP pass. Slow but finds the services nobody remembered.' },
    { cmd:`nmap --script smb-vuln-ms17-010 -p445 10.10.10.5`, note:'Targeted NSE check for a specific CVE. Safe and readable.' },
    { cmd:`nmap -sV -iL ips.txt --open -oA scans/batch`, note:'Batch all discovered hosts from a file, often right after a ping sweep.' },
    { cmd:`nmap --compare scans/week1.xml scans/week2.xml`, note:'Prove what changed on the client\'s external surface since last month.' }
  ],
  opsec:['-T4/-T5 and full-range scans of production networks trip IDS, can exhaust connection tables on fragile devices, and have taken down printers and industrial kit. Agree timing in writing; start with --top-ports and -T2/T3 on production.','Nmap from your engagement IP logs your IP in the target\'s IDS. That is fine and expected in an authorised test — and evidential material against you if it is not authorised.','Decoys and fragmentation do not hide you from modern IDS. They mostly confuse yourself. Use -sI if stealth genuinely matters.'],
  tips:['Learn the NSE library: ls /usr/share/nmap/scripts | wc -l is around 600. grep -l smb finds the SMB family. Many "vulnerabilities" are one --script away.','The XML output is the input for searchsploit --nmap, many reporting tools, and your own diff scripts. Always produce it.'],
  links:[{t:'Nmap book (free, official)', u:'https://nmap.org/book/'},{t:'NSE script index', u:'https://nmap.org/nsedoc/'}],
  related:['t-masscan','t-netexec','t-searchsploit'] },

{ id:'t-masscan', name:'masscan', kind:'tool', phases:['RECON'],
  pkg:'apt install masscan', tagline:'Internet-scale port scanner: whole /16 in minutes. Noisy, fast, pairs with nmap.',
  what:'An asynchronous scanner that can sweep enormous ranges at defined rates. It does not do service detection — its job is to find open ports extremely quickly, then hand off to nmap for detail.',
  syntax:'sudo masscan -p1-65535 TARGET --rate N -oL out.lst [--banners]',
  flags:[
    {f:'-p', d:'Port range or list, e.g. -p1-65535 or -p80,443,8080.'},
    {f:'--rate', d:'Packets per second. 1000 is gentle-ish, 100000 needs a fast link and is extremely loud.'},
    {f:'-oL / -oJ / -oX', d:'Output: list, JSON, XML. -oX plays with the rest of your toolchain.'},
    {f:'--banners', d:'Grab basic banners. Slower, but gives you something to triage on.'},
    {f:'--exclude / --excludefile', d:'Leave hosts out — essential to avoid the one production box in your range.'},
    {f:'--source-port', d:'Send from a specific source port (weak-ACL bypass, same trick as nmap).'},
    {f:'--wait / --shard', d:'Timing/parallelism control.'}
  ],
  examples:[
    { cmd:`sudo masscan -p1-65535 10.10.10.0/24 --rate 1000 -oL masscan.lst`, note:'Find open ports across a subnet quickly.' },
    { cmd:`grep -oE '[0-9]+/open' masscan.lst | cut -d/ -f1 | paste -sd, | xargs -I{} nmap -sV -sC -p{} -oA detail 10.10.10.5`, note:'The handoff: masscan finds ports, nmap gets detail. The standard pattern.' },
    { cmd:`sudo masscan -iL range.txt -p443,8443,3389 --rate 2000 --banners -oJ tls.json`, note:'Targeted sweep for specific interesting services.' }
  ],
  opsec:['A high --rate can saturate links and knock over network devices. This is a denial-of-service risk, not just a noise issue. Get explicit written approval for both the range and the rate.','Never use masscan on the public internet against ranges you do not own or have written authorisation for. It is not "passive" and it is not subtle.'],
  tips:['Always set --exclude for anything the client said is fragile. A single excluded production host saves the engagement.'],
  links:[{t:'masscan on GitHub', u:'https://github.com/robertdavidgraham/masscan'}],
  related:['t-nmap','t-rustscan-doc','t-shodan'] },

{ id:'t-rustscan-doc', name:'rustscan', kind:'tool', phases:['RECON'],
  pkg:'apt install rustscan', tagline:'Fast port discovery with automatic handoff to nmap for detail.',
  what:'Scans all 65535 ports very quickly then automatically invokes nmap on the open ones. Convenient middle ground between masscan\'s raw speed and nmap\'s depth, with a friendlier interface than either.',
  syntax:'rustscan -a TARGET [--ulimit N] [-- -nmap flags]',
  flags:[
    {f:'-a / -r / --range', d:'Address(es), CIDR, file of targets.'},
    {f:'--ulimit', d:'Raise file descriptor limits — the usual first failure on a fresh install. 5000 is a good value.'},
    {f:'-b / --batch-size', d:'Concurrency. Lower it against sensitive targets.'},
    {f:'-- -sV -sC', d:'Everything after -- is passed to nmap. This is the point of the tool.'},
    {f:'-t / --timeout', d:'Per-port timeout.'},
    {f:'--scripts', d:'Run nmap scripts on discovery.'}
  ],
  examples:[
    { cmd:`rustscan -a 10.10.10.5 --ulimit 5000 -- -sV -sC`, note:'Full port sweep plus service detection in one command.' },
    { cmd:`rustscan -a 10.10.10.0/24 -b 2000 -- -Pn --open`, note:'Subnet sweep with the "host may be firewalled" flag passed through.' }
  ],
  opsec:['Same as any scanner: logged by the target and by any IDS. Authorised ranges only.'],
  tips:['If rustscan fails instantly with a "too many open files" error, it is --ulimit, not the network. Check that first.'],
  links:[{t:'rustscan on GitHub', u:'https://github.com/bee-san/RustScan'}],
  related:['t-nmap','t-masscan'] },

{ id:'t-gobuster', name:'gobuster', kind:'tool', phases:['RECON'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Fast brute forcing of web paths, DNS names, and virtual hosts. Simple and reliable.',
  what:'Go-based brute forcer with three main modes: dir (paths/files on a web server), dns (subdomains), vhost (virtual hosts on one IP). Faster than dirb, simpler to configure than ffuf — the right default for a first pass.',
  syntax:'gobuster dir -u URL -w WORDLIST [-x EXTENSIONS] [-t THREADS] [-o OUT]',
  flags:[
    {f:'dir / dns / vhost / fuzz', d:'Mode. dir is the most used; vhost finds sites sharing one IP that DNS does not list.'},
    {f:'-u / -d', d:'Target URL (dir) / target domain (dns).'},
    {f:'-w', d:'Wordlist. /usr/share/wordlists/dirb/common.txt to start, raft-medium for depth.'},
    {f:'-x php,html,txt,bak,zip', d:'Extensions to append. bak and zip frequently turn up source and backups.'},
    {f:'-t 40', d:'Threads. 20-50 is polite; 200 will trip WAFs and tarpits.'},
    {f:'-s / -b', d:'Status codes to show (-s) or hide (-b). Default shows interesting ones; -b 404,403 trims noise.'},
    {f:'--exclude-length', d:'Hide responses of a given size — the cure for soft-404 pages.'},
    {f:'-k / --no-tls-validation', d:'Accept self-signed certs.'},
    {f:'-o file / --no-error', d:'Save results / suppress non-fatal errors in the console.'},
    {f:'-c COOKIE / -H HEADER', d:'Authenticated brute forcing and custom headers (JWT, X-Forwarded-For).'}
  ],
  examples:[
    { cmd:`gobuster dir -u http://10.10.10.5 -w /usr/share/wordlists/dirb/common.txt -x php,html,txt,bak`, note:'The standard first web enumeration pass.' },
    { cmd:`gobuster vhost -u http://10.10.10.5 -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain`, note:'Discover sites on the same IP that DNS does not advertise. Often the best find on a box.' },
    { cmd:`gobuster dir -u http://10.10.10.5 -w raft-medium-directories.txt -b 404,403 --exclude-length 1234 -t 40 -o gobuster.txt`, note:'Noise-suppressed, logged, production-sane.' }
  ],
  opsec:['Brute forcing is loud in access logs and triggers WAF rules quickly at high thread counts. Start at -t 20 and watch for 429s.'],
  tips:['vhost mode is under-used and over-delivers. A virtual host that is not in DNS frequently hosts the staging environment.'],
  links:[{t:'gobuster on GitHub', u:'https://github.com/OJ/gobuster'}],
  related:['t-ffuf','t-feroxbuster','t-nikto'] },

{ id:'t-ffuf', name:'ffuf', kind:'tool', phases:['RECON','EXPLOIT'],
  pkg:'preinstalled on Kali/Parrot', tagline:'The flexible fuzzer: paths, parameters, vhosts, POST bodies, everything, with exact filters.',
  what:'Fuzz Faster U Fool. Anywhere you can put the FUZZ keyword — URL path, query value, header, POST body, hostname — ffuf will iterate a wordlist through it. Its filtering is the most precise of any comparable tool, which is what makes it the professional default.',
  syntax:'ffuf -u URL/FUZZ -w WORDLIST [-mc] [-fc] [-fs] [-t N] [-of json] [-o out.json]',
  flags:[
    {f:'FUZZ keyword', d:'Placement marker. Can appear multiple times; other keywords like W1/W2 come from -w name:file.'},
    {f:'-w', d:'Wordlist, or name:path for multiple lists (W1, W2) and combinatorial fuzzing.'},
    {f:'-mc / -fc', d:'Match / filter status codes. -mc 200,204,301,302,401,403 covers most real hits.'},
    {f:'-fs / -ms', d:'Filter / match by response size. The essential tool against soft-404s.'},
    {f:'-fw / -mw', d:'Filter/match by word count. Another soft-404 discriminator.'},
    {f:'-fl / -ml', d:'Filter/match by line count.'},
    {f:'-t 100 / -rate 50', d:'Threads (races) / requests per second cap. Use -rate against monitored targets.'},
    {f:'-recursion -recursion-depth 2', d:'Automatically recurse into discovered directories.'},
    {f:'-X POST -d "u=FUZZ&p=x"', d:'Non-GET methods and bodies. -H for headers.'},
    {f:'-ac', d:'Auto-calibrate filters by sampling the target. A very useful one-flag fix for soft-404 noise.'},
    {f:'-of json -o out.json', d:'Structured output for post-processing and reporting.'},
    {f:'-e .php,.bak', d:'Extension list.'}
  ],
  examples:[
    { cmd:`ffuf -u http://10.10.10.5/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -mc 200,301,302,401,403 -ac -t 60`, note:'Default first pass with auto-calibration. -ac kills most false positives.' },
    { cmd:`ffuf -u 'http://10.10.10.5/api?FUZZ=1' -w params.txt -fs 1234 -mc all`, note:'Parameter discovery, filtered by response size.' },
    { cmd:`ffuf -u http://10.10.10.5/ -H 'Host: FUZZ.10.10.10.5' -w subs.txt -fs 4242`, note:'Virtual host discovery when DNS is a dead end.' },
    { cmd:`ffuf -u http://10.10.10.5/login -X POST -d 'username=admin&password=FUZZ' -w pass.txt -fc 200`, note:'Authenticated fuzzing; filter on the failure code.' },
    { cmd:`curl -s -o /dev/null -w '%{size_download}\\n' http://10.10.10.5/nonexistent`, note:'Calibrate manually first: this size is your -fs value.' }
  ],
  opsec:['-t 100 is a scanner signature and will get you rate-limited or blocked on anything with a WAF. Cap with -rate when the client monitors their edge.','Always log your fuzzing to JSON. "We found /backup.zip" needs the timestamp and status code in the report.'],
  tips:['Auto-calibration (-ac) plus match-all (-mc all) plus size-filtering is the professional combination: it turns a flood of identical soft-404s into a short, credible hit list.'],
  links:[{t:'ffuf wiki', u:'https://github.com/ffuf/ffuf/wiki'}],
  related:['t-gobuster','t-feroxbuster','t-burp'] },

{ id:'t-feroxbuster', name:'feroxbuster', kind:'tool', phases:['RECON'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Recursive content discovery in Rust, with sensible defaults and filtering built in.',
  what:'A recursive directory brute forcer that auto-follows discovered directories, filters wildcard/soft-404 responses automatically, supports multiple extensions and extraction of links from downloaded content. Good defaults mean less tuning than ffuf.',
  syntax:'feroxbuster -u URL -w WORDLIST [-x ext] [-d depth] [-o out]',
  flags:[
    {f:'-u / -t threads', d:'Target URL and concurrency (default 50).'},
    {f:'-w / --wordlist', d:'Wordlist. The raft-* SecLists files work well.'},
    {f:'-x php,html,js', d:'Extensions to append to each entry.'},
    {f:'-d / --depth', d:'Recursion depth limit. 4 is usually plenty.'},
    {f:'--filter-status / --filter-size', d:'Explicit exclusions — feroxbuster also auto-detects wildcards.'},
    {f:'--extract-links', d:'Pull new paths out of responses as it scans. Finds API routes referenced in JS.'},
    {f:'--proxy http://127.0.0.1:8080', d:'Send everything through Burp. Excellent for triaging what it found.'},
    {f:'-o / -q / -v', d:'Output file, quiet, verbose.'},
    {f:'--resume-from ferox-...state', d:'Resume an interrupted scan. Matters on long recursive runs.'}
  ],
  examples:[
    { cmd:`feroxbuster -u http://10.10.10.5 -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,html,txt -d 3`, note:'Recursive discovery with sensible defaults.' },
    { cmd:`feroxbuster -u http://10.10.10.5 -w raft-medium-words.txt --extract-links --proxy http://127.0.0.1:8080 -o ferox.txt`, note:'Through Burp, with link extraction — a strong second pass.' }
  ],
  opsec:['Recursion multiplies request volume fast. Four levels deep with a 30k wordlist is millions of requests on a badly-configured target. Cap depth and threads.'],
  tips:['Filtering into Burp via --proxy is the best triage workflow: you get a clean, reviewable HTTP history of exactly what the scanner found.'],
  links:[{t:'feroxbuster on GitHub', u:'https://github.com/epi052/feroxbuster'}],
  related:['t-ffuf','t-gobuster','t-burp'] },

{ id:'t-nikto', name:'nikto', kind:'tool', phases:['RECON'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Web server scanner: outdated software, dangerous files, headers, and thousands of known issues.',
  what:'Checks a web server against a large database of known problematic files, CGI scripts, outdated versions and misconfigurations. Noisy and prone to false positives, but useful as a broad first sweep and as evidence of due diligence.',
  syntax:'nikto -h TARGET [-p PORT] [-ssl] [-Tuning ...] [-o out.html -Format html]',
  flags:[
    {f:'-h / -p / -ssl', d:'Host (URL or IP), port, force TLS.'},
    {f:'-Tuning x', d:'Scan tuning: 1 interesting files, 2 misconfig, 3 disclosure, 4 injection (intrusive), 9 SQL injection (very intrusive).'},
    {f:'-maxtime', d:'Hard time cap, e.g. 600s. Essential — nikto runs are long by default.'},
    {f:'-o -Format', d:'Output file and format: html, csv, txt, xml. HTML is easiest to hand over.'},
    {f:'-id / -H', d:'HTTP basic auth credentials / custom header (host header, cookies).'},
    {f:'-useproxy http://127.0.0.1:8080', d:'Route through Burp so you can see and replay every request it makes.'},
    {f:'-Cgidirs all', d:'Check all CGI directories.'},
    {f:'-update', d:'Update the vulnerability database. Do this after install.'}
  ],
  examples:[
    { cmd:`nikto -h http://10.10.10.5 -maxtime 300s -o nikto.html -Format html`, note:'Time-capped broad scan with a deliverable output file.' },
    { cmd:`nikto -h http://10.10.10.5 -Tuning 123b -useproxy http://127.0.0.1:8080`, note:'Non-intrusive tuning, all requests visible in Burp.' },
    { cmd:`nikto -h 10.10.10.5 -p 8443 -ssl -maxtime 240s`, note:'TLS service on a non-standard port.' }
  ],
  opsec:['Tuning option 9 (SQLi) actively injects payloads — that is an intrusive test and needs explicit scope approval. Default tuning is safe-ish; verify before running anything with 4 or 9.','Nikto is extremely loud in the access log. If a client asked for stealth, do not run nikto.'],
  tips:['Nikto output is a starting list, not a findings section. Every hit needs manual verification before it goes in a report — its false positive rate is high and clients know it.'],
  links:[{t:'Nikto project page', u:'https://cirt.net/Nikto2'}],
  related:['t-gobuster','t-whatweb','t-nuclei'] },

{ id:'t-whatweb', name:'whatweb', kind:'tool', phases:['RECON'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Web technology fingerprinting: CMS, frameworks, server, plugins, versions.',
  what:'Identifies the technologies behind a site by matching headers, cookies, HTML patterns, and file paths. Knowing "this is WordPress 6.4 with a vulnerable plugin" turns generic web testing into targeted work.',
  syntax:'whatweb [-a LEVEL] [-v] TARGET [TARGET...]',
  flags:[
    {f:'-a 1..4', d:'Aggression. 1 passive (headers only), 3 aggressive (adds requests for known paths), 4 heavy.'},
    {f:'-v', d:'Verbose: show every plugin match with evidence. The useful mode.'},
    {f:'--log-json=file', d:'Structured output for later correlation across many hosts.'},
    {f:'-i / --input-file', d:'Targets from a file — feed it your httpx live list.'},
    {f:'--user-agent / --header', d:'Spoof the UA or add headers when a WAF blocks the default.'},
    {f:'--proxy', d:'Through Burp.'}
  ],
  examples:[
    { cmd:`whatweb -a3 -v http://10.10.10.5`, note:'Aggressive fingerprint of a single target.' },
    { cmd:`whatweb --input-file=live.txt --log-json=tech.json -a 1`, note:'Passive fingerprint across a whole host list.' },
    { cmd:`whatweb -a3 http://10.10.10.5 | grep -oE 'WordPress\\[[^]]+\\]'`, note:'Extract just the CMS + version for CVE hunting.' }
  ],
  opsec:['Aggression level 3 and above sends extra requests for known file paths — visible in logs. Level 1 is header-only and near-invisible.'],
  tips:['Correlate fingerprinted versions with searchsploit and nuclei templates. Fingerprinting is only worth it if you act on the version number.'],
  links:[{t:'whatweb on GitHub', u:'https://github.com/urbanadventurer/WhatWeb'}],
  related:['t-wpscan','t-nuclei','t-httpx'] },

{ id:'t-enum4linux', name:'enum4linux / enum4linux-ng', kind:'tool', phases:['RECON'],
  pkg:'preinstalled on Kali/Parrot', tagline:'One-command Windows/SMB enumeration: users, groups, shares, password policy, OS info.',
  what:'Wraps rpcclient, net, nmblookup and smbclient into a single enumeration pass against a Windows or Samba host. The -ng rewrite adds JSON output, better parsing, coloured findings and fewer false positives.',
  syntax:'enum4linux-ng -A TARGET -oJ out.json\nenum4linux -a TARGET',
  flags:[
    {f:'-A / -a', d:'All simple enumeration: users, groups, shares, policy, OS. (-a on the original.)'},
    {f:'-U / -S / -G / -P', d:'Users only / shares only / groups only / password policy only.'},
    {f:'-oJ / -oY', d:'JSON / YAML output — the whole point of using -ng. Report-friendly.'},
    {f:'-u user -p pass', d:'Authenticated enumeration. Unauthenticated gets far less on a patched host.'},
    {f:'-k user', d:'kerberos auth mode (with -ng): -k user -a dc01.zoth.local -K zoth.local.'},
    {f:'-w', d:'Do not run the (slow, sometimes destructive) RID cycling pass.'}
  ],
  examples:[
    { cmd:`enum4linux-ng -A 10.10.10.5 -oJ enum4linux.json`, note:'Full enumeration with structured output. Always start here on port 139/445.' },
    { cmd:`enum4linux -a 10.10.10.5 | tee enum.txt`, note:'Classic version. Slower, noisier, still everywhere.' },
    { cmd:`enum4linux-ng -U 10.10.10.5 -u '' -p ''`, note:'Users via a null session. Most modern hosts refuse this — then use RID cycling or credentials.' }
  ],
  opsec:['RID cycling generates a lot of SMB requests and can be logged as enumeration in Windows event logs (and is slow). -w skips it.','Null sessions are disabled on any patched Windows. An anonymous success is itself a finding worth reporting.'],
  tips:['If enum4linux returns almost nothing, that is usually correct on a modern host: switch to authenticated enumeration with nxc and any credentials you have.'],
  links:[{t:'enum4linux-ng on GitHub', u:'https://github.com/cddmp/enum4linux-ng'},{t:'enum4linux-ng (Kali docs)', u:'https://www.kali.org/tools/enum4linux-ng/'}],
  related:['t-netexec','t-smbmap','t-impacket'] },

{ id:'t-smbmap', name:'smbmap', kind:'tool', phases:['RECON'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Per-share SMB permission matrix: what you can read, write and execute on every share.',
  what:'Lists shares and, crucially, shows your access level on each — read, write, or none. Answers "where can I actually write a file" which is what matters for relay, drop-and-execute, and lateral movement.',
  syntax:'smbmap -H HOST -u USER -p PASS [-r SHARE] [-R] [-d DOMAIN]',
  flags:[
    {f:'-H', d:'Target host. There is no flag that makes smbmap do external internet scans; host or range with -H.'},
    {f:'-u / -p / -d', d:'Username, password (or -p \'\' for none), domain.'},
    {f:'-r SHARE', d:'Recursively list one share.'},
    {f:'-R', d:'Recurse everything it can — good for finding the interesting file quickly.'},
    {f:'-A / -L', d:'Local admin check on, or list all shares (default).'},
    {f:'-x CMD', d:'Execute a command (requires admin). Treat as a code-execution action.'},
    {f:'-H -P PORT', d:'Custom SMB port,'}
  ],
  examples:[
    { cmd:`smbmap -H 10.10.10.5 -u '' -p ''`, note:'Null-session permission matrix. Write permission on the first run is a Critical finding.' },
    { cmd:`smbmap -H 10.10.10.5 -u user -p pass -R -q`, note:'Recursive listing of everything readable; hunt for configs, backups, scripts, .kdbx files.' },
    { cmd:`smbmap -H 10.10.10.0/24 -u user -p pass -a`, note:'Check write access across a netblock. Watch for lockouts.' }
  ],
  opsec:['-x executes commands on the target. That is code execution: only with authorisation, and only when you need it.','Ranges with -H and credentials means many authentication attempts. Track them, and stop if lockout thresholds approach.'],
  tips:['Write access to a share is the difference between "we could read files" (Medium) and "we could plant a payload a user would execute" (Critical). Confirm write access explicitly with a harmless test file, then delete it and say so in the report.'],
  links:[{t:'smbmap on GitHub', u:'https://github.com/ShawnDEvans/smbmap'}],
  related:['t-netexec','t-enum4linux','t-responder'] },

{ id:'t-netexec', name:'NetExec (nxc)', kind:'tool', phases:['RECON','EXPLOIT'],
  pkg:'apt install netexec', tagline:'The CrackMapExec replacement: one tool across SMB, LDAP, WinRM, MSSQL, RDP, SSH and more.',
  what:'NetExec (binary nxc) is the maintained successor to CrackMapExec. Same syntax and modules, active development, better LDAP support, and a large module library (MOTD, spider_plus, lsassy, ntds, etc.). It is the single most useful Windows-network tool in this manual: spray credentials across a subnet, enumerate AD over LDAP, execute commands, dump hashes.',
  syntax:'nxc smb TARGET -u USER -p \'PASS\' --shares\nnxc ldap TARGET -u USER -p \'PASS\' --users',
  flags:[
    {f:'protocol', d:'smb, ldap, winrm, mssql, rdp, ssh, ftp, nfs, vnc, wmi.'},
    {f:'targets', d:'IP, CIDR, hostname, or file of targets.'},
    {f:'-u / -p / -H / -d', d:'Username, password, NTLM hash (pass-the-hash), domain.'},
    {f:'-u users.txt -p pass', d:'Password spraying: one password across a user list. --continue-on-success keeps going after a hit.'},
    {f:'--shares / --users / --groups / --sessions', d:'The enumeration workhorses.'},
    {f:'--pass-pol / --local-groups / --loggedon-users', d:'Password policy, local groups, where users are logged in (footholds for lateral movement).'},
    {f:'--sam / --lsa / --ntds', d:'Dump SAM/SYSTEM, LSA secrets, or the whole NTDS.dit. The last one is Domain Admin.'},
    {f:'-x / -X', d:'Execute a command / a PowerShell command. Code execution — authorised use only.'},
    {f:'-M MODULE / -L', d:'Run a module / list available modules. spider_plus, lsassy, motd, gpp_password, etc.'},
    {f:'--kerberoasting FILE / --asreproast FILE', d:'Request crackable hashes over LDAP. Quiet and high value.'},
    {f:'--gen-relay-list FILE', d:'Output hosts with SMB signing disabled — your relay target list.'},
    {f:'--local-auth', d:'Try credentials against the local SAM rather than the domain.'}
  ],
  examples:[
    { cmd:`nxc smb 10.10.10.0/24`, note:'Subnet sweep: OS, hostname, domain, signing status per host. The first command on any Windows engagement.' },
    { cmd:`nxc smb 10.10.10.0/24 -u user -p 'Passw0rd!' --continue-on-success`, note:'Spray one credential everywhere before you brute force anything.' },
    { cmd:`nxc smb 10.10.10.0/24 -u user -H 8846f7eaee8fb117ad06bdd830b7586c --continue-on-success`, note:'Pass-the-hash sweep. Very often finds where a stolen hash still works.' },
    { cmd:`nxc ldap 10.10.10.10 -u user -p pass --kerberoasting kerb.txt`, note:'Kerberoast without touching Kerberos protocol limits. Crack offline later.' },
    { cmd:`nxc smb 10.10.10.0/24 --gen-relay-list relay.txt && impacket-ntlmrelayx -tf relay.txt -smb2support`, note:'The relay pipeline: find unsigned SMB, then relay to it.' },
    { cmd:`nxc winrm 10.10.10.20 -u user -p pass -x whoami`, note:'Quietest code execution path. Prefer this over psexec: no service creation, no dropped binary.' }
  ],
  opsec:['Every authentication attempt is logged in Windows security event logs. Spraying 200 users with 5 passwords is 1000 events — get written approval first.','--ntds and --sam extract credential material. That is the definition of "engagement over, call the client immediately" if you did it in production without explicit scope for credential dumping.','-x and modules like spider_plus change the target. Prefer read-only enumeration until you have a reason to write.'],
  tips:['Replace "crackmapexec" with "nxc" in every tutorial you read — the flags are identical and NetExec is the maintained project.','-L lists all modules; nxc <proto> -M <module> --help documents a module. The module library is where the real capability lives.'],
  links:[{t:'NetExec on GitHub', u:'https://github.com/Pennyw0rth/NetExec'},{t:'NetExec docs', u:'https://www.netexec.wiki/'}],
  related:['t-impacket','t-bloodhound','t-responder','t-enum4linux'] },

{ id:'t-nuclei', name:'nuclei', kind:'tool', phases:['RECON','EXPLOIT'],
  pkg:'apt install nuclei', tagline:'Template-driven vulnerability scanner: 10,000+ community checks, fast, precise, pipeline-native.',
  what:'Runs YAML templates against targets. Each template is a specific check — a CVE, a misconfiguration, a default credential, an exposed path. Because checks are data rather than code, the library grows constantly and you can write your own in a few lines. It is the modern replacement for the "run a big scanner and paste the output" workflow.',
  syntax:'nuclei -u URL | -l hosts.txt [-t template] [-severity high,critical] [-o out]',
  flags:[
    {f:'-u / -l', d:'Single target or a list of hosts/URLs.'},
    {f:'-t / -tags / -tl', d:'Specific template(s), by tag (cve, rce, exposure, default-login), or list all templates.'},
    {f:'-severity critical,high,medium', d:'Filter by severity. Start high and critical on a first pass.'},
    {f:'-as', d:'Automatic scan: runs templates relevant to the detected technologies. The fastest useful default.'},
    {f:'-o / -jsonl / -markdown-export DIR', d:'Output formats. Markdown export is genuinely report-ready.'},
    {f:'-rl / -c / -bs', d:'Rate limit, concurrency, bulk size. Throttle for monitored or fragile targets.'},
    {f:'-proxy http://127.0.0.1:8080', d:'Through Burp, so you can see every request it made.'},
    {f:'-update-templates / -ut', d:'Update the template library. Do this before every engagement.'},
    {f:'-stats -si 30', d:'Live progress stats every 30 seconds.'},
    {f:'-dast', d:'Enable fuzzing templates. Much noisier and slower; scope-approve it first.'}
  ],
  examples:[
    { cmd:`nuclei -update-templates && nuclei -l live.txt -severity critical,high -o nuclei.txt`, note:'Update, then high-signal scan across a discovered host list.' },
    { cmd:`nuclei -u http://10.10.10.5 -as -o nuclei-autoscan.txt`, note:'Automatic technology-aware scanning. The best single command when you are short on time.' },
    { cmd:`nuclei -u http://10.10.10.5 -tags default-login,exposure -o creds-notes.txt`, note:'Hunt for default credentials and exposed files specifically.' },
    { cmd:`nuclei -l urls.txt -t http/cves/2021/ -severity critical,high -rl 50 -o cves.txt`, note:'CVE-focused pass with a rate cap for a monitored target.' }
  ],
  opsec:['Template depth varies: some are read-only probes, some send payloads, -dast actively fuzzes. Read the template before you enable it on a production target.','At default concurrency nuclei is loud. -rl 50 is a reasonable compromise on a client network.'],
  tips:['Nuclei findings are a lead, not a finding. Anything critical still needs manual verification and a screenshot before it goes in the report.','Writing your own template is a ten-minute job and a genuine differentiator: encode the bug that keeps appearing in your clients\' stack.'],
  links:[{t:'nuclei on GitHub', u:'https://github.com/projectdiscovery/nuclei'},{t:'nuclei template docs', u:'https://docs.projectdiscovery.io/templates'}],
  related:['t-httpx','t-nikto','t-subfinder'] },

{ id:'t-burp', name:'Burp Suite', kind:'tool', phases:['EXPLOIT'],
  pkg:'preinstalled on Kali/Parrot (Community)', tagline:'The web testing platform. Proxy, Repeater, Intruder, Scanner, Decoder. Learn the loop, not the menu.',
  what:'An intercepting proxy with a toolkit built around it. Everything you do in web application testing goes through Burp: see the request, modify it, replay it, automate a payload over one position, diff two responses, decode a token. Community edition is free and sufficient to learn everything; Pro adds the automated scanner and removes Intruder rate limiting.',
  syntax:'burpsuite                  # GUI; proxy listens on 127.0.0.1:8080',
  flags:[
    {f:'Proxy > Options', d:'Listener config. Default 127.0.0.1:8080. Set "and URL is in target scope" if you configure scope, to avoid proxying the internet.'},
    {f:'Proxy > Intercept', d:'Pause and edit requests in flight. Leave it OFF for normal browsing; turn on deliberately.'},
    {f:'Proxy > HTTP history', d:'Every request ever, filterable by scope, method, MIME type, status, search term. Your working memory.'},
    {f:'Target > Scope', d:'Define scope once; then "show only in-scope items" halves the noise and keeps client data out of your history.'},
    {f:'Repeater', d:'Ctrl-R. Edit and resend a single request, see raw response. Where most of your actual work happens.'},
    {f:'Intruder', d:'Ctrl-I. Mark payload positions with § §, choose a payload set and attack type, run. Community edition is throttled — use ffuf for large lists.'},
    {f:'Decoder', d:'Encode/decode base64, hex, URL, HTML, JWT pieces. Also "smart decode" on selected text.'},
    {f:'Comparer', d:'Byte-level diff of two responses. Essential for blind boolean-logic work.'},
    {f:'Extensions (BApp Store)', d:'Community edition supports extensions: Logger++ , Autorize (access control), Param Miner, Turbo Intruder, JWT Editor.'},
    {f:'-project-file / --config-file', d:'Launch flags for reproducible setups and headless CI use.'}
  ],
  examples:[
    { cmd:`burpsuite &`, note:'Start it. Then set FoxyProxy to 127.0.0.1:8080 and trust the CA from http://burp.' },
    { cmd:`curl --proxy http://127.0.0.1:8080 http://10.10.10.5/ -k`, note:'Route CLI traffic through Burp so it lands in HTTP history.' },
    { cmd:`# Repeater workflow`, note:'History → right-click the interesting request → Send to Repeater → change one parameter → Send → compare response length and content.' },
    { cmd:`# Autorize extension workflow`, note:'Load Autorize, give it a low-privilege session cookie, then browse as the admin. Every request that returns 200 is a broken access control candidate.' }
  ],
  opsec:['Only ever put authorised targets in scope, and clear HTTP history between engagements. Proxy history routinely contains session cookies and credentials that are not yours.','Burp\'s scanner (Pro) is loud. A full crawl against a production app is a load test the client did not ask for.'],
  tips:['Install the CA in the right trust store: Firefox has its own, Chromium uses the system store. Nine out of ten "Burp is broken" issues are this.','Autorize is the highest-value community extension: it automates the broken-access-control testing that dominates modern findings. Install it on day one.'],
  links:[{t:'PortSwigger Web Security Academy (free labs)', u:'https://portswigger.net/web-security'},{t:'Burp documentation', u:'https://portswigger.net/burp/documentation'},{t:'Caido (modern alternative)', u:'https://caido.io/'}],
  related:['t-zap','t-sqlmap','t-ffuf'] },

{ id:'t-zap', name:'OWASP ZAP', kind:'tool', phases:['EXPLOIT'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Free, scriptable web app scanner and proxy with a full automation API. Burp\'s open-source counterpart.',
  what:'An intercepting proxy with an automated scanner that Burp only offers in its paid edition. Its strength is automation: a daemon mode plus a REST API lets you drive full scans from scripts and CI, and its scripting engine supports JavaScript/Python/Groovy for custom checks.',
  syntax:'zap.sh -daemon -port 8090 -host 127.0.0.1\nzap-cli quick-scan --self-contained --spider -r http://TARGET',
  flags:[
    {f:'-daemon -port -host', d:'Headless mode for automation. No GUI.'},
    {f:'-cmd -quickurl URL -quickout file', d:'One-shot scan of a URL straight to a report. No session state needed.'},
    {f:'-config key=value', d:'Override any setting from CLI — scope, scan policy, authentication. How you build reproducible scans.'},
    {f:'API keys + REST', d:'Everything the GUI can do is callable: spider, ascan, alerts, report generation.'},
    {f:'Scan policy', d:'Enable/disable rule categories per engagement: passive rules are safe everywhere, active rules inject payloads.'},
    {f:'Authentication / session handling', d:'Configure form-based auth so authenticated crawl+scan works properly. This is the usual failure point.'},
    {f:'Scripting console', d:'Standalone, targeted, proxy and payload scripts in several languages.'}
  ],
  examples:[
    { cmd:`zap.sh -cmd -quickurl http://10.10.10.5 -quickout /tmp/zap.html`, note:'Quickest possible full scan with an HTML report.' },
    { cmd:`zap.sh -daemon -port 8090 -host 127.0.0.1 -config api.key=SECRET`, note:'Daemon for scripted automation.' },
    { cmd:`curl -s "http://127.0.0.1:8090/JSON/spider/action/scan/?apikey=SECRET&url=http://10.10.10.5"`, note:'Start a spider over the API. Chain with ascan and then report generation.' },
    { cmd:`zap.sh -cmd -quickurl http://10.10.10.5 -config scanner.threadPerHost=2 -config scanner.maxScanDurationInMins=20`, note:'Rate-limited, time-capped scan suitable for a monitored target.' }
  ],
  opsec:['Active scanning sends real attack payloads. Passive rules are safe; active rules are not. Read the policy before enabling active scan on production.','ZAP by default crawls aggressively. Set maxScanDuration and threadPerHost to sane values for client networks.'],
  tips:['The -cmd -quickurl mode is the fastest way to a first-pass report on a lab box, and it is genuinely useful for a smoke test in CI.','For authenticated scans, spend the time configuring form-based auth properly. An unauthenticated scan of an app behind login finds almost nothing and wastes an hour.'],
  links:[{t:'ZAP documentation', u:'https://www.zaproxy.org/docs/'},{t:'ZAP automation framework', u:'https://www.zaproxy.org/docs/automate/'}],
  related:['t-burp','t-nuclei','t-sqlmap'] },

{ id:'t-sqlmap', name:'sqlmap', kind:'tool', phases:['EXPLOIT'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Automated SQL injection detection and exploitation. Bound it tightly before you run it.',
  what:'Detects and exploits SQL injection across many DBMSes and injection techniques: boolean/time-based blind, error-based, UNION, stacked, and out-of-band. It can enumerate databases, tables, columns and data, and escalate to OS command execution where the DBMS allows it.',
  syntax:'sqlmap -u \'http://TARGET/item.php?id=1\' --batch --dbs\nsqlmap -r request.txt -p id --batch --tables',
  flags:[
    {f:'-u / -r / --data', d:'Target URL, a saved request file (from Burp), or a POST body.'},
    {f:'-p', d:'Only test the given parameter(s). Essential for focus and for staying bounded.'},
    {f:'--cookie / -H / --headers', d:'Authenticated and header-based injection points.'},
    {f:'--level 1-5', d:'How many injection points and how hard to try. 1 default, 3 typical, 5 exhaustive and slow.'},
    {f:'--risk 1-3', d:'1 safe, 2 adds heavy time-based, 3 adds OR-based payloads that can modify data. Keep it low on live systems.'},
    {f:'--batch', d:'Never prompt. Required for scripts; use it so you can also bound runtime.'},
    {f:'--dbs / -D db --tables / -T t --columns / --dump', d:'Read-only enumeration up the hierarchy, then extract data.'},
    {f:'--technique BEUSTQ', d:'Restrict techniques. U (UNION) is fastest when applicable; T (time) is slowest.'},
    {f:'--threads / --time-sec / --timeout', d:'Concurrency and timing. Bounded values protect the target and your timetable.'},
    {f:'--os-shell / --file-read', d:'Code execution and file read where the DBMS permits. Intrusive: scope-approve explicitly.'},
    {f:'--tamper=SCRIPT', d:'Payload obfuscation to get past WAFs. Look in /usr/share/sqlmap/tamper/.'},
    {f:'--safe-url / --safe-freq', d:'Periodically hit a benign URL to keep the session alive and avoid looking like a pure attack stream.'},
    {f:'--flush-session', d:'Discard cached results when you change options and want a fresh run.'}
  ],
  examples:[
    { cmd:`sqlmap -u 'http://10.10.10.5/item?id=1' --batch --level 3 --risk 2 --dbs`, note:'Bounded first pass: find and enumerate databases.' },
    { cmd:`sqlmap -r sqli-request.txt -p id --batch --technique=BEU --tables`, note:'From Burp: request file plus one focus parameter. The professional workflow.' },
    { cmd:`sqlmap -u 'http://10.10.10.5/item?id=1' -D appdb -T users -C username,password --dump`, note:'Targeted extraction — just enough data to prove the finding.' },
    { cmd:`sqlmap -u 'http://10.10.10.5/login' --data='u=a&p=b' -p p --batch --level 2 --risk 1`, note:'POST-based injection on one parameter.' },
    { cmd:`sqlmap -u 'http://10.10.10.5/' --cookie='session=abc*' --batch`, note:'The * marks the injection point inside a cookie.' }
  ],
  opsec:['--risk 3 includes OR-based payloads that can UPDATE or DELETE rows. That is data modification on a client system and needs explicit written approval.','Full-range scans with --level 5 against production cause load and generate noise the client will see. Bound levels, threads, and use -p to focus.','Never --os-shell or --file-read on production without written scope that names code execution.'],
  tips:['The single best workflow: capture the exact request in Burp, save it to a file, and run sqlmap -r with -p on the parameter you already suspect. Faster, quieter, and far more accurate than blind URL fuzzing.','Always paste the one manual proof (the SLEEP(5) response-time difference) into the report alongside sqlmap output. Clients trust manual evidence more than tool output.'],
  links:[{t:'sqlmap documentation', u:'https://github.com/sqlmapproject/sqlmap/wiki'},{t:'PortSwigger: SQL injection', u:'https://portswigger.net/web-security/sql-injection'}],
  related:['t-burp','t-nuclei','t-wpscan'] },

{ id:'t-wpscan', name:'wpscan', kind:'tool', phases:['EXPLOIT'],
  pkg:'apt install wpscan', tagline:'WordPress-specific scanner: version, vulnerable plugins, themes, users, weak credentials.',
  what:'Enumerates WordPress installations: core version, installed plugins and themes with their versions, exposed usernames, XML-RPC availability, and configuration exposures. Cross-references a vulnerability database (and WPScan\'s own API for current data). WordPress runs a huge share of the web, and the vulnerable plugin is nearly always the way in.',
  syntax:'wpscan --url URL [--enumerate vp,vt,u] [--api-token TOKEN] [--passwords LIST]',
  flags:[
    {f:'--url', d:'Target. Must be a WordPress site (check /wp-login.php and /wp-json/ first).'},
    {f:'--enumerate vp / vt / u / ap', d:'Vulnerable plugins, vulnerable themes, users, all plugins.'},
    {f:'--api-token', d:'WPScan API token for current CVE data — the free tier gives a limited number of requests per day. Without it you get a much thinner result.'},
    {f:'--plugins-detection', d:'mixed (default), passive or aggressive. Aggressive is far more complete and far more visible.'},
    {f:'--passwords / --usernames', d:'Credential attack against xmlrpc or wp-login. Needs the same lockout discipline as hydra.'},
    {f:'--stealthy', d:'Randomised User-Agent, passive detection only. Much quieter.'},
    {f:'--disable-tls-checks', d:'Self-signed certs.'},
    {f:'--random-user-agent / --proxy', d:'WAF avoidance and Burp routing.'},
    {f:'-o / -f', d:'Output file and format (JSON for parsing).'}
  ],
  examples:[
    { cmd:`wpscan --url http://10.10.10.5 --enumerate vp,vt,u --api-token $WPSCAN_TOKEN`, note:'Core plugin/theme/user enumeration with current vulnerability data.' },
    { cmd:`wpscan --url http://10.10.10.5 --enumerate ap --plugins-detection aggressive -o wpscan.json -f json`, note:'Find every installed plugin, aggressively. Only on an authorised, non-fragile target.' },
    { cmd:`curl -s http://10.10.10.5/wp-json/wp/v2/users | jq -r '.[].slug'`, note:'Faster than wpscan for user enumeration when the REST API is open.' }
  ],
  opsec:['--enumerate ap with aggressive detection makes a large number of requests and will be seen (and possibly blocked). Use --stealthy if the client monitors their edge.','Credential attacks via XML-RPC bypass some login-rate-limiting plugins — that is a finding worth reporting, and a reason to be doubly careful about lockouts.'],
  tips:['WordPress is worth a full pass every time you see it: a plugin three versions behind is a Critical finding with a trivial remediation ("update it"), and it takes fifteen minutes to establish.'],
  links:[{t:'WPScan documentation', u:'https://github.com/wpscanteam/wpscan/wiki'},{t:'WPScan vulnerability database', u:'https://wpscan.com/vulnerability-database'}],
  related:['t-whatweb','t-nuclei','t-nikto'] },

{ id:'t-curl', name:'curl', kind:'tool', phases:['RECON','EXPLOIT'],
  pkg:'preinstalled', tagline:'Speak HTTP properly from the shell. The most-used tool in this manual after nmap.',
  what:'Everything HTTP, from the terminal: custom methods, headers, cookies, authentication, redirects, TLS options, proxies, timing and size measurement. When you need to reproduce a request precisely, prove a finding, or script a check across many hosts, curl is the answer.',
  syntax:'curl -sS -D- -o /dev/null http://TARGET\ncurl -sS -x http://127.0.0.1:8080 http://TARGET',
  flags:[
    {f:'-sS', d:'Silent but still show errors. The combination you want in scripts (never -s alone).'},
    {f:'-i / -I', d:'Show response headers with body / headers only (HEAD request).'},
    {f:'-X / -d / --data-urlencode', d:'Method, request body, safely-encoded form body.'},
    {f:'-H / -b / -c', d:'Custom header / send cookie / write cookie jar.'},
    {f:'-u user:pass / --ntlm', d:'Basic auth and NTLM auth.'},
    {f:'-k / --tlsv1.2 --ciphers', d:'Ignore TLS validation / force a protocol or cipher — how you test weak TLS.'},
    {f:'-L / --max-redirs', d:'Follow redirects / cap them.'},
    {f:'-x http://127.0.0.1:8080', d:'Through a proxy (Burp, or a SOCKS proxy with --socks5).'},
    {f:'--socks5 127.0.0.1:1080', d:'Route through a SOCKS tunnel — reach internal hosts from a pivot.'},
    {f:'-o /dev/null -w "%{http_code} %{size_download} %{time_total}\\n"', d:'The measurement form. Calibrate soft-404s and detect time-based blind injection.'},
    {f:'--path-as-is / --data-binary', d:'Send the path unreduced (path traversal testing) / raw binary body.'}
  ],
  examples:[
    { cmd:`curl -s -o /dev/null -w '%{http_code} %{size_download}\\n' http://10.10.10.5/nope`, note:'Calibrate: this is your baseline soft-404 size for ffuf filtering.' },
    { cmd:`curl -sI http://10.10.10.5/ | head -20`, note:'Headers: server, cookies, missing security headers — a quick finding list.' },
    { cmd:`time curl -s 'http://10.10.10.5/item?id=1%20AND%20SLEEP(5)' -o /dev/null`, note:'Manual proof of time-based blind SQL injection. This belongs in the report.' },
    { cmd:`curl -s --socks5 127.0.0.1:1080 http://10.10.20.5/`, note:'Reach an internal web app through a SOCKS pivot.' },
    { cmd:`curl -s -b 'role=user' -X POST -d 'id=2' http://10.10.10.5/api/admin -i`, note:'Access control test: does a normal-user session work on an admin endpoint?' },
    { cmd:`for u in $(cat urls.txt); do code=$(curl -s -o /dev/null -w '%{http_code}' "$u"); [ "$code" = 200 ] && echo "$code $u"; done`, note:'Live-host filtering across many URLs.' }
  ],
  opsec:['curl is fully logged by the target, exactly like a browser. It is not a stealth tool.','-k disables certificate validation — fine in a lab, and a habit you should consciously switch off for real work.'],
  tips:['Learn the -w write-out variables: http_code, size_download, time_total, and remote_ip. Calibration and blind-injection proof both come from -w.','curl is the tool you use to prove a finding to a skeptical client. A single curl command in the report that any engineer can paste and reproduce is worth a page of prose.'],
  links:[{t:'curl cookbook (everything)', u:'https://everything.curl.dev/'},{t:'curl man page', u:'https://curl.se/docs/manpage.html'}],
  related:['t-burp','t-ffuf','t-httpx'] }

];
