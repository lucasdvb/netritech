import { Composition } from "remotion";
import { SpmSignal } from "./SpmSignal";
import { DURATION, FPS, HEIGHT, WIDTH } from "./theme";

export const Root: React.FC = () => (
  <Composition id="SpmSignal" component={SpmSignal} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
