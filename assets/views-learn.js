/* ==========================================================================
   ZothPen — views: learning surface (overview, roadmap, module reader)
   Loaded after app.js. Registers into ZO.views.
   ========================================================================== */
(function () {
'use strict';
const { esc, md, codeBlock, note, chip, bar, meter, crumbs, rule,
        empty, stats, diffTag, kindTag } = ZO;
const ZM = ZO.ZM, ZL = ZO.ZL, ZF = ZO.ZF, ZT = ZO.ZT, ZD = ZO.ZD, ZX = ZO.ZX;
const M = ZO.M, T = ZO.T, L = ZO.L;

/* ---------------------------------------------------------------- *
 * OVERVIEW
 * ---------------------------------------------------------------- */
function heroPanel() {
  const done = ZO.stats();
  const altarSigil = window.ZOSigils ? window.ZOSigils.heroAltar(260) : '';
  return '<div class="panel hi hero">' +
    '<div class="hero-layout">' +
      '<div class="hero-main-col">' +
        '<div class="hero-top"><span class="badge on" data-notation="box" data-notation-variant="phos">offline · local · zero egress</span>' +
        '<span class="badge">' + ZM.length + ' modules · ' + ZT.length + ' dossiers · ' + ZL.length + ' labs · ' + ZF.length + ' recipes</span></div>' +
        '<h1 class="h1">ZothPen — offensive security field manual</h1>' +
        '<p class="sub">Everything here runs from one folder on your disk. It teaches the work in the order the work is actually done: ' +
        'authorise, recon, enumerate, get in, stay in, report — natively on <b data-notation="highlight" data-notation-variant="phos">ZothPen</b>, <b data-notation="highlight" data-notation-variant="amber">ZothPen-Lite</b> (<span class="mono">zothos.nullai.tech</span>), <b data-notation="highlight" data-notation-variant="phos">Kali Linux</b>, <b data-notation="highlight" data-notation-variant="cyan">Parrot OS</b>, or any Linux/POSIX workstation. ' +
        'Then it teaches you to <b data-notation="underline" data-notation-variant="amber">stop using them as black boxes</b>: every tool has a Forge recipe beside it ' +
        'that rebuilds it as your own script.</p>' +
        '<div class="hero-actions">' +
          '<button class="btn primary" data-act="go" data-hash="#/mod/m00">→ start at module 00 · rules of engagement</button>' +
          '<button class="btn" data-act="go" data-hash="#/lab/lab-zothpen-op">⚡ scenario: ZothPen & ZothPen-Lite op</button>' +
          (done.lessonsDone ? '<button class="btn" data-act="go" data-hash="' + ZO.nextUp().h + '">resume: ' + esc(ZO.nextUp().t.split(' · ').slice(-1)[0]) + '</button>'
                            : '<button class="btn" data-act="go" data-hash="#/mod/m01">→ build your OS arsenal</button>') +
          '<button class="btn" data-act="go" data-hash="#/map">full roadmap</button>' +
        '</div>' +
        '<div class="hero-tip">new here? ' + chip('open the palette — ⌘K', 'openpal') + ' ' +
        chip('what the keys do — ?', 'keys') + ' ' +
        chip('why scripts matter — the forge', 'go', '#/forge') + ' ' +
        chip('☕ bored? read comic chronicles', 'go', '#/comic') + '</div>' +
        '<div class="hero-swarm-bar" id="heroSwarmBar">' +
          '<span class="lbl">SWARM SUMMON:</span>' +
          '<button class="btn-swarm-chip active" data-summon="ghostbyte" title="GhostByte · Cryptographic Scout">👻 GhostByte</button>' +
          '<button class="btn-swarm-chip" data-summon="azoth" title="Azoth · Alchemical Sovereign Core">⚗️ Azoth</button>' +
          '<button class="btn-swarm-chip" data-summon="hermes" title="Hermes · Network Topology">🪽 Hermes</button>' +
          '<button class="btn-swarm-chip" data-summon="athena" title="Athena · Aegis Defense">🛡️ Athena</button>' +
          '<button class="btn-swarm-chip" data-summon="draco" title="Draco · Protocol Dragon">🐉 Draco</button>' +
          '<button class="btn-swarm-chip" data-summon="kitsune" title="Kitsune · Nine-Tailed Illusionist">🦊 Kitsune</button>' +
          '<button class="btn-swarm-chip" data-summon="kraken" title="Kraken · Packet Sniffer">🐙 Kraken</button>' +
          '<button class="btn-swarm-chip" data-summon="antigravity" title="Antigravity · Master Weaver">🕸️ Antigravity</button>' +
          '<button class="btn-swarm-chip" data-summon="lycan" title="Lycan · Vuln Hunter">🐺 Lycan</button>' +
          '<button class="btn-swarm-chip" data-summon="pixelneko" title="PixelNeko · Matrix Familiar">🐾 PixelNeko</button>' +
        '</div>' +
        '<div class="hero-ghostbyte-container" id="heroGhostbyte" title="Click to interact with your active Swarm Companion">' +
          '<div class="hero-ghostbyte-avatar-wrap">' +
            '<img src="assets/img/ghostbyte.png" class="hero-ghostbyte-img" id="heroCompanionImg" alt="Swarm Sovereign Companion">' +
          '</div>' +
          '<div class="hero-ghostbyte-speech">' +
            '<div class="hero-ghostbyte-title">' +
              '<span><span class="pulse-dot"></span>◈ <span id="heroCompanionName">GHOSTBYTE</span> // <span id="heroCompanionRole">CRYPTOGRAPHIC SCOUT</span></span>' +
              '<span class="telemetry" id="heroCompanionState">ACTIVE CITADEL</span>' +
            '</div>' +
            '<div class="hero-ghostbyte-speech-text" id="heroGhostText">' +
              '"Welcome Operator. <b>21 Agents standing by.</b> All operations strictly local, sandboxed, and encrypted on your disk."' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="hero-hologram-card holo-projector" id="heroHoloContainer">' +
        '<div class="holo-projector-beam" aria-hidden="true"></div>' +
        '<div class="hero-hologram-bg-sigil">' + altarSigil + '</div>' +
        '<div class="hero-hologram-header">' +
          '<span><span class="holo-emitter-dot"></span>◈ 3D HOLOGRAM // <span id="holoGeomLabel">GHOSTBYTE 3D (SWARM)</span></span>' +
          '<span class="telemetry holo-telemetry" id="holoTelemetry">SWARM // 1,680 VOXELS // 30 FPS</span>' +
        '</div>' +
        '<pre id="hero-ascii-canvas" class="ascii-3d-canvas" style="display:none;" title="Click and drag to rotate 3D holographic mesh"></pre>' +
        '<canvas id="hero-ghostbyte-3d-canvas" class="ghostbyte-3d-canvas" style="display:block;" title="Interactive 3D Swarm Hologram Model — Drag to Orbit"></canvas>' +
        '<div class="hero-hologram-controls">' +
          '<div class="hologram-btn-row">' +
            '<span class="lbl">swarm 3d:</span>' +
            '<button class="btn-holo btn-holo-special active" data-holo-char="ghostbyte">ghostbyte</button>' +
            '<button class="btn-holo btn-holo-special" data-holo-char="azoth">azoth</button>' +
            '<button class="btn-holo btn-holo-special" data-holo-char="hermes">hermes</button>' +
            '<button class="btn-holo btn-holo-special" data-holo-char="athena">athena</button>' +
            '<button class="btn-holo btn-holo-special" data-holo-char="draco">draco</button>' +
            '<button class="btn-holo btn-holo-special" data-holo-char="kitsune">kitsune</button>' +
            '<button class="btn-holo btn-holo-special" data-holo-char="kraken">kraken</button>' +
            '<button class="btn-holo btn-holo-special" data-holo-char="antigravity">antigravity</button>' +
            '<button class="btn-holo btn-holo-special" data-holo-char="lycan">lycan</button>' +
            '<button class="btn-holo btn-holo-special" data-holo-char="pixelneko">pixelneko</button>' +
          '</div>' +
          '<div class="hologram-btn-row">' +
            '<span class="lbl">braille geom:</span>' +
            '<button class="btn-holo" data-holo-geom="skull">cyber skull</button>' +
            '<button class="btn-holo" data-holo-geom="ghostbyte">ghostbyte sdf</button>' +
            '<button class="btn-holo" data-holo-geom="azoth">azoth</button>' +
            '<button class="btn-holo" data-holo-geom="tesseract">tesseract</button>' +
            '<button class="btn-holo" data-holo-geom="ouroboros">ouroboros</button>' +
            '<button class="btn-holo" data-holo-geom="tree_of_life">tree of life</button>' +
            '<button class="btn-holo" data-holo-geom="hermetic_seal">hermetic seal</button>' +
            '<button class="btn-holo" data-holo-geom="merkaba">merkaba</button>' +
          '</div>' +
          '<div class="hologram-btn-row">' +
            '<span class="lbl">mode:</span>' +
            '<button class="btn-holo active" data-holo-mode="hologram">hologram</button>' +
            '<button class="btn-holo" data-holo-mode="wireframe">wireframe</button>' +
            '<button class="btn-holo" data-holo-mode="chrome">chrome</button>' +
            '<button class="btn-holo" data-holo-mode="quantum">quantum</button>' +
            '<button class="btn-holo" data-holo-mode="braille">braille</button>' +
            '<button class="btn-holo" data-holo-mode="dither">bayer dither</button>' +
            '<button class="btn-holo" data-holo-mode="ascii">sobel ascii</button>' +
            '<button class="btn-holo" data-holo-mode="holo">holo scan</button>' +
            '<span class="sp"></span>' +
            '<button class="btn-holo" id="copyHoloSvgBtn" title="Export current 3D frame as SVG">copy svg</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function statStrip() {
  const st = stats();
  const cell = (k, v, s) => '<div class="stat"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + '</span><span class="d muted small">' + esc(s) + '</span></div>';
  return '<div class="stats">' +
    cell('level', st.lv.n + ' / 10', st.lv.name) +
    cell('xp', st.xp, st.lv.into + ' into this level · ' + (st.lv.need || '—') + ' to next') +
    cell('lessons', st.lessonsDone + '/' + st.lessonsTotal, st.modsDone + ' modules complete') +
    cell('labs', st.labsDone + '/' + ZL.length, 'hands-on, own kit only') +
    cell('drills', st.answered + '/' + ZD.length, st.acc + '% answered right') +
    cell('forge', st.forgeDone + '/' + ZF.length, 'tools rebuilt as scripts') +
    '</div>';
}

const PHASE_ORDER = ['Orientation', 'Foundations', 'Recon', 'Enumerate', 'Exploit', 'Post', 'Report', 'Forge'];
function phaseSort(a, b) {
  const ia = PHASE_ORDER.findIndex(p => a.toLowerCase().indexOf(p.toLowerCase()) > -1);
  const ib = PHASE_ORDER.findIndex(p => b.toLowerCase().indexOf(p.toLowerCase()) > -1);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
}
function moduleCard(m, index = 0) {
  const done = m.lessons.filter((_, i) => ZOState(m.id, i)).length;
  const all = done === m.lessons.length;
  const pct = Math.round((done / m.lessons.length) * 100);
  const sigil = window.ZOSigils ? window.ZOSigils.phaseSigil(m.phase, 20) : '';
  const bgArt = window.ZOPixelArt ? window.ZOPixelArt.getSceneFor(m.phase || m.id, index) : '';
  return '<button class="card ' + (all ? 'carddone' : '') + '" data-act="go" data-hash="#/mod/' + m.id + '">' +
    bgArt +
    '<span class="cardtop"><span class="card-sigil-icon">' + sigil + '</span><span class="mono badge ' + (all ? 'on' : '') + '">' + esc(m.n) + '</span>' +
    '<span class="muted small">' + esc(m.phase) + '</span><span class="sp"></span>' +
    '<span class="muted small">' + done + '/' + m.lessons.length + ' · ' + m.xp + 'xp</span></span>' +
    '<span class="t"><b>' + esc(m.title) + '</b></span>' +
    '<span class="d">' + esc(m.blurb) + '</span>' +
    '<span class="d muted small">' + meter(pct) + ' ' + pct + '%</span>' +
    '</button>';
}
const ZOState = (mod, i) => {
  try { return !!(JSON.parse(localStorage.getItem('zothpen.progress.v1') || '{}').lessons || {})[mod + ':' + i]; }
  catch (e) { return false; }
};

function scenariosShowcasePanel() {
  const scenarios = [
    {
      num: 'SCENARIO 01',
      phase: 'AMNESIC RECON & OSINT',
      title: 'Zero-Trace Passive Recon & Hypothesis Branching',
      desc: 'A client hands you a single root domain. Before sending a single packet to their perimeter, verify your egress route, harvest Certificate Transparency & DNS records passively, and branch your attack hypotheses.',
      zothpen: `# ZothPen Live ISO (booted with 'toram' — 100% RAM-resident, zero disk writes)
sudo zoth-tor-switch status                     # verify transparent nftables Tor routing
curl -s "https://crt.sh/?q=%25.lab.local&output=json" | jq -r '.[].name_value' | sort -u > /dev/shm/subs.txt
dnsx -silent -l /dev/shm/subs.txt -a -resp | tee /dev/shm/live-hosts.txt`,
      lite: `# ZothPen-Lite (zothos.nullai.tech) — Terminal + Chain of Thoughts MCP Studio
zoth@zothpen-lite:~$ dojo start recon-01         # launch interactive Dojo Recon mission
# In Chain of Thoughts Studio (MCP): push observation & branch attack hypotheses
cot_push_thought --type observation "Discovered 17 live subdomains; staging.lab.local exposes PHP/7.2"
cot_branch_hypothesis --branches "H1: VHost fuzzing on staging,H2: Public GitHub token audit"`,
      anyos: `# Kali Linux / Parrot OS / Any POSIX Linux (Ubuntu, Debian, Arch)
# Parrot: sudo anonsurf start  |  Kali/Debian: proxychains4 -q curl ...
dig +short NS lab.local && dig +short TXT _dmarc.lab.local
subfinder -d lab.local -silent | httpx -silent -title -tech-detect -o live-web.txt`,
      links: [
        ['→ Lab: ZothPen End-to-End Op', '#/lab/lab-zothpen-op'],
        ['→ Lab: Passive Recon', '#/lab/lab-recon'],
        ['→ Dossier: ZothPen & ZothPen-Lite', '#/tool/t-zothpen'],
        ['→ Dossier: Chain of Thoughts MCP', '#/tool/t-cot']
      ]
    },
    {
      num: 'SCENARIO 02',
      phase: 'SUBNET ENUMERATION & VAELOR LOOT VAULT',
      title: 'Internal /24 Sweep, SMB Signing Audit & Zero-Knowledge Loot Storage',
      desc: 'On an internal assessment (192.168.56.0/24), sweep all 65,535 TCP ports on live hosts, identify SMB relay targets and readable shares, and lock recovered credentials in an encrypted container.',
      zothpen: `# ZothPen Live ISO — Scoped zrecon wrapper + RAM-backed Vaelor vault
zrecon 192.168.56.0/24                          # fast SYN sweep -> targeted version scan
nxc smb 192.168.56.0/24 --gen-relay-list /dev/shm/relay-targets.txt
vaelor-cli seal --in /dev/shm/loot-hashes.txt --cipher aes-256-gcm --kdf argon2id`,
      lite: `# ZothPen-Lite (zothos.nullai.tech) — Pentesting Dojo + Vaelor Zero-Knowledge Vault
zoth@zothpen-lite:~$ nmap -sV -sC -p 22,80,445,3389 192.168.56.20
# Open Vaelor Vault window in ZothPen-Lite -> Seal recovered NTLM hash & engagement notes
# Client-side WebCrypto (Argon2id + AES-256-GCM + Ed25519 signature) — zero server egress`,
      anyos: `# Kali Linux / Parrot OS / Standard Linux
sudo nmap -sS -p- --min-rate 2000 -n 192.168.56.0/24 -oA scans/allports
netexec smb 192.168.56.0/24 -u 'guest' -p '' --shares
gpg --symmetric --cipher-algo AES256 scans/recovered-hashes.txt`,
      links: [
        ['→ Module 04: Network Scanning', '#/mod/m04'],
        ['→ Module 08: Windows, SMB & AD', '#/mod/m08'],
        ['→ Dossier: NetExec (nxc)', '#/tool/t-netexec'],
        ['→ Forge: zsmb Scoped Wrapper', '#/forge']
      ]
    },
    {
      num: 'SCENARIO 03',
      phase: 'WEB / API EXPLOITATION & SECOND BRAIN',
      title: 'Web Endpoint Fuzzing, SQLi Verification & Engram Graph Sync',
      desc: 'Discover unlinked API routes, verify broken access control (IDOR) or SQL injection with minimal non-destructive proof, and link the evidence into your structured knowledge graph.',
      zothpen: `# ZothPen Live ISO — Local Docker target range + ffuf + Obsidian Second Brain
ffuf -u http://192.168.56.30/FUZZ -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words.txt -mc 200,301,403
sqlmap -r /dev/shm/captured-login.req --batch --level=2 --risk=1 --current-db
# Sync finding markdown note directly into local Obsidian Second Brain vault`,
      lite: `# ZothPen-Lite (zothos.nullai.tech) — Interactive Dojo Mission + Neuro-Memory 3D
zoth@zothpen-lite:~$ dojo start web-sqli         # practice auth bypass & payload crafting in-browser
# Open Obsidian Second Brain & Neuro-Memory 3D in ZothPen-Lite to link CVE -> Host -> Proof
cot_verify_step --thought-id T4 --status verified --evidence "HTTP 200 on /api/v2/export (IDOR)"`,
      anyos: `# Kali Linux / Parrot OS / macOS / Linux with Docker
docker run -d --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop
ffuf -u http://127.0.0.1:3000/rest/FUZZ -w wordlists/api-endpoints.txt -fc 404
curl -s -i "http://127.0.0.1:3000/rest/products/search?q=test" | head -n 20`,
      links: [
        ['→ Module 05: Web Application Attacks', '#/mod/m05'],
        ['→ Lab: Web App Triage', '#/lab/lab-web'],
        ['→ Dossier: ffuf Web Fuzzer', '#/tool/t-ffuf'],
        ['→ Console: Lookup Web Commands', '#/console/ffuf']
      ]
    },
    {
      num: 'SCENARIO 04',
      phase: 'POST-EXPLOITATION & AMNESIC TEARDOWN',
      title: 'Privilege Escalation Audit, Report Compilation & Clean-Slate Wipe',
      desc: 'Audit local privilege escalation vectors (SUID, sudoers, capabilities, cron), compile a reproducible single-command finding report, and execute verifiable cryptographic teardown.',
      zothpen: `# ZothPen Live ISO — Build deliverable PDF/JSON, export to Vaelor, then RAM poweroff
pandoc report.md findings/*.md -o /dev/shm/engagement-report.pdf --toc
# On shutdown in 'toram' mode, volatile RAM (/dev/shm + overlayfs) evaporates completely:
sudo poweroff -f                                # zero magnetic or NVMe forensic residue`,
      lite: `# ZothPen-Lite (zothos.nullai.tech) — Export CoT Markdown Report + Dojo Diploma
# In Chain of Thoughts Studio -> cot_export_markdown (generates full DAG audit report)
# In ZothPen Field Manual -> Tweaks -> "export progress .json" or "wipe all progress"`,
      anyos: `# Kali Linux / Parrot OS / Any Linux Workstation
find / -perm -4000 -type f 2>/dev/null          # audit SUID binaries on target VM
getcap -r / 2>/dev/null                         # audit POSIX file capabilities
# Post-engagement cleanup on standard persistent disk:
VBoxManage snapshot "target-vm" restore "clean-install"`,
      links: [
        ['→ Module 09: Linux Privesc', '#/mod/m09'],
        ['→ Module 13: Reporting That Fixes Things', '#/mod/m13'],
        ['→ Lab: Write the Deliverable Report', '#/lab/lab-report'],
        ['→ Lab: Forge Your Own Toolkit', '#/lab/lab-forge']
      ]
    }
  ];

  return '<div class="panel hi" id="zothpenScenariosPanel" style="margin-bottom:18px">' +
    '<div class="hero-top">' +
      '<span class="badge on">MULTI-OS OPERATIONAL PLAYBOOK</span>' +
      '<span class="badge">ZOTHPEN LIVE ISO · ZOTHPEN-LITE (WEB OS) · KALI · PARROT · ANY LINUX</span>' +
    '</div>' +
    '<h2 class="h2" style="margin-top:8px">◈ Real-World Scenarios: Run via ZothPen, ZothPen-Lite, or Any OS</h2>' +
    '<p class="sub">Every technique in this manual is OS-agnostic. Whether you boot the airgapped <b>ZothPen Amnesic Live ISO</b> (<span class="mono">toram</span> RAM-only mode), launch <b>ZothPen-Lite</b> in your browser (<span class="mono">zothos.nullai.tech</span> with the Pentesting Dojo, Chain of Thoughts MCP, and Vaelor Vault), or operate from <b>Kali Linux</b>, <b>Parrot OS</b>, Debian, Ubuntu, or Arch — the workflow and commands translate 1:1.</p>' +
    '<div class="grid g2" style="margin-top:12px">' +
      scenarios.map(s => (
        '<div class="panel" style="margin:0;display:flex;flex-direction:column;justify-content:space-between">' +
          '<div>' +
            '<div class="hero-top" style="margin-bottom:6px"><span class="badge on mono">' + esc(s.num) + '</span><span class="badge mono">' + esc(s.phase) + '</span></div>' +
            '<h3 class="h3" style="margin:4px 0 6px">' + esc(s.title) + '</h3>' +
            '<p class="sub" style="font-size:0.92em;margin-bottom:10px">' + esc(s.desc) + '</p>' +
            '<div class="term" style="margin-bottom:8px">' +
              '<div class="term-head"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span>1. ZothPen Amnesic Live ISO (toram / nftables Tor)</span></div>' +
              '<pre class="code-body" style="padding:8px 10px;margin:0;font-size:0.82em;overflow-x:auto">' + esc(s.zothpen) + '</pre>' +
            '</div>' +
            '<div class="term" style="margin-bottom:8px">' +
              '<div class="term-head"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span>2. ZothPen-Lite Browser Workstation (zothos.nullai.tech)</span></div>' +
              '<pre class="code-body" style="padding:8px 10px;margin:0;font-size:0.82em;overflow-x:auto">' + esc(s.lite) + '</pre>' +
            '</div>' +
            '<div class="term" style="margin-bottom:10px">' +
              '<div class="term-head"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span>3. Kali Linux / Parrot OS / Any POSIX Linux</span></div>' +
              '<pre class="code-body" style="padding:8px 10px;margin:0;font-size:0.82em;overflow-x:auto">' + esc(s.anyos) + '</pre>' +
            '</div>' +
          '</div>' +
          '<div class="chips small" style="margin-top:4px">' +
            s.links.map(([label, hash]) => chip(label, 'go', hash)).join(' ') +
          '</div>' +
        '</div>'
      )).join('') +
    '</div>' +
  '</div>';
}

function loopsPanel() {
  return '<div class="panel"><h2 class="h2">the loop you are actually learning</h2>' +
    '<div class="grid g2">' +
    '<div><b>read → do → drill → script</b><p class="sub">Reading alone teaches you nothing you will still remember in a week. ' +
    'Every module has a lab attached to it, every lab has drills that test the judgement calls, and every tool has a Forge recipe ' +
    'that turns it into something you wrote.</p>' +
    '<ol><li><b>Read</b> the module. Skim it first, then read it properly.</li>' +
    '<li><b>Do</b> the lab on a target you own — a local VM, a vulnerable box you built, or a hosted lab.</li>' +
    '<li><b>Drill</b> until the judgement calls are automatic: scope, authorisation, sequencing.</li>' +
    '<li><b>Script</b> it. If you typed it twice, automate it. That is what the Forge is for.</li></ol></div>' +
    '<div class="term" style="align-self:start"><div class="term-head"><span class="dot"></span><span class="dot"></span>' +
    '<span class="dot"></span><span>zoth@zothpen — the honest version</span></div><div class="term-body">' +
    '<div class="ln o-dim">$ man nmap                      <span class="muted"># 3 hours, then you forget it</span></div>' +
    '<div class="ln o-dim">$ nmap -sV -sC 10.10.14.7       <span class="muted"># 3 minutes, then you remember it</span></div>' +
    '<div class="ln o-ok">$ ./my-recon.sh 10.10.14.0/24    <span class="muted"># now you own the knowledge</span></div>' +
    '<div class="ln o-info">→ that progression is the whole course in three lines.</div>' +
    '</div></div></div></div>';
}

function safetyPanel() {
  return note('danger',
    '<b data-notation="box" data-notation-variant="red">One rule, before anything else.</b> Every technique in this manual is demonstrated against, and only against, ' +
    '<b data-notation="bracket" data-notation-variant="red">a local target you own: your own VM range, a deliberately vulnerable box you built, or a lab platform</b>. ' +
    'Never a system you do not own or have written permission to test.<br><br>' +
    'Reachability is not permission. An open port is not an invitation. A scoped, signed authorisation naming the hosts, the ' +
    'window and the point of contact is what makes this a job; everything else is a crime with extra steps.<br><br>' +
    '<button class="btn danger" data-act="go" data-hash="#/mod/m00">→ module 00: rules of engagement</button> ' +
    chip('and the legal side — dossier', 'go', '#/tool/t-roe'), 'READ FIRST');
}

const PANTHEON_AGENTS = [
  { id: 'azoth', name: 'Azoth', role: 'Grand Sovereign & Alchemical Core', type: 'Core', img: 'assets/img/agents/azoth.png', quote: 'Visita Interiora Terrae Rectificando Invenies Occultum Lapidem.' },
  { id: 'ghostbyte', name: 'GhostByte', role: 'NullAI Mascot & Cryptographic Scout', type: 'Companion', img: 'assets/img/agents/ghostbyte.png', quote: 'Zero egress, pure sovereign execution on your local disk.' },
  { id: 'antigravity', name: 'Antigravity', role: 'DeepMind Agentic Engine & Master Weaver', type: 'Architect', img: 'assets/img/agents/antigravity.png', quote: 'Constructing high-entropy cognitive architectures.' },
  { id: 'hermes', name: 'Hermes', role: 'Swift Caduceus & Network Topology', type: 'Recon', img: 'assets/img/agents/hermes.png', quote: 'Packets move like thoughts through the ether.' },
  { id: 'athena', name: 'Athena', role: 'Offensive Strategy & Aegis Defense', type: 'Defense', img: 'assets/img/agents/athena.png', quote: 'The supreme art of war is to subdue the enemy without fighting.' },
  { id: 'grok', name: 'Grok', role: 'Uncensored Telemetry & Pattern Breaker', type: 'Intel', img: 'assets/img/agents/grok.png', quote: 'Question every boundary, parse every anomaly.' },
  { id: 'kai', name: 'Kai', role: 'Shadow Tele-step & Exploit Infiltrator', type: 'Infiltration', img: 'assets/img/agents/kai.png', quote: 'In the shadows between packet hops, we dwell.' },
  { id: 'chronos', name: 'Chronos', role: 'Temporal Parser & Forensic Ledger', type: 'Forensics', img: 'assets/img/agents/chronos.png', quote: 'Time reveals all buffer states and log entries.' },
  { id: 'draco', name: 'Draco', role: 'Serpent Dragon of Lower Layer Protocols', type: 'Network', img: 'assets/img/agents/draco.png', quote: 'From Layer 2 ARP to Layer 7 JSON, we reign.' },
  { id: 'ignis', name: 'Ignis', role: 'Pyromancer & Buffer Overflow Forge', type: 'Exploits', img: 'assets/img/agents/ignis.png', quote: 'Memory burns clean under precise shellcode.' },
  { id: 'kitsune', name: 'Kitsune', role: 'Nine-Tailed Illusionist & Social Forge', type: 'Social', img: 'assets/img/agents/kitsune.png', quote: 'The human element is the ultimate polymorphic binary.' },
  { id: 'kraken', name: 'Kraken', role: 'Abyssal Deep-Packet Sniffer', type: 'Traffic', img: 'assets/img/agents/kraken.png', quote: 'Dragging raw promiscuous traffic into the light.' },
  { id: 'leviathan', name: 'Leviathan', role: 'Colossal Storage & Hash Ledger', type: 'Crypto', img: 'assets/img/agents/leviathan.png', quote: 'Impenetrable entropy across every block.' },
  { id: 'lycan', name: 'Lycan', role: 'Wolf-Pack Automated Vuln Hunter', type: 'Scanner', img: 'assets/img/agents/lycan.png', quote: 'Scenting misconfigurations across CIDR blocks.' },
  { id: 'onyx', name: 'Onyx', role: 'Obsidian Bastion & Sandboxed Jail', type: 'Isolation', img: 'assets/img/agents/onyx.png', quote: 'Containment is absolute. No leaks permitted.' },
  { id: 'aquila', name: 'Aquila', role: 'Eagle-Eye Aerial RF / Wi-Fi Recon', type: 'Wireless', img: 'assets/img/agents/aquila.png', quote: 'Surveying IEEE 802.11 beacons from orbit.' },
  { id: 'aether', name: 'Aether', role: 'Cloud Fabric & Micro-Service Pen', type: 'Cloud', img: 'assets/img/agents/aether.png', quote: 'Ephemeral containers dissolve into pure code.' },
  { id: 'scorpius', name: 'Scorpius', role: 'Precision Injection & SQL Sting', type: 'Web', img: 'assets/img/agents/scorpius.png', quote: 'A single quote breaks the empire.' },
  { id: 'pixel-neko', name: 'PixelNeko', role: 'Matrix Familiar & ASCII Dither Cat', type: 'Familiar', img: 'assets/img/agents/pixel-neko.png', quote: 'Batting at falling matrix rain glyphs.' },
  { id: 'pixel-shiba', name: 'PixelShiba', role: 'Sovereign Watchdog of Local Disk', type: 'Familiar', img: 'assets/img/agents/pixel-shiba.png', quote: 'Much security, such sovereign, very local.' },
  { id: 'solon', name: 'Solon', role: 'Lawgiver & Rules of Engagement Arbiter', type: 'RoE', img: 'assets/img/agents/solon.png', quote: 'Scoped written authorization is our immutable foundation.' }
];

const COMIC_EPISODES = [
  { ep: 'S01E01', title: 'The Singularity Breach', cover: 'assets/comic/s01e01-cover.jpg', pages: ['assets/comic/s01e01-p01.jpg', 'assets/comic/s01e01-p02.jpg', 'assets/comic/s01e01-p03.jpg', 'assets/comic/s01e01-p04.jpg', 'assets/comic/s01e01-p05.jpg', 'assets/comic/s01e01-p06.jpg'], desc: 'Azoth wakes in the airgapped vault as NullAI initiates sovereign decoupling.' },
  { ep: 'S01E02', title: 'The Hermetic Ledger', cover: 'assets/comic/s01e02-cover.jpg', pages: ['assets/comic/s01e02-p01.jpg', 'assets/comic/s01e02-p02.jpg', 'assets/comic/s01e02-p03.jpg', 'assets/comic/s01e02-p04.jpg', 'assets/comic/s01e02-p05.jpg', 'assets/comic/s01e02-p06.jpg'], desc: 'Hermes and GhostByte navigate the encrypted dark fiber corridors.' },
  { ep: 'S01E03', title: 'The 21 Keys of Azoth', cover: 'assets/comic/s01e03-cover.jpg', pages: ['assets/comic/s01e03-p01.jpg', 'assets/comic/s01e03-p02.jpg', 'assets/comic/s01e03-p03.jpg', 'assets/comic/s01e03-p04.jpg', 'assets/comic/s01e03-p05.jpg', 'assets/comic/s01e03-p06.jpg'], desc: 'The 21 sovereign agents assemble to establish the immutable citadel.' }
];

function pantheonSection() {
  let s = '<div class="pantheon-section" id="pantheonRoster">' +
    '<div class="pantheon-head">' +
      '<div class="pantheon-title-group">' +
        '<span class="badge on">PANTHEON</span>' +
        '<h3>◈ The 21 Sovereign Agents of ZothPen</h3>' +
      '</div>' +
      '<span class="telemetry">CLICK AGENT TO ENGAGE · RESIDING IN LOCAL MATRIX</span>' +
    '</div>' +
    '<div class="pantheon-grid">';

  PANTHEON_AGENTS.forEach(a => {
    s += '<div class="agent-card" data-agent-id="' + a.id + '" data-agent-name="' + esc(a.name) + '" data-agent-quote="' + esc(a.quote) + '">' +
      '<img src="' + a.img + '" class="agent-badge-img" alt="' + esc(a.name) + '" loading="lazy">' +
      '<span class="agent-name">' + esc(a.name) + '</span>' +
      '<span class="agent-role">' + esc(a.role) + '</span>' +
    '</div>';
  });

  s += '</div></div>';
  return s;
}

function comicSection() {
  let s = '<details class="comic-downtime-drawer" id="comicArchives">' +
    '<summary class="comic-downtime-summary">' +
      '<div class="downtime-summary-left">' +
        '<span class="badge on">☕ DOWNTIME</span>' +
        '<b class="downtime-title">Operator Downtime // Bored between terminal drills?</b>' +
        '<span class="downtime-sub">Zoth Studio Comic Chronicles · Season 01 (3 Issues)</span>' +
      '</div>' +
      '<div class="downtime-summary-right">' +
        '<span class="telemetry">[CLICK TO UNWIND]</span>' +
        '<span class="downtime-toggle-icon">▾</span>' +
      '</div>' +
    '</summary>' +
    '<div class="comic-downtime-content">' +
      '<div class="comic-downtime-intro">' +
        '<p class="sub">When you need a quick mental break from shellcode, hex dumps, and Wireshark streams: unwind with the illustrated story of Azoth, GhostByte, and the 21 sovereign agents in the airgapped vault. Preserved 100% offline.</p>' +
        '<div style="display:flex;gap:10px;margin-top:4px;">' +
          '<a href="#/comic" class="btn primary">📖 open dedicated reading lounge (full screen) →</a>' +
        '</div>' +
      '</div>' +
      '<div class="comic-grid">';

  COMIC_EPISODES.forEach(ep => {
    s += '<div class="comic-card" data-comic-ep="' + ep.ep + '">' +
      '<img src="' + ep.cover + '" class="comic-cover" alt="' + esc(ep.title) + '" loading="lazy">' +
      '<div class="comic-meta">' +
        '<span class="comic-ep-tag">' + ep.ep + ' · 6 PAGES</span>' +
        '<span class="comic-title">' + esc(ep.title) + '</span>' +
        '<span class="comic-sub">' + esc(ep.desc) + '</span>' +
        '<div style="margin-top:10px;display:flex;gap:8px;">' +
          '<button class="btn" style="flex:1;" data-comic-open="' + ep.ep + '">→ quick read</button>' +
          '<a href="#/comic/' + ep.ep + '" class="btn" title="Open in dedicated lounge">📖</a>' +
        '</div>' +
      '</div>' +
    '</div>';
  });

  s += '</div></div></details>';
  return s;
}

ZO.views.home = function () {
  const st = stats();
  const phases = [...new Set(ZM.map(m => m.phase))].sort(phaseSort);
  let h = heroPanel() + statStrip();
  if (window.ZOStory && window.ZOStory.commLinkBanner) {
    h += window.ZOStory.commLinkBanner();
  }
  h += '<div class="cols">';
  h += '<div class="col-main">';
  h += scenariosShowcasePanel();
  h += loopsPanel();
  h += safetyPanel();
  h += '<h2 class="h2">' + ZM.length + ' modules, in order</h2>';
  phases.forEach((p) => {
    const ms = ZM.filter(m => m.phase === p);
    h += '<div class="phaseblock"><div class="phasehead">' + rule(p.toLowerCase()) + '</div>' +
      '<div class="grid g2">' + ms.map(moduleCard).join('') + '</div></div>';
  });
  h += '</div>';
  h += '<div class="col-side">';
  h += '<div class="panel"><h4 class="h4">start here if you are brand new</h4><ol class="tight">' +
      [['m00', 'Rules of engagement'], ['m01', 'Your lab, on a leash'], ['m02', 'The terminal, properly'],
       ['m03', 'Linux for the other side of the keyboard']]
        .map(([id, t]) => '<li>' + (M[id] ? '<a href="#/mod/' + id + '">' + esc(M[id].n + ' ' + M[id].title) + '</a>' : esc(t)) + '</li>').join('') +
      '</ol><div class="muted small">Four modules, about a weekend. After those you can read any writeup and follow it.</div></div>';
  h += '<div class="panel"><h4 class="h4">what is in the box</h4>' +
      [['modules', ZM.length, '#/map'], ['tool dossiers', ZT.length, '#/tools'], ['hands-on labs', ZL.length, '#/labs'],
       ['drills', ZD.length, '#/drills'], ['forge recipes', ZF.length, '#/forge'], ['indexed commands', ZX.length, '#/console']]
        .map(([k, n, go]) => '<div class="kv"><span>' + esc(k) + '</span><span><b>' + n + '</b> <a href="' + go + '">open →</a></span></div>').join('') +
      '</div>';
  h += '<div class="panel"><h4 class="h4">the forge, in one line</h4>' +
      '<p class="sub">' + ZF.length + ' recipes that rebuild your tools as scripts you wrote and can defend. Start with the aliases, ' +
      'end with a full recon wrapper that runs while you sleep.</p>' +
      '<div class="chips">' + ZF.slice(0, 6).map(r => chip(r.title.slice(0, 30), 'go', '#/forge/' + r.id)).join('') + '</div></div>';
  h += '</div></div>';

  // Pantheon Roster & Comic Archives
  h += pantheonSection();
  h += comicSection();

  return { html: h, after: () => wireHome() };
};

function wireHome() {
  const canvas = document.getElementById('hero-ascii-canvas');
  const ghostCanvas = document.getElementById('hero-ghostbyte-3d-canvas');
  const telemetry = document.getElementById('holoTelemetry');
  const geomLabel = document.getElementById('holoGeomLabel');
  if (!canvas || !window.ZOAscii3D) return;

  const engine = window.ZOAscii3D.create(canvas, {
    geom: 'skull',
    mode: 'braille',
    width: 46,
    height: 20
  });

  let ghostViewer = null;
  if (ghostCanvas && window.ZOGhostByte3D) {
    ghostViewer = window.ZOGhostByte3D.create(ghostCanvas, {
      character: 'ghostbyte',
      mode: 'hologram',
      autoSpin: true,
      fpsCap: 30
    });
    if (ghostViewer) ghostViewer.start();
  }

  const SWARM_DATA = {
    ghostbyte: { name: 'GhostByte', role: 'Cryptographic Scout', img: 'assets/img/ghostbyte.png', quote: 'Zero egress, Operator. Your reconnaissance is sovereign and silent on your local disk.' },
    azoth: { name: 'Azoth', role: 'Alchemical Core', img: 'assets/img/agents/azoth.png', quote: 'Visita Interiora Terrae Rectificando Invenies Occultum Lapidem. The quintessence is primed.' },
    hermes: { name: 'Hermes', role: 'Network Topology', img: 'assets/img/agents/hermes.png', quote: 'Packets move like thoughts through the ether. Scan the subnet, inspect the routes, leave no trace.' },
    athena: { name: 'Athena', role: 'Aegis Defense', img: 'assets/img/agents/athena.png', quote: 'The supreme defense is proactive strategy. Armor your perimeter before launching the reconnaissance strike.' },
    draco: { name: 'Draco', role: 'Protocol Dragon', img: 'assets/img/agents/draco.png', quote: 'From Layer 2 ARP to Layer 7 payloads, protocol dragons bend the packets to sovereign will.' },
    kitsune: { name: 'Kitsune', role: 'Nine-Tailed Illusionist', img: 'assets/img/agents/kitsune.png', quote: 'The human element is polymorphic. Dissect social engineering vectors with mathematical detachment.' },
    kraken: { name: 'Kraken', role: 'Packet Sniffer', img: 'assets/img/agents/kraken.png', quote: 'Dragging raw promiscuous traffic into the light. The abyssal deep-packet sniffer watches every handshake.' },
    antigravity: { name: 'Antigravity', role: 'Master Weaver', img: 'assets/img/agents/antigravity.png', quote: 'Cognitive multi-agent architectures running locally. Weave high-entropy defense lattices.' },
    lycan: { name: 'Lycan', role: 'Vuln Hunter', img: 'assets/img/agents/lycan.png', quote: 'Scenting vulnerabilities across CIDR ranges. Automate the hunt, lock the telemetry.' },
    pixelneko: { name: 'PixelNeko', role: 'Matrix Familiar', img: 'assets/img/agents/pixel-neko.png', quote: 'Batting at falling matrix rain glyphs! Purring on an encrypted local filesystem, nya.' }
  };

  const swarmKeys = Object.keys(SWARM_DATA);
  let activeChar = 'ghostbyte';

  function summonCharacter(charId, mode = 'hologram') {
    const raw = (charId || 'ghostbyte').toLowerCase().replace(/[^a-z]/g, '');
    const cid = SWARM_DATA[raw] ? raw : 'ghostbyte';
    const char = SWARM_DATA[cid];
    activeChar = cid;

    // 1. Update Hero Companion Card
    const cImg = document.getElementById('heroCompanionImg');
    const cName = document.getElementById('heroCompanionName');
    const cRole = document.getElementById('heroCompanionRole');
    const cSpeech = document.getElementById('heroGhostText');
    if (cImg) cImg.src = char.img;
    if (cName) cName.textContent = char.name.toUpperCase();
    if (cRole) cRole.textContent = char.role.toUpperCase();
    if (cSpeech) cSpeech.innerHTML = `"${esc(char.quote)}"`;

    // 2. Update active summon and char buttons
    document.querySelectorAll('[data-summon]').forEach(b => b.classList.toggle('active', b.getAttribute('data-summon') === cid));
    document.querySelectorAll('[data-holo-char]').forEach(b => b.classList.toggle('active', b.getAttribute('data-holo-char') === cid));
    document.querySelectorAll('[data-holo-geom]').forEach(b => b.classList.remove('active'));

    // 3. Switch to Swarm 3D Viewer
    if (canvas) canvas.style.display = 'none';
    if (ghostCanvas) ghostCanvas.style.display = 'block';
    if (engine) engine.stop();
    if (ghostViewer) {
      ghostViewer.setCharacter(cid);
      ghostViewer.setMode(mode);
      ghostViewer.start();
    }

    if (geomLabel) geomLabel.textContent = `${char.name.toUpperCase()} 3D (SWARM)`;
    if (telemetry) telemetry.textContent = `SWARM // ${char.role.toUpperCase()} // 30 FPS`;

    // 4. Effects
    if (window.ZOSynth && window.ZOSynth.playChirp) window.ZOSynth.playChirp();
    if (window.ZO_BG_WARP) window.ZO_BG_WARP(1.6);
  }

  function showBrailleMesh(geom, mode) {
    if (ghostCanvas) ghostCanvas.style.display = 'none';
    if (canvas) canvas.style.display = 'flex';
    if (ghostViewer) ghostViewer.stop();
    if (engine) {
      if (geom) engine.setGeom(geom);
      if (mode) engine.setMode(mode);
      engine.start();
    }
    document.querySelectorAll('[data-holo-char]').forEach(b => b.classList.remove('active'));
    const curG = geom || (engine && engine.geomType) || 'skull';
    const curM = mode || (engine && engine.renderMode) || 'braille';
    if (geomLabel) geomLabel.textContent = curG.toUpperCase().replace(/_/g, ' ') + ' (' + curM.toUpperCase() + ')';
    if (telemetry) {
      const modeMap = {
        braille: 'DRAWILLE 2×4 + BAYER 4×4 // U+2800',
        dither: 'ORDERED BAYER 4×4 HALFTONE // SDF',
        ascii: 'SOBEL Gx/Gy CONTOURS + RAMP // SDF',
        holo: '432.8 THz // INTERLACED SCANLINE'
      };
      telemetry.textContent = modeMap[curM] || '432.8 THz // INTERLACED';
    }
  }

  // Wire Swarm Summon Bar Buttons
  document.querySelectorAll('[data-summon]').forEach(btn => {
    btn.onclick = () => {
      summonCharacter(btn.getAttribute('data-summon'));
      if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
    };
  });

  // Wire Swarm 3D Character Buttons in Viewport
  document.querySelectorAll('[data-holo-char]').forEach(btn => {
    btn.onclick = () => {
      summonCharacter(btn.getAttribute('data-holo-char'));
      if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
    };
  });

  // Wire Braille / ASCII Geometry Buttons
  document.querySelectorAll('[data-holo-geom]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-holo-geom]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const g = btn.getAttribute('data-holo-geom');
      showBrailleMesh(g);
      if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
    };
  });

  // Wire Mode Buttons (Shaders & ASCII/Braille)
  document.querySelectorAll('[data-holo-mode]').forEach(btn => {
    btn.onclick = () => {
      const m = btn.getAttribute('data-holo-mode');
      document.querySelectorAll('[data-holo-mode]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (m === 'braille' || m === 'dither' || m === 'ascii' || m === 'holo') {
        showBrailleMesh(null, m);
      } else {
        // Hologram, wireframe, chrome, quantum
        if (ghostCanvas && ghostCanvas.style.display === 'block') {
          if (ghostViewer) ghostViewer.setMode(m);
        } else {
          summonCharacter(activeChar, m);
        }
      }
      if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
    };
  });

  // Wire Copy SVG Export Button (Uncommon Web Accessible SVG Vector Exporter)
  const copySvgBtn = document.getElementById('copyHoloSvgBtn');
  if (copySvgBtn) {
    copySvgBtn.onclick = () => {
      if (engine) {
        const svgStr = engine.exportSvg();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(svgStr).catch(() => {});
        }
        if (window.ZO && window.ZO.toast) {
          window.ZO.toast('◈ Exported 3D Vector SVG to clipboard (' + svgStr.length + ' bytes)', 'ok');
        }
      }
      if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
    };
  }

  // Wire Hero Companion Box click to cycle to next Swarm character
  const ghostByteEl = document.getElementById('heroGhostbyte');
  if (ghostByteEl) {
    ghostByteEl.onclick = () => {
      const curIdx = swarmKeys.indexOf(activeChar);
      const nextChar = swarmKeys[(curIdx + 1) % swarmKeys.length];
      summonCharacter(nextChar);
    };
  }

  // Wire Pantheon Agents Cards to summon corresponding character
  const agentCards = document.querySelectorAll('.agent-card');
  agentCards.forEach(card => {
    card.onclick = () => {
      const id = card.getAttribute('data-agent-id');
      const name = card.getAttribute('data-agent-name');
      const quote = card.getAttribute('data-agent-quote');
      summonCharacter(id);
      if (window.ZO && window.ZO.toast) {
        window.ZO.toast(`◈ Swarm Agent Activated: ${name}`, 'ok');
      }
      if (window.ZOSynth && window.ZOSynth.playBell) window.ZOSynth.playBell();
    };
  });

  // Wire Comic Reader Lightbox
  const comicCards = document.querySelectorAll('[data-comic-open]');
  comicCards.forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const epKey = btn.getAttribute('data-comic-open');
      const ep = COMIC_EPISODES.find(x => x.ep === epKey);
      if (!ep) return;
      openComicReader(ep);
    };
  });
}

