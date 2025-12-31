/**
 * QuantumTrader (PS-004)
 * RWA Tokenization Dashboard
 *
 * Popup responsibilities (MV3 extension page):
 * - Connect a wallet (dev-friendly)
 * - Read assets from AssetRegistry
 * - Buy fractions via Marketplace
 * - Show basic ERC-1155 portfolio balances
 * - Use Gemini to produce an audit/valuation payload (off-chain), then allow sending it on-chain
 */

/* global chrome, ethers */

// ---------------------------
// ABIs (minimal)
// ---------------------------

const ABI_ASSET_REGISTRY = [
    'function nextAssetId() view returns (uint256)',
    'function registerAsset(string detailsURI) returns (uint256)',
    'function setAuditor(address auditor, bool allowed)',
    'function verifyAndTokenizeAsset(uint256 assetId, uint256 appraisedValue, uint256 totalFractions, string tokenUri)',
    'function assets(uint256 assetId) view returns (uint256 assetId_, address issuer, string detailsURI, bool verified, address auditor, uint256 appraisedValue, uint256 totalFractions, uint256 verifiedAt)',
];

const ABI_RWA_TOKEN = [
    'function balanceOf(address account, uint256 id) view returns (uint256)',
    'function isApprovedForAll(address account, address operator) view returns (bool)',
    'function setApprovalForAll(address operator, bool approved)',
];

const ABI_MARKETPLACE = [
    'function prices(uint256 assetId) view returns (uint256 buyWeiPerToken, uint256 sellWeiPerToken, uint256 buyUsdcPerToken, uint256 sellUsdcPerToken)',
    'function buyWithETH(uint256 assetId, uint256 amount) payable',
    'function buyWithUSDC(uint256 assetId, uint256 amount)',
    'function sellForETH(uint256 assetId, uint256 amount)',
    'function sellForUSDC(uint256 assetId, uint256 amount)',
    'function setAssetPrices(uint256 assetId, uint256 buyWeiPerToken, uint256 sellWeiPerToken, uint256 buyUsdcPerToken, uint256 sellUsdcPerToken)',
];

