# WhatsApp Birthday Bot with Web Dashboard

Bot WhatsApp otomatis untuk mengirim ucapan selamat ulang tahun ke grup WhatsApp. Dilengkapi dengan web dashboard untuk management, monitoring, dan control.

## Features

### Bot Features
- ✅ Auto-send ucapan ulang tahun ke grup WhatsApp
- ✅ Scheduled check setiap hari jam 08:00 WIB
- ✅ Auto-check saat bot start (cek ulang tahun hari ini)
- ✅ Prevent duplicate messages (max 1x per hari)
- ✅ Auto-reconnect jika koneksi terputus
- ✅ Calculate age otomatis dari tanggal lahir
- ✅ Comprehensive logging

### Web Dashboard Features
- 📊 Statistics dashboard (total birthdays, bulan ini, status bot)
- 📝 Birthday management (Add, Edit, Delete via UI)
- 🎛️ Bot control (Reload, Get Groups, Test Message, Clear Logs)
- 📱 QR Code scanner untuk WhatsApp login
- 📜 Real-time logs monitoring
- 🔄 Auto-refresh logs setiap 10 detik

## Quick Start - Deploy ke Railway (5 Menit)

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR-USERNAME/bday-bot.git
git push -u origin main
```

### 2. Deploy ke Railway

1. Buka https://railway.app
2. Sign up dengan GitHub (free $5 credit)
3. Klik **New Project** → **Deploy from GitHub repo**
4. Pilih repository `bday-bot`
5. Klik **Deploy Now**
6. Tunggu build selesai (2-3 menit)

### 3. Generate Domain & Akses Dashboard

1. Di Railway → **Settings** → **Domains**
2. Klik **Generate Domain**
3. Copy domain (contoh: `bday-bot-production.up.railway.app`)
4. Buka di browser

### 4. Scan QR Code WhatsApp

1. Dashboard akan show QR code
2. Scan dengan WhatsApp dari HP (Settings → Linked Devices)
3. Bot langsung aktif dan jalan 24/7!

📖 **Detail deployment guide:** Lihat [RAILWAY-DEPLOY.md](RAILWAY-DEPLOY.md)

## Setup Birthday Data

### Format birthdays.json

```json
[
  {
    "nama": "John Doe",
    "tanggal_lahir": "1995-01-15",
    "grup_id": "120363123456789012@g.us",
    "grup_nama": "FabrikGroup Team"
  }
]
```

**Field descriptions:**
- `nama`: Nama lengkap (string)
- `tanggal_lahir`: Format YYYY-MM-DD
- `grup_id`: WhatsApp group ID (dapatkan via dashboard "Get Groups" button)
- `grup_nama`: Nama grup untuk referensi

### Cara Mendapatkan Group ID

1. Buka web dashboard
2. Klik tombol **"Get Groups"**
3. Lihat console output atau logs
4. Copy group ID yang diinginkan

**Atau via command line:**

```bash
npm run groups
```

## Web Dashboard Usage

### Dashboard Access

Buka domain Railway di browser: `https://your-app.up.railway.app`

### Features

**📊 Stats Cards**
- Total Birthdays
- Birthdays bulan ini
- Bot Status
- Active Groups

**🎛️ Bot Controls**
- **Reload Bot**: Restart bot service
- **Clear Log**: Hapus birthday log
- **Test Message**: Test kirim pesan
- **Get Groups**: Fetch WhatsApp group IDs

**📝 Birthday Management**
- Klik **"Add Birthday"** untuk tambah data
- Klik **Edit** untuk update data
- Klik **Delete** untuk hapus data
- Data auto-save ke `birthdays.json`

**📜 Logs**
- Real-time logs dari bot
- Auto-refresh setiap 10 detik
- Monitor birthday sends dan errors

## Message Template

Pesan yang dikirim:

```
🎉🎂 Selamat Ulang Tahun [NAMA]! 🎂🎉

Hari ini kita bersyukur atas bertambahnya usia [NAMA]! 🎈
Semoga panjang umur, sehat selalu, dan semakin sukses dalam segala hal yang dilakukan.

Barakallahu fiikum! ✨🎁

- Team FabrikGroup 🤖
```

## Local Development

### Requirements

- Node.js v16+
- npm
- WhatsApp account

### Install Dependencies

```bash
npm install
```

### Run Bot Locally

```bash
# Run bot only
npm run bot

# Run web server only
npm run web

# Run both (bot + web)
npm start
```

### Access Local Dashboard

Bot: http://localhost:3000 (QR Code)
Dashboard: http://localhost:3001 (Web UI)

