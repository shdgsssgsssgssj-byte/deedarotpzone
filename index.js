const { fetchToken, getNumbers, getSMS } = require('./iva');

async function main() {
  console.log(`[${new Date().toISOString()}] Starting IVAS fetch...`);
  
  try {
    console.log("Fetching token...");
    const token = await fetchToken();
    
    if (!token) {
      console.error("❌ No token received! Cookies may be expired.");
      console.log("\n💡 To fix:");
      console.log("1. Login to https://www.ivasms.com");
      console.log("2. Get new cookies from browser console");
      console.log("3. Update GitHub Secrets: XSRF_TOKEN and IVAS_SESSION");
      process.exit(1);
    }
    
    console.log("✅ Token fetched successfully");
    console.log(`Token preview: ${token.substring(0, 50)}...`);
    
    console.log("\n📞 Fetching numbers...");
    const numbers = await getNumbers(token);
    console.log(`✅ Found ${numbers.aaData?.length || 0} numbers`);
    if (numbers.aaData?.length > 0) {
      console.log(`Sample: ${JSON.stringify(numbers.aaData[0])}`);
    }
    
    console.log("\n💬 Fetching SMS...");
    const sms = await getSMS(token);
    console.log(`✅ Found ${sms.aaData?.length || 0} messages`);
    if (sms.aaData?.length > 0) {
      console.log(`Latest: ${JSON.stringify(sms.aaData[0])}`);
    }
    
    const fs = require('fs');
    const output = {
      timestamp: new Date().toISOString(),
      numbers: numbers,
      sms: sms
    };
    
    fs.writeFileSync('output.json', JSON.stringify(output, null, 2));
    console.log("\n💾 Data saved to output.json");
    console.log("✅ Job completed successfully!");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    
    if (error.message === "SESSION_EXPIRED") {
      console.log("\n⚠️ Session expired!");
      console.log("Please update cookies in GitHub Secrets:");
      console.log("Settings → Secrets and variables → Actions");
      console.log("Update: XSRF_TOKEN and IVAS_SESSION");
    }
    
    process.exit(1);
  }
}

main();
