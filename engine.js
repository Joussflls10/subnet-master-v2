/* === SECTION 1: CORE ENGINE === */
/* Pure networking math functions. NO DOM ACCESS. NO console.log. */

/* ---------- Internal Helpers ---------- */
function ipToNum(ip) {
    const octets = ip.split('.').map(Number);
    return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

function numToIp(num) {
    return [
        (num >>> 24) & 0xFF,
        (num >>> 16) & 0xFF,
        (num >>> 8) & 0xFF,
        num & 0xFF
    ].join('.');
}

/* ---------- IP / Binary conversions ---------- */
function ipToBin(ip) {
    return ip.split('.').map(Number).map(n => n.toString(2).padStart(8, '0'));
}

function binToIp(binStr) {
    const cleaned = String(binStr).replace(/[\s\.]/g, '');
    if (cleaned.length !== 32) return null;
    const octets = [];
    for (let i = 0; i < 32; i += 8) {
        octets.push(parseInt(cleaned.substring(i, i + 8), 2));
    }
    return octets.join('.');
}

/* ---------- Prefix / Mask conversions ---------- */
function prefixToMask(prefix) {
    const p = parseInt(prefix);
    if (isNaN(p) || p < 0 || p > 32) return null;
    const mask = [];
    for (let i = 0; i < 4; i++) {
        const bits = Math.min(8, Math.max(0, p - i * 8));
        mask.push((0xFF << (8 - bits)) & 0xFF);
    }
    return mask.join('.');
}

function maskToPrefix(mask) {
    if (!isValidMask(mask)) return -1;
    const octets = mask.split('.').map(Number);
    let prefix = 0;
    for (const o of octets) {
        let bits = 0;
        let v = o;
        while (v & 0x80) {
            bits++;
            v = (v << 1) & 0xFF;
        }
        prefix += bits;
        if (bits < 8) break;
    }
    return prefix;
}

function prefixToCidrTable() {
    const table = {};
    for (let p = 8; p <= 30; p++) {
        const total = Math.pow(2, 32 - p);
        table['/' + p] = {
            mask: prefixToMask(p),
            hosts: total - 2,
            total: total
        };
    }
    return table;
}

/* ---------- Network / Broadcast / Range ---------- */
function calcNetwork(ip, mask) {
    const ipOctets = ip.split('.').map(Number);
    const maskOctets = mask.split('.').map(Number);
    return ipOctets.map((o, i) => o & maskOctets[i]).join('.');
}

function calcBroadcast(ip, mask) {
    const ipOctets = ip.split('.').map(Number);
    const maskOctets = mask.split('.').map(Number);
    return ipOctets.map((o, i) => o | (255 - maskOctets[i])).join('.');
}

function calcRange(ip, mask) {
    const network = calcNetwork(ip, mask);
    const broadcast = calcBroadcast(ip, mask);
    const prefix = maskToPrefix(mask);
    const total = Math.pow(2, 32 - prefix);
    const usable = total - 2;
    const netNum = ipToNum(network);
    const bcNum = ipToNum(broadcast);
    let firstNum = (netNum + 1) >>> 0;
    let lastNum = (bcNum - 1) >>> 0;
    if (usable <= 0) {
        firstNum = netNum;
        lastNum = bcNum;
    }
    return {
        network: network,
        broadcast: broadcast,
        first: numToIp(firstNum),
        last: numToIp(lastNum),
        total: total,
        usable: usable
    };
}

/* ---------- Validation ---------- */
function isValidIp(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    const nums = parts.map(Number);
    for (let i = 0; i < 4; i++) {
        if (!/^\d+$/.test(parts[i])) return false;
        if (nums[i] < 0 || nums[i] > 255) return false;
    }
    if (nums[0] === 0 && nums[1] === 0 && nums[2] === 0 && nums[3] === 0) return false;
    if (nums[0] === 255 && nums[1] === 255 && nums[2] === 255 && nums[3] === 255) return false;
    return true;
}

function isValidMask(mask) {
    const parts = mask.split('.');
    if (parts.length !== 4) return false;
    const nums = parts.map(Number);
    for (const n of nums) {
        if (isNaN(n) || n < 0 || n > 255) return false;
    }
    let foundZero = false;
    for (const n of nums) {
        const bin = n.toString(2).padStart(8, '0');
        for (const bit of bin) {
            if (bit === '0') foundZero = true;
            if (foundZero && bit === '1') return false;
        }
    }
    return true;
}

function isValidCidr(prefix) {
    const p = parseInt(prefix);
    return !isNaN(p) && p >= 0 && p <= 32;
}

/* ---------- Subnetting ---------- */
function calcSubnetCount(originalPrefix, newPrefix) {
    return Math.pow(2, newPrefix - originalPrefix);
}

function calcHostsPerSubnet(prefix) {
    return Math.pow(2, 32 - prefix) - 2;
}

function calcBlockSize(prefix) {
    return Math.pow(2, 32 - prefix);
}

/* ---------- Supernetting ---------- */
function calcSupernet(networks) {
    if (!networks || networks.length === 0) return null;
    const nums = networks.map(cidr => {
        const [ipStr, preStr] = cidr.split('/');
        const octets = ipStr.split('.').map(Number);
        const ipNum = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
        return { ipNum, prefix: parseInt(preStr) || 0 };
    });
    let xor = 0;
    for (let i = 1; i < nums.length; i++) {
        xor |= (nums[0].ipNum ^ nums[i].ipNum);
    }
    let prefix = 32;
    if (xor !== 0) {
        let d = xor;
        let msbPos = -1;
        while (d) { d >>= 1; msbPos++; }
        prefix = 31 - msbPos;
    }
    const minProvidedPrefix = Math.min(...nums.map(n => n.prefix));
    prefix = Math.min(prefix, minProvidedPrefix);
    const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix));
    const netNum = (nums[0].ipNum & mask) >>> 0;
    const ip = [
        (netNum >>> 24) & 0xFF,
        (netNum >>> 16) & 0xFF,
        (netNum >>> 8) & 0xFF,
        netNum & 0xFF
    ].join('.');
    return ip + '/' + prefix;
}

