# Functional Specification - Manager Dashboard

**Target Screen:** Manager Dashboard  
**Version:** 1.0  
**Date:** 2026-06-12  
**Status:** Approved  

---

## 1. Functional Overview
This screen is designed for users with the **Manager** role to review the list of payment requests where they are designated as the verifier. After carefully checking the contents of the requests, they can perform either the "Verify (確認完了)" or "Reject / Return (却下/差し戻し)" actions.

---

## 2. Usecases & Workflow

### 2.1 Key Usecases
1. **Display Pending Verification Queue:** Lists payment requests submitted to them that are currently in `Submitted to Manager` or `Manager Reviewing` status.
2. **Review Request Details & Attachments:** View request information, the breakdown table (1 to 15 lines), and view/download attached receipt files on-screen.
3. **Verification Processing (Verify OK):** If there are no issues with the request details, register verification completion. The status transitions to `MANAGER_VERIFIED`, and the request is sent back to the applicant.
4. **Rejection Processing (Return):** If there are defects in content or mismatches in amounts, input a mandatory rejection comment and return the request to the applicant. The status transitions to `REJECTED_MANAGER`.

### 2.2 Business Workflow (Manager Verification)
[Open Details Screen] ──► (Auto-transition: MANAGER_REVIEWING) │ (Verify Content) │ ┌───────────────────┴───────────────────┐ ▼ ▼ 【Verify OK Action】 【Reject Action】 │ │ (Return to Applicant) (Mandatory Rejection Comment) │ │ ▼ ▼ [Manager Verified (OK)] [Rejected by Manager]