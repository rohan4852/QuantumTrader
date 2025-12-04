# AITrader Chrome Extension

A passive chart analysis assistant powered by Google Gemini AI. This extension functions as a pure observer—no content scripts, no DOM injection, no bot detection risks.

## 📋 Features

✅ **Manifest V3 Compliant** - Modern, secure Chrome extension format  
✅ **Passive Observer Architecture** - All logic runs in the popup, zero DOM manipulation  
✅ **Gemini AI Integration** - Uses Gemini 1.5 Pro for advanced chart analysis  
✅ **No Build Tools Required** - Pure HTML, CSS, and Vanilla JavaScript  
✅ **Dark Trading Dashboard UI** - Professional, modern interface  
✅ **Local Storage** - API key saved securely in `chrome.storage.local`  
✅ **Error Handling** - Defensive coding with try-catch blocks throughout  

## 🚀 Installation

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Copy your API key (keep it secret!)

### Step 2: Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select the `AITrader` folder containing:
   - `manifest.json`
   - `popup.html`
   - `popup.js`
   - `styles.css`

### Step 3: Use the Extension

1. Click the AITrader extension icon in your toolbar
2. Paste your Gemini API Key in the input field
3. Select your asset type (Real Pair or Synthetic)
4. Select the H1 major trend (Bullish, Bearish, or Ranging)
5. Navigate to any chart on your trading platform
6. Click **"ANALYZE CHART"** - the extension will:
   - Capture a screenshot of the current tab
   - Send it to Gemini with your analysis rules
   - Display the recommendation: BET UP, BET DOWN, or NO TRADE

## 📁 File Structure

```
AITrader/
├── manifest.json      # Extension configuration (Manifest V3)
├── popup.html         # User interface markup
├── popup.js           # Core logic & API integration
├── styles.css         # Dark theme styling
└── README.md          # This file
```

## 🔐 Security Notes

- **API Key Storage**: Saved only in `chrome.storage.local` (device-only, never synced)
- **No Content Scripts**: Extension doesn't inject code into web pages
- **No DOM Manipulation**: Prevents bot/fraud detection triggers
- **API Calls**: Only to `generativelanguage.googleapis.com`
- **Screenshot**: Captured from your active tab locally, converted to base64, then sent to Gemini

## 🧠 How It Works

### Analysis Flow

```
User clicks "ANALYZE CHART"
    ↓
Captures visible tab as JPEG
    ↓
Converts to base64 format
    ↓
Constructs system prompt with user inputs
    ↓
Sends to Gemini 1.5 Pro with image + instructions
    ↓
Gemini analyzes chart structure, wicks, candles
    ↓
Returns JSON: { decision, confidence, reason }
    ↓
UI displays result with color coding
```

### System Prompt Rules

The extension includes hardcoded analysis rules:

1. **Real Pair + Ranging Trend** → Very conservative analysis
2. **Synthetic Assets** → Ignores external news context
3. **Visual Checks** → Looks for support/resistance structure (HH/HL/LH/LL) and rejection wicks
4. **Trap Detection** → Flags abnormally huge candles as potential traps (NO TRADE)

## 📊 Output Format

The extension displays:

- **Decision**: BET UP (green), BET DOWN (red), NO TRADE (orange)
- **Confidence**: Percentage (0-100%)
- **Reason**: One-sentence explanation of the analysis

Example:
```
Decision: BET UP
Confidence: 87%
Reason: Clear HH/HL structure with rejection wick on supply zone
```

## 🛠️ Customization

### Modify Analysis Rules

Edit the `SYSTEM_PROMPT` in `popup.js`:

```javascript
const SYSTEM_PROMPT = `You are a strict Market Analyst.
INPUTS:
- Asset Type: [ASSET_TYPE]
- Major Trend: [MAJOR_TREND]
- Image: [The Screenshot]

RULES:
1. ... (add your custom rules here)

OUTPUT FORMAT (JSON ONLY): ...
```

### Add More Asset Types

In `popup.html`, add options to the Asset Type dropdown:

```html
<select id="assetType" class="select">
    <option value="Real Pair (EUR/USD)">Real Pair (EUR/USD)</option>
    <option value="Synthetic (Asia Composite)">Synthetic (Asia Composite)</option>
    <option value="Your Asset Here">Your Asset Here</option>
</select>
```

### Change UI Colors

The dark theme is defined in `styles.css`. Key color variables:

- Primary: `#00d4ff` (cyan)
- Success: `#00c864` (green)
- Danger: `#ff6464` (red)
- Warning: `#ffaa00` (orange)
- Background: `#0f0f1e` (dark blue)

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Failed to capture chart image" | Ensure a browser tab is active when you click Analyze |
| "API Key is invalid" | Check your API key from [Google AI Studio](https://aistudio.google.com/apikey) |
| "API Error: 400 Bad Request" | Verify the image was captured and API key is correct |
| "No response from API" | Check your internet connection and API quota |
| Extension doesn't load | Ensure all 4 files are in the folder and manifest.json is valid JSON |

## 📜 API Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_KEY

Payload:
{
  "contents": [{
    "parts": [
      { "text": "System prompt with analysis rules" },
      { "inline_data": { 
          "mime_type": "image/jpeg", 
          "data": "BASE64_ENCODED_IMAGE" 
        }
      }
    ]
  }]
}
```

## ⚡ Performance

- **Popup Opens**: ~100ms
- **Screenshot Capture**: ~500ms
- **API Response**: ~3-5 seconds (depends on Gemini processing)
- **Total Analysis Time**: ~4-6 seconds

## 📝 Version History

- **v1.0.0** (2025-11-19): Initial release
  - Manifest V3 support
  - Gemini 1.5 Pro integration
  - Dark theme UI
  - Local API key storage
  - System prompt with trading rules

## ⚠️ Disclaimer

This extension is a **passive analysis tool** and should not be used as financial advice. Always conduct your own research and use proper risk management. Past performance does not guarantee future results.

## 📄 License

This extension is provided as-is for educational and personal use.

---

**Need help?** Check the browser console (F12) for debug logs. All errors are logged to help troubleshoot issues.
