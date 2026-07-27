#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

HADCRUT_URL='https://www.metoffice.gov.uk/hadobs/hadcrut5/data/HadCRUT.5.1.0.0/analysis/diagnostics/HadCRUT.5.1.0.0.analysis.summary_series.global.annual.csv'
GISTEMP_URL='https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.txt'

HADCRUT_TARGET='data/HadCRUT.5.1.0.0.analysis.summary_series.global.annual.csv'
GISTEMP_TARGET='data/GLB.Ts+dSST.txt'

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    printf 'Run this script from inside the DCENT_HOMEPAGE Git repository.\n' >&2
    exit 1
fi

if ! git diff --cached --quiet; then
    printf 'You have staged changes. Commit or unstage them before running update.sh.\n' >&2
    exit 1
fi

TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/dcent-gmst-update.XXXXXX")"
trap 'rm -rf "$TEMP_DIR"' EXIT

HADCRUT_DOWNLOAD="$TEMP_DIR/hadcrut5.csv"
GISTEMP_DOWNLOAD="$TEMP_DIR/gistemp4.txt"

printf 'Downloading HadCRUT5…\n'
curl --fail --location --silent --show-error --retry 3 --output "$HADCRUT_DOWNLOAD" "$HADCRUT_URL"

printf 'Downloading GISTEMP4…\n'
curl --fail --location --silent --show-error --retry 3 --output "$GISTEMP_DOWNLOAD" "$GISTEMP_URL"

if ! head -n 1 "$HADCRUT_DOWNLOAD" | grep -Fq 'Time,Anomaly (deg C)'; then
    printf 'HadCRUT5 download did not contain the expected annual-data header. Nothing was changed.\n' >&2
    exit 1
fi

if ! grep -Fq 'GLOBAL Land-Ocean Temperature Index' "$GISTEMP_DOWNLOAD"; then
    printf 'GISTEMP4 download did not contain the expected global annual-data header. Nothing was changed.\n' >&2
    exit 1
fi

changed=0

update_if_changed() {
    local download_file="$1"
    local target_file="$2"
    local label="$3"

    if cmp -s "$download_file" "$target_file"; then
        printf '%s: no change.\n' "$label"
        return
    fi

    mv "$download_file" "$target_file"
    git add -- "$target_file"
    changed=1
    printf '%s: updated.\n' "$label"
}

update_if_changed "$HADCRUT_DOWNLOAD" "$HADCRUT_TARGET" 'HadCRUT5'
update_if_changed "$GISTEMP_DOWNLOAD" "$GISTEMP_TARGET" 'GISTEMP4'

if [ "$changed" -eq 0 ]; then
    printf 'No data changes to commit.\n'
    exit 0
fi

git commit -m 'Update HadCRUT5 and GISTEMP4 annual data'
git push
printf 'Data update committed and pushed.\n'
