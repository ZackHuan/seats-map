import React, { useState, useRef } from 'react';

const GRID_SIZE = 20;
const SELECTION_BORDER_OFFSET = -10;
const SEAT_WIDTH = 32;
const SEAT_HALF_WIDTH = SEAT_WIDTH / 2;
const STAGE_WIDTH = 200;

// Type definitions
type ItemType = 'row' | 'block' | 'group';

interface BaseItem {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ItemType;
}

interface RowItem extends BaseItem {
  type: 'row';
  seats: number;
  rotation: number;
  curve: number;
}

interface BlockItem extends BaseItem {
  type: 'block';
  name: string;
}

interface GroupItem extends BaseItem {
  type: 'group';
  name: string;
}

type Item = RowItem | BlockItem | GroupItem;

interface Position {
  x: number;
  y: number;
}

interface CanvasItemProps {
  item: Item;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

interface SeatRowProps {
  item: RowItem;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

interface BlockProps {
  item: BlockItem;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

interface GroupProps {
  item: GroupItem;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

// Helper function to generate grid background style
const getGridBackgroundStyle = (gridSize: number): React.CSSProperties => ({
  backgroundImage: `
    repeating-linear-gradient(0deg, transparent, transparent ${gridSize - 1}px, rgba(100, 116, 139, 0.3) ${gridSize - 1}px, rgba(100, 116, 139, 0.3) ${gridSize}px),
    repeating-linear-gradient(90deg, transparent, transparent ${gridSize - 1}px, rgba(100, 116, 139, 0.3) ${gridSize - 1}px, rgba(100, 116, 139, 0.3) ${gridSize}px)
  `,
  backgroundColor: '#1a202c',
});

const SeatMap = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [drawingMode, setDrawingMode] = useState<ItemType | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Position | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Snap to grid helper
  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Add a new item based on drawing mode
  const createItem = (x: number, y: number, width = 100, height = 50) => {
    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);

    let newItem: Item;

    if (drawingMode === 'row') {
      newItem = {
        id: Date.now(),
        x: snappedX,
        y: snappedY,
        width,
        height,
        type: 'row',
        seats: 10,
        rotation: 0,
        curve: 0,
      };
    } else if (drawingMode === 'block') {
      newItem = {
        id: Date.now(),
        x: snappedX,
        y: snappedY,
        width,
        height,
        type: 'block',
        name: 'Block ' + (items.filter((i) => i.type === 'block').length + 1),
      };
    } else if (drawingMode === 'group') {
      newItem = {
        id: Date.now(),
        x: snappedX,
        y: snappedY,
        width,
        height,
        type: 'group',
        name: 'Group ' + (items.filter((i) => i.type === 'group').length + 1),
      };
    } else {
      // Default to row if no drawing mode
      newItem = {
        id: Date.now(),
        x: snappedX,
        y: snappedY,
        width,
        height,
        type: 'row',
        seats: 10,
        rotation: 0,
        curve: 0,
      };
    }

    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Handle canvas mouse down
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only handle clicks on the SVG canvas itself, not on its children
    if ((e.target as HTMLElement).tagName.toLowerCase() !== 'svg' && e.target !== canvasRef.current)
      return;

    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (drawingMode) {
      setIsDrawing(true);
      setDrawStart({ x: mouseX, y: mouseY });
    } else {
      // Deselect if clicking on empty canvas
      setSelectedItemId(null);
    }
  };

  // Handle mouse down on an item
  const handleItemMouseDown = (e: React.MouseEvent, itemId: number) => {
    e.stopPropagation();
    const item = items.find((i) => i.id === itemId);
    if (!item || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDraggingItemId(itemId);
    setSelectedItemId(itemId);
    setDragOffset({ x: mouseX - item.x, y: mouseY - item.y });
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggingItemId) {
      const newX = snapToGrid(mouseX - dragOffset.x);
      const newY = snapToGrid(mouseY - dragOffset.y);

      setItems(
        items.map((item) => (item.id === draggingItemId ? { ...item, x: newX, y: newY } : item))
      );
    }
  };

