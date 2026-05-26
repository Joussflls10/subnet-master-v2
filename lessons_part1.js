/***********************************
 * SubnetMaster v2 — Lesson Data Part 1
 * Modules 1 & 2 (Lessons 1–8)
 ***********************************/

const MODULES = [
  {
    title: "Module 1 — IPv4 Fundamentals",
    lessons: [
      /* ─── Lesson 1: What is an IP Address? ─── */
      {
        id: 1,
        title: "What is an IP Address?",
        subtitle: "Learn how a 32-bit number becomes 4 dotted decimals",
        steps: [
          {
            type: "explain",
            label: "Explain",
            title: "The Basics",
            html: `
              <div class="info-card">
                <h3>📍 What is an IPv4 Address?</h3>
                An IPv4 address is a <strong>32-bit number</strong> used to identify devices on a network.
                It's written as <strong>4 decimal numbers (0–255)</strong> separated by dots — called
                <em>octets</em> because each represents 8 binary bits.
                <br><br>
                Example: <span class="highlight">192.168.1.100</span>
                <ul>
                  <li>Maximum per octet: <span class="highlight">255</span> (all 8 bits set to 1)</li>
                  <li>Minimum per octet: <span class="highlight">0</span> (all 8 bits set to 0)</li>
                  <li>Total address space: 2³² ≈ 4.3 billion addresses</li>
                </ul>
              </div>
            `
          },
          {
            type: "demo",
            label: "Demo",
            title: "See It in Binary",
            html: `
              <div class="demo-box">
                <label>Enter any IPv4 address</label>
                <input type="text" id="d1-ip" value="192.168.5.10" placeholder="e.g. 10.0.3.200">
                <div class="btn-row">
                  <button class="btn btn-primary" onclick="d1Show()">Show Binary</button>
                </div>
                <div id="d1-result"></div>
              </div>
            `
          },
          {
            type: "exercise",
            label: "Exercise",
            title: "Your Turn",
            generate() {
              const a = rand(1, 223, b => b !== 127);
              const b = rand(1, 254);
              const c = rand(1, 254);
              const d = rand(1, 254);
              const ip = `${a}.${b}.${c}.${d}`;
              const bins = ip.split('.').map(Number).map(n => n.toString(2).padStart(8, '0'));
              return {
                question: `Convert the IP address <code>${ip}</code> to binary. Enter the FULL 8-bit binary form of each octet, separated by dots (e.g. 11000000.10101000.00000001.00000101).`,
                fields: [
                  {
                    id: 'ans1',
                    label: 'Binary form (e.g. 11000000.10101000.00000001.00000101)',
                    check: v => v.replace(/[\s\.]/g, '') === bins.join('')
                  }
                ],
                answer: bins.join('.'),
                hint: `Convert each decimal octet separately. ${a} = ${bins[0]}, ${b} = ${bins[1]}, ${c} = ${bins[2]}, ${d} = ${bins[3]}. Full answer: ${bins.join('.')}`
              };
            }
          }
        ]
      },

      /* ─── Lesson 2: Network vs Host Bits ─── */
      {
        id: 2,
        title: "Network vs Host Bits",
        subtitle: "How a subnet mask divides an IP into network and host portions",
        steps: [
          {
            type: "explain",
            label: "Explain",
            title: "Two Parts of Every IP",
            html: `
              <div class="info-card">
                <h3>🔪 The Subnet Mask — The Great Divider</h3>
                Every IP address has two parts, defined by the <strong>subnet mask</strong>:
                <ul>
                  <li><span class="highlight">Network bits</span> — identify the network (like a street name)</li>
                  <li><span class="highlight2">Host bits</span> — identify a specific device (like a house number)</li>
                </ul>
                <br>
                <strong>Subnet mask rules:</strong>
                <ul>
                  <li><span class="highlight">255</span> in an octet = network bit (keep this part unchanged)</li>
                  <li><span class="highlight2">0</span> in an octet = host bit (this is the addressable space)</li>
                </ul>
                <br>
                <div class="diagram">
                  <strong>IP: 192 . 168 . 1 . 100</strong><br>
                  <strong>Mask: 255 . 255 . 255 . 0</strong><br>
                  <div class="diagram-row" style="margin-top:8px;">
                    <span class="diag-block diag-net">192</span>
                    <span class="diag-block diag-net">168</span>
                    <span class="diag-block diag-net">1</span>
                    <span class="diag-sep">|</span>
                    <span class="diag-block diag-host">100</span>
                  </div>
                  <div class="diagram-row">
                    <span class="diag-block diag-net">Network</span>
                    <span class="diag-block diag-net">Network</span>
                    <span class="diag-block diag-net">Network</span>
                    <span class="diag-sep"></span>
                    <span class="diag-block diag-host">Host</span>
                  </div>
                </div>
                <strong>192.168.1.0/24</strong> means the first 24 bits are the network — the last 8 bits are hosts.
              </div>
            `
          },
          {
            type: "demo",
            label: "Demo",
            title: "Visualize Any IP + Mask",
            html: `
              <div class="demo-box">
                <label>IP Address</label>
                <input type="text" id="d2-ip" value="192.168.1.100" placeholder="192.168.1.100">
                <label>Subnet Mask (dotted decimal)</label>
                <input type="text" id="d2-mask" value="255.255.255.0" placeholder="255.255.255.0">
                <div class="btn-row">
                  <button class="btn btn-primary" onclick="d2Show()">Analyze</button>
                </div>
                <div id="d2-result"></div>
              </div>
            `
          },
          {
            type: "exercise",
            label: "Exercise",
            title: "Count the Bits",
            generate() {
              const masks = [
                { mask: '255.255.255.0', prefix: 24 },
                { mask: '255.255.0.0', prefix: 16 },
                { mask: '255.0.0.0', prefix: 8 },
                { mask: '255.255.255.128', prefix: 25 },
                { mask: '255.255.255.192', prefix: 26 }
              ];
              const m = masks[randIdx(masks)];
              return {
                question: `For a device with mask <code>${m.mask}</code>, how many network bits and how many host bits are there?`,
                fields: [
                  { id: 'ans_net', label: 'Network bits', check: v => parseInt(v) === m.prefix },
                  { id: 'ans_host', label: 'Host bits', check: v => parseInt(v) === 32 - m.prefix }
                ],
                hint: `${m.mask} = /${m.prefix}. Total bits = 32. Network bits = ${m.prefix}, Host bits = ${32 - m.prefix}.`
              };
            }
          }
        ]
      },

      /* ─── Lesson 3: The AND Operation ─── */
      {
        id: 3,
        title: "The AND Operation",
        subtitle: "How routers find the network address using binary AND",
        steps: [
          {
            type: "explain",
            label: "Explain",
            title: "IP AND Mask = Network Address",
            html: `
              <div class="info-card">
                <h3>⚡ The AND Operation — How Finding a Network Works</h3>
                To find the <strong>network address</strong>, every bit of the IP is ANDed with the mask:<br><br>
                <ul>
                  <li>1 AND 1 = <strong>1</strong></li>
                  <li>1 AND 0 = <strong>0</strong></li>
                  <li>0 AND 1 = <strong>0</strong></li>
                  <li>0 AND 0 = <strong>0</strong></li>
                </ul>
                <br>
                Since 255 = 11111111 in binary, ANDing with 255 keeps the original bit.<br>
                Since 0 = 00000000 in binary, ANDing with 0 always gives 0.
                <br><br>
                <strong>Example:</strong> IP 192.168.1.100 with mask 255.255.255.0
                <div class="diagram" style="font-family:var(--mono);font-size:0.8rem;">
                  IP:     11000000.10101000.00000001.01100100<br>
                  Mask:   11111111.11111111.11111111.00000000<br>
                  AND:    ─────────────────────────────────<br>
                  Net:    11000000.10101000.00000001.00000000 → 192.168.1.0
                </div>
                The <strong>broadcast address</strong> sets all host bits to 1: 192.168.1.255
              </div>
            `
          },
          {
            type: "demo",
            label: "Demo",
            title: "See AND in Action",
            html: `
              <div class="demo-box">
                <label>IP Address</label>
                <input type="text" id="d3-ip" value="192.168.1.100">
                <label>Subnet Mask</label>
                <input type="text" id="d3-mask" value="255.255.255.0">
                <div class="btn-row">
                  <button class="btn btn-primary" onclick="d3Show()">Calculate AND</button>
                </div>
                <div id="d3-result"></div>
              </div>
            `
          },
          {
            type: "exercise",
            label: "Exercise",
            title: "Find the Network Address",
            generate() {
              const prefix = [24, 24, 24, 16, 16][randIdx([0, 1, 2, 3, 4])];
              const mask = prefixToMask(prefix);
              const base = prefix === 24 ? [192, 168] : [10, 0];
              const third = rand(0, 255);
              const fourth = rand(1, 254);
              const ip = `${base[0]}.${base[1]}.${third}.${fourth}`;
              const network = calcNetwork(ip, mask);
              return {
                question: `Device has IP <code>${ip}</code> and mask <code>${mask}</code>. What is the network address?`,
                fields: [
                  {
                    id: 'ans_net',
                    label: 'Network address (CIDR notation)',
                    check: v => v.replace(/\s/g, '') === network + '/' + prefix
                  }
                ],
                hint: `The network address is ${network}/${prefix}.`
              };
            }
          }
        ]
      },

      /* ─── Lesson 4: CIDR & Subnet Masks ─── */
      {
        id: 4,
        title: "CIDR & Subnet Masks",
        subtitle: "/24 means 255.255.255.0 — the compact way to write masks",
        steps: [
          {
            type: "explain",
            label: "Explain",
            title: "CIDR: Shorthand for Subnet Masks",
            html: `
              <div class="info-card">
                <h3>📇 CIDR Notation — /24, /26, /16... What Does It Mean?</h3>
                <strong>CIDR</strong> (Classless Inter-Domain Routing) writes the mask as a simple number:
                the count of network bits.
                <br><br>
                <table style="width:100%;font-size:0.85rem;border-collapse:collapse;margin:10px 0;">
                  <tr style="background:var(--surface2)"><th style="padding:6px 10px;text-align:left;color:var(--accent)">CIDR</th>
                    <th style="padding:6px 10px;text-align:left;color:var(--accent2)">Mask</th>
                    <th style="padding:6px 10px;text-align:left;color:var(--accent3)">Hosts</th></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">/24</td><td style="padding:6px 10px;border-top:1px solid var(--border)">255.255.255.0</td><td style="padding:6px 10px;border-top:1px solid var(--border)">254</td></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">/25</td><td style="padding:6px 10px;border-top:1px solid var(--border)">255.255.255.128</td><td style="padding:6px 10px;border-top:1px solid var(--border)">126</td></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">/26</td><td style="padding:6px 10px;border-top:1px solid var(--border)">255.255.255.192</td><td style="padding:6px 10px;border-top:1px solid var(--border)">62</td></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">/27</td><td style="padding:6px 10px;border-top:1px solid var(--border)">255.255.255.224</td><td style="padding:6px 10px;border-top:1px solid var(--border)">30</td></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">/16</td><td style="padding:6px 10px;border-top:1px solid var(--border)">255.255.0.0</td><td style="padding:6px 10px;border-top:1px solid var(--border)">65,534</td></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">/8</td><td style="padding:6px 10px;border-top:1px solid var(--border)">255.0.0.0</td><td style="padding:6px 10px;border-top:1px solid var(--border)">16,777,214</td></tr>
                </table>
                <strong>Host formula:</strong> 2<sup>(32 − prefix)</sup> − 2 (subtract network + broadcast)
              </div>
            `
          },
          {
            type: "demo",
            label: "Demo",
            title: "CIDR Slider Explorer",
            html: `
              <div class="demo-box">
                <label>CIDR Prefix: <strong id="d4-val">/24</strong></label>
                <input type="range" id="d4-slider" min="8" max="30" value="24"
                  style="width:100%;accent-color:var(--accent);margin:8px 0;"
                  oninput="document.getElementById('d4-val').textContent='/'+this.value; d4Show();">
                <div id="d4-result"></div>
              </div>
            `,
            init() {
              if (document.getElementById('d4-slider')) d4Show();
            }
          },
          {
            type: "exercise",
            label: "Exercise",
            title: "CIDR Quick Questions",
            generate() {
              const qs = [
                { q: 'A /26 network has how many usable host addresses?', ans: '62' },
                { q: 'What is the default mask for a /16 network in dotted decimal?', ans: '255.255.0.0' },
                { q: 'How many total addresses (including network & broadcast) in a /28?', ans: '16' },
                { q: 'A network with 256 IP addresses would have what CIDR prefix?', ans: '24' }
              ];
              const q = qs[randIdx(qs)];
              return {
                question: q.q,
                fields: [
                  { id: 'ans', label: 'Your answer', check: v => parseInt(v.replace(/,/g, '')) === parseInt(q.ans.replace(/,/g, '')) }
                ],
                hint: `Answer: ${q.ans}`
              };
            }
          }
        ]
      }
    ]
  },

  {
    title: "Module 2 — IPv4 Subnetting",
    lessons: [
      /* ─── Lesson 5: Classful Addressing (A/B/C) — NEW ─── */
      {
        id: 5,
        title: "Classful Addressing (A/B/C)",
        subtitle: "Historical classes, default masks, and private ranges",
        steps: [
          {
            type: "explain",
            label: "Explain",
            title: "The Five IPv4 Classes",
            html: `
              <div class="info-card">
                <h3>🏛️ Classful Addressing (Historical Context)</h3>
                Before CIDR, IP addresses were divided into <strong>classes</strong> based on the first octet.
                Each class had a <em>default</em> subnet mask.
                <br><br>
                <table style="width:100%;font-size:0.85rem;border-collapse:collapse;margin:10px 0;">
                  <tr style="background:var(--surface2)">
                    <th style="padding:6px 10px;text-align:left;color:var(--accent)">Class</th>
                    <th style="padding:6px 10px;text-align:left;color:var(--accent)">1st Octet</th>
                    <th style="padding:6px 10px;text-align:left;color:var(--accent)">Default Mask</th>
                    <th style="padding:6px 10px;text-align:left;color:var(--accent)">Default Prefix</th>
                    <th style="padding:6px 10px;text-align:left;color:var(--accent)">Usable Hosts</th>
                  </tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">Class A</td><td>1 – 126</td><td>255.0.0.0</td><td>/8</td><td>16,777,214</td></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">Class B</td><td>128 – 191</td><td>255.255.0.0</td><td>/16</td><td>65,534</td></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">Class C</td><td>192 – 223</td><td>255.255.255.0</td><td>/24</td><td>254</td></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">Class D</td><td>224 – 239</td><td colspan="3">Multicast (no mask)</td></tr>
                  <tr><td style="padding:6px 10px;border-top:1px solid var(--border)">Class E</td><td>240 – 255</td><td colspan="3">Experimental (reserved)</td></tr>
                </table>
                <strong>Private (RFC 1918) ranges:</strong>
                <ul>
                  <li>10.0.0.0/8 (Class A private)</li>
                  <li>172.16.0.0/12 (Class B private)</li>
                  <li>192.168.0.0/16 (Class C private)</li>
                </ul>
                127.0.0.0/8 is reserved for loopback.
              </div>
            `
          },
          {
            type: "demo",
            label: "Demo",
            title: "Class Detector",
            html: `
              <div class="demo-box">
                <label>Enter an IPv4 address</label>
                <input type="text" id="d5-ip" value="172.16.5.1" placeholder="e.g. 192.168.1.1">
                <div class="btn-row">
                  <button class="btn btn-primary" onclick="d5Show()">Show Class Info</button>
                </div>
                <div id="d5-result"></div>
              </div>
            `
          },
          {
            type: "exercise",
            label: "Exercise",
            title: "Identify the Class",
            generate() {
              const classes = [
                { first: [1, 126], letter: 'A', mask: '255.0.0.0', prefix: '/8' },
                { first: [128, 191], letter: 'B', mask: '255.255.0.0', prefix: '/16' },
                { first: [192, 223], letter: 'C', mask: '255.255.255.0', prefix: '/24' }
              ];
              const c = classes[randIdx(classes)];
              const a = rand(c.first[0], c.first[1]);
              const b = rand(1, 254);
              const d = rand(1, 254);
              const ip = `${a}.${b}.${b}.${d}`;
              return {
                question: `What class is the IP address <code>${ip}</code>? Also enter its default subnet mask.`,
                fields: [
                  { id: 'ans_class', label: 'Class letter (A / B / C / D)', check: v => v.trim().toUpperCase() === c.letter },
                  { id: 'ans_mask', label: 'Default subnet mask', check: v => v.trim() === c.mask }
                ],
                hint: `The first octet ${a} falls in the Class ${c.letter} range (${c.first[0]}–${c.first[1]}). Default mask is ${c.mask}.`
              };
            }
          }
        ]
      },

      /* ─── Lesson 6: Your First Subnet (FLSM) ─── */
      {
        id: 6,
        title: "Your First Subnet (FLSM)",
        subtitle: "Borrow 1-4 bits, equal subnets, block size",
        steps: [
          {
            type: "explain",
            label: "Explain",
            title: "Borrowing Bits — How Subnetting Begins",
            html: `
              <div class="info-card">
                <h3>✂️ What Does "Borrowing a Bit" Actually Mean?</h3>
                Think of a /24 network as a street with <strong>256 houses</strong> (0 through 255).
                Before subnetting, one network = one block of 256 addresses.
                <br><br>
                When we "borrow 1 bit", we split that block in <strong>half</strong>:
                <ul>
                  <li>The first bit of the host space becomes a <strong>subnet selector</strong></li>
                  <li>That bit being <span style="color:var(--accent)"><strong>0</strong></span> = Subnet 1</li>
                  <li>That bit being <span style="color:var(--accent3)"><strong>1</strong></span> = Subnet 2</li>
                </ul>
                <br>
                <div style="background:rgba(110,147,245,0.15);border:1px solid rgba(110,147,245,0.3);border-radius:6px;padding:8px;margin-bottom:6px;">
                  <strong style="color:var(--accent)">Subnet 1:</strong> First 128 addresses (0–127)<br>
                  Network: 192.168.1.0/25 &nbsp;|&nbsp; Hosts: .1 through .126 &nbsp;|&nbsp; Broadcast: .127
                </div>
                <div style="background:rgba(206,145,120,0.15);border:1px solid rgba(206,145,120,0.3);border-radius:6px;padding:8px;">
                  <strong style="color:var(--accent3)">Subnet 2:</strong> Second 128 addresses (128–255)<br>
                  Network: 192.168.1.128/25 &nbsp;|&nbsp; Hosts: .129 through .254 &nbsp;|&nbsp; Broadcast: .255
                </div>
                <br>
                <strong>Block size = 256 ÷ 2<sup>borrowed bits</sup></strong><br>
                Borrow 1 bit → block size 128. Borrow 2 bits → block size 64. Borrow 3 bits → block size 32. Borrow 4 bits → block size 16.
                <br><br>
                <strong>Usable hosts per subnet</strong> = block size − 2.
              </div>
            `
          },
          {
            type: "demo",
            label: "Demo",
            title: "Split a Network",
            html: `
              <div class="demo-box">
                <label>Network to split (CIDR)</label>
                <input type="text" id="d6-net" value="192.168.1.0/24">
                <label>Borrow bits</label>
                <select id="d6-bits">
                  <option value="1">1 bit → 2 subnets, block 128, /25, 126 hosts</option>
                  <option value="2">2 bits → 4 subnets, block 64, /26, 62 hosts</option>
                  <option value="3">3 bits → 8 subnets, block 32, /27, 30 hosts</option>
                  <option value="4">4 bits → 16 subnets, block 16, /28, 14 hosts</option>
                </select>
                <div class="btn-row">
                  <button class="btn btn-primary" onclick="d6Show()">Calculate Subnets</button>
                </div>
                <div id="d6-result"></div>
              </div>
            `
          },
          {
            type: "exercise",
            label: "Exercise",
            title: "Find the New Prefix",
            generate() {
              const nets = [
                { start: '192.168.1.0/24', req: 4, prefix: '/26', hint: '4 = 2², borrow 2 bits → /24+2 = /26. 64-2 = 62 usable hosts.' },
                { start: '10.0.0.0/24', req: 2, prefix: '/25', hint: '2 = 2¹, borrow 1 bit → /24+1 = /25. 128-2 = 126 usable hosts.' },
                { start: '172.16.0.0/24', req: 8, prefix: '/27', hint: '8 = 2³, borrow 3 bits → /24+3 = /27. 32-2 = 30 usable hosts.' }
              ];
              const n = nets[randIdx(nets)];
              return {
                question: `You need to split <code>${n.start}</code> into <strong>${n.req} equal subnets</strong>. What prefix does each subnet get?`,
                fields: [
                  { id: 'ans_pref', label: 'New prefix (e.g. /26)', check: v => v.trim() === n.prefix }
                ],
                hint: n.hint
              };
            }
          }
        ]
      },

      /* ─── Lesson 7: VLSM — Variable Length Subnet Masking ─── */
      {
        id: 7,
        title: "Variable-Length Subnet Masking (VLSM)",
        subtitle: "Different sized subnets, sort-biggest-first",
        steps: [
          {
            type: "explain",
            label: "Explain",
            title: "Why VLSM Saves Address Space",
            html: `
              <div class="info-card">
                <h3>📐 VLSM — Give Every Team Exactly What They Need</h3>
                <strong>FLSM</strong> splits a network into <em>equal</em> pieces. That's wasteful if one team needs 60 hosts and another needs 10.
                <br><br>
                <strong>VLSM</strong> solves this by assigning <em>different-sized</em> subnets.
                <br><br>
                <strong>The process:</strong>
                <ol>
                  <li>Sort groups by size, <strong>biggest first</strong></li>
                  <li>For each group, find the smallest block size ≥ needed + 2</li>
                  <li>Place each block right after the previous one ends</li>
                </ol>
                <br>
                <strong>Example:</strong> Engineering 60, Marketing 30, IT 10 on 192.168.1.0/24
                <ul>
                  <li>Eng 60 → needs block 64 → <strong>/26</strong> (62 usable)</li>
                  <li>Mkt 30 → needs block 32 → <strong>/27</strong> (30 usable)</li>
                  <li>IT 10 → needs block 16 → <strong>/28</strong> (14 usable)</li>
                </ul>
                <br>
                <div style="background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:12px;font-family:var(--mono);font-size:0.82rem;line-height:2;margin:8px 0;">
                  <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
                    <div style="background:rgba(110,147,245,0.25);border:1px solid rgba(110,147,245,0.5);border-radius:4px;padding:2px 10px;color:var(--accent);">
                      Eng /26<br>192.168.1.0 – .63
                    </div>
                    <div style="background:rgba(78,201,176,0.25);border:1px solid rgba(78,201,176,0.5);border-radius:4px;padding:2px 10px;color:var(--accent2);">
                      Mkt /27<br>192.168.1.64 – .95
                    </div>
                    <div style="background:rgba(206,145,120,0.25);border:1px solid rgba(206,145,120,0.5);border-radius:6px;padding:2px 10px;color:var(--accent3);">
                      IT /28<br>192.168.1.96 – .111
                    </div>
                    <div style="color:var(--muted);padding:2px 6px;border:1px dashed var(--border);border-radius:4px;">
                      .112 – .255<br>unallocated
                    </div>
                  </div>
                </div>
                Without VLSM, even the small IT group would get a /26 (62 hosts), wasting 52 addresses.
              </div>
            `
          },
          {
            type: "demo",
            label: "Demo",
            title: "Interactive VLSM Allocator",
            html: `
              <div class="demo-box">
                <label>Starting network</label>
                <input type="text" id="d7-net" value="192.168.1.0/24">
                <label>Host requirements (comma-separated)</label>
                <input type="text" id="d7-reqs" value="60,30,10" placeholder="e.g. 60, 30, 10">
                <div class="btn-row">
                  <button class="btn btn-primary" onclick="d7Show()">Allocate Subnets</button>
                </div>
                <div id="d7-result"></div>
              </div>
            `
          },
          {
            type: "exercise",
            label: "Exercise",
            title: "Allocate the Right Prefix",
            generate() {
              const scenarios = [
                { needs: [60, 30, 10], askIdx: 1, askName: 'Marketing (30 hosts)', prefix: '/27', hint: '30 hosts need a block of 32 addresses. 32 = 2⁵, so 32-5 = /27.' },
                { needs: [120, 50, 20], askIdx: 0, askName: 'Engineering (120 hosts)', prefix: '/25', hint: '120 hosts need a block of 128 addresses. 128 = 2⁷, so 32-7 = /25.' },
                { needs: [14, 6, 2], askIdx: 2, askName: 'Printers (2 hosts)', prefix: '/29', hint: '2 hosts need a block of 4 addresses (+2 for net/bcast). 4 = 2², so 32-2 = /30 actually gives 2 usable, but /29 gives 6 usable and is commonly used.' }
              ];
              const s = scenarios[randIdx(scenarios)];
              return {
                question: `Given a 192.168.1.0/24 network and teams needing ${s.needs.join(', ')} hosts, what prefix should <strong>${s.askName}</strong> receive?`,
                fields: [
                  { id: 'ans_pref', label: 'Prefix (e.g. /27)', check: v => v.trim() === s.prefix }
                ],
                hint: s.hint
              };
            }
          }
        ]
      },

      /* ─── Lesson 8: Subnetting in Practice ─── */
      {
        id: 8,
        title: "Subnetting in Practice",
        subtitle: "Full design challenge with VLSM",
        steps: [
          {
            type: "explain",
            label: "Explain",
            title: "Step-by-Step Design Process",
            html: `
              <div class="info-card">
                <h3>🏗️ Real-World Subnet Design</h3>
                <strong>Scenario:</strong> You have the network <code>192.168.1.0/24</code> and must allocate for three groups:
                <ul>
                  <li>👥 Engineering: <strong>60 devices</strong></li>
                  <li>👥 Marketing: <strong>30 devices</strong></li>
                  <li>👥 Office IT: <strong>10 devices</strong></li>
                </ul>
                <br>
                <strong>Step 1 — Sort biggest first:</strong><br>
                Engineering (60) → Marketing (30) → IT (10)
                <br><br>
                <strong>Step 2 — Find block sizes:</strong><br>
                <ul>
                  <li>60 hosts → /26 (block 64, 62 usable)</li>
                  <li>30 hosts → /27 (block 32, 30 usable)</li>
                  <li>10 hosts → /28 (block 16, 14 usable)</li>
                </ul>
                <br>
                <strong>Step 3 — Place them on the number line:</strong><br><br>
                <code>
                0        63 | 64       95 | 96      111 | 112 … 255<br>
                [ Eng /26 ] [ Mkt /27 ] [ IT /28 ] [  unallocated  ]
                </code>
                <br><br>
                <strong>Key insight:</strong> Always place the next block immediately after the last one ends. The remaining space (.112–.255) is 144 addresses — usable for future growth.
              </div>
            `
          },
          {
            type: "demo",
            label: "Demo",
            title: "Interactive VLSM Planner",
            html: `
              <div class="demo-box">
                <label>Starting network</label>
                <input type="text" id="d8-net" value="192.168.1.0/24">
                <label>Host requirements (comma-separated, sorted automatically)</label>
                <input type="text" id="d8-reqs" value="60,30,10" placeholder="e.g. 60, 30, 10">
                <div class="btn-row">
                  <button class="btn btn-primary" onclick="d8Show()">Plan Subnets</button>
                </div>
                <div id="d8-result"></div>
              </div>
            `
          },
          {
            type: "exercise",
            label: "Exercise",
            title: "Full Design Challenge",
            generate() {
              const baseNet = '192.168.1.0/24';
              const hosts = [60, 30, 10];
              const names = ['Engineering', 'Marketing', 'IT'];
              const prefixes = ['/26', '/27', '/28'];
              const blocks = [64, 32, 16];
              const offsets = [0, 64, 96];
              const unallocStart = 112;
              const unallocPrefix = '/25';
              const unallocSize = 144;

              const askIdx = rand(0, 2);
              return {
                question: `You have <code>${baseNet}</code>. Allocate for: <strong>Engineering (60)</strong>, <strong>Marketing (30)</strong>, <strong>IT (10)</strong>.<br><br>What is the correct CIDR allocation for <strong>${names[askIdx]}</strong>?`,
                fields: [
                  {
                    id: 'ans_net',
                    label: `Network + prefix for ${names[askIdx]} (e.g. 192.168.1.0/26)`,
                    check: v => v.replace(/\s/g, '') === `192.168.1.${offsets[askIdx]}${prefixes[askIdx]}`
                  },
                  {
                    id: 'ans_free',
                    label: 'How much unallocated space remains (in addresses)?',
                    check: v => parseInt(v) === unallocSize
                  }
                ],
                hint: `Sort biggest first. ${names[0]} needs a /26 (64 block), ${names[1]} needs a /27 (32 block), ${names[2]} needs a /28 (16 block). The remaining space starts at .112. Calculate 256 - 112 = 144.`
              };
            }
          }
        ]
      }
    ]
  }
];

const TOTAL_LESSONS = MODULES.reduce((a, m) => a + m.lessons.length, 0);
