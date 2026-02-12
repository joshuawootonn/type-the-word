#!/usr/bin/env bash

set -euo pipefail

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: Run this command from inside a git repository." >&2
    exit 1
fi

cd "$REPO_ROOT"

resolve_abs_path() {
    local candidate="$1"

    if [[ "$candidate" == /* ]]; then
        realpath -m "$candidate"
    else
        realpath -m "$REPO_ROOT/$candidate"
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
HOOK_PATH="$TARGET_HOOKS_DIR/post-checkout"
MARKER_START="# >>> ttw-worktree-bootstrap >>>"
MARKER_END="# <<< ttw-worktree-bootstrap <<<"

read -r -d '' HOOK_SNIPPET <<'EOF' || true
# >>> ttw-worktree-bootstrap >>>
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$REPO_ROOT" ] && [ -f "$REPO_ROOT/scripts/worktree-bootstrap.sh" ]; then
    # Never block checkout from proceeding if bootstrap fails.
    bash "$REPO_ROOT/scripts/worktree-bootstrap.sh" || true
fi
# <<< ttw-worktree-bootstrap <<<
EOF

mkdir -p "$TARGET_HOOKS_DIR"
mkdir -p "$ACTIVE_HOOKS_DIR"
ensure_cursor_post_checkout_dispatcher "$ACTIVE_HOOKS_DIR"

if [[ -f "$HOOK_PATH" ]]; then
    HOOK_CONTENT="$(<"$HOOK_PATH")"
    if [[ "$HOOK_CONTENT" == *"$MARKER_START"* && "$HOOK_CONTENT" == *"$MARKER_END"* ]]; then
        awk -v marker_start="$MARKER_START" -v marker_end="$MARKER_END" '
            $0 == marker_start { in_block = 1; next }
            in_block == 1 && $0 == marker_end { in_block = 0; next }
            in_block == 0 { print }
        ' "$HOOK_PATH" > "$HOOK_PATH.tmp"
        mv "$HOOK_PATH.tmp" "$HOOK_PATH"
    fi
else
    printf '#!/usr/bin/env bash\nset -euo pipefail\n' > "$HOOK_PATH"
fi

printf '\n%s\n' "$HOOK_SNIPPET" >> "$HOOK_PATH"
chmod +x "$HOOK_PATH"

echo "Installed/updated worktree bootstrap post-checkout hook at $HOOK_PATH"
