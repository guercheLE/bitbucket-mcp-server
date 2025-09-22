---
description: Orchestrates the complete, state-aware development lifecycle from specification through implementation, driven by an LLM agent.
---

# Project Development Orchestrator

This prompt invokes the orchestration script, which manages the entire development workflow. The script is designed to be called repeatedly by an LLM agent to drive the project forward in a controlled, stateful manner.

## Overview

The orchestration script is a command-driven tool that manages the project's state, stored in `execution-plan.json`. The agent's primary role is to call the script's commands in a loop to transition features from specification to implementation.

## Agent-Driven Workflow

The agent's main loop consists of calling `get-next-action` to determine the next step, and then executing the appropriate command or coding task.

### Implementation Loop Example

When `get-next-action` directs the agent to implement a feature, the agent will:
1.  Call `pre-implement-check` to ensure dependencies are met and the branch is rebased.
2.  Repeatedly call `get-task` to fetch the next coding task.
3.  After coding, call `complete-task` to commit the result.
4.  Once all tasks are done, call `finalize-implementation` to merge the feature into `main`.

---

## Orchestrator Commands

The agent uses the following commands to manage the lifecycle.

-   **`init <description>`**: Initializes the project and creates the `execution-plan.json`.
-   **`get-next-action`**: Determines and returns the next logical action (e.g., `specify`, `implement`). This is the main entry point for the agent's loop.
-   **`pre-implement-check <feature-id>`**: A critical safety check that verifies dependencies and rebases the feature branch onto its dependency branches. It will stop if it detects missing dependencies or a merge conflict.
-   **`get-task <feature-id>`**: Retrieves the next incomplete task from a feature's `tasks.md`.
-   **`complete-task <feature-id> <task-number>`**: Marks a task as complete and creates a granular commit on the feature branch.
-   **`finalize-implementation <feature-id>`**: Merges the completed feature branch into `main`.

---

## Key Strategies

-   **Stateful Automation**: The entire process is managed via the state recorded in `execution-plan.json`.
-   **Agent Control**: The agent, not a single script, drives the process, allowing for interactive steps like coding and debugging.
-   **Safe Rebasing**: The script rebases feature branches directly onto their dependencies to ensure the most up-to-date code is used. It includes a manual stop for conflict resolution.
-   **Granular Commits**: Each task is committed individually, providing a clean and auditable project history.
-   **Durable Branches**: Feature branches are not deleted after merging, preserving them for dependency management and history.