import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { NoToneMapping } from "three";
import { Agents } from "./components/Agents";
import { CameraRig } from "./components/CameraRig";
import { Finale } from "./components/Finale";
import { Grade } from "./components/Grade";
import { Headset } from "./components/Headset";
import { Panels } from "./components/Panels";
import { Pods } from "./components/Pods";
import { Post } from "./components/Post";
import { Ribbons } from "./components/Ribbons";
import { Scene } from "./components/Scene";
import { Signal } from "./components/Signal";
import { cues } from "./theme";
import { ease, ramp } from "./lib/math";

/**
 * SPM "The Signal": one customer call becomes a whole team's response.
 * 8 s, 1920x1080, 30 fps, 100% code. Every frame is a pure function of useCurrentFrame().
 */
export const SpmSignal: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const canvasOpacity = 1 - ramp(frame, cues.finaleOut, cues.gridFull, ease.inOutSine);
  return (
    <AbsoluteFill style={{ backgroundColor: "#010101" }}>
      <AbsoluteFill style={{ opacity: canvasOpacity }}>
        <ThreeCanvas
          width={width}
          height={height}
          dpr={1}
          shadows="soft"
          gl={{ antialias: false, toneMapping: NoToneMapping, powerPreference: "high-performance", stencil: false }}
          camera={{ position: [0, 1, 3], fov: 30, near: 0.03, far: 260 }}
        >
          <CameraRig />
          <Scene />
          <Headset />
          <Pods />
          <Agents />
          <Ribbons />
          <Signal />
          <Finale />
          <Post />
        </ThreeCanvas>
      </AbsoluteFill>
      <Panels />
      <Grade />
    </AbsoluteFill>
  );
};