/* ---------- IPv6 ---------- */
function expandIPv6(ip) {
    if (!isValidIPv6(ip)) return null;
    const parts = ip.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] !== undefined ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const zeros = Array(missing).fill('0000');
    const groups = left.concat(zeros, right);
    return groups.map(g => g.padStart(4, '0')).join(':');
}

function compressIPv6(ip) {
    const expanded = expandIPv6(ip);
    if (!expanded) return null;
    let groups = expanded.split(':').map(g => parseInt(g, 16).toString(16));
    let bestStart = -1, bestLen = 0;
    let curStart = -1, curLen = 0;
    for (let i = 0; i < groups.length; i++) {
        if (groups[i] === '0') {
            if (curStart === -1) curStart = i;
            curLen++;
            if (curLen > bestLen) {
                bestLen = curLen;
                bestStart = curStart;
            }
        } else {
            curStart = -1;
            curLen = 0;
        }
    }
    if (bestLen > 1) {
        const prefix = groups.slice(0, bestStart).join(':');
        const suffix = groups.slice(bestStart + bestLen).join(':');
        let res = '';
        if (prefix) res += prefix + ':';
        res += ':';
        if (suffix) res += suffix;
        return res;
    }
    return groups.join(':');
}

function isValidIPv6(ip) {
    if (!ip || typeof ip !== 'string') return false;
    if (ip.split('::').length > 2) return false;
    const parts = ip.split('::');
    let groups = [];
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '') continue;
        const g = parts[i].split(':');
        for (const h of g) {
            if (h === '') return false;
            if (h.length > 4) return false;
            if (!/^[0-9a-fA-F]+$/.test(h)) return false;
        }
        groups = groups.concat(g);
    }
    if (parts.length === 1) {
        if (groups.length !== 8) return false;
    } else {
        if (groups.length >= 8) return false;
    }
    return true;
}

