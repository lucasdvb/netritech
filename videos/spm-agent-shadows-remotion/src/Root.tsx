import React from "react";
import { Composition } from "remotion";
import { SpmAgentShadows } from "./SpmAgentShadows";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="SpmAgentShadows"
      component={SpmAgentShadows}
      durationInFrames={240}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