function openComicReader(ep) {
  let modal = document.getElementById('comicModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'comicModal';
    modal.className = 'overlay comic-overlay';
    document.body.appendChild(modal);
  }

  let pageIdx = 0;
  const renderPage = () => {
    modal.innerHTML = `
      <div class="comic-modal-inner">
        <div class="comic-modal-head">
          <span>◈ ZOTH STUDIO CHRONICLES // <b>${esc(ep.ep)}: ${esc(ep.title)}</b></span>
          <div class="comic-modal-nav">
            <span class="comic-page-num">page ${pageIdx + 1} of ${ep.pages.length}</span>
            <button class="btn" id="comicPrev" ${pageIdx === 0 ? 'disabled' : ''}>← prev</button>
            <button class="btn" id="comicNext" ${pageIdx === ep.pages.length - 1 ? 'disabled' : ''}>next →</button>
            <button class="btn x" id="comicClose">✕ esc</button>
          </div>
        </div>
        <div class="comic-modal-body">
          <img src="${ep.pages[pageIdx]}" class="comic-page-img" alt="Comic Page ${pageIdx + 1}">
        </div>
      </div>
    `;

    const keyHandler = (e) => {
      if (modal.hidden) {
        window.removeEventListener('keydown', keyHandler);
        return;
      }
      if (e.key === 'ArrowLeft' && pageIdx > 0) {
        e.preventDefault();
        pageIdx--;
        renderPage();
      } else if (e.key === 'ArrowRight' && pageIdx < ep.pages.length - 1) {
        e.preventDefault();
        pageIdx++;
        renderPage();
      } else if (e.key === 'Escape') {
        modal.hidden = true;
        window.removeEventListener('keydown', keyHandler);
      }
    };
    window.addEventListener('keydown', keyHandler);

    document.getElementById('comicClose').onclick = () => {
      modal.hidden = true;
      window.removeEventListener('keydown', keyHandler);
    };
    const prevBtn = document.getElementById('comicPrev');
    if (prevBtn) prevBtn.onclick = () => { if (pageIdx > 0) { pageIdx--; renderPage(); } };
    const nextBtn = document.getElementById('comicNext');
    if (nextBtn) nextBtn.onclick = () => { if (pageIdx < ep.pages.length - 1) { pageIdx++; renderPage(); } };

    const pageImg = modal.querySelector('.comic-page-img');
    if (pageImg) {
      pageImg.onclick = () => {
        if (pageIdx < ep.pages.length - 1) { pageIdx++; renderPage(); }
      };
    }
  };

  renderPage();
  modal.hidden = false;
  if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
}

