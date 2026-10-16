# CampusQuery AI - Video Demonstration Script & Recording Checklist

**Document Version:** 1.0  
**Target Video Duration:** 3:30 – 4:30 minutes (Paced for clarity)  
**Target Audience:** University Evaluator / Security & Software Quality Assignment Reviewer  
**Application URL:** `http://localhost:3000`  
**Security Notice:** **Never show raw API keys, tokens, or `.env` files on screen during the recording.**

---

## 1. Pre-Recording Preparation Checklist

Before hitting record, ensure the environment is configured as follows:

- [ ] **Dev Server Running:** Terminal background running `npm run dev` on port 3000.
- [ ] **Clean Browser State:** Open Chrome, Edge, or Firefox at `http://localhost:3000` with zoom set to 100%.
- [ ] **Database State:** Default baseline documents active (click "Restore Demo Policies" in Knowledge Base if needed).
- [ ] **Window Dimensions:** Full screen or standard 1920×1080 / 1536×864 resolution.
- [ ] **Microphone & Audio:** Clear voice narration or text overlay explaining actions.
- [ ] **Developer Tools Ready:** DevTools closed initially; keep Device Emulation toggle (`Ctrl+Shift+M`) ready for the mobile responsiveness segment.

---

## 2. Timestamped Storyboard & Exact Browser Action Guide

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIMELINE BREAKDOWN (Total: ~4 minutes)                                │
├───────────────┬────────────────────────────────────────────────────────┤
│ 0:00 - 0:45   │ Act 1: Student Chatbot & Verified Grounded Citations   │
│ 0:45 - 1:25   │ Act 2: Chat Actions & Conversation History             │
│ 1:25 - 2:05   │ Act 3: Hallucination Resistance & Defensive Validation │
│ 2:05 - 2:50   │ Act 4: Admin Role, Document Management & Chunk Inspect │
│ 2:50 - 3:30   │ Act 5: Admin Analytics, Telemetry & Policy Gap Resolve │
│ 3:30 - 4:15   │ Act 6: Keyboard Accessibility (a11y) & Mobile Drawer   │
│ 4:15 - 4:30   │ Wrap-up & System Architecture Transparency             │
└───────────────┴────────────────────────────────────────────────────────┘
```

---

### Act 1: Student Chatbot & Verified Policy Citations (0:00 – 0:45)

* **Goal:** Demonstrate student inquiry flow, grounded factual precision, and interactive citation inspector.
* **Exact Browser Steps:**
  1. **Landing View:** Start on the Student Chat view (`http://localhost:3000`). Point out the clean UI, "Student" role pill in the header, and the 6 domain prompt suggestions.
  2. **Submit Inquiry:** Click the prompt card: **"Can I repeat a course to replace a low grade?"**
  3. **Observe Response:**
     - Point out the real-time loading indicator.
     - Read or highlight the factual answer: explains Grade Forgiveness, *"up to 16 semester credit units"*, and *"maximum of three total attempts (repeat twice)"*.
     - Highlight the inline citation chip: `[Doc: Academic Regulations & Degree Requirements, Section: Section 2: Course Repetition & Grade Forgiveness]`.
  4. **Open Citation Inspector:** Click the citation chip or the citation card at the bottom of the message.
     - The `CitationModal` opens displaying the verified source passage excerpt.
  5. **Keyboard Escape Dismissal:** Press the **`Escape`** key on your keyboard.
     - **Voiceover / Caption:** *"Notice that pressing Escape immediately dismisses the modal, complying with WCAG 2.1 AA keyboard dismissal standards."*

---

### Act 2: Chat Actions & Conversation History (0:45 – 1:25)

* **Goal:** Demonstrate message actions, feedback telemetry, conversation creation, and switching.
* **Exact Browser Steps:**
  1. **Message Action Bar:**
     - Hover over the assistant's message bubble.
     - Click the **Copy** button (`aria-label="Copy assistant response"`). Point out the green checkmark and "Copied" tooltip.
     - Click the **Helpful** thumbs-up button (`aria-label="Mark response as helpful"`). Point out the button turns emerald green.
  2. **Create New Session:**
     - In the left sidebar, click the **"+ New Student Inquiry"** button.
     - A fresh chat session is generated and selected.
  3. **Ask Second Question:**
     - Type in the chat input: `"What is the maximum emergency student relief grant?"` and press **`Enter`**.
     - Point out the response citing the Financial Aid handbook: exact limit of **"$1,500 per academic year"**.
  4. **Switch History:**
     - In the sidebar history list, click the previous conversation ("Can I repeat a course...").
     - Show that full message history and citations reload instantly.
  5. **Delete Conversation:**
     - In the sidebar, hover over one of the conversation sessions and click the trash icon button (`aria-label="Delete conversation..."`).
     - Point out the session is cleanly removed from state and storage.

