import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface SignaturePadHandle {
  [x: string]: unknown;
  clear: () => void;
  getDataURL: () => string | null;
  hasDrawing: () => boolean;
}

interface SignaturePadProps {
  width?: number;
  height?: number;
  className?: string;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  ({ width = 500, height = 200, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawing, setHasDrawing] = useState(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext("2d");
      if (!context) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.scale(dpr, dpr);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.lineWidth = 2;
      context.strokeStyle = "#0f172a";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }, [width, height]);

    const getContext = () => canvasRef.current?.getContext("2d");

    const getCoordinates = (event: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const handlePointerDown = (
      event: React.PointerEvent<HTMLCanvasElement>,
    ) => {
      event.preventDefault();
      const position = getCoordinates(event);
      if (!position) return;
      const context = getContext();
      if (!context) return;

      setIsDrawing(true);
      setHasDrawing(true);
      lastPointRef.current = position;
      canvasRef.current?.setPointerCapture(event.pointerId);
      context.beginPath();
      context.moveTo(position.x, position.y);
    };

    const handlePointerMove = (
      event: React.PointerEvent<HTMLCanvasElement>,
    ) => {
      if (!isDrawing) return;
      const position = getCoordinates(event);
      const context = getContext();
      if (!position || !context) return;

      context.lineTo(position.x, position.y);
      context.stroke();
    };

    const endDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      canvasRef.current?.releasePointerCapture(event.pointerId);
      setIsDrawing(false);
      lastPointRef.current = null;
    };

    const clear = useCallback(() => {
      const context = getContext();
      if (!context || !canvasRef.current) return;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      setHasDrawing(false);
    }, [height, width]);

    useImperativeHandle(
      ref,
      () => ({
        clear,
        getDataURL: () => canvasRef.current?.toDataURL("image/png") ?? null,
        hasDrawing: () => hasDrawing,
      }),
      [clear, hasDrawing],
    );

    return (
      <canvas
        ref={canvasRef}
        className={className}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrawing}
        onPointerLeave={endDrawing}
      />
    );
  },
);

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
