const { sanitize } = require('./sanitize');
const { getRelativeTime, getLocalTime } = require('./parseHeaders');

/**
 * Generates a dynamic SVG card displaying last visitor information.
 * Dark-mode card design matching GitHub's color scheme.
 */
function generateSVG(data) {
  const {
    city = 'Unknown',
    region = 'Unknown',
    country = 'Somewhere on Earth',
    timezone = 'UTC',
    os = 'Unknown OS',
    browser = 'Unknown Browser',
    deviceType = 'Desktop',
    language = 'Unknown',
    timestamp = new Date().toISOString(),
  } = data || {};

  // Sanitize all user-derived strings
  const s = {
    city: sanitize(city),
    region: sanitize(region),
    country: sanitize(country),
    os: sanitize(os),
    browser: sanitize(browser),
    deviceType: sanitize(deviceType),
    language: sanitize(language),
  };

  // Compute time displays
  const relativeTime = sanitize(getRelativeTime(timestamp));
  const { localTimeStr, label: timeLabel } = getLocalTime(timezone, timestamp);
  const safeLocalTime = sanitize(localTimeStr);
  const safeTimeLabel = sanitize(timeLabel);

  // Build location string
  const locationParts = [s.city, s.region, s.country].filter(
    (p) => p && p !== 'Unknown'
  );
  const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown Location';

  // Time display: "14 minutes ago (Local: 2:14 AM — Night Owl)"
  const timeLabelSuffix = safeTimeLabel ? ` — ${safeTimeLabel}` : '';
  const timeDisplay = `${relativeTime} (Local: ${safeLocalTime}${timeLabelSuffix})`;

  // System display: "Windows 11 / Desktop"
  const systemDisplay = `${s.os} / ${s.deviceType}`;

  // Colors — GitHub dark mode palette
  const bg = '#0d1117';
  const cardBg = '#161b22';
  const border = '#30363d';
  const titleColor = '#58a6ff';
  const labelColor = '#8b949e';
  const valueColor = '#c9d1d9';
  const ctaColor = '#58a6ff';
  const accentLine = '#1f6feb';

  // Dimensions
  const width = 480;
  const height = 195;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
  <style>
    .title { font: 600 13px 'Segoe UI', Arial, sans-serif; fill: ${titleColor}; letter-spacing: 0.5px; }
    .label { font: 400 11.5px 'Segoe UI', Arial, sans-serif; fill: ${labelColor}; }
    .value { font: 500 11.5px 'Segoe UI', Arial, sans-serif; fill: ${valueColor}; }
    .cta { font: 500 11px 'Segoe UI', Arial, sans-serif; fill: ${ctaColor}; text-decoration: underline; }
    .divider { stroke: ${border}; stroke-width: 1; }
  </style>

  <!-- Background -->
  <rect width="${width}" height="${height}" rx="6" fill="${bg}" />

  <!-- Card -->
  <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="6" fill="${cardBg}" stroke="${border}" stroke-width="1" />

  <!-- Accent bar -->
  <rect x="8" y="8" width="3" height="${height - 16}" rx="1.5" fill="${accentLine}" />

  <!-- Title -->
  <text x="28" y="36" class="title">THE LAST CURIOUS VISITOR</text>

  <!-- Separator -->
  <line x1="28" y1="46" x2="${width - 28}" y2="46" class="divider" />

  <!-- Row 1: Location -->
  <text x="28" y="68" class="label">Location</text>
  <text x="110" y="68" class="value">${location}</text>

  <!-- Row 2: Time -->
  <text x="28" y="90" class="label">Time</text>
  <text x="110" y="90" class="value">${timeDisplay}</text>

  <!-- Row 3: System -->
  <text x="28" y="112" class="label">System</text>
  <text x="110" y="112" class="value">${systemDisplay}</text>

  <!-- Row 4: Browser -->
  <text x="28" y="134" class="label">Browser</text>
  <text x="110" y="134" class="value">${s.browser}</text>

  <!-- Row 5: Language -->
  <text x="28" y="156" class="label">Language</text>
  <text x="110" y="156" class="value">${s.language}</text>

  <!-- CTA -->
  <text x="28" y="178" class="cta">Want to replace them? Click here and refresh this page.</text>
</svg>`;
}

module.exports = { generateSVG };
