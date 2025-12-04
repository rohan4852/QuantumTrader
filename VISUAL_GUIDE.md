# AITrader Extension - Visual Installation Guide

## 📱 Step-by-Step Visual Instructions

### STEP 1: Obtain Gemini API Key (2 minutes)

```
Visit: https://aistudio.google.com/apikey
     ↓
Click "Create API Key" button
     ↓
Copy the key (starts with AIza...)
     ↓
KEEP IT SECRET - Don't share!
```

**What it looks like:**
```
Gemini API Key
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AIza_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Copy]
```

---

### STEP 2: Enable Developer Mode in Chrome (1 minute)

```
Open Chrome
     ↓
Type: chrome://extensions/
     ↓
Look for toggle switch in TOP-RIGHT corner
     ↓
Click "Developer mode" toggle → Turn ON
     ↓
Page should refresh with new buttons
```

**What it looks like:**
```
┌─ chrome://extensions/ ─────────────────────────────┐
│                                                     │
│  Extensions              [🔍] [☰]  [Developer     │
│                                      mode] ⊙ ON   │
│                                                     │
│  ┌─ INSTALLED EXTENSIONS ────────────────────────┐ │
│  │ (Your extensions appear here)                │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  [Load unpacked] [Pack] [Keyboard shortcuts]      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

### STEP 3: Load AITrader Extension (1 minute)

```
Click "Load unpacked" button
     ↓
File browser opens
     ↓
Navigate to: D:\VS\AITrader\
     ↓
Select the AITrader folder
     ↓
Click "Select Folder"
     ↓
Extension loads & appears in toolbar!
```

**What it looks like:**
```
File Browser:
┌─────────────────────────────────────────┐
│ 📁 This PC > D:\ > VS >                  │
│                                          │
│ 📁 AITrader                              │
│    ├─ manifest.json ✓                   │
│    ├─ popup.html ✓                      │
│    ├─ popup.js ✓                        │
│    └─ styles.css ✓                      │
│                                          │
│        [Cancel]  [Select Folder]        │
└─────────────────────────────────────────┘
```

**After loading:**
```
Chrome toolbar (top-right):
┌─ Extensions ──────────────────┐
│                               │
│  🎨 [AITrader icon]  📌      │
│  (Click to open popup)        │
│                               │
└───────────────────────────────┘
```

---

### STEP 4: Configure AITrader Popup (2 minutes)

```
Click AITrader icon in toolbar
     ↓
Popup window opens
     ↓
Paste your Gemini API Key
     ↓
Select Asset Type (dropdown)
     ↓
Select H1 Major Trend (dropdown)
     ↓
Ready to analyze!
```

**Popup Layout:**

```
┌─────────────────────────────────────────┐
│                                         │
│   🚀 AITrader                           │
│   Passive Chart Analysis                │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ 🔑 Gemini API Key                       │
│ [__________________________] [👁️]       │
│ Saved locally. Never sent...            │
│                                         │
│ 📊 Asset Type                           │
│ [▼ Real Pair (EUR/USD)]                 │
│                                         │
│ 📈 H1 Major Trend                       │
│ [▼ Bullish]                             │
│                                         │
│ ⚫ Safe to Trade                        │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│    [ANALYZE CHART]                      │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│ v1.0.0 | Powered by Gemini API          │
│                                         │
└─────────────────────────────────────────┘
```

---

### STEP 5: Analyze Your First Chart (4-6 seconds)

```
Open any trading website
     ↓
Navigate to a chart (TradingView, MT4, etc.)
     ↓
Click AITrader extension icon
     ↓
Click "ANALYZE CHART" button
     ↓
Wait for processing (~4-6 seconds)
     ↓
See result: BET UP / BET DOWN / NO TRADE
```

**During Analysis:**
```
┌─────────────────────────────────────────┐
│                                         │
│   ANALYZE CHART                         │
│                                         │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← Loading bar
│                                         │
│ (Processing: 4-6 seconds...)            │
│                                         │
└─────────────────────────────────────────┘
```

**Result Display:**
```
┌─────────────────────────────────────────┐
│                                         │
│ Analysis Result                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │  BET UP  ✨                         │ │
│ │                                     │ │
│ │ Confidence: 87%                     │ │
│ │ Reason: Clear HH/HL structure...   │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎨 UI Components Explained

