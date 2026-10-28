import React, { useState, useEffect } from 'react';
import { intelligenceApi } from '../../services/api.ts';
import { Lightbulb, ExternalLink, Clock, Sparkles, BookOpen, Layers } from 'lucide-react';

export const EmployeeRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [gapSkills, setGapSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    intelligenceApi
      .getMyRecommendations()
      .then(res => {
        if (res.data?.success) {
          setRecommendations(res.data.data?.recommendations || []);
          setGapSkills(res.data.data?.gapSkillsIdentified || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Targeted Learning Recommendations
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic suggestions mapped directly to bridge your identified skill gaps and accelerate role readiness
        </p>
      </div>

      {gapSkills.length > 0 && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-3">
          <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold">Prioritized Competency Focus: </span>
            <span>{gapSkills.join(' · ')}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recommendations.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            No active skill gaps detected. You satisfy all benchmark proficiencies!
          </div>
        ) : (
          recommendations.map(r => (
            <div
              key={r.resourceId}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    {r.skillName}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.priority === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {r.priority} Priority
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900 leading-snug">{r.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.description}</p>

                {/* Recommendation Rationale */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                  <span className="font-semibold text-indigo-700">Why recommended: </span>
                  {r.reason}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 font-medium text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {r.duration}
                  </span>
                  <span>{r.difficulty}</span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate max-w-36">{r.provider}</span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs flex items-center gap-1 transition-colors"
                >
                  <span>Start Course</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
