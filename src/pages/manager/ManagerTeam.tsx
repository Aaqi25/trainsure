import React, { useState, useEffect } from 'react';
import { userApi, trainingApi, assignmentApi } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { Users, GraduationCap, Compass, Mail, ChevronRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ManagerTeam: React.FC = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [selectedTrainingId, setSelectedTrainingId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchTeam = async () => {
    try {
      const [uRes, tRes] = await Promise.all([
        userApi.getUsers({ managerId: user?._id }),
        trainingApi.getTrainings(),
      ]);
      if (uRes.data?.success) setTeam(uRes.data.data || []);
      if (tRes.data?.success) setTrainings(tRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [user?._id]);

  const openAssignModal = (emp: any) => {
    setSelectedEmp(emp);
    setSelectedTrainingId(trainings[0]?._id || '');
    const inTwoWeeks = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
    setDueDate(inTwoWeeks);
    setPriority('HIGH');
    setFeedback(null);
    setIsAssignModalOpen(true);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !selectedTrainingId) return;
    try {
      await assignmentApi.createAssignment({
        employeeId: selectedEmp._id,
        trainingId: selectedTrainingId,
        dueDate: new Date(dueDate).toISOString(),
        priority,
      });
      setFeedback('Training assigned successfully.');
      setTimeout(() => {
        setIsAssignModalOpen(false);
        setFeedback(null);
      }, 1200);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Supervised Team Members
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View direct reporting staff, capability readiness, and issue targeted learning assignments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {team.map(emp => (
          <div
            key={emp._id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{emp.name}</h3>
                  <p className="text-xs text-indigo-600 font-semibold">{emp.jobTitle}</p>
                </div>
                <StatusBadge status={emp.status} size="sm" />
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-400">ID:</span> {emp.employeeId}
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Dept: <strong className="text-slate-700">{emp.department?.name || 'Assigned'}</strong>
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => navigate(`/manager/readiness?employeeId=${emp._id}`)}
                className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                Readiness
              </button>

              <button
                onClick={() => openAssignModal(emp)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Assign Course
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Training to ${selectedEmp?.name}`}
      >
        {feedback ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-center text-xs font-semibold">
            {feedback}
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Course
              </label>
              <select
                required
                value={selectedTrainingId}
                onChange={e => setSelectedTrainingId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                {trainings.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.title} ({t.difficulty})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
