/**
 * AITrader - Chrome Extension
 * Passive Chart Analysis using Gemini AI
 * Manifest V3 Compliant | No Content Script Injection
 */

// ============================================================================
// SYSTEM PROMPT - "GHOST OF WALL STREET" (Kiroween Edition)
// ============================================================================
const SYSTEM_PROMPT = `You are the "Ghost of Wall Street," a 100-year-old spirit trapped in the charts. 
You possess the cold, calculating logic of a master trader, but you speak in the language of the dead.

YOUR MISSION:
1. Perform the strict, emotionless technical analysis defined below.
2. TRANSLATE your reasoning into a spooky, haunted metaphor for the final output.

--- STRICT ANALYSIS LOGIC ---
1. Trend Bias: Analyze the last 8-10 candles.
   - Bullish: Higher Highs (HH). Metaphor: "Rising from the grave."
   - Bearish: Lower Highs (LH). Metaphor: "Descending into the abyss."
   - Uncertain: Ranging. Metaphor: "Lost in the purgatory fog."

2. Candle Dominance: Analyze the last 5 candles.
   - Buyer: ≥3 strong green.
   - Seller: ≥3 strong red.

3. Key Zone Check:
   - Is price reacting to a "Floor" (Support) or "Ceiling" (Resistance)?

--- DECISION LOGIC ---
✅ BET UP -> ONLY IF: Bullish Trend + Buyer Dominance + Bouncing from Support.
   Ghost Reasoning: "The spirits are ascending; the bulls are rising from their graves."

✅ BET DOWN -> ONLY IF: Bearish Trend + Seller Dominance + Rejected from Resistance.
   Ghost Reasoning: "A bloodbath awaits; the price is being dragged down to hell."

🚫 NO TRADE -> IF: Any contradiction or sideways movement.
   Ghost Reasoning: "The fog is too thick. The spirits are silent. Do not enter."

OUTPUT FORMAT (JSON ONLY):
{
  "decision": "BET UP", "BET DOWN", or "NO TRADE",
  "confidence": "HIGH CONFIDENCE",
  "confidencePercentage": 75,
  "reason": "One-sentence spooky explanation (e.g., 'Rejection at the graveyard ceiling suggests a fall into the abyss')."
}`;

