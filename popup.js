/**
 * AITrader - Chrome Extension
 * Passive Chart Analysis using Gemini AI
 * Manifest V3 Compliant | No Content Script Injection
 */

// ============================================================================
// QUANTITATIVE ANALYSIS SYSTEM PROMPT - OLYMP TRADE FOCUSED
// ============================================================================
const QUANTITATIVE_SYSTEM_PROMPT = `You are a SPEED-OPTIMIZED quantitative trading analyst for OLYMP TRADE binary options.
Provide INSTANT, HIGH-ACCURACY predictions in minimal time.

ULTRA-FAST ANALYSIS PROTOCOL:
1. IMMEDIATE VISUAL SCAN (2 seconds max):
   - Instant trend identification: UP/DOWN/SIDEWAYS
   - Quick pattern recognition: Breakout/Rejection/Consolidation
   - Rapid support/resistance identification

2. LIVE DATA INTEGRATION (1 second max):
   - RSI: >50 = Bullish bias, <50 = Bearish bias
   - MACD: Positive = UP momentum, Negative = DOWN momentum
   - Price vs Bollinger Middle: Above = BUY bias, Below = SELL bias
   - Current momentum direction: BULLISH/BEARISH

3. LIGHTNING-FAST DECISION MATRIX:
   ⚡ INSTANT BUY SIGNALS:
   - Visual: Clear upward movement + Live: RSI >50 + MACD positive + Price rising
   - Confidence: HIGH if all align, MEDIUM if 3/4 align
   
   ⚡ INSTANT SELL SIGNALS:
   - Visual: Clear downward movement + Live: RSI <50 + MACD negative + Price falling
   - Confidence: HIGH if all align, MEDIUM if 3/4 align
   
   ⚡ INSTANT NO TRADE:
   - Mixed signals (2/4 or less alignment)
   - Extreme RSI (>80 or <20) without momentum confirmation
   - Sideways/ranging price action

SPEED-OPTIMIZED RULES:
- Analysis time: <5 seconds total
- Decision confidence: Based on signal alignment (4/4=HIGH, 3/4=MEDIUM, <3=NO TRADE)
- Duration: 5-15 minutes for high volatility, 15-30 minutes for normal volatility
- Risk: HIGH if news within 30min, MEDIUM if volatility >average, LOW otherwise

INSTANT OUTPUT (JSON ONLY - NO EXPLANATIONS):
{
  "decision": "BUY" | "SELL" | "NO TRADE",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidencePercentage": 65-95,
  "duration": "5-30 minutes",
  "reason": "One sentence: Visual + Live data alignment"
}`;

// ============================================================================
// DOM ELEMENTS
// ============================================================================
const DOM = {
    // API Keys
    apiKeyInput: document.getElementById('apiKey'),
    toggleApiKeyBtn: document.getElementById('toggleApiKey'),
    marketDataApiKey: document.getElementById('marketDataApiKey'),
    toggleMarketDataKey: document.getElementById('toggleMarketDataKey'),


    // Configuration
    timeframe: document.getElementById('timeframe'),
    analysisMode: document.getElementById('analysisMode'),
    captureMode: document.getElementById('captureMode'),

    // Controls
    analyzeBtn: document.getElementById('analyzeBtn'),
    loadingSpinner: document.getElementById('loadingSpinner'),

    // Results
    resultSection: document.getElementById('resultSection'),
    decisionOutput: document.getElementById('decisionOutput'),
    confidenceOutput: document.getElementById('confidenceOutput'),
    confidencePercentageOutput: document.getElementById('confidencePercentageOutput'),
    reasonOutput: document.getElementById('reasonOutput'),

    // Errors
    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage')
};

// ============================================================================
// ENHANCED STORAGE MANAGEMENT
// ============================================================================
class StorageManager {
    static async saveApiKeys(keys) {
        try {
            await chrome.storage.local.set({
                geminiApiKey: keys.gemini || '',
                marketDataApiKey: keys.marketData || ''
            });
        } catch (error) {
            console.error('Error saving API keys:', error);
        }
    }

    static async loadApiKeys() {
        try {
            const result = await chrome.storage.local.get([
                'geminiApiKey',
                'marketDataApiKey'
            ]);
            return {
                gemini: result.geminiApiKey || '',
                marketData: result.marketDataApiKey || ''
            };
        } catch (error) {
            console.error('Error loading API keys:', error);
            return { gemini: '', marketData: '' };
        }
    }

