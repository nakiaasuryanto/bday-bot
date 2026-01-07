import { default as makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import express from 'express';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const BIRTHDAYS_FILE = path.join(__dirname, 'birthdays.json');
const LOG_FILE = path.join(__dirname, 'birthday_log.txt');
const AUTH_DIR = path.join(__dirname, 'auth_session');

// Global socket variable
let sock;
let hasConnectedBefore = false;

// Express app for QR code display (local dev only)
let app = null;
let currentQR = null;
const QR_PORT = 3000;

// Timezone offset for Asia/Jakarta (WIB = UTC+7)
const WIB_OFFSET = 7 * 60; // in minutes

/**
 * Get current date in WIB timezone
 * @returns {Date} Current date in WIB
 */
function getWIBDate() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibTime = new Date(utc + (WIB_OFFSET * 60000));
  return wibTime;
}

/**
 * Get formatted date string for logging
 * @returns {string} Formatted date string
 */
function getFormattedDateTime() {
  const wibDate = getWIBDate();
  return wibDate.toISOString().replace('T', ' ').substring(0, 19) + ' WIB';
}

/**
 * Get today's date in MM-DD format (WIB timezone)
 * @returns {string} Today's date in MM-DD format
 */
function getTodayDate() {
  const wibDate = getWIBDate();
  const month = String(wibDate.getMonth() + 1).padStart(2, '0');
  const date = String(wibDate.getDate()).padStart(2, '0');
  return `${month}-${date}`;
}

/**
 * Calculate age from birth date
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {number} Age in years
 */
function calculateAge(birthDate) {
  const today = getWIBDate();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Load birthdays from JSON file
 * @returns {Array} Array of birthday objects
 */
function loadBirthdays() {
  try {
    if (!fs.existsSync(BIRTHDAYS_FILE)) {
      console.log('⚠️  birthdays.json tidak ditemukan. Membuat file baru...');
      fs.writeFileSync(BIRTHDAYS_FILE, '[]');
      return [];
    }

    const data = fs.readFileSync(BIRTHDAYS_FILE, 'utf8');
    const birthdays = JSON.parse(data);

    // Validate birthday data
    const validBirthdays = birthdays.filter(b => {
      if (!b.nama || !b.tanggal_lahir || !b.grup_id || !b.grup_nama) {
        console.log(`⚠️  Data tidak lengkap untuk: ${b.nama || 'Unknown'}`);
        return false;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(b.tanggal_lahir)) {
        console.log(`⚠️  Format tanggal tidak valid untuk ${b.nama}: ${b.tanggal_lahir}`);
        return false;
      }

      return true;
    });

    return validBirthdays;
  } catch (error) {
    console.error('❌ Error loading birthdays:', error.message);
    return [];
  }
}

/**
 * Check if birthday message was already sent today
 * @param {string} nama - Person's name
 * @param {string} todayDate - Today's date in MM-DD format
 * @returns {boolean} True if already sent
 */
function isAlreadySent(nama, todayDate) {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return false;
    }

    const logs = fs.readFileSync(LOG_FILE, 'utf8');
    const searchPattern = `[${todayDate}] - Ucapan terkirim untuk ${nama}`;

    return logs.includes(searchPattern);
  } catch (error) {
    console.error('❌ Error checking log:', error.message);
    return false;
  }
}

/**
 * Write log to file
 * @param {string} message - Log message
 */
function writeLog(message) {
  try {
    const timestamp = getFormattedDateTime();
    const todayDate = getTodayDate();
    const logMessage = `[${timestamp}] [${todayDate}] - ${message}\n`;

    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('❌ Error writing log:', error.message);
  }
}

/**
 * Generate birthday message
 * @param {Object} birthday - Birthday object with all details
 * @param {number} age - Person's age
 * @returns {string} Birthday message
 */
function generateBirthdayMessage(birthday, age) {
  const { nama, nomor_wa, tanggal_lahir, role } = birthday;

  // Parse tanggal lahir untuk mendapatkan tanggal dan bulan
  const [year, month, day] = tanggal_lahir.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = monthNames[parseInt(month) - 1];
  const tanggalBulan = `${parseInt(day)} ${monthName}`;

  // Format nomor WhatsApp untuk tag
  const waTag = nomor_wa ? `@${nomor_wa}` : nama;

  return `Alhamdulillāh… ✨

Hari ini kita bersyukur atas bertambahnya usia ${nama} (${role}) yang berulang tahun pada ${tanggalBulan}, memasuki usia ke-${age} tahun 🥳

Semoga Allah ﷻ senantiasa melimpahkan kesehatan, keberkahan usia, kelapangan rezeki, dan kebahagiaan dalam setiap langkah kehidupan. Semoga setiap kebaikan yang telah dan akan dilakukan menjadi amal jariyah yang diridhai-Nya 🤍 Di usia yang baru ini, semoga Allah mudahkan segala urusan, menguatkan niat baik, melancarkan setiap ikhtiar, dan mengabulkan doa serta impian yang sedang diperjuangkan. Semoga pula terus diberi kesempatan untuk memberi manfaat dan inspirasi bagi sekitar 🌱

Aamiin ya Rabbal 'alamin 🤲

Tag: ${waTag}

Dikirim oleh Birthday FabrikBot 🎂`;
}

