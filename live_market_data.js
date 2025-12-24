// ============================================================================
// LIVE MARKET DATA INTEGRATION - REAL-TIME FOR OLYMP TRADE
// ============================================================================

class LiveMarketDataAPI {

    // Main function to get live market data that matches Olymp Trade movements
    static async getLiveOlympTradeData(symbol, timeframe, apiKey) {
        try {
            if (!apiKey) return null;

            console.log(`🔴 LIVE: Getting real-time data for ${symbol} (${timeframe})`);

            // Get live quote + recent candles for complete analysis
            const [liveQuote, recentCandles, marketNews] = await Promise.all([
                this.getLiveQuote(symbol, apiKey),
                this.getRecentCandles(symbol, timeframe, apiKey),
                this.getMarketNews(symbol, apiKey)
            ]);

            // Combine all data sources for comprehensive analysis
            return this.createComprehensiveMarketContext(symbol, liveQuote, recentCandles, marketNews);

        } catch (error) {
            console.error('Live market data error:', error);
            return null;
        }
    }

    // Get current live price (what's moving the chart RIGHT NOW)
    static async getLiveQuote(symbol, apiKey) {
        const liveSources = [
            {
                name: 'Finnhub Real-Time',
                url: `https://finnhub.io/api/v1/quote?symbol=${this.formatSymbolForFinnhub(symbol)}&token=${apiKey}`,
                process: this.processFinnhubQuote
            },
            {
                name: 'Alpha Vantage Global Quote',
                url: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
                process: this.processAlphaVantageQuote
            },
            {
                name: 'Twelve Data Real-Time Price',
                url: `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`,
                process: this.processTwelveDataQuote
            }
        ];

        for (const source of liveSources) {
            try {
                const response = await fetch(source.url);
                if (response.ok) {
                    const data = await response.json();
                    const quote = source.process.call(this, data);
                    if (quote) {
                        console.log(`✅ Live quote from ${source.name}: ${quote.price}`);
                        return quote;
                    }
                }
            } catch (error) {
                console.warn(`❌ ${source.name} failed:`, error);
            }
        }
        return null;
    }

    // Get recent candles for technical analysis
    static async getRecentCandles(symbol, timeframe, apiKey) {
        const candleSources = [
            {
                name: 'Finnhub Forex Candles',
                url: `https://finnhub.io/api/v1/forex/candle?symbol=${this.formatSymbolForFinnhub(symbol)}&resolution=${this.convertTimeframeForFinnhub(timeframe)}&from=${Math.floor(Date.now() / 1000) - 86400 * 7}&to=${Math.floor(Date.now() / 1000)}&token=${apiKey}`,
                process: this.processFinnhubCandles
            },
            {
                name: 'Alpha Vantage FX Intraday',
                url: `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=${symbol.slice(0, 3)}&to_symbol=${symbol.slice(3, 6)}&interval=${this.convertTimeframeForAlphaVantage(timeframe)}&apikey=${apiKey}&outputsize=compact`,
                process: this.processAlphaVantageCandles
            },
            {
                name: 'Twelve Data Time Series',
                url: `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${timeframe}&outputsize=100&apikey=${apiKey}`,
                process: this.processTwelveDataCandles
            }
        ];

        for (const source of candleSources) {
            try {
                const response = await fetch(source.url);
                if (response.ok) {
                    const data = await response.json();
                    const candles = source.process.call(this, data);
                    if (candles && candles.length > 20) {
                        console.log(`✅ Candles from ${source.name}: ${candles.length} candles`);
                        return candles;
                    }
                }
            } catch (error) {
                console.warn(`❌ ${source.name} failed:`, error);
            }
        }
        return null;
    }

    // Get market news that affects price movements
    static async getMarketNews(symbol, apiKey) {
        try {
            // Get forex/market news that could be moving the price
            const newsUrl = `https://finnhub.io/api/v1/news?category=forex&token=${apiKey}`;
            const response = await fetch(newsUrl);

            if (response.ok) {
                const news = await response.json();
                return this.filterRelevantNews(news, symbol);
            }
        } catch (error) {
            console.warn('News API failed:', error);
        }
        return null;
    }

    // Create comprehensive market context for Gemini AI
    static createComprehensiveMarketContext(symbol, liveQuote, recentCandles, marketNews) {
        const context = {
            symbol: symbol,
            timestamp: new Date().toISOString(),

            // Live market state
            live: {
                price: liveQuote?.price,
                change: liveQuote?.change,
                changePercent: liveQuote?.changePercent,
                volume: liveQuote?.volume,
                bid: liveQuote?.bid,
                ask: liveQuote?.ask,
                spread: liveQuote?.spread
            },

            // Technical analysis from recent candles
            technical: null,

            // Market sentiment from news
            sentiment: {
                news: marketNews,
                newsCount: marketNews?.length || 0,
                lastUpdate: Date.now()
            }
        };

        // Calculate technical indicators if we have candle data
        if (recentCandles && recentCandles.length >= 20) {
            context.technical = this.calculateTechnicalIndicators(recentCandles);
        }

        // Add market momentum analysis
        if (liveQuote && recentCandles) {
            context.momentum = this.calculateMarketMomentum(liveQuote, recentCandles);
        }

        return context;
    }

