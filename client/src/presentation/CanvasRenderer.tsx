import React from "react";

// Pure presentational component that renders the battlefield canvas.
// The heavy rendering side-effects (animation, drawing) remain in BattleSimulation for
// now but will be migrated here in later refactor steps. For the current split we
// expose the <canvas> element via `ref` so existing logic that relies on the ref can
// continue to function without changes.

type CanvasRendererProps = React.CanvasHTMLAttributes<HTMLCanvasElement> & {
  forwardedRef: React.Ref<HTMLCanvasElement>;
};

function CanvasRendererInternal({ forwardedRef, ...rest }: CanvasRendererProps) {
  return (
    <canvas
      ref={forwardedRef as React.RefObject<HTMLCanvasElement>}
      {...rest}
    />
  );
}

/**
 * CanvasRenderer is a simple wrapper that isolates the pure JSX markup of the
 * battlefield canvas.  All behavioural logic will gradually migrate out of
 * BattleSimulation into dedicated hooks/components so that the rendering layer
 * stays declarative.
 */
const CanvasRenderer = React.forwardRef<HTMLCanvasElement, React.CanvasHTMLAttributes<HTMLCanvasElement>>(function CanvasRenderer(props, ref) {
  return <CanvasRendererInternal {...props} forwardedRef={ref} />;
});

export default CanvasRenderer; 