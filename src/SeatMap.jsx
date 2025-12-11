import { useState, useRef } from 'react';

const GRID_SIZE = 20;
const SNAP_THRESHOLD = 10;
const SELECTION_BORDER_WIDTH = 2;
const SELECTION_BORDER_OFFSET = -10;

// Helper function to generate grid background style
const getGridBackgroundStyle = (gridSize) => ({
  backgroundImage: `
    repeating-linear-gradient(0deg, transparent, transparent ${gridSize - 1}px, rgba(100, 116, 139, 0.3) ${gridSize - 1}px, rgba(100, 116, 139, 0.3) ${gridSize}px),
    repeating-linear-gradient(90deg, transparent, transparent ${gridSize - 1}px, rgba(100, 116, 139, 0.3) ${gridSize - 1}px, rgba(100, 116, 139, 0.3) ${gridSize}px)
  `,
  backgroundColor: '#1a202c'
});

const SeatMap = () => {
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draggingItemId, setDraggingItemId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [drawingMode, setDrawingMode] = useState(null); // 'row', 'block', 'group', null
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const canvasRef = useRef(null);

  // Snap to grid helper
  const snapToGrid = (value) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  // Add a new item based on drawing mode
  const createItem = (x, y, width = 100, height = 50) => {
    const snappedX = snapToGrid(x);
    const snappedY = snapToGrid(y);
    
    let newItem = {
      id: Date.now(),
      x: snappedX,
      y: snappedY,
      width: width,
      height: height,
      type: drawingMode || 'row',
    };

    if (drawingMode === 'row') {
      newItem = { ...newItem, seats: 10, rotation: 0, curve: 0 };
    } else if (drawingMode === 'block') {
      newItem = { ...newItem, name: 'Block ' + (items.filter(i => i.type === 'block').length + 1) };
    } else if (drawingMode === 'group') {
      newItem = { ...newItem, name: 'Group ' + (items.filter(i => i.type === 'group').length + 1) };
    }

    setItems([...items, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Handle canvas mouse down
  const handleCanvasMouseDown = (e) => {
    if (e.target !== canvasRef.current) return;
    
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
  const handleItemMouseDown = (e, itemId) => {
    e.stopPropagation();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDraggingItemId(itemId);
    setSelectedItemId(itemId);
    setDragOffset({ x: mouseX - item.x, y: mouseY - item.y });
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (draggingItemId) {
      const newX = snapToGrid(mouseX - dragOffset.x);
      const newY = snapToGrid(mouseY - dragOffset.y);
      
      setItems(items.map(item => 
        item.id === draggingItemId 
          ? { ...item, x: newX, y: newY }
          : item
      ));
    }
  };

  // Handle mouse up
  const handleMouseUp = (e) => {
    if (isDrawing && drawStart && drawingMode) {
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
  const updateItem = (itemId, property, value) => {
    // Parse numeric strings to numbers
    const parsedValue = typeof value === 'string' && !isNaN(parseFloat(value)) 
      ? parseFloat(value) 
      : value;
    
    setItems(items.map(item => 
      item.id === itemId 
        ? { ...item, [property]: parsedValue }
        : item
    ));
  };

  // Delete item
  const deleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  };

  // Get selected item
  const selectedItem = items.find(item => item.id === selectedItemId);

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
          {drawingMode ? `Drawing mode: ${drawingMode} - Click and drag on canvas` : 'Select a tool or click items to edit'}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Properties Panel */}
        {selectedItem && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Properties</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Type
                </label>
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
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Name
                    </label>
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
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Position
                </label>
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
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={canvasRef}
            className="w-full h-full relative cursor-crosshair"
            style={getGridBackgroundStyle(GRID_SIZE)}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Stage */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-16 rounded-lg shadow-lg z-10">
              STAGE
            </div>

            {/* Render items */}
            {items.map((item) => (
              <CanvasItem
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                onMouseDown={(e) => handleItemMouseDown(e, item.id)}
              />
            ))}

            {items.length === 0 && !isDrawing && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xl pointer-events-none">
                Select a tool from the toolbar and click & drag to create items
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Canvas Item Component - Renders different types of items
const CanvasItem = ({ item, isSelected, onMouseDown }) => {
  if (item.type === 'row') {
    return <SeatRow item={item} isSelected={isSelected} onMouseDown={onMouseDown} />;
  } else if (item.type === 'block') {
    return <Block item={item} isSelected={isSelected} onMouseDown={onMouseDown} />;
  } else if (item.type === 'group') {
    return <Group item={item} isSelected={isSelected} onMouseDown={onMouseDown} />;
  }
  return null;
};

// Seat Row Component
const SeatRow = ({ item, isSelected, onMouseDown }) => {
  const { x, y, seats, rotation, curve } = item;

  // Calculate seat positions based on curve
  const seatPositions = [];
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

  return (
    <div
      className="absolute cursor-move"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center',
        width: `${totalWidth + 50}px`,
        height: '50px',
        position: 'absolute',
      }}
      onMouseDown={onMouseDown}
    >
      {isSelected && (
        <div 
          className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none" 
          style={{ 
            margin: `${SELECTION_BORDER_OFFSET}px`
          }} 
        />
      )}
      {seatPositions.map((pos, i) => (
        <div
          key={i}
          className="absolute rounded-t-lg transition-colors duration-200"
          style={{
            left: `calc(50% + ${pos.x}px)`,
            top: `${pos.y}px`,
            width: '32px',
            height: '32px',
            transform: 'translateX(-50%)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            backgroundColor: isSelected ? '#3b82f6' : '#22c55e',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            transition: 'background-color 0.2s',
          }}
          title={`Seat ${i + 1}`}
        />
      ))}
    </div>
  );
};

// Block Component
const Block = ({ item, isSelected, onMouseDown }) => {
  const { x, y, width, height, name } = item;

  return (
    <div
      className={`absolute cursor-move rounded-lg flex items-center justify-center font-bold text-white transition-all ${
        isSelected ? 'ring-4 ring-purple-400 bg-purple-600' : 'bg-purple-500 hover:bg-purple-600'
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
      }}
      onMouseDown={onMouseDown}
    >
      {name}
    </div>
  );
};

// Group Component
const Group = ({ item, isSelected, onMouseDown }) => {
  const { x, y, width, height, name } = item;

  return (
    <div
      className={`absolute cursor-move rounded-lg border-4 flex items-center justify-center font-bold transition-all ${
        isSelected 
          ? 'border-green-400 bg-green-600 bg-opacity-30 text-green-100' 
          : 'border-green-500 bg-green-500 bg-opacity-20 text-green-200 hover:bg-opacity-30'
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
      }}
      onMouseDown={onMouseDown}
    >
      {name}
    </div>
  );
};

export default SeatMap;
