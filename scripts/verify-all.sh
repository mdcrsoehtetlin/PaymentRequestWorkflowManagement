#!/usr/bin/env bash
# =============================================================================
# verify-all.sh — One-Stop Project Health Verification Script
# =============================================================================
# Authority: docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md
# Usage:     bash scripts/verify-all.sh
#            bash scripts/verify-all.sh --ci   (non-interactive CI mode)
#
# This script is the SINGLE SOURCE OF TRUTH for checking project health.
# It uses ONLY native bash tools (grep, git) and existing npm scripts.
# Zero additional npm packages required.
# =============================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

# Color codes for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Project root (relative to script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Role modules that must remain isolated
ROLE_MODULES=("applicant" "manager" "approver" "accounting" "admin")

# Protected shared layer paths (relative to project root)
SHARED_BACKEND="src/modules/shared/"
SHARED_FRONTEND="frontend/src/components/shared/"

# Results tracking
STEP_RESULTS=()
TOTAL_STEPS=5
PASSED=0
FAILED=0
WARNED=0

# ─── Helper Functions ────────────────────────────────────────────────────────

print_header() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  PRWM — Project Health Verification${NC}"
  echo -e "${CYAN}  Authority: 02_開発ルール_DEVELOPMENT_RULES.md${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_step() {
  local step_num="$1"
  local step_name="$2"
  echo ""
  echo -e "${BOLD}──────────────────────────────────────────────────────────────${NC}"
  echo -e "${BOLD}  STEP ${step_num}/${TOTAL_STEPS}: ${step_name}${NC}"
  echo -e "${BOLD}──────────────────────────────────────────────────────────────${NC}"
  echo ""
}

record_pass() {
  local step_name="$1"
  STEP_RESULTS+=("${GREEN}✔ PASS${NC}  │ ${step_name}")
  PASSED=$((PASSED + 1))
}

record_fail() {
  local step_name="$1"
  STEP_RESULTS+=("${RED}✖ FAIL${NC}  │ ${step_name}")
  FAILED=$((FAILED + 1))
}

record_warn() {
  local step_name="$1"
  STEP_RESULTS+=("${YELLOW}⚠ WARN${NC}  │ ${step_name}")
  WARNED=$((WARNED + 1))
}

# ─── STEP 1: Cross-Module Import Scan ────────────────────────────────────────

step_cross_module_imports() {
  print_step "1" "Cross-Module Import Scan (§2.5 Directory Isolation)"

  local violations_found=0
  local violation_details=""

  cd "$PROJECT_ROOT"

  for source_module in "${ROLE_MODULES[@]}"; do
    for target_module in "${ROLE_MODULES[@]}"; do
      # Skip self-imports — those are allowed
      if [ "$source_module" = "$target_module" ]; then
        continue
      fi

      # Scan backend: src/modules/{source}/ for imports from ../{target}/
      local backend_path="src/modules/${source_module}/"
      if [ -d "$backend_path" ]; then
        local backend_hits
        backend_hits=$(grep -rn --include="*.ts" \
          -e "from ['\"].*/${target_module}/" \
          -e "from ['\"]\.\./${target_module}/" \
          -e "import.*from.*/${target_module}/" \
          "$backend_path" 2>/dev/null || true)

        if [ -n "$backend_hits" ]; then
          violations_found=$((violations_found + 1))
          violation_details+="  ${RED}✖${NC} Backend: ${source_module} → ${target_module}\n"
          while IFS= read -r line; do
            violation_details+="    ${line}\n"
          done <<< "$backend_hits"
        fi
      fi

      # Scan frontend: frontend/src/pages/{source}/ for imports from ../{target}/
      local frontend_path="frontend/src/pages/${source_module}/"
      if [ -d "$frontend_path" ]; then
        local frontend_hits
        frontend_hits=$(grep -rn --include="*.ts" --include="*.tsx" \
          -e "from ['\"].*pages/${target_module}/" \
          -e "from ['\"].*/${target_module}/" \
          "$frontend_path" 2>/dev/null | \
          grep -v "node_modules" | \
          grep -v "/shared/" || true)

        if [ -n "$frontend_hits" ]; then
          violations_found=$((violations_found + 1))
          violation_details+="  ${RED}✖${NC} Frontend: ${source_module} → ${target_module}\n"
          while IFS= read -r line; do
            violation_details+="    ${line}\n"
          done <<< "$frontend_hits"
        fi
      fi
    done
  done

  if [ "$violations_found" -eq 0 ]; then
    echo -e "  ${GREEN}✔${NC} No forbidden cross-module imports detected."
    echo -e "  Scanned ${#ROLE_MODULES[@]} role modules (backend + frontend)."
    record_pass "Cross-Module Import Scan"
  else
    echo -e "  ${RED}✖ Found ${violations_found} cross-module import violation(s):${NC}"
    echo ""
    echo -e "$violation_details"
    echo -e "  ${RED}Rule: Role modules must NEVER import from another role module.${NC}"
    echo -e "  ${RED}Fix:  Use shared layer imports only (§2.5).${NC}"
    record_fail "Cross-Module Import Scan — ${violations_found} violation(s)"
  fi
}

