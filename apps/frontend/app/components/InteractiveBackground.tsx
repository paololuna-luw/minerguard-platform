"use client";

import { useEffect, useRef } from "react";

type NodePoint = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  phase: number;
  radius: number;
};

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const drawingCanvas: HTMLCanvasElement = canvas;

    const context = drawingCanvas.getContext("2d");
    if (!context) return;
    const drawingContext: CanvasRenderingContext2D = context;

    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.45,
      active: false
    };

    let points: NodePoint[] = [];
    let animationFrame = 0;
    let pixelRatio = 1;

    function resize() {
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      drawingCanvas.width = Math.floor(window.innerWidth * pixelRatio);
      drawingCanvas.height = Math.floor(window.innerHeight * pixelRatio);
      drawingCanvas.style.width = `${window.innerWidth}px`;
      drawingCanvas.style.height = `${window.innerHeight}px`;
      drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const count = Math.min(82, Math.max(36, Math.floor((window.innerWidth * window.innerHeight) / 23000)));
      points = Array.from({ length: count }, (_, index) => {
        const column = index % Math.ceil(Math.sqrt(count * 1.8));
        const row = Math.floor(index / Math.ceil(Math.sqrt(count * 1.8)));
        const spreadX = window.innerWidth / Math.ceil(Math.sqrt(count * 1.8));
        const spreadY = window.innerHeight / Math.ceil(count / Math.ceil(Math.sqrt(count * 1.8)));
        const baseX = spreadX * (column + 0.55) + (Math.random() - 0.5) * spreadX * 0.9;
        const baseY = spreadY * (row + 0.55) + (Math.random() - 0.5) * spreadY * 0.9;

        return {
          x: baseX,
          y: baseY,
          baseX,
          baseY,
          vx: 0,
          vy: 0,
          phase: Math.random() * Math.PI * 2,
          radius: 1.4 + Math.random() * 1.8
        };
      });
    }

    function drawFilament(start: NodePoint, end: NodePoint, time: number, opacity: number) {
      const midX = (start.x + end.x) * 0.5;
      const midY = (start.y + end.y) * 0.5;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const distance = Math.hypot(dx, dy) || 1;
      const wave = Math.sin(time * 0.0012 + start.phase + end.phase) * 18;
      const controlX = midX + (-dy / distance) * wave;
      const controlY = midY + (dx / distance) * wave;

      drawingContext.beginPath();
      drawingContext.moveTo(start.x, start.y);
      drawingContext.quadraticCurveTo(controlX, controlY, end.x, end.y);
      drawingContext.strokeStyle = `rgba(47, 111, 115, ${opacity})`;
      drawingContext.lineWidth = 0.85;
      drawingContext.stroke();
    }

    function frame(time: number) {
      drawingContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const point of points) {
        const idleX = Math.cos(time * 0.00032 + point.phase) * 12;
        const idleY = Math.sin(time * 0.00038 + point.phase) * 10;
        const targetX = point.baseX + idleX;
        const targetY = point.baseY + idleY;
        const pointerDx = point.x - pointer.x;
        const pointerDy = point.y - pointer.y;
        const pointerDistance = Math.hypot(pointerDx, pointerDy);

        if (pointer.active && pointerDistance < 170) {
          const force = (1 - pointerDistance / 170) * 1.8;
          point.vx += (pointerDx / Math.max(pointerDistance, 1)) * force;
          point.vy += (pointerDy / Math.max(pointerDistance, 1)) * force;
        }

        point.vx += (targetX - point.x) * 0.008;
        point.vy += (targetY - point.y) * 0.008;
        point.vx *= 0.91;
        point.vy *= 0.91;
        point.x += point.vx;
        point.y += point.vy;
      }

      for (let index = 0; index < points.length; index += 1) {
        const start = points[index];
        for (let nextIndex = index + 1; nextIndex < points.length; nextIndex += 1) {
          const end = points[nextIndex];
          const distance = Math.hypot(start.x - end.x, start.y - end.y);
          if (distance < 150) {
            drawFilament(start, end, time, Math.max(0, 0.16 - distance / 1100));
          }
        }
      }

      for (const point of points) {
        drawingContext.beginPath();
        drawingContext.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        drawingContext.fillStyle = "rgba(47, 111, 115, 0.32)";
        drawingContext.fill();
      }

      animationFrame = window.requestAnimationFrame(frame);
    }

    function handlePointerMove(event: PointerEvent) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }

    function handlePointerLeave() {
      pointer.active = false;
    }

    resize();
    animationFrame = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="interactive-network-canvas" aria-hidden="true" />;
}