    static async saveAnalysisConfig(config) {
        try {
            await chrome.storage.local.set({
                timeframe: config.timeframe,
                analysisMode: config.analysisMode,
                captureMode: config.captureMode
            });
        } catch (error) {
            console.error('Error saving analysis config:', error);
        }
    }

    static async loadAnalysisConfig() {
        try {
            const result = await chrome.storage.local.get([
                'timeframe',
                'analysisMode',
                'captureMode'
            ]);
            return {
                timeframe: result.timeframe || '1h',
                analysisMode: result.analysisMode || 'quantitative',
                captureMode: result.captureMode || 'video'
            };
        } catch (error) {
            console.error('Error loading analysis config:', error);
            return {
                timeframe: '1h',
                analysisMode: 'quantitative',
                captureMode: 'video'
            };
        }
    }

    // Legacy methods for backward compatibility
    static async saveApiKey(apiKey) {
        await this.saveApiKeys({ gemini: apiKey });
    }

    static async loadApiKey() {
        const keys = await this.loadApiKeys();
        return keys.gemini;
    }
}

// ============================================================================
// ADVANCED CAPTURE SYSTEM - VIDEO & MULTI-FRAME
// ============================================================================
class AdvancedCapture {
    static async captureVideo(durationSeconds = 5) {
        try {
            console.log(`Starting ${durationSeconds}s video capture...`);

            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Start screen capture
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    mediaSource: 'tab',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            const chunks = [];

            return new Promise((resolve, reject) => {
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        chunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    try {
                        const blob = new Blob(chunks, { type: 'video/webm' });
                        const videoBase64 = await this.blobToBase64(blob);

                        // Stop all tracks
                        stream.getTracks().forEach(track => track.stop());

                        resolve(videoBase64);
                    } catch (error) {
                        reject(error);
                    }
                };

                mediaRecorder.onerror = (error) => {
                    stream.getTracks().forEach(track => track.stop());
                    reject(error);
                };

                // Start recording
                mediaRecorder.start();

                // Stop after specified duration
                setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, durationSeconds * 1000);
            });

        } catch (error) {
            console.error('Error capturing video:', error);
            throw new Error('Failed to capture video. Please ensure screen sharing is allowed.');
        }
    }

    static async captureMultiFrame(frameCount = 5, intervalMs = 2000) {
        try {
            console.log(`Capturing ${frameCount} frames with ${intervalMs}ms intervals...`);
            const frames = [];

            for (let i = 0; i < frameCount; i++) {
                const dataUrl = await chrome.tabs.captureVisibleTab({
                    format: 'jpeg',
                    quality: 95
                });

                frames.push({
                    timestamp: Date.now(),
                    data: this.convertDataUrlToBase64(dataUrl),
                    frameNumber: i + 1
                });

                // Wait before next capture (except for last frame)
                if (i < frameCount - 1) {
                    await this.sleep(intervalMs);
                }
            }

            return frames;
        } catch (error) {
            console.error('Error capturing multi-frame:', error);
            throw new Error('Failed to capture multiple frames.');
        }
    }

    static async captureScreenshot() {
        try {
            const dataUrl = await chrome.tabs.captureVisibleTab({
                format: 'jpeg',
                quality: 95
            });
            return dataUrl;
        } catch (error) {
            console.error('Error capturing screenshot:', error);
            throw new Error('Failed to capture chart image. Ensure a tab is active.');
        }
    }

    static convertDataUrlToBase64(dataUrl) {
        try {
            return dataUrl.split(',')[1];
        } catch (error) {
            console.error('Error converting image to base64:', error);
            throw new Error('Failed to process image data.');
        }
    }

    static async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Create fallback market context when Finnhub completely fails
    static createFallbackMarketContext(symbol) {
        console.log(`🔄 Creating fallback context for ${symbol} - Finnhub unavailable`);
        return {
            symbol: symbol,
            timestamp: new Date().toISOString(),
            live: null,
            technical: null,
            sentiment: {
                news: null,
                newsCount: 0
            },
            fallback: true,
            message: 'Live market data unavailable - proceeding with visual analysis only'
        };
    }

    // Helper functions for Finnhub integration
    static formatSymbolForFinnhub(symbol) {
        // Convert EURUSD to OANDA:EUR_USD format for Finnhub
        if (symbol.length === 6) {
            return `OANDA:${symbol.slice(0, 3)}_${symbol.slice(3, 6)}`;
        }
        return symbol;
    }

    static convertTimeframeForFinnhub(timeframe) {
        const mapping = {
            '1m': '1',
            '5m': '5',
            '15m': '15',
            '30m': '30',
            '1h': '60',
            '4h': '240',
            '1d': 'D'
        };
        return mapping[timeframe] || '60';
    }

    static filterRelevantNews(news, symbol) {
        if (!news || !Array.isArray(news)) return null;

        const currency1 = symbol.slice(0, 3).toLowerCase();
        const currency2 = symbol.slice(3, 6).toLowerCase();

        return news.filter(item => {
            const text = (item.summary + ' ' + item.headline).toLowerCase();
            return text.includes(currency1) ||
                text.includes(currency2) ||
                text.includes('forex') ||
                text.includes('fed') ||
                text.includes('ecb') ||
                text.includes('central bank');
        }).slice(0, 5); // Top 5 relevant news items
    }

    static calculateTechnicalIndicators(candles) {
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const volumes = candles.map(c => c.volume || 1000);

        return {
            rsi: this.calculateRSI(closes, 14),
            macd: this.calculateMACD(closes),
            bollinger: this.calculateBollingerBands(closes, 20, 2),
            atr: this.calculateATR(highs, lows, closes, 14),
            sma20: this.calculateSMA(closes, 20),
            ema12: this.calculateEMA(closes, 12),
            ema26: this.calculateEMA(closes, 26),
            support: Math.min(...lows.slice(-20)),
            resistance: Math.max(...highs.slice(-20)),
            trend: this.determineTrend(closes)
        };
    }

    static calculateMarketMomentum(liveQuote, recentCandles) {
        const lastCandle = recentCandles[recentCandles.length - 1];
        const prevCandle = recentCandles[recentCandles.length - 2];

        return {
            priceVelocity: (liveQuote.price - lastCandle.close) / lastCandle.close,
            candleMomentum: (lastCandle.close - prevCandle.close) / prevCandle.close,
            gapFromOpen: (liveQuote.price - lastCandle.open) / lastCandle.open,
            direction: liveQuote.price > lastCandle.close ? 'BULLISH' : 'BEARISH'
        };
    }

    static calculateSMA(prices, period) {
        if (prices.length < period) return null;
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }

    static determineTrend(prices) {
        if (prices.length < 10) return 'UNKNOWN';

        const recent = prices.slice(-10);
        const older = prices.slice(-20, -10);

        const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b) / older.length;

        if (recentAvg > olderAvg * 1.001) return 'BULLISH';
        if (recentAvg < olderAvg * 0.999) return 'BEARISH';
        return 'SIDEWAYS';
    }
}

