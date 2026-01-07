# Quick Start - Deploy ke Railway (5 Menit)

## Step 1: Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/bday-bot.git
git push -u origin main
```

## Step 2: Deploy ke Railway

1. Buka https://railway.app
2. Sign up dengan GitHub
3. Klik **New Project** → **Deploy from GitHub repo**
4. Pilih repository `bday-bot`
5. Klik **Deploy Now**

## Step 3: Tunggu Build Selesai

- Build akan selesai dalam 2-3 menit
- Check logs untuk pastikan sukses

## Step 4: Generate Domain

1. Klik tab **Settings**
2. Scroll ke **Domains**
3. Klik **Generate Domain**
4. Copy domain (contoh: `bday-bot-production.up.railway.app`)

## Step 5: Akses Dashboard & Scan QR

1. Buka domain di browser
2. Lihat QR Code di dashboard
3. Scan dengan WhatsApp (HP → Settings → Linked Devices)

## ✅ Done!

Bot sekarang running 24/7 di Railway dan bisa diakses dari mana aja!

**Dashboard URL:** `https://YOUR-DOMAIN.up.railway.app`

---

Untuk panduan lengkap, lihat **RAILWAY-DEPLOY.md**