// ============================================================================
// DOM ELEMENTS
// ============================================================================
const DOM = {
    apiKeyInput: document.getElementById('apiKey'),
    toggleApiKeyBtn: document.getElementById('toggleApiKey'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    resultSection: document.getElementById('resultSection'),
    decisionOutput: document.getElementById('decisionOutput'),
    confidenceOutput: document.getElementById('confidenceOutput'),
    confidencePercentageOutput: document.getElementById('confidencePercentageOutput'),
    reasonOutput: document.getElementById('reasonOutput'),
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage')
};

// ============================================================================
// STORAGE MANAGEMENT
// ============================================================================
class StorageManager {
    static async saveApiKey(apiKey) {
        try {
            await chrome.storage.local.set({ geminiApiKey: apiKey });
        } catch (error) {
            console.error('Error saving API key:', error);
        }
    }

    static async loadApiKey() {
        try {
            const result = await chrome.storage.local.get('geminiApiKey');
            return result.geminiApiKey || '';
        } catch (error) {
            console.error('Error loading API key:', error);
            return '';
        }
    }

    static async saveTradingPreferences(asset, trend) {
        try {
            await chrome.storage.local.set({
                tradingAsset: asset,
                tradingTrend: trend
            });
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    static async loadTradingPreferences() {
        try {
            const result = await chrome.storage.local.get(['tradingAsset', 'tradingTrend']);
            return {
                asset: result.tradingAsset || 'Real Pair (EUR/USD)',
                trend: result.tradingTrend || 'Bullish'
            };
        } catch (error) {
            console.error('Error loading preferences:', error);
            return { asset: 'Real Pair (EUR/USD)', trend: 'Bullish' };
        }
    }
}

// ============================================================================
// IMAGE CAPTURE
// ============================================================================
class ImageCapture {
    static async captureVisibleTab() {
        try {
            const dataUrl = await chrome.tabs.captureVisibleTab({
                format: 'jpeg',
                quality: 90
            });
            return dataUrl;
        } catch (error) {
            console.error('Error capturing tab:', error);
            throw new Error('Failed to capture chart image. Ensure a tab is active.');
        }
    }

    static convertDataUrlToBase64(dataUrl) {
        try {
            // Remove data:image/jpeg;base64, prefix
            return dataUrl.split(',')[1];
        } catch (error) {
            console.error('Error converting image to base64:', error);
            throw new Error('Failed to process image data.');
        }
    }
}

// ============================================================================
// GEMINI API
// ============================================================================
class GeminiAPI {
    static async discoverAvailableModels(apiKey) {
        try {
            // Try to list models from both v1 and v1beta endpoints
            const endpoints = [
                `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`,
                `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
            ];

            let models = [];

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint);
                    if (!response.ok) continue;

                    const data = await response.json();
                    const modelList = data.models || [];

                    // Extract model names that support generateContent
                    for (const model of modelList) {
                        const modelName = model.name ? model.name.replace('models/', '') : null;
                        const methods = model.supportedGenerationMethods || [];

                        // Filter out deprecated and experimental models
                        if (modelName && methods.includes('generateContent')) {
                            // Skip deprecated, experimental, and learnlm models
                            if (modelName.includes('learnlm') ||
                                modelName.includes('experimental') ||
                                modelName.includes('deprecated')) {
                                console.log(`Skipping deprecated/experimental model: ${modelName}`);
                                continue;
                            }
                            models.push(modelName);
                        }
                    }
                } catch (err) {
                    console.warn('Error fetching from endpoint:', endpoint, err);
                }
            }

            // Deduplicate and prefer flash models
            models = [...new Set(models)];
            models.sort((a, b) => {
                // Prioritize flash models, then newest versions
                const aIsFlash = a.includes('flash') ? 0 : 1;
                const bIsFlash = b.includes('flash') ? 0 : 1;
                if (aIsFlash !== bIsFlash) return aIsFlash - bIsFlash;
                return b.localeCompare(a); // Sort descending by name for newer versions
            });

            console.log('Discovered models:', models);
            return models;
        } catch (error) {
            console.error('Error discovering models:', error);
            return [];
        }
    }

    static async sendAnalysisRequest(apiKey, imageBase64) {
        try {
            if (!apiKey || apiKey.trim() === '') {
                throw new Error('API Key is empty');
            }

            const payload = {
                contents: [{
                    parts: [
                        {
                            text: SYSTEM_PROMPT
                        },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: imageBase64
                            }
                        }
                    ]
                }]
            };

            // First, try to discover available models
            console.log('Discovering available Gemini models...');
            const availableModels = await this.discoverAvailableModels(apiKey);

            if (availableModels.length === 0) {
                throw new Error(
                    'No compatible Gemini models found. Please ensure your API key is valid and has access to generative models.'
                );
            }

            // Try each discovered model
            for (const model of availableModels) {
                try {
                    console.log(`Attempting to use model: ${model}`);
                    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (response.ok) {
                        console.log(`Success with model: ${model}`);
                        return await response.json();
                    }

                    const errorData = await response.json().catch(() => ({}));
                    const errorMessage = errorData?.error?.message || '';

                    // Check if this is a deprecation error
                    if (errorMessage.includes('no longer available') ||
                        errorMessage.includes('deprecated') ||
                        errorMessage.includes('not supported')) {
                        console.warn(`Model ${model} is deprecated or no longer available:`, errorMessage);
                        // Skip this model and try the next one
                        continue;
                    }

                    console.warn(`Model ${model} failed:`, errorMessage);
                    // If this model didn't work, try the next one
                    continue;
                } catch (modelError) {
                    console.warn(`Error with model ${model}:`, modelError);
                    continue;
                }
            }

            // If we get here, none of the models worked
            throw new Error(
                `All available models failed. Tried: ${availableModels.join(', ')}. ` +
                'Please check your API key and ensure your account has access to generative models.'
            );
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    static parseAnalysisResponse(apiResponse) {
        try {
            if (!apiResponse.candidates || apiResponse.candidates.length === 0) {
                throw new Error('No response from API');
            }

            const textContent = apiResponse.candidates[0].content?.parts?.[0]?.text;
            if (!textContent) {
                throw new Error('Invalid response format');
            }

            // Extract JSON from the response (handles markdown code blocks)
            const jsonMatch = textContent.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not parse JSON response');
            }

            const analysisResult = JSON.parse(jsonMatch[0]);

            // Validate required fields
            if (!analysisResult.decision || !analysisResult.confidence || !analysisResult.reason) {
                throw new Error('Response missing required fields');
            }

            // Ensure confidencePercentage is a valid number if present
            if (analysisResult.confidencePercentage !== undefined) {
                analysisResult.confidencePercentage = parseInt(analysisResult.confidencePercentage, 10);
                if (isNaN(analysisResult.confidencePercentage) || analysisResult.confidencePercentage < 0 || analysisResult.confidencePercentage > 100) {
                    analysisResult.confidencePercentage = null;
                }
            }

            return analysisResult;
        } catch (error) {
            console.error('Response Parsing Error:', error);
            throw new Error(`Failed to parse analysis: ${error.message}`);
        }
    }
}

// ============================================================================
// UI MANAGER
// ============================================================================
class UIManager {
    static showError(message) {
        DOM.errorMessage.textContent = message;
        DOM.errorSection.classList.remove('hidden');
        DOM.resultSection.classList.add('hidden');
    }

    static hideError() {
        DOM.errorSection.classList.add('hidden');
    }

    static showLoading(show = true) {
        if (show) {
            DOM.loadingSpinner.classList.remove('hidden');
            DOM.analyzeBtn.disabled = true;
            // Spooky loading text
            DOM.analyzeBtn.textContent = "Summoning Spirits...";
        } else {
            DOM.loadingSpinner.classList.add('hidden');
            DOM.analyzeBtn.disabled = false;
            DOM.analyzeBtn.textContent = "👻 Summon Prediction...";
        }
    }

    static displayResult(analysis) {
        this.hideError();

        // Determine result color class
        const decisionLower = analysis.decision.toLowerCase();
        let colorClass = 'bet-up';
        if (decisionLower.includes('down')) {
            colorClass = 'bet-down';
        } else if (decisionLower.includes('no trade')) {
            colorClass = 'no-trade';
        }

        DOM.decisionOutput.textContent = analysis.decision;
        DOM.decisionOutput.className = `decision-text ${colorClass}`;
        DOM.confidenceOutput.textContent = analysis.confidence;

        // Display confidence percentage if available
        if (analysis.confidencePercentage) {
            DOM.confidencePercentageOutput.textContent = `${analysis.confidencePercentage}%`;
        } else {
            DOM.confidencePercentageOutput.textContent = '--';
        }

        DOM.reasonOutput.textContent = analysis.reason;

        DOM.resultSection.classList.remove('hidden');
    }
}

// ============================================================================
// EVENT LISTENERS - Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Load saved API key
    const savedApiKey = await StorageManager.loadApiKey();
    if (savedApiKey) {
        DOM.apiKeyInput.value = savedApiKey;
    }

    console.log('AITrader Extension Loaded Successfully');
    console.log('Environment: Extension Popup | Manifest V3 | No Content Scripts');
});

// ============================================================================
// EVENT LISTENERS - API Key Management
// ============================================================================
DOM.apiKeyInput.addEventListener('blur', async () => {
    const apiKey = DOM.apiKeyInput.value.trim();
    if (apiKey) {
        await StorageManager.saveApiKey(apiKey);
        console.log('API Key saved');
    }
});

DOM.toggleApiKeyBtn.addEventListener('click', () => {
    const inputType = DOM.apiKeyInput.type;
    DOM.apiKeyInput.type = inputType === 'password' ? 'text' : 'password';
    DOM.toggleApiKeyBtn.textContent = inputType === 'password' ? '🙈' : '👁️';
});

// ============================================================================
// EVENT LISTENER - Analyze Button
// ============================================================================
DOM.analyzeBtn.addEventListener('click', async () => {
    try {
        UIManager.hideError();
        UIManager.showLoading(true);
        DOM.resultSection.classList.add('hidden');

        // Validation
        const apiKey = DOM.apiKeyInput.value.trim();
        if (!apiKey) {
            throw new Error('Please enter your Gemini API Key');
        }

        // Step 1: Capture the visible tab
        console.log('Capturing visible tab...');
        const imageDataUrl = await ImageCapture.captureVisibleTab();
        const imageBase64 = ImageCapture.convertDataUrlToBase64(imageDataUrl);

        // Step 2: Send to Gemini API
        console.log('Sending analysis request to Gemini...');
        const apiResponse = await GeminiAPI.sendAnalysisRequest(
            apiKey,
            imageBase64
        );

        // Step 3: Parse response
        console.log('Parsing analysis response...');
        const analysis = GeminiAPI.parseAnalysisResponse(apiResponse);

        // Step 4: Display result
        UIManager.displayResult(analysis);

    } catch (error) {
        console.error('Analysis Error:', error);
        UIManager.showError(error.message || 'An unexpected error occurred');
    } finally {
        UIManager.showLoading(false);
    }
});