/**
 * Send birthday message to WhatsApp group
 * @param {Object} birthday - Birthday object
 */
async function sendBirthdayMessage(birthday) {
  try {
    if (!sock) {
      console.log('❌ WhatsApp socket belum terhubung');
      return;
    }

    const age = calculateAge(birthday.tanggal_lahir);
    const message = generateBirthdayMessage(birthday, age);

    console.log(`📤 Mengirim ucapan untuk ${birthday.nama} (${age} tahun) ke grup ${birthday.grup_nama}...`);

    // TEST: Send without mentions
    await sock.sendMessage(birthday.grup_id, {
      text: message
    });

    console.log(`✅ Ucapan berhasil terkirim untuk ${birthday.nama}!`);
    writeLog(`Ucapan terkirim untuk ${birthday.nama} di grup ${birthday.grup_nama}`);

  } catch (error) {
    console.error(`❌ Error mengirim pesan untuk ${birthday.nama}:`, error.message);
    writeLog(`ERROR: Gagal mengirim ucapan untuk ${birthday.nama} - ${error.message}`);
  }
}

/**
 * Check and send birthday messages
 */
async function checkBirthdays() {
  console.log('\n🔍 Checking birthdays...');

  const birthdays = loadBirthdays();
  const todayDate = getTodayDate();

  console.log(`📅 Today's date (WIB): ${todayDate}`);
  console.log(`📋 Total birthdays in database: ${birthdays.length}`);

  let birthdaysToday = 0;

  for (const birthday of birthdays) {
    // Extract MM-DD from YYYY-MM-DD
    const [year, month, day] = birthday.tanggal_lahir.split('-');
    const birthdayDate = `${month}-${day}`;

    if (birthdayDate === todayDate) {
      birthdaysToday++;

      if (isAlreadySent(birthday.nama, todayDate)) {
        console.log(`⏭️  Ucapan untuk ${birthday.nama} sudah terkirim hari ini. Skip.`);
        continue;
      }

      console.log(`🎂 Birthday detected: ${birthday.nama}`);
      await sendBirthdayMessage(birthday);

      // Wait 2 seconds between messages to avoid spam detection
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (birthdaysToday === 0) {
    console.log('📭 Tidak ada yang ulang tahun hari ini.');
  }

  console.log('✅ Birthday check completed.\n');
}

/**
 * Setup Express server for QR code display
 */
function setupQRServer() {
  // Create express app only when needed (local dev)
  app = express();

  app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Birthday Bot - QR Code</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
      text-align: center;
      max-width: 500px;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 16px;
    }
    #qrcode {
      margin: 30px auto;
      padding: 20px;
      background: white;
      border-radius: 10px;
      display: inline-block;
    }
    #qrcode img {
      max-width: 100%;
      height: auto;
    }
    .status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 10px;
      font-weight: 500;
    }
    .waiting {
      background: #fff3cd;
      color: #856404;
    }
    .connected {
      background: #d4edda;
      color: #155724;
    }
    .error {
      background: #f8d7da;
      color: #721c24;
    }
    .instructions {
      margin-top: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
      text-align: left;
    }
    .instructions ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 8px 0;
      color: #495057;
    }
    .emoji {
      font-size: 24px;
    }
  </style>
  <script>
    function refreshQR() {
      fetch('/qr')
        .then(res => res.json())
        .then(data => {
          const qrDiv = document.getElementById('qrcode');
          const statusDiv = document.getElementById('status');

          if (data.status === 'connected') {
            qrDiv.innerHTML = '<div class="emoji">✅</div><p>Connected!</p>';
            statusDiv.innerHTML = '✅ Bot berhasil terhubung ke WhatsApp!';
            statusDiv.className = 'status connected';
          } else if (data.qr) {
            qrDiv.innerHTML = '<img src="' + data.qr + '" alt="QR Code">';
            statusDiv.innerHTML = '📱 Scan QR code dengan WhatsApp Anda';
            statusDiv.className = 'status waiting';
          } else {
            statusDiv.innerHTML = '⏳ Menunggu QR code...';
            statusDiv.className = 'status waiting';
          }
        })
        .catch(err => {
          document.getElementById('status').innerHTML = '❌ Error: ' + err.message;
          document.getElementById('status').className = 'status error';
        });
    }

    // Refresh QR code every 3 seconds
    setInterval(refreshQR, 3000);

    // Initial load
    window.onload = refreshQR;
  </script>
