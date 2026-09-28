'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Contact, Relationship } from '@/types/crm';
import { Network, Plus, Search, Sparkles, User, ArrowRight, Link as LinkIcon, RefreshCw, ZoomIn, ZoomOut, Trash2, Shield, Share2, Filter, Award, Layers, Crown, Landmark, Briefcase } from 'lucide-react';

interface ContactGraphViewProps {
  contacts: Contact[];
  onOpen360: (contact: Contact) => void;
  onRefresh: () => void;
}

interface PhysicsNode {
  id: string;
  contact: Contact;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

// Color Mapping by Investor Type for Capital Markets Visual Hierarchy
const getInvestorTypeColor = (type?: string): { border: string; bg: string; text: string } => {
  const t = (type || '').toLowerCase();
  if (t.includes('family office') || t.includes('fo')) {
    return { border: '#f59e0b', bg: '#f59e0b22', text: '#fbbf24' }; // Gold
  }
  if (t.includes('venture') || t.includes('pe') || t.includes('fund') || t.includes('institutional')) {
    return { border: '#10b981', bg: '#10b98122', text: '#34d399' }; // Emerald
  }
  if (t.includes('broker') || t.includes('advisor') || t.includes('intermediary')) {
    return { border: '#a855f7', bg: '#a855f722', text: '#c084fc' }; // Purple
  }
  if (t.includes('strategic') || t.includes('corporate')) {
    return { border: '#ec4899', bg: '#ec489922', text: '#f472b6' }; // Pink
  }
  return { border: '#00dfdf', bg: '#00dfdf22', text: '#00dfdf' }; // True Cyan default
};

export const ContactGraphView: React.FC<ContactGraphViewProps> = ({ contacts, onOpen360, onRefresh }) => {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedNode, setSelectedNode] = useState<Contact | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Contact | null>(null);
  const [showAddRelModal, setShowAddRelModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Form State for Linking Relationships
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [relType, setRelType] = useState('Referido por');
  const [notes, setNotes] = useState('');
  const [loadingRel, setLoadingRel] = useState(false);

  // Pan & Zoom Navigation State
  const [zoomLevel, setZoomLevel] = useState(1);
  const transformRef = useRef({ x: 0, y: 0, zoom: 1 });

  // Canvas & Physics Engine Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nodesRef = useRef<PhysicsNode[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const draggedNodeRef = useRef<PhysicsNode | null>(null);
  const isPanDraggingRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      const res = await fetch('/api/relationships');
      const data = await res.json();
      if (data.success) {
        setRelationships(data.relationships || []);
      }
    } catch (e) {
      console.error('Error fetching relationships:', e);
    }
  };

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) {
      alert('Selecciona dos contactos válidos y diferentes para vincular.');
      return;
    }

    setLoadingRel(true);
    try {
      const res = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContactId: sourceId,
          targetContactId: targetId,
          relationshipType: relType,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddRelModal(false);
        setSourceId('');
        setTargetId('');
        setNotes('');
        fetchRelationships();
        onRefresh();
      } else {
        alert('Error al guardar relación: ' + (data.error || 'Error desconocido'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRel(false);
    }
  };

  const handleDeleteRelationship = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este vínculo de la red?')) return;
    try {
      const res = await fetch(`/api/relationships?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchRelationships();
        onRefresh();
      }
    } catch (e) {
      console.error('Error deleting relationship:', e);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.investorType || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'CONNECTED') {
      return relationships.some((r) => r.sourceContactId === c.id || r.targetContactId === c.id);
    }
    if (filterType !== 'ALL') {
      return (c.investorType || '').toLowerCase().includes(filterType.toLowerCase());
    }

    return true;
  });

  // Initialize Physics Nodes with generous spacing
  useEffect(() => {
    const width = 800;
    const height = 550;

    nodesRef.current = filteredContacts.map((c, index) => {
      const existing = nodesRef.current.find((n) => n.id === c.id);
      if (existing) return { ...existing, contact: c };

      const angle = (index / (filteredContacts.length || 1)) * 2 * Math.PI;
      const dist = 180 + (index % 3) * 70;

      return {
        id: c.id,
        contact: c,
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 28,
      };
    });
  }, [filteredContacts]);

  // Main Physics Simulation & Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      if (canvas && canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width || 800;
        canvas.height = 540;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const updatePhysics = () => {
      const width = canvas.width;
      const height = canvas.height;
      const nodes = nodesRef.current;

      // 1. Repulsive forces between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < 260) {
            const force = ((260 - dist) / dist) * 0.1;
            const fx = dx * force;
            const fy = dy * force;

            if (n1 !== draggedNodeRef.current) {
              n1.vx -= fx;
              n1.vy -= fy;
            }
            if (n2 !== draggedNodeRef.current) {
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }
      }

      // 2. Spring attraction along relationship edges
      relationships.forEach((rel) => {
        const source = nodes.find((n) => n.id === rel.sourceContactId);
        const target = nodes.find((n) => n.id === rel.targetContactId);

        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const desiredDist = 170;
          const force = (dist - desiredDist) * 0.005;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (source !== draggedNodeRef.current) {
            source.vx += fx;
            source.vy += fy;
          }
          if (target !== draggedNodeRef.current) {
            target.vx -= fx;
            target.vy -= fy;
          }
        }
      });

      // 3. Central gravity & movement damping
      nodes.forEach((n) => {
        if (n === draggedNodeRef.current) return;

        n.vx += (width / 2 - n.x) * 0.0006;
        n.vy += (height / 2 - n.y) * 0.0006;

        n.vx *= 0.90;
        n.vy *= 0.90;

        n.vx += (Math.random() - 0.5) * 0.08;
        n.vy += (Math.random() - 0.5) * 0.08;

        n.x += n.vx;
        n.y += n.vy;
      });

      // 4. Render Frame with Pan & Zoom Transform
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      const panX = transformRef.current.x;
      const panY = transformRef.current.y;
      const zoom = transformRef.current.zoom;

      ctx.translate(panX, panY);
      ctx.scale(zoom, zoom);

      // Render Mesh Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = -width; x < width * 2; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -height);
        ctx.lineTo(x, height * 2);
        ctx.stroke();
      }
      for (let y = -height; y < height * 2; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-width, y);
        ctx.lineTo(width * 2, y);
        ctx.stroke();
      }

      // Render High-Visibility Relationship Edges with Animated Flow Particles
      const animTime = Date.now() * 0.002;

      relationships.forEach((rel) => {
        const source = nodes.find((n) => n.id === rel.sourceContactId);
        const target = nodes.find((n) => n.id === rel.targetContactId);

        if (source && target) {
          const isSelectedEdge =
            selectedNode && (source.id === selectedNode.id || target.id === selectedNode.id);

          // 1. Solid High-Visibility Connection Line
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);

          ctx.strokeStyle = isSelectedEdge
            ? 'rgba(0, 223, 223, 1.0)'
            : 'rgba(0, 223, 223, 0.70)';
          ctx.lineWidth = isSelectedEdge ? 4.5 : 2.8;
          ctx.stroke();

          // 2. Animated Flow Energy Particle along the Line
          const charCode = (rel.id || 'x').charCodeAt(0) || 5;
          const progress = (animTime + charCode * 0.1) % 1;
          const particleX = source.x + (target.x - source.x) * progress;
          const particleY = source.y + (target.y - source.y) * progress;

          ctx.beginPath();
          ctx.arc(particleX, particleY, isSelectedEdge ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#00dfdf';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow

          // 3. Edge Relationship Label Badge with High Contrast
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2;

          const labelText = rel.relationshipType;
          ctx.font = 'bold 10px Urbanist, sans-serif';
          const textWidth = ctx.measureText(labelText).width;
          const badgeW = Math.max(textWidth + 18, 85);
          const badgeH = 20;

          // Badge Background Pill
          ctx.fillStyle = '#06080e';
          ctx.beginPath();
          ctx.roundRect(midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 10);
          ctx.fill();

          ctx.strokeStyle = isSelectedEdge ? '#00dfdf' : 'rgba(0, 223, 223, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Badge Text
          ctx.fillStyle = isSelectedEdge ? '#00dfdf' : '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, midX, midY + 0.5);
        }
      });

      // Render Contact Nodes
      nodes.forEach((n) => {
        const isSelected = selectedNode?.id === n.id;
        const isHovered = hoveredNode?.id === n.id;
        const color = getInvestorTypeColor(n.contact.investorType);

        // Halo / Glow Effect for Selected Node
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 10, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? 'rgba(0, 223, 223, 0.25)' : 'rgba(255, 255, 255, 0.15)';
          ctx.fill();
        }

        // Main Node Circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0f1218';
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#00dfdf' : color.border;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Node Initials
        const initials = n.contact.name
          .split(' ')
          .map((word) => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        ctx.font = 'black 11px Urbanist, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, n.x, n.y - 1);

        // Lead Score Badge above node
        const score = n.contact.leadScore || 70;
        ctx.fillStyle = score >= 80 ? '#00dfdf' : score >= 60 ? '#fbbf24' : '#64748b';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${score} pts`, n.x, n.y - n.radius - 8);

        // Contact Name Label below node
        ctx.font = 'bold 11px Urbanist, sans-serif';
        ctx.fillStyle = isSelected ? '#00dfdf' : '#e2e8f0';
        ctx.fillText(n.contact.name, n.x, n.y + n.radius + 14);

        // Company / Type Sublabel
        ctx.font = '500 9px Urbanist, sans-serif';
        ctx.fillStyle = color.text;
        ctx.fillText(n.contact.investorType || n.contact.company || 'Inversionista', n.x, n.y + n.radius + 26);
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [relationships, selectedNode, hoveredNode]);

  // Canvas Mouse Interaction Handlers with Precise Scaled Hit-Testing
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { mouseX: 0, mouseY: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const mouseX = (canvasX - transformRef.current.x) / transformRef.current.zoom;
    const mouseY = (canvasY - transformRef.current.y) / transformRef.current.zoom;

    return { mouseX, mouseY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { mouseX, mouseY } = getCanvasCoords(e);

    const clickedNode = nodesRef.current.find((n) => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 8;
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      setSelectedNode(clickedNode.contact);
    } else {
      isPanDraggingRef.current = true;
      panStartRef.current = {
        x: e.clientX - transformRef.current.x,
        y: e.clientY - transformRef.current.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { mouseX, mouseY } = getCanvasCoords(e);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = mouseX;
      draggedNodeRef.current.y = mouseY;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    if (isPanDraggingRef.current) {
      transformRef.current.x = e.clientX - panStartRef.current.x;
      transformRef.current.y = e.clientY - panStartRef.current.y;
      return;
    }

    const hovered = nodesRef.current.find((n) => {
      const dx = n.x - mouseX;
      const dy = n.y - mouseY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 8;
    });

    setHoveredNode(hovered ? hovered.contact : null);
  };

  const handleMouseUp = () => {
    draggedNodeRef.current = null;
    isPanDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(transformRef.current.zoom * zoomFactor, 0.4), 3);
    transformRef.current.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.min(Math.max(transformRef.current.zoom + delta, 0.4), 3);
    transformRef.current.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  };

  const handleResetView = () => {
    transformRef.current = { x: 0, y: 0, zoom: 1 };
    setZoomLevel(100);
  };

  // Top Connected Hub Calculation
  const getTopHubContact = () => {
    const counts: Record<string, number> = {};
    relationships.forEach((r) => {
      counts[r.sourceContactId] = (counts[r.sourceContactId] || 0) + 1;
      counts[r.targetContactId] = (counts[r.targetContactId] || 0) + 1;
    });
    let topId = '';
    let max = 0;
    Object.entries(counts).forEach(([id, count]) => {
      if (count > max) {
        max = count;
        topId = id;
      }
    });
    const found = contacts.find((c) => c.id === topId);
    return found ? `${found.name} (${max} vínculos)` : 'Sin conexiones registradas';
  };

  return (
    <div className="space-y-6 font-['Urbanist'] w-full animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Network style={{ color: 'var(--primary-color)' }} className="w-5 h-5" />
              <span>Red de Relaciones Eslabón & Ecosistema IR Outcrop</span>
            </h2>
            <span
              style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
              className="px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase shadow-md"
            >
              RELATIONSHIP GRAPH 2.0
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Análisis de influencia, mapa interactivo de referidos y puentes de conexión entre inversionistas del Proyecto Santa Ana.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <div className="relative w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en la red..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/10 rounded-full text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            onClick={() => setShowAddRelModal(true)}
            style={{ backgroundColor: 'var(--primary-color)', color: '#000000' }}
            className="px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 hover:scale-105 cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Vincular Nueva Relación</span>
          </button>
        </div>
      </div>

      {/* Network Metrics Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-3xl border border-white/10 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Vínculos Activos</div>
            <div className="text-xl font-black text-white">{relationships.length} Conexiones</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-3xl border border-white/10 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Eslabón Principal</div>
            <div className="text-sm font-black text-white truncate max-w-[200px]">{getTopHubContact()}</div>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-3xl border border-white/10 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Inversionistas en Red</div>
            <div className="text-xl font-black text-white">{filteredContacts.length} Contactos</div>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-bold flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span>Filtrar Red:</span>
        </span>
        {[
          { id: 'ALL', label: 'Todos', icon: Layers },
          { id: 'CONNECTED', label: 'Solo Conectados', icon: LinkIcon },
          { id: 'Family Office', label: 'Family Office', icon: Crown },
          { id: 'Venture', label: 'Fondos PE', icon: Landmark },
          { id: 'Broker', label: 'Brokers', icon: Briefcase },
        ].map((f) => {
          const ChipIcon = f.icon;
          const isActive = filterType === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all border flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md scale-105'
                  : 'bg-white/[0.04] text-neutral-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <ChipIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Canvas & Inspector Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Canvas Physics Space */}
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="lg:col-span-2 rounded-3xl p-6 min-h-[560px] relative overflow-hidden border border-white/10 flex flex-col justify-between shadow-2xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/5 pb-3">
            <span className="flex items-center gap-2 font-bold text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              SIMULADOR DE FÍSICA EN TIEMPO REAL
            </span>

            {/* Zoom & Reset Controls */}
            <div className="flex items-center gap-2 bg-slate-950 border border-white/10 px-3 py-1 rounded-full text-[11px]">
              <button onClick={() => handleZoom(0.2)} className="hover:text-white" title="Acercar">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-white min-w-[36px] text-center">{zoomLevel}%</span>
              <button onClick={() => handleZoom(-0.2)} className="hover:text-white" title="Alejar">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                className="text-slate-400 hover:text-white border-l border-white/10 pl-2 ml-1"
                title="Centrar Red"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive HTML5 Canvas */}
          <div className="relative w-full h-[450px] my-2 rounded-2xl overflow-hidden bg-[#090b10] border border-white/5">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="w-full h-full block cursor-grab active:cursor-grabbing"
            />
          </div>

          <div className="text-[11px] text-slate-400 text-center font-mono border-t border-white/5 pt-2 flex items-center justify-between">
            <span>🖱️ Arrastra nodos para mover | Arrastra fondo para desplazar | Rueda del mouse para zoom</span>
            <span className="text-[10px] text-cyan-400 font-bold">100% Interactivo</span>
          </div>
        </div>

        {/* Node Inspector & Relationship Detail Drawer */}
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="rounded-3xl p-6 space-y-6 border border-white/10 shadow-2xl">
          {selectedNode ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <User style={{ color: 'var(--primary-color)' }} className="w-4 h-4" />
                  <span>Inspección de Nodo</span>
                </h3>
                <button
                  onClick={() => onOpen360(selectedNode)}
                  style={{ color: 'var(--primary-color)' }}
                  className="text-xs hover:underline font-black flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Ficha 360°</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Contact Card Summary */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-white">{selectedNode.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-black">
                    {selectedNode.leadScore || 70} pts
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedNode.title || 'Inversionista'} en <strong>{selectedNode.company || 'Independiente'}</strong>
                </p>
                <div className="flex gap-2 text-xs pt-1 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                    {selectedNode.investorType || 'General'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black border bg-amber-500/10 text-amber-400 border-amber-500/30">
                    {selectedNode.stage || 'Prospecto'}
                  </span>
                </div>
              </div>

              {/* Direct Network Connections List */}
              <div>
                <h4 className="text-xs font-black text-slate-300 mb-3 uppercase tracking-wider flex items-center justify-between">
                  <span>Vínculos de Red Directos</span>
                  <span className="text-cyan-400 font-mono">
                    (
                    {
                      relationships.filter(
                        (r) => r.sourceContactId === selectedNode.id || r.targetContactId === selectedNode.id
                      ).length
                    }
                    )
                  </span>
                </h4>

                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {relationships
                    .filter((r) => r.sourceContactId === selectedNode.id || r.targetContactId === selectedNode.id)
                    .map((rel) => {
                      const isSource = rel.sourceContactId === selectedNode.id;
                      const partner = isSource ? rel.targetContact : rel.sourceContact;

                      return (
                        <div key={rel.id} className="p-3.5 rounded-2xl bg-slate-950 border border-white/10 space-y-1.5 group">
                          <div className="flex items-center justify-between text-xs font-black text-white">
                            <span className="text-cyan-400 font-bold">{rel.relationshipType}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-200">{partner?.name || 'Contacto'}</span>
                              <button
                                onClick={() => handleDeleteRelationship(rel.id)}
                                title="Eliminar este vínculo"
                                className="text-slate-500 hover:text-red-400 opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {rel.notes && (
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed bg-slate-900/60 p-2 rounded-xl border border-white/5">
                              {rel.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}

                  {relationships.filter(
                    (r) => r.sourceContactId === selectedNode.id || r.targetContactId === selectedNode.id
                  ).length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500 rounded-2xl bg-slate-950 border border-white/5">
                      Este contacto aún no tiene vínculos registrados en la red.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center py-3 border-b border-white/10 space-y-1">
                <Network className="w-5 h-5 mx-auto text-[var(--accent-primary)]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Contactos en la Red</h4>
                <p className="text-[11px] text-slate-400 font-medium">Haz clic en un nodo en el mapa o selecciona un contacto a continuación:</p>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredContacts.map((c) => {
                  const relCount = relationships.filter((r) => r.sourceContactId === c.id || r.targetContactId === c.id).length;
                  const color = getInvestorTypeColor(c.investorType);

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedNode(c)}
                      className="w-full p-3 rounded-2xl bg-slate-950 border border-white/10 hover:border-cyan-400/50 flex items-center justify-between text-left transition-all cursor-pointer group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[10px] font-bold" style={{ color: color.text }}>
                          {c.investorType || 'Inversionista'} • {c.company || 'Independiente'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-white/10 text-[10px] font-mono font-bold text-slate-300">
                          {relCount} {relCount === 1 ? 'vínculo' : 'vínculos'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link Relationship Modal */}
      {showAddRelModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0c0e17] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 font-['Urbanist']">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-tight">
                <LinkIcon className="w-4 h-4 text-cyan-400" />
                <span>Vincular Nueva Relación en la Red</span>
              </h3>
              <button
                onClick={() => setShowAddRelModal(false)}
                className="w-8 h-8 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRelationship} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider">
                  Contacto Origen (Quién refiere / conecta)
                </label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                >
                  <option value="">Selecciona contacto 1...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || 'Inversionista'}) - {c.investorType || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider">
                  Tipo de Relación / Vínculo
                </label>
                <select
                  value={relType}
                  onChange={(e) => setRelType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400 font-bold"
                >
                  <option value="Referido por">Referido por (Introducción Directa)</option>
                  <option value="Co-Inversionista con">Co-Inversionista con</option>
                  <option value="Broker / Asesor de">Broker / Asesor de</option>
                  <option value="Fondo / Vínculo Institucional">Fondo / Vínculo Institucional</option>
                  <option value="Socio Estratégico">Socio Estratégico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider">
                  Contacto Destino (A quién conectó)
                </label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  required
                >
                  <option value="">Selecciona contacto 2...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company || 'Inversionista'}) - {c.investorType || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1.5 uppercase tracking-wider">
                  Notas del Vínculo (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de la relación (ej: Lo presentó en la cumbre de Beaver Creek)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3.5 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRelModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingRel}
                  className="px-5 py-2.5 rounded-2xl bg-[#00dfdf] text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 cursor-pointer shadow-lg"
                >
                  {loadingRel ? 'Guardando...' : 'Vincular Relación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
