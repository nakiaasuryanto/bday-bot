import { spawn } from 'child_process';

console.log('🚀 Starting Birthday Bot on Railway...\n');

// Start bot
const bot = spawn('node', ['bot.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Start web server
const web = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Handle bot process
bot.on('error', (err) => {
  console.error('❌ Bot process error:', err);
  process.exit(1);
});

bot.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Bot process exited with code ${code}`);
    process.exit(code);
  }
});

// Handle web process
web.on('error', (err) => {
  console.error('❌ Web server error:', err);
  process.exit(1);
});

web.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Web server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle termination
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  bot.kill('SIGTERM');
  web.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  bot.kill('SIGINT');
  web.kill('SIGINT');
  process.exit(0);
});

console.log('✅ Bot and Web Server started successfully!');
console.log('📱 WhatsApp Bot: Running');
console.log('🌐 Web Dashboard: Running on port', process.env.PORT || 3001);