</head>
<body>
  <div class="container">
    <h1>🤖 WhatsApp Birthday Bot</h1>
    <p class="subtitle">FabrikGroup Bot - QR Code Login</p>

    <div id="qrcode">
      <p>⏳ Loading QR Code...</p>
    </div>

    <div id="status" class="status waiting">
      Menunggu QR code...
    </div>

    <div class="instructions">
      <strong>📋 Cara Login:</strong>
      <ol>
        <li>Buka WhatsApp di HP Anda</li>
        <li>Tap Menu (⋮) atau Settings</li>
        <li>Pilih "Linked Devices"</li>
        <li>Tap "Link a Device"</li>
        <li>Scan QR code di atas</li>
      </ol>
    </div>
  </div>
</body>
</html>
    `);
  });

  app.get('/qr', (req, res) => {
    if (!sock) {
      return res.json({ status: 'initializing', qr: null });
    }

    if (currentQR) {
      res.json({ status: 'waiting', qr: currentQR });
    } else {
      res.json({ status: 'connected', qr: null });
    }
  });

  // Only start QR web server in local development
  // In production (Railway), dashboard server handles web UI
  if (!process.env.RAILWAY_ENVIRONMENT) {
    app.listen(QR_PORT, () => {
      console.log(`\n🌐 QR Code tersedia di: http://localhost:${QR_PORT}`);
      console.log(`📱 Buka URL di atas di browser untuk scan QR code\n`);
    });
  } else {
    console.log(`\n📱 Running in production - QR code available via dashboard\n`);
  }
}

/**
 * Connect to WhatsApp
 */
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  // Handle credentials update
  sock.ev.on('creds.update', saveCreds);

  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        // Generate QR code as base64 data URL
        currentQR = await QRCode.toDataURL(qr);

        // Log QR availability (local dev shows URL, production shows ready state)
        if (!process.env.RAILWAY_ENVIRONMENT && !process.env.PORT) {
          console.log('📱 QR Code baru tersedia di http://localhost:' + QR_PORT);
          // Display in terminal for convenience (local only)
          qrcodeTerminal.generate(qr, { small: true });
        } else {
          console.log('📱 QR Code generated - scan via dashboard');
        }
      } catch (err) {
        console.error('❌ Error generating QR:', err.message);
      }
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      console.log('❌ Koneksi terputus:', lastDisconnect?.error?.message);

      // Only auto-reconnect if we've successfully connected before
      // This prevents reconnect loop when QR hasn't been scanned
      if (shouldReconnect && hasConnectedBefore) {
        console.log('🔄 Mencoba reconnect dalam 5 detik...');
        setTimeout(() => connectToWhatsApp(), 5000);
      } else if (!hasConnectedBefore) {
        console.log('⏳ Menunggu QR code di-scan. Tidak akan auto-reconnect.');
      } else {
        console.log('⚠️  Logged out. Silakan hapus folder auth_session dan login ulang.');
        process.exit(0);
      }
    } else if (connection === 'open') {
      // Mark that we've connected successfully
      hasConnectedBefore = true;

      // Clear QR code when connected
      currentQR = null;

      console.log('✅ Terhubung ke WhatsApp!');
      console.log('🤖 Bot siap berjalan...\n');

      // Check birthdays on startup
      console.log('🚀 Melakukan pengecekan birthday saat startup...');
      await checkBirthdays();
    }
  });

  // Handle messages (optional: for debugging)
  sock.ev.on('messages.upsert', async ({ messages }) => {
    // You can add message handlers here if needed
  });
}

/**
 * Setup cron job for daily birthday check at 08:00 WIB
 */