<<<<<<< Updated upstream
INSTANT OUTPUT (JSON ONLY - NO EXPLANATIONS):
{
  "decision": "BET UP" | "BET DOWN" | "NO TRADE",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidencePercentage": 65-95,
  "duration": "5-30 minutes",
  "reason": "One sentence: Visual + Live data alignment"
}`;

// ============================================================================
// SUPPORTED ASSETS (Stocks.txt)
// ============================================================================
class StocksTxtCatalog {
    static async getRawText() {
        if (!this._rawTextPromise) {
            this._rawTextPromise = (async () => {
                const url = chrome.runtime.getURL('Stocks.txt');
                const res = await fetch(url);
                if (!res.ok) {
                    throw new Error(`Failed to load Stocks.txt (${res.status})`);
                }
                return await res.text();
            })();
        }
        return await this._rawTextPromise;
    }

    static async getSupportedAssetsText() {
        if (!this._supportedAssetsTextPromise) {
            this._supportedAssetsTextPromise = (async () => {
                const raw = await this.getRawText();
                const lines = raw
                    .split(/\r?\n/)
                    .map(l => l.trim())
                    .filter(Boolean);

                // Keep it list-like for the model: drop headings and descriptive sentences.
                const kept = [];
                for (const line of lines) {
                    if (/^\d+\./.test(line)) continue; // section headings like "1. ..."
                    if (/these are|available for|you can trade|this is a selection/i.test(line)) continue;
                    kept.push(line);
                }

                // Safety guard: never send an empty list.
                if (kept.length === 0) {
                    return raw.trim();
                }

                return kept.join('\n');
            })();
        }

        return await this._supportedAssetsTextPromise;
    }
}

StocksTxtCatalog._rawTextPromise = null;
StocksTxtCatalog._supportedAssetsTextPromise = null;

// ============================================================================
// DOM ELEMENTS
// ============================================================================
=======
const ABI_ERC20 = [
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function decimals() view returns (uint8)',
];

// ---------------------------
// DOM
// ---------------------------

>>>>>>> Stashed changes
const DOM = {
    walletStatus: document.getElementById('walletStatus'),
    connectWalletBtn: document.getElementById('connectWalletBtn'),

    rpcUrl: document.getElementById('rpcUrl'),
    privateKey: document.getElementById('privateKey'),
    togglePrivateKey: document.getElementById('togglePrivateKey'),

    registryAddress: document.getElementById('registryAddress'),
    tokenAddress: document.getElementById('tokenAddress'),
    marketplaceAddress: document.getElementById('marketplaceAddress'),
    usdcAddress: document.getElementById('usdcAddress'),

    detailsUri: document.getElementById('detailsUri'),
    registerAssetBtn: document.getElementById('registerAssetBtn'),

    assetSelect: document.getElementById('assetSelect'),
    refreshAssetsBtn: document.getElementById('refreshAssetsBtn'),

    buyAmount: document.getElementById('buyAmount'),
    buyPayment: document.getElementById('buyPayment'),
    buyBtn: document.getElementById('buyBtn'),

    portfolioBox: document.getElementById('portfolioBox'),

    geminiApiKey: document.getElementById('geminiApiKey'),
    toggleGeminiKey: document.getElementById('toggleGeminiKey'),
    assetPayload: document.getElementById('assetPayload'),
    runValuationBtn: document.getElementById('runValuationBtn'),
    valuationOutput: document.getElementById('valuationOutput'),

    appraisedValue: document.getElementById('appraisedValue'),
    totalFractions: document.getElementById('totalFractions'),
    tokenUri: document.getElementById('tokenUri'),
    verifyTokenizeBtn: document.getElementById('verifyTokenizeBtn'),

    auditorAddress: document.getElementById('auditorAddress'),
    setAuditorBtn: document.getElementById('setAuditorBtn'),

    buyWeiPerToken: document.getElementById('buyWeiPerToken'),
    sellWeiPerToken: document.getElementById('sellWeiPerToken'),
    buyUsdcPerToken: document.getElementById('buyUsdcPerToken'),
    sellUsdcPerToken: document.getElementById('sellUsdcPerToken'),
    setPricesBtn: document.getElementById('setPricesBtn'),

    loadingSpinner: document.getElementById('loadingSpinner'),

    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
}

async function setAuditor() {
    clearError();

    try {
        setLoading(true);
        await persistFormSettings();

        const auditor = (DOM.auditorAddress.value || '').trim();
        if (!auditor) throw new Error('Auditor address is required');

        const registry = getRegistry(false);
        const tx = await registry.setAuditor(auditor, true);
        await tx.wait();
    } catch (err) {
        console.error(err);
        showError(err?.message || String(err));
    } finally {
        setLoading(false);
    }
};

// ---------------------------
// State
// ---------------------------

const DEFAULTS = {
    rpcUrl: 'http://127.0.0.1:8545',
};

const STATE = {
    provider: null,
    signer: null,
    walletAddress: null,
    assets: [],
};

// ---------------------------
// Storage
// ---------------------------

class StorageManager {
    static async load() {
        const res = await chrome.storage.local.get([
            'rpcUrl',
            'privateKey',
            'registryAddress',
            'tokenAddress',
            'marketplaceAddress',
            'usdcAddress',
            'geminiApiKey',
        ]);

        return {
            rpcUrl: res.rpcUrl || DEFAULTS.rpcUrl,
            privateKey: res.privateKey || '',
            registryAddress: res.registryAddress || '',
            tokenAddress: res.tokenAddress || '',
            marketplaceAddress: res.marketplaceAddress || '',
            usdcAddress: res.usdcAddress || '',
            geminiApiKey: res.geminiApiKey || '',
        };
    }

    static async save(partial) {
        await chrome.storage.local.set(partial);
    }
}

// ---------------------------
// UI helpers
// ---------------------------

function setLoading(isLoading) {
    DOM.loadingSpinner.classList.toggle('hidden', !isLoading);
    DOM.buyBtn.disabled = isLoading;
    DOM.registerAssetBtn.disabled = isLoading;
    DOM.refreshAssetsBtn.disabled = isLoading;
    DOM.runValuationBtn.disabled = isLoading;
    DOM.verifyTokenizeBtn.disabled = isLoading;
    DOM.setPricesBtn.disabled = isLoading;
}

function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorSection.classList.remove('hidden');
}

function clearError() {
    DOM.errorMessage.textContent = '';
    DOM.errorSection.classList.add('hidden');
}

function setWalletStatus(text) {
    DOM.walletStatus.textContent = text;
}

function togglePasswordInput(inputEl) {
    inputEl.type = inputEl.type === 'password' ? 'text' : 'password';
}

function normalizeAddress(value) {
    const v = (value || '').trim();
    return v;
}

// ---------------------------
// Ethers helpers
// ---------------------------

function ensureEthersLoaded() {
    if (typeof ethers === 'undefined') {
        throw new Error('ethers library not loaded. Ensure vendor/ethers.umd.min.js exists and is referenced in popup.html.');
    }
}

function getProvider() {
    ensureEthersLoaded();

    const rpcUrl = (DOM.rpcUrl.value || '').trim() || DEFAULTS.rpcUrl;
    if (!rpcUrl) {
        throw new Error('RPC URL is required');
    }

    STATE.provider = new ethers.JsonRpcProvider(rpcUrl);
    return STATE.provider;
}

<<<<<<< Updated upstream


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

            // Normalize decision to Olymp Trade FTT wording.
            // We accept legacy Gemini outputs (BUY/SELL) but always display BET UP/BET DOWN/NO TRADE.
            const decisionRaw = String(analysisResult.decision || '').trim();
            const decisionLower = decisionRaw.toLowerCase();
            if (decisionLower.includes('no trade') || decisionLower === 'hold') {
                analysisResult.decision = 'NO TRADE';
            } else if (decisionLower.includes('bet down') || decisionLower.includes('sell') || decisionLower.includes('down')) {
                analysisResult.decision = 'BET DOWN';
            } else if (decisionLower.includes('bet up') || decisionLower.includes('buy') || decisionLower.includes('up')) {
                analysisResult.decision = 'BET UP';
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
=======
function getSignerOrThrow() {
    if (!STATE.signer) {
        throw new Error('Wallet not connected. Click Connect first.');
>>>>>>> Stashed changes
    }
    return STATE.signer;
}

function getRegistry(readonly = true) {
    const address = normalizeAddress(DOM.registryAddress.value);
    if (!address) throw new Error('AssetRegistry address is required');
    const runner = readonly ? getProvider() : getSignerOrThrow();
    return new ethers.Contract(address, ABI_ASSET_REGISTRY, runner);
}

function getToken(readonly = true) {
    const address = normalizeAddress(DOM.tokenAddress.value);
    if (!address) throw new Error('RealWorldAssetToken address is required');
    const runner = readonly ? getProvider() : getSignerOrThrow();
    return new ethers.Contract(address, ABI_RWA_TOKEN, runner);
}

function getMarketplace(readonly = true) {
    const address = normalizeAddress(DOM.marketplaceAddress.value);
    if (!address) throw new Error('Marketplace address is required');
    const runner = readonly ? getProvider() : getSignerOrThrow();
    return new ethers.Contract(address, ABI_MARKETPLACE, runner);
}

function getUsdc(readonly = true) {
    const address = normalizeAddress(DOM.usdcAddress.value);
    if (!address) throw new Error('USDC address is required (optional field currently empty)');
    const runner = readonly ? getProvider() : getSignerOrThrow();
    return new ethers.Contract(address, ABI_ERC20, runner);
}

// ---------------------------
// Core actions
// ---------------------------

async function connectWallet() {
    clearError();

    try {
        setLoading(true);

        // Always set up read provider
        getProvider();

        // Try injected wallet first
        if (window.ethereum && window.ethereum.request) {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            await browserProvider.send('eth_requestAccounts', []);
            const signer = await browserProvider.getSigner();
            const addr = await signer.getAddress();

            STATE.signer = signer;
            STATE.walletAddress = addr;
            setWalletStatus(`Connected: ${addr.slice(0, 6)}…${addr.slice(-4)} (injected)`);
        } else {
<<<<<<< Updated upstream
            DOM.loadingSpinner.classList.add('hidden');
            DOM.analyzeBtn.disabled = false;
            DOM.analyzeBtn.textContent = "🔮 QUANTUM ANALYSIS";
        }
    }

    static displayResult(analysis) {
        this.hideError();

        // Determine result color class
        const decisionLower = analysis.decision.toLowerCase();
        let colorClass = 'bet-up';
        if (decisionLower.includes('bet down') || decisionLower.includes('sell') || decisionLower.includes('down')) {
            colorClass = 'bet-down';
        } else if (decisionLower.includes('no trade') || decisionLower.includes('hold')) {
            colorClass = 'no-trade';
        }

        DOM.decisionOutput.textContent = analysis.decision;
        DOM.decisionOutput.className = `decision-text ${colorClass}`;
        DOM.confidenceOutput.textContent = analysis.confidence || 'MEDIUM';

        // Display confidence percentage
        if (analysis.confidencePercentage !== undefined) {
            DOM.confidencePercentageOutput.textContent = `${analysis.confidencePercentage}%`;
        } else {
            DOM.confidencePercentageOutput.textContent = '--';
        }

        DOM.reasonOutput.textContent = analysis.reason || 'Quantitative analysis complete';

        // Add enhanced result details if available
        this.displayEnhancedResults(analysis);

        DOM.resultSection.classList.remove('hidden');
    }

    static displayEnhancedResults(analysis) {
        // Create enhanced results section if it doesn't exist
        let enhancedSection = document.getElementById('enhancedResults');
        if (!enhancedSection) {
            enhancedSection = document.createElement('div');
            enhancedSection.id = 'enhancedResults';
            enhancedSection.className = 'enhanced-results';
            DOM.resultSection.appendChild(enhancedSection);
        }

        let html = '';

        // Trading parameters
        if (analysis.entryPrice || analysis.stopLoss || analysis.takeProfit) {
            html += '<div class="trading-params">';
            html += '<h3>Trading Parameters</h3>';
            if (analysis.entryPrice) html += `<p><strong>Entry:</strong> ${analysis.entryPrice}</p>`;
            if (analysis.stopLoss) html += `<p><strong>Stop Loss:</strong> ${analysis.stopLoss}</p>`;
            if (analysis.takeProfit) html += `<p><strong>Take Profit:</strong> ${analysis.takeProfit}</p>`;
            if (analysis.riskReward) html += `<p><strong>Risk/Reward:</strong> ${analysis.riskReward}</p>`;
            if (analysis.duration) html += `<p><strong>Duration:</strong> ${analysis.duration}</p>`;
            html += '</div>';
        }

        // Platform and Asset Detection
        if (analysis.detectedAsset || analysis.platform) {
            html += '<div class="platform-info">';
            html += '<h3>🎯 Analysis Target</h3>';
            if (analysis.platform) html += `<p><strong>Platform:</strong> ${analysis.platform} ✅</p>`;
            if (analysis.detectedAsset) html += `<p><strong>Asset:</strong> ${analysis.detectedAsset}</p>`;
            if (analysis.captureType) html += `<p><strong>Capture:</strong> ${analysis.captureType === 'video' ? '5-second video' : 'Screenshot'}</p>`;
            html += '</div>';
        }

        // Live Market Data
        if (analysis.liveData) {
            html += '<div class="live-data">';
            html += '<h3>🔴 Live Market Data</h3>';
            html += `<p><strong>Asset:</strong> ${analysis.liveData.symbol}</p>`;
            html += `<p><strong>Current Price:</strong> ${analysis.liveData.currentPrice}</p>`;
            if (analysis.liveData.priceChange) {
                const changeColor = analysis.liveData.priceChange > 0 ? '#00ff88' : '#ff3366';
                html += `<p><strong>Change:</strong> <span style="color: ${changeColor}">${analysis.liveData.priceChange} (${analysis.liveData.changePercent}%)</span></p>`;
=======
            // Dev fallback: local private key
            const pk = (DOM.privateKey.value || '').trim();
            if (!pk) {
                STATE.signer = null;
                STATE.walletAddress = null;
                setWalletStatus('Disconnected (no injected wallet detected; provide dev private key)');
                return;
>>>>>>> Stashed changes
            }

            const wallet = new ethers.Wallet(pk, STATE.provider);
            STATE.signer = wallet;
            STATE.walletAddress = await wallet.getAddress();
            setWalletStatus(`Connected: ${STATE.walletAddress.slice(0, 6)}…${STATE.walletAddress.slice(-4)} (dev key)`);
        }

        await refreshAssets();
        await refreshPortfolio();
    } catch (err) {
        console.error(err);
        showError(err?.message || String(err));
    } finally {
        setLoading(false);
    }
}

<<<<<<< Updated upstream
// ============================================================================
// QUANTUM ANALYSIS ORCHESTRATOR
// ============================================================================
class QuantumAnalysisOrchestrator {
    static async performAnalysis() {
        try {
            UIManager.hideError();
            UIManager.showLoading(true, 'capture');

            // Get configuration and API keys immediately
            const config = await this.getAnalysisConfig();
            const apiKeys = await StorageManager.loadApiKeys();

            // Validate required API key
            if (!apiKeys.gemini) {
                throw new Error('Gemini API Key is required');
            }

            // OPTIMIZED FLOW: Run verification, detection, capture, and data fetch in parallel
            console.log('⚡ Starting optimized parallel analysis...');

            const [isOlympTrade, detectedAsset, captureData, marketDataPromise] = await Promise.all([
                // 1. Verify Olymp Trade (fast)
                this.verifyOlympTradePlatform(),

                // 2. Detect asset (fast - from URL/page)
                this.detectTradingAssetFromChart(),

                // 3. Capture chart immediately (parallel with detection)
                this.captureChartData(config.captureMode),

                // 4. Start market data fetch early (don't wait for asset detection)
                this.startMarketDataFetch(config, apiKeys)
            ]);

            // Quick validation
            if (!isOlympTrade) {
                throw new Error('❌ Only works on official Olymp Trade platform');
            }
            if (!detectedAsset) {
                throw new Error('❌ Could not detect trading asset');
            }

            console.log(`⚡ Parallel completion: Asset=${detectedAsset}, Capture=✅`);

            // Get market data for detected asset (may already be cached)
            UIManager.showLoading(true, 'market-data');
            const marketData = await this.getOptimizedMarketData(detectedAsset, marketDataPromise, config, apiKeys);

            // SINGLE GEMINI CALL: Send everything at once for maximum speed
            console.log('⚡ Single Gemini API call with all data...');
            UIManager.showLoading(true, 'ai-analysis');

            const analysis = await this.performOptimizedAnalysis(
                captureData,
                marketData,
                detectedAsset,
                config,
                apiKeys.gemini
            );

            // Display results immediately
            UIManager.displayResult(analysis);
            console.log('⚡ Analysis complete in record time!');

        } catch (error) {
            console.error('❌ Analysis Error:', error);
            UIManager.showError(error.message || 'Analysis failed');
        } finally {
            UIManager.showLoading(false);
        }
    }

    // Verify this is official Olymp Trade platform
    static async verifyOlympTradePlatform() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = tab.url?.toLowerCase() || '';

            // Check for official Olymp Trade domains
            const olympTradePatterns = [
                'olymptrade.com',
                'www.olymptrade.com',
                'app.olymptrade.com',
                'platform.olymptrade.com'
            ];

            const isOfficialDomain = olympTradePatterns.some(pattern => url.includes(pattern));

            if (isOfficialDomain) {
                console.log(`✅ Official Olymp Trade domain detected: ${url}`);
                return true;
            }

            console.log(`❌ Not an official Olymp Trade domain: ${url}`);
            return false;

        } catch (error) {
            console.error('Error verifying Olymp Trade platform:', error);
            return false;
        }
    }

    // Detect trading asset from chart interface
    static async detectTradingAssetFromChart() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Try to detect asset from URL parameters
            const url = tab.url?.toLowerCase() || '';

            // Common Olymp Trade assets
            const assetPatterns = {
                'eurusd': 'EURUSD',
                'gbpusd': 'GBPUSD',
                'usdjpy': 'USDJPY',
                'audusd': 'AUDUSD',
                'usdcad': 'USDCAD',
                'usdchf': 'USDCHF',
                'nzdusd': 'NZDUSD',
                'eurjpy': 'EURJPY',
                'gbpjpy': 'GBPJPY',
                'btcusd': 'BTCUSD',
                'ethusd': 'ETHUSD',
                'xauusd': 'XAUUSD', // Gold
                'xagusd': 'XAGUSD', // Silver
                'oil': 'CRUDE_OIL',
                'spx500': 'SPX500',
                'nas100': 'NAS100'
            };

            // Check URL for asset indicators
            for (const [pattern, asset] of Object.entries(assetPatterns)) {
                if (url.includes(pattern)) {
                    console.log(`🎯 Asset detected from URL: ${asset}`);
                    return asset;
                }
            }

            // If no asset detected from URL, try to inject a script to read from page
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        // Try to find asset name in common Olymp Trade selectors
                        const selectors = [
                            '[data-asset]',
                            '.asset-name',
                            '.symbol-name',
                            '.trading-pair',
                            '.current-asset'
                        ];

                        for (const selector of selectors) {
                            const element = document.querySelector(selector);
                            if (element) {
                                return element.textContent || element.getAttribute('data-asset');
                            }
                        }

                        // Look for text patterns in the page
                        const bodyText = document.body.textContent || '';
                        const assetRegex = /(EUR\/USD|GBP\/USD|USD\/JPY|AUD\/USD|USD\/CAD|USD\/CHF|NZD\/USD|BTC\/USD|ETH\/USD|XAU\/USD)/i;
                        const match = bodyText.match(assetRegex);
                        if (match) {
                            return match[1].replace('/', '');
                        }

                        return null;
                    }
                });

                if (results && results[0] && results[0].result) {
                    const detectedAsset = results[0].result.toUpperCase().replace('/', '');
                    console.log(`🎯 Asset detected from page content: ${detectedAsset}`);
                    return detectedAsset;
                }
            } catch (scriptError) {
                console.warn('Could not inject script to detect asset:', scriptError);
            }

            // Default to EURUSD if no asset detected
            console.log('⚠️ No specific asset detected, defaulting to EURUSD');
            return 'EURUSD';

        } catch (error) {
            console.error('Error detecting trading asset:', error);
            return 'EURUSD'; // Safe default
        }
    }

    // Capture chart data (5-second video or screenshot)
    static async captureChartData(captureMode) {
        switch (captureMode) {
            case 'video':
                console.log('📹 Capturing 5-second video...');
                return await AdvancedCapture.captureVideo(5); // 5 seconds
            case 'screenshot':
            default:
                console.log('📸 Capturing screenshot...');
                const screenshot = await AdvancedCapture.captureScreenshot();
                return AdvancedCapture.convertDataUrlToBase64(screenshot);
        }
    }

    // Start market data fetch early (for parallel processing)
    static async startMarketDataFetch(config, apiKeys) {
        const finnhubKey = apiKeys.marketData || 'd52k5hpr01qqu01vifsgd52k5hpr01qqu01vift0';

        // Pre-fetch common assets data in parallel
        const commonAssets = ['EURUSD', 'GBPUSD', 'USDJPY', 'BTCUSD'];
        const dataPromises = {};

        commonAssets.forEach(asset => {
            dataPromises[asset] = LiveMarketDataAPI.getLiveOlympTradeData(
                asset,
                '1h', // Default 1-hour timeframe
                finnhubKey
            ).catch(() => null);
        });

        return dataPromises;
    }

    // Get optimized market data (use cached if available)
    static async getOptimizedMarketData(detectedAsset, marketDataPromises, config, apiKeys) {
        try {
            // Check if we have pre-fetched data for this asset
            if (marketDataPromises[detectedAsset]) {
                console.log(`⚡ Using pre-fetched data for ${detectedAsset}`);
                return await marketDataPromises[detectedAsset];
            }

            // If not pre-fetched, fetch quickly with reduced timeout
            console.log(`⚡ Quick fetch for ${detectedAsset}`);
            const finnhubKey = apiKeys.marketData || 'd52k5hpr01qqu01vifsgd52k5hpr01qqu01vift0';

            // Use Promise.race with timeout for speed
            const dataPromise = LiveMarketDataAPI.getLiveOlympTradeData(
                detectedAsset,
                '1h', // Default 1-hour timeframe
                finnhubKey
            );

            const timeoutPromise = new Promise(resolve =>
                setTimeout(() => resolve(null), 3000) // 3 second max wait
            );

            return await Promise.race([dataPromise, timeoutPromise]);

        } catch (error) {
            console.warn('Optimized market data failed:', error);
            return null;
        }
    }

    static async getAnalysisConfig() {
        const config = await StorageManager.loadAnalysisConfig();
        return {
            captureMode: DOM.captureMode.value || config.captureMode
        };
    }

    static async captureMarketData(captureMode) {
        switch (captureMode) {
            case 'video':
                return await AdvancedCapture.captureVideo(10);
            case 'multi-frame':
                return await AdvancedCapture.captureMultiFrame(5, 2000);
            case 'screenshot':
            default:
                const screenshot = await AdvancedCapture.captureScreenshot();
                return AdvancedCapture.convertDataUrlToBase64(screenshot);
        }
    }

    static async fetchMarketData(config, apiKeys) {
        try {
            // Use Finnhub for live market data (your API key is pre-configured)
            const finnhubKey = apiKeys.marketData || 'd52k5hpr01qqu01vifsgd52k5hpr01qqu01vift0';

            // Detect symbol from current tab URL or default to EURUSD
            const symbol = await this.detectTradingSymbol() || 'EURUSD';

            console.log(`🔴 Fetching live data for ${symbol} on 1h timeframe`);

            // Get comprehensive live market data
            const liveMarketData = await LiveMarketDataAPI.getLiveOlympTradeData(
                symbol,
                '1h', // Default 1-hour timeframe
                finnhubKey
            );

            if (liveMarketData) {
                console.log(`✅ Live market data retrieved for ${symbol}`);
                console.log(`📊 Current price: ${liveMarketData.live?.price}`);
                console.log(`📈 Technical indicators: ${liveMarketData.technical ? 'Available' : 'Not available'}`);
                console.log(`📰 News items: ${liveMarketData.sentiment?.newsCount || 0}`);
            }

            return liveMarketData;

        } catch (error) {
            console.warn('Live market data failed:', error);
            return null;
        }
    }

    // Detect trading symbol from current tab
    static async detectTradingSymbol() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = tab.url?.toLowerCase() || '';

            console.log(`🔍 ASSET DETECTION DEBUG:`);
            console.log(`📍 Current URL: ${url}`);
            console.log(`📍 Tab title: ${tab.title || 'No title'}`);

            // Comprehensive asset patterns for Olymp Trade
            const assetPatterns = {
                // 1. Composite Indices (Exclusive to Olymp Trade)
                'altcoin': 'ALTCOIN_INDEX',
                'altcoinindex': 'ALTCOIN_INDEX',
                'basicaltcoin': 'ALTCOIN_INDEX',
                'arabian': 'ARABIAN_GENERAL_INDEX',
                'arabiangeneral': 'ARABIAN_GENERAL_INDEX',
                'asia': 'ASIA_COMPOSITE_INDEX',
                'asiacomposite': 'ASIA_COMPOSITE_INDEX',
                'asia_x': 'ASIA_COMPOSITE_INDEX',
                'astro': 'ASTRO_INDEX',
                'astroindex': 'ASTRO_INDEX',
                'dollar': 'BASIC_DOLLAR_INDEX',
                'dollarindex': 'BASIC_DOLLAR_INDEX',
                'basicdollar': 'BASIC_DOLLAR_INDEX',
                'commodity': 'COMMODITY_COMPOSITE_INDEX',
                'cmdty_x': 'COMMODITY_COMPOSITE_INDEX',
                'commoditycomposite': 'COMMODITY_COMPOSITE_INDEX',
                'cricket': 'CRICKET_INDEX',
                'cricket23': 'CRICKET_INDEX',
                'crypto': 'CRYPTO_COMPOSITE_INDEX',
                'crypto_x': 'CRYPTO_COMPOSITE_INDEX',
                'cryptocomposite': 'CRYPTO_COMPOSITE_INDEX',
                'europe': 'EUROPE_COMPOSITE_INDEX',
                'europe_x': 'EUROPE_COMPOSITE_INDEX',
                'europecomposite': 'EUROPE_COMPOSITE_INDEX',
                'football': 'FOOTBALL_INDEX',
                'athletic': 'FOOTBALL_INDEX',
                'globalfootball': 'FOOTBALL_INDEX',
                'meme': 'MEME_INDEX',
                'trump': 'TRUMP_MEME_INDEX',
                'trumpmeme': 'TRUMP_MEME_INDEX',
                'moonch': 'MOONCH_INDEX',
                'quickler': 'QUICKLER',
                'stable': 'STABLE_TICK_INDEX',
                'stabletick': 'STABLE_TICK_INDEX',

                // 2. Forex pairs (including OTC)
                'eurusd': 'EURUSD',
                'gbpusd': 'GBPUSD',
                'usdjpy': 'USDJPY',
                'audusd': 'AUDUSD',
                'usdcad': 'USDCAD',
                'usdchf': 'USDCHF',
                'nzdusd': 'NZDUSD',
                'eurjpy': 'EURJPY',
                'gbpjpy': 'GBPJPY',
                'eurgbp': 'EURGBP',
                'audcad': 'AUDCAD',
                'audchf': 'AUDCHF',
                'audjpy': 'AUDJPY',
                'audnzd': 'AUDNZD',
                'cadchf': 'CADCHF',
                'cadjpy': 'CADJPY',
                'chfjpy': 'CHFJPY',
                'euraud': 'EURAUD',
                'eurcad': 'EURCAD',
                'eurchf': 'EURCHF',
                'eurnzd': 'EURNZD',
                'gbpaud': 'GBPAUD',
                'gbpcad': 'GBPCAD',
                'gbpchf': 'GBPCHF',
                'gbpnzd': 'GBPNZD',
                'nzdcad': 'NZDCAD',
                'nzdchf': 'NZDCHF',
                'nzdjpy': 'NZDJPY',
                'usdmxn': 'USDMXN',
                'usdnok': 'USDNOK',
                'usdsgd': 'USDSGD',

                // 3. Cryptocurrencies
                'btcusd': 'BTCUSD',
                'bitcoin': 'BTCUSD',
                'btc': 'BTCUSD',
                'ethusd': 'ETHUSD',
                'ethereum': 'ETHUSD',
                'eth': 'ETHUSD',
                'ltcusd': 'LTCUSD',
                'litecoin': 'LTCUSD',
                'ltc': 'LTCUSD',
                'xrpusd': 'XRPUSD',
                'ripple': 'XRPUSD',
                'xrp': 'XRPUSD',
                'adausd': 'ADAUSD',
                'cardano': 'ADAUSD',
                'ada': 'ADAUSD',
                'avaxusd': 'AVAXUSD',
                'avalanche': 'AVAXUSD',
                'avax': 'AVAXUSD',
                'bchusd': 'BCHUSD',
                'bitcoincash': 'BCHUSD',
                'bch': 'BCHUSD',
                'solusd': 'SOLUSD',
                'solana': 'SOLUSD',
                'sol': 'SOLUSD',
                'kusama': 'KUSAMA',
                'moonbeam': 'MOONBEAM',
                'polygon': 'POLYGON',
                'uniswap': 'UNISWAP',

                // 4. Commodities
                'xauusd': 'XAUUSD',
                'gold': 'XAUUSD',
                'xau': 'XAUUSD',
                'xagusd': 'XAGUSD',
                'silver': 'XAGUSD',
                'xag': 'XAGUSD',
                'oil': 'CRUDE_OIL',
                'crude': 'CRUDE_OIL',
                'wti': 'WTI_CRUDE_OIL',
                'brent': 'BRENT_CRUDE_OIL',
                'copper': 'COPPER',
                'naturalgas': 'NATURAL_GAS',
                'platinum': 'PLATINUM',

                // 5. ETFs
                'msci': 'ETF_MSCI_BRAZIL',
                'brazil': 'ETF_MSCI_BRAZIL',
                'nasdaq': 'NASDAQ',
                'reversal': 'ETF_NASDAQ_REVERSAL',
                'volatility': 'ETF_SP500_VOLATILITY',
                'spdr': 'SPDR_SP500_ETF',
                'realestate': 'US_REAL_ESTATE_ETF',

                // 6. Stock Market Indices
                'spx500': 'SPX500',
                'sp500': 'SPX500',
                's&p500': 'SPX500',
                'nas100': 'NAS100',
                'dji30': 'DJI30',
                'dow': 'DJI30',
                'dowjones': 'DJI30',
                'ftse100': 'FTSE100',
                'ftse': 'FTSE100',
                'dax30': 'DAX30',
                'dax': 'DAX30',
                'cac40': 'CAC40',
                'cac': 'CAC40',
                'nikkei': 'NIKKEI225',
                'nikkei225': 'NIKKEI225',
                'hangseng': 'HANGSENG',
                'russell': 'RUSSELL2000',
                'russell2000': 'RUSSELL2000',

                // 7. Individual Stocks
                'amd': 'AMD',
                'amazon': 'AMAZON',
                'amzn': 'AMAZON',
                'apple': 'APPLE',
                'aapl': 'APPLE',
                'baidu': 'BAIDU',
                'boeing': 'BOEING',
                'ba': 'BOEING',
                'caterpillar': 'CATERPILLAR',
                'cat': 'CATERPILLAR',
                'cocacola': 'COCA_COLA',
                'ko': 'COCA_COLA',
                'facebook': 'META',
                'meta': 'META',
                'fb': 'META',
                'goldman': 'GOLDMAN_SACHS',
                'goldmansachs': 'GOLDMAN_SACHS',
                'gs': 'GOLDMAN_SACHS',
                'google': 'GOOGLE',
                'alphabet': 'GOOGLE',
                'googl': 'GOOGLE',
                'ibm': 'IBM',
                'intel': 'INTEL',
                'intc': 'INTEL',
                'mastercard': 'MASTERCARD',
                'ma': 'MASTERCARD',
                'mcdonalds': 'MCDONALDS',
                'mcd': 'MCDONALDS',
                'microsoft': 'MICROSOFT',
                'msft': 'MICROSOFT',
                'netflix': 'NETFLIX',
                'nflx': 'NETFLIX',
                'nike': 'NIKE',
                'nke': 'NIKE',
                'nvidia': 'NVIDIA',
                'nvda': 'NVIDIA',
                'oracle': 'ORACLE',
                'orcl': 'ORACLE',
                'pfizer': 'PFIZER',
                'pfe': 'PFIZER',
                'procter': 'PROCTER_GAMBLE',
                'proctergamble': 'PROCTER_GAMBLE',
                'pg': 'PROCTER_GAMBLE',
                'starbucks': 'STARBUCKS',
                'sbux': 'STARBUCKS',
                'tesla': 'TESLA',
                'tsla': 'TESLA',
                'toyota': 'TOYOTA',
                'tm': 'TOYOTA',
                'visa': 'VISA',
                'v': 'VISA'
            };

            // Check URL for asset indicators
            for (const [pattern, asset] of Object.entries(assetPatterns)) {
                if (url.includes(pattern)) {
                    console.log(`🎯 Asset detected from URL: ${asset} (pattern: ${pattern})`);
                    return asset;
                }
            }

            // Try to inject script to read asset from page content
            try {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => {
                        // Try to find asset name in common Olymp Trade selectors
                        const selectors = [
                            '[data-asset]',
                            '.asset-name',
                            '.symbol-name',
                            '.trading-pair',
                            '.current-asset',
                            '.asset-title',
                            '.instrument-name',
                            '.pair-name',
                            '.symbol-text',
                            '.asset-symbol'
                        ];

                        for (const selector of selectors) {
                            const element = document.querySelector(selector);
                            if (element) {
                                const text = element.textContent || element.getAttribute('data-asset') || '';
                                if (text.trim()) {
                                    console.log(`Found asset in selector ${selector}: ${text}`);
                                    return text.trim();
                                }
                            }
                        }

                        // Look for asset patterns in page text
                        const bodyText = document.body.textContent || '';

                        // Enhanced regex patterns for different asset types
                        const patterns = [
                            // Forex patterns
                            /(EUR\/USD|GBP\/USD|USD\/JPY|AUD\/USD|USD\/CAD|USD\/CHF|NZD\/USD|EUR\/JPY|GBP\/JPY|EUR\/GBP)/i,
                            // Crypto patterns  
                            /(BTC\/USD|ETH\/USD|LTC\/USD|XRP\/USD|ADA\/USD|DOT\/USD|Bitcoin|Ethereum|Litecoin|Ripple|Cardano|Polkadot)/i,
                            // Commodities
                            /(XAU\/USD|XAG\/USD|Gold|Silver|Crude Oil|WTI|Brent)/i,
                            // Indices
                            /(S&P 500|SPX500|NASDAQ|NAS100|Dow Jones|DJI30|FTSE 100|DAX 30|CAC 40|Nikkei|Hang Seng|ASX 200)/i,
                            // Asian indices
                            /(Asia Composite|KOSPI|Sensex|Shanghai|Shenzhen|Taiwan|Jakarta|Kuala Lumpur|Singapore|Thailand|Philippines|Vietnam)/i
                        ];

                        for (const pattern of patterns) {
                            const match = bodyText.match(pattern);
                            if (match) {
                                console.log(`Found asset pattern in page: ${match[1]}`);
                                return match[1];
                            }
                        }

                        // Look for specific text indicators
                        const assetIndicators = [
                            'Bitcoin', 'BTC', 'Ethereum', 'ETH', 'Litecoin', 'LTC',
                            'Asia Composite', 'Asian Index', 'KOSPI', 'Nikkei', 'Hang Seng',
                            'Gold', 'Silver', 'Crude Oil', 'S&P 500', 'NASDAQ', 'Dow Jones'
                        ];

                        for (const indicator of assetIndicators) {
                            if (bodyText.includes(indicator)) {
                                console.log(`Found asset indicator in page: ${indicator}`);
                                return indicator;
                            }
                        }

                        return null;
                    }
                });

                if (results && results[0] && results[0].result) {
                    const pageAsset = results[0].result.toLowerCase().trim();
                    console.log(`🔍 Raw asset from page: "${pageAsset}"`);

                    // Map page content to standard asset symbols
                    for (const [pattern, asset] of Object.entries(assetPatterns)) {
                        if (pageAsset.includes(pattern) || pattern.includes(pageAsset)) {
                            console.log(`🎯 Asset mapped from page content: ${asset}`);
                            return asset;
                        }
                    }

                    // Direct mapping for common variations
                    const directMappings = {
                        'bitcoin': 'BTCUSD',
                        'btc': 'BTCUSD',
                        'ethereum': 'ETHUSD',
                        'eth': 'ETHUSD',
                        'asia composite': 'ASIA_COMPOSITE',
                        'asian index': 'ASIA_COMPOSITE',
                        'gold': 'XAUUSD',
                        'silver': 'XAGUSD',
                        's&p 500': 'SPX500',
                        'nasdaq': 'NAS100',
                        'nikkei': 'NIKKEI225',
                        'hang seng': 'HANGSENG'
                    };

                    if (directMappings[pageAsset]) {
                        console.log(`🎯 Asset mapped directly: ${directMappings[pageAsset]}`);
                        return directMappings[pageAsset];
                    }
                }
            } catch (scriptError) {
                console.warn('Could not inject script to detect asset:', scriptError);
            }

            // Default to EURUSD if no asset detected
            console.log('⚠️ No specific asset detected, defaulting to EURUSD');
            return 'EURUSD';
        } catch (error) {
            console.warn('Symbol detection failed:', error);
            return 'EURUSD';
        }
    }



    static async performOptimizedAnalysis(captureData, marketData, detectedAsset, config, geminiApiKey) {
        // Build SPEED-OPTIMIZED prompt
        let prompt = QUANTITATIVE_SYSTEM_PROMPT;

        prompt += `\n\n⚡ SPEED ANALYSIS FOR: ${detectedAsset}`;

        // Add ONLY essential live data for speed
        if (marketData && !marketData.fallback) {
            const rsi = marketData.technical?.rsi || 50;
            const macd = marketData.technical?.macd?.macd || 0;
            const price = marketData.live?.price || 0;
            const change = marketData.live?.changePercent || 0;
            const momentum = marketData.momentum?.direction || 'NEUTRAL';

            prompt += `\n\nLIVE DATA: Price=${price}, Change=${change}%, RSI=${rsi.toFixed(1)}, MACD=${macd > 0 ? 'POS' : 'NEG'}, Momentum=${momentum}`;

            // Add news alert if critical
            if (marketData.sentiment?.newsCount > 0) {
                prompt += `\nNEWS ALERT: ${marketData.sentiment.newsCount} items affecting ${detectedAsset}`;
            }
        } else {
            prompt += `\nLIVE DATA: UNAVAILABLE - Visual analysis only`;
        }

        // Provide the model a strict allowed-asset set so it can identify the exact asset from the chart UI.
        const supportedAssetsText = await StocksTxtCatalog.getSupportedAssetsText();
        prompt += `\n\nSUPPORTED ASSETS (from Stocks.txt)\n${supportedAssetsText}`;
        prompt += `\n\nTASK: Identify which supported asset this chart is for. In your JSON output, add:\n- "identifiedAsset": one exact asset name/symbol from SUPPORTED ASSETS (best guess).\nIf you cannot tell, set identifiedAsset to "${detectedAsset}".`;

        prompt += `\n\n⚡ INSTANT DECISION REQUIRED: Analyze ${config.captureMode} and provide immediate BET UP / BET DOWN / NO TRADE decision with confidence level.`;

        // Prepare payload based on capture mode
        let payload;
        if (config.captureMode === 'video') {
            payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: 'video/webm',
                                data: captureData
                            }
                        }
                    ]
                }]
            };
        } else if (config.captureMode === 'multi-frame') {
            const parts = [{ text: prompt }];
            captureData.forEach((frame, index) => {
                parts.push({
                    inline_data: {
                        mime_type: 'image/jpeg',
                        data: frame.data
                    }
                });
            });
            payload = { contents: [{ parts }] };
        } else {
            payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: captureData
                            }
                        }
                    ]
                }]
            };
        }

        // Send to Gemini API
        const apiResponse = await this.sendToGeminiAPI(geminiApiKey, payload);
        const analysis = GeminiAPI.parseAnalysisResponse(apiResponse);

        // Enhance analysis with detected asset and live market data
        const identifiedAsset = analysis.identifiedAsset || analysis.asset || analysis.symbol;
        analysis.identifiedAsset = identifiedAsset || null;
        analysis.detectedAsset = identifiedAsset || detectedAsset;
        analysis.platform = 'Olymp Trade';
        analysis.captureType = config.captureMode;

        if (marketData) {
            // Add live market context
            analysis.liveData = {
                symbol: detectedAsset,
                currentPrice: marketData.live?.price,
                priceChange: marketData.live?.change,
                changePercent: marketData.live?.changePercent,
                momentum: marketData.momentum?.direction,
                dayHigh: marketData.live?.high,
                dayLow: marketData.live?.low
            };

            // Add technical indicators with signals
            if (marketData.technical) {
                analysis.indicators = {
                    rsi: `${marketData.technical.rsi?.toFixed(2)} ${this.getRSISignal(marketData.technical.rsi)}`,
                    macd: `${marketData.technical.macd?.macd?.toFixed(4)} ${this.getMACDSignal(marketData.technical.macd)}`,
                    bollinger: `${((marketData.technical.bollinger?.position || 0) * 100).toFixed(1)}% ${this.getBollingerSignal(marketData.technical.bollinger?.position)}`,
                    atr: marketData.technical.atr?.toFixed(4),
                    support: marketData.technical.support?.toFixed(4),
                    resistance: marketData.technical.resistance?.toFixed(4),
                    trend: marketData.technical.trend
                };
            }

            // Add news sentiment
            if (marketData.sentiment?.news) {
                analysis.newsSentiment = {
                    newsCount: marketData.sentiment.newsCount,
                    latestNews: marketData.sentiment.news.slice(0, 3).map(item => ({
                        headline: item.headline,
                        time: item.datetime
                    }))
                };
            }
        }

        return analysis;
    }

    // Helper methods for signal interpretation
    static getRSISignal(rsi) {
        if (!rsi) return '';
        if (rsi > 70) return '(Overbought)';
        if (rsi < 30) return '(Oversold)';
        if (rsi > 50) return '(Bullish)';
        return '(Bearish)';
    }

    static getMACDSignal(macd) {
        if (!macd || !macd.macd) return '';
        return macd.macd > 0 ? '(Bullish)' : '(Bearish)';
    }

    static getBollingerSignal(position) {
        if (!position) return '';
        if (position > 0.8) return '(Near Upper Band)';
        if (position < 0.2) return '(Near Lower Band)';
        if (position > 0.5) return '(Above Middle)';
        return '(Below Middle)';
    }

    static async sendToGeminiAPI(apiKey, payload) {
        // Use existing Gemini API logic with model discovery
        const availableModels = await GeminiAPI.discoverAvailableModels(apiKey);

        if (availableModels.length === 0) {
            throw new Error('No compatible Gemini models found');
        }

        for (const model of availableModels) {
            try {
                const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    return await response.json();
                }

                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData?.error?.message || '';

                if (errorMessage.includes('no longer available') ||
                    errorMessage.includes('deprecated')) {
                    continue;
                }

                console.warn(`Model ${model} failed:`, errorMessage);
                continue;
            } catch (error) {
                console.warn(`Error with model ${model}:`, error);
                continue;
            }
        }

        throw new Error('All available models failed');
    }
}

// ============================================================================
// EVENT LISTENERS - Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Load saved API keys
    const apiKeys = await StorageManager.loadApiKeys();
    DOM.apiKeyInput.value = apiKeys.gemini;
    DOM.marketDataApiKey.value = apiKeys.marketData;

    // Load saved configuration
    const config = await StorageManager.loadAnalysisConfig();
    DOM.captureMode.value = config.captureMode;

    console.log('QuantumTrader Extension Loaded Successfully');
    console.log('Environment: Extension Popup | Manifest V3 | Enhanced Analysis');
});

// ============================================================================
// EVENT LISTENERS - API Key Management
// ============================================================================
DOM.apiKeyInput.addEventListener('blur', async () => {
    const apiKeys = await StorageManager.loadApiKeys();
    apiKeys.gemini = DOM.apiKeyInput.value.trim();
    await StorageManager.saveApiKeys(apiKeys);
});

DOM.marketDataApiKey.addEventListener('blur', async () => {
    const apiKeys = await StorageManager.loadApiKeys();
    apiKeys.marketData = DOM.marketDataApiKey.value.trim();
    await StorageManager.saveApiKeys(apiKeys);
});

// Toggle buttons
DOM.toggleApiKeyBtn.addEventListener('click', () => {
    const inputType = DOM.apiKeyInput.type;
    DOM.apiKeyInput.type = inputType === 'password' ? 'text' : 'password';
    DOM.toggleApiKeyBtn.textContent = inputType === 'password' ? '🙈' : '👁️';
});

DOM.toggleMarketDataKey.addEventListener('click', () => {
    const inputType = DOM.marketDataApiKey.type;
    DOM.marketDataApiKey.type = inputType === 'password' ? 'text' : 'password';
    DOM.toggleMarketDataKey.textContent = inputType === 'password' ? '🙈' : '👁️';
});

// Configuration changes
[DOM.captureMode].forEach(element => {
    element.addEventListener('change', async () => {
        const config = {
            captureMode: DOM.captureMode.value
        };
        await StorageManager.saveAnalysisConfig(config);
=======
async function persistFormSettings() {
    await StorageManager.save({
        rpcUrl: DOM.rpcUrl.value,
        privateKey: DOM.privateKey.value,
        registryAddress: DOM.registryAddress.value,
        tokenAddress: DOM.tokenAddress.value,
        marketplaceAddress: DOM.marketplaceAddress.value,
        usdcAddress: DOM.usdcAddress.value,
        geminiApiKey: DOM.geminiApiKey.value,
>>>>>>> Stashed changes
    });
}

async function registerAsset() {
    clearError();
    try {
        setLoading(true);
        await persistFormSettings();

        const detailsURI = (DOM.detailsUri.value || '').trim();
        if (!detailsURI) throw new Error('detailsURI is required');

        const registry = getRegistry(false);
        const tx = await registry.registerAsset(detailsURI);
        await tx.wait();

        DOM.detailsUri.value = '';
        await refreshAssets();
    } catch (err) {
        console.error(err);
        showError(err?.message || String(err));
    } finally {
        setLoading(false);
    }
}

async function refreshAssets() {
    clearError();

    try {
        setLoading(true);
        await persistFormSettings();

        const registry = getRegistry(true);
        const nextId = await registry.nextAssetId();
        const maxId = Number(nextId) - 1;

        const assets = [];
        for (let id = 1; id <= maxId; id++) {
            const a = await registry.assets(id);
            assets.push({
                assetId: Number(a.assetId_),
                issuer: a.issuer,
                detailsURI: a.detailsURI,
                verified: a.verified,
                auditor: a.auditor,
                appraisedValue: a.appraisedValue,
                totalFractions: a.totalFractions,
                verifiedAt: a.verifiedAt,
            });
        }

        STATE.assets = assets;
        renderAssetSelect();
    } catch (err) {
        console.error(err);
        showError(err?.message || String(err));
    } finally {
        setLoading(false);
    }
}

function renderAssetSelect() {
    DOM.assetSelect.innerHTML = '';

    if (!STATE.assets.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '(no assets registered)';
        DOM.assetSelect.appendChild(opt);
        return;
    }

    for (const a of STATE.assets) {
        const opt = document.createElement('option');
        opt.value = String(a.assetId);
        const status = a.verified ? 'VERIFIED' : 'UNVERIFIED';
        const valueText = a.verified ? ` | val=${a.appraisedValue}` : '';
        opt.textContent = `#${a.assetId} | ${status}${valueText}`;
        DOM.assetSelect.appendChild(opt);
    }
}

