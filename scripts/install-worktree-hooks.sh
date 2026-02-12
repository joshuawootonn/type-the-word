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

resolve_target_hooks_dir() {
    local active_hooks_path=""
    active_hooks_path="$(git config --get core.hooksPath || true)"

    if [[ -z "$active_hooks_path" ]]; then
        resolve_abs_path "$(git rev-parse --git-common-dir)/hooks"
        return 0
    fi

    local active_hooks_dir=""
    active_hooks_dir="$(resolve_abs_path "$active_hooks_path")"

    if [[ -f "$active_hooks_dir/.cursor-original-hooks-path" ]]; then
        local original_hooks_path=""
        original_hooks_path="$(<"$active_hooks_dir/.cursor-original-hooks-path")"

        if [[ -n "$original_hooks_path" ]]; then
            resolve_abs_path "$original_hooks_path"
            return 0
        fi
    fi

    printf '%s\n' "$active_hooks_dir"
}

TARGET_HOOKS_DIR="$(resolve_target_hooks_dir)"
HOOK_PATH="$TARGET_HOOKS_DIR/post-checkout"
MARKER_START="# >>> ttw-worktree-bootstrap >>>"

read -r -d '' HOOK_SNIPPET <<'EOF' || true
# >>> ttw-worktree-bootstrap >>>
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$REPO_ROOT" ] && [ -x "$REPO_ROOT/scripts/worktree-bootstrap.sh" ]; then
    # Never block checkout from proceeding if bootstrap fails.
    bash "$REPO_ROOT/scripts/worktree-bootstrap.sh" || true
fi
# <<< ttw-worktree-bootstrap <<<
EOF

mkdir -p "$TARGET_HOOKS_DIR"

if [[ -f "$HOOK_PATH" ]]; then
    HOOK_CONTENT="$(<"$HOOK_PATH")"
    if [[ "$HOOK_CONTENT" == *"$MARKER_START"* ]]; then
        echo "Worktree bootstrap post-checkout hook is already installed at $HOOK_PATH"
        exit 0
    fi
else
    printf '#!/usr/bin/env bash\nset -euo pipefail\n' > "$HOOK_PATH"
fi

printf '\n%s\n' "$HOOK_SNIPPET" >> "$HOOK_PATH"
chmod +x "$HOOK_PATH"

echo "Installed worktree bootstrap post-checkout hook at $HOOK_PATH"