    // Calculate all technical indicators
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
            volatility: this.calculateVolatility(closes),
            trend: this.determineTrend(closes)
        };
    }

    // Calculate market momentum
    static calculateMarketMomentum(liveQuote, recentCandles) {
        const lastCandle = recentCandles[recentCandles.length - 1];
        const prevCandle = recentCandles[recentCandles.length - 2];

        return {
            priceVelocity: (liveQuote.price - lastCandle.close) / lastCandle.close,
            candleMomentum: (lastCandle.close - prevCandle.close) / prevCandle.close,
            volumeRatio: (lastCandle.volume || 1000) / (prevCandle.volume || 1000),
            gapFromOpen: (liveQuote.price - lastCandle.open) / lastCandle.open,
            direction: liveQuote.price > lastCandle.close ? 'BULLISH' : 'BEARISH'
        };
    }

    // Data processing functions for different providers
    static processFinnhubQuote(data) {
        if (!data.c) return null;
        return {
            price: data.c,      // current price
            change: data.d,     // change
            changePercent: data.dp, // change percent
            high: data.h,       // day high
            low: data.l,        // day low
            open: data.o,       // day open
            previousClose: data.pc,
            timestamp: data.t
        };
    }

    static processAlphaVantageQuote(data) {
        const quote = data['Global Quote'];
        if (!quote) return null;

        return {
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            open: parseFloat(quote['02. open']),
            previousClose: parseFloat(quote['08. previous close']),
            volume: parseInt(quote['06. volume'])
        };
    }

    static processTwelveDataQuote(data) {
        if (!data.price) return null;
        return {
            price: parseFloat(data.price),
            timestamp: Date.now()
        };
    }

    static processFinnhubCandles(data) {
        if (!data.c || data.c.length === 0) return null;

        const candles = [];
        for (let i = 0; i < data.c.length; i++) {
            candles.push({
                timestamp: data.t[i] * 1000,
                open: data.o[i],
                high: data.h[i],
                low: data.l[i],
                close: data.c[i],
                volume: data.v[i] || 1000
            });
        }
        return candles.sort((a, b) => a.timestamp - b.timestamp);
    }

    static processAlphaVantageCandles(data) {
        const timeSeries = data['Time Series FX (1min)'] || data['Time Series FX (5min)'] || data['Time Series FX (15min)'] || data['Time Series FX (30min)'] || data['Time Series FX (60min)'];
        if (!timeSeries) return null;

        const candles = [];
        Object.entries(timeSeries).forEach(([timestamp, values]) => {
            candles.push({
                timestamp: new Date(timestamp).getTime(),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseFloat(values['5. volume'] || 1000)
            });
        });

        return candles.sort((a, b) => a.timestamp - b.timestamp);
    }

    static processTwelveDataCandles(data) {
        if (!data.values) return null;

        const candles = [];
        data.values.forEach(candle => {
            candles.push({
                timestamp: new Date(candle.datetime).getTime(),
                open: parseFloat(candle.open),
                high: parseFloat(candle.high),
                low: parseFloat(candle.low),
                close: parseFloat(candle.close),
                volume: parseFloat(candle.volume || 1000)
            });
        });

        return candles.sort((a, b) => a.timestamp - b.timestamp);
    }

    // Helper functions
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

    static convertTimeframeForAlphaVantage(timeframe) {
        const mapping = {
            '1m': '1min',
            '5m': '5min',
            '15m': '15min',
            '30m': '30min',
            '1h': '60min'
        };
        return mapping[timeframe] || '60min';
    }

    static filterRelevantNews(news, symbol) {
        if (!news || !Array.isArray(news)) return null;

        const currency1 = symbol.slice(0, 3);
        const currency2 = symbol.slice(3, 6);

        return news.filter(item =>
            item.summary?.toLowerCase().includes(currency1.toLowerCase()) ||
            item.summary?.toLowerCase().includes(currency2.toLowerCase()) ||
            item.headline?.toLowerCase().includes('forex') ||
            item.headline?.toLowerCase().includes('fed') ||
            item.headline?.toLowerCase().includes('ecb')
        ).slice(0, 5); // Top 5 relevant news items
    }

    // Technical indicator calculations (simplified versions)
    static calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;

        let gains = 0, losses = 0;
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;

        return 100 - (100 / (1 + rs));
    }

    static calculateSMA(prices, period) {
        if (prices.length < period) return null;
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }

    static calculateEMA(prices, period) {
        if (prices.length < period) return null;

        const multiplier = 2 / (period + 1);
        let ema = prices[0];

        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }

        return ema;
    }

    static calculateMACD(prices) {
        const ema12 = this.calculateEMA(prices, 12);
        const ema26 = this.calculateEMA(prices, 26);

        if (!ema12 || !ema26) return null;

        return {
            macd: ema12 - ema26,
            signal: this.calculateEMA([ema12 - ema26], 9),
            histogram: (ema12 - ema26) - this.calculateEMA([ema12 - ema26], 9)
        };
    }

    static calculateBollingerBands(prices, period = 20, stdDev = 2) {
        if (prices.length < period) return null;

        const sma = this.calculateSMA(prices, period);
        const variance = prices.slice(-period).reduce((acc, price) => {
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

    static calculateVolatility(prices) {
        if (prices.length < 2) return null;

        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }

        const mean = returns.reduce((a, b) => a + b) / returns.length;
        const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - mean, 2), 0) / returns.length;

        return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
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

// Export for use in main popup.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveMarketDataAPI;
}