# Plan: Conflict Logic & Resolution Strategy

> **Status**: DRAFT
> **Owner**: E-Document Team
> **Context**: Explaining the mechanics of merge conflicts in the new Version Control System.

## 1. Core Concept: Three-Way Merge

Conflicts are detected using a **Three-Way Merge** strategy. This relies on three specific versions of a page:

1.  **Base (The Ancestor)**: The state of the page *before* the branches diverged.
2.  **Target (The Destination)**: The current state of the branch you are merging *into* (e.g., `main`).
3.  **Source (The Incoming)**: The current state of the branch you are merging *from* (e.g., `branch-b`).

### The Formula
A conflict occurs specifically when:
-   **(Target ≠ Base)**: The destination has changed since the split.
-   **AND (Source ≠ Base)**: The incoming branch has *also* changed since the split.
-   **AND (Target ≠ Source)**: The changes are different.

---

## 2. Scenario Analysis: "Hello World"

Based on your example:

| Stage | Branch | Content | Status |
| :--- | :--- | :--- | :--- |
| **Start** | `main` | "Hello World" | **Base** for everyone. |
| **Step 1** | `branch-a` | "Hello **My** World" | Modified from Base. |
| **Step 2** | `branch-b` | "**Welcome** world" | Modified from Base. |

### The Merge Process

#### Phase 1: Merge `branch-a` into `main`
1.  **Base**: "Hello World"
2.  **Target (`main`)**: "Hello World" (Equal to Base -> **No Conflict**)
3.  **Source (`branch-a`)**: "Hello My World"
4.  **Result**: `main` updates to "Hello My World".

#### Phase 2: Merge `branch-b` into `main`
Now `main` has changed!

1.  **Base**: "Hello World" (This is still the common ancestor for `branch-b`).
2.  **Target (`main`)**: "Hello My World" (**Changed from Base** by Branch A).
3.  **Source (`branch-b`)**: "Welcome world" (**Changed from Base** by Branch B).
4.  **Result**: **CONFLICT DETECTED**.

**Why?** The system cannot decide which version is "correct". User intervention is required via the UI.

---

## 3. Advanced Scenarios

### Scenario A: Concurrent Edits (The Race)
> "Two people edit the same line at the same time and want to merge at the end."

1.  **User A (Branch A)**: Edits Line 1 -> Commits.
2.  **User B (Branch B)**: Edits Line 1 -> Commits.
3.  **Timeline**: Both started from the *same* Base.
4.  **Merge A**: Success. Main is updated.
5.  **Merge B**: **CONFLICT**.
    -   Even if they edited "at the same time", one always merges *first* (e.g., A).
    -   The second merger (B) will face the conflict because Main (now containing A's work) no longer matches B's ancestor.

### Scenario B: Sync First (The Fix)
> "User A merges into B first, then B modifies."

1.  **User A (Branch A)**: Edits Line 1 ("Hello A").
2.  **User B (Branch B)**: Instead of editing blindly, merges **A into B** first.
    -   Branch B now contains "Hello A".
    -   **Base Reference Updated**: The "ancestor" is effectively moved forward.
3.  **User B**: Now edits Line 1 ("Hello A + B").
4.  **Merge B into Main**: **SUCCESS** (No Conflict).
    -   **Why?** The system sees that B's changes *include* A's changes. It's a "Fast-Forward" or a clean history update, not a divergence.

### Scenario C: Strict Outdated Branch (User Request)
> "Reza edits 'welcome' -> 'tos' without knowing Main updated 'welcome' -> 'tes'. CONFLICT REQUIRED."

1.  **Start**: Main Line 1 = "welcome" (Commit 1).
2.  **Main**: Edits "welcome" -> "tes" (Commit 2).
3.  **Reza**: Still on Commit 1 ("welcome"). Edits "welcome" -> "tos".
4.  **Merge Reza -> Main**:
    -   **Base**: "welcome"
    -   **Target (Main)**: "tes" (Changed)
    -   **Source (Reza)**: "tos" (Changed)
    -   **Result**: **CONFLICT**.

    **Analysis**: This is actually the standard behavior of Three-Way Merge!
    -   Since **Target** changed from Base ("welcome" -> "tes").
    -   AND **Source** changed from Base ("welcome" -> "tos").
    -   AND "tes" != "tos".
    -   The system **will** flag this as a conflict.
    -   **Conclusion**: Your desired behavior is **already the default** in our planned logic.

---

## 4. Technical Implementation Plan

### Current Logic (Page-Level Blocking)
We currently detect if *any* part of the page content JSON has changed.

-   **Logic**: `app/Http/Controllers/Api/PullRequestController.php` -> `calculateBranchDiff`
-   **Conflict Flag**: `has_conflict = true` if `target != base` AND `source != base`.

### Proposed Enhancements (Post-MVP)

#### A. Granular Diffing (Line-Level)
Instead of blocking the whole page, we can try to merge non-overlapping changes.
-   **Tool**: `diff-match-patch` or similar library.
-   **Scenario**:
    -   Line 1 changed by A.
    -   Line 10 changed by B.
    -   **Result**: Auto-merge successful.

#### B. Delete/Modify Conflicts
-   **Scenario**: `branch-a` deletes Page X, `branch-b` edits Page X.
-   **Resolution**: Ask user: "Do you want to restore the page with B's edits, or keep it deleted?"

---

## 4. User Interface Workflow (Implemented)

1.  **Creation**: `CreatePullRequestPage` warns "This will have conflicts".
2.  **Review**: `PullRequestDetailPage` shows a warning banner.
3.  **Resolution**: `ConflictResolver` tab appears.
    -   Shows Source vs Target side-by-side.
    -   User selects "Use Source" or "Use Target".
    -   **Future**: Edit text area to manually combine "Hello **My** **Welcome** World".

## 5. Next Steps

1.  [x] **Backend**: Calculate `base` version using `CommitPage` history.
2.  [x] **Frontend**: Build Side-by-Side resolver.
3.  [ ] **Testing**: Create unit tests for the specific "Hello World" scenario described.
