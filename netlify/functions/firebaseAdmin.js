const admin = require("firebase-admin");

const hasFullJson =
  !!process.env.FIREBASE_SERVICE_ACCOUNT ||
  !!process.env.FIREBASE_SERVICE_ACCOUNT_B64;

const hasSplit =
  !!process.env.FIREBASE_PRIVATE_KEY &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PROJECT_ID;

console.log("DEBUG firebaseAdmin:", {
  hasFullJson: !!process.env.FIREBASE_SERVICE_ACCOUNT,
  hasFullB64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
  hasSplit,
  projectId: process.env.FIREBASE_PROJECT_ID || "não informado",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "não informado",
});

if (!hasFullJson && !hasSplit) {
  throw new Error(
    "Firebase Admin não configurado. Defina FIREBASE_SERVICE_ACCOUNT ou FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL/FIREBASE_PROJECT_ID.",
  );
}

let serviceAccount;

if (hasSplit) {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  const normalizedKey = rawKey.replace(/\\n/g, "\n");

  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || undefined,
    private_key: normalizedKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID || undefined,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      process.env.FIREBASE_CLIENT_X509_CERT_URL || undefined,
  };
} else {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      const decoded = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_B64,
        "base64",
      ).toString("utf8");

      serviceAccount = JSON.parse(decoded);
      serviceAccount.private_key = serviceAccount.private_key
        ?.replace(/\\n/g, "\n")
        .trim();
    }
  } catch (err) {
    console.error("Failed to parse Firebase service account:", err?.message);

    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT content.");
  }
}

console.log("🔥 Firebase Admin project:", serviceAccount.project_id);

console.log("🔥 Firebase Admin client:", serviceAccount.client_email);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