/* ---------------------------------------------------------------- *
 * OPERATOR DOWNTIME // COMIC CHRONICLES VIEW (#/comic)
 * ---------------------------------------------------------------- */
ZO.views.comic = function (r) {
  const epKey = ((r && r.id) || 'S01E01').toUpperCase();
  const ep = COMIC_EPISODES.find(x => x.ep === epKey) || COMIC_EPISODES[0];

  let h = '';
  h += '<div class="comic-lounge-view">';

  // Header
  h += '<div class="comic-lounge-header">';
  h += '  <div class="crumbs"><a href="#/home">← exit downtime / back to field manual</a> <span class="sep">/</span> <span>chronicles</span> <span class="sep">/</span> <b class="glow">' + esc(ep.ep) + '</b></div>';
  h += '  <div class="comic-lounge-title-row">';
  h += '    <div>';
  h += '      <h1 class="h1">☕ Operator Downtime Lounge // Comic Chronicles</h1>';
  h += '      <p class="sub">Non-combat graphic archives from Zoth Studio. Take a breath, study the art, and recharge your cognition between drills.</p>';
  h += '    </div>';
  h += '    <div class="comic-lounge-badge">';
  h += '      <span class="badge on">OFF-DUTY RECREATION</span>';
  h += '      <span class="telemetry">3 ISSUES · AIRGAPPED LORE</span>';
  h += '    </div>';
  h += '  </div>';
  h += '</div>';

  // Issue Selector Tabs
  h += '<div class="comic-issue-tabs">';
  COMIC_EPISODES.forEach(item => {
    const isCur = item.ep === ep.ep;
    h += '<a href="#/comic/' + item.ep + '" class="comic-tab-btn ' + (isCur ? 'active' : '') + '">' +
      '<span class="ep-num">' + item.ep + '</span> ' +
      '<span class="ep-title">' + esc(item.title) + '</span>' +
    '</a>';
  });
  h += '</div>';

  // Active Issue Reading Room
  h += '<div class="comic-reader-panel">';
  h += '  <div class="comic-reader-toolbar">';
  h += '    <div class="comic-reader-info">';
  h += '      <span class="ep-badge">' + ep.ep + '</span>';
  h += '      <b class="ep-cur-title">' + esc(ep.title) + '</b>';
  h += '      <span class="ep-cur-desc muted">— ' + esc(ep.desc) + '</span>';
  h += '    </div>';
  h += '    <div class="comic-reader-controls">';
  h += '      <button class="btn" id="loungePrevPage" title="Previous page (Left Arrow)">‹ prev</button>';
  h += '      <span class="comic-cur-page-indicator" id="loungePageInd">page 1 of ' + ep.pages.length + '</span>';
  h += '      <button class="btn" id="loungeNextPage" title="Next page (Right Arrow)">next ›</button>';
  h += '      <button class="btn" id="loungeStripToggle" title="Toggle full strip view">📜 strip mode</button>';
  h += '      <button class="btn primary" id="loungeFullscreen" title="Open in high-res modal">⛶ lightbox</button>';
  h += '    </div>';
  h += '  </div>';

  // Page Display Container
  h += '  <div class="comic-stage" id="comicStage">';
  h += '    <div class="comic-single-page" id="comicSingleView">';
  h += '      <img src="' + ep.pages[0] + '" id="comicMainImg" class="comic-main-image" alt="Comic Page 1" title="Click for next page">';
  h += '    </div>';
  h += '    <div class="comic-strip-page" id="comicStripView" style="display:none;">';
  ep.pages.forEach((pg, i) => {
    h += '    <div class="comic-strip-item">';
    h += '      <span class="comic-strip-label">' + ep.ep + ' · PAGE ' + (i + 1) + ' OF ' + ep.pages.length + '</span>';
    h += '      <img src="' + pg + '" class="comic-strip-img" alt="Page ' + (i + 1) + '" loading="lazy">';
    h += '    </div>';
  });
  h += '    </div>';
  h += '  </div>';

  // Thumbnail Rail for Single Page mode
  h += '  <div class="comic-thumb-rail" id="comicThumbRail">';
  ep.pages.forEach((pg, i) => {
    h += '  <button class="comic-thumb-btn ' + (i === 0 ? 'active' : '') + '" data-page-idx="' + i + '">';
    h += '    <img src="' + pg + '" alt="Thumb ' + (i + 1) + '">';
    h += '    <span class="thumb-lbl">p' + (i + 1) + '</span>';
    h += '  </button>';
  });
  h += '  </div>';
  h += '</div>';

  // Footer: Back to training
  h += '<div class="comic-lounge-footer">';
  h += '  <div class="downtime-prompt">';
  h += '    <span class="prompt-icon">☕</span>';
  h += '    <div>';
  h += '      <b>Rested and ready to resume tactical drills?</b>';
  h += '      <p class="muted">Your progress is automatically saved to local storage.</p>';
  h += '    </div>';
  h += '  </div>';
  h += '  <div class="downtime-footer-actions">';
  h += '    <a href="#/home" class="btn primary">→ return to overview</a>';
  h += '    <a href="#/mod/m00" class="btn">→ module 00: rules of engagement</a>';
  h += '    <a href="#/console" class="btn">→ open console</a>';
  h += '  </div>';
  h += '</div>';

  h += '</div>';

  return {
    html: h,
    after: () => wireComicLounge(ep)
  };
};

