import { useState, useRef } from 'react';

const SeatMap = () => {
  const [rows, setRows] = useState([]);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [draggingRowId, setDraggingRowId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Add a new row of seats
  const addRow = () => {
    const newRow = {
      id: Date.now(),
      x: 100,
      y: 100 + rows.length * 60,
      seats: 10,
      rotation: 0,
      curve: 0,
    };
    setRows([...rows, newRow]);
  };

  // Handle mouse down on a row
  const handleMouseDown = (e, rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDraggingRowId(rowId);
    setSelectedRowId(rowId);
    setDragOffset({ x: mouseX - row.x, y: mouseY - row.y });
  };

  // Handle mouse move
  const handleMouseMove = (e) => {
    if (!draggingRowId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setRows(rows.map(row => 
      row.id === draggingRowId 
        ? { ...row, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }
        : row
    ));
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setDraggingRowId(null);
  };

  // Update row property
  const updateRow = (rowId, property, value) => {
    setRows(rows.map(row => 
      row.id === rowId 
        ? { ...row, [property]: parseFloat(value) }
        : row
    ));
  };

  // Delete row
  const deleteRow = (rowId) => {
    setRows(rows.filter(row => row.id !== rowId));
    if (selectedRowId === rowId) {
      setSelectedRowId(null);
    }
  };

  // Get selected row
  const selectedRow = rows.find(row => row.id === selectedRowId);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Concert Seat Map</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Controls</h2>
              <button
                onClick={addRow}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
              >
                Add Seat Row
              </button>
            </div>

            {selectedRow && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-4">Row Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Number of Seats: {selectedRow.seats}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={selectedRow.seats}
                      onChange={(e) => updateRow(selectedRow.id, 'seats', e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rotation: {selectedRow.rotation}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedRow.rotation}
                      onChange={(e) => updateRow(selectedRow.id, 'rotation', e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Curve: {selectedRow.curve}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={selectedRow.curve}
                      onChange={(e) => updateRow(selectedRow.id, 'curve', e.target.value)}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  <button
                    onClick={() => deleteRow(selectedRow.id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Delete Row
                  </button>
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Instructions</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Click "Add Seat Row" to create rows</li>
                <li>• Click and drag rows to move them</li>
                <li>• Select a row to adjust settings</li>
                <li>• Use rotation to angle rows</li>
                <li>• Use curve to create curved rows</li>
              </ul>
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Stage & Seating</h2>
              <div
                ref={canvasRef}
                className="bg-gray-900 rounded-lg relative overflow-hidden cursor-move"
                style={{ height: '600px' }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Stage */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-12 rounded-lg shadow-lg">
                  STAGE
                </div>

                {/* Render seats */}
                {rows.map((row) => (
                  <SeatRow
                    key={row.id}
                    row={row}
                    isSelected={selectedRowId === row.id}
                    onMouseDown={(e) => handleMouseDown(e, row.id)}
                  />
                ))}

                {rows.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xl">
                    Click "Add Seat Row" to start creating your seat map
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Seat Row Component
const SeatRow = ({ row, isSelected, onMouseDown }) => {
  const { x, y, seats, rotation, curve } = row;

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
      {seatPositions.map((pos, i) => (
        <div
          key={i}
          className={`absolute rounded-t-lg transition-colors duration-200 ${
            isSelected 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isSelected ? '#2563eb' : '#16a34a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isSelected ? '#3b82f6' : '#22c55e';
          }}
          title={`Seat ${i + 1}`}
        />
      ))}
    </div>
  );
};

export default SeatMap;
