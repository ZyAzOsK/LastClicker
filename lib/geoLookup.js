/**
 * Looks up geographic location from an IP address using ip-api.com.
 * The IP is used only for this lookup and is never stored.
 */
async function geoLookup(ip) {
  const fallback = {
    city: 'Unknown',
    region: 'Unknown',
    country: 'Somewhere on Earth',
    timezone: 'UTC',
  };

  try {
    // Validate IP format (allow only IPv4/IPv6 chars) to prevent injection
    // Do not URL-encode it, because ip-api fails if colons are encoded to %3A
    const cleanIp = (ip || '').trim();
    if (!cleanIp || !/^[a-fA-F0-9.:]+$/.test(cleanIp)) return fallback;

    // ip-api.com is free for non-commercial use, no API key needed
    const res = await fetch(
      `http://ip-api.com/json/${cleanIp}?fields=city,regionName,country,timezone,status`
    );

    if (!res.ok) return fallback;

    const data = await res.json();

    if (data.status === 'fail') return fallback;

    return {
      city: data.city || fallback.city,
      region: data.regionName || fallback.region,
      country: data.country || fallback.country,
      timezone: data.timezone || fallback.timezone,
    };
  } catch (err) {
    console.error('[geoLookup] Failed:', err.message);
    return fallback;
  }
}

module.exports = { geoLookup };
