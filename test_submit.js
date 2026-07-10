import { PROFILES, generateResponse, FORM_ACTION } from "./form-engine.js";

async function test() {
  const profile = PROFILES[0];
  const params = generateResponse(profile, 1.0);
  console.log("Submitting with params:");
  for (const [k, v] of params) {
    console.log(`  ${k} = ${v}`);
  }
  
  const body = params.toString();
  console.log("\nURL:", FORM_ACTION);
  
  try {
    const res = await fetch(FORM_ACTION, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
      },
      body,
    });
    console.log("Status:", res.status);
    const text = await res.text();
    if (text.includes("Câu trả lời của bạn đã được ghi lại") || text.includes("Your response has been recorded")) {
      console.log("SUCCESS!");
    } else {
      console.log("Response text contains error. Check if fields match.");
      // Search for error patterns
      const match = text.match(/<div[^>]*class="freebirdFormviewerViewItemsItemErrorMessage[^>]*>(.*?)<\/div>/g);
      if (match) {
        console.log("Errors found in HTML:");
        console.log(match);
      } else {
         console.log("No specific error class found, but response might be bad.");
         import('fs').then(fs => fs.writeFileSync("test-response.html", text));
      }
    }
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

test();