function ipv6Type(ip) {
    const expanded = expandIPv6(ip);
    if (!expanded) return 'Invalid';
    if (expanded === '0000:0000:0000:0000:0000:0000:0000:0001') return 'Loopback';
    const firstGroup = parseInt(expanded.substring(0, 4), 16);
    if ((firstGroup & 0xFF00) === 0xFF00) return 'Multicast';
    if ((firstGroup & 0xFFC0) === 0xFE80) return 'Link-Local';
    if ((firstGroup & 0xE000) === 0x2000) return 'Global Unicast';
    return 'Anycast';
}

function ipv6SubnetPrefixes() {
    return {
        '/48': { name: 'Site', subnets: '65,536 /64s', hosts: '2^8a addresses' },
        '/56': { name: 'Small Site', subnets: '256 /64s', hosts: '2^72 addresses' },
        '/64': { name: 'LAN', subnets: '1', hosts: '2^64 addresses' },
        '/128': { name: 'Host', subnets: 'N/A', hosts: '1' }
    };
}

function eui64(mac) {
    if (!mac) return null;
    const parts = mac.split(/[:-]/);
    if (parts.length !== 6) return null;
    const bytes = parts.map(p => parseInt(p, 16));
    if (bytes.some(b => isNaN(b) || b < 0 || b > 255)) return null;
    bytes[0] ^= 0x02;
    const g1 = ((bytes[0] << 8) | bytes[1]).toString(16).padStart(4, '0');
    const g2 = ((bytes[2] << 8) | 0xFF).toString(16).padStart(4, '0');
    const g3 = ((0xFE << 8) | bytes[3]).toString(16).padStart(4, '0');
    const g4 = ((bytes[4] << 8) | bytes[5]).toString(16).padStart(4, '0');
    return (g1 + ':' + g2 + ':' + g3 + ':' + g4).toLowerCase();
}

/* ---------- Utilities ---------- */
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randIdx(arr) {
    return rand(0, arr.length - 1);
}


/* === SECTION 4: DEMO HANDLERS === */
/* Event handler functions for all interactive demos. Use DOM. Formatted for <div id="dN-result"> */

function _el(id) {
    return document.getElementById(id);
}

function _show(resultId, html) {
    const el = _el(resultId);
    if (el) el.innerHTML = '<div class="result-box">' + html + '</div>';
}

function _error(resultId, msg) {
    const el = _el(resultId);
    if (el) el.innerHTML = '<div class="result-box error">' + msg + '</div>';
}

/* d1 - Binary Converter */
function d1Show() {
    const ip = _el('d1-ip').value.trim();
    if (!isValidIp(ip)) { _error('d1-result', 'Invalid IP address.'); return; }
    const bins = ipToBin(ip);
    let html = '<strong>Binary (octets):</strong><br>' + bins.join('.') + '<br>';
    html += '<strong>Flat binary:</strong><br>' + bins.join('');
    _show('d1-result', html);
}

/* d2 - IP + Mask Visualizer */
function d2Show() {
    const ip = _el('d2-ip').value.trim();
    const mask = _el('d2-mask').value.trim();
    if (!isValidIp(ip) || !isValidMask(mask)) { _error('d2-result', 'Invalid IP or Subnet Mask.'); return; }
    const r = calcRange(ip, mask);
    let html = '<strong>Network:</strong> ' + r.network + '<br>';
    html += '<strong>Broadcast:</strong> ' + r.broadcast + '<br>';
    html += '<strong>First Usable:</strong> ' + r.first + '<br>';
    html += '<strong>Last Usable:</strong> ' + r.last + '<br>';
    html += '<strong>Total Addresses:</strong> ' + r.total + '<br>';
    html += '<strong>Usable Hosts:</strong> ' + r.usable;
    _show('d2-result', html);
}

