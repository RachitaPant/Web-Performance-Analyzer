// Simple Firebase configuration verification test
import fetch from "node-fetch";

async function testFirebase() {
  console.log("🧪 Testing Firebase Configuration...\n");

  // Test 1: Verify environment variables
  console.log("1️⃣  Checking Environment Variables:");
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  let envValid = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`   ❌ ${varName}: NOT FOUND`);
      envValid = false;
    }
  }

  if (!envValid) {
    console.log("\n❌ Missing environment variables. Please check .env.local\n");
    process.exit(1);
  }

  // Test 2: Validate Firebase config format
  console.log("\n2️⃣  Validating Firebase Configuration:");
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (projectId && projectId.length > 0) {
    console.log(`   ✅ Project ID valid: ${projectId}`);
  } else {
    console.log(`   ❌ Project ID invalid`);
    envValid = false;
  }

  if (apiKey && apiKey.startsWith("AIza")) {
    console.log(`   ✅ API Key format valid (Google format detected)`);
  } else {
    console.log(`   ⚠️  API Key format may be invalid`);
  }

  // Test 3: Test Firebase REST API connectivity
  console.log("\n3️⃣  Testing Firebase REST API Connectivity:");
  try {
    const testUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/test`;
    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
      },
    }).catch(() => null);

    if (response) {
      if (response.status === 401 || response.status === 403) {
        console.log(`   ⚠️  API responded with ${response.status} - credentials may be insufficient`);
        console.log(`      (This is normal if Firestore rules restrict access)
      `);
      } else if (response.ok || response.status === 404) {
        console.log(`   ✅ Firestore API is reachable`);
      } else {
        console.log(`   ⚠️  Firebase API responded with status ${response.status}`);
      }
    } else {
      console.log(`   ⚠️  Could not reach Firebase API (network issue)`);
    }
  } catch (error) {
    console.log(`   ⚠️  Connection test skipped: ${error.message}`);
  }

  console.log("\n✨ Firebase Configuration Test Complete!\n");
  console.log("📝 Configuration Summary:");
  console.log(`   Project: ${projectId}`);
  console.log(`   Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
  console.log("\n💡 Next Steps:");
  console.log("   1. Run 'npm run dev' to start the dev server");
  console.log("   2. Try logging in or accessing Firestore features in the app");
  console.log("   3. Check browser console for any Firebase errors\n");
}

testFirebase().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
