# Deploy WhatsApp Birthday Bot ke Railway

Panduan lengkap deploy Birthday Bot ke Railway.app (Free Tier)

## Persiapan

### 1. Push Code ke GitHub

```bash
# Init git (jika belum)
git init

# Add semua file
git add .

# Commit
git commit -m "Initial commit - Birthday Bot"

# Add remote repository
git remote add origin https://github.com/username/bday-bot.git

# Push ke GitHub
git push -u origin main
```

## Deploy ke Railway

### 1. Buat Akun Railway

1. Buka https://railway.app
2. Sign up dengan GitHub account
3. Verify email kamu

### 2. Create New Project

1. Klik **"New Project"**
2. Pilih **"Deploy from GitHub repo"**
3. Authorize Railway untuk akses GitHub
4. Pilih repository **bday-bot**
5. Klik **"Deploy Now"**

### 3. Konfigurasi Environment Variables (OPSIONAL)

Railway akan auto-detect dan deploy. Tidak ada environment variable yang wajib untuk saat ini.

### 4. Check Deployment

1. Tunggu build selesai (2-3 menit)
2. Klik tab **"Deployments"** untuk lihat logs
3. Pastikan ada log: `✅ Bot and Web Server started successfully!`

### 5. Setup Custom Domain (Opsional)

1. Klik tab **"Settings"**
2. Scroll ke **"Domains"**
3. Klik **"Generate Domain"** untuk dapat domain gratis Railway
4. Atau add custom domain kamu sendiri

### 6. Akses Web Dashboard

1. Copy domain yang digenerate Railway (contoh: `bday-bot-production.up.railway.app`)
2. Buka di browser
3. Kamu akan lihat dashboard

### 7. Scan QR Code WhatsApp

1. Buka dashboard Railway
2. Lihat QR Code di halaman dashboard
3. Scan dengan WhatsApp:
   - Buka WhatsApp di HP
   - Tap titik tiga > Linked Devices
   - Tap "Link a Device"
   - Scan QR code dari dashboard

## Monitoring

### Lihat Logs Real-time

1. Di Railway dashboard, klik tab **"Deployments"**
2. Klik deployment yang aktif
3. Lihat logs real-time

### Akses Dashboard

Buka domain Railway kamu untuk:
- Lihat stats birthdays
- Manage birthdays (Add/Edit/Delete)
- Control bot (Reload, Get Groups, Test)
- Monitor logs

## Troubleshooting

### Bot Tidak Connect

**Problem:** Bot tidak bisa connect ke WhatsApp

**Solution:**
1. Check logs di Railway
2. Pastikan tidak ada error
3. Scan ulang QR code
4. Restart deployment

### Web Dashboard Error 502

**Problem:** Dashboard tidak bisa diakses

**Solution:**
1. Check logs, pastikan server running di port yang benar
2. Railway auto-assign PORT, kode sudah handle ini
3. Restart deployment jika perlu

### Restart Deployment

1. Klik tab **"Deployments"**
2. Klik titik tiga di deployment aktif
3. Pilih **"Restart"**

## Free Tier Limits

Railway free tier memberikan:
- **$5 credit per bulan**
- ~500 jam runtime
- Cukup untuk bot running 24/7

**Tips hemat credit:**
- Bot ini lightweight, pakai ~$3-4/bulan
- Monitor usage di Railway dashboard
- Upgrade ke Hobby plan ($5/bulan) jika perlu lebih

## Maintenance

### Update Code

```bash
# Buat perubahan di code
# Commit changes
git add .
git commit -m "Update: description"

# Push ke GitHub
git push

# Railway auto-deploy perubahan!
```

### Backup Data

**Important:** Backup `birthdays.json` secara berkala!

1. Download dari Railway:
   - Method 1: Via API endpoint (buat endpoint download)
   - Method 2: Clone volume Railway
   - Method 3: Backup manual via dashboard

2. Simpan di Google Drive / Dropbox

## File Penting

- `start.js` - Script utama untuk Railway (run bot + web server)
- `railway.json` - Konfigurasi Railway
- `birthdays.json` - Database birthdays (auto-created)
- `auth_session/` - WhatsApp session (auto-created)

## Support

Jika ada masalah:
1. Check Railway logs
2. Check web dashboard logs
3. Restart deployment
4. Re-scan QR code WhatsApp

## Keamanan

⚠️ **PENTING:**
- Jangan share domain dashboard ke publik
- Data birthdays tersimpan di Railway volume
- WhatsApp session tersimpan encrypted
- Untuk production, tambahkan authentication

---

✅ **Railway deployment siap!** Bot akan jalan 24/7 dan dashboard bisa diakses dari mana aja.
