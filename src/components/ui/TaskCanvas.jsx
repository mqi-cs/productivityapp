import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Move, GripHorizontal, ArrowDownRight, Trash2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function TaskCanvas({ task, onClose, onSave }) {
    // Canvas State
    const [nodes, setNodes] = useState(task.canvasData?.nodes || []);
    const [edges, setEdges] = useState(task.canvasData?.edges || []);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

    // Interaction State
    const [isPanning, setIsPanning] = useState(false);
    const [draggingNode, setDraggingNode] = useState(null); // { id, startX, startY, initialNodeX, initialNodeY }
    const [resizingNode, setResizingNode] = useState(null); // { id, startX, startY, startW, startH }
    const [connectingNode, setConnectingNode] = useState(null); // { id, startX, startY }
    const [contextMenu, setContextMenu] = useState(null); // { x, y, nodeId }
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // For drawing active connection line

    const containerRef = useRef(null);

    // -- Util --
    const screenToCanvas = (sx, sy) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (sx - rect.left - transform.x) / transform.scale,
            y: (sy - rect.top - transform.y) / transform.scale
        };
    };

    // -- Handlers --

    const handleWheel = (e) => {
        if (e.ctrlKey) {
            // Zoom
            e.preventDefault();
            const zoomSpeed = 0.001;
            const newScale = Math.min(Math.max(0.1, transform.scale - e.deltaY * zoomSpeed), 5);
            setTransform(prev => ({ ...prev, scale: newScale }));
        } else {
            // Pan
            setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const handleMouseDownCanvas = (e) => {
        // Middle click or Space+Click or just background click for pan
        if (e.button === 1 || (e.button === 0 && e.target === containerRef.current)) {
            setIsPanning(true);
        }
    };



    // Node Handlers
    const handleNodePointerDown = (e, nodeId) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);

        const node = nodes.find(n => n.id === nodeId);
        setDraggingNode({
            id: nodeId,
            startX: e.clientX,
            startY: e.clientY,
            initialNodeX: node.x,
            initialNodeY: node.y
        });
    };

    const handleNodePointerMove = (e) => {
        if (draggingNode) {
            const { clientX, clientY } = e;
            setNodes(prev => prev.map(n => {
                if (n.id === draggingNode.id) {
                    return {
                        ...n,
                        x: draggingNode.initialNodeX + (clientX - draggingNode.startX) / transform.scale,
                        y: draggingNode.initialNodeY + (clientY - draggingNode.startY) / transform.scale
                    };
                }
                return n;
            }));
        }
    };

    const handleNodePointerUp = (e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDraggingNode(null);
    };

    const handleConnectionStart = (e, nodeId) => {
        e.stopPropagation();
        e.preventDefault(); // Stop text selection
        const node = nodes.find(n => n.id === nodeId);
        setConnectingNode({ id: nodeId, startX: node.x + 150, startY: node.y + 50 }); // Center(ish)
    };

    const handleNodeMouseUp = (e, targetId) => {
        e.stopPropagation();
        if (connectingNode && connectingNode.id !== targetId) {
            // Create Edge
            const newEdge = {
                id: Math.random().toString(36).substr(2, 9),
                source: connectingNode.id,
                target: targetId
            };
            // Prevent duplicates
            if (!edges.find(ed => ed.source === newEdge.source && ed.target === newEdge.target)) {
                setEdges(prev => [...prev, newEdge]);
            }
            setConnectingNode(null);
        }
    };

    const handleResizePointerDown = (e, nodeId) => {
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);

        const node = nodes.find(n => n.id === nodeId);
        setResizingNode({
            id: nodeId,
            startX: e.clientX,
            startY: e.clientY,
            startW: node.width || 300,
            startH: node.height || 200
        });
    };

    const handleResizePointerMove = (e) => {
        if (resizingNode) {
            const { clientX, clientY } = e;
            setNodes(prev => prev.map(n => {
                if (n.id === resizingNode.id) {
                    return {
                        ...n,
                        width: Math.max(150, resizingNode.startW + (clientX - resizingNode.startX) / transform.scale),
                        height: Math.max(100, resizingNode.startH + (clientY - resizingNode.startY) / transform.scale)
                    };
                }
                return n;
            }));
        }
    }

    const handleResizePointerUp = (e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setResizingNode(null);
    };

    const handleContextMenu = (e, nodeId) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    };

    const handleCanvasClick = (e) => {
        if (contextMenu) setContextMenu(null);
    };

    const handleDoubleClickCanvas = (e) => {
        if (e.target !== containerRef.current) return;
        const pos = screenToCanvas(e.clientX, e.clientY);
        const newNode = {
            id: Math.random().toString(36).substr(2, 9),
            x: pos.x - 150, // Center on click
            y: pos.y - 100,
            width: 300,
            height: 200,
            content: 'New Note',
            color: '#1a1a1a'
        };
        setNodes(prev => [...prev, newNode]);
    };

    // Content Edits
    const updateNodeContent = (id, content) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
    };

    const updateNodeColor = (id, color) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
        setContextMenu(null);
    };

    const deleteNode = (id) => {
        setNodes(prev => prev.filter(n => n.id !== id));
        setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
        setContextMenu(null);
    };

    // Save on Unmount / Change
    useEffect(() => {
        // Auto-save logic
        const timer = setTimeout(() => {
            onSave({ ...task, canvasData: { nodes, edges } });
        }, 1000);
        return () => clearTimeout(timer);
    }, [nodes, edges]);

    return (
        <div className="fixed inset-0 z-50 bg-[#0c0c0c] flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#111] z-50">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-medium text-white">{task.title} <span className="text-muted-foreground text-sm font-normal ml-2">Canvas</span></h2>
                    <div className="text-xs text-muted-foreground">
                        Double-click to add note • Drag to move • Drag from handle to connect
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing bg-[#0c0c0c]"
                onWheel={handleWheel}
                onMouseDown={handleMouseDownCanvas}
                onClick={handleCanvasClick}
                onMouseMove={(e) => {
                    const canvasPos = screenToCanvas(e.clientX, e.clientY);
                    setMousePos(canvasPos);
                }}
                onDoubleClick={handleDoubleClickCanvas}
            >
                {/* Grid Pattern */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                        backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
                        backgroundPosition: `${transform.x}px ${transform.y}px`
                    }}
                />

                <div
                    className="absolute origin-top-left"
                    style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})` }}
                >
                    {/* SVG Layer for Edges */}
                    <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] -z-10 overflow-visible pointer-events-none">
                        {edges.map(edge => {
                            const source = nodes.find(n => n.id === edge.source);
                            const target = nodes.find(n => n.id === edge.target);
                            if (!source || !target) return null;

                            // Simple center-to-center for now, or edge-to-edge
                            const sx = source.x + (source.width || 300) / 2;
                            const sy = source.y + (source.height || 200) / 2;
                            const tx = target.x + (target.width || 300) / 2;
                            const ty = target.y + (target.height || 200) / 2;

                            return (
                                <line
                                    key={edge.id}
                                    x1={sx} y1={sy} x2={tx} y2={ty}
                                    stroke="#555"
                                    strokeWidth="2"
                                />
                            )
                        })}
                        {/* Active Connection Line */}
                        {connectingNode && (
                            <line
                                x1={connectingNode.startX}
                                y1={connectingNode.startY}
                                x2={mousePos.x}
                                y2={mousePos.y}
                                stroke="#neon-blue"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                                className="stroke-neon-blue"
                            />
                        )}
                    </svg>

                    {/* Nodes Layer */}
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            className="absolute bg-[#1a1a1a] rounded-lg border border-white/10 shadow-lg flex flex-col group hover:border-neon-blue/50 transition-colors"
                            style={{
                                left: node.x,
                                top: node.y,
                                width: node.width || 300,
                                height: node.height || 200,
                                backgroundColor: node.color || '#1a1a1a'
                            }}
                            onMouseUp={(e) => handleNodeMouseUp(e, node.id)}
                        >
                            <div
                                className="h-6 bg-white/5 rounded-t-lg flex items-center justify-between px-2 cursor-grab active:cursor-grabbing border-b border-white/5"
                                onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                                onPointerMove={handleNodePointerMove}
                                onPointerUp={handleNodePointerUp}
                            >
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500/50 hover:bg-red-500 cursor-pointer" onClick={() => deleteNode(node.id)} />
                                </div>
                                <GripHorizontal className="w-3 h-3 text-muted-foreground" />
                            </div>

                            {/* Content */}
                            <textarea
                                className="w-full h-full min-h-[50px] bg-transparent p-3 text-sm text-white resize-none focus:outline-none flex-1"
                                value={node.content}
                                onChange={(e) => updateNodeContent(node.id, e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()} // Allow text selection without dragging node
                                placeholder="Type something..."
                            />

                            {/* Connection Handle */}
                            <div
                                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 hover:bg-neon-blue transition-all"
                                onMouseDown={(e) => handleConnectionStart(e, node.id)}
                                title="Drag to connect"
                            >
                                <Plus className="w-3 h-3" />
                            </div>
                            {/* Resize Handle */}
                            <div
                                className="absolute bottom-0 right-0 p-1 cursor-se-resize opacity-0 group-hover:opacity-100"
                                onPointerDown={(e) => handleResizePointerDown(e, node.id)}
                                onPointerMove={handleResizePointerMove}
                                onPointerUp={handleResizePointerUp}
                            >
                                <ArrowDownRight className="w-3 h-3 text-muted-foreground" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Context Menu */}
                {contextMenu && (
                    <div
                        className="absolute bg-[#111] border border-white/10 rounded-lg shadow-xl p-2 flex flex-col gap-2 w-32 z-50 pointer-events-auto"
                        style={{
                            left: (contextMenu.x - containerRef.current.getBoundingClientRect().left - transform.x) / transform.scale,
                            top: (contextMenu.y - containerRef.current.getBoundingClientRect().top - transform.y) / transform.scale,
                            transformOrigin: 'top left',
                            transform: `scale(${1 / transform.scale})` // Counter-scale to keep menu size constant
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="text-xs font-semibold text-muted-foreground px-2">Color</div>
                        <div className="flex gap-1 px-1 flex-wrap">
                            {['#1a1a1a', '#7f1d1d', '#1e3a8a', '#14532d', '#713f12', '#4c1d95'].map(c => (
                                <button
                                    key={c}
                                    className="w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: c }}
                                    onClick={() => updateNodeColor(contextMenu.nodeId, c)}
                                />
                            ))}
                        </div>
                        <div className="h-px bg-white/10 my-1" />
                        <button
                            className="flex items-center gap-2 text-xs text-red-500 hover:bg-white/5 p-1.5 rounded transition-colors text-left"
                            onClick={() => deleteNode(contextMenu.nodeId)}
                        >
                            <Trash2 className="w-3 h-3" /> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>

    );
}
