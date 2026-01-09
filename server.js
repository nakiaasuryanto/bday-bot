import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { startBot, disconnectBot, getWhatsAppGroups, getSocket, getCurrentQR, generateBirthdayMessage, calculateAge } from './bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Helper functions
function loadBirthdays() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'birthdays.json'), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveBirthdays(birthdays) {
  fs.writeFileSync(
    path.join(__dirname, 'birthdays.json'),
    JSON.stringify(birthdays, null, 2),
    'utf8'
  );
}

// Routes
app.get('/', (req, res) => {
  const birthdays = loadBirthdays();
  res.render('index', {
    page: 'dashboard',
    birthdays: birthdays
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  const sock = getSocket();
  const qr = getCurrentQR();
  res.json({
    connected: sock ? true : false,
    socketExists: sock !== null && sock !== undefined,
    authSessionExists: fs.existsSync(path.join(__dirname, 'auth_session')),
    qr: qr || null
  });
});

app.get('/api/birthdays', (req, res) => {
  const birthdays = loadBirthdays();
  res.json(birthdays);
});

app.post('/api/birthdays', (req, res) => {
  const birthdays = loadBirthdays();
  birthdays.push(req.body);
  saveBirthdays(birthdays);
  res.json({ success: true, message: 'Birthday added successfully' });
});

app.put('/api/birthdays/:index', (req, res) => {
  const birthdays = loadBirthdays();
  const index = parseInt(req.params.index);
  if (index >= 0 && index < birthdays.length) {
    birthdays[index] = req.body;
    saveBirthdays(birthdays);
    res.json({ success: true, message: 'Birthday updated successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Birthday not found' });
  }
});

app.delete('/api/birthdays/:index', (req, res) => {
  const birthdays = loadBirthdays();
  const index = parseInt(req.params.index);
  if (index >= 0 && index < birthdays.length) {
    birthdays.splice(index, 1);
    saveBirthdays(birthdays);
    res.json({ success: true, message: 'Birthday deleted successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Birthday not found' });
  }
});

app.get('/api/logs', (req, res) => {
  try {
    const logs = fs.readFileSync(path.join(__dirname, 'launchd.log'), 'utf8');
    res.json({ logs: logs.split('\n').slice(-100).reverse().join('\n') });
  } catch (error) {
    res.json({ logs: 'No logs available' });
  }
});

app.post('/api/disconnect', async (req, res) => {
  console.log('📥 [API] Received disconnect request');
  try {
    console.log('📥 [API] Calling disconnectBot()...');
    const result = await disconnectBot();
    console.log('✅ [API] Disconnect successful:', result);

    // Send response - bot will reconnect automatically
    res.json({ success: true, message: 'WhatsApp disconnected. Refresh page to scan QR code again.' });
  } catch (error) {
    console.error('❌ [API] Disconnect error:', error.message);
    res.status(500).json({ success: false, message: 'Error disconnecting: ' + error.message });
  }
});

app.post('/api/force-restart', async (req, res) => {
  console.log('🔥 [API] FORCE RESTART requested');
  try {
    // Disconnect bot first
    console.log('🔥 [API] Disconnecting bot...');
    await disconnectBot();

    // Send success response
    res.json({ success: true, message: 'Force restart initiated. App will restart in 2 seconds...' });

    // Force exit process after response is sent
    console.log('🔥 [API] Exiting process in 2 seconds...');
    setTimeout(() => {
      console.log('💥 [API] FORCE EXIT NOW!');
      process.exit(0);
    }, 2000);
  } catch (error) {
    console.error('❌ [API] Force restart error:', error.message);
    res.status(500).json({ success: false, message: 'Error: ' + error.message });
  }
});

app.post('/api/clear-birthday-log', (req, res) => {
  try {
    fs.writeFileSync(path.join(__dirname, 'birthday_log.txt'), '');
    res.json({ success: true, message: 'Birthday log cleared successfully!' });
  } catch (error) {
    res.json({ success: false, message: 'Error clearing log: ' + error.message });
  }
});

app.post('/api/test-message', (req, res) => {
  const birthdays = loadBirthdays();
  if (birthdays.length === 0) {
    res.json({ success: false, message: 'No birthdays in database' });
    return;
  }

  const { name } = req.body;
  let person;

  if (name) {
    person = birthdays.find(b => b.nama.toLowerCase().includes(name.toLowerCase()));
    if (!person) {
      res.json({ success: false, message: `Birthday not found for: ${name}` });
      return;
    }
  } else {
    person = birthdays[0];
  }

  res.json({
    success: true,
    message: `Test message would be sent for: ${person.nama}\nGroup: ${person.grup_nama}\nCheck bot logs for details.`
  });
});

app.post('/api/get-groups', async (req, res) => {
  try {
    const groups = await getWhatsAppGroups();
    res.json({ success: true, message: 'Groups fetched! Check logs below.', output: groups });
  } catch (error) {
    res.json({ success: false, message: 'Error getting groups: ' + error.message });
  }
});

app.post('/api/preview-message', (req, res) => {
  try {
    const { index } = req.body;
    const birthdays = loadBirthdays();

    if (index < 0 || index >= birthdays.length) {
      return res.status(404).json({ success: false, message: 'Birthday not found' });
    }

    const birthday = birthdays[index];
    const age = calculateAge(birthday.tanggal_lahir);
    const message = generateBirthdayMessage(birthday, age);

    res.json({
      success: true,
      message: message,
      person: birthday.nama,
      age: age,
      group: birthday.grup_nama
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating preview: ' + error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`🌐 Birthday Bot Dashboard running at http://localhost:${PORT}`);

  // Start WhatsApp bot (single process for Railway)
  console.log('\n🤖 Starting WhatsApp Bot...\n');
  try {
    await startBot();
  } catch (err) {
    console.error('❌ Error starting bot:', err);
  }
});
