"use client";

import React, { useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import { FaBell, FaPlus } from 'react-icons/fa';

interface Jurisdiction {
  _id: string;
  name: string;
  subAdmins: string[]; // Array of sub-admin user IDs
}

interface SubAdmin {
  _id: string;
  name: string;
  email: string;
  jurisdictions: string[];
}

export default function AdminFlowDashboard() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTarget, setTaskTarget] = useState<{ type: 'subadmin' | 'jurisdiction'; id: string; name: string } | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) return;
      const { jurisdictions, subAdmins } = await res.json();
      setJurisdictions(jurisdictions);
      setSubAdmins(subAdmins);

      // Build nodes and edges for React Flow
      const flowNodes: Node[] = [];
      const flowEdges: Edge[] = [];
      // Add type for jur
      jurisdictions.forEach((jur: any, i: number) => {
        flowNodes.push({
          id: jur._id,
          type: 'input',
          data: {
            label: (
              <div className="flex flex-col items-center">
                <span className="font-bold text-[#1a237e]">{jur.name}</span>
                <Button size="sm" className="mt-2" onClick={() => { setTaskTarget({ type: 'jurisdiction', id: jur._id, name: jur.name }); setShowTaskModal(true); }}>
                  <FaPlus className="mr-1" /> Assign Task
                </Button>
              </div>
            ),
          },
          position: { x: 100 + i * 300, y: 50 },
        });
        jur.subAdmins.forEach((subId: any, j: number) => {
          const sub = subAdmins.find((s: any) => s._id === subId);
          if (!sub) return;
          // PDF count: not available directly, show '-' for now
          // Pending tasks: not available directly, show 0 for now
          flowNodes.push({
            id: sub._id,
            data: {
              label: (
                <div className="flex flex-col items-center">
                  <span>{sub.name} <span className="text-xs text-gray-500">(PDFs: -)</span></span>
                  <Button size="sm" className="mt-2" onClick={() => { setTaskTarget({ type: 'subadmin', id: sub._id, name: sub.name }); setShowTaskModal(true); }}>
                    <FaPlus className="mr-1" /> Assign Task
                  </Button>
                  {/* Pending tasks badge can be added here if you fetch tasks */}
                </div>
              ),
            },
            position: { x: 100 + i * 300, y: 200 + j * 120 },
          });
          flowEdges.push({
            id: `e-${jur._id}-${sub._id}`,
            source: jur._id,
            target: sub._id,
            animated: true,
          });
        });
      });
      setNodes(flowNodes);
      setEdges(flowEdges);
    }
    fetchData();
  }, []);

  // Handle task assignment (demo: just close modal)
  const handleAssignTask = () => {
    // Here you would update the backend and refresh data
    setShowTaskModal(false);
    setTaskTitle('');
    setTaskDesc('');
    // Optionally show a toast/notification
  };

  return (
    <div className="h-[80vh] w-full bg-white rounded-lg shadow p-4">
      <h2 className="text-2xl font-bold mb-4 text-[#1a237e]">Jurisdiction & Sub-Admin Flow</h2>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
      {/* Task Assignment Modal */}
      <Modal isOpen={showTaskModal} onOpenChange={setShowTaskModal} placement="center">
        <ModalContent>
          <ModalHeader>Assign Task {taskTarget && `to ${taskTarget.name}`}</ModalHeader>
          <ModalBody>
            <input
              className="w-full border rounded p-2 mb-2"
              placeholder="Task Title"
              value={taskTitle}
              onChange={e => setTaskTitle(e.target.value)}
            />
            <textarea
              className="w-full border rounded p-2"
              placeholder="Task Description"
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
            />
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowTaskModal(false)} variant="ghost">Cancel</Button>
            <Button onClick={handleAssignTask} disabled={!taskTitle}>Assign</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 