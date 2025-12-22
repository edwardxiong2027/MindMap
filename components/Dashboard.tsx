
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { MindMapDoc } from '../types';

const Dashboard: React.FC<{ user: User }> = ({ user }) => {
  const [maps, setMaps] = useState<MindMapDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'maps'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mapsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MindMapDoc[];
      setMaps(mapsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const createNewMap = async () => {
    try {
      const docRef = await addDoc(collection(db, 'maps'), {
        title: 'Untitled Mind Map',
        ownerId: user.uid,
        nodes: [
          { id: '1', data: { label: 'Main Topic' }, position: { x: 250, y: 250 }, type: 'input' }
        ],
        edges: [],
        updatedAt: serverTimestamp(),
        collaborators: [user.uid]
      });
      navigate(`/editor/${docRef.id}`);
    } catch (error) {
      console.error("Error creating map:", error);
    }
  };

  const deleteMap = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this map?')) {
      await deleteDoc(doc(db, 'maps', id));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.displayName?.split(' ')[0] || 'User'}</h1>
          <p className="text-slate-500 mt-1">Manage and create your visual projects.</p>
        </div>
        <button 
          onClick={createNewMap}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Mind Map
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 bg-white border border-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {maps.length > 0 ? (
            maps.map((map) => (
              <div 
                key={map.id} 
                onClick={() => navigate(`/editor/${map.id}`)}
                className="group bg-white border border-slate-200 rounded-2xl p-6 cursor-pointer hover:border-indigo-400 hover:shadow-xl transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={(e) => deleteMap(map.id, e)}
                     className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </button>
                </div>

                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 truncate pr-8">{map.title}</h3>
                <p className="text-sm text-slate-400">
                  {(() => {
                    const ts = (map as any).updatedAt;
                    const date = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
                    return date ? `Updated ${date.toLocaleDateString()}` : 'Not yet saved';
                  })()}
                </p>
                <div className="mt-4 flex -space-x-2">
                   <img src={`https://ui-avatars.com/api/?name=${user.displayName}`} className="w-6 h-6 rounded-full border-2 border-white" alt="Owner" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900">No mind maps yet</h3>
              <p className="text-slate-500 mb-6">Create your first map to start visualizing your ideas.</p>
              <button 
                onClick={createNewMap}
                className="text-indigo-600 font-bold hover:underline"
              >
                + Create New Map
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