## File Structure

```
bday-bot/
├── bot.js                      # Main WhatsApp bot
├── server.js                   # Web dashboard server
├── start.js                    # Railway launcher (run bot + web)
├── get-groups.js               # Get WhatsApp group IDs
├── birthdays.json              # Birthday database
├── package.json                # Dependencies
├── railway.json                # Railway config
│
├── views/                      # Dashboard templates
│   ├── index.ejs               # Main dashboard page
│   └── partials/               # Header, sidebar, footer
│
├── public/                     # Static assets
│   ├── css/
│   │   └── dashboard.css       # Dashboard styles
│   └── js/
│       ├── dashboard.js        # Clock & sidebar toggle
│       └── main.js             # Dashboard functionality
│
├── auth_session/               # WhatsApp session (auto-generated)
├── birthday_log.txt            # Birthday send log (auto-generated)
│
├── README.md                   # This file
├── RAILWAY-DEPLOY.md           # Detailed Railway deployment guide
└── QUICKSTART-RAILWAY.md       # 5-minute deployment guide
```

## How It Works

### Birthday Check Flow

1. **Bot Start**: Check ulang tahun hari ini
2. **Scheduled Check**: Setiap hari jam 08:00 WIB:
   - Load `birthdays.json`
   - Check tanggal hari ini (timezone WIB)
   - Match dengan birthday data
   - Check log untuk prevent duplicate
   - Kirim pesan jika belum terkirim
   - Save log ke `birthday_log.txt`

### Duplicate Prevention

Bot log setiap pesan terkirim ke `birthday_log.txt`:

```
[2026-01-07 08:00:15 WIB] [01-07] - Ucapan terkirim untuk John Doe di grup FabrikGroup Team
```

Sebelum kirim, bot check log untuk prevent duplicate di hari yang sama.

### Auto-Reconnect

Jika koneksi WhatsApp terputus, bot auto-reconnect dalam 5 detik.

## Railway Free Tier

- **$5 credit/bulan** (cukup untuk bot 24/7)
- Bot ini pakai ~$3-4/bulan
- No credit card required untuk trial
- ~500 jam runtime/bulan

## Troubleshooting

### QR Code tidak muncul

1. Check Railway logs di dashboard
2. Restart deployment
3. Refresh browser

### Pesan tidak terkirim

1. Check logs di web dashboard
2. Pastikan format `tanggal_lahir` benar (YYYY-MM-DD)
3. Verify `grup_id` dengan "Get Groups" button
4. Check WhatsApp connection status

### Bot disconnect

1. Check logs untuk error messages
2. Klik "Reload Bot" di dashboard
3. Re-scan QR code jika perlu

### Web dashboard error

1. Check Railway deployment logs
2. Verify PORT environment variable
3. Restart deployment

## Development

### Edit Message Template

Edit `bot.js`, fungsi `generateBirthdayMessage()`:

```javascript
function generateBirthdayMessage(nama, age) {
  return `Your custom message here...`;
}
```

### Change Schedule Time

Edit `bot.js`, cron schedule:

```javascript
// Current: 08:00 WIB
cron.schedule('0 8 * * *', async () => {
  // ...
}, {
  timezone: "Asia/Jakarta"
});

// Example: 07:30 WIB
cron.schedule('30 7 * * *', async () => {
  // ...
}, {
  timezone: "Asia/Jakarta"
});
```

Cron format: `minute hour day month weekday`

## Security Notes

- `auth_session/` berisi WhatsApp credentials (auto-gitignored)
- Untuk production, tambahkan authentication ke web dashboard
- Jangan share domain dashboard ke publik
- Backup `birthdays.json` secara berkala

## API Endpoints

Web dashboard expose API endpoints:

- `GET /api/birthdays` - Get all birthdays
- `POST /api/birthdays` - Add birthday
- `PUT /api/birthdays/:index` - Update birthday
- `DELETE /api/birthdays/:index` - Delete birthday
- `GET /api/logs` - Get bot logs
- `POST /api/reload-bot` - Reload bot
- `POST /api/clear-birthday-log` - Clear birthday log
- `POST /api/test-message` - Test send message
- `POST /api/get-groups` - Get WhatsApp groups

## Tech Stack

- **Backend**: Node.js + Express.js
- **WhatsApp**: @whiskeysockets/baileys
- **Scheduler**: node-cron
- **Template Engine**: EJS
- **Frontend**: Bootstrap 5 + Font Awesome
- **Deployment**: Railway (free tier)

## Credits

Made with ❤️ by FabrikGroup

## License

ISC
