
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const UserCenter: React.FC<{ user: User }> = ({ user }) => {
  const [stats, setStats] = useState({
    totalMaps: 0,
    totalNodes: 0,
    creationDates: [] as { date: string, count: number }[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      const q = query(collection(db, 'maps'), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      
      let nodeCount = 0;
      const dateMap: Record<string, number> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        nodeCount += (data.nodes || []).length;
        
        if (data.updatedAt) {
          const date = new Date(data.updatedAt.seconds * 1000).toLocaleDateString();
          dateMap[date] = (dateMap[date] || 0) + 1;
        }
      });

      const creationDates = Object.entries(dateMap).map(([date, count]) => ({ date, count })).slice(-7);

      setStats({
        totalMaps: snapshot.size,
        totalNodes: nodeCount,
        creationDates
      });
    };

    fetchStats();
  }, [user.uid]);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm mb-8">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600"></div>
        <div className="px-8 pb-8 -mt-12">
          <div className="flex flex-col sm:flex-row items-end gap-6 mb-8">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || user.email}`} 
              alt="Avatar" 
              className="w-32 h-32 rounded-3xl border-4 border-white shadow-lg bg-white"
            />
            <div className="flex-grow pb-2">
              <h1 className="text-3xl font-extrabold text-slate-900">{user.displayName || 'Unnamed User'}</h1>
              <p className="text-slate-500 font-medium">{user.email}</p>
            </div>
            <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-xl font-bold transition-all mb-2">
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { label: "Mind Maps", value: stats.totalMaps, color: "bg-indigo-50 text-indigo-600" },
              { label: "Total Nodes", value: stats.totalNodes, color: "bg-emerald-50 text-emerald-600" },
              { label: "Collaborations", value: 0, color: "bg-amber-50 text-amber-600" }
            ].map((stat, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">{stat.label}</p>
                <p className="text-4xl font-black text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Activity (Last 7 Days)</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.creationDates}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.creationDates.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#818cf8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCenter;
