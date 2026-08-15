import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Users } from 'lucide-react';
import TeamManagementTab from './dashboards/TeamManagementTab';

export default function TeamManagement() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Team Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Build your event teams with registered classmates from your college.
            </p>
          </div>
        </div>
        <Link
          to="/dashboard/student"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-[11px] text-indigo-200 flex items-start space-x-2.5">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
        <span>
          Any member can add or remove teammates — everyone has equal access. Teams are limited by each event&apos;s
          member cap and always keep at least one member.
        </span>
      </div>

      <TeamManagementTab />
    </div>
  );
}