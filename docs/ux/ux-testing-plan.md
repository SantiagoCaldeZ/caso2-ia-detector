# UX Testing Plan — IA Detector

## Purpose

Validate whether users can understand and complete the main IA Detector verification flow using the prototype.

The test focuses on the MVP flow:
1. Submit suspicious content.
2. Understand the processing steps.
3. Interpret `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
4. Review evidence and risk signals.
5. Find a previous verification case.

---

## Prototype Tool

**Figma**

The Figma prototype will simulate:

- Dashboard / Verification Hub.
- Text submission.
- URL submission.
- Image or screenshot upload.
- Processing state.
- Results page.
- Verification history.

---

## UX Testing Tool

**Maze**

Maze will be used to run the test with participants and collect:

- Task completion.
- Time on task.
- Misclicks or hesitation points.
- Participant comments.
- Usability issues.

---

## Participants

The test will be conducted with at least **4 design students** who are not members of the IA Detector team.

| Participant | Profile | Team Member? |
|---|---|---|
| P1 | Design student | No |
| P2 | Design student | No |
| P3 | Design student | No |
| P4 | Design student | No |

---

## Test Tasks

| Task | Description | Expected Result |
|---|---|---|
| Task 1 | Submit suspicious text and start verification. | User reaches the processing screen and result page. |
| Task 2 | Interpret whether the result is `PASS`, `NO_PASS`, or `HUMAN_REVIEW`. | User correctly explains what the classification means. |
| Task 3 | Open at least one evidence source. | User finds and opens evidence from the result panel. |
| Task 4 | Upload an image or screenshot. | User understands the upload area and sees preview/processing state. |
| Task 5 | Find a previous verification case in history. | User locates and opens a previous case. |

---

## Metrics

| Metric | Description |
|---|---|
| Task completion rate | Whether the participant completed the task successfully. |
| Time on task | How long the participant took to complete each task. |
| Error rate | Number of wrong clicks, abandoned tasks, or misunderstood actions. |
| Hesitation points | Moments where the participant paused or seemed unsure. |
| Participant comments | Relevant comments made during or after the test. |

---

## UX Testing Results Template

| Participant | Task | Completed | Time | Issue Detected | Severity | Comment | Correction Applied |
|---|---|---|---|---|---|---|---|
| P1 | Submit suspicious text | Pending | Pending | Pending | Pending | Pending | Pending |
| P2 | Interpret classification | Pending | Pending | Pending | Pending | Pending | Pending |
| P3 | Upload image/screenshot | Pending | Pending | Pending | Pending | Pending | Pending |
| P4 | Find history case | Pending | Pending | Pending | Pending | Pending | Pending |

---

## Severity Criteria

| Severity | Meaning |
|---|---|
| High | The issue prevents the user from completing the task. |
| Medium | The user completes the task but with confusion or unnecessary effort. |
| Low | Minor visual, wording, or layout issue. |

---

## Planned Corrections After Testing

After the test, the team will review the results and update the prototype if users have problems with:

- Understanding `PASS`, `NO_PASS`, or `HUMAN_REVIEW`.
- Finding evidence sources.
- Understanding risk signals.
- Uploading images or screenshots.
- Navigating to verification history.

All corrections must be documented in `docs/ux/ux-testing-results.md`.