function setupCronJob() {
  // Cron runs at 08:00 WIB
  // Since server might be in different timezone, we need to calculate the correct cron time
  // For simplicity, using system time and assuming it's set to WIB
  // If server is in different timezone, adjust accordingly

  cron.schedule('0 8 * * *', async () => {
    console.log('\n⏰ Cron job triggered at 08:00 WIB');
    await checkBirthdays();
  }, {
    timezone: "Asia/Jakarta"
  });

  console.log('⏰ Cron job scheduled: Daily check at 08:00 WIB');
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandlers() {
  const shutdown = async (signal) => {
    console.log(`\n\n🛑 ${signal} received. Shutting down gracefully...`);

    if (sock) {
      console.log('👋 Closing WhatsApp connection...');
      sock.end();
    }

    console.log('✅ Shutdown complete. Goodbye! 👋\n');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Main function
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  🤖 WhatsApp Birthday Bot v1.0        ║');
  console.log('║  📅 FabrikGroup Bot                    ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Setup shutdown handlers
  setupShutdownHandlers();

  // Setup QR code web server (local only)
  // In production, server.js handles the web UI
  if (!process.env.RAILWAY_ENVIRONMENT && !process.env.PORT) {
    setupQRServer();
  } else {
    console.log('📱 Production mode - Skipping QR web server (handled by dashboard)\n');
  }

  // Check if birthdays.json exists
  if (!fs.existsSync(BIRTHDAYS_FILE)) {
    console.log('⚠️  birthdays.json tidak ditemukan!');
    console.log('📝 Silakan buat file birthdays.json dengan format:');
    console.log(`[
  {
    "nama": "John Doe",
    "tanggal_lahir": "1995-01-15",
    "grup_id": "120363123456789012@g.us",
    "grup_nama": "FabrikGroup Team"
  }
]\n`);
  }

  // Connect to WhatsApp
  console.log('🔌 Connecting to WhatsApp...\n');
  await connectToWhatsApp();

  // Setup cron job
  setupCronJob();

  console.log('✨ Bot is running! Press Ctrl+C to stop.\n');
}

/**
 * Disconnect WhatsApp and clear session
 */
async function disconnectBot() {
  console.log('🔌 [DISCONNECT] Starting disconnect process...');

  // Step 1: Logout from WhatsApp (if connected)
  if (sock) {
    try {
      console.log('🔌 [DISCONNECT] Logging out from WhatsApp...');
      await sock.logout();
      console.log('✅ [DISCONNECT] Logged out successfully');
    } catch (err) {
      console.log('⚠️ [DISCONNECT] Logout error (continuing):', err.message);
    }
    sock.end(undefined);
  }

  // Step 2: Delete auth session folder (FORCE)
  console.log('🔌 [DISCONNECT] Force deleting auth session...');
  try {
    if (fs.existsSync(AUTH_DIR)) {
      // Delete all files first
      const files = fs.readdirSync(AUTH_DIR);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(AUTH_DIR, file));
        } catch (e) {
          console.log(`⚠️  Could not delete ${file}:`, e.message);
        }
      }
      // Delete directory
      fs.rmdirSync(AUTH_DIR);
      console.log('✅ [DISCONNECT] Auth session deleted');
    }
  } catch (err) {
    console.error('❌ [DISCONNECT] Error deleting session:', err.message);
    // Don't throw - continue anyway
  }

  // Step 3: Reset state
  sock = null;
  currentQR = null;
  hasConnectedBefore = false;
  console.log('✅ [DISCONNECT] State reset');

  // Step 4: Exit process to restart (Railway will auto-restart)
  if (process.env.RAILWAY_ENVIRONMENT || process.env.PORT) {
    console.log('🔄 [DISCONNECT] Exiting process - Railway will restart...');
    setTimeout(() => process.exit(0), 1000);
  } else {
    // Local development - just reconnect
    setTimeout(async () => {
      console.log('🔄 [DISCONNECT] Reconnecting (local mode)...');
      await connectToWhatsApp();
    }, 2000);
  }

  return { success: true };
}

/**
 * Get WhatsApp groups
 */
async function getWhatsAppGroups() {
  if (!sock) {
    throw new Error('Bot not connected to WhatsApp');
  }

  console.log('📋 Fetching WhatsApp groups...');

  try {
    const groups = await sock.groupFetchAllParticipating();
    const groupList = Object.values(groups).map(group => ({
      id: group.id,
      name: group.subject,
      participants: group.participants.length
    }));

    console.log(`\n📊 Found ${groupList.length} groups:\n`);
    groupList.forEach(g => {
      console.log(`  • ${g.name}`);
      console.log(`    ID: ${g.id}`);
      console.log(`    Members: ${g.participants}\n`);
    });

    return JSON.stringify(groupList, null, 2);
  } catch (err) {
    console.error('Error fetching groups:', err.message);
    throw err;
  }
}

// Getter functions for exports (to get live values)
function getCurrentQR() {
  return currentQR;
}

function getSocket() {
  return sock;
}

// Export for use in server.js (Railway single process)
export {
  main as startBot,
  getCurrentQR,
  getSocket,
  disconnectBot,
  getWhatsAppGroups
};

// Start the bot only if run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
}