### Input Field - Gemini API Key
```
┌─────────────────────────────────────┐
│ 🔑 Gemini API Key                   │
│ [••••••••••••••••••••••] [👁️ Show]  │
│ Saved locally. Never sent anywhere. │
└─────────────────────────────────────┘
```

**Features:**
- Password type (dots) by default
- Click 👁️ to show/hide
- Auto-saves to `chrome.storage.local`
- Persists after closing popup

### Dropdown - Asset Type
```
┌─────────────────────────────────────┐
│ 📊 Asset Type                       │
│ ┌───────────────────────────────────┐ │
│ │ Real Pair (EUR/USD)       ✓      │ │
│ │ Synthetic (Asia Composite)       │ │
│ └───────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Options:**
- Real Pair (EUR/USD) - Triggers conservative rules
- Synthetic (Asia Composite) - Ignores external news

### Dropdown - H1 Major Trend
```
┌─────────────────────────────────────┐
│ 📈 H1 Major Trend                   │
│ ┌───────────────────────────────────┐ │
│ │ Bullish              ✓            │ │
│ │ Bearish                           │ │
│ │ Ranging                           │ │
│ └───────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Options:**
- Bullish - Uptrend
- Bearish - Downtrend
- Ranging - Sideways (triggers conservative rules)

### Status Badge
```
Real-time Status Indicator

Safe to Trade:
┌─────────────────────────────────────┐
│ ⚫ Safe to Trade                    │  (Green dot, pulsing)
└─────────────────────────────────────┘

Danger:
┌─────────────────────────────────────┐
│ 🔴 Danger                           │  (Red dot, pulsing)
└─────────────────────────────────────┘
```

### Main Button - Analyze Chart
```
Big Blue Button - Centered, Full Width

          [ANALYZE CHART]

- Cyan gradient background
- Disabled during loading
- Shows loading spinner while processing
```

### Result Display
```
┌─ Analysis Result ─────────────────────┐
│                                       │
│  ╔═══════════════════════════════╗   │
│  ║                               ║   │
│  ║       BET UP                  ║   │
│  ║                               ║   │
│  ║  Confidence: 87%              ║   │
│  ║  Reason: Clear HH/HL...       ║   │
│  ║                               ║   │
│  ╚═══════════════════════════════╝   │
│                                       │
└───────────────────────────────────────┘

Color coding:
- BET UP   → Green (#00c864)
- BET DOWN → Red (#ff6464)
- NO TRADE → Orange (#ffaa00)
```

### Error Display
```
┌─ Error ───────────────────────────────┐
│                                       │
│ ⚠️  API Key is empty                 │
│     Please enter your Gemini API key │
│                                       │
└───────────────────────────────────────┘

Red background, clickable close
```

---

## 🌈 Color Reference

### Dark Theme Colors

| Component | Color | Hex | Usage |
|-----------|-------|-----|-------|
| Primary Accent | Cyan | `#00d4ff` | Headers, buttons |
| Success | Green | `#00c864` | "BET UP" result |
| Danger | Red | `#ff6464` | "BET DOWN" result |
| Warning | Orange | `#ffaa00` | "NO TRADE" result |
| Dark BG | Navy | `#0f0f1e` | Main background |
| Card BG | Deep Navy | `#1a1a2e` | Inputs, cards |
| Borders | Dark Cyan | `#2a2a3e` | Dividers, borders |
| Text | Light Gray | `#e0e0e0` | Main text |
| Muted | Medium Gray | `#c0c0c0` | Secondary text |
| Hint | Dark Gray | `#888` | Small text, hints |

---

## 📊 Data Flow Visualization

### From Chart to Analysis

