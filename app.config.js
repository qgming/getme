module.exports = {
  expo: {
    name: "Getme",
    slug: "getme",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "getme",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSMicrophoneUsageDescription: "需要访问麦克风以录制语音",
        NSPhotoLibraryUsageDescription: "需要存储权限以保存录音",
      },
    },
    android: {
      edgeToEdgeEnabled: true,
      package: "com.qgming.getme",
      permissions: [
        "RECORD_AUDIO",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
      ],
    },
    web: {
      output: "static",
    },
    plugins: [
      "expo-router",
      "expo-sqlite",
      "expo-font",
      [
        "expo-build-properties",
        {
          android: {
            jsEngine: "hermes",
            abiFilters: ["arm64-v8a"],
          },
          ios: {
            jsEngine: "hermes",
          },
        },
      ],
      "expo-audio",
      "expo-asset",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "e378138d-a0f1-4310-9b44-e4dc3a00c4f5",
      },
      SILICONFLOW_API_KEY: process.env.SILICONFLOW_API_KEY,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    },
    owner: "qgming",
    icon: "./assets/images/icon.png",
    splash: {
      image: "./assets/images/splash-icon.png",
      backgroundColor: "#34d399",
      resizeMode: "contain",
      dark: {
        image: "./assets/images/splash-icon.png",
        backgroundColor: "#000000",
        resizeMode: "contain",
      },
    },
  },
};
