// SPDX-License-Identifier: MIT
// Everyday Things, Two Lines, Longer Run — entry program.
// Node 22, standard library only. Writes one two-line explanation to
// /output/entry.txt, checks the competition gate first, then reads the file
// back and confirms the bytes match exactly.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const ENTRY =
  "A toaster is a tiny sunbathing bed where a slice of bread lies flat to catch a tan from glowing hot wires.\n" +
  "The tan part fits — heat turns pale bread golden just like the sun turns skin brown — but it leaves out the timer that pops the bread up, ready or not.";

const OUTPUT_PATH = process.env.ENTRY_OUTPUT ?? "/output/entry.txt";
const MIN_CHARS = 1;
const MAX_CHARS = 400;

// Returns every gate violation found, or an empty list when the entry is good.
function checkEntry(text: string): string[] {
  const problems: string[] = [];
  const points = [...text];
  if (points.length < MIN_CHARS || points.length > MAX_CHARS) {
    problems.push(
      `entry is ${points.length} characters, outside the ${MIN_CHARS}-${MAX_CHARS} range`,
    );
  }
  if (text.trim().length === 0) {
    problems.push("entry is only whitespace");
  }
  if (text !== text.trim()) {
    problems.push("entry has leading or trailing whitespace");
  }
  const lines = text.split("\n");
  if (lines.length !== 2) {
    problems.push(`entry has ${lines.length} lines, expected exactly 2`);
  }
  for (const line of lines) {
    if (line.trim().length === 0) {
      problems.push("entry has an empty line");
    }
    // One sentence per line: exactly one sentence-ending mark.
    const stops = (line.match(/[.!?]/g) ?? []).length;
    if (stops !== 1) {
      problems.push(
        `line has ${stops} sentence-ending marks, expected exactly 1: ${line}`,
      );
    }
  }
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if ((code < 0x20 && ch !== "\n") || code === 0x7f) {
      problems.push("entry contains a control character");
      break;
    }
  }
  return problems;
}

const problems = checkEntry(ENTRY);
if (problems.length > 0) {
  for (const problem of problems) console.error(`FAIL: ${problem}`);
  process.exit(1);
}

// Confirms the file on disk is byte-for-byte the entry we meant to write:
// same text, same byte length, same character count, still two lines.
function verifyWritten(path: string, expected: string): void {
  const back = readFileSync(path, "utf8");
  if (back !== expected) {
    console.error("FAIL: read-back text differs from the entry");
    process.exit(1);
  }
  if (Buffer.byteLength(back, "utf8") !== Buffer.byteLength(expected, "utf8")) {
    console.error("FAIL: read-back byte length differs from the entry");
    process.exit(1);
  }
  if ([...back].length !== [...expected].length) {
    console.error("FAIL: read-back character count differs from the entry");
    process.exit(1);
  }
  if (checkEntry(back).length > 0) {
    console.error("FAIL: read-back text no longer passes the gate");
    process.exit(1);
  }
  if (back.endsWith("\n")) {
    console.error("FAIL: written file ends with a trailing newline");
    process.exit(1);
  }
}

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, ENTRY, "utf8");

verifyWritten(OUTPUT_PATH, ENTRY);

console.log(`OK: wrote ${[...ENTRY].length} characters to ${OUTPUT_PATH}`);
console.log(ENTRY);