```
┌─ Browser Tab ─────────────────────┐
│ [Trading Chart with Candles]      │
│ (EUR/USD, 1H timeframe)           │
└────────────┬──────────────────────┘
             │
             │ Screenshot capture
             │ chrome.tabs.captureVisibleTab()
             ↓
┌─ Extension Popup ──────────────────┐
│ Image → Base64 conversion          │
└────────────┬──────────────────────┘
             │
             │ POST Request
             │ + System Prompt
             │ + Asset Type
             │ + H1 Trend
             ↓
┌─ Google Gemini API ────────────────┐
│ generativelanguage.googleapis.com  │
│                                    │
│ Analyzes:                          │
│ - Chart Structure (HH/HL/LH/LL)   │
│ - Rejection Wicks                  │
│ - Candle Size (Trap Detection)    │
└────────────┬──────────────────────┘
             │
             │ JSON Response
             │ {
             │   "decision": "BET UP",
             │   "confidence": "87%",
             │   "reason": "..."
             │ }
             ↓
┌─ Extension Popup ──────────────────┐
│ Parse & Display Result             │
│                                    │
│ ╔══════════════════════════════╗  │
│ ║  BET UP                      ║  │
│ ║  Confidence: 87%             ║  │
│ ║  Reason: Clear HH/HL...      ║  │
│ ╚══════════════════════════════╝  │
└────────────────────────────────────┘
```

---

## ⚡ Quick Reference Shortcuts

### Chrome Extensions URL
```
chrome://extensions/          → View all extensions
chrome://extensions/          → (with Developer mode ON)
```

### Extension Folder Location
```
D:\VS\AITrader\               → Main extension folder
```

### Required Files
```
✅ manifest.json              → Must exist & be valid JSON
✅ popup.html                 → UI markup
✅ popup.js                   → Logic & API calls
✅ styles.css                 → Styling
```

### Browser Console Access
```
Keyboard: F12 (in popup window)
View:     Right-click popup → Inspect
Logs:     Shows all console.log() messages
```

---

## 🚦 Status Indicators

### During Operation

| State | Indicator | Meaning |
|-------|-----------|---------|
| Ready | ⚫ Safe | OK to analyze |
| Danger | 🔴 Danger | Wait before analyzing |
| Loading | ░░░░░░░░░ | Processing (4-6 sec) |
| Success | ✅ Result | Analysis complete |
| Error | ⚠️ Error | Fix & retry |

---

## 💡 Tips & Tricks

1. **Quick Analysis**
   - Keep extension popup open
   - Switch between charts
   - Click Analyze for each chart

2. **API Key Management**
   - Click 👁️ icon to verify key before copying
   - Extension saves automatically
   - Safe from website tracking

3. **Better Results**
   - Ensure chart is visible before analyzing
   - Use clean charts (good contrast)
   - Try different H1 Trend settings

4. **Debugging**
   - Right-click popup → Inspect
   - Check console for errors
   - Look for API response details

---

## 🎯 Expected Results Timeline

```
T=0s      Click "ANALYZE CHART"
T=0.5s    Screenshot captured
T=0.7s    Image converted to base64
T=1s      Request sent to Gemini
T=1-6s    Gemini processing (3-5s average)
T=6s      Response received
T=6.2s    JSON parsed
T=6.3s    UI updated with result
```

Total: **~4-6 seconds** per analysis

---

## ✅ Verification Checklist

After loading, verify:

- [ ] AITrader icon appears in Chrome toolbar
- [ ] Icon is clickable (opens popup)
- [ ] API Key input field is visible
- [ ] Asset Type dropdown works
- [ ] H1 Trend dropdown works
- [ ] Status badge shows "Safe to Trade"
- [ ] Analyze button is clickable
- [ ] Analyze button is blue/cyan
- [ ] No console errors (F12)

---

## 🎉 You're Ready!

Your AITrader extension is fully installed and ready to use.

**First trade analysis:** Open a chart and click "ANALYZE CHART"!

---

**Happy analyzing! 📈**

Version 1.0.0 | Ready to Load
