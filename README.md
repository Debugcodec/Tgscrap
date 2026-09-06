# Telegram Deal Forwarder Bot 🚀

An automated Telegram listener and notification forwarder built with Node.js, [GramJS](https://github.com/gram-js/gramjs) (Telegram Client API), and the Telegram Bot API. It monitors incoming messages across your joined groups and channels for specific deal keywords, filters out duplicate alerts, and forwards formatted notifications to your chosen target chat via a bot.

---

## ⚡ Features

- **Keyword Monitoring:** Listens for custom keywords like `flipkart`, `shopsy`, `laptop`, `commission`, `meesho`, and more.
- **Smart Anti-Spam (Debounce):** Tracks message fingerprints to avoid duplicate alerts within a 6-hour window.
- **Entity Resolution:** Automatically formats group, channel, and sender information into clickable HTML links.
- **Entity Caching:** In-memory cache for chat and user data to minimize API requests and stay within Telegram rate limits.
- **Secure Configuration:** Keeps credentials safe using environment variables (`.env`).

---

## 📋 Prerequisites

- **Node.js:** v16.0.0 or higher
- **npm:** v8.0.0 or higher
- **Telegram App Credentials:** `API ID` and `API Hash` from [my.telegram.org](https://my.telegram.org)
- **Telegram Bot Token:** Obtained from [@BotFather](https://t.me/BotFather)
- **GramJS Session String:** A valid `StringSession` for user-account authentication

---

## 🚀 Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Debugcodec/Tgscrap.git](https://github.com/Debugcodec/Tgscrap.git)
   cd Tgscrap
   ```
2.  **Install dependencies:**
   ```bash
 npm install telegram dotenv
```
3. **Configure environment variables:**
Copy the example environment file
```bash
 cp .env.example .env
```
4. **Open .env and fill in your details:**
```bash
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TARGET_PEER=-100xxxxxxxxxx
BOT_TOKEN=your_bot_token
TELEGRAM_SESSION_STRING=your_session_string
```

## ⚙️ Environment Variables

Create a `.env` file in the root directory and add the following variables:

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `TELEGRAM_API_ID` | Yes | App API ID from [my.telegram.org](https://my.telegram.org) (integer). | `25481802` |
| `TELEGRAM_API_HASH` | Yes | App API Hash string from [my.telegram.org](https://my.telegram.org). | `ad9985a4b0a09112fb0a45dc...` |
| `TARGET_PEER` | Yes | Chat or Channel ID where alerts are sent. Prefix with `-100` for channels and supergroups. | `-1003885749609` |
| `BOT_TOKEN` | Yes | HTTP Bot API token obtained from [@BotFather](https://t.me/BotFather). | `1854272732:AAHoeUfEL...` |
| `TELEGRAM_SESSION_STRING` | Yes | Base64-encoded GramJS `StringSession` representing your authenticated user login. | `1BQANOTEuMTA4LjU2...` |

> ⚠️ **Security Warning:** Never commit your `.env` file to GitHub or share your `TELEGRAM_SESSION_STRING`. Ensure `.env` is included in your `.gitignore`.

## 📝 Customizing Keywords

The forwarder listens for specific trigger words configured inside `index.js`. Any incoming message that includes at least one matching keyword (case-insensitive) will be captured and forwarded.

Open `index.js` and locate the `keywords` array near the top of the file:

```javascript
const keywords = [
  'flipkart',
  'shopsy',
  'laptop',
  'only order',
  'order only',
  'commission',
  'meesho',
  'msho',
  'fk',
  'fkt',
  'empty'
];