/* d3 - AND Operation */
function d3Show() {
    const ip = _el('d3-ip').value.trim();
    const mask = _el('d3-mask').value.trim();
    if (!isValidIp(ip) || !isValidMask(mask)) { _error('d3-result', 'Invalid IP or Mask.'); return; }
    const ipBin = ipToBin(ip);
    const maskBin = ipToBin(mask);
    const net = calcNetwork(ip, mask);
    const netBin = ipToBin(net);
    let html = '<table><tr><td>IP</td><td>' + ipBin.join(' ') + '</td></tr>';
    html += '<tr><td>Mask</td><td>' + maskBin.join(' ') + '</td></tr>';
    html += '<tr style="border-top:2px solid #ccc"><td>AND</td><td>' + netBin.join(' ') + '</td></tr>';
    html += '</table><br><strong>Network:</strong> ' + net;
    _show('d3-result', html);
}

/* d4 - CIDR Slider */
function d4Show() {
    const slider = _el('d4-slider');
    const valEl = document.getElementById('d4-val');
    if (!slider) return;
    const prefix = parseInt(slider.value);
    if (valEl) valEl.textContent = '/' + prefix;
    const mask = prefixToMask(prefix);
    const hosts = calcHostsPerSubnet(prefix);
    const block = calcBlockSize(prefix);
    let html = '<strong>Prefix:</strong> /' + prefix + '<br>';
    html += '<strong>Mask:</strong> ' + mask + '<br>';
    html += '<strong>Usable Hosts:</strong> ' + hosts + '<br>';
    html += '<strong>Block Size:</strong> ' + block;
    _show('d4-result', html);
}

/* d5 - Class Detector */
function d5Show() {
    const ip = _el('d5-ip').value.trim();
    if (!isValidIp(ip)) { _error('d5-result', 'Invalid IPv4 address.'); return; }
    const firstOctet = parseInt(ip.split('.')[0]);
    let cls = '', defaultMask = '', prefix = '', range = '';
    if (firstOctet >= 1 && firstOctet <= 126) {
        cls = 'A'; defaultMask = '255.0.0.0'; prefix = '/8'; range = '1 – 126';
    } else if (firstOctet >= 128 && firstOctet <= 191) {
        cls = 'B'; defaultMask = '255.255.0.0'; prefix = '/16'; range = '128 – 191';
    } else if (firstOctet >= 192 && firstOctet <= 223) {
        cls = 'C'; defaultMask = '255.255.255.0'; prefix = '/24'; range = '192 – 223';
    } else if (firstOctet >= 224 && firstOctet <= 239) {
        cls = 'D (Multicast)'; defaultMask = 'N/A'; prefix = 'N/A'; range = '224 – 239';
    } else if (firstOctet >= 240) {
        cls = 'E (Experimental)'; defaultMask = 'N/A'; prefix = 'N/A'; range = '240 – 255';
    }
    let html = '<strong>IP:</strong> ' + ip + '<br>';
    html += '<strong>Class:</strong> ' + cls + '<br>';
    html += '<strong>1st Octet Range:</strong> ' + range + '<br>';
    html += '<strong>Default Mask:</strong> ' + defaultMask + '<br>';
    html += '<strong>Default Prefix:</strong> ' + prefix;
    _show('d5-result', html);
}

/* d6 - Borrow-Bit Simulator */
function d6Show() {
    const ip = _el('d6-ip').value.trim();
    const mask = _el('d6-mask').value.trim();
    const borrow = parseInt(_el('d6-borrow').value);
    if (!isValidIp(ip) || !isValidMask(mask)) { _error('d6-result', 'Invalid IP or Mask.'); return; }
    if (isNaN(borrow) || borrow < 1 || borrow > 16) { _error('d6-result', 'Borrow bits must be 1-16.'); return; }
    const origPrefix = maskToPrefix(mask);
    const newPrefix = origPrefix + borrow;
    if (newPrefix > 30) { _error('d6-result', 'New prefix exceeds /30.'); return; }
    const subnets = calcSubnetCount(origPrefix, newPrefix);
    const hosts = calcHostsPerSubnet(newPrefix);
    let html = '<strong>Original Prefix:</strong> /' + origPrefix + '<br>';
    html += '<strong>Borrowed Bits:</strong> ' + borrow + '<br>';
    html += '<strong>New Prefix:</strong> /' + newPrefix + '<br>';
    html += '<strong>Subnets Created:</strong> ' + subnets + '<br>';
    html += '<strong>Hosts per Subnet:</strong> ' + hosts;
    _show('d6-result', html);
}