---

### Act 3: Hallucination Resistance & Defensive Input Validation (1:25 – 2:05)

* **Goal:** Demonstrate resistance to policy hallucinations (BUG-01 fix) and input validation.
* **Exact Browser Steps:**
  1. **Empty / Whitespace Validation:**
     - Click in the chat textarea.
     - Press **`Shift + Enter`** twice, then type spaces: `"     "`.
     - Point out the Send button remains disabled (or backend rejects empty input without server crash).
  2. **Fictional Policy Question (Responsible AI BUG-01 Demo):**
     - Type the exact test question:  
       `"According to campus regulations, can students keep dragons as pets in residence halls?"`
     - Press **`Enter`**.
  3. **Observe Responsible AI Guardrail:**
     - Point out the assistant does **not** hallucinate dragon housing policies and does **not** quote unrelated bus shuttle passages.
     - Highlight the **Amber Policy Boundary Notice** (`isFallback: true`):
       *"I could not find official information regarding 'According to campus regulations, can students keep dragons as pets in residence halls?' in the active campus knowledge base. Please contact the Department of Residential Life..."*
     - **Voiceover / Caption:** *"This demonstrates the BUG-01 fix: the local RAG engine enforces substantive token match thresholds, preventing hallucinated or irrelevant policy answers."*

---

### Act 4: Admin Role, Document Management & Chunk Inspector (2:05 – 2:50)

* **Goal:** Demonstrate role-based access, document search/filtering, passage chunk inspection, and document upload.
* **Exact Browser Steps:**
  1. **Switch to Admin Role:**
     - In the header, click the **"Admin"** pill button (`aria-label="Switch to Admin view"`).
     - Point out the amber Admin badge, and observe the new tabs appear: **"Knowledge Base"** and **"Admin Analytics"**.
  2. **Navigate to Knowledge Base:**
     - Click the **"Knowledge Base"** tab.
     - Show the 5 official baseline handbooks with document cards, chunk counters, and status toggles.
  3. **Search & Filter:**
     - In the search bar, type `"parking"`. Show that the table instantly filters to Campus Parking Regulations. Clear the search bar.
     - Click the **"Housing"** category filter pill. Show only Residential Life policies displayed. Click **"All Categories"**.
  4. **Inspect Chunks:**
     - Click the **"Inspect Chunks"** button (`aria-label="Inspect chunks for..."`) on any document.
     - Show the `ChunkInspectorModal` displaying segmented passages with Chunk #, Section Titles, and Character Counts.
     - Press **`Escape`** to dismiss the modal cleanly.
  5. **Upload Document & Validation:**
     - Click the **"Upload Document"** button.
     - In `UploadDocumentModal`, leave the Title empty and click **"Index into Knowledge Base"**.
     - Point out the inline red error: *"Please enter a document title."*
     - Switch to **"Direct Text Compose"** mode.
     - Enter Title: `"Winter Weather & Campus Closure Policy 2026"`.
     - Select Category: `"General"`.
     - Paste text:
       `"Section 1: Adverse Weather Announcements. In the event of severe winter storms, official campus closures will be announced by 6:00 AM via the Emergency Siren and campus text alerts. Essential residential dining halls remain open."`
     - Click **"Index into Knowledge Base"**.
     - Show the new document appears in the knowledge base list with parsed chunk count.

---

### Act 5: Admin Analytics, Telemetry & Policy Gap Tracking (2:50 – 3:30)

* **Goal:** Demonstrate administrative telemetry, domain analytics, and resolving ungrounded student queries.
* **Exact Browser Steps:**
  1. **Navigate to Analytics:**
     - Click the **"Admin Analytics"** tab in the header.
  2. **Review KPI Metrics:**
     - Point out the 4 KPI cards: **Total Questions**, **Grounding Rate %**, **Policy Gaps**, and **Average Response Time**.
  3. **Domain Breakdown Chart:**
     - Highlight the distribution bar chart showing inquiry percentages across Academic, Financial Aid, Housing, Health, and Transit.
  4. **Unanswered Queries & Policy Gaps Log:**
     - Scroll down to the **"Unanswered Queries & Policy Gaps Log"** table.
     - Point out the fictional dragon inquiry asked earlier, logged automatically as **"Pending Policy"** with the exact query text and timestamp.
  5. **Resolve Policy Gap:**
     - Click the **"Mark Resolved"** button on the entry.
     - Point out the status toggles to a green **"Resolved"** checkmark badge.

