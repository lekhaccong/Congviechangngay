import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "pro.congviec.app",
  appName: "CongViecPro",
  webDir: "native-www",
  android: {
    allowMixedContent: true,
    backgroundColor: "#0c0d0f",
  },
  server: {
    androidScheme: "https",
  },
};

export default config;
