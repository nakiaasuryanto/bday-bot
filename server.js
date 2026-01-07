import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

app.post('/api/reload-bot', (req, res) => {
  const { exec } = require('child_process');
  exec('npm run reload-bot', (error, stdout, stderr) => {
    if (error) {
      res.json({ success: false, message: 'Error reloading bot: ' + error.message });
    } else {
      res.json({ success: true, message: 'Bot reloaded successfully!' });
    }
  });
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

app.post('/api/get-groups', (req, res) => {
  const { exec } = require('child_process');
  exec('npm run groups', (error, stdout, stderr) => {
    if (error) {
      res.json({ success: false, message: 'Error getting groups: ' + error.message });
    } else {
      res.json({ success: true, message: 'Groups fetched! Check console output.', output: stdout });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Birthday Bot Dashboard running at http://localhost:${PORT}`);
});
