# UX Prototype — IA Detector

## Purpose

This document defines the current UX prototype requirements for IA Detector.

The prototype must represent the main MVP flow: a journalist submits suspicious content, the system analyzes it, and the user receives a classification with evidence and risk signals.

The prototype is not the final UI implementation. It is used to validate the main user flow before frontend development.

---

## Prototype Tool

**Figma**

The Figma prototype will be used to design and simulate the IA Detector main flow.

## UX Testing Tool

**Maze**

Maze will be used to test the Figma prototype with users and collect task completion, time on task, hesitation points, comments, and usability issues.

---

## Prototype Link

Pending.

Add the Figma prototype link here when available:

[IA Detector Figma Prototype](#)

---

## Problem Statement

**Reduce the time to confirm truthfully information.**

---

## Main User

The main user of the prototype is a journalist or fact-checker who receives suspicious digital content and needs to verify it before using it in an editorial process.

---

## MVP Flow Represented in the Prototype

1. Journalist opens IA Detector.
2. Journalist selects the input type: text, URL, or image/screenshot.
3. Journalist submits suspicious content.
4. System shows a processing state.
5. System displays the extracted claim.
6. System displays evidence, risk signals, scores, and classification.
7. Journalist reviews the result.
8. Journalist saves the case or starts a new verification.
9. Journalist can access previous verifications from history.

---

## Screens Included

### Screen 1 — Dashboard / Verification Hub

**Purpose:**  
Allow the journalist to start a new verification or access recent cases.

**Required UI elements:**
- IA Detector logo or title.
- User menu or logout placeholder.
- Button: `New verification`.
- Three input option cards:
  - `Text`
  - `URL`
  - `Image / Screenshot`
- Recent verifications preview.
- Classification tags:
  - `PASS`
  - `NO_PASS`
  - `HUMAN_REVIEW`

**Expected user action:**  
The journalist selects the type of content to verify.

---

### Screen 2 — Text Verification

**Purpose:**  
Allow the journalist to paste suspicious text.

**Required UI elements:**
- Textarea for suspicious text.
- Helper text explaining what the user should paste.
- Button: `Extract claim & verify`.
- Basic validation message for empty input.

**Expected user action:**  
The journalist pastes suspicious text and starts verification.

---

### Screen 3 — URL Verification

**Purpose:**  
Allow the journalist to submit a suspicious URL.

**Required UI elements:**
- URL input field.
- Helper text explaining accepted URL format.
- Button: `Extract claim & verify`.
- Basic validation message for invalid URL.

**Expected user action:**  
The journalist enters a URL and starts verification.

---

### Screen 4 — Image / Screenshot Upload

**Purpose:**  
Allow the journalist to upload an image or screenshot that may contain suspicious information.

**Required UI elements:**
- Full-width drag-and-drop upload area.
- Manual file selection button.
- Image preview after upload.
- File name display.
- Remove image option.
- Supported formats label: `.jpg`, `.png`, `.webp`.
- Maximum file size label: `5 MB`.
- Button: `Extract text & verify`.

**MVP behavior:**  
The prototype must communicate that image text extraction uses OCR mock or local stub for MVP.

**Expected user action:**  
The journalist uploads an image or screenshot and starts verification.

---

### Screen 5 — Processing State

**Purpose:**  
Show that the system is analyzing the submitted content.

**Required UI elements:**
- Loading indicator.
- Step progress indicator:
  1. `Extracting claim`
  2. `Searching evidence`
  3. `Calculating scores`
  4. `Classifying case`
- Message explaining that the system is verifying available evidence.

**Expected user action:**  
The journalist waits for the result.

---

### Screen 6 — Results Page

**Purpose:**  
Show the verification result in a clear and explainable way.

**Required UI elements:**
- Classification badge:
  - `PASS`
  - `NO_PASS`
  - `HUMAN_REVIEW`
- Evidence score.
- Risk score.
- Source agreement:
  - `HIGH`
  - `MEDIUM`
  - `LOW`
- Extracted claim.
- Evidence panel.
- Risk signals panel.
- Buttons:
  - `Save & close`
  - `New verification`
  - `Edit claim and re-run`

**Classification meaning:**

| Classification | Meaning |
|---|---|
| `PASS` | The case can move forward to editorial review based on available evidence. |
| `NO_PASS` | The case should not move forward with the available evidence. |
| `HUMAN_REVIEW` | The case is ambiguous and requires human review. |

**Important UI restriction:**  
The prototype must not show final results as `TRUE` or `FALSE`.

---

### Screen 7 — Verification History

**Purpose:**  
Allow the journalist to review previous verification cases.

**Required UI elements:**
- Table or card list of previous cases.
- Columns or fields:
  - Date
  - Input type
  - Content preview
  - Classification
  - Action: `View`
  - Action: `Re-run`
- Filter by classification.
- Filter by date range.

**Expected user action:**  
The journalist finds and opens a previous verification case.

---

## Prototype Navigation

The prototype must support the following navigation paths:

| From | To | Trigger |
|---|---|---|
| Dashboard | Text Verification | User selects `Text`. |
| Dashboard | URL Verification | User selects `URL`. |
| Dashboard | Image Upload | User selects `Image / Screenshot`. |
| Text Verification | Processing State | User clicks `Extract claim & verify`. |
| URL Verification | Processing State | User clicks `Extract claim & verify`. |
| Image Upload | Processing State | User clicks `Extract text & verify`. |
| Processing State | Results Page | Simulated analysis completes. |
| Results Page | Dashboard | User clicks `New verification`. |
| Results Page | History | User clicks `Save & close`. |
| Dashboard | History | User opens recent verifications. |
| History | Results Page | User opens a previous case. |

---

## Prototype Data Examples

The prototype should include at least three simulated cases.

### Case 1 — PASS

**Input type:** Text  
**Classification:** `PASS`  
**Evidence score:** 82  
**Risk score:** 22  
**Source agreement:** `HIGH`  
**Example risk signals:**
- Reliable sources found.
- Low emotional language.
- Claim matches previous evidence.

### Case 2 — NO_PASS

**Input type:** URL  
**Classification:** `NO_PASS`  
**Evidence score:** 35  
**Risk score:** 76  
**Source agreement:** `LOW`  
**Example risk signals:**
- No reliable source found.
- Strong emotional language.
- Claim contradicts available evidence.

### Case 3 — HUMAN_REVIEW

**Input type:** Image / Screenshot  
**Classification:** `HUMAN_REVIEW`  
**Evidence score:** 61  
**Risk score:** 48  
**Source agreement:** `MEDIUM`  
**Example risk signals:**
- Image text extracted with OCR mock.
- Evidence is partial.
- Sources do not fully agree.

---

## Visual Requirements

### Classification Colors

| Classification | Color |
|---|---|
| `PASS` | Green |
| `NO_PASS` | Red |
| `HUMAN_REVIEW` | Orange |
| `PROCESSING` | Blue or neutral |
| `ERROR` | Red |

### Layout Requirements

- The main verification flow must be visible and easy to follow.
- The classification badge must be prominent on the results page.
- Evidence sources must be visually separated from risk signals.
- The upload area for images must be large enough to be recognized as a drag-and-drop zone.
- The user must always understand what step of the process they are in.

---

## UX Testing Tasks Supported by Prototype

The prototype must allow participants to complete these tasks:

1. Submit suspicious text and identify the result classification.
2. Submit a suspicious URL and open at least one evidence source.
3. Upload an image or screenshot and identify why it is marked as `HUMAN_REVIEW`.
4. Find a previous verification case in history.

---

## Acceptance Criteria

The prototype is ready for UX testing when:

- It includes all screens listed in this document.
- It allows navigation through the main MVP flow.
- It shows `PASS`, `NO_PASS`, and `HUMAN_REVIEW`.
- It includes evidence and risk signal sections.
- It includes image/screenshot upload simulation.
- It includes a history screen.
- It does not use `TRUE` or `FALSE` as final result labels.
- It is connected well enough in Figma to be tested in Maze.

---

## Pending Items

| Item | Status |
|---|---|
| Add Figma prototype link | Pending |
| Add Maze test link | Pending |
| Add screenshots of prototype screens | Pending |
| Validate prototype with 4 external design students | Pending |
| Document UX testing results | Pending |
| Apply corrections after UX testing | Pending |