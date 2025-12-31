# QuantumTrader — PS-004 Quickstart (RWA Tokenization)

This quickstart gets you from zero to a working **local** RWA tokenization demo.

## Prerequisites
- Node.js + npm
- Google Chrome / Chromium
- (Optional) Gemini API key from Google AI Studio

## 1) Run a local Hardhat chain
```powershell
cd contracts
npm install
npx hardhat node
```

## 2) Deploy contracts
Open a second terminal:
```powershell
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
Copy the printed addresses:
- `RealWorldAssetToken`
- `AssetRegistry`
- `Marketplace`

## 3) Load the extension
1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the repo root folder (contains `manifest.json`)

## 4) Use the popup dashboard
1. Set **RPC URL** to: `http://127.0.0.1:8545`
2. Paste contract addresses
3. Paste Hardhat account #0 private key into **Wallet Private Key (dev only)**
4. Click **Connect**
5. Paste your wallet address into **Auditor address** → click **Set Auditor**
6. Register an asset with a `detailsURI`
7. (Optional) Paste asset docs text/JSON and run **AI valuation**
8. Select the asset → click **Verify & Tokenize** (auditor)
9. Set prices → click **Set Market Prices** (owner)
10. Buy fractions with ETH (or USDC if configured)

## Notes
- This is a reference implementation and is not production-hardened.
- The dashboard uses a local `vendor/ethers.umd.min.js` bundle to stay MV3-compliant.
