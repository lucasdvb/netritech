import { useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import {
  BloomEffect,
  DepthOfFieldEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from "postprocessing";
import { HalfFloatType } from "three";
import { worldAt } from "../lib/world";

/** Layer the R3F default camera is parked on, so Remotion's advance() draws nothing twice. */
const PARKED = 31;

/**
 * Deterministic post stack built on `postprocessing` directly.
 * @react-three/postprocessing adds its passes in a passive effect, which runs after
 * Remotion's advance() on a still, so it would render an empty frame. Here the composer
 * exists synchronously and renders in an effect keyed on the frame, after advance()
 * has updated the reflector and environment. Order: render -> DoF -> bloom -> vignette -> ACES.
 */
export const Post: React.FC<{ multisampling?: number }> = ({ multisampling = 4 }) => {
  const frame = useCurrentFrame();
  const { gl, scene, camera, size } = useThree();

  const fx = useMemo(() => {
    const composer = new EffectComposer(gl, { frameBufferType: HalfFloatType, multisampling });
    composer.addPass(new RenderPass(scene, camera));
    const dof = new DepthOfFieldEffect(camera, { worldFocusDistance: 1, worldFocusRange: 0.4, bokehScale: 3, resolutionScale: 0.5 });
    const dofPass = new EffectPass(camera, dof);
    composer.addPass(dofPass);
    const bloom = new BloomEffect({ mipmapBlur: true, luminanceThreshold: 0.82, luminanceSmoothing: 0.25, intensity: 1.15, radius: 0.72, levels: 7 });
    const vignette = new VignetteEffect({ offset: 0.32, darkness: 0.55 });
    const tone = new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC });
    composer.addPass(new EffectPass(camera, bloom, vignette, tone));
    return { composer, dof, dofPass, bloom };
  }, [gl, scene, camera, multisampling]);

  useLayoutEffect(() => {
    fx.composer.setSize(size.width, size.height);
  }, [fx, size.width, size.height]);

  const w = worldAt(frame);
  useLayoutEffect(() => {
    camera.layers.set(PARKED);
    fx.dofPass.enabled = w.dof > 0.02;
    fx.dof.cocMaterial.focusDistance = w.cam.focus;
    fx.dof.cocMaterial.focusRange = Math.max(0.1, w.cam.focus * 0.36);
    fx.dof.bokehScale = w.dof;
    // lines carry the light after the drain; let them bloom a touch more
    fx.bloom.intensity = 1.0 + 0.5 * (1 - w.warm);
  });

  useEffect(() => {
    camera.layers.set(0);
    fx.composer.render();
    camera.layers.set(PARKED);
  }, [frame, fx, camera]);

  return null;
};
