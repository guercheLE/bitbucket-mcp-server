# Bitbucket MCP Server: Development Plan

This document outlines the comprehensive development plan for the Bitbucket MCP Server, from initial setup to a full-featured, enterprise-ready product. The plan is divided into phases, each with specific specifications (specs) detailing its functional (FRs) and non-functional requirements (NFRs), in strict accordance with the project constitution.

## Phase 0: Foundation & Design (Pre-Code)

This phase is about establishing the project's governance, structure, and design principles before any feature code is written.

### Spec 0.1: Governance & Project Setup

- **FRs:**
  - Initialize the Git repository with a `main` branch and configure branch protection rules.
  - Create the complete directory structure as defined in the constitution (`src`, `tests`, `docs`, etc.).
  - Create the `LICENSE` file with the LGPL-3.0 license text.
  - Create a `CHANGELOG.md` file to track changes.
  - Set up the CI/CD pipeline skeleton (e.g., GitHub Actions) with stages for linting, testing, and code coverage reporting. The pipeline should be configured to fail if test coverage is below 80%.
- **NFRs:**
  - **Documentation:** Create the initial `README.md` and an architecture document in `/docs` that outlines the 3-tool semantic discovery pattern.
  - **Compliance:** Configure ESLint and Prettier to enforce code style standards. Configure commit linting to enforce semantic commit messages.

### Spec 0.2: Core Component Design & Test Definition

- **FRs:**
  - Write a detailed design document for the 3-tool semantic discovery pattern (`search-ids`, `get-id`, `call-id`).
  - Write the test specifications for all MVP features. This involves creating the Jest test files with `describe` and `it` blocks for:
    1.  Server startup and transport connectivity.
    2.  Bitbucket server detection and authentication.
    3.  The three core tools (`search-ids`, `get-id`, `call-id`).
- **NFRs:**
  - **Approval:** These test specifications **must be reviewed and approved by the Project Lead** before any implementation code is written, fulfilling the "Tests written → Project Lead approved" mandate.

---

## Phase 1: MVP Implementation (Core Functionality)

This phase focuses on building the core functionality to validate the architectural pattern. The goal is a working product that can connect, search for an operation, and execute it.

### Spec 1.1: Server & Connectivity

- **FRs:**
  - Implement the basic MCP server that can start and stop.
  - Implement `stdio` and `HTTP` transport protocols.
  - Implement the Bitbucket connectivity service using Axios.
  - Implement server type/version detection with fallback logic.
- **NFRs:**
  - **TDD:** Write implementation code to make the pre-approved tests for server startup and connectivity pass (Red-Green-Refactor).
  - **Security:** Load credentials from environment variables and ensure logs are sanitized.
  - **Test Coverage:** Achieve >80% line coverage for all code written in this spec.

### Spec 1.2: Vector DB & Embedding Pipeline

- **FRs:**
  - Implement a script to generate embeddings from a small, representative subset of Bitbucket API documentation (5-10 endpoints).
  - Integrate the embedded vector database (`sqlite-vec`).
  - Package the pre-computed vector database file with the application distributable.
- **NFRs:**
  - **TDD:** Write and pass tests for the embedding generation and database loading process.
  - **Portability:** Ensure the database works out-of-the-box with no external dependencies.

### Spec 1.3: The 3-Tool Implementation

- **FRs:**
  - Implement the `search-ids` tool to query the vector database.
  - Implement the `get-id` tool to retrieve Zod schemas.
  - Implement the `call-id` tool to dynamically validate parameters and execute a Bitbucket API call.
- **NFRs:**
  - **TDD:** Strictly follow the Red-Green-Refactor cycle for each tool, ensuring all pre-approved contract, unit, and integration tests pass.
  - **Performance:** Validate that `search-ids` responds in <100ms and `call-id` validation overhead is <10ms.
  - **Code Review:** All code must be peer-reviewed before merging.

---

## Phase 2: Full Product Feature Expansion

This phase scales the proven MVP pattern to cover the entire Bitbucket API surface and adds enterprise-grade features.

### Spec 2.1: Complete API Operation Implementation

- **FRs:**
  - Iteratively implement support for all 200+ Bitbucket API endpoints. For each endpoint:
    1.  Write the contract test against the official Bitbucket API.
    2.  Get test approval from the Project Lead.
    3.  Implement the internal operation logic in `src/tools/operations/`.
    4.  Ensure the implementation makes the test pass.
  - Generate and package embeddings for all supported endpoints.
- **NFRs:**
  - **Process:** This large-scale effort must strictly follow the TDD and approval workflow for every single endpoint.
  - **Pagination:** Ensure all list-based operations correctly implement and expose pagination.

### Spec 2.2: Enterprise Readiness

- **FRs:**
  - Implement all remaining authentication methods (OAuth 2.0) and the priority-based fallback logic.
  - Implement all remaining transport protocols (SSE, HTTP streaming).
  - Implement multi-language support using `i18next`.
- **NFRs:**
  - **Security:** Implement and test security hardening features: Helmet, CORS, rate limiting, and circuit breakers.
  - **Observability:** Configure advanced logging (e.g., rotation, shipping) and expose Prometheus metrics for key performance indicators.
  - **Performance:** Conduct load testing to ensure all SLA metrics defined in the constitution are met.

---

## Phase 3: Sustaining & Evolution

This is the ongoing phase for maintaining, improving, and supporting the full product.

### Spec 3.1: Maintenance & Updates

- **FRs:**
  - Develop a process for re-generating embeddings and updating internal operations when new Bitbucket API versions are released.
  - Perform regular updates of all third-party dependencies.
- **NFRs:**
  - **Security:** Continuously monitor for security vulnerabilities in dependencies using tools like `npm audit`.
  - **Reliability:** Monitor production metrics to maintain >99.9% uptime.

### Spec 3.2: Console Client & User Experience

- **FRs:**
  - Implement the built-in console client using `commander.js`.
  - Implement selective command registration in the client based on the connected server's detected capabilities.
- **NFRs:**
  - **Documentation:** Create comprehensive user documentation in `/docs` with practical examples for common administrative and development tasks using the semantic discovery workflow.
