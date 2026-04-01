const { fetchToken, getNumbers, getSMS } = require('./iva');

async function main() {
  console.log(`[${new Date().toISOString()}] Starting IVAS fetch...`);
  
  try {
    // Fetch token
    const token = await fetchToken();
    if (!token) {
      console.error("❌ Session expired! Update cookies in GitHub Secrets");
      process.exit(1);
    }
    
    console.log("✅ Token fetched successfully");
    
    // Fetch numbers
    console.log("📞 Fetching numbers...");
    const numbers = await getNumbers(token);
    console.log(`✅ Found ${numbers.aaData?.length || 0} numbers`);
    
    // Fetch SMS
    console.log("💬 Fetching SMS...");
    const sms = await getSMS(token);
    console.log(`✅ Found ${sms.aaData?.length || 0} messages`);
    
    // Save to file (optional)
    const fs = require('fs');
    const output = {
      timestamp: new Date().toISOString(),
      numbers: numbers,
      sms: sms
    };
    
    fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
    console.log("💾 Data saved to output.json");
    
    console.log(`✅ Job completed successfully!`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message === "SESSION_EXPIRED") {
      console.error("⚠️ Session expired! Please update cookies in GitHub Secrets");
    }
    process.exit(1);
  }
}

main();
