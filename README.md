# LastClicker

A dynamic GitHub README widget that shows information about the **last person who clicked it** — their location, browser, OS, language, and local time.

No raw IPs are stored. No emojis. No fluff. Just clean, privacy-safe visitor data rendered as a live SVG.

## How It Works

1. A visitor sees the widget on your GitHub profile and clicks it.
2. Your server captures their HTTP headers, looks up their location (then discards the IP), and saves the data.
3. The visitor is redirected back to your profile.
4. On refresh, GitHub fetches a fresh SVG from your server showing the new data.

## The Widget

Add this to your GitHub profile `README.md`:

```markdown
[![Last Visitor](https://your-app.onrender.com/status.svg)](https://your-app.onrender.com/click)
```

Replace `your-app` with your actual Render app name.

## Setup

### 1. Upstash Redis

- Sign up at [upstash.com](https://upstash.com) (free, no credit card)
- Create a Redis database
- Copy the **REST URL** and **REST Token**

### 2. Deploy to Render

- Push this repo to GitHub
- Go to [render.com](https://render.com) → New → Web Service
- Connect your GitHub repo
- Set **Build Command**: `npm install`
- Set **Start Command**: `npm start`
- Add environment variables:
  - `UPSTASH_REDIS_REST_URL` — from Upstash
  - `UPSTASH_REDIS_REST_TOKEN` — from Upstash
  - `GITHUB_PROFILE_URL` — `https://github.com/ZyAzOsK`
- Deploy

### 3. UptimeRobot (Keep Alive)

Render's free tier sleeps after 15 minutes of inactivity. To prevent this:

- Sign up at [uptimerobot.com](https://uptimerobot.com) (free)
- Create a new **HTTP(s) Monitor**
- URL: `https://your-app.onrender.com/health`
- Interval: **5 minutes**

This pings your `/health` endpoint every 5 minutes, keeping the server awake.

## Tech Stack

- **Node.js** + **Express** — web server
- **Upstash Redis** — stores last visitor data (1 key)
- **ua-parser-js** — parses browser and OS from User-Agent
- **ip-api.com** — converts IP to location (IP discarded after lookup)
- **express-rate-limit** — flood protection (1 click per IP per minute)

## Privacy & Security

- IP addresses are **never stored** — used only for geo-lookup, then discarded
- Only derived data is saved: city, region, country, timezone, OS, browser, language
- Rate limiting prevents abuse (1 click per IP per minute)
- Referer check — only clicks originating from `github.com` are accepted

## License

MIT