# ─── STEP 2: Shared Layer Modification Audit ─────────────────────────────────

step_shared_layer_audit() {
  print_step "2" "Shared Layer Modification Audit (§2.4 Access Control)"

  local shared_changes_found=0
  local change_details=""

  cd "$PROJECT_ROOT"

  # Check staged files first (pre-commit scenario)
  local staged_shared
  staged_shared=$(git diff --cached --name-only 2>/dev/null | \
    grep -E "^(${SHARED_BACKEND}|${SHARED_FRONTEND})" || true)

  if [ -n "$staged_shared" ]; then
    shared_changes_found=1
    change_details+="  ${YELLOW}Staged files modifying shared layer:${NC}\n"
    while IFS= read -r file; do
      change_details+="    ⚠ ${file}\n"
    done <<< "$staged_shared"
    change_details+="\n"
  fi

  # Check recent commits on current branch (last 10 commits, excluding merges)
  local recent_shared
  recent_shared=$(git log --oneline --name-only --no-merges -n 10 2>/dev/null | \
    grep -E "^(${SHARED_BACKEND}|${SHARED_FRONTEND})" || true)

  if [ -n "$recent_shared" ]; then
    shared_changes_found=1
    change_details+="  ${YELLOW}Recent commits touching shared layer (last 10 commits):${NC}\n"
    while IFS= read -r file; do
      change_details+="    ⚠ ${file}\n"
    done <<< "$recent_shared"
    change_details+="\n"
  fi

  # Check unstaged (working directory) changes
  local unstaged_shared
  unstaged_shared=$(git diff --name-only 2>/dev/null | \
    grep -E "^(${SHARED_BACKEND}|${SHARED_FRONTEND})" || true)

  if [ -n "$unstaged_shared" ]; then
    shared_changes_found=1
    change_details+="  ${YELLOW}Unstaged working directory changes in shared layer:${NC}\n"
    while IFS= read -r file; do
      change_details+="    ⚠ ${file}\n"
    done <<< "$unstaged_shared"
  fi

  if [ "$shared_changes_found" -eq 0 ]; then
    echo -e "  ${GREEN}✔${NC} No unauthorized shared layer modifications detected."
    echo -e "  Checked: staged files, unstaged changes, last 10 commits."
    record_pass "Shared Layer Modification Audit"
  else
    echo -e "  ${YELLOW}⚠ Shared layer modifications detected — requires Project Leader approval.${NC}"
    echo ""
    echo -e "$change_details"
    echo -e "  ${YELLOW}Rule: Modifying ${SHARED_BACKEND} or ${SHARED_FRONTEND}${NC}"
    echo -e "  ${YELLOW}      requires explicit Project Leader written approval (§2.4).${NC}"
    record_warn "Shared Layer Audit — modifications detected (needs approval)"
  fi
}

