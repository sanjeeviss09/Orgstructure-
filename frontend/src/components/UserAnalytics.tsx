import React, { useEffect, useState, useMemo } from 'react';
import { fetchUserEngagement, UserEngagement, DEFAULT_AVATAR } from '../lib/api';
import {
  BarChart2, Search, X, RefreshCw, Users,
  TrendingUp, AlertTriangle, CheckCircle2,
  MessageSquare, ClipboardCheck, Wifi,
  ChevronDown, Award
} from 'lucide-react';

type RatingFilter = 'All' | 'Good' | 'Okay' | 'Low Interactive';

const RATING_CONFIG = {
  Good: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    ring: '#10b981',
    icon: <CheckCircle2 className="w-4 h-4" />,
    bar: 'bg-emerald-500',
  },
  Okay: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    ring: '#f59e0b',
    icon: <AlertTriangle className="w-4 h-4" />,
    bar: 'bg-amber-400',
  },
  'Low Interactive': {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    ring: '#ef4444',
    icon: <AlertTriangle className="w-4 h-4" />,
    bar: 'bg-red-500',
  },
};

const RECOMMENDATION: Record<string, string> = {
  Good: 'Highly engaged. Keep recognising their contributions.',
  Okay: 'Moderate engagement. Consider scheduling a 1-on-1 check-in.',
  'Low Interactive': 'Low activity detected. Recommend immediate outreach or wellness survey.',
};

// SVG ring (donut chart) for score
const ScoreRing: React.FC<{ score: number; color: string; size?: number }> = ({ score, color, size = 120 }) => {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const cx = size / 2;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  );
};

interface DrilldownModalProps {
  emp: UserEngagement;
  onClose: () => void;
}

