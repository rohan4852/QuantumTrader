# AITrader - Technical Reference

## API Integration Details

### Endpoint
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY
```

### Request Method
```
POST
```

### Request Headers
```
Content-Type: application/json
```

### Request Payload Structure

```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "You are a strict Market Analyst.\nINPUTS:\n- Asset Type: [ASSET_TYPE]\n- Major Trend: [MAJOR_TREND]\n- Image: [The Screenshot]\n\nRULES:\n1. IF Asset is 'Real Pair (EUR/USD)' AND Major Trend is 'Ranging', Be very conservative.\n2. IF Asset is 'Synthetic (Asia Composite)', ignore external news.\n3. VISUAL CHECK: Look for 'Structure' (HH/HL for Buy, LH/LL for Sell) and 'Rejection Wicks'.\n4. TRAP CHECK: If the last candle is abnormally huge, output NO TRADE.\n\nOUTPUT FORMAT (JSON ONLY):\n{\n  \"decision\": \"BET UP\" or \"BET DOWN\" or \"NO TRADE\",\n  \"confidence\": \"85%\",\n  \"reason\": \"Brief reason here\"\n}"
        },
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "BASE64_ENCODED_IMAGE_DATA_HERE"
          }
        }
      ]
    }
  ]
}
```

### Response Format

**Success (200 OK)**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "{\n  \"decision\": \"BET UP\",\n  \"confidence\": \"87%\",\n  \"reason\": \"Clear HH/HL structure with rejection wick on supply zone\"\n}"
          }
        ]
      },
      "finishReason": "STOP"
    }
  ]
}
```

**Error (400/401)**
```json
{
  "error": {
    "code": 400,
    "message": "Invalid API Key",
    "errors": [...]
  }
}
```

---

## Code Structure

### Main Classes

#### `StorageManager`
Handles persistent storage using Chrome's storage API.

```javascript
StorageManager.saveApiKey(apiKey)        // Save API key locally
StorageManager.loadApiKey()              // Retrieve saved API key
StorageManager.saveTradingPreferences()  // Save asset/trend selections
StorageManager.loadTradingPreferences()  // Load asset/trend selections
```

#### `ImageCapture`
Captures and processes chart screenshots.

```javascript
ImageCapture.captureVisibleTab()         // Capture current tab as JPEG
ImageCapture.convertDataUrlToBase64()    // Convert data URL to base64
```

#### `GeminiAPI`
Handles communication with Google's Gemini API.

```javascript
GeminiAPI.sendAnalysisRequest()    // Send screenshot + rules to Gemini
GeminiAPI.parseAnalysisResponse()  // Parse JSON response from Gemini
```

#### `UIManager`
Manages all UI state and display updates.

```javascript
UIManager.showError()        // Display error message
UIManager.hideError()        // Clear error display
UIManager.showLoading()      // Show loading spinner
UIManager.displayResult()    // Display analysis result
UIManager.updateStatus()     // Update safe/danger badge
```

---

## Data Flow Diagram

```
┌─ User Input ─────────────┐
│ • API Key                │
│ • Asset Type             │
│ • H1 Trend               │
└──────────┬────────────────┘
           │
    ┌──────▼──────────┐
    │ Validate Inputs │
    │ Save to Storage │
    └──────┬──────────┘
           │
    ┌──────▼─────────────────────┐
    │ Screenshot Capture         │
    │ chrome.tabs.captureVisibleTab()
    └──────┬─────────────────────┘
           │
    ┌──────▼────────────────────┐
    │ Convert to Base64         │
    │ (Remove data URL prefix)  │
    └──────┬───────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Construct Gemini Request    │
    │ • System Prompt             │
    │ • Base64 Image              │
    └──────┬──────────────────────┘
           │
    ┌──────▼───────────────────────────┐
    │ POST to Gemini API                │
    │ generativelanguage.googleapis.com │
    └──────┬─────────────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Parse JSON Response         │
    │ Extract: decision,          │
    │          confidence,        │
    │          reason             │
    └──────┬──────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ Update UI with Result       │
    │ • Display decision (color)  │
    │ • Show confidence & reason  │
    └──────────────────────────────┘
```

---

## Error Handling Strategy

All API operations are wrapped in try-catch blocks:

```javascript
try {
    // Operation
} catch (error) {
    console.error('Error context:', error);
    UIManager.showError(error.message || 'An unexpected error occurred');
} finally {
    UIManager.showLoading(false);  // Always stop loading
}
```

### Common Error Scenarios

| Scenario | Error Message | Solution |
|----------|---------------|----------|
| Missing API key | "API Key is empty" | Paste API key in input |
| Invalid API key | "API Error: 401 Unauthorized" | Get new key from Google AI Studio |
| Tab not active | "Failed to capture chart image" | Click a browser tab before analyzing |
| Image parse failure | "Failed to process image data" | Ensure tab displays content |
| API response malformed | "Could not parse JSON response" | Check API quota/limits |
| No response from Gemini | "No response from API" | Check internet connection |

