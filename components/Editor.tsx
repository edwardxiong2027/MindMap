
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  Node,
  useNodesState,
  useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  MarkerType
} from 'reactflow';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { User } from 'firebase/auth';
import { MindMapDoc, AIResponseNode } from '../types';
import { generateMindMapData } from '../services/geminiService';

const EditorContent: React.FC<{ user: User }> = ({ user }) => {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const { fitView } = useReactFlow();
  
  const [title, setTitle] = useState('');
  const [nodes, setNodes, _onNodesChange] = useNodesState([]);
  const [edges, setEdges, _onEdgesChange] = useEdgesState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [brainstormTopic, setBrainstormTopic] = useState('');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const skipNextUpdate = useRef(false);

  useEffect(() => {
    if (!mapId) return;

    const unsubscribe = onSnapshot(doc(db, 'maps', mapId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as MindMapDoc;
        setTitle(data.title || 'Untitled Map');
        setCollaborators(data.collaborators || []);
        if (!skipNextUpdate.current) {
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
        }
        skipNextUpdate.current = false;
      } else {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [mapId, setNodes, setEdges, navigate]);

  // lightweight presence: add self on enter, remove on exit
  useEffect(() => {
    if (!mapId || !user) return;
    const mapRef = doc(db, 'maps', mapId);

    const join = async () => {
      try {
        const snap = await getDoc(mapRef);
        if (!snap.exists()) {
          await setDoc(mapRef, {
            title: 'Untitled Map',
            ownerId: user.uid,
            nodes: [],
            edges: [],
            updatedAt: serverTimestamp(),
            collaborators: [user.uid]
          });
        } else {
          await updateDoc(mapRef, { collaborators: arrayUnion(user.uid) });
        }
      } catch (err) {
        console.error('Failed to join collaborators list', err);
      }
    };

    const leave = async () => {
      try {
        await updateDoc(mapRef, { collaborators: arrayRemove(user.uid) });
      } catch (err) {
        // ignore cleanup errors (e.g., doc deleted)
      }
    };

    join();
    return () => { leave(); };
  }, [mapId, user]);

  const syncToFirebase = useCallback(async (newNodes: Node[], newEdges: Edge[]) => {
    if (!mapId) return;
    setIsSyncing(true);
    try {
      skipNextUpdate.current = true;
      await updateDoc(doc(db, 'maps', mapId), {
        nodes: newNodes,
        edges: newEdges,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  }, [mapId]);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => {
      const newEds = addEdge({ 
        ...params, 
        type: 'smoothstep', 
        animated: true, 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: { stroke: '#6366f1', strokeWidth: 2 }
      }, eds);
      syncToFirebase(nodes, newEds);
      return newEds;
    });
  }, [nodes, setEdges, syncToFirebase]);

  const onNodesChangeHandler = useCallback((changes: NodeChange[]) => {
    const updatedNodes = applyNodeChanges(changes, nodes);
    setNodes(updatedNodes);
    const needsSync = changes.some(c => c.type === 'position' || c.type === 'remove' || c.type === 'reset' || c.type === 'add');
    if (needsSync) syncToFirebase(updatedNodes, edges);
  }, [nodes, edges, setNodes, syncToFirebase]);

  const onEdgesChangeHandler = useCallback((changes: EdgeChange[]) => {
    const updatedEdges = applyEdgeChanges(changes, edges);
    setEdges(updatedEdges);
    syncToFirebase(nodes, updatedEdges);
  }, [nodes, edges, setEdges, syncToFirebase]);

  const updateTitle = async (newTitle: string) => {
    setTitle(newTitle);
    if (!mapId) return;
    await updateDoc(doc(db, 'maps', mapId), { title: newTitle });
  };

  const addNodeAtCenter = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      data: { label: 'New Concept' },
      position: { x: 400 + Math.random() * 50, y: 300 + Math.random() * 50 },
      className: 'bg-white shadow-md px-4 py-2 border-2 border-slate-100'
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    syncToFirebase(newNodes, edges);
  };

  const handleAIByBrainstorm = async () => {
    if (!brainstormTopic.trim()) return;
    setIsBrainstorming(true);
    try {
      const aiData = await generateMindMapData(brainstormTopic);
      const newNodes: Node[] = [...nodes];
      const newEdges: Edge[] = [...edges];
      
      const centerX = nodes.length > 0 ? nodes[0].position.x : 500;
      const centerY = nodes.length > 0 ? nodes[0].position.y : 400;

      const rootId = `ai-root-${Date.now()}`;
      newNodes.push({
        id: rootId,
        data: { label: brainstormTopic.toUpperCase() },
        position: { x: centerX, y: centerY - 250 },
        className: 'bg-indigo-600 text-white font-bold px-6 py-3 shadow-lg'
      });

      const parentCount = aiData.length;
      const radiusStep = 250;
      const childRadiusStep = 180;

      aiData.forEach((parent, pIdx) => {
        const pId = `ai-p-${Date.now()}-${pIdx}`;
        const angle = (pIdx / parentCount) * 2 * Math.PI;
        const px = centerX + Math.cos(angle) * radiusStep;
        const py = (centerY - 250) + Math.sin(angle) * radiusStep;

        newNodes.push({
          id: pId,
          data: { label: parent.label },
          position: { x: px, y: py },
          className: 'bg-indigo-100 border-indigo-200 text-indigo-900 font-semibold px-4 py-2 shadow-sm'
        });

        newEdges.push({
          id: `e-${rootId}-${pId}`,
          source: rootId,
          target: pId,
          type: 'smoothstep',
          animated: true,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
          style: { stroke: '#6366f1', strokeWidth: 2 }
        });

        const children = parent.children || [];
        const childCount = children.length;
        const spreadAngle = (Math.PI / 1.8);

        children.forEach((child, cIdx) => {
          const cId = `ai-c-${Date.now()}-${pIdx}-${cIdx}`;
          const cAngle = angle + (cIdx - (childCount - 1) / 2) * (spreadAngle / Math.max(childCount, 1));
          
          newNodes.push({
            id: cId,
            data: { label: child.label },
            position: { x: px + Math.cos(cAngle) * childRadiusStep, y: py + Math.sin(cAngle) * childRadiusStep },
            className: 'bg-white border-slate-200 text-slate-700 text-sm px-3 py-1 shadow-sm'
          });

          newEdges.push({
            id: `e-${pId}-${cId}`,
            source: pId,
            target: cId,
            type: 'smoothstep',
            style: { stroke: '#cbd5e1' }
          });
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
      await syncToFirebase(newNodes, newEdges);
      setBrainstormTopic('');
      setTimeout(() => fitView({ padding: 0.2, duration: 800 }), 100);
      
    } catch (err) {
      console.error(err);
      alert("Brainstorming session failed. Try a different topic.");
    } finally {
      setIsBrainstorming(false);
    }
  };

  const copyShareLink = async () => {
    if (!mapId) return;
    const shareUrl = `${window.location.origin}/#/editor/${mapId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied!');
    } catch (err) {
      console.error(err);
      alert('Copy failed. Try manually copying the URL.');
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-0 bg-slate-50 relative overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            value={title} 
            onChange={(e) => updateTitle(e.target.value)}
            className="text-xl font-bold text-slate-800 bg-transparent border-b-2 border-transparent hover:border-indigo-100 focus:border-indigo-500 focus:outline-none transition-all px-1 min-w-[200px]"
            placeholder="Map Title..."
          />
          {isSyncing && <div className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold animate-pulse">Saved</div>}
        </div>

        <div className="flex items-center gap-3">
           <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-slate-200">
             <div className="flex -space-x-2">
               {collaborators.slice(0,4).map((uid) => (
                 <img 
                   key={uid}
                   src={`https://ui-avatars.com/api/?background=4f46e5&color=fff&name=${encodeURIComponent(uid.slice(0,2).toUpperCase())}`}
                   alt={uid === user.uid ? 'You' : uid}
                   className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                   title={uid === user.uid ? 'You' : uid}
                 />
               ))}
               {collaborators.length > 4 && (
                 <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white text-xs font-bold text-slate-600 flex items-center justify-center">+{collaborators.length - 4}</div>
               )}
             </div>
             <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Live</span>
           </div>

           <div className="hidden md:flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200 focus-within:border-indigo-400 transition-colors">
             <input 
               type="text" 
               placeholder="Enter a topic to expand..." 
               value={brainstormTopic}
               onChange={(e) => setBrainstormTopic(e.target.value)}
               className="bg-transparent px-4 py-1.5 text-sm focus:outline-none w-48 lg:w-72 font-medium"
               onKeyDown={(e) => e.key === 'Enter' && handleAIByBrainstorm()}
             />
             <button 
               onClick={handleAIByBrainstorm}
               disabled={isBrainstorming || !brainstormTopic.trim()}
               className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
             >
               {isBrainstorming ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Brainstorm'}
             </button>
           </div>
           
           <button 
             onClick={addNodeAtCenter}
             className="bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
             Add Node
           </button>

           <button 
             onClick={copyShareLink}
             className="bg-indigo-50 text-indigo-700 border border-indigo-100 hover:border-indigo-300 px-3 py-2 rounded-lg text-xs font-bold transition-all"
           >
             Copy Invite
           </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-grow relative min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeHandler}
          onEdgesChange={onEdgesChangeHandler}
          onConnect={onConnect}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{ 
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed }
          }}
        >
          <Background color="#f1f5f9" gap={20} size={1} />
          <Controls position="bottom-right" className="bg-white border-slate-200 shadow-xl" />
          <MiniMap 
            nodeStrokeColor="#e2e8f0"
            nodeColor={(n) => n.className?.includes('bg-indigo-600') ? '#6366f1' : '#fff'}
            maskColor="rgba(241, 245, 249, 0.7)"
            style={{ borderRadius: '12px' }}
          />
        </ReactFlow>

        {isBrainstorming && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="bg-white shadow-2xl rounded-3xl p-10 flex flex-col items-center border border-indigo-50">
               <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
               <h3 className="text-xl font-bold text-indigo-900">Expanding Mind Map</h3>
               <p className="text-slate-500 text-center max-w-xs mt-2">Gemini AI is analyzing connections for "{brainstormTopic}"...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Editor: React.FC<{ user: User }> = (props) => (
  <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
    <ReactFlowProvider>
      <EditorContent {...props} />
    </ReactFlowProvider>
  </div>
);

export default Editor;