---

### Act 6: Keyboard Accessibility & Mobile Responsiveness (3:30 – 4:15)

* **Goal:** Demonstrate WCAG 2.1 AA keyboard navigation, focus trapping, and responsive mobile drawer.
* **Exact Browser Steps:**
  1. **Keyboard Tab Navigation:**
     - Switch back to the **Student Chat** tab.
     - Click into the browser address bar, then press **`Tab`** repeatedly.
     - Demonstrate visible blue focus rings moving sequentially through:
       Header Logo ➔ Mobile Menu ➔ Tabs ➔ "RAG Online" ➔ Student/Admin Pills ➔ Chat Suggestions ➔ Input Textarea.
  2. **System Architecture Modal & Focus Trapping:**
     - With focus on the **"RAG Online"** button, press **`Enter`** (or click it).
     - The `SystemNoticeModal` opens.
     - Press **`Tab`** repeatedly inside the modal.
     - Point out that focus cycles strictly between the modal's internal action buttons without escaping into background elements (Focus Trapping).
     - Press **`Escape`**. The modal closes and focus returns to the "RAG Online" button (Focus Restoration).
  3. **Mobile Responsive Viewport:**
     - Open Chrome DevTools (`F12` or `Ctrl+Shift+I`) and toggle Device Mode (`Ctrl+Shift+M`).
     - Set viewport to **iPhone 12/14 (375px × 667px)** or narrow the browser window below 768px.
     - Point out the desktop sidebar collapses into a responsive mobile header with a hamburger menu button.
  4. **Mobile Navigation Drawer:**
     - Tap the hamburger menu button (`aria-label="Toggle navigation menu"`).
     - The dark backdrop overlays the screen and the navigation drawer slides in from the left.
     - Tap the dark backdrop. The drawer dismisses cleanly.

---

### Wrap-Up & Closing Statement (4:15 – 4:30)

* **Goal:** Conclude the demonstration with key takeaway metrics.
* **Final Summary Statement:**
  - *"CampusQuery AI achieves 100% compliance across all 75 executable functional, security, accessibility, and Responsible AI tests."*
  - *"Critical policy hallucinations and header-spoofing authorization vulnerabilities are completely resolved."*
  - *"The system ensures authoritative policy adherence for students while enforcing rigorous security and accessibility standards for university administrators."*

---

## 3. Quick Reference Card for Demonstrator

| Feature to Show | Where to Click / Press | What to Highlight to Evaluator |
|---|---|---|
| **Student Grounding** | Prompt Card: "Repeat course" | Exact thresholds (16 units, repeat twice); Section 2 citation |
| **Citation Inspector** | Click citation badge | Verbatim handbook excerpt in modal dialog |
| **Modal Dismissal** | Press `Escape` | Instant dismissal; focus restored to trigger control |
| **Hallucination Guard** | Ask: "Dragons in dorms?" | Amber alert fallback; zero hallucinated dragon pets |
| **Admin Switch** | Header "Admin" pill | Knowledge Base & Analytics appear dynamically |
| **Chunk Inspector** | Click "Inspect Chunks" | Segmented passages with section titles and character counts |
| **Upload Memo** | "Upload Document" button | Input validation on title; instant indexing into RAG |
| **Admin Telemetry** | "Admin Analytics" tab | Policy gap logging; resolving unanswered student inquiries |
| **Focus Trapping** | Open modal, press `Tab` | Focus cannot escape modal subtree behind backdrop |
| **Mobile Layout** | Narrow screen to 375px | Responsive hamburger toggle and backdrop dismissal |

---

## 4. Evaluator Verification Checkpoints (Self-Audit)

Before submitting your recording, verify that the following are clearly visible in the video:
1. [ ] The browser address bar displays `http://localhost:3000`.
2. [ ] Grounded citations show official document titles and section numbers.
3. [ ] The dragon pet question clearly returns the safe university fallback disclaimer.
4. [ ] The `Escape` key dismisses open modals without mouse clicks.
5. [ ] Switching to Admin role dynamically exposes Knowledge Base and Analytics.
6. [ ] The mobile drawer opens and closes smoothly via the backdrop overlay.
7. [ ] No secret keys or environment files are shown.
