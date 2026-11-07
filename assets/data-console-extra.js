/* ---------------------------------------------------------------- *
 * data-console-extra.js — field notes layer for the console index
 *
 * The console index in data-terminal.js carries the runnable shape of
 * each command: what it is, its synopsis, and worked examples. This
 * file adds the part a manual is actually for — what bites you:
 *
 *   tips  : things that cost you an hour on a real job
 *   warn  : the opsec / legality / blast-radius line
 *   ex    : one more worked example where the entry only had one
 *
 * Nothing here replaces the base entry. The merge below only fills
 * gaps (tips/warn) and appends examples, so data-terminal.js stays the
 * single source of truth for the entry itself.
 *
 * Convention for every command string: runnable as written, or UPPER
 * placeholders in the man-page style (TARGET, ATTACKER_IP, PORT) — no
 * angle brackets, which bash reads as a redirect. Comment lines start
 * with '#' and a real command never shares a line with another one.
 * ---------------------------------------------------------------- */
window.ZXE = {
  masscan: {
    tips: ['--rate is not a speed dial: 5000 on a LAN, far lower over a VPN',
           'masscan finds ports, nmap explains them — always -oL, never eyeball',
           'packets above the link rate are dropped silently; re-run a sample to confirm coverage'],
    warn: 'masscan will flatten a fragile service just as fast as a router. Match the rate to the environment, never to your patience.'
  },
  netexec: {
    warn: 'Every attempt is logged on the target with your source IP and the account you tried. Read --pass-pol first: one careless spray can lock out a whole department.'
  },
  smbclient: {
    warn: 'Null and guest sessions often expose more than the share you came for. Pull to a working directory and read it offline; never write to a share you do not own.'
  },
  'enum4linux-ng': {
    tips: ['Start with -A: one pass gives you RID cycling, shares, users and policy',
           'RID cycling still yields usernames when LDAP is closed',
           'Cross-check against your nmap smb-* scripts — each one misses what the other catches'],
    warn: 'SMB enumeration is loud in Windows event logs and to any EDR. Agree an enumeration window with the client before you start.',
    ex: [{ t: 'users and shares, nothing else', cmd: 'enum4linux-ng -U -S 192.168.56.10',
           out: 'a username list you can spray and any share that answers unauthenticated' }]
  },
  ldapsearch: {
    warn: 'An anonymous bind is a finding, not a shortcut. Record the exact bind you used — the report has to say how you got the data.'
  },
  'bloodhound-python': {
    tips: ['-c All collects users, groups, sessions and ACLs in one pass',
           '-ns must point at a DC that answers DNS for the domain or Kerberos collection fails quietly']
  },
  dig: {
    tips: ['+short makes the output scriptable; the default is for reading',
           'AXFR the NS record, not the A record host',
           'dig @1.1.1.1 when the environment resolver is lying to you'],
    warn: 'A zone transfer only succeeds where it is misconfigured — that is the finding, and the zone contents are the client\'s confidential data.'
  },
  amass: {
    tips: ['Run it early: passive recon is the cheapest head start on any engagement',
           '-passive keeps you entirely off the target\'s logs',
           'Pipe the output into httpx or gowitness to find out what is actually alive'],
    warn: 'Active enumeration touches third-party infrastructure. Passive first, active only inside written scope.',
    ex: [{ t: 'passive only — no packets to the target', cmd: 'amass enum -passive -d lab.local -o subs.txt',
           out: 'subdomains harvested from certificate transparency and passive DNS' }]
  },
  gowitness: {
    tips: ['Screenshot before you touch anything: the image is evidence as well as triage',
           'Two runs a day apart surface a login page that was not there yesterday',
           'Pair with httpx for status codes and titles, then screenshot only the interesting ones'],
    warn: 'Screenshots mean a real browser hitting every host. Keep the thread count low so you do not look like a load test.'
  },
  searchsploit: {
    warn: 'Exploit-DB code is written once, by strangers, often for a different version. Read it before you run it.'
  },
  gobuster: {
    tips: ['Match the extension list to the stack: php for LAMP, aspx for IIS',
           '-b 404 hides the soft-404 noise that makes wordlist runs useless',
           'SecLists rafts beat the dirbuster lists that ship with Kali'],
    warn: 'Directory brute force is the loudest thing you will do all week. Watch the target\'s rate limits and stay inside scope.',
    ex: [{ t: 'vhost discovery on the same box', cmd: 'gobuster vhost -u http://lab.local -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt --append-domain',
           out: 'a virtual host that dirbusting one hostname would never reveal' }]
  },
  nikto: {
    tips: ['-Tuning 123bde is most of the signal without the 6,000-request full sweep',
           'Confirm every finding by hand — the banner matches are often wrong',
           'Send it through your proxy so the traffic lands in Burp where you can read it'],
    warn: 'Nikto is a sledgehammer: thousands of requests, no authentication, no mercy for fragile apps. Never against production without sign-off.',
    ex: [{ t: 'same checks, through your tunnel', cmd: 'nikto -h http://lab.local -useproxy http://127.0.0.1:8080 -Tuning 123bde -o nikto.txt',
           out: 'a text report you can diff against the next scan' }]
  },
  sqlmap: {
    tips: ['Start from a saved request (-r) so headers, cookies and CSRF tokens come with it',
           '--level/--risk above 2 is rarely needed and often destructive',
           'Test a parameter you control first to prove the tool works before you point it at a live form']
  },
  nuclei: {
    warn: 'Templates run real payloads. A CVE check can crash a service or drop a file on disk — --rate-limit exists for a reason.'
  },
  burpsuite: {
    warn: 'Intercepting browser traffic means whatever you browse goes through the proxy. Keep the engagement profile separate from your personal browsing.'
  },
  msfconsole: {
    warn: 'A session is a real shell inside someone\'s network. Log every command you run in it — that log is your defence when the client asks what changed.'
  },
  msfvenom: {
    warn: 'Generated payloads are malware. Build them in a lab VM, and expect AV to quarantine them on the way out.'
  },
  'evil-winrm': {
    tips: ['-s and -e move files both directions: keep a loot directory and a log',
           'Pass-the-hash works with -H; you rarely need plaintext',
           'There is no session log by default — start one with script(1) if you need evidence'],
    warn: 'You are on a live Windows host as an administrator, and every command is in the Security log. Stay read-only unless the scope says otherwise.'
  },
  hashcat: {
    warn: 'Cracking is GPU heat and hours, and the hash file is the client\'s credentials. Keep it in an encrypted container, never in /tmp.'
  },
  john: {
    tips: ['--format is not optional: the wrong format exits quietly having done nothing',
           'unshadow the passwd/shadow pair first, then run --rules to catch company patterns',
           'john --show after an interrupt — it resumes from john.pot'],
    warn: 'Cracked plaintext is the most sensitive thing you will hold. Never paste it into a ticket, a chat, or a screenshot.'
  },
  hydra: {
    tips: ['-L/-P for lists, -l/-p for single accounts: mixing them wastes hours',
           'Find the lockout threshold before you spray. Three guesses can lock an account for thirty minutes',
           '-t 4 is polite; -t 64 is how you get blocked at the firewall instead of logging in']
  },
  responder: {
    tips: ['-I must be the interface on the target\'s own subnet, not your management NIC',
           'Capture first, crack later: --wpad, DHCPv6 and LLMNR all feed the same hash list',
           'The -w log is what you hand the client as evidence of the poisoning']
  },
  'impacket-secretsdump': {
    tips: ['-just-dc-user keeps a DCSync pull small when you only need one account',
           'Save the NT hashes to a file: you will still need them after the session ends',
           'DCSync needs replication rights — a plain domain admin is not enough']
  },
  'impacket-GetUserSPNs': {
    tips: ['Kerberoastable means a service account with an SPN and a password that fits a wordlist',
           '-request pulls the hash in the same pass, no second tool',
           'Roasting is one authentication event; the cracking happens entirely offline'],
    warn: 'Requesting a service ticket is an authentication event carrying your source IP. Quiet on the wire is not the same as invisible.',
    ex: [{ t: 'roast and crack in one line', cmd: 'impacket-GetUserSPNs -dc-ip 192.168.56.10 lab.local/j.doe:pass -request -outputfile spn.txt && hashcat -m 13100 spn.txt /usr/share/wordlists/rockyou.txt',
           out: 'the plaintext behind every SPN account whose password falls to a wordlist' }]
  },
  'certipy-ad': {
    warn: 'AD CS misconfigurations end in a certificate that authenticates as domain admin. Confirm with the client before you request one.'
  },
  linpeas: {
    warn: 'linpeas reads broadly and its report is a map of the host. Keep the output off the box and delete the binary when you are done.'
  },
  sudo: {
    warn: 'A sudo finding is a real privilege boundary. Prove it with the smallest command that works — sudo su proves it too, and changes the system.'
  },
  getcap: {
    tips: ['Capabilities survive reboots and nobody watches them the way they watch SUID',
           'cap_setuid+ep on any interpreter is root, straight away',
           'Search /usr/bin and /usr/sbin directly, not just what is on $PATH'],
    warn: 'Most of these are deliberate. Note the capability, prove the impact with one command, then stop.',
    ex: [{ t: 'who shipped the capable binary', cmd: 'getcap -r / 2>/dev/null | awk \'{print $1}\' | xargs -r -n1 dpkg -S 2>/dev/null | sort -u',
           out: 'the packages that own the capable binaries, and whether any of them look out of place' }]
  },
  pspy: {
    tips: ['-p only prints command lines that look like credentials — fewer lines, more signal',
           'Let it run across a cron window (--interval 5) before you conclude nothing happens',
           '-f is the fast path; the file monitor is for cron jobs and config drops'],
    warn: 'pspy polls the process table constantly. On a monitored host that reads as a scanner — keep the runs short and remove the binary.',
    ex: [{ t: 'hunt credentials in command lines', cmd: './pspy64 -p -f --interval 2 2>/dev/null | tee pspy.log',
           out: 'anything typed in the clear: -p passwords, backup scripts, database invocations' }]
  },
  'ligolo-ng': {
    tips: ['The tun interface is created once; the proxy keeps it after the agent dies',
           'Route the whole /24, not a single host — pivoting is about ranges',
           'Because it is a real tun interface, nmap -sS and raw-socket tools work through it']
  },
  chisel: {
    warn: 'R:socks gives anyone who can reach the port a SOCKS proxy into the network. Bind it to 127.0.0.1 and reach it through SSH.'
  },
  nc: {
    tips: ['-lvnp 4444 to listen; add -k if you expect the target to reconnect',
           'mkfifo plus a second nc is the oldest way to get a full interactive TTY',
           'A netcat shell dies with whatever started it — run both ends inside tmux']
  },
  'python3 -m http.server': {
    tips: ['--bind 127.0.0.1 unless you genuinely want to serve your loot to the subnet',
           '--directory keeps the transfer folder out of your shell\'s working directory',
           'Serve the one file you need from its own folder, not your home directory'],
    warn: 'It serves everything in the directory to anyone who asks, with no authentication. Use a dedicated folder and kill it the moment the transfer is done.'
  },
  tmux: {
    warn: 'A tmux session keeps your engagement alive — and keeps your shells for whoever logs into that host next. Detach and lock the jump box; do not leave one unattended.'
  },
  'aircrack-ng': {
    tips: ['--bssid and --channel keep the capture small and the deauth targeted',
           'A partial handshake cracks to nothing: capture all four frames',
           'PMKID needs no client at all, which means no deauth on the air']
  },
  bash: {
    warn: 'These scripts run with your permissions. A stray rm -rf "$DIR"/ is how an engagement ends — always ${DIR:?} in destructive paths.'
  },
  grep: {
    tips: ['-F for fixed strings: regex metacharacters in service banners break your pattern',
           '-r with --include keeps the sweep inside the file types you care about',
           'grep -a on binaries — plain grep stops at the first null byte'],
    warn: 'Sweeping /etc, /var/log and home directories for "password" produces pages of customer secrets. Keep the hits, delete the working copies.'
  },
  ssh: {
    tips: ['ProxyJump chains hops in one command: ssh -J jump1,jump2 target',
           'ProxyCommand with nc reaches hosts that ProxyJump cannot route to',
           '-L forwards one port, -D gives you a SOCKS proxy for the browser'],
    warn: 'Keys you drop on a host for your own convenience are a lasting backdoor. Remove them at the end of the engagement and say so in the report.'
  },
  proxychains: {
    tips: ['Set socks5 in proxychains.conf — the default is socks4 and DNS breaks',
           'proxychains4 -q silences the banner that otherwise leaks into tool output',
           'No raw sockets through SOCKS: -sT, -Pn, TCP only'],
    warn: 'proxychains carries TCP and nothing else. UDP, ICMP and raw-socket scans fail or leak outside the tunnel — verify egress before you trust a result.',
    ex: [{ t: 'nmap through the tunnel', cmd: 'proxychains4 -q nmap -sT -Pn -p 445,3389 -oA proxyscan 10.10.10.0/24',
           out: 'TCP connect scans that stay inside the proxy, slower but attributable to the pivot' }]
  }
};

/* merge: fill gaps, never overwrite a base entry's own words */
(function () {
  const list = window.ZX || [];
  list.forEach(function (e) {
    const x = window.ZXE[e.c];
    if (!x) return;
    if (x.tips && !(e.tips && e.tips.length)) e.tips = x.tips;
    if (x.warn && !e.warn) e.warn = x.warn;
    if (x.ex) e.ex = (e.ex || []).concat(x.ex);
  });
}());