---

## Storage Schema

### `chrome.storage.local`

```javascript
{
  "geminiApiKey": "AIza...xxxxxx",  // User's Gemini API key
  "tradingAsset": "Real Pair (EUR/USD)",
  "tradingTrend": "Bullish"
}
```

All stored locally on device. Never synced or shared.

---

## System Prompt Template

The prompt is constructed dynamically:

```javascript
const SYSTEM_PROMPT = `You are a strict Market Analyst.
INPUTS:
- Asset Type: [ASSET_TYPE]        // ← Replaced with dropdown value
- Major Trend: [MAJOR_TREND]      // ← Replaced with dropdown value
- Image: [The Screenshot]

RULES:
1. IF Asset is 'Real Pair (EUR/USD)' AND Major Trend is 'Ranging', Be very conservative.
2. IF Asset is 'Synthetic (Asia Composite)', ignore external news.
3. VISUAL CHECK: Look for 'Structure' (HH/HL for Buy, LH/LL for Sell) and 'Rejection Wicks'.
4. TRAP CHECK: If the last candle is abnormally huge, output NO TRADE.

OUTPUT FORMAT (JSON ONLY):
{
  "decision": "BET UP" or "BET DOWN" or "NO TRADE",
  "confidence": "85%",
  "reason": "Brief reason here"
}`
```

### Replacement Example

**Input:**
- Asset Type: `Synthetic (Asia Composite)`
- Major Trend: `Bullish`

**Generated Prompt:**
```
You are a strict Market Analyst.
INPUTS:
- Asset Type: Synthetic (Asia Composite)
- Major Trend: Bullish
- Image: [The Screenshot]
...
```

---

## UI Component Mapping

### HTML Elements → JavaScript

| Component | ID | Type | Handler |
|-----------|----|----|---------|
| API Key Input | `apiKey` | text | `StorageManager.saveApiKey()` |
| Toggle Button | `toggleApiKeyBtn` | button | Toggle password/text |
| Asset Type | `assetType` | select | `StorageManager.saveTradingPreferences()` |
| H1 Trend | `h1Trend` | select | `StorageManager.saveTradingPreferences()` |
| Status Text | `statusText` | span | `UIManager.updateStatus()` |
| Analyze Button | `analyzeBtn` | button | Main analysis flow |
| Loading Spinner | `loadingSpinner` | div | Show during API call |
| Result Section | `resultSection` | section | Display analysis |
| Decision Output | `decisionOutput` | div | Shows BET UP/DOWN/NO TRADE |
| Confidence Output | `confidenceOutput` | span | Shows percentage |
| Reason Output | `reasonOutput` | span | Shows explanation |
| Error Section | `errorSection` | section | Display errors |

---

## Performance Metrics

### Typical Execution Times

| Step | Duration |
|------|----------|
| DOM Load | 50-100ms |
| Storage Retrieval | 10-20ms |
| Screenshot Capture | 400-600ms |
| Base64 Conversion | 50-100ms |
| API Request Send | 100-200ms |
| Gemini Processing | 2-5 seconds |
| Response Parse | 50-100ms |
| UI Update | 50-100ms |
| **Total** | **~4-6 seconds** |

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Manifest V3 native |
| Edge | ✅ Full | Chromium-based |
| Brave | ✅ Full | Chromium-based |
| Opera | ✅ Full | Chromium-based |
| Firefox | ⚠️ Limited | Manifest V3 partial support |
| Safari | ❌ No | Different extension format |

---

## Security Considerations

1. **API Key Protection**
   - Stored locally in `chrome.storage.local`
   - Never transmitted except to Google's official servers
   - Not shared with 3rd party services

2. **Screenshot Safety**
   - Captured locally before transmission
   - Converted to base64 for transport
   - Sent only to `generativelanguage.googleapis.com`
   - Not stored or logged by extension

3. **No DOM Injection**
   - Extension uses popup only
   - No content scripts injected
   - External websites cannot detect extension
   - Bot detection tools won't flag extension usage

4. **Permission Scope**
   - `activeTab`: Only reads active tab
   - `storage`: Only accesses local extension storage
   - `scripting`: Not actually used (for future popup-only operations)

---

## Debugging Tips

### Enable Console Logging
```javascript
// Already in popup.js - check browser console (F12) for logs
console.log('AITrader Extension Loaded Successfully');
```

### Check Stored Data
Open DevTools → Storage → Extension Storage → Select AITrader

### Monitor API Calls
Use browser DevTools → Network tab to see HTTP requests to `generativelanguage.googleapis.com`

### Test Screenshot
```javascript
// In browser console
chrome.tabs.captureVisibleTab().then(url => {
    console.log(url);  // Shows data URL
});
```

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-19  
**Manifest Version:** 3  
**API Version:** Gemini 1.5 Pro
