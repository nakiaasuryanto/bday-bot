import { default as makeWASocket, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_DIR = path.join(__dirname, 'auth_session');

/**
 * Get all WhatsApp groups
 */
async function getGroups() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  📋 WhatsApp Group ID Fetcher          ║');
  console.log('╚════════════════════════════════════════╝\n');

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log('\n📱 Scan QR code ini dengan WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log('✅ Terhubung ke WhatsApp!\n');
      console.log('🔍 Mengambil daftar grup...\n');

      try {
        // Get all chats
        const chats = await sock.groupFetchAllParticipating();
        const groups = Object.values(chats);

        if (groups.length === 0) {
          console.log('📭 Tidak ada grup ditemukan.');
        } else {
          console.log(`📊 Total grup: ${groups.length}\n`);
          console.log('═'.repeat(80));

          groups.forEach((group, index) => {
            console.log(`\n${index + 1}. ${group.subject}`);
            console.log(`   ID: ${group.id}`);
            console.log(`   Participants: ${group.participants.length}`);
            console.log(`   Created: ${new Date(group.creation * 1000).toLocaleDateString()}`);
            console.log('-'.repeat(80));
          });

          console.log('\n\n📝 Copy ID grup di atas dan paste ke birthdays.json');
          console.log('💡 Format ID grup biasanya: 120363XXXXXXXXXXXXX@g.us\n');
        }

      } catch (error) {
        console.error('❌ Error fetching groups:', error.message);
      }

      // Close connection
      console.log('\n👋 Menutup koneksi...\n');
      sock.end();
      process.exit(0);
    }
  });
}

getGroups().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
