# SubnetMaster v2 — Implementation Plan

> For Hermes: Use delegate_task with subagents running deepseek-v4-pro to implement this plan.

**Goal:** Rebuild the interactive IPv4/IPv6 subnetting & supernetting webapp from the ground up. Single-file self-contained HTML (no build tools, no external deps), dark theme, fully working, bug-free, covering MORE topics than v1.

**Architecture:** Single `index.html` with modular ES6 IIFE modules inside `<script>` tags. Uses vanilla JS, no frameworks. CSS via `<style>` with CSS variables for theming.

**Tech Stack:** HTML5, vanilla JavaScript (ES2022), CSS3, no external libraries.

---

## Known Bugs from v1 to Fix
1. `d4Update()` fires before DOM exists — call demo inits inside loadLesson, not at global scope
2. IP generator produces .0 or .255 host addresses — always use rand(1,254), never 0 or 255 for hosts
3. `ipToBin()` returns array, not string — always `.join('')` when needing binary string
4. Lesson 6 `hostBits` undefined before use — compute before building question
5. IPv6 subnet exercise always gives same answer — use range 16-31 for meaningful subnet IDs
6. Binary answer check ignores dots — strip both spaces and dots: `replace(/[\s\.]/g,'')`
7. Missing CIDR to dotted-decimal mask conversion lesson
8. Missing VLSM practice exercises
9. No wildcard mask content
10. No FLSM (Fixed Length Subnet Masking) lesson
11. Missing classful addressing basics (A/B/C classes — for historical context)
12. IPv6 section is thin — needs EUI-64, SLAAC, more address types

## New Content to Add (v1 had 12 lessons; v2 has 16)
13. Classful Addressing (A/B/C classes, historical context)
14. FLSM — Fixed Length Subnet Masking (equal subnets)
15. VLSM — Variable Length Subnet Masking (deep dive)
16. Wildcard Masks / ACLs

## File Structure (single HTML file, 4 script sections)

```html
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>SubnetMaster v2</title>
<style>/* -- CSS: dark theme, responsive, CSS variables -- */</style>
</head>
<body>
  <!-- HTML shell: topbar, sidebar, content area, celebration overlay -->
  <script>/* SECTION 1: CORE ENGINE — ip.js */
    // ipToBin, binToIp, prefixToMask, maskToPrefix, calcNetwork, calcBroadcast,
    // calcRange, isValidIp, isValidMask, calcSubnetCount, calcHostsPerSubnet,
    // calcBlockSize, expandIPv6, compressIPv6, isValidIPv6, ipv6Type, etc.
    // ALL must be pure functions with no DOM access.
  </script>
  <script>/* SECTION 2: UI FRAMEWORK — ui.js */
    // State: {current, completed: Set, wrongAttempts: {}, modules: [...]}
    // renderSidebar(), loadLesson(id), renderStep(step, index, total), updateProgress()
    // initExercise(), checkExercise(), showHint(), celebrate(), nextLesson()
    // DOM utilities: createEl, clearEl, etc.
    // All demos call init functions AFTER DOM is injected.
  </script>
  <script>/* SECTION 3: LESSON DATA — lessons.js */
    // Array of modules, each with lessons, each with steps (explain|demo|exercise)
    // Each exercise generator must be pure (random) and produce deterministic check functions
    // Demo HTML uses data attributes, not inline oninput — UI framework wires events after render
  </script>
  <script>/* SECTION 4: DEMO HANDLERS — demos.js */
    // d1Show(), d2Show(), d3Show(), ... d16Show() — event handlers wired dynamically
    // All demos validate inputs, handle edge cases, show clear results
  </script>
</body>
</html>
```

## Lesson Catalog (16 lessons, 4 modules)

### Module 1 — IPv4 Fundamentals
1. **What is an IP Address?** — Binary conversion, octet rules
2. **Network vs Host Bits** — Subnet mask divider, visual diagram
3. **The AND Operation** — Binary AND, network address, broadcast
4. **CIDR & Subnet Masks** — / notation, dotted decimal ↔ prefix conversion, host count formula

### Module 2 — IPv4 Subnetting
5. **Classful Addressing (A/B/C)** — Historical classes, default masks, private ranges
6. **Your First Subnet (FLSM)** — Borrow 1-4 bits, equal subnets, block size
7. **Variable-Length Subnet Masking (VLSM)** — Different sized subnets, sort-biggest-first
8. **Subnetting in Practice** — Real-world design challenge exercises

### Module 3 — Supernetting & Aggregation
9. **What is Supernetting?** — Route aggregation, contiguous rule, power-of-2 rule
10. **Supernetting Challenge** — ISP allocation, summarization masks, wildcard masks

### Module 4 — IPv6
11. **IPv6 Address Anatomy** — 128-bit structure, hextets, :: shorthand, leading zeros
12. **IPv6 Address Types** — Global unicast, link-local, loopback, multicast, anycast
13. **IPv6 Subnetting** — /48 /56 /64 /128, subnet ID boundaries, SLAAC
14. **EUI-64 Interface IDs** — MAC-to-IPv6 conversion, ff:fe insertion, flipped U/L bit

## CSS Requirements
- Dark theme with CSS variables (bg #0f1117, surface #1a1d24, accent #6e93f5, accent2 #4ec9b0)
- Responsive: sidebar collapses to hamburger at < 768px
- Progress bar in topbar, sticky
- Step cards with numbered circles
- Exercise box with colored borders (blue for exercise, green for pass, red for fail)
- Confetti particle animation on correct answer
- Diagram system for visualizing subnets

## Exercise Generator Rules (ALL must follow)
1. Never generate network (.0) or broadcast (.255) addresses as host IPs
2. Use `rand(1,223)` for first octet, avoiding 127 (loopback)
3. Use `rand(1,254)` for any octet that could be a host address
4. Check functions must be case-insensitive where appropriate
5. Accept both /prefix and dotted-decimal mask where either is valid
6. Strip spaces AND dots from binary answer comparisons
7. IPv6 answers: strip spaces, case-insensitive, accept compressed or full form where appropriate
8. Every exercise must have: question, fields (id, label, check func), hint, optional answer display
9. After 3 wrong attempts, show hint button
10. Unlimited retries — no penalty, just learning

## Integration Checklist (before shipping)
- [ ] All 16 lessons render correctly with step-by-step progression
- [ ] Every exercise validates correct answers and marks wrong ones
- [ ] All demos handle edge cases (invalid input, network addresses, etc.)
- [ ] Progress bar updates as lessons complete
- [ ] localStorage saves progress correctly
- [ ] Mobile layout works (sidebar toggle, scroll, touch targets)
- [ ] No global-scope demo init calls — all init after DOM injection
- [ ] No `.0` or `.255` host addresses in exercises
- [ ] Confetti fires on correct answer
- [ ] Completion screen shows when all 16 lessons done
