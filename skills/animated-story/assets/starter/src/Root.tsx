import React from "react";
import { Composition } from "remotion";
import { Example, EXAMPLE_FRAMES } from "./videos/example/Composition";

// One composition per video. 16:9 at 1920x1080 by default; for 9:16 use width 1080, height 1920 and re-frame cameras.
export const Root: React.FC = () => (
  <>
    <Composition id="Example" component={Example} durationInFrames={EXAMPLE_FRAMES} fps={30} width={1920} height={1080} />
  </>
);
