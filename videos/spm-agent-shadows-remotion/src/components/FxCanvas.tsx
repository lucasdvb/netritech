import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { H, W } from "../theme";

export type Halation = { blur: number; alpha: number }[];

type Props = {
  readonly name: string;
  /** Draws the layer for the current frame into a cleared 1920x1080 context. */
  readonly draw: (ctx: CanvasRenderingContext2D) => void;
  /** Soft glow passes laid under the sharp drawing (film halation around light sources). */
  readonly halation?: Halation;
  readonly blend?: React.CSSProperties["mixBlendMode"];
  readonly style?: React.CSSProperties;
};

/**
 * A full-frame canvas redrawn synchronously on every frame (useLayoutEffect runs before
 * Remotion captures the frame). Drawing goes to an offscreen buffer first so halation passes
 * can reuse it.
 */
export const FxCanvas: React.FC<Props> = ({ name, draw, halation, blend = "plus-lighter", style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const buf = useRef<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    const out = ref.current?.getContext("2d");
    if (!out) return;
    if (!buf.current) {
      buf.current = document.createElement("canvas");
      buf.current.width = W;
      buf.current.height = H;
    }
    const b = buf.current.getContext("2d");
    if (!b) return;
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalAlpha = 1;
    b.globalCompositeOperation = "source-over";
    b.filter = "none";
    b.clearRect(0, 0, W, H);
    draw(b);
    out.clearRect(0, 0, W, H);
    for (const pass of halation ?? []) {
      out.save();
      out.filter = `blur(${pass.blur}px)`;
      out.globalAlpha = pass.alpha;
      out.globalCompositeOperation = "lighter";
      out.drawImage(buf.current, 0, 0);
      out.restore();
    }
    out.globalCompositeOperation = "lighter";
    out.drawImage(buf.current, 0, 0);
    out.globalCompositeOperation = "source-over";
  });

  return (
    <AbsoluteFill style={{ mixBlendMode: blend, pointerEvents: "none", ...style }}>
      <canvas data-layer={name} ref={ref} width={W} height={H} style={{ width: W, height: H }} />
    </AbsoluteFill>
  );
};
