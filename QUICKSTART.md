# AITrader - Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites
- Google Chrome (or Chromium-based browser)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation Steps

1. **Clone/Download this folder**
   ```
   D:\VS\AITrader\
   ```

2. **Get API Key** (1 minute)
   - Visit: https://aistudio.google.com/apikey
   - Click "Create API Key"
   - Copy the key

3. **Load in Chrome** (2 minutes)
   - Open: `chrome://extensions/`
   - Toggle "Developer mode" (top-right)
   - Click "Load unpacked"
   - Select the `AITrader` folder

4. **Configure Extension** (2 minutes)
   - Click AITrader icon in toolbar
   - Paste your API key
   - Select Asset Type (Real Pair or Synthetic)
   - Select H1 Trend (Bullish, Bearish, Ranging)

5. **Run Analysis**
   - Open a trading chart (any broker's website)
   - Click "ANALYZE CHART" in the extension popup
   - Wait 4-6 seconds for result

---

## 📋 Architecture Overview

```
┌─────────────────────────────────────┐
│   Chrome Extension Popup            │
│  (popup.html + popup.js)            │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼─────┐   ┌──▼─────────────┐
   │Screenshot │   │ API Key from   │
   │  Capture  │   │ chrome.storage │
   └────┬─────┘   └────────────────┘
        │
   ┌────▼──────────────────────┐
   │  Base64 Image Encoding    │
   └────┬──────────────────────┘
        │
   ┌────▼───────────────────────────────────┐
   │  Google Gemini 1.5 Pro API             │
   │  (generativelanguage.googleapis.com)   │
   └────┬────────────────────────────────────┘
        │
   ┌────▼──────────────────┐
   │ JSON Response Parse   │
   │ { decision, conf... } │
   └────┬──────────────────┘
        │
   ┌────▼──────────────────┐
   │   UI Result Display   │
   │ BET UP / DOWN / WAIT  │
   └───────────────────────┘
```

---

## 🔑 Key Features

| Feature | Details |
|---------|---------|
| **No Build Tools** | Pure HTML/CSS/JS—no npm, webpack, or compilation |
| **Manifest V3** | Latest Chrome extension standard |
| **Passive Observer** | No content scripts, no DOM injection |
| **Bot Detection Safe** | Runs only in popup—external sites can't detect you |
| **Secure Storage** | API key stored locally in `chrome.storage.local` |
| **Error Handling** | Try-catch blocks on all API calls |
| **Dark UI** | Professional trading dashboard theme |

---

## 📁 Files Explained

| File | Purpose |
|------|---------|
| `manifest.json` | Extension metadata (permissions, endpoints, icons) |
| `popup.html` | User interface layout |
| `styles.css` | Dark theme styling |
| `popup.js` | Core logic (capture, API calls, parsing) |
| `README.md` | Full documentation |
| `QUICKSTART.md` | This file |

---

## 🎯 System Prompt (Built-in Analysis Rules)

The extension sends this instruction to Gemini along with your screenshot:

```
You are a strict Market Analyst.

INPUTS:
- Asset Type: [Real Pair or Synthetic]
- Major Trend: [Bullish, Bearish, or Ranging]
- Image: [Screenshot of chart]

RULES:
1. IF Asset is 'Real Pair (EUR/USD)' AND Major Trend is 'Ranging' → Be very conservative
2. IF Asset is 'Synthetic' → Ignore external news
3. VISUAL CHECK: Look for Structure (HH/HL for Buy, LH/LL for Sell) and Rejection Wicks
4. TRAP CHECK: If the last candle is abnormally huge → output NO TRADE

OUTPUT: JSON with { decision, confidence, reason }
```

---

## 🧪 Testing

### Test Capture
1. Open any website with a chart
2. Click extension → "ANALYZE CHART"
3. Check if image is captured (you should see a brief flash)

### Test API
1. Paste your Gemini API key
2. Try analysis on a simple chart
3. Check browser console (F12) for detailed logs

### Expected Response Time
- Screenshot: ~500ms
- API processing: ~3-5 seconds
- Total: ~4-6 seconds

---

## ⚙️ Customization

### Change Default Selections
Edit `popup.html` - modify `<option>` tags in dropdowns

### Add Analysis Rules
Edit `popup.js` - modify the `SYSTEM_PROMPT` constant (lines 12-35)

### Change UI Colors
Edit `styles.css` - search for `#00d4ff` (primary cyan color) and replace

### Change API Model
Edit `popup.js` line 161 - change `gemini-1.5-pro` to another model name

---

## 🐛 Common Issues

### "Failed to capture chart image"
- **Cause**: No active browser tab
- **Fix**: Ensure you're on a website with a visible chart

### "API Key is invalid"
- **Cause**: Wrong or expired API key
- **Fix**: Generate new key at https://aistudio.google.com/apikey

### "No response from API"
- **Cause**: Network error or API quota exceeded
- **Fix**: Check internet connection, wait a moment, try again

### Extension doesn't appear in toolbar
- **Cause**: Not loaded correctly
- **Fix**: Go to `chrome://extensions/`, check for errors

### "Extension doesn't respond" in popup
- **Cause**: JavaScript error
- **Fix**: Press F12, check Console tab for error messages

---

## 📞 Support Tips

1. **Check Browser Console** (F12 → Console tab)
   - All errors and logs are printed here
   - Copy error message for debugging

2. **Verify API Key Format**
   - Should be long (50+ characters)
   - All alphanumeric + dashes
   - Starts with `AIza...` for Google API keys

3. **Test with Simple Chart**
   - Try on TradingView, MT4, or any financial site
   - Ensure chart is visible before clicking Analyze

4. **Check Permissions**
   - Go to `chrome://extensions/`
   - Click AITrader → Details
   - Verify permissions are granted

---

## 🚀 What's Next?

- Monitor analysis accuracy on real trades
- Adjust system prompt rules based on results
- Track confidence scores over time
- Backtest different Asset Type + Trend combinations

---

## 📜 Legal Notice

This extension is an **analysis tool only**. It is NOT financial advice. Always:
- Conduct your own research
- Use proper risk management
- Paper trade before real capital
- Never rely solely on AI recommendations

**Use at your own risk.**

---

**Extension Ready!** Start analyzing charts. 🚀
