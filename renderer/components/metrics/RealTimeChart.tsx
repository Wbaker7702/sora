import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";

interface ChartData {
  timestamp: number;
  value: number;
  label: string;
}

interface RealTimeChartProps {
  data: ChartData[];
  title: string;
  description?: string;
  color?: string;
  maxDataPoints?: number;
}

export default function RealTimeChart({ 
  data, 
  title, 
  description, 
  color = "#3b82f6",
  maxDataPoints = 20 
}: RealTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (data.length === 0) return;

    // Find min and max values
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Draw grid lines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (rect.height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(rect.width, y);
      ctx.stroke();
    }

    // Draw chart line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = (rect.width / (data.length - 1)) * index;
      const y = rect.height - ((point.value - minValue) / range) * rect.height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw data points
    ctx.fillStyle = color;
    data.forEach((point, index) => {
      const x = (rect.width / (data.length - 1)) * index;
      const y = rect.height - ((point.value - minValue) / range) * rect.height;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw labels
    ctx.fillStyle = "#6b7280";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range / 5) * (5 - i);
      const y = (rect.height / 5) * i;
      ctx.fillText(Math.round(value).toString(), 30, y + 4);
    }

    // X-axis labels (time)
    data.forEach((point, index) => {
      if (index % Math.ceil(data.length / 5) === 0) {
        const x = (rect.width / (data.length - 1)) * index;
        const time = new Date(point.timestamp).toLocaleTimeString();
        ctx.fillText(time, x, rect.height - 5);
      }
    });

  }, [data, color]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-64"
            style={{ width: "100%", height: "256px" }}
          />
          <div className="absolute top-2 right-2 text-sm text-muted-foreground">
            {data.length} data points
          </div>
        </div>
      </CardContent>
    </Card>
  );
}