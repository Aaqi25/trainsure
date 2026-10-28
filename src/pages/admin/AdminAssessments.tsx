import React, { useState, useEffect } from 'react';
import { assessmentApi, trainingApi } from '../../services/api.ts';
import { Modal } from '../../components/common/Modal.tsx';
import { ClipboardCheck, Plus, Clock, HelpCircle, CheckCircle, Trash2 } from 'lucide-react';

export const AdminAssessments: React.FC = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trainingId, setTrainingId] = useState('');
  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState(20);
  const [questions, setQuestions] = useState<any[]>([
    {
      id: 'q-1',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 25,
      explanation: '',
    },
  ]);

  const fetchData = async () => {
    try {
      const [aRes, tRes] = await Promise.all([
        assessmentApi.getAssessments(),
        trainingApi.getTrainings(),
      ]);
      if (aRes.data?.success) setAssessments(aRes.data.data || []);
      if (tRes.data?.success) setTrainings(tRes.data.data || []);
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
    setTrainingId(trainings[0]?._id || '');
    setTitle('');
    setPassingScore(70);
    setTimeLimit(20);
    setQuestions([
      {
        id: `q-${Date.now()}-1`,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 25,
        explanation: '',
      },
    ]);
    setIsModalOpen(true);
  };

  const addQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 25,
        explanation: '',
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestionText = (idx: number, text: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx].question = text;
      return copy;
    });
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].options[optIdx] = text;
      return copy;
    });
  };

  const setCorrectOption = (qIdx: number, optIdx: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx].correctAnswer = optIdx;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assessmentApi.createAssessment({
        trainingId,
        title,
        passingScore,
        timeLimit,
        questions,
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create assessment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Assessments & Question Banks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure graded exams, passing benchmarks, time limits, and automated skill evidence generation
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assessments.map(a => (
          <div
            key={a._id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                  Pass: {a.passingScore}%
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-slate-900">{a.title}</h3>
              <p className="text-xs text-indigo-600 font-medium mt-1">
                Linked Course: {a.trainingTitle}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  {a.questionCount} Questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {a.timeLimit} Mins limit
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Assessment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Final Assessment Exam"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attached Training Course
            </label>
            <select
              required
              value={trainingId}
              onChange={e => setTrainingId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="">Select course...</option>
              {trainings.map(t => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assessment Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Security Awareness Exam"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={e => setPassingScore(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time Limit (Minutes)
              </label>
              <input
                type="number"
                min={5}
                value={timeLimit}
                onChange={e => setTimeLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Questions Builder */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Multiple Choice Questions ({questions.length})
              </h4>
              <button
                type="button"
                onClick={addQuestion}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>

            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      Question #{qIdx + 1}
                    </span>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-slate-400 hover:text-rose-600 text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    value={q.question}
                    onChange={e => updateQuestionText(qIdx, e.target.value)}
                    placeholder="Enter question text..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                  />

                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] text-slate-400 font-medium">
                      Select radio button next to the CORRECT answer:
                    </p>
                    {q.options.map((opt: string, optIdx: number) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correctAnswer === optIdx}
                          onChange={() => setCorrectOption(qIdx, optIdx)}
                          className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={e => updateOptionText(qIdx, optIdx, e.target.value)}
                          placeholder={`Option ${optIdx + 1}`}
                          className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                    ))}
                  </div>
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
              Save Assessment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
