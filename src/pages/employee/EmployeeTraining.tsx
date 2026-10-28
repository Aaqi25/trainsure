import React, { useState, useEffect } from 'react';
import { assignmentApi } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ProgressBar } from '../../components/common/ProgressBar.tsx';
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
  ClipboardCheck,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EmployeeTraining: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAssignments = async () => {
    try {
      const res = await assignmentApi.getMyAssignments();
      if (res.data?.success) {
        const list = res.data.data || [];
        setAssignments(list);
        if (list.length > 0 && !selectedAssignment) {
          setSelectedAssignment(list[0]);
          if ((list[0].training?.modules || []).length > 0) {
            setSelectedModule(list[0].training.modules[0]);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSelectCourse = (a: any) => {
    setSelectedAssignment(a);
    if ((a.training?.modules || []).length > 0) {
      setSelectedModule(a.training.modules[0]);
    } else {
      setSelectedModule(null);
    }
    setActionMessage(null);
  };

  const handleToggleModuleCompletion = async (moduleId: string, isCompleted: boolean) => {
    if (!selectedAssignment) return;
    try {
      const res = await assignmentApi.updateProgress(selectedAssignment._id, {
        moduleId,
        markCompleted: !isCompleted,
      });
      if (res.data?.success) {
        const updated = res.data.data;
        setActionMessage(
          !isCompleted
            ? '✓ Module marked completed! Progress updated on backend.'
            : 'Module reset to incomplete.'
        );

        // Update local state
        setSelectedAssignment((prev: any) => ({
          ...prev,
          progress: updated.progress,
          status: updated.status,
          completedModules: updated.completedModules,
        }));

        setAssignments(prev =>
          prev.map(item =>
            item._id === selectedAssignment._id
              ? {
                  ...item,
                  progress: updated.progress,
                  status: updated.status,
                  completedModules: updated.completedModules,
                }
              : item
          )
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update module completion');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedSet = new Set(selectedAssignment?.completedModules || []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Assigned Learning Courses & Modules
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Work through lessons, track verified progress milestones, and complete certification exams
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Course Selection List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Enrolled Programs ({assignments.length})
          </h2>

          <div className="space-y-2">
            {assignments.map(a => {
              const isSelected = selectedAssignment?._id === a._id;
              return (
                <div
                  key={a._id}
                  onClick={() => handleSelectCourse(a)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-md ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                      {a.training?.title}
                    </span>
                    <StatusBadge status={a.status} size="sm" />
                  </div>

                  <div className="mt-2.5">
                    <ProgressBar progress={a.progress || 0} size="sm" />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                    <span>{a.training?.duration} Hours</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Module Viewer & Interactive Learning Space */}
        <div className="lg:col-span-8">
          {selectedAssignment ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Course Header Banner */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      {selectedAssignment.training?.category}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {selectedAssignment.training?.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedAssignment.training?.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={selectedAssignment.status} size="md" />
                    <p className="text-xs font-mono font-bold text-slate-900 mt-1">
                      {selectedAssignment.progress}% Completed
                    </p>
                  </div>
                </div>

                {/* Attached Assessment Prompt */}
                {selectedAssignment.assessment && (
                  <div className="mt-4 p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-950">
                        Final Certification Exam Available
                      </p>
                      <p className="text-[11px] text-indigo-700">
                        Passing score: {selectedAssignment.assessment.passingScore}% · Limit:{' '}
                        {selectedAssignment.assessment.timeLimit} Mins
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/employee/assessments?id=${selectedAssignment.assessment._id}`)
                      }
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      Take Exam
                    </button>
                  </div>
                )}
              </div>

              {actionMessage && (
                <div className="px-6 py-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                  <span>{actionMessage}</span>
                  <button onClick={() => setActionMessage(null)}>×</button>
                </div>
              )}

              {/* Module Nav & Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 min-h-[380px]">
                {/* Modules Navigation Sidebar */}
                <div className="md:col-span-5 p-4 space-y-2 bg-slate-50/30">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Course Syllabus
                  </h3>
                  {(selectedAssignment.training?.modules || []).map((m: any, idx: number) => {
                    const isDone = completedSet.has(m.id);
                    const isCurrent = selectedModule?.id === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModule(m);
                          setActionMessage(null);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                          isCurrent
                            ? 'bg-white border border-indigo-200 shadow-xs'
                            : 'hover:bg-slate-100/60'
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs ${
                              isCurrent ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                            } truncate`}
                          >
                            {m.title}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {m.durationMinutes} Minutes
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Lesson Reading Area */}
                <div className="md:col-span-7 p-6 flex flex-col justify-between">
                  {selectedModule ? (
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900">{selectedModule.title}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {selectedModule.durationMinutes} min reading
                        </span>
                      </div>

                      <div className="mt-4 text-xs text-slate-700 leading-relaxed space-y-3">
                        <p>{selectedModule.description}</p>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-slate-800 text-xs">
                          {selectedModule.content ||
                            'Complete this module by studying the designated coursework and reviewing best practices.'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Select a module from the syllabus to begin
                    </div>
                  )}

                  {selectedModule && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Status:{' '}
                        <strong className="text-slate-700">
                          {completedSet.has(selectedModule.id) ? 'Completed' : 'Incomplete'}
                        </strong>
                      </span>

                      <button
                        onClick={() =>
                          handleToggleModuleCompletion(
                            selectedModule.id,
                            completedSet.has(selectedModule.id)
                          )
                        }
                        className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
                          completedSet.has(selectedModule.id)
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {completedSet.has(selectedModule.id)
                          ? 'Mark Incomplete'
                          : '✓ Mark Module Completed'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
              No training selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
