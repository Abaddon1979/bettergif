# ChatGIF / BetterGIF Discourse Plugin

A GIF picker for Discourse chat and the forum composer, powered by the [KLIPY](https://klipy.com) API. Requests are proxied through the Discourse backend so your API key stays private and each logged-in user gets a stable hashed `customer_id` for personalization and ad monetization.

## Features

- GIF button in chat composer and forum toolbar
- Trending GIFs on open, search as you type
- Optional KLIPY ads in results (`type: "ad"`) when ads are enabled on your API key
- Per-user `customer_id` (SHA-256 of Discourse user id + site secret)
- Share tracking when a GIF is inserted
- Chat inline preview + duplicate onebox cleanup

## Installation

1. Clone or copy this plugin into your Discourse `plugins/` directory
2. Rebuild / restart Discourse
3. Enable the plugin
4. Set **KLIPY API key** under Admin → Settings → Plugins

Get a key at [partner.klipy.com](https://partner.klipy.com). Enable ads on the key in the KLIPY dashboard when you are ready to monetize.

## Configuration

| Setting | Purpose |
| --- | --- |
| `chatgif_enabled` | Turn the picker on/off |
| `chatgif_klipy_api_key` | KLIPY app key (secret, server-side only) |
| `chatgif_klipy_locale` | Locale for trending/search (e.g. `en_US`) |
| `chatgif_klipy_content_filter` | `off` / `low` / `medium` / `high` |
| `chatgif_klipy_ad_min_width` / `_max_width` / `_min_height` / `_max_height` | Ad slot sizes sent to KLIPY |

## How monetization works

Discourse core's built-in GIF picker talks to KLIPY but does **not** send `customer_id`. This plugin does not patch core. Instead it proxies:

- `GET /chatgif/trending`
- `GET /chatgif/search?q=...`
- `GET /chatgif/recent`
- `POST /chatgif/share`

Each request includes a hashed `customer_id` like `usr_<16 hex chars>` plus the recommended ad size params. When ads are enabled for your KLIPY key, responses may include objects with `"type":"ad"`; the picker renders those as sandboxed iframes.

## Usage

1. Open chat or the post composer
2. Click the film / Insert GIF button
3. Browse trending or search
4. Click a GIF to insert it (ads are display-only)

## File structure

```
bettergif/
├── plugin.rb
├── assets/
│   ├── javascripts/discourse/initializers/chatgif-initializer.js
│   └── stylesheets/chatgif.scss
├── config/
│   ├── settings.yml
│   └── locales/
│       ├── client.en.yml
│       └── server.en.yml
└── README.md
```

## License

MIT License
