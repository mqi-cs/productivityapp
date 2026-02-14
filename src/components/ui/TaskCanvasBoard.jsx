import React, { useState, useRef, useEffect } from 'react';
import { Plus, GripHorizontal, ArrowDownRight, Trash2, Paperclip, FileIcon } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { useData } from '../../context/DataContext';
import { X } from 'lucide-react';

export default function TaskCanvasBoard({ task, visible, onChange }) {
    // Canvas State
    const [nodes, setNodes] = useState(task.canvasData?.nodes || []);
    const [edges, setEdges] = useState(task.canvasData?.edges || []);
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

    // Interaction State
    const [isPanning, setIsPanning] = useState(false);
    const [draggingNode, setDraggingNode] = useState(null);
    const [resizingNode, setResizingNode] = useState(null);
    const [connectingNode, setConnectingNode] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [uploading, setUploading] = useState(false);

    const { user } = useData();
    const fileInputRef = useRef(null);
    const [activeNodeIdForUpload, setActiveNodeIdForUpload] = useState(null);

    const containerRef = useRef(null);

    // Notify parent of changes
    useEffect(() => {
        onChange({ nodes, edges });
    }, [nodes, edges, onChange]);

    // Update internal state if task props change deeply (e.g. from external reload)
    // Careful with loops here. We assume `task` prop is initial data or we check IDs.
    // For now, let's just initialize once.

    const screenToCanvas = (sx, sy) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: (sx - rect.left - transform.x) / transform.scale,
            y: (sy - rect.top - transform.y) / transform.scale
        };
    };

    const handleWheel = (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const zoomSpeed = 0.001;
            const newScale = Math.min(Math.max(0.1, transform.scale - e.deltaY * zoomSpeed), 5);
            setTransform(prev => ({ ...prev, scale: newScale }));
        } else {
            setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
        }
    };

    const handleMouseDownCanvas = (e) => {
        if (e.button === 1 || (e.button === 0 && e.target === containerRef.current)) {
            setIsPanning(true);
        }
    };

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
        e.preventDefault();
        const node = nodes.find(n => n.id === nodeId);
        setConnectingNode({ id: nodeId, startX: node.x + 150, startY: node.y + 50 });
    };

    const handleNodeMouseUp = (e, targetId) => {
        e.stopPropagation();
        if (connectingNode && connectingNode.id !== targetId) {
            const newEdge = {
                id: Math.random().toString(36).substr(2, 9),
                source: connectingNode.id,
                target: targetId
            };
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

    const handleCanvasClick = (e) => {
        if (contextMenu) setContextMenu(null);
    };

    const handleDoubleClickCanvas = (e) => {
        if (e.target !== containerRef.current) return;
        const pos = screenToCanvas(e.clientX, e.clientY);
        const newNode = {
            id: Math.random().toString(36).substr(2, 9),
            x: pos.x - 150,
            y: pos.y - 100,
            width: 300,
            height: 200,
            content: 'New Note',
            color: '#1a1a1a'
        };
        setNodes(prev => [...prev, newNode]);
    };

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

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeNodeIdForUpload || !user) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('project-assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('project-assets')
                .getPublicUrl(filePath);

            setNodes(prev => prev.map(n => {
                if (n.id === activeNodeIdForUpload) {
                    const attachments = n.attachments || [];
                    return {
                        ...n,
                        attachments: [...attachments, {
                            id: Math.random().toString(36).substr(2, 9),
                            name: file.name,
                            url: publicUrl,
                            type: file.type.startsWith('image/') ? 'image' : 'file'
                        }]
                    };
                }
                return n;
            }));

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Upload failed. Ensure "project-assets" bucket exists and is public.');
        } finally {
            setUploading(false);
            setActiveNodeIdForUpload(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerUpload = (nodeId) => {
        setActiveNodeIdForUpload(nodeId);
        fileInputRef.current?.click();
    };

    const deleteAttachment = (nodeId, attachmentId) => {
        setNodes(prev => prev.map(n => {
            if (n.id === nodeId) {
                return { ...n, attachments: n.attachments.filter(a => a.id !== attachmentId) };
            }
            return n;
        }));
    };

    if (!visible) return null;

    return (
        <div className="absolute inset-0 top-14 bg-[#0c0c0c] flex flex-col">
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
                                <div className="flex gap-1" onPointerDown={(e) => e.stopPropagation()}>
                                    <div className="w-2 h-2 rounded-full bg-red-500/50 hover:bg-red-500 cursor-pointer" onClick={() => deleteNode(node.id)} />
                                    <button
                                        onClick={() => triggerUpload(node.id)}
                                        className="ml-2 hover:text-neon-blue text-muted-foreground transition-colors"
                                        title="Attach file"
                                    >
                                        <Paperclip className="w-3 h-3" />
                                    </button>
                                </div>
                                <GripHorizontal className="w-3 h-3 text-muted-foreground" />
                            </div>

                            <textarea
                                className="w-full h-full min-h-[50px] bg-transparent p-3 text-sm text-white resize-none focus:outline-none flex-1"
                                value={node.content}
                                onChange={(e) => updateNodeContent(node.id, e.target.value)}
                                onMouseDown={(e) => e.stopPropagation()}
                                placeholder="Type something..."
                            />

                            {node.attachments && node.attachments.length > 0 && (
                                <div className="p-2 pt-0 grid grid-cols-4 gap-2">
                                    {node.attachments.map(att => (
                                        <div key={att.id} className="group/att relative aspect-square bg-black/20 rounded border border-white/5 overflow-hidden flex items-center justify-center">
                                            {att.type === 'image' ? (
                                                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-[8px] text-muted-foreground p-1 text-center">
                                                    <FileIcon className="w-4 h-4 mb-1" />
                                                    <span className="truncate w-full">{att.name}</span>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/att:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-neon-blue">
                                                    <ArrowDownRight className="w-3 h-3 -rotate-45" />
                                                </a>
                                                <button onClick={() => deleteAttachment(node.id, att.id)} className="text-white hover:text-red-500">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div
                                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center cursor-crosshair opacity-0 group-hover:opacity-100 hover:bg-neon-blue transition-all"
                                onMouseDown={(e) => handleConnectionStart(e, node.id)}
                                title="Drag to connect"
                            >
                                <Plus className="w-3 h-3" />
                            </div>
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

                {contextMenu && (
                    <div
                        className="absolute bg-[#111] border border-white/10 rounded-lg shadow-xl p-2 flex flex-col gap-2 w-32 z-50 pointer-events-auto"
                        style={{
                            left: (contextMenu.x - containerRef.current.getBoundingClientRect().left - transform.x) / transform.scale,
                            top: (contextMenu.y - containerRef.current.getBoundingClientRect().top - transform.y) / transform.scale,
                            transformOrigin: 'top left',
                            transform: `scale(${1 / transform.scale})`
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

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
            />
        </div>
    );
}