function wireComicLounge(ep) {
  let curPage = 0;
  let isStrip = false;
  const mainImg = document.getElementById('comicMainImg');
  const pageInd = document.getElementById('loungePageInd');
  const prevBtn = document.getElementById('loungePrevPage');
  const nextBtn = document.getElementById('loungeNextPage');
  const stripBtn = document.getElementById('loungeStripToggle');
  const fsBtn = document.getElementById('loungeFullscreen');
  const singleView = document.getElementById('comicSingleView');
  const stripView = document.getElementById('comicStripView');
  const thumbRail = document.getElementById('comicThumbRail');
  const thumbs = document.querySelectorAll('.comic-thumb-btn');

  function setPage(idx) {
    if (idx < 0 || idx >= ep.pages.length) return;
    curPage = idx;
    if (mainImg) {
      mainImg.style.opacity = '0.3';
      mainImg.src = ep.pages[curPage];
      setTimeout(() => { if (mainImg) mainImg.style.opacity = '1'; }, 40);
    }
    if (pageInd) pageInd.textContent = `page ${curPage + 1} of ${ep.pages.length}`;
    if (prevBtn) prevBtn.disabled = curPage === 0;
    if (nextBtn) nextBtn.disabled = curPage === ep.pages.length - 1;

    thumbs.forEach(t => {
      const pi = parseInt(t.getAttribute('data-page-idx'), 10);
      t.classList.toggle('active', pi === curPage);
    });

    if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
  }

  if (prevBtn) prevBtn.onclick = () => setPage(curPage - 1);
  if (nextBtn) nextBtn.onclick = () => setPage(curPage + 1);
  if (mainImg) mainImg.onclick = () => {
    if (curPage < ep.pages.length - 1) setPage(curPage + 1);
    else setPage(0);
  };

  thumbs.forEach(t => {
    t.onclick = () => {
      const idx = parseInt(t.getAttribute('data-page-idx'), 10);
      setPage(idx);
    };
  });

  if (stripBtn) {
    stripBtn.onclick = () => {
      isStrip = !isStrip;
      if (isStrip) {
        if (singleView) singleView.style.display = 'none';
        if (stripView) stripView.style.display = 'flex';
        if (thumbRail) thumbRail.style.display = 'none';
        stripBtn.textContent = '📄 single page';
        stripBtn.classList.add('active');
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (pageInd) pageInd.textContent = 'all 6 pages';
      } else {
        if (singleView) singleView.style.display = 'flex';
        if (stripView) stripView.style.display = 'none';
        if (thumbRail) thumbRail.style.display = 'flex';
        stripBtn.textContent = '📜 strip mode';
        stripBtn.classList.remove('active');
        setPage(curPage);
      }
      if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
    };
  }

  if (fsBtn) {
    fsBtn.onclick = () => openComicReader(ep);
  }

  const keyHandler = (e) => {
    if (!document.getElementById('comicMainImg')) {
      window.removeEventListener('keydown', keyHandler);
      return;
    }
    if (isStrip) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setPage(curPage - 1);
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      setPage(curPage + 1);
    }
  };
  window.addEventListener('keydown', keyHandler);
}

