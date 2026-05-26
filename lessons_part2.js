const MODULES = [
  {
    name: "Module 3 — Supernetting & Aggregation",
    lessons: [
      {
        title: "Lesson 9: What is Supernetting?",
        steps: [
          {
            type: "explain",
            html: `<div class="info-card">
  <h3>What is Supernetting?</h3>
  <p>Supernetting (or <strong>route aggregation</strong>) is the opposite of subnetting. Instead of dividing a network into smaller pieces, we <strong>combine</strong> multiple contiguous networks into one larger network.</p>
  <p>This reduces routing table size — instead of advertising 4 separate /24 routes, an ISP can advertise one /22 route.</p>
  <h4>Two Rules for Supernetting</h4>
  <ul>
    <li><strong>Contiguous:</strong> The networks must be adjacent in address space (e.g., 192.168.0.0/24, 192.168.1.0/24, 192.168.2.0/24, 192.168.3.0/24).</li>
    <li><strong>Power of 2:</strong> You must combine exactly 2, 4, 8, 16, etc. networks (a power of 2).</li>
  </ul>
  <h4>How the Mask Works</h4>
  <p>When you combine networks, the supernet mask moves <strong>left</strong> (fewer prefix bits):</p>
  <ul>
    <li>Combine 2 × /24 → /23 (1 bit borrowed back)</li>
    <li>Combine 4 × /24 → /22 (2 bits borrowed back)</li>
    <li>Combine 8 × /24 → /21 (3 bits borrowed back)</li>
  </ul>
  <p>In the binary view, the borrowed bits become part of the <strong>network</strong> portion again.</p>
  <h4>Example: 4 × /24 → /22</h4>
  <p>192.168.0.0/24 through 192.168.3.0/24 combine into 192.168.0.0/22</p>
  <pre style="background:#111;padding:10px;border-radius:6px;margin-top:8px;">192.168.0.0 = 11000000.10101000.000000<strong>00</strong>.00000000
192.168.1.0 = 11000000.10101000.000000<strong>01</strong>.00000000
192.168.2.0 = 11000000.10101000.000000<strong>10</strong>.00000000
192.168.3.0 = 11000000.10101000.000000<strong>11</strong>.00000000

                   Prefix bits (network)  ---  Host bits
                   /22 means the first 22 bits are network
The last 2 bits of the 3rd octet vary, so they are now host bits.</pre>
</div>`
          },
          {
            type: "demo",
            title: "Supernet Calculator",
            html: `<div class="demo-box">
  <h4>Supernet Calculator</h4>
  <p>Enter the <strong>first</strong> network, number of networks to combine, and their current prefix:</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
    <label>Start Network:<br><input id="d9-start" value="192.168.0.0" style="width:140px;"/></label>
    <label>Count:<br>
      <select id="d9-count" style="width:80px;">
        <option value="2">2</option>
        <option value="4" selected>4</option>
        <option value="8">8</option>
        <option value="16">16</option>
      </select>
    </label>
    <label>Current Prefix:/<br>
      <select id="d9-prefix" style="width:80px;">
        <option value="24" selected>24</option>
        <option value="25">25</option>
        <option value="26">26</option>
      </select>
    </label>
    <button onclick="d9Show()">Show Supernet</button>
  </div>
  <div id="d9-result" style="margin-top:12px;"></div>
</div>
<script>
function d9Show(){
  const start = document.getElementById('d9-start').value.trim();
  const count = parseInt(document.getElementById('d9-count').value);
  const prefix = parseInt(document.getElementById('d9-prefix').value);
  const out = document.getElementById('d9-result');
  if (!start) { out.innerHTML = '<p style="color:red">Please enter a start network.</p>'; return; }
  const bits = Math.log2(count);
  if (!Number.isInteger(bits)) { out.innerHTML = '<p style="color:red">Count must be a power of 2.</p>'; return; }
  const newPrefix = prefix - bits;
  if (newPrefix < 0) { out.innerHTML = '<p style="color:red">Cannot supernet below /0.</p>'; return; }
  let parts = start.split('.');
  if (parts.length !== 4) { out.innerHTML = '<p style="color:red">Invalid IPv4 address.</p>'; return; }
  let firstOct = parseInt(parts[0]), secOct = parseInt(parts[1]), thirdOct = parseInt(parts[2]), fourthOct = parseInt(parts[3]);
  if ([firstOct,secOct,thirdOct,fourthOct].some(isNaN)) { out.innerHTML = '<p style="color:red">Invalid IPv4 address.</p>'; return; }
  const totalHosts = Math.pow(2, 32 - newPrefix);
  const mask = 0xFFFFFFFF ^ (totalHosts - 1);
  const maskOct = [(mask>>>24)&255, (mask>>>16)&255, (mask>>>8)&255, mask&255].join('.');

  if (newPrefix >= 24) {
    let align = Math.pow(2, 32 - prefix);
    const block = Math.pow(2, 32 - newPrefix);
    let base = (firstOct<<24)|(secOct<<16)|(thirdOct<<8)|fourthOct;
    base = Math.floor(base / block) * block;
    firstOct = (base>>>24)&255; secOct = (base>>>16)&255; thirdOct = (base>>>8)&255; fourthOct = base&255;
  } else if (newPrefix >= 16) {
    const block = Math.pow(2, 32 - newPrefix);
    let base = (firstOct<<24)|(secOct<<16)|(thirdOct<<8)|fourthOct;
    base = Math.floor(base / block) * block;
    firstOct = (base>>>24)&255; secOct = (base>>>16)&255; thirdOct = (base>>>8)&255; fourthOct = base&255;
  }
  const supernet = [firstOct, secOct, thirdOct, fourthOct].join('.') + '/' + newPrefix;
  out.innerHTML = '<p><strong>Supernet:</strong> ' + supernet + '</p><p><strong>Subnet Mask:</strong> ' + maskOct + '</p><p><strong>Total hosts:</strong> ' + totalHosts.toLocaleString() + '</p>';
}
</script>`
          },
          {
            type: "exercise",
            title: "Find the Supernet",
            generate: () => {
              const count = [2,4,8][rand(0,2)];
              const prefix = 24;
              const baseThird = rand(0, 255 - count + 1);
              const base = [192,168,baseThird,0].join('.');
              const nets = [];
              for (let i=0;i<count;i++) nets.push([192,168,baseThird+i,0].join('.')+'/'+prefix);
              return {
                question: `Which supernet covers these ${count} networks?<br><br>${nets.join('<br>')}`,
                fields: [{id:'sup-cidr', label:'Supernet CIDR', check:(v)=>{
                  const bits = Math.log2(count);
                  const newPrefix = prefix - bits;
                  const ans = '192.168.'+baseThird+'.0/'+newPrefix;
                  return v.trim() === ans;
                }}],
                hint: `When combining ${count} /${prefix} networks, the prefix becomes /${prefix - Math.log2(count)}. Use zero for the part that will become host bits.`,
                answer: '192.168.'+baseThird+'.0/'+(prefix - Math.log2(count))
              };
            }
          }
        ]
      },
      {
        title: "Lesson 10: Supernetting Challenge & Wildcard Masks",
        steps: [
          {
            type: "explain",
            html: `<div class="info-card">
  <h3>Supernetting in the Real World (ISPs)</h3>
  <p>Imagine an ISP has 64 customers, each with a /24. Advertising 64 routes to the backbone is wasteful. Instead, the ISP advertises one /18 that covers all 64 /24s.</p>
  <p>This is the core idea of <strong>Classless Inter-Domain Routing (CIDR)</strong> — the backbone internet runs on aggregation.</p>
  <h3>Wildcard Masks</h3>
  <p>A wildcard mask is the <strong>inverse</strong> of a subnet mask. It tells you which bits of the address to <strong>ignore</strong> (1 = don't care, 0 = must match). Wildcard masks are used heavily in Cisco ACLs (Access Control Lists):</p>
  <pre style="background:#111;padding:10px;border-radius:6px;margin-top:8px;">Subnet Mask:  255.255.255.0   = 00000000.00000000.00000000.11111111
Wildcard:     0.0.0.255       = 11111111.11111111.11111111.00000000</pre>
  <p>ACL example: <code>permit 192.168.1.0 0.0.0.255</code> matches <strong>any</strong> 192.168.1.x address.</p>
  <p>Unlike a subnet mask, a wildcard mask does <strong>not</strong> have to be contiguous. You could wildcard odd bits, but in practice they almost always are.</p>
</div>`
          },
          {
            type: "demo",
            title: "ISP Pool Allocator",
            html: `<div class="demo-box">
  <h4>ISP Pool Allocator</h4>
  <p>Given an ISP pool CIDR, how big a block do you need for N hosts?</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
    <label>Pool CIDR:<br><input id="d10-pool" value="172.16.0.0/20" style="width:160px;"/></label>
    <label>Needed IPs:<br><input id="d10-need" value="500" style="width:100px;"/></label>
    <button onclick="d10Show()">Allocate</button>
  </div>
  <div id="d10-result" style="margin-top:12px;"></div>
</div>
<script>
function d10Show(){
  const pool = document.getElementById('d10-pool').value.trim();
  const need = parseInt(document.getElementById('d10-need').value);
  const out = document.getElementById('d10-result');
  if (!pool || isNaN(need) || need < 2) { out.innerHTML = '<p style="color:red">Invalid input.</p>'; return; }
  const [ipPart, prefStr] = pool.split('/');
  if (!prefStr) { out.innerHTML = '<p style="color:red">Enter a CIDR (e.g., 172.16.0.0/20).</p>'; return; }
  const poolPref = parseInt(prefStr);
  const poolHosts = Math.pow(2, 32 - poolPref);
  let reqHosts = 2;
  while (reqHosts - 2 < need) reqHosts *= 2;
  const reqPrefix = 32 - Math.log2(reqHosts);
  const mask = 0xFFFFFFFF ^ (reqHosts - 1);
  const maskOct = [(mask>>>24)&255, (mask>>>16)&255, (mask>>>8)&255, mask&255].join('.');
  const wildcardOct = [(~mask>>>24)&255, (~mask>>>16)&255, (~mask>>>8)&255, (~mask)&255].join('.');
  let ips = ipPart.split('.');
  if (ips.length !== 4) { out.innerHTML = '<p style="color:red">Invalid pool address.</p>'; return; }
  let base = (parseInt(ips[0])<<24)|(parseInt(ips[1])<<16)|(parseInt(ips[2])<<8)|parseInt(ips[3]);
  base = base & (0xFFFFFFFF ^ (poolHosts - 1));
  out.innerHTML = '<p><strong>Required block:</strong> ' + pool + ' → allocate a /' + reqPrefix + ' within this pool</p>' +
                  '<p><strong>Wildcard mask:</strong> ' + wildcardOct + '</p>' +
                  '<p><strong>Hosts in block:</strong> ' + reqHosts.toLocaleString() + ' (usable: ' + (reqHosts-2).toLocaleString() + ')</p>' +
                  '<p><strong>Pool utilization:</strong> ' + ((reqHosts/poolHosts)*100).toFixed(1) + '%</p>';
}
</script>`
          },
          {
            type: "exercise",
            title: "Wildcard Mask Challenge",
            generate: () => {
              const third = rand(1,254);
              const match = [192,168,third,rand(0,255)].join('.');
              const wc = [0,0,0,255];
              const choices = [];
              while (choices.length < 3) {
                const newThird = rand(0,255);
                if (newThird !== third) choices.push([192,168,newThird,rand(0,255)].join('.'));
              }
              choices.splice(rand(0,2), 0, match);
              const lines = choices.map((c, i) => `${String.fromCharCode(65+i)}) ${c}`).join('<br>');
              return {
                question: `Given the ACL rule: access-list 10 permit 192.168.${third}.0 0.0.0.255<br><br>Which of these IPs would MATCH?<br><br>${lines}`,
                fields: [{id:'wc-match', label:'Answer (A/B/C/D)', check:(v)=>{
                  return v.trim().toUpperCase() === String.fromCharCode(65 + choices.indexOf(match));
                }}],
                hint: 'Wildcard 0.0.0.255 means: first 3 octets must match exactly, last octet can be anything (0-255).',
                answer: String.fromCharCode(65 + choices.indexOf(match))
              };
            }
          }
        ]
      }
    ]
  },
  {
    name: "Module 4 — IPv6",
    lessons: [
      {
        title: "Lesson 11: IPv6 Address Anatomy",
        steps: [
          {
            type: "explain",
            html: `<div class="info-card">
  <h3>IPv6 Address Anatomy</h3>
  <p>IPv6 addresses are 128 bits long — four times larger than IPv4. They are written as <strong>8 hextets</strong> of 4 hex digits, separated by colons:</p>
  <pre style="background:#111;padding:10px;border-radius:6px;margin-top:8px;">2001:0db8:85a3:0000:0000:8a2e:0370:7334</pre>
  <h4>Shortening Rules</h4>
  <ul>
    <li><strong>Leading zeros can be dropped</strong> within each hextet: 0db8 → db8, 0370 → 370.</li>
    <li><strong>One :: (double colon) per address</strong> can replace one or more all-zero hextets. It <strong>cannot</strong> be used twice in the same address.</li>
  </ul>
  <p>Shortened:</p>
  <pre style="background:#111;padding:10px;border-radius:6px;margin-top:8px;">2001:db8:85a3::8a2e:370:7334</pre>
  <h4>Address Structure</h4>
  <p>A typical global unicast address is structured as:</p>
  <pre style="background:#111;padding:10px;border-radius:6px;margin-top:8px;">|     48 bits     | 16 bits  |      64 bits       |
|  Global Prefix  | SubnetID |    Interface ID    |
   (from ISP)                  (device identifier)</pre>
  <p>The /48 global prefix is common from ISPs, leaving 16 bits (one hextet) for subnets.</p>
</div>`
          },
          {
            type: "demo",
            title: "IPv6 Expander",
            html: `<div class="demo-box">
  <h4>IPv6 Expander</h4>
  <p>Enter a compressed IPv6 address to see its full form and classification:</p>
  <label>Compressed IPv6:<br><input id="d11-ip" value="2001:db8:85a3::8a2e:370:7334" style="width:320px;"/></label>
  <button onclick="d11Show()">Expand</button>
  <div id="d11-result" style="margin-top:12px;"></div>
</div>
<script>
function d11Show(){
  let ip = document.getElementById('d11-ip').value.trim().toLowerCase();
  const out = document.getElementById('d11-result');
  if (!ip) { out.innerHTML = '<p style="color:red">Enter an IPv6 address.</p>'; return; }
  let parts = ip.split('::');
  if (parts.length > 2) { out.innerHTML = '<p style="color:red">Invalid: more than one :: in address.</p>'; return; }
  let hextets = [];
  if (parts.length === 2) {
    let left = parts[0] ? parts[0].split(':') : [];
    let right = parts[1] ? parts[1].split(':') : [];
    let zeros = 8 - (left.length + right.length);
    if (zeros < 0) { out.innerHTML = '<p style="color:red">Invalid: too many hextets.</p>'; return; }
    hextets = left.concat(Array(zeros).fill('0000')).concat(right);
  } else {
    hextets = parts[0].split(':');
    if (hextets.length !== 8) { out.innerHTML = '<p style="color:red">Invalid hextet count.</p>'; return; }
  }
  const full = hextets.map(h => ('0000' + h).slice(-4)).join(':');
  const globalPrefix = full.substring(0, 19) + '::/48';
  let type = 'Global Unicast';
  if (full.startsWith('fe8')) type = 'Link-Local';
  else if (full.startsWith('ff')) type = 'Multicast';
  else if (full === '0000:0000:0000:0000:0000:0000:0000:0001') type = 'Loopback (::1)';
  out.innerHTML = '<p><strong>Full form:</strong> ' + full + '</p>' +
                  '<p><strong>Global prefix:</strong> ' + globalPrefix + '</p>' +
                  '<p><strong>Type:</strong> ' + type + '</p>';
}
</script>`
          },
          {
            type: "exercise",
            title: "Expand and Classify IPv6",
            generate: () => {
              const prefixes = ['2001:db8','2001:abcd','2404:6800','2606:4700'];
              const pre = prefixes[rand(0,3)];
              const parts = [pre];
              for (let i=0;i<3;i++) parts.push(('000'+rand(0,4095).toString(16)).slice(-4));
              const zeroPos = rand(1,5);
              parts.splice(zeroPos, 0, '0000');
              parts.splice(zeroPos+1, 0, '0000');
              let full = parts.map(h => ('0000'+h).slice(-4));
              const fullStr = full.join(':');
              let shortParts = [];
              let zeroRun = false;
              for (let i=0;i<8;i++) {
                if (i===zeroPos) { zeroRun = true; continue; }
                if (i===zeroPos+1) { zeroRun = false; continue; }
                shortParts.push(full[i].replace(/^0+/,'') || '0');
              }
              const short = shortParts.slice(0,zeroPos).join(':') + '::' + shortParts.slice(zeroPos).join(':');
              let type = 'Global Unicast';
              if (fullStr.startsWith('fe8')) type = 'Link-Local';
              return {
                question: `Expand and classify this compressed IPv6 address:<br><br><code>${short}</code>`,
                fields: [
                  {id:'d11-full', label:'Full expanded form', check:(v)=> v.trim().toLowerCase() === fullStr.toLowerCase() },
                  {id:'d11-type', label:'Address type', check:(v)=> v.trim().toLowerCase() === type.toLowerCase() }
                ],
                hint: 'Restore leading zeros in every hextet. Replace :: with the correct number of 0000 hextets. Total must be 8 hextets.',
                answer: fullStr + ' — ' + type
              };
            }
          }
        ]
      },
      {
        title: "Lesson 12: IPv6 Address Types",
        steps: [
          {
            type: "explain",
            html: `<div class="info-card">
  <h3>IPv6 Address Types</h3>
  <table style="width:100%;border-collapse:collapse;margin-top:8px;">
    <tr style="background:#222;"><th>Type</th><th>Prefix</th><th>Scope / Use Case</th></tr>
    <tr><td><strong>Global Unicast</strong></td><td>2000::/3</td><td>Routable addresses (like public IPv4). Assigned by ISPs/RIRs.</td></tr>
    <tr style="background:#1a1a1a;"><td><strong>Link-Local</strong></td><td>FE80::/10</td><td>Auto-assigned on every interface. Used for Neighbor Discovery, only on local link.</td></tr>
    <tr><td><strong>Loopback</strong></td><td>::1/128</td><td>Same as 127.0.0.1 in IPv4. Always points to local machine.</td></tr>
    <tr style="background:#1a1a1a;"><td><strong>Multicast</strong></td><td>FF00::/8</td><td>One-to-many. Replaces broadcast in IPv4.</td></tr>
    <tr><td><strong>Unique Local</strong></td><td>FC00::/7</td><td>Private addresses (like 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16). Not globally routable.</td></tr>
    <tr style="background:#1a1a1a;"><td><strong>Anycast</strong></td><td>Same as unicast</td><td>One-to-nearest. Same address assigned to multiple interfaces; routing delivers to closest.</td></tr>
  </table>
  <p>Notice: IPv6 has <strong>no broadcast</strong>. Broadcast functionality is replaced by multicast groups (e.g., FF02::1 for “all nodes”).</p>
</div>`
          },
          {
            type: "demo",
            title: "IPv6 Type Identifier",
            html: `<div class="demo-box">
  <h4>IPv6 Type Identifier</h4>
  <label>IPv6 Address:<br><input id="d12-ip" value="fe80::1" style="width:320px;"/></label>
  <button onclick="d12Show()">Identify</button>
  <div id="d12-result" style="margin-top:12px;"></div>
</div>
<script>
function d12Show(){
  let ip = document.getElementById('d12-ip').value.trim().toLowerCase();
  const out = document.getElementById('d12-result');
  if (!ip) { out.innerHTML = '<p style="color:red">Enter an address.</p>'; return; }
  let parts = ip.split('::');
  let firstHex = '0000';
  if (parts.length === 1) { firstHex = parts[0].split(':')[0]; }
  else if (parts[0]) { firstHex = parts[0].split(':')[0]; }
  else { let right = parts[1].split(':'); firstHex = right[0]; }
  firstHex = ('0000' + firstHex).slice(-4);
  const nibble = parseInt(firstHex.substring(0,1), 16);
  let type = 'Global Unicast';
  let scope = 'Global';
  let usage = 'Publicly routable address assigned by ISP or RIR.';
  if (ip === '::1' || ip === '0000:0000:0000:0000:0000:0000:0000:0001') {
    type = 'Loopback'; scope = 'Local (host)'; usage = 'Always refers to the local host.';
  } else if (firstHex.startsWith('fe8') || firstHex.startsWith('fe9') || firstHex.startsWith('fea') || firstHex.startsWith('feb')) {
    type = 'Link-Local'; scope = 'Link local'; usage = 'Auto-assigned on every interface. Used for neighbor discovery and local-link routing.';
  } else if (nibble >= 14) {
    type = 'Multicast'; scope = 'Depends on flag/scope field'; usage = 'One-to-many delivery. Replaces IPv4 broadcast.';
  } else if (firstHex.startsWith('fc') || firstHex.startsWith('fd')) {
    type = 'Unique Local'; scope = 'Organization / Site'; usage = 'Private addressing, not routable on the public internet.';
  } else if (nibble >= 2 && nibble <= 3) {
    type = 'Global Unicast'; scope = 'Global'; usage = 'Routable public address (2000::/3 block).';
  }
  out.innerHTML = '<p><strong>Type:</strong> ' + type + '</p><p><strong>Scope:</strong> ' + scope + '</p><p><strong>Usage:</strong> ' + usage + '</p>';
}
</script>`
          },
          {
            type: "exercise",
            title: "Identify IPv6 Address Type",
            generate: () => {
              const types = [
                {name:'Global Unicast', ex:'2001:db8:1::1'},
                {name:'Link-Local', ex:'fe80::abc'+(rand(0,15)).toString(16)},
                {name:'Multicast', ex:'ff02::1:ffab:cdef'},
                {name:'Unique Local', ex:'fd00::1'},
                {name:'Loopback', ex:'::1'},
              ];
              const t = types[rand(0,4)];
              return {
                question: `What type of IPv6 address is this?<br><br><code>${t.ex}</code>`,
                fields: [{id:'d12-ans', label:'Address type', check:(v)=> v.trim().toLowerCase() === t.name.toLowerCase() }],
                hint: 'Check the first hextet (or first character). Remember: FE80::/10 = Link-Local, FF00::/8 = Multicast, FC00::/7 = Unique Local, ::1 = Loopback.',
                answer: t.name
              };
            }
          }
        ]
      },
      {
        title: "Lesson 13: IPv6 Subnetting",
        steps: [
          {
            type: "explain",
            html: `<div class="info-card">
  <h3>IPv6 Subnetting</h3>
  <p>IPv6 subnetting is much simpler than IPv4 because address space is abundant.</p>
  <h4>Standard Boundary: /64</h4>
  <p>Almost every LAN uses a /64. This means the first 64 bits are the network prefix, and the last 64 bits are the interface ID (host part). A /64 provides 2<sup>64</sup> interface IDs — about <strong>18 quintillion</strong> addresses per LAN.</p>
  <h4>Typical ISP Assignment: /48</h4>
  <p>Most ISPs hand out a /48 to an organization, leaving 16 bits (the 4th hextet) for subnetting:</p>
  <pre style="background:#111;padding:10px;border-radius:6px;margin-top:8px;">|  Global Prefix (48 bits)  | Subnet ID (16 bits) | Interface ID (64 bits) |
|      2001:db8:acad::      |        :1::         |      (host portion)    |

From /48 → /64: 64 − 48 = 16 subnet bits → 2^16 = 65,536 subnets</pre>
  <h4>Common Prefixes</h4>
  <ul>
    <li><strong>/128</strong> — single interface (loopback, host route)</li>
    <li><strong>/64</strong> — standard LAN subnet</li>
    <li><strong>/56</strong> — some ISPs give /56 (256 subnets)</li>
    <li><strong>/48</strong> — standard organizational allocation</li>
    <li><strong>/32</strong> — large ISP prefix</li>
  </ul>
</div>`
          },
          {
            type: "demo",
            title: "IPv6 Subnet Generator",
            html: `<div class="demo-box">
  <h4>IPv6 Subnet Generator</h4>
  <p>Enter a /48 prefix and generate N /64 subnets:</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
    <label>Organization Prefix:<br><input id="d13-prefix" value="2001:db8:acad::/48" style="width:220px;"/></label>
    <label>Number of /64s:<br><input id="d13-count" value="8" style="width:80px;"/></label>
    <button onclick="d13Show()">Generate</button>
  </div>
  <div id="d13-result" style="margin-top:12px;"></div>
</div>
<script>
function d13Show(){
  const prefix = document.getElementById('d13-prefix').value.trim();
  const count = parseInt(document.getElementById('d13-count').value);
  const out = document.getElementById('d13-result');
  if (!prefix || isNaN(count) || count < 1) { out.innerHTML = '<p style="color:red">Invalid input.</p>'; return; }
  const base = prefix.split('/')[0].toLowerCase();
  let parts = base.split(':');
  while (parts.length < 4) parts.push('0');
  let html = '<p><strong>Base prefix:</strong> ' + prefix + '</p><p><strong>Subnets (/64):</strong></p><ul>';
  for (let i=0; i<count && i<32; i++) {
    const subId = ('0000' + i.toString(16)).slice(-4);
    html += '<li>' + parts.slice(0,3).join(':') + ':' + subId + '::/64</li>';
  }
  if (count > 32) html += '<li>... (and ' + (count-32) + ' more)</li>';
  html += '</ul>';
  out.innerHTML = html;
}
</script>`
          },
          {
            type: "exercise",
            title: "IPv6 Subnet Member",
            generate: () => {
              const subnets = [1, 10, 50, 100, 200, 250];
              const subId = subnets[rand(0,5)];
              const ifc = rand(1,9999);
              const prefix = '2001:db8:acad';
              const addr = `${prefix}:${subId.toString(16)}::${ifc.toString(16)}`;
              return {
                question: `Which /64 subnet contains the address <code>${addr}</code> given the organization prefix <code>${prefix}::/48</code>?`,
                fields: [{id:'d13-sub', label:'Subnet prefix (/64)', check:(v)=>{
                  const ok = v.trim().toLowerCase() === `${prefix}:${subId.toString(16)}::/64`;
                  return ok;
                }}],
                hint: 'With a /48, the 4th hextet is the Subnet ID. Read it directly from the address.',
                answer: `${prefix}:${subId.toString(16)}::/64`
              };
            }
          }
        ]
      },
      {
        title: "Lesson 14: EUI-64 Interface IDs",
        steps: [
          {
            type: "explain",
            html: `<div class="info-card">
  <h3>EUI-64 Interface IDs</h3>
  <p>Instead of using DHCP (though it exists), IPv6 often auto-generates the bottom 64 bits of an address from the interface's <strong>MAC address</strong> using the <strong>EUI-64</strong> process.</p>
  <h4>Steps</h4>
  <ol>
    <li>Split the 48-bit MAC into two 24-bit halves.</li>
    <li>Insert <strong>FF:FE</strong> in the middle.</li>
    <li>Flip the <strong>7th bit</strong> (Universal/Local bit) of the first octet.</li>
  </ol>
  <h4>Example</h4>
  <pre style="background:#111;padding:10px;border-radius:6px;margin-top:8px;">MAC:        A4:83:E7:2B:CF:9C
Halves:     A4:83:E7         2B:CF:9C
Insert:     A4:83:E7:FF:FE:2B:CF:9C
Flip bit 7: A6:83:E7:FF:FE:2B:CF:9C  (A4 → A6)

IPv6 address with /64 prefix 2001:db8:acad:1::/64:
2001:db8:acad:1:A683:E7FF:FE2B:CF9C /64</pre>
  <p>The 7th-bit flip distinguishes globally unique addresses from locally assigned ones.</p>
</div>`
          },
          {
            type: "demo",
            title: "EUI-64 Generator",
            html: `<div class="demo-box">
  <h4>EUI-64 Generator</h4>
  <p>Convert a MAC address into an IPv6 EUI-64 Interface ID:</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
    <label>MAC Address:<br><input id="d14-mac" value="A4:83:E7:2B:CF:9C" style="width:160px;"/></label>
    <label>IPv6 Prefix (optional):<br><input id="d14-prefix" value="2001:db8:acad:1::" style="width:220px;"/></label>
    <button onclick="d14Show()">Generate</button>
  </div>
  <div id="d14-result" style="margin-top:12px;"></div>
</div>
<script>
function d14Show(){
  let mac = document.getElementById('d14-mac').value.trim().toLowerCase();
  let prefix = document.getElementById('d14-prefix').value.trim();
  const out = document.getElementById('d14-result');
  if (!mac) { out.innerHTML = '<p style="color:red">Enter a MAC address.</p>'; return; }
  mac = mac.replace(/[-.]/g, ':');
  let octets = mac.split(':');
  if (octets.length !== 6) { out.innerHTML = '<p style="color:red">MAC must have 6 octets.</p>'; return; }
  let bytes = octets.map(x => parseInt(x, 16));
  if (bytes.some(isNaN)) { out.innerHTML = '<p style="color:red">Invalid MAC octets.</p>'; return; }
  let step1 = bytes.slice(0,3).map(b => ('0x'+b.toString(16)).slice(-2)).join(':');
  let step2 = bytes.slice(3).map(b => ('0'+b.toString(16)).slice(-2)).join(':');
  bytes[0] ^= 0x02;
  let eui = bytes.slice(0,3).map(b => ('0'+b.toString(16)).slice(-2)).join('') +
            'fffe' +
            bytes.slice(3).map(b => ('0'+b.toString(16)).slice(-2)).join('');
  let formattedEui = eui.match(/.{1,4}/g).join(':');
  let html = '<p><strong>Step 1</strong> — Original halves: ' + step1 + ' + ' + step2 + '</p>';
  html += '<p><strong>Step 2</strong> — Insert FF:FE: ' + eui.substring(0,6) + ':' + eui.substring(6,10) + ':' + eui.substring(10) + '</p>';
  html += '<p><strong>Step 3</strong> — Flip U/L bit (7th bit): ' + formattedEui + '</p>';
  if (prefix) {
    prefix = prefix.replace(/::$/, '');
    html += '<p><strong>Full IPv6 address:</strong> ' + prefix + ':' + formattedEui + '</p>';
  }
  out.innerHTML = html;
}
</script>`
          },
          {
            type: "exercise",
            title: "EUI-64 from MAC",
            generate: () => {
              const hex = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
              const b1 = rand(0,255); const b2 = rand(0,255); const b3 = rand(0,255);
              const b4 = rand(0,255); const b5 = rand(0,255); const b6 = rand(0,255);
              const mac = [b1,b2,b3,b4,b5,b6].map(b => ('0'+b.toString(16)).slice(-2)).join(':');
              const flipped = b1 ^ 0x02;
              const eui = [flipped,b2,b3].map(b => ('0'+b.toString(16)).slice(-2)).join('') +
                          'fffe' +
                          [b4,b5,b6].map(b => ('0'+b.toString(16)).slice(-2)).join('');
              const formattedEui = eui.match(/.{1,4}/g).join(':');
              return {
                question: `What is the EUI-64 interface ID based on MAC <code>${mac}</code>?`,
                fields: [{id:'d14-eui', label:'EUI-64 Interface ID', check:(v)=>{
                  return v.trim().toLowerCase().replace(/[.:]/g,'') === eui.toLowerCase() ||
                         v.trim().toLowerCase() === formattedEui.toLowerCase();
                }}],
                hint: 'Split MAC into two halves, insert ff:fe in the middle, then flip the 7th bit of the first octet (XOR with 0x02).',
                answer: formattedEui
              };
            }
          }
        ]
      },
      {
        title: "Lesson 15: IPv6 Address Planning",
        steps: [
          {
            type: "explain",
            html: `<div class="info-card">
  <h3>IPv6 Address Planning</h3>
  <p>With IPv6, address planning is radically simpler than IPv4 because the address space is enormous.</p>
  <h4>Typical Allocation Chain</h4>
  <pre style="background:#111;padding:10px;border-radius:6px;margin-top:8px;">RIR (Regional Internet Registry) gets /32
  → ISP gets /48
    → Organization receives /48
      → Organization creates /64 per VLAN/department/floor</pre>
  <h4>Subnets from /48</h4>
  <p>A /48 leaves 16 bits for the Subnet ID (4th hextet). That means:</p>
  <ul>
    <li>From /48 → /64: 64 − 48 = <strong>16 subnet bits</strong></li>
    <li>Number of /64 subnets = <strong>2<sup>16</sup> = 65,536</strong></li>
  </ul>
  <p>No matter how many departments or floors you have, you almost never run out.</p>
  <h4>Address Naming Convention</h4>
  <p>Many organizations assign a meaning to the 4th hextet:</p>
  <ul>
    <li>:1::/64  → Servers</li>
    <li>:10::/64 → Floor 10</li>
    <li>:AB::/64 → Department AB</li>
  </ul>
  <p>Plan: <code>&lt;prefix&gt;:&lt;subnet&gt;::/64</code></p>
</div>`
          },
          {
            type: "demo",
            title: "IPv6 Allocation Planner",
            html: `<div class="demo-box">
  <h4>IPv6 Allocation Planner</h4>
  <p>Given an organization prefix and number of needed subnets, show the allocation plan:</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
    <label>Organization Prefix:<br><input id="d15-prefix" value="2001:db8:acad::/48" style="width:220px;"/></label>
    <label>Needed Subnets:<br><input id="d15-need" value="50" style="width:100px;"/></label>
    <button onclick="d15Show()">Plan</button>
  </div>
  <div id="d15-result" style="margin-top:12px;"></div>
</div>
<script>
function d15Show(){
  const prefix = document.getElementById('d15-prefix').value.trim();
  const need = parseInt(document.getElementById('d15-need').value);
  const out = document.getElementById('d15-result');
  if (!prefix || isNaN(need) || need < 1) { out.innerHTML = '<p style="color:red">Invalid input.</p>'; return; }
  const pref = prefix.split('/')[0];
  const given = parseInt(prefix.split('/')[1]) || 48;
  const maxSubs = Math.pow(2, 64 - given);
  let html = '<p><strong>Base prefix:</strong> ' + prefix + '</p>';
  html += '<p><strong>Needed subnets:</strong> ' + need + '</p>';
  html += '<p><strong>/64 subnets available:</strong> ' + maxSubs.toLocaleString() + '</p>';
  html += '<p><strong>Allocation plan (first 8 shown):</strong></p><ul>';
  for (let i=0; i<Math.min(need,8); i++) {
    const sid = ('0000' + i.toString(16)).slice(-4);
    html += '<li>' + pref + ':' + sid + '::/64</li>';
  }
  if (need > 8) html += '<li>... (' + (need-8) + ' more)</li>';
  html += '</ul>';
  out.innerHTML = html;
}
</script>`
          },
          {
            type: "exercise",
            title: "IPv6 Subnet Count",
            generate: () => {
              const prefixes = [48,52,56,60];
              const p = prefixes[rand(0,3)];
              const depts = rand(2,200);
              const subs = Math.pow(2, 64 - p);
              return {
                question: `An organization receives a /${p} prefix and needs to carve out /64 subnets for ${depts} departments. How many /64 subnets are available from this prefix?`,
                fields: [{id:'d15-count', label:'Available /64 subnets', check:(v)=>{
                  const n = parseInt(v.replace(/[,\s]/g,''));
                  return !isNaN(n) && n === subs;
                }}],
                hint: `Available subnets = 2^(64 − ${p}). The number of departments (${depts}) does not change the available count.`,
                answer: subs.toLocaleString()
              };
            }
          }
        ]
      },
      {
        title: "Lesson 16: Final Challenge",
        steps: [
          {
            type: "explain",
            html: `<div class="info-card">
  <h3>Final Challenge — Mixed Review</h3>
  <p>You now have skills in IPv4 subnetting, VLSM, supernetting, and IPv6. Here's a quick-reference cheat sheet for exams:</p>
  <table style="width:100%;border-collapse:collapse;margin-top:8px;">
    <tr style="background:#222;"><th>Prefix</th><th>Mask</th><th>Hosts</th><th>Block Size</th></tr>
    <tr><td>/24</td><td>255.255.255.0</td><td>254</td><td>256</td></tr>
    <tr style="background:#1a1a1a;"><td>/25</td><td>255.255.255.128</td><td>126</td><td>128</td></tr>
    <tr><td>/26</td><td>255.255.255.192</td><td>62</td><td>64</td></tr>
    <tr style="background:#1a1a1a;"><td>/27</td><td>255.255.255.224</td><td>30</td><td>32</td></tr>
    <tr><td>/28</td><td>255.255.255.240</td><td>14</td><td>16</td></tr>
    <tr style="background:#1a1a1a;"><td>/29</td><td>255.255.255.248</td><td>6</td><td>8</td></tr>
    <tr><td>/30</td><td>255.255.255.252</td><td>2</td><td>4</td></tr>
  </table>
  <h4>Exam Tips</h4>
  <ul>
    <li>Memorize the powers of 2 up to 2<sup>16</sup> = 65,536.</li>
    <li>Always subtract 2 from host counts if broadcast/network addresses are excluded.</li>
    <li>Check if the requirement fits the block size <em>before</em> subtracting 2.</li>
    <li>Supernet: prefix <strong>decreases</strong> (moves left). Subnet: prefix <strong>increases</strong> (moves right).</li>
    <li>IPv6: /48 → 65,536 /64 subnets. /56 → 256 /64 subnets. /64 = standard LAN.</li>
  </ul>
</div>`
          },
          {
            type: "exercise",
            title: "Mixed Challenge",
            generate: () => {
              const cases = ['vlsm','supernet','eui64','ipv6type'];
              const c = cases[rand(0,3)];
              if (c === 'vlsm') {
                const baseNet = '192.168.' + rand(1,255) + '.0/24';
                const needs = [rand(50,100), rand(20,40), rand(10,20)];
                const needStr = needs.join(', ');
                const block = 128;
                const newPref = 25;
                return {
                  question: `VLSM allocation: Starting from ${baseNet}, allocate subnets for ${needs.length} departments needing ${needStr} hosts respectively (in order). What is the CIDR of the first allocated subnet?`,
                  fields: [{id:'ch-vlsm', label:'First subnet CIDR', check:(v)=> v.trim() === baseNet.split('/')[0]+'/'+newPref }],
                  hint: `Start with the largest need. ${needs[0]} hosts needs a block of ${block} addresses = /${newPref}.`,
                  answer: baseNet.split('/')[0]+'/'+newPref
                };
              } else if (c === 'supernet') {
                const third = rand(0,252);
                const nets = [];
                for (let i=0;i<4;i++) nets.push('10.1.'+(third+i)+'.0/24');
                return {
                  question: `Find the supernet that covers these networks:<br>${nets.join('<br>')}`,
                  fields: [{id:'ch-sup', label:'Supernet CIDR', check:(v)=> v.trim() === '10.1.'+third+'.0/22' }],
                  hint: '4 contiguous /24 networks → combine 2 bits → /22.',
                  answer: '10.1.'+third+'.0/22'
                };
              } else if (c === 'eui64') {
                const b1 = rand(0,255); const b2 = rand(0,255); const b3 = rand(0,255);
                const b4 = rand(0,255); const b5 = rand(0,255); const b6 = rand(0,255);
                const mac = [b1,b2,b3,b4,b5,b6].map(b => ('0'+b.toString(16)).slice(-2)).join(':');
                const flipped = b1 ^ 0x02;
                const eui = [flipped,b2,b3].map(b => (''+b.toString(16)).padStart(2,'0')).join('') +
                            'fffe' +
                            [b4,b5,b6].map(b => (''+b.toString(16)).padStart(2,'0')).join('');
                const formatted = eui.match(/.{1,4}/g).join(':');
                return {
                  question: `EUI-64: Convert MAC <code>${mac}</code> to the EUI-64 interface ID.`,
                  fields: [{id:'ch-eui', label:'EUI-64', check:(v)=> v.trim().toLowerCase().replace(/[.:]/g,'') === eui.toLowerCase() }],
                  hint: 'Split MAC, insert ff:fe, flip 7th bit.',
                  answer: formatted
                };
              } else {
                const types = [
                  {name:'Global Unicast', ex:'2001:db8:1::1'},
                  {name:'Link-Local', ex:'fe80::1:2'},
                  {name:'Multicast', ex:'ff02::1:ff00:1'},
                  {name:'Unique Local', ex:'fd12::1'}
                ];
                const t = types[rand(0,3)];
                return {
                  question: `What type is the IPv6 address <code>${t.ex}</code>?`,
                  fields: [{id:'ch-ipv6', label:'Address type', check:(v)=> v.trim().toLowerCase() === t.name.toLowerCase() }],
                  hint: 'Check the first hextet: fe80 = Link-Local, ff00 = Multicast, fc/fd = Unique Local, 2000::/3 = Global Unicast.',
                  answer: t.name
                };
              }
            }
          }
        ]
      }
    ]
  }
];

const TOTAL_LESSONS = MODULES.reduce((a,m) => a + m.lessons.length, 0);
