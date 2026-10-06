import { Config } from "@remotion/cli/config";

// Stills and frames are captured as PNG so the opening and closing frames stay lossless.
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setCrf(16);
Config.setMuted(true);
// WebGL runs on ANGLE/SwiftShader in headless Chromium
Config.setBrowserExecutable(
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
);
Config.setChromiumOpenGlRenderer("angle");
