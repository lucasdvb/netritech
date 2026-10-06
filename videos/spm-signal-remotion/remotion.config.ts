import { Config } from "@remotion/cli/config";

// WebGL needs a software GL in this headless sandbox: swangle (SwiftShader via ANGLE) is the
// fastest working backend here; the full Chromium build will not launch headless.
Config.setChromiumOpenGlRenderer("swangle");
Config.setBrowserExecutable("/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell");
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setCrf(16);
Config.setMuted(true);
Config.setDelayRenderTimeoutInMilliseconds(120000);
