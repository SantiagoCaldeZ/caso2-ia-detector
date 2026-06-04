# IA Detector

## Caso #2 — Crisis de la Verdad

IA Detector is a software product prototype designed for the Software Design course. The project focuses on the problem of misinformation, AI-generated content, and the difficulty journalists face when verifying suspicious information before publishing.

---

## Team Members

- Fabricio Monge Brenes
- Santiago Calderón Zúñiga
- Christopher Jiménez Gutiérrez
- José Gabriel Marín Aguilar

---

## Problem Statement

**Reduce the time to confirm truthfully information.**

---

## Product Definition

IA Detector helps journalists and editorial teams reduce the time required to verify suspicious digital content.

The system allows a user to submit suspicious text, URL, image, or screenshot. IA Detector extracts the main claim, searches evidence or previous fact-checking results, calculates evidence and risk scores, and classifies the case as:

- `PASS`
- `NO_PASS`
- `HUMAN_REVIEW`

IA Detector does not publish content automatically and does not present results as absolute `TRUE` or `FALSE`. The system supports editorial verification by showing evidence, risk signals, scores, and case status.

---

## Current MVP Scope

The MVP focuses on the main verification flow:

1. A journalist receives suspicious content.
2. The journalist submits text, URL, image, or screenshot into IA Detector.
3. The system extracts the main claim.
4. The system searches evidence or previous fact-checking results.
5. The system calculates `evidenceScore`, `riskScore`, and `sourceAgreement`.
6. The system classifies the case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
7. The journalist reviews the result, evidence, and risk signals.
8. The case is stored in history with a basic audit log.

Full MVP scope is documented here:

- [MVP Scope](./docs/product/mvp-scope.md)

---

## Repository Structure

```text
caso2-ia-detector/
├── README.md
├── docs/
│   ├── product/
│   │   ├── problem-statement.md
│   │   ├── mvp-scope.md
│   │   └── goal-map.md
│   │
│   ├── ux/
│   │   ├── prototype.md
│   │   ├── ux-testing-plan.md
│   │   └── ux-testing-results.md
│   │
│   ├── frontend/
│   │   └── frontend-design.md
│   │
│   ├── architecture/
│   │   ├── system-integrations.md
│   │   ├── architectural-patterns.md
│   │   └── agentic-patterns.md
│   │
│   ├── pitch/
│   │   └── demo-script.md
│   ├── diagrams/
│   │   └── goal-map.png
│   │
│
├── src/
│   ├── frontend/
│   └── backend/
│
├── database/
│   ├── dbml/
│   ├── migrations/
│   └── seed/
│
└── agents/
```

---

## Product Documentation

- [Problem Statement](./docs/product/problem-statement.md)
- [MVP Scope](./docs/product/mvp-scope.md)
- [Goal Map](./docs/product/goal-map.md)

---

## UX Documentation

- [UX Prototype](./docs/ux/prototype.md)
- [UX Testing Plan](./docs/ux/ux-testing-plan.md)
- [UX Testing Results](./docs/ux/ux-testing-results.md)

The UX prototype will be created in **Figma** and tested using **Maze** with at least 4 design students who are not members of the IA Detector team.

---

## Frontend Design

- [Frontend Design Document](./docs/frontend/frontend-design.md)

The frontend design document defines:

- technology stack,
- authentication and authorization,
- UX/UI structure,
- component strategy,
- layered design,
- frontend design patterns,
- verification states,
- API contracts,
- testing strategy,
- observability events.

---

## Architecture Documentation

- [System Integrations](./docs/architecture/system-integrations.md)
- [Architectural Patterns](./docs/architecture/architectural-patterns.md)
- [Agentic Patterns](./docs/architecture/agentic-patterns.md)

Current architecture decisions include:

- Google Fact Check Tools API as an evidence source.
- AI provider access through an architectural pattern to avoid direct coupling.
- Agentic decision flow using `PASS`, `NO_PASS`, and `HUMAN_REVIEW`.

---

## Backend and Data Design

- [Backend Design Document](./docs/backend/backend-design.md)

Data design will be documented separately.

This section will later include:

- backend technology stack,
- backend layers,
- business workflows,
- API endpoints,
- DTOs,
- validation rules,
- database design,
- DBML,
- migrations,
- seed data,
- security,
- observability,
- testing strategy.

---

## MVP Local Execution

Pending.

This section will later include:

- frontend execution steps,
- backend execution steps,
- database setup,
- environment variables,
- seed data,
- local demo flow.

---

## AI Development Agents

Pending.

This section will later document the specialized agents required for MVP construction:

- SOLID reviewer agent,
- architecture validation agent,
- frontend agent,
- backend agent,
- database agent,
- testing agent.

Each agent usage must document:

- findings,
- suggested corrections,
- corrections applied.

---

## Sales Pitch and Demo

- [Demo Script](./docs/pitch/demo-script.md)

The final demo will be executed locally and must show the main MVP flow without using slides.

---

## Development Documentation Rules

All design documents must be written for a real development team.

Each document must define:

- concrete decisions,
- `/src` locations,
- responsibilities,
- inputs and outputs,
- states,
- business rules,
- exceptions,
- DTOs or contracts when applicable,
- developer restrictions,
- acceptance criteria when applicable.

Avoid generic descriptions such as “use best practices”, “handle errors”, or “make it scalable” unless the document explains exactly how the development team must implement it.

---

## Current Status

| Area | Status |
|---|---|
| Repository structure | Created |
| Problem statement | Created |
| MVP scope | In progress |
| UX testing plan | In progress |
| Frontend design | Created |
| System integrations | Created |
| Architectural patterns | Created |
| Agentic patterns | Pending refinement |
| Backend design | Created |
| Data design | Pending |
| MVP implementation | Pending |
| Sales pitch | Pending |