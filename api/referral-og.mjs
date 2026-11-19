/* ============================================
   The Spain Connection — Dynamic Referral OG Preview
   ============================================
   Serves personalized Open Graph / WhatsApp link preview
   metadata ("Referral Link — [Person Name]", with NO
   webinar image) for /referral?ref=... and /webinar?ref=...,
   and immediately navigates human browsers to index.html.
   ============================================ */

const FIRESTORE_QUERY_URL =
  'https://firestore.googleapis.com/v1/projects/proyecto-internacional/databases/(default)/documents:runQuery';

const PARTNER_SPECIALS = {
  'UCI': { name: 'UCI', agency: 'UCI' },
  'FUSTER & ASSOCIATES': { name: 'Fuster & Associates', agency: 'Fuster & Associates' },
  'INMOMÁS HOLIDAYS': { name: 'Inmomás Holidays', agency: 'Inmomás Holidays' },
  'INMOMAS HOLIDAYS': { name: 'Inmomás Holidays', agency: 'Inmomás Holidays' }
};

const DEMO_FALLBACKS = {
  'ADM-MARTINEZ': { name: 'José Martínez Sánchez', agency: 'The Spain Connection · RE/MAX Inmomás' },
  'LOC-MARTINEZ -GBPI': { name: 'José Martínez Sánchez', agency: 'The Spain Connection · RE/MAX Inmomás' },
  'ADM-INMOMAS': { name: 'Maia Belén Honczaryk', agency: 'RE/MAX Inmomás' },
  'BRK-MITCHELL': { name: 'John Mitchell', agency: 'RE/MAX Premier - Miami' },
  'BRK-WILLIAMS': { name: 'Sarah Williams', agency: 'Century 21 - Dallas' },
  'BRK-THOMPSON': { name: 'Mark Thompson', agency: 'Keller Williams - Phoenix' },
  'REA-REYNOLDS': { name: 'Mike Reynolds', agency: 'RE/MAX Premier - Miami' },
  'REA-CHEN': { name: 'Lisa Chen', agency: 'RE/MAX Premier - Miami' },
  'REA-HANKS': { name: 'Tom Hanks', agency: 'RE/MAX Premier - Miami' },
  'REA-TORRES': { name: 'David Torres', agency: 'Century 21 - Dallas' },
  'REA-JOHNSON': { name: 'Emily Johnson', agency: 'Coldwell Banker - Chicago' },
  'LOC-GARCÍA': { name: 'Carlos García', agency: 'RE/MAX Inmomás' },
  'LOC-MARTÍNEZ': { name: 'Ana Martínez', agency: 'RE/MAX Inmomás' },
  'EMB-VALENZUELA': { name: 'Sofía Valenzuela', agency: 'Valenzuela Global Advisory' }
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function titleCaseWords(raw) {
  return String(raw || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function extractFallbackNameFromCode(refCode) {
  if (!refCode) return '';
  const trimmed = String(refCode).trim();
  const upper = trimmed.toUpperCase();
  if (PARTNER_SPECIALS[upper]) return PARTNER_SPECIALS[upper].name;
  if (DEMO_FALLBACKS[upper]) return DEMO_FALLBACKS[upper].name;

  // Format: PREFIX-LASTNAME-XXXX or PREFIX-LASTNAME (e.g. EMB-GUTIERREZ-M5UP -> Gutierrez)
  const parts = trimmed.split('-').map(p => p.trim()).filter(Boolean);
  const rolePrefixes = new Set(['EMB', 'BRK', 'REA', 'LOC', 'COL', 'ADM', 'PARTNER']);
  let startIdx = 0;
  if (parts.length > 1 && rolePrefixes.has(parts[0].toUpperCase())) {
    startIdx = 1;
  }
  let endIdx = parts.length;
  // Drop trailing short random suffix if there is still a name segment in between
  if (endIdx - startIdx > 1 && /^[A-Za-z0-9]{3,5}$/.test(parts[endIdx - 1])) {
    endIdx -= 1;
  }
  const namePart = parts.slice(startIdx, endIdx).join(' ').replace(/_/g, ' ').trim();
  if (!namePart || namePart.toUpperCase() === 'DEFAULT' || namePart.toUpperCase() === 'USER') {
    return '';
  }
  return titleCaseWords(namePart);
}

async function queryFirestoreByReferralCode(code) {
  const response = await fetch(FIRESTORE_QUERY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'referralCode' },
            op: 'EQUAL',
            value: { stringValue: code }
          }
        },
        limit: 1
      }
    }),
    signal: AbortSignal.timeout(3000)
  });

  if (!response.ok) return null;
  const rows = await response.json();
  if (!Array.isArray(rows)) return null;
  const match = rows.find(r => r && r.document && r.document.fields);
  if (!match) return null;

  const fields = match.document.fields;
  const firstName = (fields.firstName && fields.firstName.stringValue ? fields.firstName.stringValue : '').trim();
  const lastName = (fields.lastName && fields.lastName.stringValue ? fields.lastName.stringValue : '').trim();
  const agencyName = (fields.agencyName && fields.agencyName.stringValue ? fields.agencyName.stringValue : '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || agencyName;
  if (!fullName) return null;

  return { name: fullName, agency: agencyName };
}

