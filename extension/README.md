# TruthChain-X Browser Extension

## Load locally

1. Start the Next.js app on `http://localhost:3000`
2. Open Chrome or Edge extensions
3. Enable Developer Mode
4. Click **Load unpacked**
5. Select this `extension/` folder

## What it does

- captures the current URL
- captures visible page text
- sends both to `POST /api/analyze`
- shows phishing verdict in the popup
- injects a warning banner on high-risk pages
