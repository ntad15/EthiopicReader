#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  printf '\n==> %s\n' "$1"
}

note() {
  printf '    %s\n' "$1"
}

have() {
  command -v "$1" >/dev/null 2>&1
}

install_homebrew_package() {
  local binary="$1"
  local formula="$2"

  if have "$binary"; then
    note "$binary already installed"
    return 0
  fi

  if ! have brew; then
    printf 'error: %s is missing and Homebrew is not available. Install %s manually, then rerun ./scripts/setup-dev.sh.\n' "$binary" "$binary" >&2
    return 1
  fi

  log "Installing $binary with Homebrew"
  brew install "$formula"
}

direnv_hook_line() {
  case "$(basename "${SHELL:-}")" in
    zsh)
      printf '%s' 'eval "$(direnv hook zsh)"'
      ;;
    bash)
      printf '%s' 'eval "$(direnv hook bash)"'
      ;;
    fish)
      printf '%s' 'direnv hook fish | source'
      ;;
    *)
      return 1
      ;;
  esac
}

direnv_rc_file() {
  case "$(basename "${SHELL:-}")" in
    zsh)
      printf '%s' "${HOME}/.zshrc"
      ;;
    bash)
      printf '%s' "${HOME}/.bashrc"
      ;;
    fish)
      printf '%s' "${HOME}/.config/fish/config.fish"
      ;;
    *)
      return 1
      ;;
  esac
}

log "Checking required project tools"
if ! have npm; then
  printf 'error: npm is required but was not found on PATH.\n' >&2
  exit 1
fi
note "npm $(npm --version)"

if [[ -d node_modules ]]; then
  note "node_modules already present; skipping npm ci"
else
  log "Installing project dependencies"
  npm ci
fi

log "Checking maintainer tools"
install_homebrew_package direnv direnv
install_homebrew_package pre-commit pre-commit

if have direnv && [[ -f .envrc ]]; then
  log "Allowing repo .envrc"
  direnv allow "$ROOT_DIR"

  if hook_line="$(direnv_hook_line 2>/dev/null)" && rc_file="$(direnv_rc_file 2>/dev/null)"; then
    if [[ -f "$rc_file" ]] && grep -Fq "$hook_line" "$rc_file"; then
      note "direnv shell hook already present in $rc_file"
    else
      note "Add this line to $rc_file if you want direnv to load automatically in new shells:"
      note "$hook_line"
    fi
  fi
fi

if have pre-commit && [[ -f .pre-commit-config.yaml ]]; then
  log "Installing pre-commit hook"
  pre-commit install
  note "pre-commit hook installed"
fi

log "Setup complete"
note "Try: npm run web"
note "Content maintainers can use: npm run content:sync && npm run content:check"
