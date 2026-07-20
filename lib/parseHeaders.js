const UAParser = require('ua-parser-js');

/**
 * Map of common locale codes to human-readable language names.
 */
const LANGUAGE_MAP = {
  en: 'English',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'en-AU': 'English (AU)',
  'en-CA': 'English (CA)',
  'en-IN': 'English (IN)',
  es: 'Spanish',
  'es-ES': 'Spanish (Spain)',
  'es-MX': 'Spanish (Mexico)',
  fr: 'French',
  'fr-FR': 'French (France)',
  'fr-CA': 'French (Canada)',
  de: 'German',
  'de-DE': 'German (Germany)',
  it: 'Italian',
  pt: 'Portuguese',
  'pt-BR': 'Portuguese (Brazil)',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ar: 'Arabic',
  hi: 'Hindi',
  bn: 'Bengali',
  pa: 'Punjabi',
  te: 'Telugu',
  ta: 'Tamil',
  mr: 'Marathi',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  ur: 'Urdu',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  tr: 'Turkish',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
  uk: 'Ukrainian',
  cs: 'Czech',
  ro: 'Romanian',
  hu: 'Hungarian',
  el: 'Greek',
  he: 'Hebrew',
  fa: 'Persian',
  sw: 'Swahili',
};

/**
 * Parses the Accept-Language header and returns a human-readable language string.
 * Example: "en-US,en;q=0.9,hi;q=0.8" → "English (US) / Hindi"
 */
function parseLanguage(acceptLanguage) {
  if (!acceptLanguage) return 'Unknown';

  // Extract locale codes, sorted by quality factor (already in order from browser)
  const locales = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0].trim())
    .filter(Boolean);

  if (locales.length === 0) return 'Unknown';

  // Map to human-readable names, take top 2
  const names = locales
    .slice(0, 2)
    .map((locale) => {
      // Try exact match first (e.g., "en-US"), then base language (e.g., "en")
      return LANGUAGE_MAP[locale] || LANGUAGE_MAP[locale.split('-')[0]] || locale;
    });

  // Deduplicate (e.g., "English (US)" and "English" → just "English (US)")
  const unique = [...new Set(names)];
  return unique.join(' / ');
}

/**
 * Parses the User-Agent header and returns structured device info.
 */
function parseUserAgent(userAgentString) {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const osName = result.os.name || 'Unknown OS';
  const osVersion = result.os.version || '';
  const browserName = result.browser.name || 'Unknown Browser';
  const browserVersion = result.browser.major || '';
  const deviceType = result.device.type || 'Desktop'; // ua-parser-js returns undefined for desktops

  return {
    os: osVersion ? `${osName} ${osVersion}` : osName,
    browser: browserVersion ? `${browserName} ${browserVersion}` : browserName,
    deviceType: deviceType.charAt(0).toUpperCase() + deviceType.slice(1),
  };
}

/**
 * Returns a time-of-day label based on the hour (0-23).
 */
function getTimeLabel(hour) {
  if (hour >= 5 && hour <= 11) return 'Early Bird';
  if (hour >= 12 && hour <= 16) return 'Afternoon Explorer';
  if (hour >= 17 && hour <= 20) return 'Evening Visitor';
  return 'Night Owl';
}

/**
 * Calculates the local time string and label for a given timezone.
 */
function getLocalTime(timezone, timestamp) {
  try {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const localTimeStr = formatter.format(date);

    // Get the hour in 24h format for the label
    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    const hour = parseInt(hourFormatter.format(date), 10);
    const label = getTimeLabel(hour);

    return { localTimeStr, label };
  } catch {
    return { localTimeStr: 'Unknown', label: '' };
  }
}

/**
 * Calculates a human-readable relative time string.
 * Example: "14 minutes ago", "2 hours ago", "3 days ago"
 */
function getRelativeTime(timestamp) {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

module.exports = {
  parseLanguage,
  parseUserAgent,
  getLocalTime,
  getRelativeTime,
};