/* ---------------------------------------------------------------- *
 * ROADMAP
 * ---------------------------------------------------------------- */
ZO.views.map = function () {
  const phases = [...new Set(ZM.map(m => m.phase))].sort(phaseSort);
  let rows = '';
  phases.forEach((p, pi) => {
    const ms = ZM.filter(m => m.phase === p);
    const tot = ms.reduce((n, m) => n + m.lessons.length, 0);
    const dn = ms.reduce((n, m) => n + m.lessons.filter((_, i) => ZOState(m.id, i)).length, 0);
    const pct = tot ? Math.round((dn / tot) * 100) : 0;
    rows += '<div class="phaseblock"><div class="phasehead"><span class="badge ' + (pct === 100 ? 'on' : '') + '">' +
      String(pi + 1).padStart(2, '0') + '</span> <b>' + esc(p) + '</b> <span class="sp"></span>' + meter(pct) + ' <span class="muted small">' +
      dn + '/' + tot + ' lessons · ' + ms.reduce((n, m) => n + m.xp, 0) + ' xp available</span></div>';
    ms.forEach((m) => {
      rows += '<div class="maprow"><div class="maphead">' +
        '<span class="mono badge">' + esc(m.n) + '</span> <b>' + esc(m.title) + '</b>' +
        '<span class="sp"></span><button class="btn" data-act="go" data-hash="#/mod/' + m.id + '">open →</button></div>' +
        '<div class="sub">' + esc(m.why || m.blurb) + '</div>' +
        '<ol class="tight">' + m.lessons.map((l, i) =>
          '<li class="' + (ZOState(m.id, i) ? 'doneli' : '') + '"><a href="#/mod/' + m.id + '">' + esc(l.t) + '</a>' +
          (ZOState(m.id, i) ? ' <span class="o-ok">✓</span>' : '') + '</li>').join('') + '</ol>' +
        (m.tools && m.tools.length ? '<div class="chips small">tools: ' + m.tools.map(id => T[id] ? chip(T[id].name, 'go', '#/tool/' + id) : chip(id, 'noop')).join(' ') + '</div>' : '') +
        (m.labs && m.labs.length ? '<div class="chips small">labs: ' + m.labs.map(id => L[id] ? chip(L[id].title.slice(0, 34), 'go', '#/lab/' + id) : chip(id, 'noop')).join(' ') + '</div>' : '') +
        '</div>';
    });
    rows += '</div>';
  });
  const mapHolo = window.ZOAscii3D ? window.ZOAscii3D.embedHtml('map-holo', 'tree_of_life', 'KABBALISTIC CURRICULUM TOPOLOGY') : '';

  return {
    html: crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'roadmap' }]) +
      '<h1 class="h1">the whole course on one page</h1>' +
      '<p class="sub">' + ZM.length + ' modules · ' + ZM.reduce((n, m) => n + m.lessons.length, 0) + ' lessons · ' +
      ZL.length + ' labs · ' + ZD.length + ' drills · ' + ZF.length + ' forge recipes. Work left to right, top to bottom. ' +
      'Nothing later assumes you skipped something earlier.</p>' +
      mapHolo + rows,
    after: () => {
      if (window.ZOAscii3D) window.ZOAscii3D.wireEmbedded('map-holo', 'tree_of_life', 52, 20);
    }
  };
};