const DrilldownModal: React.FC<DrilldownModalProps> = ({ emp, onClose }) => {
  const cfg = RATING_CONFIG[emp.rating];
  const signals = [
    {
      label: 'Feedback Activity',
      desc: 'Daily wellness feedback submissions in last 30 days',
      icon: <ClipboardCheck className="w-5 h-5 text-indigo-500" />,
      value: emp.feedback_count,
      score: emp.feedback_score,
      maxScore: 40,
      unit: 'submissions',
      barColor: 'bg-indigo-500',
    },
    {
      label: 'Chat Responsiveness',
      desc: 'Messages sent via Admin Support Chat',
      icon: <MessageSquare className="w-5 h-5 text-violet-500" />,
      value: emp.chat_count,
      score: emp.chat_score,
      maxScore: 30,
      unit: 'messages',
      barColor: 'bg-violet-500',
    },
    {
      label: 'Login Activity',
      desc: 'Estimated active days on the platform (last 30 days)',
      icon: <Wifi className="w-5 h-5 text-sky-500" />,
      value: emp.login_days,
      score: emp.login_score,
      maxScore: 30,
      unit: 'active days',
      barColor: 'bg-sky-500',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'popIn 0.22s ease' }}
      >
        {/* Header */}
        <div className={`${cfg.bg} px-6 pt-6 pb-4 border-b ${cfg.border}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <img
                src={emp.photo_url || DEFAULT_AVATAR}
                alt={emp.full_name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
              />
              <div>
                <div className="font-extrabold text-slate-900 text-lg leading-tight">{emp.full_name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="text-slate-500 text-sm font-medium">{emp.designation}</div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                    {emp.dashboard_access}
                  </span>
                </div>
                <div className="text-slate-400 text-xs">{emp.department} · {emp.business_unit}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score ring + badge */}
        <div className="flex items-center gap-6 px-6 py-5 border-b border-slate-100">
          <div className="relative shrink-0">
            <ScoreRing score={emp.score} color={cfg.ring} size={110} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900">{emp.score}</span>
              <span className="text-xs text-slate-400 font-semibold">/ 100</span>
            </div>
          </div>
          <div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold mb-2 ${cfg.badge}`}>
              {cfg.icon}
              {emp.rating}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{RECOMMENDATION[emp.rating]}</p>
          </div>
        </div>

        {/* Signal breakdown */}
        <div className="px-6 py-5 space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engagement Breakdown</div>
          {signals.map(sig => (
            <div key={sig.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sig.icon}
                  <div>
                    <div className="text-sm font-bold text-slate-800">{sig.label}</div>
                    <div className="text-xs text-slate-400">{sig.desc}</div>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="text-sm font-black text-slate-900">{sig.value} <span className="text-xs font-semibold text-slate-400">{sig.unit}</span></div>
                  <div className="text-xs text-slate-400">{sig.score}/{sig.maxScore} pts</div>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${sig.barColor} transition-all duration-700`}
                  style={{ width: `${(sig.score / sig.maxScore) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export const UserAnalytics: React.FC = () => {
  const [data, setData] = useState<UserEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selected, setSelected] = useState<UserEngagement | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUserEngagement();
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const departments = useMemo(() => {
    const depts = Array.from(new Set(data.map(d => d.department).filter(Boolean)));
    return ['All', ...depts.sort()];
  }, [data]);

  const roles = useMemo(() => {
    const rs = Array.from(new Set(data.map(d => d.dashboard_access).filter(Boolean)));
    return ['All', ...rs.sort()];
  }, [data]);

  const filtered = useMemo(() => {
    let arr = [...data];
    if (ratingFilter !== 'All') arr = arr.filter(d => d.rating === ratingFilter);
    if (deptFilter !== 'All') arr = arr.filter(d => d.department === deptFilter);
    if (roleFilter !== 'All') arr = arr.filter(d => d.dashboard_access === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(d =>
        d.full_name.toLowerCase().includes(q) ||
        d.department.toLowerCase().includes(q) ||
        d.designation.toLowerCase().includes(q)
      );
    }
    arr.sort((a, b) => sortBy === 'score' ? b.score - a.score : a.full_name.localeCompare(b.full_name));
    return arr;
  }, [data, ratingFilter, deptFilter, roleFilter, search, sortBy]);

  const counts = useMemo(() => ({
    total: data.length,
    good: data.filter(d => d.rating === 'Good').length,
    okay: data.filter(d => d.rating === 'Okay').length,
    low: data.filter(d => d.rating === 'Low Interactive').length,
    avgScore: data.length ? Math.round(data.reduce((a, b) => a + b.score, 0) / data.length) : 0,
  }), [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold text-sm">Analysing user engagement…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <p className="text-slate-700 font-bold">Failed to load analytics</p>
        <p className="text-slate-400 text-sm">{error}</p>
        <button onClick={load} className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: counts.total, icon: <Users className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Good', value: counts.good, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Okay', value: counts.okay, icon: <TrendingUp className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Low Interactive', value: counts.low, icon: <AlertTriangle className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Avg. Score', value: `${counts.avgScore}/100`, icon: <Award className="w-5 h-5" />, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(card => (
          <div key={card.label} className="glass-panel p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center shrink-0`}>
              {card.icon}
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{card.value}</div>
              <div className="text-xs text-slate-500 font-semibold">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Filters ─── */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="analytics-search"
            type="text"
            placeholder="Search by name, dept, designation…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Rating filter pills */}
        <div className="flex gap-2 flex-wrap">
          {(['All', 'Good', 'Okay', 'Low Interactive'] as RatingFilter[]).map(r => (
            <button
              key={r}
              id={`filter-${r.toLowerCase().replace(' ', '-')}`}
              onClick={() => setRatingFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                ratingFilter === r
                  ? r === 'All'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : `${RATING_CONFIG[r as keyof typeof RATING_CONFIG]?.badge} border-transparent`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {r === 'All' ? 'All Ratings' : r}
              {r !== 'All' && (
                <span className="ml-1.5 opacity-70">
                  {r === 'Good' ? counts.good : r === 'Okay' ? counts.okay : counts.low}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dept filter */}
        <div className="relative">
          <select
            id="analytics-dept-filter"
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
          >
            {departments.map(d => (
              <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Role filter */}
        <div className="relative">
          <select
            id="analytics-role-filter"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
          >
            {roles.map(r => (
              <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-slate-400 font-semibold">Sort:</span>
          {(['score', 'name'] as const).map(s => (
            <button
              key={s}
              id={`sort-${s}`}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                sortBy === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {s === 'score' ? 'Score' : 'Name'}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          id="analytics-refresh"
          onClick={load}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Results count ─── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-slate-500 font-semibold">
          Showing <span className="text-slate-800 font-black">{filtered.length}</span> of {counts.total} active employees
        </span>
        {ratingFilter !== 'All' && (
          <button
            onClick={() => setRatingFilter('All')}
            className="text-xs text-indigo-500 font-bold hover:text-indigo-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear filter
          </button>
        )}
      </div>

      {/* ─── Employee Grid ─── */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-16 text-center">
          <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">No employees match your filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(emp => {
            const cfg = RATING_CONFIG[emp.rating];
            return (
              <button
                key={emp.employee_id}
                id={`emp-card-${emp.employee_id}`}
                onClick={() => setSelected(emp)}
                className={`glass-panel p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-pointer border-2 ${
                  emp.rating === 'Low Interactive'
                    ? 'border-red-100 hover:border-red-300'
                    : emp.rating === 'Okay'
                    ? 'border-amber-100 hover:border-amber-300'
                    : 'border-emerald-100 hover:border-emerald-300'
                } group`}
              >
                {/* Top: avatar + badge */}
                <div className="flex items-start justify-between mb-3">
                  <img
                    src={emp.photo_url || DEFAULT_AVATAR}
                    alt={emp.full_name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-200 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${cfg.badge}`}>
                      {cfg.icon}
                      {emp.rating}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                      {emp.dashboard_access}
                    </span>
                  </div>
                </div>

                {/* Name + role */}
                <div className="mb-3">
                  <div className="font-extrabold text-slate-900 text-sm leading-tight truncate">{emp.full_name}</div>
                  <div className="text-xs text-slate-400 font-medium truncate">{emp.designation}</div>
                  <div className="text-[11px] text-slate-400 truncate">{emp.department}</div>
                </div>

                {/* Score bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-semibold">Engagement Score</span>
                    <span className={`text-sm font-black ${cfg.color}`}>{emp.score}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cfg.bar} transition-all duration-700`}
                      style={{ width: `${emp.score}%` }}
                    />
                  </div>
                </div>

                {/* Mini signal chips */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-lg">
                    <ClipboardCheck className="w-2.5 h-2.5" /> {emp.feedback_count} feedback
                  </span>
                  <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-lg">
                    <MessageSquare className="w-2.5 h-2.5" /> {emp.chat_count} msgs
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Drill-down Modal ─── */}
      {selected && (
        <DrilldownModal emp={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};
