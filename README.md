# QuantumTrader: RWA Tokenization Dashboard (PS-004)

QuantumTrader has been pivoted into a **Real-World Asset (RWA) Tokenization Dashboard**.

It is a **Manifest V3 Chrome extension** (plain HTML/CSS/JS) that interacts with:
- an **on-chain registry** (`AssetRegistry.sol`),
- an **ERC-1155 fractional token** (`RealWorldAssetToken.sol`), and
- a **simple marketplace** for buying/selling fractions (`Marketplace.sol`).

Gemini is retained, but repurposed to produce **structured valuation/audit output** prior to on-chain submission.

> Status: Reference implementation (not audited). Intended for local/dev or as a starting point.

## Repo layout
- `popup.html`, `popup.js`, `styles.css` — extension UI + logic
- `manifest.json` — extension permissions / CSP
- `vendor/ethers.umd.min.js` — local ethers bundle (MV3-friendly, no remote scripts)
- `contracts/` — Hardhat project + Solidity contracts

## Protocol flow (happy path)
1. **Deploy contracts** (Hardhat)
2. **Owner** authorizes an auditor: `AssetRegistry.setAuditor(auditor, true)`
3. **Issuer** registers a new asset: `registerAsset(detailsURI)`
4. **Auditor** verifies + tokenizes it: `verifyAndTokenizeAsset(assetId, appraisedValue, totalFractions, tokenUri)`
5. **Market owner** sets buy/sell prices
6. **Users** buy fractions with ETH (and optionally USDC)

## Local development (recommended)
### 1) Start a local chain
```powershell
cd contracts
npm install
npx hardhat node
```

### 2) Deploy
In another terminal:
```powershell
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
Copy the printed addresses.

### 3) Load the extension
- Open `chrome://extensions/`
- Enable **Developer mode**
- Click **Load unpacked**
- Select the repo root folder (the one containing `manifest.json`)

### 4) Configure in the popup
- RPC URL: `http://127.0.0.1:8545`
- Paste contract addresses (Registry/Token/Marketplace)
- (Dev only) paste Hardhat account #0 private key, click **Connect**
- Paste the wallet address into **Auditor address**, click **Set Auditor**
- Register an asset using a `detailsURI`
- (Optional) Run Gemini valuation and submit **Verify & Tokenize**
- Set market prices
- Buy fractions

## Gemini valuation protocol
See `PS004_VALUATION_PROTOCOL.md` for the required JSON schema and recommended units.

## Security & risk notes
- The contracts are **not audited**.
- The popup supports a **dev private key** for local testing; do not use real keys.
- Treat Gemini output as advisory; the auditor role is the control point.
