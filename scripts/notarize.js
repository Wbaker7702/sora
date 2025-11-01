const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
  try {
    const { electronPlatformName, appOutDir } = context;
    if (electronPlatformName !== "darwin") {
      return;
    }

    const appName = context.packager.appInfo.productFilename;

    // Only notarize if we have the required environment variables
    if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD || !process.env.TEAM_ID) {
      console.log("⚠️  Skipping notarization: Missing required environment variables");
      console.log("Required: APPLE_ID, APPLE_ID_PASSWORD, TEAM_ID");
      return;
    }

    console.log(`🔐 Notarizing ${appName}...`);

    await notarize({
      appBundleId: "com.tolgayayci.sora",
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.TEAM_ID,
    });

    console.log("✅ Notarization completed successfully");
  } catch (error) {
    console.error("❌ Notarization failed:", error);
    if (error.response) {
      console.error("HTTP Response:", error.response);
    }
    throw error;
  }
};