async function resolveReferrerInfo(refCode) {
  if (!refCode) return { name: '', agency: '' };
  const cleanCode = String(refCode).trim();
  const upperCode = cleanCode.toUpperCase();

  if (PARTNER_SPECIALS[upperCode]) {
    return PARTNER_SPECIALS[upperCode];
  }

  try {
    let found = await queryFirestoreByReferralCode(cleanCode);
    if (!found && cleanCode !== upperCode) {
      found = await queryFirestoreByReferralCode(upperCode);
    }
    if (found) return found;
  } catch (err) {
    console.error('[referral-og] Firestore lookup error:', err);
  }

  if (DEMO_FALLBACKS[upperCode]) {
    return DEMO_FALLBACKS[upperCode];
  }

  return {
    name: extractFallbackNameFromCode(cleanCode),
    agency: ''
  };
}

function buildHtmlResponse(request, { personName, agencyName, refCode, isWebinar, extraParams }) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  let ogTitle = 'Referral Link — The Spain Connection';
  let ogDescription = 'Official Referral Link — The Spain Connection · RE/MAX Inmomás';

  if (personName) {
    ogTitle = `Referral Link — ${personName}`;
    const agencySuffix =
      agencyName && agencyName.toLowerCase() !== personName.toLowerCase()
        ? ` · ${agencyName}`
        : '';
    ogDescription = isWebinar
      ? `VIP Referral Link · ${personName}${agencySuffix} — The Spain Connection · RE/MAX Inmomás`
      : `Official Referral Link · ${personName}${agencySuffix} — The Spain Connection · RE/MAX Inmomás`;
  }

  const targetSearch = new URLSearchParams();
  if (refCode) targetSearch.set('ref', refCode);
  for (const [k, v] of extraParams.entries()) {
    if (k !== 'ref' && k !== 'mode') {
      targetSearch.set(k, v);
    }
  }
  const qs = targetSearch.toString();
  const targetHash = isWebinar ? '#webinar' : '#referral';
  const redirectTarget = `/index.html${qs ? '?' + qs : ''}${targetHash}`;

  const canonicalPath = isWebinar ? '/webinar' : '/referral';
  const canonicalUrl = `${origin}${canonicalPath}${qs ? '?' + qs : ''}`;

  // Deliberately omit og:image, twitter:image, <link rel="icon">, and <img>
  // so WhatsApp and social platforms render a clean text-only Referral Link card
  // with the person's name and zero webinar thumbnail.
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(ogTitle)}</title>
  <meta name="description" content="${escapeHtml(ogDescription)}">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDescription)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="The Spain Connection">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
  <script>
    (function () {
      var fallbackTarget = ${JSON.stringify(redirectTarget)};
      var incomingHash = window.location.hash || '';
      if (incomingHash && incomingHash !== '#') {
        var baseTarget = fallbackTarget.split('#')[0];
        window.location.replace(baseTarget + incomingHash);
      } else {
        window.location.replace(fallbackTarget);
      }
    })();
  </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; text-align: center; color: #0f172a;">
  <noscript>
    <p><a href="${escapeHtml(redirectTarget)}">${escapeHtml(ogTitle)}</a></p>
  </noscript>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const refCode = (url.searchParams.get('ref') || '').trim();
    const isWebinar =
      url.searchParams.get('mode') === 'webinar' ||
      url.pathname === '/webinar' ||
      url.pathname.startsWith('/webinar/');

    const info = await resolveReferrerInfo(refCode);
    return buildHtmlResponse(request, {
      personName: info.name,
      agencyName: info.agency,
      refCode,
      isWebinar,
      extraParams: url.searchParams
    });
  } catch (err) {
    console.error('[referral-og] Unexpected handler error:', err);
    return new Response(
      '<!DOCTYPE html><html><head><title>Referral Link — The Spain Connection</title><meta property="og:title" content="Referral Link — The Spain Connection"><meta property="og:description" content="Official Referral Link — The Spain Connection · RE/MAX Inmomás"><script>window.location.replace("/index.html#referral");</script></head><body></body></html>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

export async function HEAD(request) {
  const getResp = await GET(request);
  return new Response(null, {
    status: getResp.status,
    headers: getResp.headers
  });
}