  // Handle mouse up
  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDrawing && drawStart && drawingMode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const x = Math.min(drawStart.x, mouseX);
      const y = Math.min(drawStart.y, mouseY);
      const width = Math.max(Math.abs(mouseX - drawStart.x), 100);
      const height = Math.max(Math.abs(mouseY - drawStart.y), 50);

      createItem(x, y, width, height);
      setIsDrawing(false);
      setDrawStart(null);
    }
    setDraggingItemId(null);
  };

  // Update item property
  const updateItem = (itemId: number, property: string, value: string | number) => {
    // Parse numeric strings to numbers
    const parsedValue =
      typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : value;

    setItems(
      items.map((item) => (item.id === itemId ? { ...item, [property]: parsedValue } : item))
    );
  };

  // Delete item
  const deleteItem = (itemId: number) => {
    setItems(items.filter((item) => item.id !== itemId));
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  };

  // Get selected item
  const selectedItem = items.find((item) => item.id === selectedItemId);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Top Toolbox */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center gap-4">
        <h1 className="text-xl font-bold mr-4">Seat Map Designer</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setDrawingMode(drawingMode === 'row' ? null : 'row')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              drawingMode === 'row'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🪑 Seat Row
          </button>

          <button
            onClick={() => setDrawingMode(drawingMode === 'block' ? null : 'block')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              drawingMode === 'block'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ⬛ Block
          </button>

          <button
            onClick={() => setDrawingMode(drawingMode === 'group' ? null : 'group')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              drawingMode === 'group'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📦 Group
          </button>
        </div>

        <div className="ml-auto text-sm text-gray-400">
          {drawingMode
            ? `Drawing mode: ${drawingMode} - Click and drag on canvas`
            : 'Select a tool or click items to edit'}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Properties Panel */}
        {selectedItem && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Properties</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">Type</label>
                <div className="px-3 py-2 bg-gray-700 rounded-lg text-white capitalize">
                  {selectedItem.type}
                </div>
              </div>

              {selectedItem.type === 'row' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Number of Seats: {selectedItem.seats}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={selectedItem.seats}
                      onChange={(e) => updateItem(selectedItem.id, 'seats', e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Rotation: {selectedItem.rotation}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedItem.rotation}
                      onChange={(e) => updateItem(selectedItem.id, 'rotation', e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Curve: {selectedItem.curve}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={selectedItem.curve}
                      onChange={(e) => updateItem(selectedItem.id, 'curve', e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </>
              )}

              {(selectedItem.type === 'block' || selectedItem.type === 'group') && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Name</label>
                    <input
                      type="text"
                      value={selectedItem.name || ''}
                      onChange={(e) => updateItem(selectedItem.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Width: {selectedItem.width}px
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      value={selectedItem.width}
                      onChange={(e) => updateItem(selectedItem.id, 'width', e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Height: {selectedItem.height}px
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="300"
                      value={selectedItem.height}
                      onChange={(e) => updateItem(selectedItem.id, 'height', e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">X</label>
                    <input
                      type="number"
                      value={selectedItem.x}
                      onChange={(e) => updateItem(selectedItem.id, 'x', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Y</label>
                    <input
                      type="number"
                      value={selectedItem.y}
                      onChange={(e) => updateItem(selectedItem.id, 'y', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteItem(selectedItem.id)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 mt-4"
              >
                Delete {selectedItem.type}
              </button>
            </div>
          </div>
        )}

        {/* Main Canvas */}
        <div className="flex-1 overflow-hidden relative" style={getGridBackgroundStyle(GRID_SIZE)}>
          <svg
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Define gradients and patterns */}
            <defs>
              <linearGradient id="stageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#9333ea', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
              </linearGradient>
            </defs>

            {/* Stage */}
            <g>
              <rect
                x="50%"
                y="32"
                width={STAGE_WIDTH}
                height="48"
                rx="8"
                fill="url(#stageGradient)"
                filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
                transform={`translate(-${STAGE_WIDTH / 2}, 0)`}
              />
              <text x="50%" y="60" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">
                STAGE
              </text>
            </g>

            {/* Render items */}
            {items.map((item) => (
              <CanvasItem
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                onMouseDown={(e) => handleItemMouseDown(e, item.id)}
              />
            ))}

            {/* Empty state text */}
            {items.length === 0 && !isDrawing && (
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                fill="#6b7280"
                fontSize="20"
                style={{ pointerEvents: 'none' }}
              >
                Select a tool from the toolbar and click & drag to create items
              </text>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

// Canvas Item Component - Renders different types of items
const CanvasItem: React.FC<CanvasItemProps> = ({ item, isSelected, onMouseDown }) => {
  if (item.type === 'row') {
    return <SeatRow item={item} isSelected={isSelected} onMouseDown={onMouseDown} />;
  } else if (item.type === 'block') {
    return <Block item={item} isSelected={isSelected} onMouseDown={onMouseDown} />;
  } else if (item.type === 'group') {
    return <Group item={item} isSelected={isSelected} onMouseDown={onMouseDown} />;
  }
  return null;
};

// Seat Row Component (SVG-based)
const SeatRow: React.FC<SeatRowProps> = ({ item, isSelected, onMouseDown }) => {
  const { x, y, seats, rotation, curve } = item;

  // Calculate seat positions based on curve
  const seatPositions: Position[] = [];
  const seatSpacing = 35;
  const totalWidth = (seats - 1) * seatSpacing;

  for (let i = 0; i < seats; i++) {
    const offset = i * seatSpacing - totalWidth / 2;

    // Apply curve (quadratic)
    const curveAmount = curve / 100;
    const curveY = curveAmount * Math.pow(offset / (totalWidth / 2), 2) * 50;

    seatPositions.push({
      x: offset,
      y: curveY,
    });
  }

  const centerX = x + (totalWidth + 50) / 2;
  const centerY = y + 25;

  return (
    <g
      transform={`rotate(${rotation}, ${centerX}, ${centerY})`}
      style={{ cursor: 'move' }}
      onMouseDown={onMouseDown}
    >
      {/* Selection border */}
      {isSelected && (
        <rect
          x={x + SELECTION_BORDER_OFFSET}
          y={y + SELECTION_BORDER_OFFSET}
          width={totalWidth + 50 - 2 * SELECTION_BORDER_OFFSET}
          height={50 - 2 * SELECTION_BORDER_OFFSET}
          fill="none"
          stroke="#60a5fa"
          strokeWidth="2"
          rx="8"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Render seats */}
      {seatPositions.map((pos, i) => {
        const seatX = centerX + pos.x - SEAT_HALF_WIDTH;
        const seatY = y + pos.y;

        return (
          <g key={i}>
            <rect
              x={seatX}
              y={seatY}
              width={SEAT_WIDTH}
              height={SEAT_WIDTH}
              rx="8"
              ry="0"
              fill={isSelected ? '#3b82f6' : '#22c55e'}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
              style={{ transition: 'fill 0.2s' }}
            >
              <title>Seat {i + 1}</title>
            </rect>
          </g>
        );
      })}
    </g>
  );
};

// Block Component (SVG-based)
const Block: React.FC<BlockProps> = ({ item, isSelected, onMouseDown }) => {
  const { x, y, width, height, name } = item;

  return (
    <g style={{ cursor: 'move' }} onMouseDown={onMouseDown}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="8"
        fill={isSelected ? '#9333ea' : '#a855f7'}
        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
        stroke={isSelected ? '#c084fc' : 'none'}
        strokeWidth={isSelected ? '4' : '0'}
        style={{ transition: 'fill 0.2s, stroke 0.2s' }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="16"
        fontWeight="bold"
      >
        {name}
      </text>
    </g>
  );
};

// Group Component (SVG-based)
const Group: React.FC<GroupProps> = ({ item, isSelected, onMouseDown }) => {
  const { x, y, width, height, name } = item;

  return (
    <g style={{ cursor: 'move' }} onMouseDown={onMouseDown}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx="8"
        fill={isSelected ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'}
        stroke={isSelected ? '#4ade80' : '#22c55e'}
        strokeWidth="4"
        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.2))"
        style={{ transition: 'fill 0.2s, stroke 0.2s' }}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={isSelected ? '#dcfce7' : '#bbf7d0'}
        fontSize="16"
        fontWeight="bold"
      >
        {name}
      </text>
    </g>
  );
};

export default SeatMap;