async function refreshPortfolio() {
    if (!STATE.walletAddress) {
        DOM.portfolioBox.innerHTML = '<div style="font-size:10px; color:#b0b0b0;">Connect a wallet to load balances.</div>';
        return;
    }

    clearError();

    try {
        setLoading(true);
        await persistFormSettings();

        const token = getToken(true);

        const rows = [];
        for (const a of STATE.assets) {
            const bal = await token.balanceOf(STATE.walletAddress, a.assetId);
            if (bal > 0n) {
                rows.push({ assetId: a.assetId, balance: bal, detailsURI: a.detailsURI, verified: a.verified });
            }
        }

        if (!rows.length) {
            DOM.portfolioBox.innerHTML = '<div style="font-size:10px; color:#b0b0b0;">No fractions owned yet.</div>';
            return;
        }

        DOM.portfolioBox.innerHTML = rows
            .map(r => {
                const badge = r.verified ? 'VERIFIED' : 'UNVERIFIED';
                return `<div style="font-size:10px; margin-bottom:6px;"><strong>Asset #${r.assetId}</strong> (${badge}) — balance: <strong>${r.balance.toString()}</strong><br/><span style="color:#888;">${escapeHtml(r.detailsURI)}</span></div>`;
            })
            .join('');
    } catch (err) {
        console.error(err);
        showError(err?.message || String(err));
    } finally {
        setLoading(false);
    }
}

