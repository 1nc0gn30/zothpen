#!/usr/bin/env python3
"""fix_forge_usage.py - second notation sweep, this one for the Forge recipes.

Same contract as fix_notation.py / fix_snippets.py: every row is a whole line
that must occur exactly once in the target file, and the replacement is what
ships. A missing or ambiguous needle aborts the run; a row whose replacement is
already present is skipped, so re-running is safe.

What is wrong on these lines (survey the learner actually reads):
  * `<target>`-style placeholders inside usage strings and header comments.
    Inside `${1:?usage: ... <target>}` bash does NOT read `<` as a redirect, so
    it runs — but every other command in the app uses UPPER tokens, and mixed
    notation is exactly the "syntax is off" signal the reader reacts to.
  * `<b64>` / `<chunk>` stand-ins in transfer one-liners, and `kind<TAB>value`,
    which reads as a placeholder but means "the literal separator".
Runs as-is after the change, and the placeholders say what to substitute.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPLY = "--apply" in sys.argv
FILE = "assets/data-forge.js"

ROWS = [
    # f-alias
    ('local t="${1:?usage: newop <target>}"',
     'local t="${1:?usage: newop TARGET}"'),
    # f-recon-chain
    ('# recon.sh <target-cidr> <outdir>       — one job: sweep, triage, version-scan',
     '# recon.sh TARGET_CIDR OUTDIR           — one job: sweep, triage, version-scan'),
    ('TARGET="${1:?usage: recon.sh <cidr> <outdir>}"',
     'TARGET="${1:?usage: recon.sh TARGET_CIDR OUTDIR}"'),
    ('OUT="${2:?usage: recon.sh <cidr> <outdir>}"',
     'OUT="${2:?usage: recon.sh TARGET_CIDR OUTDIR}"'),
    # f-wrapper
    ('# runwrapped.sh — usage: runwrapped.sh <target> <label> -- <command...>',
     '# runwrapped.sh — usage: runwrapped.sh TARGET LABEL -- COMMAND...'),
    ('target="${1:?usage: runwrapped.sh <target> <label> -- <cmd...>}"',
     'target="${1:?usage: runwrapped.sh TARGET LABEL -- COMMAND...}"'),
    ('label="${2:?usage: runwrapped.sh <target> <label> -- <cmd...>}"',
     'label="${2:?usage: runwrapped.sh TARGET LABEL -- COMMAND...}"'),
    # f-wordlist
    ('# mkwords.sh <seed-file> [year]  — build a client-specific candidate list',
     '# mkwords.sh SEEDS_TXT [YEAR]    — build a client-specific candidate list'),
    ('seed="${1:?usage: mkwords.sh <seeds.txt> [year]}"',
     'seed="${1:?usage: mkwords.sh SEEDS_TXT [YEAR]}"'),
    # f-report
    ('# mkreport.sh <engagement-dir> — skeleton + gathered evidence into pandoc markdown',
     '# mkreport.sh ENGAGEMENT_DIR   — skeleton + gathered evidence into pandoc markdown'),
    ('d="${1:?usage: mkreport.sh <engagement-dir>}"',
     'd="${1:?usage: mkreport.sh ENGAGEMENT_DIR}"'),
    ('title="${CLIENT:-<CLIENT>} — penetration test report"',
     'title="${CLIENT:-CLIENT} — penetration test report"'),
    # f-teardown
    ('REC="${REC:-logs/artefacts.txt}"       # written as you go: kind<TAB>value',
     'REC="${REC:-logs/artefacts.txt}"       # written as you go: kind, TAB, value'),
    # f-python
    ('print("refusing to run without --scope <cidr>", file=sys.stderr); return 3',
     'print("refusing to run without --scope CIDR", file=sys.stderr); return 3'),
    # f-payload-kit
    ('# stage.sh <file> [port] — print the transfer command for each situation',
     '# stage.sh FILE [PORT]  — print the transfer command for each situation'),
    ('f="${1:?usage: stage.sh <file> [port]}"',
     'f="${1:?usage: stage.sh FILE [PORT]}"'),
    ("""# on the target: echo '<b64>' | base64 -d > /dev/shm/$(basename \"$f\") && chmod +x /dev/shm/$(basename \"$f\")""",
     """# on the target: echo 'BASE64_BLOB' | base64 -d > /dev/shm/$(basename \"$f\") && chmod +x /dev/shm/$(basename \"$f\")"""),
    ("""#   target: printf '%s' '<chunk>' >> /dev/shm/b64 ; base64 -d /dev/shm/b64 | gunzip > tool""",
     """#   target: printf '%s' 'BASE64_CHUNK' >> /dev/shm/b64 ; base64 -d /dev/shm/b64 | gunzip > tool"""),
    # f-tmux
    ('# op.sh <engagement-name> — build the layout, then get out of the way',
     '# op.sh ENGAGEMENT_NAME  — build the layout, then get out of the way'),
    ('name="${1:?usage: op.sh <engagement-name>}"',
     'name="${1:?usage: op.sh ENGAGEMENT_NAME}"'),
    # f-dotfiles
    ('link() {                       # link <file-in-repo> <target-path>',
     'link() {                       # link FILE_IN_REPO TARGET_PATH'),
]


def main():
    path = os.path.join(ROOT, FILE)
    text = open(path, encoding="utf-8").read()

    def esc(s):
        """Rows are written the way a human types them; on disk the recipes are
        JS template literals, so every `$` is written `\\$`. Translate."""
        return s.replace("$", "\\$")

    applied = skipped = 0
    for raw_old, raw_new in ROWS:
        old, new = esc(raw_old), esc(raw_new)
        # rows are written without leading indentation: match the line whatever
        # it is indented by, and put the same indent back on the replacement.
        pat = re.compile(r"^([ \t]*)" + re.escape(old) + r"[ \t]*$", re.M)
        hits = pat.findall(text)
        if not hits and new in text:
            print("-- already applied: %s" % old.strip()[:70])
            skipped += 1
            continue
        if len(hits) != 1:
            print("!! needle matched %d times in %s: %r" % (len(hits), FILE, old[:70]))
            sys.exit(2)
        print("  - %s\n  + %s" % (old.strip()[:88], new.strip()[:88]))
        if APPLY:
            text = pat.sub(lambda m: m.group(1) + new, text, count=1)
        applied += 1
    if APPLY:
        open(path, "w", encoding="utf-8").write(text)
    print("\nrows: %d   ready: %d   already-applied: %d   mode: %s"
          % (len(ROWS), applied, skipped, "APPLY" if APPLY else "dry-run"))


if __name__ == "__main__":
    main()
