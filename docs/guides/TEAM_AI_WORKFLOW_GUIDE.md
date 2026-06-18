# 🤖 Team AI-Assisted Development Workflow Guide

This guide is designed for a 5-person development team using AI agents. It addresses the core risks of AI-assisted collaborative coding: **merge conflicts in shared files**, **inconsistent coding standards**, and **unpredictable AI behavior**.

---

## 1. The "Rule of Law" (`AGENTS.md` & `DEVELOPMENT_RULES.md`)

AI agents are powerful but can be inconsistent. To force all AIs to write the same standard of code across all 5 developers:

*   **Global Rule Enforcement:** We will utilize the `AGENTS.md` file in the root directory. Any AI prompt will automatically inherit these rules.
*   **Prompt Template for Developers:** When starting a new task, always use this prompt structure:
    > "I am working on the `[Role name]` module. Before writing any code, strictly review `02_開発ルール_DEVELOPMENT_RULES.md` for our coding standards. Your generated code must exactly match these standards. Do not guess the architecture."

## 2. Managing Shared/Common Files (Conflict Prevention)

The biggest risk is multiple AIs modifying `src/modules/shared/` or `frontend/src/components/shared/` simultaneously.

*   **The "No-Touch" AI Prompt:** Add this explicit instruction to your AI when working on your specific feature:
    > "CRITICAL: You are only allowed to modify files inside `src/modules/[Your_Module]` or `frontend/src/pages/[Your_Module]`. If you believe a change is needed in a shared component or type, STOP and ask me first."
*   **Shared Component Protocol:** If a common file *must* be updated:
    1. Do not let the AI randomly change it.
    2. Communicate with the team (e.g., in Slack/Discord).
    3. One person updates the shared file, pushes to `main`, and everyone pulls the latest changes before their AI continues.
*   **Wrapper Technique:** Instead of modifying a shared UI component (which might break other screens), ask the AI to create a *local wrapper* component inside your module for your specific edge case.

## 3. Strict Module Isolation (The Architecture Advantage)

Our NestJS and React project is already heavily modularized (`applicant`, `manager`, `approver`, `accounting`, `admin`).
*   **Assign One Developer per Module:** 
    *   Dev 1: Applicant UI + Applicant API
    *   Dev 2: Manager UI + Manager API
    *   Dev 3: Approver UI + Approver API
    *   Dev 4: Accounting UI + Accounting API
    *   Dev 5: Admin UI + Admin API
*   By strictly sticking to your assigned module folders, the risk of Git Merge Conflicts drops by 90%.

## 4. Frequent Checkpoints (Git)

AI can sometimes hallucinate or break working code.
*   **Micro-Commits:** Ask your AI to commit changes immediately after a successful feature addition. 
*   **Use the Built-in Git Agent:** You can simply tell the AI: `"commit"`. The `AGENTS.md` we have will automatically format the commit message perfectly and push it. This acts as a save state.

## 5. Standardized AI Workflow Steps for Each Screen

When a developer starts a new screen, they should follow these exact steps with their AI:

1.  **Context Loading:** 
    *   *Prompt:* "Read `docs/detailed_design/01_[Your_Role]/...` and understand the requirements for this screen."
2.  **API Contract First:**
    *   *Prompt:* "Generate the DTOs and Interfaces for this screen first. Let me review them." (Merge these types early).
3.  **Backend Logic:**
    *   *Prompt:* "Implement the NestJS Controller and Service for this module. Follow the Error Handling rules in `MASTER_AUDIT_REPORT.md`."
4.  **Frontend Implementation:**
    *   *Prompt:* "Build the React page using our Tailwind tokens. Use the existing components in `shared` but do not modify them."

---
*Following this SOP will ensure the AI acts as a disciplined junior developer rather than a rogue agent breaking common architecture.*