# ─── STEP 3: Pre-Commit Quality Gates ────────────────────────────────────────

step_quality_gates() {
  print_step "3" "Pre-Commit Quality Gates (§1.4 Mandatory Checks)"

  local gate_failures=0

  cd "$PROJECT_ROOT"

  # ── 3a: Backend Lint ──
  echo -e "  ${CYAN}[3a]${NC} Running backend lint (npm run lint)..."
  if npm run lint --silent 2>&1; then
    echo -e "  ${GREEN}✔${NC} Backend lint: PASSED"
  else
    echo -e "  ${RED}✖${NC} Backend lint: FAILED"
    gate_failures=$((gate_failures + 1))
  fi
  # ── 3c: Backend Build ──
  echo -e "  ${CYAN}[3c]${NC} Running backend build (npm run build)..."
  if npm run build --silent 2>&1; then
    echo -e "  ${GREEN}✔${NC} Backend build: PASSED"
  else
    echo -e "  ${RED}✖${NC} Backend build: FAILED"
    gate_failures=$((gate_failures + 1))
  fi
  echo ""

  # ── 3d: Backend Tests ──
  echo -e "  ${CYAN}[3d]${NC} Running backend tests (npm run test)..."
  if npm run test --silent 2>&1; then
    echo -e "  ${GREEN}✔${NC} Backend tests: PASSED"
  else
    echo -e "  ${RED}✖${NC} Backend tests: FAILED"
    gate_failures=$((gate_failures + 1))
  fi
  echo ""

  # ── 3e: Frontend Lint ──
  echo -e "  ${CYAN}[3e]${NC} Running frontend lint (npm run lint --prefix frontend)..."
  if npm run lint --prefix frontend --silent 2>&1; then
    echo -e "  ${GREEN}✔${NC} Frontend lint: PASSED"
  else
    echo -e "  ${RED}✖${NC} Frontend lint: FAILED"
    gate_failures=$((gate_failures + 1))
  fi
  echo ""

  # ── 3f: Frontend Build ──
  echo -e "  ${CYAN}[3f]${NC} Running frontend build (npm run build --prefix frontend)..."
  if npm run build --prefix frontend --silent 2>&1; then
    echo -e "  ${GREEN}✔${NC} Frontend build: PASSED"
  else
    echo -e "  ${RED}✖${NC} Frontend build: FAILED"
    gate_failures=$((gate_failures + 1))
  fi
  echo ""

  if [ "$gate_failures" -eq 0 ]; then
    record_pass "Pre-Commit Quality Gates (all 5 sub-checks)"
  else
    record_fail "Pre-Commit Quality Gates — ${gate_failures} sub-check(s) failed"
  fi
}

# ─── STEP 4: Inline Component Duplication Scanner ────────────────────────────

