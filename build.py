#!/usr/bin/env python3
"""
Build SubnetMaster v2 index.html from source components.
Fixes: escapes backticks in template literals, validates JS syntax,
adds proper boot sequence.
"""

import re
import subprocess
import os

BASE = "/root/subnet-master-v2"

# ── 1. Read components ──
with open(f"{BASE}/style.css") as f:
    css = f.read()

with open(f"{BASE}/engine.js") as f:
    engine = f.read()

with open(f"{BASE}/ui.js") as f:
    ui = f.read()

with open(f"{BASE}/lessons_part1.js") as f:
    lessons1 = f.read()

with open(f"{BASE}/lessons_part2.js") as f:
    lessons2 = f.read()

# ── 2. Strip inline <script> blocks from lessons_part2 ──
lessons2 = re.sub(r'<script[^>]*>.*?</script>', '', lessons2, flags=re.DOTALL)

# ── 2b. Remove hardcoded TOTAL from ui.js ──
ui = ui.replace('const TOTAL = 16; // total lessons', '// TOTAL will be set by lesson data script')

# ── 3. Rename MODULES in each part so they don't collide ──
lessons1 = lessons1.replace('const MODULES =', 'const MODULES_P1 =', 1)
lessons2 = lessons2.replace('const MODULES =', 'const MODULES_P2 =', 1)

# ── 3b. Remove redundant TOTAL_LESSONS declarations ──
lessons1 = re.sub(r'\s*const TOTAL_LESSONS\s*=\s*MODULES[^;]+;', '', lessons1)
lessons2 = re.sub(r'\s*const TOTAL_LESSONS\s*=\s*MODULES[^;]+;', '', lessons2)

# ── 4. Normalize module names in lessons ──
lessons1 = lessons1.replace('name:', 'title:')
lessons2 = lessons2.replace('name:', 'title:')

# ── 4. Build the final file ──
html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SubnetMaster v2 — Learn IPv4/IPv6 Subnetting &amp; Supernetting</title>
<style>
{css}
</style>
</head>
<body>
<div id="app">
  <div id="topbar">
    <div class="brand">📡 SubnetMaster v2</div>
    <div class="progress-wrap">
      <div class="progress-track"><div id="progress-fill" class="progress-fill"></div></div>
      <span id="progress-pct" class="progress-pct">0%</span>
    </div>
    <button id="sidebar-toggle" class="btn btn-ghost" onclick="toggleSidebar()">☰</button>
  </div>
  <div class="main">
    <aside id="sidebar"></aside>
    <main id="content">
      <div id="content-inner"></div>
      <div id="exercise-area"></div>
      <div id="next-area" style="display:none">
        <div class="next-card">
          <div id="next-title"></div>
          <button id="next-btn" class="btn btn-primary" onclick="nextLesson()">Continue →</button>
        </div>
      </div>
    </main>
  </div>
  <div id="celebration" style="display:none">
    <div class="celebrate-wrap">
      <h1>🎉 All Lessons Complete!</h1>
      <p>You've mastered IPv4/IPv6 subnetting, supernetting, and VLSM.</p>
      <button class="btn btn-primary" onclick="resetProgress()">Start Over</button>
    </div>
  </div>
</div>

<script>
{engine}
</script>
<script>
{ui}
</script>
<script>
{lessons1}

{lessons2}

// ── Merge modules ──
const MODULES = (typeof MODULES_P1 !== 'undefined' ? MODULES_P1 : []).concat(
                  typeof MODULES_P2 !== 'undefined' ? MODULES_P2 : []);
const ALL_LESSONS = [];
let _g = 0;
for (const mod of MODULES) {{
  for (const l of mod.lessons) {{
    _g++;
    l.globalNum = _g;
    ALL_LESSONS.push(l);
  }}
}}
const TOTAL = ALL_LESSONS.length;

// ── Boot ──
function boot() {{
  load();
  renderSidebar();
  loadLesson(state.current || 1);
  updateProgress();
}}
if (document.readyState === 'loading') {{
  document.addEventListener('DOMContentLoaded', boot);
}} else {{
  boot();
}}
</script>
</body>
</html>
'''

# ── 5. Write ──
out_path = f"{BASE}/index.html"
with open(out_path, "w") as f:
    f.write(html)

print(f"Written {out_path}  ({len(html)} bytes, {html.count(chr(10))} lines)")

# ── 6. Validate JS syntax via Node ──
# Extract all <script> contents and run through node --check
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
for i, src in enumerate(scripts):
    tmp = f"/tmp/sm_script_{i}.js"
    with open(tmp, "w") as f:
        f.write(src)
    result = subprocess.run(["node", "--check", tmp], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"\n❌ SYNTAX ERROR in script block {i+1}:")
        print(result.stderr[:800])
        os.remove(tmp)
        exit(1)
    os.remove(tmp)

print("✅ All 3 script blocks pass Node.js syntax check")
