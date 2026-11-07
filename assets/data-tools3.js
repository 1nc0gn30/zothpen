/* ==========================================================================
   ZothPen — tool dossiers (part 3: the credential/wireless long tail)
   Appends to window.ZT. Same schema as parts 1-2.
   ========================================================================== */
window.ZT.push(

{ id:'t-mimikatz', name:'Mimikatz / secretsdump (LSASS)', kind:'tool', phases:['POST','AD'],
  pkg:'preinstalled on Kali (as a Windows binary) / impacket', tagline:'Read credentials out of Windows memory. The most-detected, highest-value action in Windows pentesting.',
  what:'Windows stores recoverable credential material in LSASS: NT hashes of logged-on users, Kerberos tickets, and sometimes cleartext passwords via WDigest on old builds. Mimikatz reads it. On Linux you usually do not run Mimikatz at all — you use impacket-secretsdump remotely, or dump the LSASS process and parse it offline with pypykatz.',
  syntax:'impacket-secretsdump DOMAIN/USER:\'PASS\'@TARGET\npypykatz lsa minidump lsass.dmp\n# inside mimikatz itself:\n# sekurlsa::logonpasswords',
  flags:[
    {f:'privilege::debug', d:'Acquire SeDebugPrivilege. Required before any sekurlsa module. Usually means "be SYSTEM first".'},
    {f:'sekurlsa::logonpasswords', d:'The money command: hashes, tickets, and cleartext where available.'},
    {f:'sekurlsa::wdigest / :tspkg / :kerberos', d:'Target specific credential providers.'},
    {f:'lsadump::sam / :secrets / :cache', d:'Local accounts, LSA secrets, cached domain credentials.'},
    {f:'lsadump::dcsync /user:Administrator', d:'Domain replication abuse — pull any account\'s hash from a DC with the right rights. No code execution on the DC.'},
    {f:'sekurlsa::pth /user: -/ntlm: /run:', d:'Pass-the-hash: spawn a process with another user\'s hash.'},
    {f:'kerberos::golden /silver /sapphire', d:'Forge Kerberos tickets. Golden = krbtgt hash; silver = service account hash.'},
    {f:'Offline path (preferred on Linux)', d:'impacket-secretsdump for remote; or dump LSASS with procdump/rdrleakdiag and parse the .dmp with pypykatz — no Mimikatz binary on the target at all.'},
    {f:'Avoiding the binary', d:'Invoke-Mimikatz (reflectively loaded PowerShell), a Cobalt Strike/Sliver BOF, or pypykatz offline. Nothing touches the target filesystem.'}
  ],
  examples:[
    { cmd:`impacket-secretsdump zoth.local/admin:'P@ss'@10.10.10.10`, note:'Remote SAM + LSA + cached secrets. No binary on target — this is the Linux-native route.' },
    { cmd:`impacket-secretsdump -just-dc-user krbtgt zoth.local/admin:'P@ss'@10.10.10.10`, note:'DCSync a single high-value account. krbtgt means golden tickets.' },
    { cmd:`# With a session on the host`, note:'procdump.exe -accepteula -ma lsass.exe C:\\Windows\\Temp\\lsass.dmp  →  pull it back  →  pypykatz lsa minidump lsass.dmp' },
    { cmd:`pypykatz lsa minidump lsass.dmp -j > creds.json`, note:'Offline parse of a dump you pulled back. The least intrusive way to get the same result.' }
  ],
  opsec:['Accessing lsass.exe is the single most reliable way to get caught on Windows. Every modern EDR hooks it, PPL/Credential Guard blocks it on hardened systems, and the resulting telemetry is a critical alert. Assume full detection and say so in the report.','Cleartext passwords and NT hashes are the client\'s most sensitive data. They go into the encrypted evidence store with an access log, and the report must state exactly what you extracted and what the client must rotate.'],
  tips:['On modern hardened estates, LSASS reading is often blocked outright — know the alternatives: DCSync (secretsdump without touching a workstation), AD CS abuse, DPAPI secret decryption, and credential hunting in configs and shares. The path to credentials matters less than getting there without an alert you cannot explain.','DCSync is usually the better choice: it produces one synthetic replication request to the DC rather than code execution and memory access on a workstation.'],
  links:[{t:'Mimikatz (GentilKiwi)', u:'https://github.com/gentilkiwi/mimikatz'},{t:'pypykatz', u:'https://github.com/skelsec/pypykatz'},{t:'impacket-secretsdump', u:'https://github.com/fortra/impacket'}],
  related:['t-impacket','t-netexec','t-windows-privesc-doc','t-bloodhound'] },

{ id:'t-hcxtools', name:'hcxtools / hcxdumptool', kind:'tool', phases:['MASTERY'],
  pkg:'apt install hcxtools hcxdumptool', tagline:'Modern WPA capture: PMKID from one frame, no deauth, no waiting for a handshake.',
  what:'hcxdumptool captures 802.11 traffic and requests PMKIDs — a value derived from the pre-shared key that is sent by the AP itself on the first frame of a new association. That means you can obtain crackable material with no connected client and no deauthentication. hcxpcapngtool converts the capture into the hashcat 22000 format.',
  syntax:'hcxdumptool -i wlan0mon -o dump.pcapng   →   hcxpcapngtool -o hash.hc22000 -E essids dump.pcapng   →   hashcat -m 22000',
  flags:[
    {f:'-i INTERFACE', d:'Monitor-mode interface.'},
    {f:'-o FILE', d:'Output pcapng. Use a filename per target so you can attribute it.'},
    {f:'--enable_status=1', d:'Live progress: which APs, whether a PMKID or handshake was captured.'},
    {f:'-c CHANNEL', d:'Stay on one channel (faster on a known target); omit to hop.'},
    {f:'--filterlist_ap / --filtermode', d:'Target a specific BSSID from a file.'},
    {f:'hcxpcapngtool -E ESSIDS', d:'Also write the ESSID list. -o is the hashcat 22000 output.'},
    {f:'--all / -z', d:'Include handshakes as well as PMKIDs where available.'},
    {f:'-F / --use_rdbi', d:'Force the RSN PMKID request on association — this is what makes PMKID capture reliable.'},
    {f:'hashcat -m 22000', d:'The only mode you need afterwards. GPUs make short/weak PSKs a matter of minutes.'}
  ],
  examples:[
    { cmd:`sudo hcxdumptool -i wlan0mon -o dump.pcapng --enable_status=1`, note:'Passive PMKID hunting with live status. No client, no deauth, no user impact.' },
    { cmd:`sudo hcxdumptool -i wlan0mon -c 6 --bssid_list=target.txt -o dump.pcapng`, note:'Targeted capture on one channel. Much faster when you already know the AP.' },
    { cmd:`hcxpcapngtool -o hash.hc22000 -E essids.txt dump.pcapng`, note:'Convert to hashcat 22000 format and save the ESSIDs for your report.' },
    { cmd:`hashcat -m 22000 hash.hc22000 /usr/share/wordlists/rockyou.txt --status`, note:'Crack. Report found PSKs as a policy finding as well as a technical one.' }
  ],
  opsec:['PMKID capture is passive: you never disconnect anyone. That is the operational advantage and it is worth explaining to a client who expects wireless testing to mean deauth attacks.','A captured PMKID or handshake is the client\'s network key. Treat the capture file as evidence, not as a trophy to keep.','Monitor mode and injection still require a suitable adapter — and explicit authorisation for the frequencies and networks involved.'],
  tips:['Do not forget to stop interfering processes with airmon-ng check kill before putting the card into monitor mode: NetworkManager will otherwise take it back mid-capture.','If the AP is WPA3/SAE or has PMF (802.11w) fully enforced, PMKID capture does not work. Check with airodump-ng before promising a result — reporting "WPA3/PMF enforced, not crackable by this technique" is a legitimate and useful finding.'],
  links:[{t:'hcxtools', u:'https://github.com/ZerBea/hcxtools'},{t:'hcxdumptool', u:'https://github.com/ZerBea/hcxdumptool'}],
  related:['t-aircrack','t-wireshark','t-hashcat'] },

{ id:'t-wifite', name:'wifite', kind:'tool', phases:['MASTERY'],
  pkg:'apt install wifite', tagline:'Automation wrapper over aircrack-ng/hcxtools: scans, targets, attacks, and hands you the crackable file.',
  what:'wifite drives the underlying wireless toolchain for you: it surveys for networks, ranks them, and runs the appropriate attack per target (PMKID, handshake, WPS), collecting the capture files. Its value is orchestration and a target list; its cost is that you learn less and produce more noise.',
  syntax:'sudo wifite --wpa --pmkid --kill --dict /usr/share/wordlists/rockyou.txt\nsudo wifite -i wlan0mon --wps',
  flags:[
    {f:'--pmkid', d:'Prefer the passive PMKID attack. The modern default: no deauth, no client needed.'},
    {f:'--wpa / --wps / --wep', d:'Restrict to the attack types you want. --wps includes pixie-dust.'},
    {f:'--dict FILE', d:'Wordlist for the automatic offline crack attempt at the end.'},
    {f:'--kill', d:'Kill interfering processes (NetworkManager). Do this or nothing works reliably.'},
    {f:'--bssid / --essid / -c CHANNEL', d:'Target a single network by MAC, name or channel.'},
    {f:'-i INTERFACE', d:'Adapter to use — relevant when you have more than one.'},
    {f:'--no-deauth / --deauth N', d:'Suppress or bound deauthentication frames. Prefer --no-deauth on a live network.'},
    {f:'--ignore-crack / --cracked', d:'Do not try to crack at capture time / only show already-cracked results.'},
    {f:'--wpat', d:'Seconds to wait per target for a handshake before moving on.'}
  ],
  examples:[
    { cmd:`sudo wifite --kill --pmkid --no-deauth`, note:'Fully passive campaign: PMKID only, no disconnection of anyone.' },
    { cmd:`sudo wifite --kill --bssid AA:BB:CC:DD:EE:FF -c 6 --dict /usr/share/wordlists/rockyou.txt`, note:'One specific AP, one channel, automatic crack attempt at the end.' },
    { cmd:`sudo wifite --pmkid --wps --dict rockyou.txt --cracked`, note:'Mixed campaign, showing what was already cracked in a previous run.' }
  ],
  opsec:['wifite defaults to deauth-and-capture in some modes, which disconnects real users. Explicitly pass --no-deauth or --pmkid so you do not accidentally attack everything in range.','It auto-targets every network it sees, including your client\'s neighbours. Always constrain it with --bssid or a filtered target list — attacking out-of-scope networks is a serious legal problem, not an accident.'],
  tips:['Use it to build the inventory, not to do the work: run it for the survey, then do per-target work with hcxdumptool/airodump-ng so the captures are clean and attributable.','Everything it automates is a tool in this manual. Learn those directly and wifite becomes a convenience rather than a crutch.'],
  links:[{t:'wifite2', u:'https://github.com/derv82/wifite2'}],
  related:['t-aircrack','t-hcxtools','t-wireshark'] }

);