step_inline_component_scan() {
  print_step "4" "Inline Component Duplication Scanner (UI Consistency)"

  local duplicates_found=0
  local duplicate_details=""

  cd "$PROJECT_ROOT"

  # Components that MUST be imported from shared — never re-implemented locally
  # Format: "grep_pattern|component_name|shared_import_path"
  local SHARED_COMPONENTS=(
    "const StatusBadge|StatusBadge|components/shared/StatusBadge"
    "function StatusBadge|StatusBadge|components/shared/StatusBadge"
    "function.*DataTable|DataTable|components/shared/DataTable"
    "const.*DataTable|DataTable|components/shared/DataTable"
    "function.*KpiCard|KpiCard|components/shared/KpiCard"
    "const.*KpiCard|KpiCard|components/shared/KpiCard"
    "function.*PageHeader|PageHeader|components/shared/PageHeader"
    "const.*PageHeader|PageHeader|components/shared/PageHeader"
    "function.*EmptyState|EmptyState|components/shared/EmptyState"
    "function.*SearchFilterBar|SearchFilterBar|components/shared/SearchFilterBar"
    "function.*RefreshButton|RefreshButton|components/shared/RefreshButton"
    "function.*ConfirmDialog|ConfirmDialog|components/shared/ConfirmDialog"
  )

  for entry in "${SHARED_COMPONENTS[@]}"; do
    IFS='|' read -r pattern component_name import_path <<< "$entry"

    local hits
    hits=$(grep -rn --include="*.tsx" --include="*.ts" \
      -E "(export )?(${pattern})" \
      "frontend/src/pages/" 2>/dev/null || true)

    if [ -n "$hits" ]; then
      duplicates_found=$((duplicates_found + 1))
      duplicate_details+="  ${RED}✖${NC} Duplicate '${component_name}' found (must use shared):${NC}\n"
      while IFS= read -r line; do
        duplicate_details+="    ${line}\n"
      done <<< "$hits"
      duplicate_details+="    ${YELLOW}Fix: import { ${component_name} } from '../../${import_path}';${NC}\n\n"
    fi
  done

  if [ "$duplicates_found" -eq 0 ]; then
    echo -e "  ${GREEN}✔${NC} No inline component duplicates detected."
    echo -e "  All pages use shared components from frontend/src/components/shared/."
    record_pass "Inline Component Duplication Scanner"
  else
    echo -e "  ${RED}✖ Found ${duplicates_found} inline component duplicate(s):${NC}"
    echo ""
    echo -e "$duplicate_details"
    echo -e "  ${RED}Rule: Shared components must be imported, not re-implemented locally.${NC}"
    echo -e "  ${RED}Fix:  Delete local copies and import from frontend/src/components/shared/.${NC}"
    record_fail "Inline Component Scanner — ${duplicates_found} duplicate(s)"
  fi
}

# ─── STEP 5: Consolidated Report ─────────────────────────────────────────────

print_report() {
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  VERIFICATION REPORT${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  ${BOLD}Step    │ Result${NC}"
  echo -e "  ────────┼──────────────────────────────────────────────────"

  for result in "${STEP_RESULTS[@]}"; do
    echo -e "  ${result}"
  done

  echo ""
  echo -e "  ────────┼──────────────────────────────────────────────────"
  echo -e "  ${BOLD}Summary${NC} │ ${GREEN}${PASSED} passed${NC}, ${RED}${FAILED} failed${NC}, ${YELLOW}${WARNED} warnings${NC}"
  echo ""

  if [ "$FAILED" -gt 0 ]; then
    echo -e "  ${RED}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "  ${RED}${BOLD}║  ✖  VERIFICATION FAILED — DO NOT COMMIT/MERGE   ║${NC}"
    echo -e "  ${RED}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Fix all failures above before committing."
    echo -e "  Reference: docs/core_ja/02_開発ルール_DEVELOPMENT_RULES.md"
  elif [ "$WARNED" -gt 0 ]; then
    echo -e "  ${YELLOW}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "  ${YELLOW}${BOLD}║  ⚠  VERIFICATION PASSED WITH WARNINGS           ║${NC}"
    echo -e "  ${YELLOW}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  Review warnings above. Shared layer changes need approval."
  else
    echo -e "  ${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
    echo -e "  ${GREEN}${BOLD}║  ✔  ALL CHECKS PASSED — SAFE TO COMMIT          ║${NC}"
    echo -e "  ${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
  fi

  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# ─── Main Execution ──────────────────────────────────────────────────────────

main() {
  print_header

  step_cross_module_imports
  step_shared_layer_audit
  step_quality_gates
  step_inline_component_scan

  print_report

  # Exit with failure code if any step failed
  if [ "$FAILED" -gt 0 ]; then
    exit 1
  fi

  exit 0
}

main "$@"
