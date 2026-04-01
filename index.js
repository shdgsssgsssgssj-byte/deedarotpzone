import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  apiUrl: 'https://www.ivasms.com/api/v1/fetch-data', // Update with actual API endpoint
  outputFile: path.join(__dirname, 'data', 'ivas-data.json'),
  retryCount: 3,
  retryDelay: 2000, // 2 seconds
  timeout: 30000, // 30 seconds
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// Logger function
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type}] ${message}`;
  console.log(logMessage);
  
  // Also write to log file
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.appendFileSync(
    path.join(logDir, `fetch-${new Date().toISOString().split('T')[0]}.log`),
    logMessage + '\n'
  );
}

// Delay function for retry
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get cookies from environment
function getCookies() {
  // Try different possible environment variable names
  const cookieString = process.env.IVAS_COOKIES || 
                      process.env.COOKIE_STRING || 
                      process.env.IVAS_COOKIE;
  
  if (!cookieString) {
    log('❌ No cookies found in environment variables!', 'ERROR');
    log('Please set IVAS_COOKIES environment variable', 'ERROR');
    log('Format: XSRF-TOKEN=value; ivas_session=value', 'ERROR');
    return null;
  }
  
  // Validate cookie format
  if (!cookieString.includes('XSRF-TOKEN') || !cookieString.includes('ivas_session')) {
    log('⚠️ Warning: Cookies might be incomplete. Expected XSRF-TOKEN and ivas_session', 'WARN');
  }
  
  return cookieString;
}

// Extract XSRF token from cookie string
function extractXsrfToken(cookieString) {
  const match = cookieString.match(/XSRF-TOKEN=([^;]+)/);
  return match ? match[1] : null;
}

// Fetch data from IVAS API
async function fetchIvasData(retryAttempt = 0) {
  const cookieString = getCookies();
  
  if (!cookieString) {
    throw new Error('No cookies available');
  }
  
  const xsrfToken = extractXsrfToken(cookieString);
  
  log(`🌐 Fetching data from IVAS API...`, 'INFO');
  log(`📡 URL: ${CONFIG.apiUrl}`, 'DEBUG');
  log(`🍪 Cookies available: ${cookieString.substring(0, 50)}...`, 'DEBUG');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
  
  try {
    const response = await fetch(CONFIG.apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': CONFIG.userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cookie': cookieString,
        ...(xsrfToken && { 'X-XSRF-TOKEN': xsrfToken }),
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    log(`✅ Data fetched successfully!`, 'SUCCESS');
    log(`📊 Response size: ${JSON.stringify(data).length} bytes`, 'INFO');
    
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      log(`⏰ Request timeout after ${CONFIG.timeout}ms`, 'ERROR');
    } else {
      log(`❌ Fetch failed: ${error.message}`, 'ERROR');
    }
    
    // Retry logic
    if (retryAttempt < CONFIG.retryCount) {
      log(`🔄 Retrying... (${retryAttempt + 1}/${CONFIG.retryCount})`, 'INFO');
      await delay(CONFIG.retryDelay);
      return fetchIvasData(retryAttempt + 1);
    }
    
    throw error;
  }
}

// Save data to file
async function saveData(data) {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(CONFIG.outputFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Add metadata
    const outputData = {
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'IVAS API',
        version: '1.0.0'
      },
      data: data
    };
    
    // Save as JSON
    fs.writeFileSync(
      CONFIG.outputFile,
      JSON.stringify(outputData, null, 2)
    );
    
    log(`💾 Data saved to: ${CONFIG.outputFile}`, 'SUCCESS');
    
    // Also save as backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(
      path.dirname(CONFIG.outputFile),
      `backup`,
      `ivas-data-${timestamp}.json`
    );
    
    const backupDir = path.dirname(backupFile);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(outputData, null, 2));
    log(`📦 Backup saved to: ${backupFile}`, 'INFO');
    
    return true;
    
  } catch (error) {
    log(`❌ Failed to save data: ${error.message}`, 'ERROR');
    return false;
  }
}

// Validate environment
function validateEnvironment() {
  const requiredEnvVars = ['IVAS_COOKIES'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    log(`⚠️ Missing environment variables: ${missing.join(', ')}`, 'WARN');
    log(`💡 Tip: Set these in GitHub Secrets or .env file`, 'INFO');
    
    // For development, check if .env file exists
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      log(`📝 Found .env file, loading...`, 'INFO');
      return true;
    }
    
    return missing.length === 0;
  }
  
  return true;
}

// Main execution function
async function main() {
  log('🚀 Starting IVAS data fetcher...', 'INFO');
  log(`🖥️ Node version: ${process.version}`, 'INFO');
  log(`📂 Working directory: ${__dirname}`, 'DEBUG');
  
  // Validate environment
  if (!validateEnvironment()) {
    log('❌ Environment validation failed!', 'ERROR');
    log('✅ To fix:', 'INFO');
    log('1. Set IVAS_COOKIES in GitHub Secrets', 'INFO');
    log('2. Format: "XSRF-TOKEN=value; ivas_session=value"', 'INFO');
    log('3. Get cookies from browser Network tab (F12)', 'INFO');
    process.exit(1);
  }
  
  try {
    // Fetch data
    const data = await fetchIvasData();
    
    if (!data) {
      throw new Error('No data received from API');
    }
    
    // Save data
    const saved = await saveData(data);
    
    if (saved) {
      log('🎉 Process completed successfully!', 'SUCCESS');
      
      // Log summary
      const stats = {
        timestamp: new Date().toISOString(),
        dataSize: JSON.stringify(data).length,
        recordCount: Array.isArray(data) ? data.length : Object.keys(data).length
      };
      log(`📊 Summary: ${JSON.stringify(stats)}`, 'INFO');
      
      process.exit(0);
    } else {
      throw new Error('Failed to save data');
    }
    
  } catch (error) {
    log(`💥 Fatal error: ${error.message}`, 'ERROR');
    log(`📚 Stack trace: ${error.stack}`, 'DEBUG');
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  log(`⚠️ Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught Exception: ${error.message}`, 'ERROR');
  log(`Stack: ${error.stack}`, 'DEBUG');
  process.exit(1);
});

// Run main function
main();