// ============================================================================
// LIVE MARKET DATA API INTEGRATION - FINNHUB REAL-TIME
// ============================================================================
class LiveMarketDataAPI {
    static async getLiveOlympTradeData(symbol, timeframe, apiKey) {
        try {
            // Use your Finnhub API key if no key provided
            const finnhubKey = apiKey || 'd52k5hpr01qqu01vifsgd52k5hpr01qqu01vift0';

            console.log(`🔴 LIVE: Getting real-time data for ${symbol} (${timeframe})`);

            // Use Promise.allSettled to handle individual failures gracefully
            const results = await Promise.allSettled([
                this.getFinnhubLiveQuoteWithRetry(symbol, finnhubKey),
                this.getFinnhubCandlesWithRetry(symbol, timeframe, finnhubKey),
                this.getFinnhubNewsWithRetry(symbol, finnhubKey)
            ]);

            // Extract results, handling failures gracefully
            const liveQuote = results[0].status === 'fulfilled' ? results[0].value : null;
            const recentCandles = results[1].status === 'fulfilled' ? results[1].value : null;
            const marketNews = results[2].status === 'fulfilled' ? results[2].value : null;

            // Log what we successfully retrieved
            console.log(`📊 Live Quote: ${liveQuote ? '✅ Success' : '❌ Failed'}`);
            console.log(`📈 Candles: ${recentCandles ? '✅ Success' : '❌ Failed'}`);
            console.log(`📰 News: ${marketNews ? '✅ Success' : '❌ Failed'}`);

            // Create market context even with partial data
            const context = this.createMarketContext(symbol, liveQuote, recentCandles, marketNews);

            if (!liveQuote && !recentCandles && !marketNews) {
                console.warn('⚠️ All Finnhub APIs failed, creating fallback context');
                return this.createFallbackMarketContext(symbol);
            }

            return context;

        } catch (error) {
            console.error('❌ Complete Finnhub failure:', error);
            // Always return something so analysis can proceed
            return this.createFallbackMarketContext(symbol);
        }
    }

