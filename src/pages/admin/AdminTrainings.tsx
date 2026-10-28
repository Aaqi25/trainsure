import React, { useState, useEffect } from 'react';
import { trainingApi, departmentApi, userApi, assignmentApi } from '../../services/api.ts';
import { Modal } from '../../components/common/Modal.tsx';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Clock,
  CheckCircle,
  FileQuestion,
  UserCheck,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react';

export const AdminTrainings: React.FC = () => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [instructor, setInstructor] = useState('');
  const [duration, setDuration] = useState(2);
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [mandatory, setMandatory] = useState(false);
  const [modules, setModules] = useState<any[]>([
    { id: 'mod-1', title: 'Module 1: Introduction', description: '', content: '', durationMinutes: 45, order: 1 },
  ]);

  // Assign Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTrainingId, setAssignTrainingId] = useState('');
  const [assignTrainingTitle, setAssignTrainingTitle] = useState('');
  const [targetType, setTargetType] = useState<'EMPLOYEE' | 'DEPARTMENT'>('DEPARTMENT');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedEmp, setSelectedEmp] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [tRes, dRes, uRes] = await Promise.all([
        trainingApi.getTrainings(),
        departmentApi.getDepartments(),
        userApi.getUsers({ role: 'EMPLOYEE' }),
      ]);
      if (tRes.data?.success) setTrainings(tRes.data.data || []);
      if (dRes.data?.success) setDepartments(dRes.data.data || []);
      if (uRes.data?.success) setEmployees(uRes.data.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTraining(null);
    setTitle('');
    setDescription('');
    setCategory('Engineering');
    setInstructor('');
    setDuration(2);
    setDifficulty('BEGINNER');
    setMandatory(false);
    setModules([
      { id: `mod-${Date.now()}-1`, title: 'Module 1: Overview', description: '', content: '', durationMinutes: 45, order: 1 },
    ]);
    setIsModalOpen(true);
  };

  const addModuleRow = () => {
    setModules(prev => [
      ...prev,
      {
        id: `mod-${Date.now()}-${prev.length + 1}`,
        title: `Module ${prev.length + 1}`,
        description: '',
        content: '',
        durationMinutes: 45,
        order: prev.length + 1,
      },
    ]);
  };

  const removeModuleRow = (idx: number) => {
    if (modules.length <= 1) return;
    setModules(prev => prev.filter((_, i) => i !== idx));
  };

  const updateModuleField = (idx: number, field: string, val: any) => {
    setModules(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTraining) {
        await trainingApi.updateTraining(editingTraining._id, {
          title,
          description,
          category,
          instructor,
          duration,
          difficulty,
          mandatory,
          modules,
        });
      } else {
        await trainingApi.createTraining({
          title,
          description,
          category,
          instructor,
          duration,
          difficulty,
          mandatory,
          modules,
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save course');
    }
  };

  const openAssignModal = (t: any) => {
    setAssignTrainingId(t._id);
    setAssignTrainingTitle(t.title);
    setSelectedDept('');
    setSelectedEmp('');
    const inTwoWeeks = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
    setDueDate(inTwoWeeks);
    setPriority('HIGH');
    setAssignSuccess(null);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        trainingId: assignTrainingId,
        dueDate: new Date(dueDate).toISOString(),
        priority,
      };

      if (targetType === 'DEPARTMENT') {
        payload.departmentId = selectedDept;
      } else {
        payload.employeeId = selectedEmp;
      }

      const res = await assignmentApi.createAssignment(payload);
      if (res.data?.success) {
        setAssignSuccess(res.data.message);
        setTimeout(() => {
          setIsAssignModalOpen(false);
          setAssignSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Assignment failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Training & Course Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure learning modules, mandatory regulatory programs, and bulk assignments
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Training Course
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {trainings.map(t => (
          <div
            key={t._id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {t.category}
                </span>
                {t.mandatory ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700">
                    Mandatory
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-400">Optional</span>
                )}
              </div>

              <h3 className="mt-2 text-base font-bold text-slate-900 leading-snug">{t.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>

              <div className="mt-4 space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.moduleCount || (t.modules || []).length} Learning Modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.duration} Hours duration</span>
                  <span>·</span>
                  <span className="font-semibold text-slate-700">{t.difficulty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {t.hasAssessment ? 'Final Exam Attached' : 'No Assessment Required'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Instructor: <strong className="text-slate-700">{t.instructor}</strong>
              </span>

              <button
                onClick={() => openAssignModal(t)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Assign Course
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTraining ? 'Edit Training Course' : 'Create Training Course'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveTraining} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Advanced Incident Response & Threat Hunting"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Core learning objectives..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Est. Duration (Hours)
              </label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="mand-check"
              checked={mandatory}
              onChange={e => setMandatory(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="mand-check" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Mandatory Compliance Training (Enforced by organizational policy)
            </label>
          </div>

          {/* Module Builder */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Course Modules ({modules.length})
              </h4>
              <button
                type="button"
                onClick={addModuleRow}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Module
              </button>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {modules.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      Module #{idx + 1}
                    </span>
                    {modules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeModuleRow(idx)}
                        className="text-slate-400 hover:text-rose-600 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={m.title}
                    onChange={e => updateModuleField(idx, 'title', e.target.value)}
                    placeholder="Module title..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                  />
                  <textarea
                    rows={2}
                    value={m.content}
                    onChange={e => updateModuleField(idx, 'content', e.target.value)}
                    placeholder="Lesson text content / learning material..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Publish Training
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Course Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Assign Course: ${assignTrainingTitle}`}
        subtitle="Enroll team members or entire departments into this training"
      >
        {assignSuccess ? (
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-center text-xs font-semibold">
            {assignSuccess}
          </div>
        ) : (
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Audience
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('DEPARTMENT')}
                  className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                    targetType === 'DEPARTMENT'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Whole Department
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('EMPLOYEE')}
                  className={`py-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                    targetType === 'EMPLOYEE'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Individual Employee
                </button>
              </div>
            </div>

            {targetType === 'DEPARTMENT' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Department
                </label>
                <select
                  required
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">Choose department...</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.employeeCount || 0} employees)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Employee
                </label>
                <select
                  required
                  value={selectedEmp}
                  onChange={e => setSelectedEmp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">Choose employee...</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.jobTitle})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Completion Deadline
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
                  <option value="HIGH">High (Urgent)</option>
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
