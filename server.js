require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const { Redis } = require('@upstash/redis');
const { geoLookup } = require('./lib/geoLookup');
const { parseUserAgent, parseLanguage } = require('./lib/parseHeaders');
const { generateSVG } = require('./lib/svgGenerator');

// ─── Config ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const GITHUB_PROFILE_URL = process.env.GITHUB_PROFILE_URL;
const REDIS_KEY = 'last_visitor_data';

if (!GITHUB_PROFILE_URL) {
  console.error('[LastClicker] GITHUB_PROFILE_URL env var is required.');
  process.exit(1);
}

// ─── Redis ────────────────────────────────────────────────────────────────────

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn('[LastClicker] Redis env vars missing — data will not persist.');
}

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express();

// Trust the first proxy (Render's load balancer) so req.ip reads X-Forwarded-For
app.set('trust proxy', 1);

// ─── Rate Limiter (only for /click) ───────────────────────────────────────────

const clickLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 request per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: `
    <html>
      <head><title>Slow down</title></head>
      <body style="font-family: system-ui; background: #0d1117; color: #c9d1d9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
        <div style="text-align: center; max-width: 400px;">
          <h1 style="color: #58a6ff;">Too many clicks</h1>
          <p>You can only click once per minute. Wait a moment, then try again.</p>
          <a href="${GITHUB_PROFILE_URL}" style="color: #58a6ff;">Back to profile</a>
        </div>
      </body>
    </html>
  `,
  handler: (req, res) => {
    res.status(429).send(clickLimiter.message);
  },
});

// ─── GET /click — Capture & Redirect ──────────────────────────────────────────

app.get('/click', clickLimiter, async (req, res) => {
  // Only accept clicks that originated from GitHub (Referer check)
  const referer = req.get('Referer') || req.get('Referrer') || '';
  const refererUrl = (() => { try { return new URL(referer); } catch { return null; } })();
  const isFromGitHub = refererUrl && refererUrl.hostname === 'github.com';
  if (!isFromGitHub) {
    return res.status(403).send(`
      <html>
        <head><title>Forbidden</title></head>
        <body style="font-family: system-ui; background: #0d1117; color: #c9d1d9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px;">
            <h1 style="color: #f85149;">Access Denied</h1>
            <p>This widget only works from a GitHub profile page.</p>
            <a href="${GITHUB_PROFILE_URL}" style="color: #58a6ff;">Visit the profile</a>
          </div>
        </body>
      </html>
    `);
  }

  try {
    // 1. Extract IP (held in memory only, never stored)
    const ip = req.ip;

    // 2. Geo-lookup (IP → location, then IP is discarded)
    const geo = await geoLookup(ip);

    // 3. Parse User-Agent
    const userAgentString = req.get('User-Agent') || '';
    const { os, browser, deviceType } = parseUserAgent(userAgentString);

    // 4. Parse language
    const acceptLanguage = req.get('Accept-Language') || '';
    const language = parseLanguage(acceptLanguage);

    // 5. Build the data payload (no IP stored)
    const visitorData = {
      city: geo.city,
      region: geo.region,
      country: geo.country,
      timezone: geo.timezone,
      os,
      browser,
      deviceType,
      language,
      timestamp: new Date().toISOString(),
    };

    // 6. Save to Redis (overwrite the single key)
    if (redis) {
      await redis.set(REDIS_KEY, JSON.stringify(visitorData));
    }

    console.log(`[click] Recorded visitor from ${geo.city}, ${geo.country}`);
  } catch (err) {
    console.error('[click] Error:', err.message);
    // Still redirect even if capture fails
  }

  // 7. Redirect back to GitHub profile
  res.redirect(302, GITHUB_PROFILE_URL);
});

// ─── GET /status.svg — Dynamic SVG Image ─────────────────────────────────────

app.get('/status.svg', async (req, res) => {
  let data = null;

  try {
    if (redis) {
      const stored = await redis.get(REDIS_KEY);
      if (stored) {
        data = typeof stored === 'string' ? JSON.parse(stored) : stored;
      }
    }
  } catch (err) {
    console.error('[status.svg] Redis error:', err.message);
  }

  // Generate SVG (uses fallback values if data is null)
  const svg = generateSVG(data);

  // Strict cache-busting headers to prevent GitHub Camo from caching
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.send(svg);
});

// ─── GET /health — Keep-alive for UptimeRobot ────────────────────────────────

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[LastClicker] Server running on port ${PORT}`);
  console.log(`[LastClicker] Redirect target: ${GITHUB_PROFILE_URL}`);
});