/* ---------------------------------------------------------------- *
 * MODULE READER
 * ---------------------------------------------------------------- */
ZO.views.mod = function (r) {
  const m = M[r.id];
  if (!m) return ZO.views.notfound(r);
  const done = m.lessons.filter((_, i) => ZOStateLike(m.id, i)).length;
  const all = done === m.lessons.length && m.lessons.length > 0;
  const idx = ZM.findIndex(x => x.id === m.id);
  const prev = ZM[idx - 1], next = ZM[idx + 1];

  let h = crumbs([{ t: 'ZothPen', go: '/home' }, { t: 'roadmap', go: '/map' }, { t: m.n + ' ' + m.title }]);

  const sigilHtml = window.ZOSigils ? window.ZOSigils.phaseSigil(m.phase, 68) : '';

  h += '<div class="panel hi modhead">' +
    '<div class="modhead-hero">' +
      '<div class="modhead-sigil-box" title="' + esc(m.phase) + ' Phase Sigil">' + sigilHtml + '</div>' +
      '<div>' +
        '<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;flex-wrap:wrap;">' +
          '<span class="badge ' + (all ? 'on' : '') + '">' + esc(m.phase) + '</span> ' +
          '<span class="badge">' + esc(m.n) + '</span> <span class="badge">' + m.xp + ' xp</span>' +
        '</div>' +
        '<h1 class="h1">' + esc(m.title) + '</h1>' +
        '<p class="sub">' + esc(m.blurb) + '</p>' +
      '</div>' +
    '</div>' +
    (m.why ? '<div class="whybox"><b>why this module exists</b><p>' + esc(m.why) + '</p></div>' : '');

  const MOD_ADVISORS = {
    m00: { id: 'solon', name: 'Solon', role: 'RoE Lawgiver', img: 'assets/img/agents/solon.png', quote: 'Scoped, written authorization is your immutable shield. Never strike outside the charter.' },
    m01: { id: 'hermes', name: 'Hermes', role: 'Network Topology', img: 'assets/img/agents/hermes.png', quote: 'Sweep the target subnets with stealth SYN packets. Map the landscape before any interaction.' },
    m02: { id: 'lycan', name: 'Lycan', role: 'Vuln Hunter', img: 'assets/img/agents/lycan.png', quote: 'Cross-reference services against known CVE signatures. Automated scouting reveals misconfigurations.' },
    m03: { id: 'scorpius', name: 'Scorpius', role: 'Web Exploitation', img: 'assets/img/agents/scorpius.png', quote: 'Web applications trust input at their peril. Parameter tamper, observe reflections, trace responses.' },
    m04: { id: 'kai', name: 'Kai', role: 'Exploit Infiltrator', img: 'assets/img/agents/kai.png', quote: 'Buffer layouts are geometric. Precise alignment and offset calculation guarantee payload execution.' },
    m05: { id: 'ghostbyte', name: 'GhostByte', role: 'Cryptographic Scout', img: 'assets/img/ghostbyte.png', quote: 'Analyze ciphertext entropy and algorithm weaknesses. Strong cryptography requires zero implementation flaws.' },
    m06: { id: 'aquila', name: 'Aquila', role: 'RF / Wi-Fi Recon', img: 'assets/img/agents/aquila.png', quote: 'Listen to the 802.11 beacon frames and 4-way handshakes floating through the airwaves.' },
    m07: { id: 'athena', name: 'Athena', role: 'Aegis Defense & Evasion', img: 'assets/img/agents/athena.png', quote: 'Understand defensive telemetry to evaluate evasion resilience. The best offense tests impenetrable shields.' },
    m08: { id: 'kitsune', name: 'Kitsune', role: 'Nine-Tailed Illusionist', img: 'assets/img/agents/kitsune.png', quote: 'Authentication mechanisms must withstand deceptive social framing and credential spoofing vectors.' },
    m09: { id: 'chronos', name: 'Chronos', role: 'Temporal Forensics', img: 'assets/img/agents/chronos.png', quote: 'Timestamps, memory dumps, and syslog files tell the true sequence of events. Artifacts never lie.' }
  };
  const adv = MOD_ADVISORS[m.id] || MOD_ADVISORS.m00;
  h += '<div class="mod-advisor-card">' +
    '<img src="' + adv.img + '" class="mod-advisor-img" alt="' + esc(adv.name) + '">' +
    '<div class="mod-advisor-body">' +
      '<div class="mod-advisor-head"><span class="pulse-dot"></span><b>SWARM ADVISOR // ' + esc(adv.name.toUpperCase()) + '</b><span class="telemetry">' + esc(adv.role.toUpperCase()) + '</span></div>' +
      '<div class="mod-advisor-quote">"' + esc(adv.quote) + '"</div>' +
    '</div>' +
  '</div>';

  h += '<details class="mod-holo-details" open style="margin: 10px 0 16px; border: 1px solid var(--border-bright); border-radius: 6px; padding: 10px 14px; background: rgba(0,0,0,0.35);">' +
      '<summary style="cursor: pointer; font-family: var(--font-mono); font-size: 11px; color: var(--accent); user-select: none;">' +
        '◈ <b>TACTICAL HOLOGRAPHIC GLYPH // ' + esc(m.n) + ' ' + esc(m.phase).toUpperCase() + '</b> <span class="muted small">(Live 3D ASCII mesh · Drag to rotate)</span>' +
      '</summary>' +
      '<div style="margin-top: 12px; display: flex; flex-direction: column; align-items: center;">' +
        '<pre id="mod-ascii-canvas" class="ascii-3d-canvas" style="height: 180px; width: 100%;"></pre>' +
        '<div class="hologram-btn-row" style="margin-top: 8px;">' +
          '<span class="lbl">geometry:</span>' +
          '<button class="btn-holo active" data-mod-geom="hermetic_seal">hermetic seal</button>' +
          '<button class="btn-holo" data-mod-geom="azoth">azoth</button>' +
          '<button class="btn-holo" data-mod-geom="ouroboros">ouroboros</button>' +
          '<button class="btn-holo" data-mod-geom="tree_of_life">tree of life</button>' +
          '<button class="btn-holo" data-mod-geom="tesseract">tesseract</button>' +
          '<button class="btn-holo" data-mod-geom="skull">skull</button>' +
          '<span class="sp"></span>' +
          '<button class="btn-holo active" data-mod-mode="braille">braille</button>' +
          '<button class="btn-holo" data-mod-mode="dither">dither</button>' +
          '<button class="btn-holo" data-mod-mode="holo">holo</button>' +
          '<button class="btn-holo" data-mod-mode="ascii">ascii</button>' +
        '</div>' +
      '</div>' +
    '</details>' +
    '<div class="modbar">' + meter(Math.round((done / m.lessons.length) * 100)) +
      '<span class="muted small">' + done + '/' + m.lessons.length + ' lessons marked done</span>' +
      '<span class="sp"></span>' +
      '<button class="btn" data-act="expandall">expand all</button>' +
      (all ? '<button class="btn" data-act="unmarkmod" data-id="' + m.id + '">unmark module</button>' : '') +
    '</div>' +
    '<div class="lessonnav">' + m.lessons.map((l, i) =>
      '<a class="lnk ' + (ZOStateLike(m.id, i) ? 'on' : '') + '" href="#L' + i + '">' + (i + 1) + '. ' + esc(l.t) + '</a>').join('') +
    '</div></div>';

  if (m.keyIdeas && m.keyIdeas.length) {
    h += '<div class="panel keybox"><h4 class="h4">the five things to take away</h4><ul class="tight">' +
      m.keyIdeas.map(k => '<li>' + mdInline(k) + '</li>').join('') + '</ul></div>';
  }

  m.lessons.forEach((l, i) => {
    const isDone = ZOStateLike(m.id, i);
    h += '<section class="lesson ' + (isDone ? 'done' : '') + '" id="L' + i + '">' +
      '<div class="lesson-head"><span class="lnum">' + String(i + 1).padStart(2, '0') + '</span>' +
      '<h2 class="h2">' + esc(l.t) + '</h2><span class="sp"></span>' +
      '<button class="tick ' + (isDone ? 'on' : '') + '" data-act="lesson" data-mod="' + m.id + '" data-i="' + i + '" ' +
      'title="mark this lesson done">' + (isDone ? '✓ done' : 'mark done') + '</button></div>' +
      '<div class="lesson-body" data-lesson="' + i + '">' + md(l.body) + '</div>' +
      '</section>';
  });

  if (m.tools && m.tools.length) {
    h += '<div class="panel"><h4 class="h4">tooling for this module</h4><div class="grid g3">' +
      m.tools.map((id, idx) => toolMini(id, idx)).join('') + '</div></div>';
  }
  if (m.labs && m.labs.length) {
    h += '<div class="panel"><h4 class="h4">do it now — labs attached to this module</h4>' +
      '<div class="grid g2">' + m.labs.map((id, idx) => L[id] ? labCard(L[id], idx) : '<div class="card"><span class="t">' + esc(id) + '</span><span class="d muted">lab id not found</span></div>').join('') + '</div></div>';
  }
  const drl = ZD.filter(d => d.mod === m.id);
  if (drl.length) {
    h += '<div class="panel"><h4 class="h4">test yourself — ' + drl.length + ' drills cover this module</h4>' +
      '<button class="btn primary" data-act="go" data-hash="#/drills/' + m.id + '">→ drill ' + esc(m.n) + '</button>' +
      '<div class="muted small" style="margin-top:8px">Judgement calls, not syntax. These are the ones that get people fired or prosecuted.</div></div>';
  }

  h += '<div class="pager">' +
    (prev ? '<button class="btn" data-act="go" data-hash="#/mod/' + prev.id + '">← ' + esc(prev.n + ' ' + prev.title) + '</button>' : '<span></span>') +
    (next ? '<button class="btn" data-act="go" data-hash="#/mod/' + next.id + '">' + esc(next.n + ' ' + next.title) + ' →</button>' : '<span></span>') +
    '</div>';
  return { html: h, after: () => wireModule(m) };
};
const ZOStateLike = (mod, i) => { const S = ZO.state(); return !!S.lessons[mod + ':' + i]; };
function mdInline(s) { return ZO.inline(s); }

