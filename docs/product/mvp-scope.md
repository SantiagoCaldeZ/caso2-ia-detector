# MVP Scope — IA Detector

## Main MVP Goal

Build a local functional MVP that helps journalists reduce the time required to verify suspicious digital content by submitting content, extracting the main claim, searching evidence, calculating risk and evidence scores, and classifying the case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.

---

## Core Features

- Submit suspicious text.
- Submit suspicious URL.
- Submit suspicious image or screenshot.
- Extract the main claim from submitted content.
- Extract text from image using OCR mock or local stub for MVP.
- Search evidence or previous fact-check results.
- Calculate `evidenceScore` and `riskScore`.
- Calculate source agreement as `HIGH`, `MEDIUM`, or `LOW`.
- Classify the case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
- Show extracted claim, evidence, risk signals, scores, and case status.

---

## Supporting Features

- Basic verification history.
- Basic audit log.
- Error messages when AI, OCR mock, or evidence sources fail.
- Ability to re-run a verification after editing the extracted claim.

---

## Out of Scope

- Real video analysis.
- Real deepfake detection.
- Advanced image forensic analysis.
- Automatic publishing.
- Full newsroom collaboration.
- Browser extension.
- Mobile app.
- Real-time multi-user editorial workflow.

---

## User Journeys in Scope

### Journey 1 — Verify suspicious text

1. Journalist opens IA Detector.
2. Journalist selects text input.
3. Journalist pastes suspicious content.
4. System extracts the main claim.
5. System searches evidence and calculates scores.
6. System classifies the case as `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
7. Journalist reviews evidence and risk signals.

### Journey 2 — Verify suspicious URL

1. Journalist selects URL input.
2. Journalist enters a suspicious link.
3. System extracts readable content or uses a mock extraction response.
4. System identifies the main claim.
5. System searches evidence and returns classification.
6. Journalist opens evidence sources from the result panel.

### Journey 3 — Verify suspicious image or screenshot

1. Journalist selects image input.
2. Journalist uploads a screenshot or image.
3. System shows image preview.
4. System extracts text using OCR mock or local stub.
5. System analyzes the extracted text.
6. System returns classification and risk signals.

### Journey 4 — Review previous verification

1. Journalist opens verification history.
2. Journalist selects a previous case.
3. System shows previous claim, evidence, scores, risk signals, and classification.

---

## MVP Decision States

| State | Meaning |
|---|---|
| `PASS` | The case can move forward to editorial review based on available evidence. |
| `NO_PASS` | The case should not move forward with the available evidence. |
| `HUMAN_REVIEW` | The case is ambiguous and requires human review. |

---

## MVP Success Criteria

- A user can complete the main verification flow locally.
- The system can process text, URL, and image/screenshot inputs.
- The system displays claim, evidence, scores, risk signals, and classification.
- The system does not present results as absolute `TRUE` or `FALSE`.
- The system keeps the MVP aligned with the frontend and backend design documentation.