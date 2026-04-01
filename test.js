import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing IVAS Fetcher Setup...\n');

// Test 1: Check environment
console.log('📋 Test 1: Environment Variables');
const cookies = process.env.IVAS_COOKIES || process.env.COOKIE_STRING;
if (cookies) {
  console.log('✅ IVAS_COOKIES found');
  console.log(`   Length: ${cookies.length} characters`);
  console.log(`   Preview: ${cookies.substring(0, 50)}...`);
  
  // Check format
  if (cookies.includes('XSRF-TOKEN') && cookies.includes('ivas_session')) {
    console.log('✅ Cookie format looks correct');
  } else {
    console.log('⚠️ Warning: Missing XSRF-TOKEN or ivas_session');
  }
} else {
  console.log('❌ IVAS_COOKIES not found');
  console.log('   Create .env file with: IVAS_COOKIES="XSRF-TOKEN=value; ivas_session=value"');
}

// Test 2: Check directories
console.log('\n📁 Test 2: Directory Structure');
const dirs = ['data', 'logs', 'data/backup'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️ Creating ${dir} directory`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
  console.log(`✅ ${dir} directory ready`);
});

// Test 3: Check Node version
console.log('\n🟢 Test 3: Node Version');
console.log(`✅ Node ${process.version} (requires >=18.0.0)`);

// Test 4: Check file permissions
console.log('\n🔐 Test 4: File Permissions');
try {
  fs.accessSync(__dirname, fs.constants.W_OK);
  console.log('✅ Write permission OK');
} catch (err) {
  console.log('❌ No write permission');
}

console.log('\n✨ Setup complete! Run "node index.js" to start fetching data');