async function buyFraction() {
    clearError();

    try {
        setLoading(true);
        await persistFormSettings();

        const assetId = Number(DOM.assetSelect.value);
        if (!assetId) throw new Error('Select an asset');

        const amount = Number(DOM.buyAmount.value);
        if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid buy amount');

        const market = getMarketplace(false);
        const payment = DOM.buyPayment.value;

        const p = await market.prices(assetId);

        if (payment === 'ETH') {
            const unit = BigInt(p.buyWeiPerToken);
            if (unit === 0n) throw new Error('Marketplace buyWeiPerToken is not set for this asset');
            const cost = unit * BigInt(amount);

            const tx = await market.buyWithETH(assetId, amount, { value: cost });
            await tx.wait();
        } else {
            // USDC
            const unit = BigInt(p.buyUsdcPerToken);
            if (unit === 0n) throw new Error('Marketplace buyUsdcPerToken is not set for this asset');
            const cost = unit * BigInt(amount);

            const usdc = getUsdc(false);
            const marketAddr = normalizeAddress(DOM.marketplaceAddress.value);
            const allowance = await usdc.allowance(STATE.walletAddress, marketAddr);

            if (BigInt(allowance) < cost) {
                const txA = await usdc.approve(marketAddr, cost);
                await txA.wait();
            }

            const tx = await market.buyWithUSDC(assetId, amount);
            await tx.wait();
        }

        await refreshPortfolio();
    } catch (err) {
        console.error(err);
        showError(err?.message || String(err));
    } finally {
        setLoading(false);
    }
}