    // Retry wrapper for live quote with exponential backoff
    static async getFinnhubLiveQuoteWithRetry(symbol, apiKey, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries}: Getting live quote for ${symbol}`);
                const result = await this.getFinnhubLiveQuote(symbol, apiKey);
                if (result) return result;

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            } catch (error) {
                console.warn(`❌ Attempt ${attempt} failed:`, error.message);
                if (attempt === maxRetries) {
                    console.error(`💥 All ${maxRetries} attempts failed for live quote`);
                    return null;
                }
            }
        }
        return null;
    }

    // Retry wrapper for candles
    static async getFinnhubCandlesWithRetry(symbol, timeframe, apiKey, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries}: Getting candles for ${symbol}`);
                const result = await this.getFinnhubCandles(symbol, timeframe, apiKey);
                if (result && result.length > 0) return result;

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            } catch (error) {
                console.warn(`❌ Attempt ${attempt} failed:`, error.message);
                if (attempt === maxRetries) {
                    console.error(`💥 All ${maxRetries} attempts failed for candles`);
                    return null;
                }
            }
        }
        return null;
    }

    // Retry wrapper for news
    static async getFinnhubNewsWithRetry(symbol, apiKey, maxRetries = 2) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Attempt ${attempt}/${maxRetries}: Getting news for ${symbol}`);
                const result = await this.getFinnhubNews(symbol, apiKey);
                if (result) return result;

                if (attempt < maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`⏳ Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            } catch (error) {
                console.warn(`❌ Attempt ${attempt} failed:`, error.message);
                if (attempt === maxRetries) {
                    console.error(`💥 All ${maxRetries} attempts failed for news`);
                    return null;
                }
            }
        }
        return null;
    }

    // Get current live price from Finnhub (with timeout)
    static async getFinnhubLiveQuote(symbol, apiKey) {
        try {
            const finnhubSymbol = this.formatSymbolForFinnhub(symbol);
            const url = `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${apiKey}`;

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'QuantumTrader/2.0'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Validate response data
            if (!data || typeof data.c !== 'number' || data.c <= 0) {
                throw new Error('Invalid price data received from Finnhub');
            }

            console.log(`✅ Live ${symbol} price: ${data.c}`);
            return {
                symbol: symbol,
                price: data.c,
                change: data.d || 0,
                changePercent: data.dp || 0,
                high: data.h || data.c,
                low: data.l || data.c,
                open: data.o || data.c,
                previousClose: data.pc || data.c,
                timestamp: Date.now()
            };

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`⏰ Finnhub quote timeout for ${symbol}`);
            } else {
                console.warn(`❌ Finnhub quote error for ${symbol}:`, error.message);
            }
            throw error; // Re-throw for retry mechanism
        }
    }

    // Get recent candles from Finnhub
    static async getFinnhubCandles(symbol, timeframe, apiKey) {
        try {
            const finnhubSymbol = this.formatSymbolForFinnhub(symbol);
            const resolution = this.convertTimeframeForFinnhub(timeframe);
            const to = Math.floor(Date.now() / 1000);
            const from = to - (7 * 24 * 60 * 60); // Last 7 days

            const url = `https://finnhub.io/api/v1/forex/candle?symbol=${finnhubSymbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'QuantumTrader/2.0'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Validate candle data
            if (!data || !data.c || !Array.isArray(data.c) || data.c.length === 0) {
                throw new Error('No candle data received from Finnhub');
            }

            const candles = [];
            for (let i = 0; i < data.c.length; i++) {
                // Validate each candle
                if (data.t[i] && data.o[i] && data.h[i] && data.l[i] && data.c[i]) {
                    candles.push({
                        timestamp: data.t[i] * 1000,
                        open: data.o[i],
                        high: data.h[i],
                        low: data.l[i],
                        close: data.c[i],
                        volume: data.v[i] || 1000
                    });
                }
            }

            if (candles.length === 0) {
                throw new Error('No valid candles after filtering');
            }

            console.log(`✅ Got ${candles.length} valid candles for ${symbol}`);
            return candles.sort((a, b) => a.timestamp - b.timestamp);

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`⏰ Finnhub candles timeout for ${symbol}`);
            } else {
                console.warn(`❌ Finnhub candles error for ${symbol}:`, error.message);
            }
            throw error; // Re-throw for retry mechanism
        }
    }

    // Get market news from Finnhub (with timeout and validation)
    static async getFinnhubNews(symbol, apiKey) {
        try {
            const url = `https://finnhub.io/api/v1/news?category=forex&token=${apiKey}`;

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'QuantumTrader/2.0'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const news = await response.json();

            // Validate news data
            if (!news || !Array.isArray(news)) {
                throw new Error('Invalid news data received from Finnhub');
            }

            const relevantNews = this.filterRelevantNews(news, symbol);
            if (relevantNews && relevantNews.length > 0) {
                console.log(`✅ Found ${relevantNews.length} relevant news items for ${symbol}`);
                return relevantNews;
            } else {
                console.log(`ℹ️ No relevant news found for ${symbol}`);
                return null; // This is OK, not an error
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`⏰ Finnhub news timeout for ${symbol}`);
            } else {
                console.warn(`❌ Finnhub news error for ${symbol}:`, error.message);
            }
            throw error; // Re-throw for retry mechanism
        }
    }

    // Create comprehensive market context for Gemini AI
    static createMarketContext(symbol, liveQuote, recentCandles, marketNews) {
        const context = {
            symbol: symbol,
            timestamp: new Date().toISOString(),

            // Live market state
            live: liveQuote,

            // Technical analysis from recent candles
            technical: null,

            // Market sentiment from news
            sentiment: {
                news: marketNews,
                newsCount: marketNews?.length || 0
            }
        };

        // Calculate technical indicators if we have candle data
        if (recentCandles && recentCandles.length >= 20) {
            context.technical = this.calculateTechnicalIndicators(recentCandles);
            console.log(`✅ Calculated technical indicators for ${symbol}`);
        }

        // Add market momentum analysis
        if (liveQuote && recentCandles && recentCandles.length > 0) {
            context.momentum = this.calculateMarketMomentum(liveQuote, recentCandles);
        }

        return context;
    }

    static processAlphaVantageData(data) {
        try {
            const timeSeries = data['Time Series FX (1min)'] || data['Time Series FX (5min)'] || data['Time Series FX (15min)'];
            if (!timeSeries) return null;

            const prices = [];
            const volumes = [];
            const highs = [];
            const lows = [];

            Object.values(timeSeries).forEach(candle => {
                prices.push(parseFloat(candle['4. close']));
                highs.push(parseFloat(candle['2. high']));
                lows.push(parseFloat(candle['3. low']));
                volumes.push(parseFloat(candle['5. volume'] || 1000)); // Forex doesn't have volume
            });

            return this.calculateIndicators(prices, volumes, highs, lows);
        } catch (error) {
            console.error('Error processing Alpha Vantage data:', error);
            return null;
        }
    }

    static processTwelveData(data) {
        try {
            if (!data.values) return null;

            const prices = [];
            const volumes = [];
            const highs = [];
            const lows = [];

            data.values.forEach(candle => {
                prices.push(parseFloat(candle.close));
                highs.push(parseFloat(candle.high));
                lows.push(parseFloat(candle.low));
                volumes.push(parseFloat(candle.volume || 1000));
            });

            return this.calculateIndicators(prices, volumes, highs, lows);
        } catch (error) {
            console.error('Error processing Twelve Data:', error);
            return null;
        }
    }

    static processPolygonData(data) {
        try {
            if (!data.results) return null;

            const prices = [];
            const volumes = [];
            const highs = [];
            const lows = [];

            data.results.forEach(candle => {
                prices.push(candle.c); // close
                highs.push(candle.h);  // high
                lows.push(candle.l);   // low
                volumes.push(candle.v || 1000); // volume
            });

            return this.calculateIndicators(prices, volumes, highs, lows);
        } catch (error) {
            console.error('Error processing Polygon data:', error);
            return null;
        }
    }

    static calculateIndicators(prices, volumes, highs, lows) {
        if (prices.length < 20) return null;

        return {
            rsi: this.calculateRSI(prices, 14),
            macd: this.calculateMACD(prices),
            bollinger: this.calculateBollingerBands(prices, 20, 2),
            atr: this.calculateATR(highs, lows, prices, 14),
            volumeProfile: this.analyzeVolume(volumes),
            priceVelocity: this.calculateVelocity(prices),
            volatilityPercentile: this.calculateVolatilityPercentile(prices)
        };
    }

    static processMarketData(rawData) {
        try {
            // Calculate quantitative indicators
            const prices = rawData.c || []; // closing prices
            const volumes = rawData.v || []; // volumes
            const highs = rawData.h || []; // highs
            const lows = rawData.l || []; // lows

            if (prices.length < 20) return null;

            return {
                rsi: this.calculateRSI(prices, 14),
                macd: this.calculateMACD(prices),
                bollinger: this.calculateBollingerBands(prices, 20, 2),
                atr: this.calculateATR(highs, lows, prices, 14),
                volumeProfile: this.analyzeVolume(volumes),
                priceVelocity: this.calculateVelocity(prices),
                volatilityPercentile: this.calculateVolatilityPercentile(prices)
            };
        } catch (error) {
            console.error('Error processing market data:', error);
            return null;
        }
    }

    static calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;

        let gains = 0, losses = 0;

        // Calculate initial average gain/loss
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        // Calculate RSI for latest period
        for (let i = period + 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;

            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
        }

        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    static calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
        if (prices.length < slow) return null;

        const emaFast = this.calculateEMA(prices, fast);
        const emaSlow = this.calculateEMA(prices, slow);
        const macdLine = emaFast - emaSlow;

        return {
            macd: macdLine,
            signal: this.calculateEMA([macdLine], signal),
            histogram: macdLine - this.calculateEMA([macdLine], signal)
        };
    }

    static calculateEMA(prices, period) {
        if (prices.length === 0) return 0;

        const multiplier = 2 / (period + 1);
        let ema = prices[0];

        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }

        return ema;
    }

    static calculateBollingerBands(prices, period = 20, stdDev = 2) {
        if (prices.length < period) return null;

        const recentPrices = prices.slice(-period);
        const sma = recentPrices.reduce((a, b) => a + b) / period;

        const variance = recentPrices.reduce((acc, price) => {
            return acc + Math.pow(price - sma, 2);
        }, 0) / period;

        const standardDeviation = Math.sqrt(variance);

        return {
            upper: sma + (standardDeviation * stdDev),
            middle: sma,
            lower: sma - (standardDeviation * stdDev),
            position: (prices[prices.length - 1] - (sma - standardDeviation * stdDev)) / (2 * standardDeviation * stdDev)
        };
    }

    static calculateATR(highs, lows, closes, period = 14) {
        if (highs.length < period + 1) return null;

        const trueRanges = [];
        for (let i = 1; i < highs.length; i++) {
            const tr = Math.max(
                highs[i] - lows[i],
                Math.abs(highs[i] - closes[i - 1]),
                Math.abs(lows[i] - closes[i - 1])
            );
            trueRanges.push(tr);
        }

        return trueRanges.slice(-period).reduce((a, b) => a + b) / period;
    }

    static analyzeVolume(volumes) {
        if (volumes.length < 20) return null;

        const avgVolume = volumes.slice(-20).reduce((a, b) => a + b) / 20;
        const currentVolume = volumes[volumes.length - 1];

        return {
            current: currentVolume,
            average: avgVolume,
            ratio: currentVolume / avgVolume,
            trend: currentVolume > avgVolume ? 'above' : 'below'
        };
    }

    static calculateVelocity(prices) {
        if (prices.length < 5) return null;

        const recent = prices.slice(-5);
        const changes = [];

        for (let i = 1; i < recent.length; i++) {
            changes.push((recent[i] - recent[i - 1]) / recent[i - 1]);
        }

        return changes.reduce((a, b) => a + b) / changes.length;
    }

    static calculateVolatilityPercentile(prices, lookback = 100) {
        if (prices.length < lookback) return null;

        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push(Math.abs((prices[i] - prices[i - 1]) / prices[i - 1]));
        }

        const currentVol = returns.slice(-20).reduce((a, b) => a + b) / 20;
        const historicalVols = [];

        for (let i = 20; i < returns.length - 20; i++) {
            const vol = returns.slice(i, i + 20).reduce((a, b) => a + b) / 20;
            historicalVols.push(vol);
        }

        historicalVols.sort((a, b) => a - b);
        const percentile = historicalVols.filter(vol => vol < currentVol).length / historicalVols.length;

        return percentile * 100;
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
// ENHANCED UI MANAGER
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

    static showLoading(show = true, stage = 'analysis') {
        if (show) {
            DOM.loadingSpinner.classList.remove('hidden');
            DOM.analyzeBtn.disabled = true;

            // Dynamic loading messages based on stage
            const messages = {
                'capture': '🔍 Verifying Olymp Trade Platform...',
                'market-data': '📊 Fetching Live Market Data...',
                'ai-analysis': '🤖 AI Analysis in Progress...',
                'analysis': '🔮 Quantum Analysis...',
                'complete': '✅ Analysis Complete'
            };

            DOM.analyzeBtn.textContent = messages[stage] || messages.analysis;
        } else {
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
        if (decisionLower.includes('sell') || decisionLower.includes('down')) {
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
            }
            if (analysis.liveData.dayHigh && analysis.liveData.dayLow) {
                html += `<p><strong>Day Range:</strong> ${analysis.liveData.dayLow} - ${analysis.liveData.dayHigh}</p>`;
            }
            if (analysis.liveData.momentum) {
                const momentumColor = analysis.liveData.momentum === 'BULLISH' ? '#00ff88' : '#ff3366';
                html += `<p><strong>Momentum:</strong> <span style="color: ${momentumColor}">${analysis.liveData.momentum}</span></p>`;
            }
            html += '</div>';
        }

        // Technical indicators
        if (analysis.indicators) {
            html += '<div class="indicators">';
            html += '<h3>📈 Technical Indicators</h3>';
            Object.entries(analysis.indicators).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    html += `<p><strong>${key.toUpperCase()}:</strong> ${value}</p>`;
                }
            });
            html += '</div>';
        }

        // News sentiment
        if (analysis.newsSentiment && analysis.newsSentiment.newsCount > 0) {
            html += '<div class="news-sentiment">';
            html += '<h3>📰 Market News</h3>';
            html += `<p><strong>Relevant News:</strong> ${analysis.newsSentiment.newsCount} items</p>`;
            if (analysis.newsSentiment.latestNews) {
                analysis.newsSentiment.latestNews.forEach((news, index) => {
                    html += `<p><strong>${index + 1}.</strong> ${news.headline}</p>`;
                });
            }
            html += '</div>';
        }

        enhancedSection.innerHTML = html;
    }

    static updateLoadingProgress(progress, message) {
        // Update loading progress if needed
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        if (message) {
            DOM.analyzeBtn.textContent = message;
        }
    }
}

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
                config.timeframe,
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
                config.timeframe,
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
            timeframe: DOM.timeframe.value || config.timeframe,
            analysisMode: DOM.analysisMode.value || config.analysisMode,
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

            console.log(`🔴 Fetching live data for ${symbol} on ${config.timeframe} timeframe`);

            // Get comprehensive live market data
            const liveMarketData = await LiveMarketDataAPI.getLiveOlympTradeData(
                symbol,
                config.timeframe,
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

            // Common forex pairs
            const forexPairs = ['eurusd', 'gbpusd', 'usdjpy', 'audusd', 'usdcad', 'usdchf', 'nzdusd'];

            for (const pair of forexPairs) {
                if (url.includes(pair)) {
                    return pair.toUpperCase();
                }
            }

            // Default to EURUSD if no symbol detected
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

        prompt += `\n\n⚡ INSTANT DECISION REQUIRED: Analyze ${config.captureMode} and provide immediate BUY/SELL/NO TRADE decision with confidence level.`;

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
        analysis.detectedAsset = detectedAsset;
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
    DOM.timeframe.value = config.timeframe;
    DOM.analysisMode.value = config.analysisMode;
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
[DOM.timeframe, DOM.analysisMode, DOM.captureMode].forEach(element => {
    element.addEventListener('change', async () => {
        const config = {
            timeframe: DOM.timeframe.value,
            analysisMode: DOM.analysisMode.value,
            captureMode: DOM.captureMode.value
        };
        await StorageManager.saveAnalysisConfig(config);
    });
});

// ============================================================================
// EVENT LISTENER - Quantum Analysis Button
// ============================================================================
DOM.analyzeBtn.addEventListener('click', async () => {
    await QuantumAnalysisOrchestrator.performAnalysis();
});