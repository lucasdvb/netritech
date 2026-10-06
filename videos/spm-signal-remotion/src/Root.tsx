import { Composition } from "remotion";
import { Test } from "./Test";
export const Root = () => (
  <Composition id="Test" component={Test} durationInFrames={10} fps={30} width={1920} height={1080} />
);