// ---------------------------
// Gemini valuation (Phase 3 scaffolding)
// ---------------------------

function extractJson(text) {
    // Try direct parse first
    try {
        return JSON.parse(text);
    } catch {
        // Try fenced ```json blocks
        const m = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/```\s*([\s\S]*?)\s*```/i);
        if (m) {
            return JSON.parse(m[1]);
        }
    }
    throw new Error('Gemini response was not valid JSON');
}

async function runGeminiValuation() {
    clearError();

    try {
        setLoading(true);
        await persistFormSettings();

        const apiKey = (DOM.geminiApiKey.value || '').trim();
        if (!apiKey) throw new Error('Gemini API key is required');

        const payload = (DOM.assetPayload.value || '').trim();
        if (!payload) throw new Error('Paste asset JSON/text first');

        const prompt = `You are an RWA auditor.

Return ONLY strict JSON (no markdown, no code fences) with this schema:

{
  "appraisedValue": <uint>,
  "appraisedValueUnit": "USD_CENTS",
  "totalFractions": <uint>,
  "tokenUri": "ipfs://... or https://...",
  "buyWeiPerToken": <uint>,
  "sellWeiPerToken": <uint>,
  "buyUsdcPerToken": <uint>,
  "sellUsdcPerToken": <uint>,
  "riskSummary": "one paragraph",
  "assumptions": ["..."],
  "redFlags": ["..."]
}

Rules:
- appraisedValueUnit MUST be USD_CENTS.
- Use integer values only.
- totalFractions should usually be 100000 unless the asset data strongly suggests otherwise.
- Ensure buy price > sell price (positive spread).

Asset data:
${payload}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }],
                    },
                ],
                generationConfig: {
                    temperature: 0.2,
                },
            }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Gemini error (${res.status}): ${text.slice(0, 200)}`);
        }

        const data = await res.json();
        const textOut = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
        const json = extractJson(textOut);

        DOM.valuationOutput.textContent = JSON.stringify(json, null, 2);

        // Fill fields to make on-chain actions easy
        if (typeof json.appraisedValue !== 'undefined') DOM.appraisedValue.value = String(json.appraisedValue);
        if (typeof json.totalFractions !== 'undefined') DOM.totalFractions.value = String(json.totalFractions);
        if (typeof json.tokenUri !== 'undefined') DOM.tokenUri.value = String(json.tokenUri);
        if (typeof json.buyWeiPerToken !== 'undefined') DOM.buyWeiPerToken.value = String(json.buyWeiPerToken);
        if (typeof json.sellWeiPerToken !== 'undefined') DOM.sellWeiPerToken.value = String(json.sellWeiPerToken);
        if (typeof json.buyUsdcPerToken !== 'undefined') DOM.buyUsdcPerToken.value = String(json.buyUsdcPerToken);
        if (typeof json.sellUsdcPerToken !== 'undefined') DOM.sellUsdcPerToken.value = String(json.sellUsdcPerToken);
    } catch (err) {
        console.error(err);
        showError(err?.message || String(err));
    } finally {
        setLoading(false);
    }
}

