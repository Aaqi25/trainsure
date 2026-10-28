import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { assessmentApi } from '../../services/api.ts';
import { StatusBadge } from '../../components/common/StatusBadge.tsx';
import { ClipboardCheck, Clock, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const EmployeeAssessments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const directId = searchParams.get('id');

  const [assessments, setAssessments] = useState<any[]>([]);
  const [activeAssessment, setActiveAssessment] = useState<any | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assessmentApi
      .getAssessments()
      .then(res => {
        if (res.data?.success) {
          const list = res.data.data || [];
          setAssessments(list);
          if (directId) {
            const match = list.find((a: any) => a._id === directId);
            if (match) startExam(match._id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [directId]);

  // Timer countdown
  useEffect(() => {
    if (!activeAssessment || timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeAssessment, timeLeft, result]);

  const startExam = async (id: string) => {
    try {
      const res = await assessmentApi.getAssessmentById(id);
      if (res.data?.success) {
        const exam = res.data.data;
        setActiveAssessment(exam);
        setAnswers({});
        setResult(null);
        setTimeLeft(exam.timeLimit * 60);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not load exam');
    }
  };

  const handleSelectOption = (questionId: string, optIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optIndex,
    }));
  };

  const handleSubmitExam = async () => {
    if (!activeAssessment) return;
    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));

      const res = await assessmentApi.submitAssessment(activeAssessment._id, {
        answers: formattedAnswers,
      });

      if (res.data?.success) {
        setResult(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Competency Assessments & Certification Exams
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Complete timed technical evaluations to generate verified evidence for your workforce skill portfolio
        </p>
      </div>

      {!activeAssessment ? (
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
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Passing: {a.passingScore}%
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900">{a.title}</h3>
                <p className="text-xs text-indigo-600 font-medium mt-0.5">{a.trainingTitle}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{a.questionCount} Questions</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {a.timeLimit} Mins Limit
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => startExam(a._id)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Start Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : result ? (
        /* Results View */
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {result.passed ? '🎉 Assessment Passed!' : 'Exam Result: Needs Improvement'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation for {activeAssessment.title}
              </p>
            </div>
            <button
              onClick={() => {
                setActiveAssessment(null);
                setResult(null);
              }}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Return to Exams List
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {result.score}%
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Your Score
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {result.earnedMarks} / {result.totalMarks}
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Marks Earned
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <StatusBadge status={result.passed ? 'PASSED' : 'FAILED'} size="md" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                Required: {result.passingScore}%
              </p>
            </div>
          </div>

          {result.passed && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Automated Skill Evidence Generated!</p>
                <p className="text-emerald-700 mt-0.5">
                  Your passing score was automatically minted as verified assessment evidence and credited to your skill matrix.
                </p>
              </div>
            </div>
          )}

          {/* Question Breakdown Review */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Detailed Question Review
            </h3>

            <div className="space-y-3">
              {(result.detailedReview || []).map((q: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    q.isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      Q{idx + 1}: {q.question}
                    </span>
                    <span
                      className={`font-semibold shrink-0 ${
                        q.isCorrect ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {q.isCorrect ? `+${q.marksEarned} pts` : `0 / ${q.maxMarks} pts`}
                    </span>
                  </div>

                  <div className="space-y-1 pl-2">
                    {q.options.map((opt: string, optIdx: number) => {
                      const isUserSelected = q.selectedOption === optIdx;
                      const isRealCorrect = q.correctAnswer === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2 rounded text-xs flex items-center justify-between ${
                            isRealCorrect
                              ? 'bg-emerald-100 text-emerald-900 font-semibold'
                              : isUserSelected
                              ? 'bg-rose-100 text-rose-900'
                              : 'text-slate-600'
                          }`}
                        >
                          <span>
                            {optIdx + 1}. {opt}
                          </span>
                          {isRealCorrect && (
                            <span className="text-[10px] uppercase font-bold text-emerald-700">
                              ✓ Correct Answer
                            </span>
                          )}
                          {isUserSelected && !isRealCorrect && (
                            <span className="text-[10px] uppercase font-bold text-rose-700">
                              Your Selection
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Active Exam Taking View */
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          {/* Exam Header with Countdown Timer */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">{activeAssessment.title}</h2>
              <p className="text-xs text-slate-500">
                Answer all multiple choice questions before time expires
              </p>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              <Clock className="w-4 h-4 animate-pulse text-amber-600" />
              <span className="text-xs font-mono font-bold tracking-wider">
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {(activeAssessment.questions || []).map((q: any, qIdx: number) => (
              <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-xs text-slate-900 leading-snug">
                    Question {qIdx + 1}: {q.question}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    {q.marks} pts
                  </span>
                </div>

                <div className="space-y-2">
                  {(q.options || []).map((opt: string, optIdx: number) => {
                    const isSelected = answers[q.id] === optIdx;
                    return (
                      <label
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectOption(q.id, optIdx)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-400">
              Answered: {Object.keys(answers).length} of {(activeAssessment.questions || []).length}
            </span>

            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Grading Answers...' : 'Submit Assessment for Grading'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