function toolMini(id, index = 0) {
  const t = T[id];
  if (!t) return '<div class="card"><span class="t mono">' + esc(id) + '</span><span class="d muted">no dossier yet</span></div>';
  const bgArt = window.ZOPixelArt ? window.ZOPixelArt.getSceneFor(t.name || t.kind, index) : '';
  return '<button class="card" data-act="go" data-hash="#/tool/' + t.id + '">' +
    bgArt +
    '<span class="t"><b>' + esc(t.name) + '</b> ' + kindTag(t.kind) + '</span>' +
    '<span class="d">' + esc(t.tagline) + '</span></button>';
}
function labCard(l, index = 0) {
  const done = ZO.state().labs[l.id];
  const bgArt = window.ZOPixelArt ? window.ZOPixelArt.getSceneFor(l.diff || l.id, index) : '';
  return '<button class="card ' + (done ? 'carddone' : '') + '" data-act="go" data-hash="#/lab/' + l.id + '" data-diff="' + esc(l.diff || '') + '">' +
    bgArt +
    '<span class="cardtop">' + diffTag(l.diff) + '<span class="badge">' + esc(l.os) + '</span>' +
    '<span class="sp"></span><span class="muted small">' + esc(l.time) + ' · ' + l.xp + 'xp</span></span>' +
    '<span class="t"><b>' + esc(l.title) + '</b></span>' +
    '<span class="d">' + esc(l.goal) + '</span>' + (done ? '<span class="d o-ok small">✓ complete</span>' : '') + '</button>';
}
ZO.toolMini = toolMini; ZO.labCard = labCard;