async function verifyAndTokenize() {
    clearError();

    try {
        setLoading(true);
        await persistFormSettings();

        const assetId = Number(DOM.assetSelect.value);
        if (!assetId) throw new Error('Select an asset');

        const appraisedValue = BigInt(DOM.appraisedValue.value || '0');
        const totalFractions = BigInt(DOM.totalFractions.value || '0');
        const tokenUri = (DOM.tokenUri.value || '').trim();

        if (totalFractions <= 0n) throw new Error('totalFractions must be > 0');
        if (!tokenUri) throw new Error('tokenUri is required');

        const registry = getRegistry(false);
        const tx = await registry.verifyAndTokenizeAsset(assetId, appraisedValue, totalFractions, tokenUri);
        await tx.wait();

        await refreshAssets();
    } catch (err) {
        console.error(err);
        showError(err?.message || String(err));
    } finally {
        setLoading(false);
    }
}

async function setMarketPrices() {
    clearError();

    try {
        setLoading(true);
        await persistFormSettings();

        const assetId = Number(DOM.assetSelect.value);
        if (!assetId) throw new Error('Select an asset');

        const buyWei = BigInt(DOM.buyWeiPerToken.value || '0');
        const sellWei = BigInt(DOM.sellWeiPerToken.value || '0');
        const buyUsdc = BigInt(DOM.buyUsdcPerToken.value || '0');
        const sellUsdc = BigInt(DOM.sellUsdcPerToken.value || '0');

        const market = getMarketplace(false);
        const tx = await market.setAssetPrices(assetId, buyWei, sellWei, buyUsdc, sellUsdc);
        await tx.wait();
    } catch (err) {
        console.error(err);
        showError(err?.message || String(err));
    } finally {
        setLoading(false);
    }
}

