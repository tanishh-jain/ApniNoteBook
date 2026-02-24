import React, { useEffect, useState, useRef } from "react";
import { FaPaintBrush, FaEraser, FaTrash, FaUndo, FaRedo, FaShapes, FaEye, FaEyeSlash, FaFont, FaImage, FaArrowRight, FaLayerGroup, FaPalette } from "react-icons/fa";

const DrawingCanvas = ({ canvasRef, editorHeight = 2000, onCanvasChange, clearCanvasTrigger, setClearCanvasTrigger }) => {
  const [drawingState, setDrawingState] = useState({
    isDrawing: false,
    color: "#000000",
    lineWidth: 5,
    tool: "pen",
    brushStyle: "solid",
    opacity: 1,
    shapeType: "line",
    fillShape: false,
    showGrid: false,
    fontSize: 16,
    fontFamily: "Arial",
    textContent: "",
    backgroundColor: "#FFFFFF",
    textInput: null,
  });

  const [layers, setLayers] = useState([{ id: 1, visible: true, dataUrl: null }]);
  const [currentLayer, setCurrentLayer] = useState(1);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const lastPointRef = useRef(null);
  const containerRef = useRef(null);
  const isMountedRef = useRef(false);
  const layerImagesRef = useRef({}); // Cache for layer images

  const colorPresets = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
  ];

  const initCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const parentWidth = canvas.parentElement?.clientWidth || window.innerWidth;
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = parentWidth * pixelRatio;
    canvas.height = editorHeight * pixelRatio;
    canvas.style.width = `${parentWidth}px`;
    canvas.style.height = `${editorHeight}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(pixelRatio, pixelRatio);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = drawingState.color;
      ctx.lineWidth = drawingState.lineWidth;
      ctx.globalAlpha = drawingState.opacity;
      applyBrushStyle(ctx);
      ctx.fillStyle = drawingState.backgroundColor;
      ctx.fillRect(0, 0, parentWidth, editorHeight);
      const currentLayerData = layers.find(layer => layer.id === currentLayer)?.dataUrl;
      if (currentLayerData) {
        restoreState(currentLayer);
      } else {
        saveState();
      }
    }
  };

  const applyBrushStyle = (ctx) => {
    if (!ctx) return;
    if (drawingState.brushStyle === "dotted") {
      ctx.setLineDash([5, 10]);
    } else if (drawingState.brushStyle === "dashed") {
      ctx.setLineDash([15, 5]);
    } else {
      ctx.setLineDash([]);
    }
  };

  const saveState = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === currentLayer ? { ...layer, dataUrl } : layer
      )
    );
    setHistory((prev) => [...prev, { layerId: currentLayer, dataUrl }].slice(-50));
    setRedoStack([]);
    localStorage.setItem(`canvas_${currentLayer}`, dataUrl);
    if (onCanvasChange) onCanvasChange(dataUrl);

    // Cache the image
    if (!layerImagesRef.current[currentLayer]) {
      layerImagesRef.current[currentLayer] = new Image();
    }
    layerImagesRef.current[currentLayer].src = dataUrl;
  };

  const restoreState = (layerId) => {
    const dataUrl = layers.find(layer => layer.id === layerId)?.dataUrl;
    if (!canvasRef.current || !dataUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixelRatio = window.devicePixelRatio || 1;
    const logicalWidth = canvas.width / pixelRatio;
    const logicalHeight = canvas.height / pixelRatio;
    ctx.fillStyle = drawingState.backgroundColor;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    const img = layerImagesRef.current[layerId];
    if (img && img.complete) {
      ctx.drawImage(img, 0, 0, logicalWidth, logicalHeight);
      if (drawingState.showGrid) {
        drawGrid(ctx, logicalWidth, logicalHeight);
      }
      if (onCanvasChange) onCanvasChange(dataUrl);
    } else {
      const newImg = new Image();
      newImg.src = dataUrl;
      newImg.onload = () => {
        if (isMountedRef.current) {
          ctx.drawImage(newImg, 0, 0, logicalWidth, logicalHeight);
          if (drawingState.showGrid) {
            drawGrid(ctx, logicalWidth, logicalHeight);
          }
          if (onCanvasChange) onCanvasChange(dataUrl);
        }
      };
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixelRatio = window.devicePixelRatio || 1;
    const logicalWidth = canvas.width / pixelRatio;
    const logicalHeight = canvas.height / pixelRatio;
    ctx.fillStyle = drawingState.backgroundColor;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    saveState();
    if (setClearCanvasTrigger) setClearCanvasTrigger(0);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const currentState = history[history.length - 1];
    setRedoStack((prev) => [currentState, ...prev]);
    setHistory((prev) => prev.slice(0, -1));
    const previousState = history[history.length - 2];
    if (previousState) {
      setCurrentLayer(previousState.layerId);
      restoreState(previousState.layerId);
    } else {
      clearCanvas();
    }
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const state = redoStack[0];
    setHistory((prev) => [...prev, state]);
    setRedoStack((prev) => prev.slice(1));
    setCurrentLayer(state.layerId);
    restoreState(state.layerId);
  };

  const addLayer = () => {
    const newLayerId = Math.max(...layers.map(l => l.id), 0) + 1;
    setLayers([...layers, { id: newLayerId, visible: true, dataUrl: null }]);
    setCurrentLayer(newLayerId);
    setTimeout(() => clearCanvas(), 0);
  };

  const deleteLayer = (layerId) => {
    if (layers.length <= 1) return;
    const newLayers = layers.filter((layer) => layer.id !== layerId);
    setLayers(newLayers);
    if (currentLayer === layerId) {
      const newCurrentLayer = newLayers[0].id;
      setCurrentLayer(newCurrentLayer);
      restoreState(newCurrentLayer);
    }
  };

  const toggleLayerVisibility = (layerId) => {
    setLayers(layers.map((layer) =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
    redrawCanvas();
  };

  const redrawCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pixelRatio = window.devicePixelRatio || 1;
    const logicalWidth = canvas.width / pixelRatio;
    const logicalHeight = canvas.height / pixelRatio;
    ctx.fillStyle = drawingState.backgroundColor;
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    layers
      .filter((layer) => layer.visible && layer.dataUrl)
      .forEach((layer) => {
        const img = layerImagesRef.current[layer.id];
        if (img && img.complete) {
          ctx.drawImage(img, 0, 0, logicalWidth, logicalHeight);
        } else {
          const newImg = new Image();
          newImg.src = layer.dataUrl;
          newImg.onload = () => {
            if (isMountedRef.current) {
              ctx.drawImage(newImg, 0, 0, logicalWidth, logicalHeight);
            }
          };
        }
      });

    if (drawingState.showGrid) {
      drawGrid(ctx, logicalWidth, logicalHeight);
    }
  };

  const drawGrid = (ctx, width, height) => {
    const gridSize = 20;
    ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !canvasRef.current) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      if (!isMountedRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pixelRatio = window.devicePixelRatio || 1;
      const logicalWidth = canvas.width / pixelRatio;
      const logicalHeight = canvas.height / pixelRatio;
      const scale = Math.min(logicalWidth / img.width, logicalHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (logicalWidth - scaledWidth) / 2;
      const y = (logicalHeight - scaledHeight) / 2;
      addLayer();
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      saveState();
    };
  };

  const getCoordinates = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    const pixelRatio = window.devicePixelRatio || 1;
    return {
      x: (clientX - rect.left) * (canvasRef.current.width / rect.width) / pixelRatio,
      y: (clientY - rect.top) * (canvasRef.current.height / rect.height) / pixelRatio,
    };
  };

  const drawShape = (ctx, startX, startY, endX, endY, isPreview = false) => {
    ctx.beginPath();
    ctx.strokeStyle = drawingState.color;
    ctx.lineWidth = drawingState.lineWidth;
    ctx.globalAlpha = drawingState.opacity;
    applyBrushStyle(ctx);

    const width = endX - startX;
    const height = endY - startY;

    if (drawingState.shapeType === "line") {
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
    } else if (drawingState.shapeType === "rectangle") {
      if (drawingState.fillShape && !isPreview) {
        ctx.fillStyle = drawingState.color;
        ctx.fillRect(startX, startY, width, height);
      }
      ctx.strokeRect(startX, startY, width, height);
    } else if (drawingState.shapeType === "circle") {
      const radius = Math.sqrt(width * width + height * height);
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      if (drawingState.fillShape && !isPreview) {
        ctx.fillStyle = drawingState.color;
        ctx.fill();
      }
    } else if (drawingState.shapeType === "triangle") {
      ctx.moveTo(startX, startY + height);
      ctx.lineTo(startX + width, startY + height);
      ctx.lineTo(startX + width / 2, startY);
      ctx.closePath();
      if (drawingState.fillShape && !isPreview) {
        ctx.fillStyle = drawingState.color;
        ctx.fill();
      }
    } else if (drawingState.shapeType === "pentagon") {
      const radius = Math.sqrt(width * width + height * height);
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(
          startX + radius * Math.cos((i * 2 * Math.PI) / 5 - Math.PI / 2),
          startY + radius * Math.sin((i * 2 * Math.PI) / 5 - Math.PI / 2)
        );
      }
      ctx.closePath();
      if (drawingState.fillShape && !isPreview) {
        ctx.fillStyle = drawingState.color;
        ctx.fill();
      }
    } else if (drawingState.shapeType === "star") {
      const radius = Math.sqrt(width * width + height * height);
      const spikes = 5;
      const step = Math.PI / spikes;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? radius : radius / 2;
        ctx.lineTo(
          startX + r * Math.cos(i * step - Math.PI / 2),
          startY + r * Math.sin(i * step - Math.PI / 2)
        );
      }
      ctx.closePath();
      if (drawingState.fillShape && !isPreview) {
        ctx.fillStyle = drawingState.color;
        ctx.fill();
      }
    }
    ctx.stroke();
  };

  const drawArrow = (ctx, startX, startY, endX, endY) => {
    ctx.beginPath();
    ctx.strokeStyle = drawingState.color;
    ctx.lineWidth = drawingState.lineWidth;
    ctx.globalAlpha = drawingState.opacity;
    applyBrushStyle(ctx);
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    const angle = Math.atan2(endY - startY, endX - startX);
    ctx.lineTo(endX - 15 * Math.cos(angle - Math.PI / 6), endY - 15 * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - 15 * Math.cos(angle + Math.PI / 6), endY - 15 * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const startDrawing = (e) => {
    if (!canvasRef.current || !containerRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);

    if (drawingState.tool === "text") {
      const containerRect = containerRef.current.getBoundingClientRect();
      const screenX = (e.clientX || (e.touches && e.touches[0].clientX)) - containerRect.left;
      const screenY = (e.clientY || (e.touches && e.touches[0].clientY)) - containerRect.top;
      setDrawingState((prev) => ({
        ...prev,
        textInput: { screenX, screenY, canvasX: x, canvasY: y },
        textContent: "",
      }));
      return;
    }

    setDrawingState((prev) => ({ ...prev, isDrawing: true }));
    lastPointRef.current = { x, y };
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawingState.isDrawing || !canvasRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);

    ctx.globalCompositeOperation = drawingState.tool === "eraser" ? "destination-out" : "source-over";
    ctx.lineWidth = drawingState.tool === "eraser" ? drawingState.lineWidth * 2 : drawingState.lineWidth;
    ctx.strokeStyle = drawingState.color;
    ctx.globalAlpha = drawingState.opacity;
    applyBrushStyle(ctx);

    if (drawingState.tool === "pen" || drawingState.tool === "eraser") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (drawingState.tool === "shape" || drawingState.tool === "arrow") {
      restoreState(currentLayer);
      if (drawingState.tool === "shape") {
        drawShape(ctx, lastPointRef.current.x, lastPointRef.current.y, x, y, true);
      } else if (drawingState.tool === "arrow") {
        drawArrow(ctx, lastPointRef.current.x, lastPointRef.current.y, x, y);
      }
    }

    if (onCanvasChange) {
      clearTimeout(window.drawTimeout);
      window.drawTimeout = setTimeout(() => {
        if (isMountedRef.current) onCanvasChange(canvasRef.current.toDataURL("image/png"));
      }, 100);
    }
  };

  const stopDrawing = (e) => {
    if (!drawingState.isDrawing || !canvasRef.current) return;
    e.preventDefault();
    setDrawingState((prev) => ({ ...prev, isDrawing: false }));
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = drawingState.lineWidth;

    if (drawingState.tool === "shape" || drawingState.tool === "arrow") {
      const endPoint = getCoordinates(e);
      restoreState(currentLayer);
      if (drawingState.tool === "shape") {
        drawShape(ctx, lastPointRef.current.x, lastPointRef.current.y, endPoint.x, endPoint.y);
      } else if (drawingState.tool === "arrow") {
        drawArrow(ctx, lastPointRef.current.x, lastPointRef.current.y, endPoint.x, endPoint.y);
      }
    }
    saveState();
  };

  const addText = () => {
    if (!drawingState.textContent.trim() || !drawingState.textInput || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    restoreState(currentLayer);
    ctx.font = `${drawingState.fontSize}px ${drawingState.fontFamily}`;
    ctx.fillStyle = drawingState.color;
    ctx.globalAlpha = drawingState.opacity;
    ctx.fillText(drawingState.textContent, drawingState.textInput.canvasX, drawingState.textInput.canvasY);
    ctx.globalAlpha = 1;
    saveState();
    setDrawingState((prev) => ({ ...prev, textContent: "", textInput: null }));
  };

  useEffect(() => {
    isMountedRef.current = true;
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener("resize", initCanvas);
    };
  }, [layers, currentLayer]);

  useEffect(() => {
    if (clearCanvasTrigger > 0) clearCanvas();
  }, [clearCanvasTrigger]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = drawingState.color;
    ctx.lineWidth = drawingState.lineWidth;
    ctx.globalAlpha = drawingState.opacity;
    applyBrushStyle(ctx);
  }, [drawingState.color, drawingState.lineWidth, drawingState.brushStyle, drawingState.opacity]);

  useEffect(() => {
    redrawCanvas();
  }, [drawingState.showGrid, layers, currentLayer]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, redoStack]);

  useEffect(() => {
    const autoSave = setInterval(() => {
      if (canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL("image/png");
        localStorage.setItem(`canvas_${currentLayer}_auto`, dataUrl);
      }
    }, 30000);
    return () => clearInterval(autoSave);
  }, [currentLayer]);

  return (
    <div className="w-full bg-gray-900/50 rounded-xl p-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-800/50 p-4 rounded-xl border-2 border-purple-500">
          <div className="flex flex-col gap-2">
            <label className="text-white text-sm font-semibold flex items-center gap-1">
              <FaPalette className="text-purple-400" /> Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full border-2 border-gray-600 hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: color }}
                  onClick={() => setDrawingState((prev) => ({ ...prev, color }))}
                  title={`Select ${color}`}
                />
              ))}
              <input
                type="color"
                value={drawingState.color}
                onChange={(e) => setDrawingState((prev) => ({ ...prev, color: e.target.value }))}
                className="w-8 h-8 rounded-lg cursor-pointer shadow-lg hover:scale-110 transition-transform duration-300"
                title="Custom Color"
              />
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={drawingState.opacity}
              onChange={(e) => setDrawingState((prev) => ({ ...prev, opacity: parseFloat(e.target.value) }))}
              className="w-full accent-purple-500"
              title="Opacity"
            />
            <label className="text-white text-sm font-semibold flex items-center gap-1 mt-2">
              <FaPalette className="text-purple-400" /> Background
            </label>
            <input
              type="color"
              value={drawingState.backgroundColor}
              onChange={(e) => {
                setDrawingState((prev) => ({ ...prev, backgroundColor: e.target.value }));
                redrawCanvas();
              }}
              className="w-8 h-8 rounded-lg cursor-pointer shadow-lg hover:scale-110 transition-transform duration-300"
              title="Background Color"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white text-sm font-semibold flex items-center gap-1">
              <FaPaintBrush className="text-purple-400" /> Tools
            </label>
            <select
              value={drawingState.tool}
              onChange={(e) => setDrawingState((prev) => ({ ...prev, tool: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 hover:bg-gray-600"
              title="Select Tool"
            >
              <option value="pen">Pen</option>
              <option value="eraser">Eraser</option>
              <option value="shape">Shape</option>
              <option value="text">Text</option>
              <option value="arrow">Arrow</option>
            </select>
            <select
              value={drawingState.brushStyle}
              onChange={(e) => setDrawingState((prev) => ({ ...prev, brushStyle: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 hover:bg-gray-600"
              title="Brush Style"
            >
              <option value="solid">Solid</option>
              <option value="dotted">Dotted</option>
              <option value="dashed">Dashed</option>
            </select>
            <select
              value={drawingState.lineWidth}
              onChange={(e) => setDrawingState((prev) => ({ ...prev, lineWidth: parseInt(e.target.value) }))}
              className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 hover:bg-gray-600"
              title="Line Width"
            >
              <option value="2">2px</option>
              <option value="5">5px</option>
              <option value="10">10px</option>
              <option value="20">20px</option>
            </select>
            {(drawingState.tool === "shape" || drawingState.tool === "text") && (
              <>
                {drawingState.tool === "shape" && (
                  <>
                    <label className="text-white text-sm font-semibold flex items-center gap-1">
                      <FaShapes className="text-purple-400" /> Shape
                    </label>
                    <select
                      value={drawingState.shapeType}
                      onChange={(e) => setDrawingState((prev) => ({ ...prev, shapeType: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 hover:bg-gray-600"
                      title="Select Shape"
                    >
                      <option value="line">Line</option>
                      <option value="rectangle">Rectangle</option>
                      <option value="circle">Circle</option>
                      <option value="triangle">Triangle</option>
                      <option value="pentagon">Pentagon</option>
                      <option value="star">Star</option>
                    </select>
                    <label className="flex items-center gap-1 text-white text-sm">
                      <input
                        type="checkbox"
                        checked={drawingState.fillShape}
                        onChange={(e) => setDrawingState((prev) => ({ ...prev, fillShape: e.target.checked }))}
                        className="accent-purple-500"
                        title="Fill Shape"
                      />
                      Fill
                    </label>
                  </>
                )}
                {drawingState.tool === "text" && (
                  <>
                    <label className="text-white text-sm font-semibold flex items-center gap-1">
                      <FaFont className="text-purple-400" /> Text
                    </label>
                    <select
                      value={drawingState.fontSize}
                      onChange={(e) => setDrawingState((prev) => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                      className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 hover:bg-gray-600"
                      title="Font Size"
                    >
                      <option value="12">12px</option>
                      <option value="16">16px</option>
                      <option value="24">24px</option>
                      <option value="32">32px</option>
                    </select>
                    <select
                      value={drawingState.fontFamily}
                      onChange={(e) => setDrawingState((prev) => ({ ...prev, fontFamily: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-gray-700 text-white border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 hover:bg-gray-600"
                      title="Font Family"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-white text-sm font-semibold flex items-center gap-1">
              <FaLayerGroup className="text-purple-400" /> Actions
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={undo}
                disabled={history.length <= 1}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all duration-300 hover:scale-105"
                title="Undo"
              >
                <FaUndo />
              </button>
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-all duration-300 hover:scale-105"
                title="Redo"
              >
                <FaRedo />
              </button>
              <button
                onClick={clearCanvas}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 hover:scale-105"
                title="Clear Canvas"
              >
                <FaTrash />
              </button>
              <button
                onClick={() => setDrawingState((prev) => ({ ...prev, showGrid: !prev.showGrid }))}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 hover:scale-105"
                title={drawingState.showGrid ? "Hide Grid" : "Show Grid"}
              >
                {drawingState.showGrid ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button
                onClick={() => document.getElementById("image-upload")?.click()}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 hover:scale-105"
                title="Upload Image"
              >
                <FaImage />
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-white text-sm font-semibold">Layers:</label>
              {layers.map((layer) => (
                <div key={layer.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={currentLayer === layer.id}
                    onChange={() => {
                      setCurrentLayer(layer.id);
                      restoreState(layer.id);
                    }}
                    className="accent-purple-500"
                    title={`Select Layer ${layer.id}`}
                  />
                  <span className="text-white">Layer {layer.id}</span>
                  <button
                    onClick={() => toggleLayerVisibility(layer.id)}
                    className="p-1 text-white hover:text-purple-400"
                    title={layer.visible ? "Hide Layer" : "Show Layer"}
                  >
                    {layer.visible ? <FaEye /> : <FaEyeSlash />}
                  </button>
                  <button
                    onClick={() => deleteLayer(layer.id)}
                    disabled={layers.length === 1}
                    className="p-1 text-white hover:text-red-400 disabled:opacity-50"
                    title="Delete Layer"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                onClick={addLayer}
                className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 hover:scale-105"
                title="Add New Layer"
              >
                + Layer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 my-4">
        <span className="text-white text-sm">Preview:</span>
        <canvas
          width="30"
          height="30"
          className="border border-purple-500 rounded"
          ref={(el) => {
            if (el) {
              const ctx = el.getContext("2d");
              if (ctx) {
                ctx.clearRect(0, 0, 30, 30);
                ctx.strokeStyle = drawingState.color;
                ctx.lineWidth = drawingState.lineWidth;
                ctx.globalAlpha = drawingState.opacity;
                applyBrushStyle(ctx);
                ctx.beginPath();
                ctx.moveTo(5, 15);
                ctx.lineTo(25, 15);
                ctx.stroke();
              }
            }
          }}
        />
      </div>

      <div ref={containerRef} style={{ position: "relative", height: "80vh", overflowY: "auto" }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full rounded-xl border-2 border-purple-500"
          style={{ touchAction: "none", backgroundColor: drawingState.backgroundColor }}
        />
        {drawingState.textInput && (
          <input
            type="text"
            value={drawingState.textContent}
            onChange={(e) => setDrawingState((prev) => ({ ...prev, textContent: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") addText();
            }}
            onBlur={addText}
            style={{
              position: "absolute",
              left: `${drawingState.textInput.screenX}px`,
              top: `${drawingState.textInput.screenY}px`,
              fontSize: `${drawingState.fontSize}px`,
              fontFamily: drawingState.fontFamily,
              color: drawingState.color,
              background: "rgba(255, 255, 255, 0.8)",
              border: "1px solid #ccc",
              padding: "2px",
              zIndex: 10,
            }}
            autoFocus
          />
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
        id="image-upload"
      />
    </div>
  );
};

export default DrawingCanvas;