/* d7 - VLSM Allocator */
function d7Show() {
    const ip = _el('d7-ip').value.trim();
    const mask = _el('d7-mask').value.trim();
    const hostsStr = _el('d7-hosts').value.trim();
    if (!isValidIp(ip) || !isValidMask(mask)) { _error('d7-result', 'Invalid IP or Mask.'); return; }
    const reqs = hostsStr.split(/[,\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (reqs.length === 0) { _error('d7-result', 'Enter host requirements (e.g. 100, 50, 10).'); return; }
    reqs.sort((a, b) => b - a);
    const origPrefix = maskToPrefix(mask);
    let current = ipToNum(calcNetwork(ip, mask));
    let html = '<table style="width:100%;border-collapse:collapse"><thead><tr>';
    html += '<th style="text-align:left">Needed</th><th style="text-align:left">Prefix</th>';
    html += '<th style="text-align:left">Network</th><th style="text-align:left">Mask</th>';
    html += '<th style="text-align:left">Usable Range</th></tr></thead><tbody>';
    for (const h of reqs) {
        let p = 32 - Math.ceil(Math.log2(h + 2));
        if (p < origPrefix) {
            html += '<tr><td colspan="5">ERROR: ' + h + ' hosts needs /' + p + ', pool is only /' + origPrefix + '</td></tr>';
            continue;
        }
        if (p > 30) p = 30;
        const block = calcBlockSize(p);
        if ((current % block) !== 0) {
            current = (Math.ceil(current / block) * block) >>> 0;
        }
        const netStr = numToIp(current);
        const m = prefixToMask(p);
        const r = calcRange(netStr, m);
        html += '<tr><td>' + h + '</td><td>/' + p + '</td><td>' + netStr + '/' + p + '</td>';
        html += '<td>' + m + '</td><td>' + r.first + ' - ' + r.last + '</td></tr>';
        current = (current + block) >>> 0;
    }
    html += '</tbody></table>';
    _show('d7-result', html);
}

/* d8 - Supernet Calculator */
function d8Show() {
    const raw = _el('d8-networks').value.trim();
    if (!raw) { _error('d8-result', 'Enter at least one CIDR network.'); return; }
    const networks = raw.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
    if (networks.length === 0) { _error('d8-result', 'Enter at least one CIDR network.'); return; }
    for (const cidr of networks) {
        const [ipPart, prePart] = cidr.split('/');
        if (!ipPart || !prePart || !isValidIp(ipPart) || !isValidCidr(prePart)) {
            _error('d8-result', 'Invalid CIDR: ' + cidr); return;
        }
    }
    const result = calcSupernet(networks);
    _show('d8-result', '<strong>Smallest Supernet:</strong> ' + result);
}

/* d9 - ISP Pool Allocator */
function d9Show() {
    const ip = _el('d9-ip').value.trim();
    const mask = _el('d9-mask').value.trim();
    const customers = parseInt(_el('d9-customers').value);
    if (!isValidIp(ip) || !isValidMask(mask)) { _error('d9-result', 'Invalid IP or Mask.'); return; }
    if (isNaN(customers) || customers < 1) { _error('d9-result', 'Invalid number of customers.'); return; }
    const origPrefix = maskToPrefix(mask);
    const borrow = Math.ceil(Math.log2(customers));
    const newPrefix = origPrefix + borrow;
    if (newPrefix > 30) { _error('d9-result', 'Pool too small for ' + customers + ' customers.'); return; }
    const count = calcSubnetCount(origPrefix, newPrefix);
    const block = calcBlockSize(newPrefix);
    let netNum = ipToNum(calcNetwork(ip, mask));
    let html = '<strong>Pool:</strong> ' + numToIp(netNum) + '/' + origPrefix + '<br>';
    html += '<strong>Customers:</strong> ' + customers + ' <strong>Allocated:</strong> ' + count + ' /' + newPrefix + ' subnets<br>';
    html += '<strong>Hosts per Customer:</strong> ' + calcHostsPerSubnet(newPrefix) + '<br><br>';
    const limit = Math.min(count, 32);
    for (let i = 0; i < limit; i++) {
        html += numToIp(netNum) + '/' + newPrefix + '<br>';
        netNum = (netNum + block) >>> 0;
    }
    if (count > 32) html += '... and ' + (count - 32) + ' more';
    _show('d9-result', html);
}

/* d10 - IPv6 Expand / Compress */
function d10Show() {
    const ip = _el('d10-ip').value.trim();
    const action = _el('d10-action').value;
    if (!isValidIPv6(ip)) { _error('d10-result', 'Invalid IPv6 address.'); return; }
    let result;
    if (action === 'expand') {
        result = expandIPv6(ip);
    } else {
        result = compressIPv6(ip);
    }
    _show('d10-result', '<strong>' + (action === 'expand' ? 'Expanded' : 'Compressed') + ':</strong> ' + result);
}

/* d11 - EUI-64 Generator */
function d11Show() {
    const mac = _el('d11-mac').value.trim();
    const result = eui64(mac);
    if (!result) { _error('d11-result', 'Invalid MAC address. Use aa:bb:cc:dd:ee:ff or aa-bb-cc-dd-ee-ff.'); return; }
    _show('d11-result', '<strong>EUI-64 Interface ID:</strong> ' + result);
}

/* d12 - Wildcard Mask Calculator */
function d12Show() {
    const ip = _el('d12-ip').value.trim();
    const mask = _el('d12-mask').value.trim();
    if (!isValidIp(ip) || !isValidMask(mask)) { _error('d12-result', 'Invalid IP or Mask.'); return; }
    const maskOctets = mask.split('.').map(Number);
    const wild = maskOctets.map(o => 255 - o).join('.');
    let html = '<strong>IP:</strong> ' + ip + '<br>';
    html += '<strong>Mask:</strong> ' + mask + '<br>';
    html += '<strong>Wildcard:</strong> ' + wild + '<br>';
    html += '<strong>Mask Binary:</strong> ' + ipToBin(mask).join('') + '<br>';
    html += '<strong>Wildcard Binary:</strong> ' + wild.split('.').map(n => parseInt(n).toString(2).padStart(8, '0')).join('');
    _show('d12-result', html);
}


/* d13 - IPv6 Subnet Calculator */
function d13Show() {
    const prefix = _el('d13-prefix').value.trim();
    const count = parseInt(_el('d13-count').value) || 8;
    const parts = prefix.split('/');
    if (parts.length !== 2) { _error('d13-result', 'Use CIDR notation, e.g. 2001:db8:acad::/48'); return; }
    const origPrefix = parseInt(parts[1]);
    if (origPrefix < 1 || origPrefix > 64) { _error('d13-result', 'Prefix must be 1-64'); return; }
    const newPrefix = 64; // Standard LAN boundary
    const subnetBits = newPrefix - origPrefix;
    const maxSubnets = Math.pow(2, subnetBits);
    const showCount = Math.min(count, maxSubnets, 32);
    let html = '<strong>Prefix:</strong> ' + prefix + '<br>';
    html += '<strong>Subnet bits:</strong> ' + subnetBits + ' → <strong>Max subnets:</strong> ' + maxSubnets.toLocaleString() + '<br>';
    html += '<strong>Each subnet:</strong> /' + newPrefix + ' with ' + Math.pow(2, 64).toLocaleString() + ' interface IDs<br><br>';
    html += '<table style="width:100%;font-size:0.82rem;border-collapse:collapse;"><thead><tr style="background:var(--surface2);">';
    html += '<th style="padding:5px 10px;text-align:left;">#</th><th style="padding:5px 10px;text-align:left;">Subnet CIDR</th></tr></thead><tbody>';
    for (let i = 0; i < showCount; i++) {
        const hex = i.toString(16).padStart(4, '0');
        html += '<tr><td style="padding:5px 10px;border-top:1px solid var(--border);">' + (i+1) + '</td>';
        html += '<td style="padding:5px 10px;border-top:1px solid var(--border);font-family:var(--mono);">' + parts[0].replace(/::$/, '') + hex + '::/' + newPrefix + '</td></tr>';
    }
    if (maxSubnets > showCount) html += '<tr><td colspan="2" style="padding:5px 10px;color:var(--muted);">... and ' + (maxSubnets - showCount) + ' more</td></tr>';
    html += '</tbody></table>';
    _show('d13-result', html);
}

/* d14 - MAC to EUI-64 + IPv6 */
function d14Show() {
    const mac = _el('d14-mac').value.trim();
    const prefix = _el('d14-prefix').value.trim();
    const result = eui64(mac);
    if (!result) { _error('d14-result', 'Invalid MAC. Use aa:bb:cc:dd:ee:ff or aa-bb-cc-dd-ee-ff.'); return; }
    let html = '<strong>EUI-64 Interface ID:</strong> <code style="font-size:1.05rem;">' + result + '</code><br><br>';
    html += '<div style="font-size:0.8rem;color:var(--muted);margin-bottom:4px;">Steps:</div>';
    html += '<ol style="font-size:0.85rem;margin-left:18px;line-height:1.7;">';
    html += '<li>Split MAC into two 24-bit halves</li>';
    html += '<li>Insert <code>FF:FE</code> in the middle</li>';
    html += '<li>Flip the 7th bit (U/L bit) of the first byte</li>';
    html += '</ol>';
    if (prefix && isValidIPv6(prefix)) {
        const expandedPrefix = expandIPv6(prefix).replace(/:0000/g, ':0').replace(/:0{4}/g, ':0');
        const cleanPrefix = expandedPrefix.replace(/(0{4}:)+0{4}$/, '');
        html += '<br><strong>Full IPv6 (SLAAC):</strong> <code style="font-size:1.05rem;">' + result + '</code>';
    }
    _show('d14-result', html);
}

/* d15 - IPv6 Address Planning */
function d15Show() {
    const prefix = _el('d15-prefix').value.trim();
    const need = parseInt(_el('d15-need').value);
    if (isNaN(need) || need < 1) { _error('d15-result', 'Enter number of subnets needed.'); return; }
    const parts = prefix.split('/');
    if (parts.length !== 2) { _error('d15-result', 'Use CIDR notation, e.g. 2001:db8:acad::/48'); return; }
    const origPrefix = parseInt(parts[1]);
    if (origPrefix > 64) { _error('d15-result', 'Planning only works with prefixes <= /64'); return; }
    const subnetBits = 64 - origPrefix;
    const maxSubnets = Math.pow(2, subnetBits);
    const enough = need <= maxSubnets;
    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.88rem;margin-bottom:12px;">';
    html += '<div><span style="color:var(--muted)">Organization prefix:</span> <code>' + prefix + '</code></div>';
    html += '<div><span style="color:var(--muted)">Subnets needed:</span> <strong>' + need + '</strong></div>';
    html += '<div><span style="color:var(--muted)">Available /64s:</span> <code>' + maxSubnets.toLocaleString() + '</code></div>';
    html += '<div><span style="color:var(--muted)">Status:</span> <strong style="color:' + (enough ? 'var(--success)' : 'var(--danger)') + ';">' + (enough ? '✅ Enough' : '❌ Not enough') + '</strong></div>';
    html += '</div>';
    if (enough) {
        html += '<span style="color:var(--muted);font-size:0.8rem;">First ' + Math.min(need, 8) + ' /64 subnets:</span><br>';
        for (let i = 0; i < Math.min(need, 8); i++) {
            const hex = i.toString(16).padStart(4, '0');
            html += '<code style="display:block;margin:3px 0;">' + parts[0].replace(/::$/, '') + hex + '::/64</code>';
        }
        if (need > 8) html += '<span style="color:var(--muted);font-size:0.78rem;">... and ' + (need - 8) + ' more</span>';
    }
    _show('d15-result', html);
}