// ---------------------------
// Misc
// ---------------------------

function escapeHtml(s) {
    return String(s || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// ---------------------------
// Init
// ---------------------------

async function init() {
    clearError();
    setLoading(false);

    // Restore settings
    const settings = await StorageManager.load();

    DOM.rpcUrl.value = settings.rpcUrl;
    DOM.privateKey.value = settings.privateKey;
    DOM.registryAddress.value = settings.registryAddress;
    DOM.tokenAddress.value = settings.tokenAddress;
    DOM.marketplaceAddress.value = settings.marketplaceAddress;
    DOM.usdcAddress.value = settings.usdcAddress;
    DOM.geminiApiKey.value = settings.geminiApiKey;

    // Set read provider early
    try {
        getProvider();
        setWalletStatus('Disconnected');
        await refreshAssets();
    } catch {
        // ignore on init
    }

    // Wire listeners
    DOM.connectWalletBtn.addEventListener('click', connectWallet);
    DOM.refreshAssetsBtn.addEventListener('click', refreshAssets);
    DOM.registerAssetBtn.addEventListener('click', registerAsset);
    DOM.buyBtn.addEventListener('click', buyFraction);
    DOM.assetSelect.addEventListener('change', refreshPortfolio);

    DOM.togglePrivateKey.addEventListener('click', () => togglePasswordInput(DOM.privateKey));
    DOM.toggleGeminiKey.addEventListener('click', () => togglePasswordInput(DOM.geminiApiKey));

    DOM.runValuationBtn.addEventListener('click', runGeminiValuation);
    DOM.verifyTokenizeBtn.addEventListener('click', verifyAndTokenize);
    DOM.setPricesBtn.addEventListener('click', setMarketPrices);
    DOM.setAuditorBtn.addEventListener('click', setAuditor);

    // Persist on input changes (best effort)
    for (const el of [
        DOM.rpcUrl,
        DOM.privateKey,
        DOM.registryAddress,
        DOM.tokenAddress,
        DOM.marketplaceAddress,
        DOM.usdcAddress,
        DOM.geminiApiKey,
    ]) {
        el.addEventListener('change', () => {
            persistFormSettings().catch(() => undefined);
        });
    }
}

init().catch((err) => {
    console.error(err);
    showError(err?.message || String(err));
});
