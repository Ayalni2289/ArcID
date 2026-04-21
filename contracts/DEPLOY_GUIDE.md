# ArcNameService — Remix Deploy Guide

MetaMask + Remix kullanarak kontratı deploy et. Private key girmene gerek yok.

---

## Adım 1 — MetaMask'a Arc Testnet Ekle

MetaMask → Settings → Networks → Add Network → Manual:

| Alan | Değer |
|---|---|
| Network Name | Arc Testnet |
| RPC URL | https://rpc.testnet.arc.network |
| Chain ID | 5042002 |
| Currency Symbol | USDC |
| Block Explorer | https://testnet.arcscan.app |

---

## Adım 2 — Remix'i Aç

→ https://remix.ethereum.org

---

## Adım 3 — Kontratı Yükle

1. Sol panelde **File Explorer** → "contracts" klasörü oluştur
2. `ArcNameService.sol` dosyasını içine yapıştır

---

## Adım 4 — Compile Et

1. Sol panelde **Solidity Compiler** sekmesi (⚙️)
2. Compiler version: **0.8.24**
3. **Compile ArcNameService.sol** butonuna bas
4. ✅ Yeşil tik görünmeli

---

## Adım 5 — Deploy Et

1. Sol panelde **Deploy & Run Transactions** sekmesi (▶️)
2. Environment: **Injected Provider - MetaMask**
3. MetaMask açılır → Arc Testnet seçili olduğunu kontrol et
4. Contract: **ArcNameService** seçili olmalı
5. **Deploy** butonuna bas
6. MetaMask'ta işlemi onayla

---

## Adım 6 — Kontrat Adresini Al

Deploy sonrası sol altta "Deployed Contracts" altında kontrat adresi çıkar:

```
ArcNameService at 0x________________________
```

Bu adresi kopyala → `lib/arcChain.ts` dosyasında güncelle:

```ts
export const ANS_CONTRACT_ADDRESS = "0xBURAYA_YAPISTIR" as const;
```

---

## Kontrat Özeti

- Her register tx'i **doğrudan** `0xd4806bdFD5b651AcD3f930717ce2c1c11b246Aa6` adresine gider
- `withdraw()` fonksiyonu yok — fee anında treasury'e geçer
- Fiyatlar: 1-3 harf = $20/yıl · 4 harf = $5/yıl · 5+ harf = $1/yıl
- TLD'ler: `.arc` `.agent` `.usdc`
