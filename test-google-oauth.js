const https = require("https");

const clientId = process.env.GOOGLE_CLIENT_ID || "583009512211-vpte94nf7p7ogliuq9iqc7ajo1rso17o.apps.googleusercontent.com";
const redirectUri = encodeURIComponent("https://xtrashield-seven.vercel.app/api/auth/callback/google");

const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile`;

console.log("Testing URL:", url);

https.get(url, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    if (res.headers.location) {
      console.log("Redirect to:", res.headers.location.substring(0, 200));
    }
    // Look for error indicators
    if (data.includes("invalid_client")) console.log("FOUND: invalid_client");
    if (data.includes("redirect_uri_mismatch")) console.log("FOUND: redirect_uri_mismatch");
    if (data.includes("The OAuth client was not found")) console.log("FOUND: OAuth client not found");
    if (data.includes("unauthorized_client")) console.log("FOUND: unauthorized_client");
    if (data.includes("Client was not found")) console.log("FOUND: Client was not found");
    console.log("Response length:", data.length);
  });
});