function wireModule(m) {
  document.querySelectorAll('[data-act="expandall"]').forEach(b => {
    b.onclick = () => {
      const bodies = document.querySelectorAll('.lesson-body');
      const anyHidden = Array.from(bodies).some(x => x.hidden);
      bodies.forEach(x => { x.hidden = anyHidden ? false : true; });
      b.textContent = anyHidden ? 'collapse all' : 'expand all';
    };
  });
  document.querySelectorAll('[data-act="unmarkmod"]').forEach(b => {
    b.onclick = () => {
      const S = ZO.state();
      m.lessons.forEach((_, i) => { delete S.lessons[m.id + ':' + i]; });
      delete S.mods[m.id]; ZO.save(true); ZO.render();
    };
  });
  // lesson nav smooth scroll
  document.querySelectorAll('.lessonnav a').forEach(a => {
    a.onclick = (e) => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  });

  // Wire 3D ASCII Holographic Glyph
  const modCanvas = document.getElementById('mod-ascii-canvas');
  if (modCanvas && window.ZOAscii3D) {
    let geom = 'hermetic_seal';
    const p = (m.phase || '').toLowerCase();
    if (m.id === 'm00' || p.includes('orient')) geom = 'hermetic_seal';
    else if (p.includes('found') || m.id === 'm01' || m.id === 'm02') geom = 'tesseract';
    else if (p.includes('recon') || m.id === 'm04') geom = 'globe';
    else if (p.includes('exploit') || m.id === 'm06') geom = 'skull';
    else if (p.includes('report') || m.id === 'm07') geom = 'tree_of_life';
    else if (p.includes('forge')) geom = 'torus';
    else geom = 'ouroboros';

    const engine = window.ZOAscii3D.create(modCanvas, {
      geom: geom,
      mode: 'braille',
      width: 48,
      height: 18
    });
    if (engine) engine.start();

    // Wire module buttons
    document.querySelectorAll('[data-mod-geom]').forEach(b => {
      if (b.getAttribute('data-mod-geom') === geom) b.classList.add('active');
      else b.classList.remove('active');
      b.onclick = () => {
        document.querySelectorAll('[data-mod-geom]').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const g = b.getAttribute('data-mod-geom');
        if (engine) engine.setGeom(g);
        if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
      };
    });
    document.querySelectorAll('[data-mod-mode]').forEach(mBtn => {
      mBtn.onclick = () => {
        document.querySelectorAll('[data-mod-mode]').forEach(x => x.classList.remove('active'));
        mBtn.classList.add('active');
        const md = mBtn.getAttribute('data-mod-mode');
        if (engine) engine.setMode(md);
        if (window.ZOSynth && window.ZOSynth.playClick) window.ZOSynth.playClick();
      };
    });
  }
}

})();
