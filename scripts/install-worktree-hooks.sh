#!/usr/bin/env bash

set -euo pipefail

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: Run this command from inside a git repository." >&2
    exit 1
fi

cd "$REPO_ROOT"

resolve_path() {
    local candidate="$1"

    if command -v realpath >/dev/null 2>&1 && realpath -m / >/dev/null 2>&1; then
        realpath -m "$candidate"
        return
    fi

    if command -v python3 >/dev/null 2>&1; then
        python3 - "$candidate" <<'PY'
from pathlib import Path
import sys

print(str(Path(sys.argv[1]).expanduser().resolve(strict=False)))
PY
        return
    fi

    echo "Error: Could not resolve path. Install python3 or GNU coreutils realpath." >&2
    exit 1
}

resolve_abs_path() {
    local candidate="$1"

    if [[ "$candidate" == /* ]]; then
        resolve_path "$candidate"
    else
        resolve_path "$REPO_ROOT/$candidate"
    fi
}

resolve_active_hooks_dir() {
    local active_hooks_path=""
    active_hooks_path="$(git config --get core.hooksPath || true)"

    if [[ -z "$active_hooks_path" ]]; then
        printf '%s\n' "$(resolve_abs_path "$(git rev-parse --git-common-dir)/hooks")"
        return
    fi

    resolve_abs_path "$active_hooks_path"
}

resolve_target_hooks_dir() {
    local active_hooks_dir="$1"

    if [[ -f "$active_hooks_dir/.cursor-original-hooks-path" ]]; then
        local original_hooks_path=""
        original_hooks_path="$(<"$active_hooks_dir/.cursor-original-hooks-path")"

        if [[ -n "$original_hooks_path" ]]; then
            printf '%s\n' "$(resolve_abs_path "$original_hooks_path")"
            return
        fi
    fi

    printf '%s\n' "$active_hooks_dir"
}

ensure_cursor_post_checkout_dispatcher() {
    local active_hooks_dir="$1"
    local dispatcher_path="$active_hooks_dir/.dispatcher"
    local hook_entry_path="$active_hooks_dir/post-checkout"

    if [[ ! -f "$dispatcher_path" ]]; then
        return
    fi

    if [[ -e "$hook_entry_path" ]]; then
        return
    fi

    if ln -s ".dispatcher" "$hook_entry_path" 2>/dev/null; then
        return
    fi

    printf '#!/usr/bin/env bash\nset -e\nHOOKS_DIR="$(cd "$(dirname "$0")" && pwd)"\n"$HOOKS_DIR/.dispatcher" "$@"\n' > "$hook_entry_path"
    chmod +x "$hook_entry_path"
}

ACTIVE_HOOKS_DIR="$(resolve_active_hooks_dir)"
TARGET_HOOKS_DIR="$(resolve_target_hooks_dir "$ACTIVE_HOOKS_DIR")"
POST_CHECKOUT_HOOK_PATH="$TARGET_HOOKS_DIR/post-checkout"
POST_CHECKOUT_MARKER_START="# >>> ttw-worktree-bootstrap >>>"
POST_CHECKOUT_MARKER_END="# <<< ttw-worktree-bootstrap <<<"
PRE_COMMIT_HOOK_PATH="$TARGET_HOOKS_DIR/pre-commit"
PRE_COMMIT_MARKER_START="# >>> ttw-pre-flight >>>"
PRE_COMMIT_MARKER_END="# <<< ttw-pre-flight <<<"

read -r -d '' HOOK_SNIPPET <<'EOF' || true
# >>> ttw-worktree-bootstrap >>>
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$REPO_ROOT" ] && [ -f "$REPO_ROOT/scripts/worktree-bootstrap.sh" ]; then
    # Never block checkout from proceeding if bootstrap fails.
    bash "$REPO_ROOT/scripts/worktree-bootstrap.sh" || true
fi
# <<< ttw-worktree-bootstrap <<<
EOF

read -r -d '' PRE_COMMIT_SNIPPET <<'EOF' || true
# >>> ttw-pre-flight >>>
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$REPO_ROOT" ]; then
    echo "Error: Unable to resolve repository root for pre-commit hook." >&2
    exit 1
fi

if ! command -v just >/dev/null 2>&1; then
    echo "Error: 'just' is required to run pre-commit checks." >&2
    exit 1
fi

cd "$REPO_ROOT"
echo "Running just pre-flight..."
just pre-flight
# <<< ttw-pre-flight <<<
EOF

upsert_hook_block() {
    local hook_path="$1"
    local marker_start="$2"
    local marker_end="$3"
    local snippet="$4"

    if [[ -f "$hook_path" ]]; then
        local hook_content
        hook_content="$(<"$hook_path")"
        if [[ "$hook_content" == *"$marker_start"* && "$hook_content" == *"$marker_end"* ]]; then
            awk -v marker_start="$marker_start" -v marker_end="$marker_end" '
                $0 == marker_start { in_block = 1; next }
                in_block == 1 && $0 == marker_end { in_block = 0; next }
                in_block == 0 { print }
            ' "$hook_path" > "$hook_path.tmp"
            mv "$hook_path.tmp" "$hook_path"
        fi
    else
        printf '#!/usr/bin/env bash\nset -euo pipefail\n' > "$hook_path"
    fi

    printf '\n%s\n' "$snippet" >> "$hook_path"
    chmod +x "$hook_path"
}

mkdir -p "$TARGET_HOOKS_DIR"
mkdir -p "$ACTIVE_HOOKS_DIR"
ensure_cursor_post_checkout_dispatcher "$ACTIVE_HOOKS_DIR"
upsert_hook_block \
    "$POST_CHECKOUT_HOOK_PATH" \
    "$POST_CHECKOUT_MARKER_START" \
    "$POST_CHECKOUT_MARKER_END" \
    "$HOOK_SNIPPET"
upsert_hook_block \
    "$PRE_COMMIT_HOOK_PATH" \
    "$PRE_COMMIT_MARKER_START" \
    "$PRE_COMMIT_MARKER_END" \
    "$PRE_COMMIT_SNIPPET"

echo "Installed/updated hooks:"
echo "- post-checkout: $POST_CHECKOUT_HOOK_PATH"
echo "- pre-commit: $PRE_COMMIT_HOOK_PATH"
