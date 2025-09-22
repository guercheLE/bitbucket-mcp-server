# Project Development Orchestrator

This document describes the orchestration workflow for transitioning a project from concept to a fully implemented feature. The process is managed by a command-driven script that acts as a state machine for the entire development lifecycle.

This workflow is designed to be executed by an LLM agent, which calls the orchestrator script commands to drive the project forward.

---

## Core Concepts

- **Command-Driven**: Instead of a single script that runs from start to finish, the workflow is managed by a series of commands (`init`, `get-next-action`, `get-task`, etc.). This allows for an interactive process where coding and other actions can be performed at the appropriate step.
- **State-Awareness**: The `execution-plan.json` file is the single source of truth. The orchestrator script reads this file to determine the current state of the project and what to do next.
- **Agent-Driven Workflow**: The LLM agent is responsible for running the workflow by calling the orchestrator commands in a logical loop.

---

## The Agent Workflow Loop

The agent automates the entire lifecycle by repeatedly calling the orchestrator script.

### Main Loop

1.  The agent calls `get-next-action` to determine what to do.
2.  The script responds with a required action, such as `specify`, `plan`, `tasks`, or `implement`.
3.  The agent executes the required action (e.g., by calling the `/specify` command or by starting the implementation loop).
4.  The agent repeats this process until `get-next-action` reports the project is complete.

### Implementation Sub-Loop

When `get-next-action` returns `{"action": "implement", "feature_id": "..."}`, the agent performs the following loop:

1.  **Run Pre-flight Checks**: The agent calls `pre-implement-check <feature-id>`. This crucial step verifies that all dependencies are implemented and rebases the feature branch onto its dependencies. It will stop if dependencies are not met or if a Git conflict occurs.
2.  **Get Next Task**: The agent calls `get-task <feature-id>` to get the description of the next task.
3.  **Code the Task**: The agent writes the code and modifies files to complete the task.
4.  **Complete the Task**: The agent calls `complete-task <feature-id> <task-number>` to mark the task as done and commit the changes with a descriptive message.
5.  **Repeat**: The agent repeats steps 2-4 until `get-task` reports that all tasks are complete.
6.  **Finalize**: The agent calls `finalize-implementation <feature-id>` to merge the completed feature into `main`.

---

## Orchestrator Commands

The workflow is managed by the `orchestrate.sh` (Bash) and `orchestrate.ps1` (PowerShell) scripts.

-   **`init <description>`**
    Initializes the project by creating the `execution-plan.json` file.

-   **`get-next-action`**
    Inspects the `execution-plan.json` and returns a JSON object describing the next logical action (e.g., `specify`, `implement`). This is the primary command for driving the workflow.

-   **`pre-implement-check <feature-id>`**
    Performs safety checks before implementation begins. It verifies all dependencies are implemented and rebases the feature branch onto its dependency branches. It will exit with an error if dependencies are not met or if a rebase conflict occurs, which must be resolved manually.

-   **`get-task <feature-id>`**
    Reads the `tasks.md` file for the specified feature and returns a JSON object with the number and description of the next incomplete task.

-   **`complete-task <feature-id> <task-number>`**
    Marks a task as `[DONE]` in the `tasks.md` file and commits the change to the feature branch. The commit message is automatically generated in the format: `feat(<feature-id>): Complete task <task-number> - <brief description>`.

-   **`finalize-implementation <feature-id>`**
    Merges the fully implemented feature branch into `main` using a no-fast-forward merge and updates the feature's status to `"implemented"` in `execution-plan.json`. **It does not delete the feature branch.**

---

## Branching and Git Strategy

-   **Rebasing**: To ensure features are built on the most up-to-date version of their dependencies, the `pre-implement-check` command rebases the feature branch directly onto its dependency branches.
-   **Committing**: Each task is committed individually via the `complete-task` command, creating a clean and granular history of the implementation.
-   **Merging**: Completed features are merged into `main` via the `finalize-implementation` command. Feature branches are intentionally kept after the merge.
-   **Git Stability**: To prevent a known Git bug, `git status` is executed after every `checkout` and `commit` operation within the scripts.
