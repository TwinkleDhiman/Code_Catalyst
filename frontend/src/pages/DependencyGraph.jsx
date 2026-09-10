import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../App";

const DependencyGraph = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDependencies = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/dependencies/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (e) {
        console.error("Failed to fetch dependency graph", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDependencies();
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="border-b border-gray-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Dependency Graph
        </h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          Visualizing internal project file and package dependencies.
        </p>
      </div>

      <div className="glass-panel border border-gray-900 rounded-3xl p-12 shadow-2xl flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-950/40 border border-primary-900/60 flex items-center justify-center text-primary-400 font-bold text-sm">
          Topology
        </div>
        <h2 className="text-xl font-bold text-gray-300">
          Dependency Visualization
        </h2>
        <p className="text-xs text-gray-500 max-w-md">
          Internal project file and package dependency graph visualization.
        </p>
      </div>
    </div>
  );
};

export default DependencyGraph;
