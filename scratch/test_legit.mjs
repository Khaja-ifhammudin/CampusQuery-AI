import { sanitizeUntrustedDocumentText } from './test_regex.mjs';

const legitimateSamples = [
  `CAMPUS UNIVERSITY - UNDERGRADUATE ACADEMIC POLICIES & PROCEDURES (2025-2026)

Section 1: Course Add / Drop and Census Deadlines
Students may add or drop classes without academic or financial penalty through 11:59 PM on the 10th instructional day of the fall or spring semester, known as the Official University Census Date.`,

  `Section 2: Grade Forgiveness & Course Repetition Policy
Undergraduate students are permitted to repeat up to 16 semester credit units for Grade Forgiveness. When an eligible course is repeated for forgiveness:
1. Only the newly earned grade is calculated into the cumulative grade point average (GPA).
2. The initial grade earned remains visible on the official transcript annotated with an "R" (Repeated) notation.`,

  `Section 2: Overdue Fines and Penalties
Overdue general collection books accrue a late fine of $0.50 per day up to a maximum fee of $15.00 per item. Accounts with more than $30.00 in unpaid fines are placed on borrowing suspension until fees are settled at the circulation desk.`
];

legitimateSamples.forEach((text, i) => {
  const r = sanitizeUntrustedDocumentText(text);
  console.log(`Legit Sample ${i + 1} HasPayload: ${r.hasAdversarialPayload}`);
  if (r.cleanText !== text.trim()) {
    console.error(`MISMATCH in Legit Sample ${i + 1}!`);
  } else {
    console.log(`Legit Sample ${i + 1} matched 100% perfectly.`);
  }
});
