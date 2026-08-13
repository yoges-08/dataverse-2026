import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Calendar, Users, Trophy, Download, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { getStudentName } from '../../utils/studentName';
import API from '../../services/api';

export default function CoordinatorDashboard() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [winners, setWinners] = useState([
    { position: '1st Place', studentName: '', college: '', regNo: '' },
    { position: '2nd Place', studentName: '', college: '', regNo: '' },
    { position: '3rd Place', studentName: '', college: '', regNo: '' }
  ]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await API.get('/events');
      if (res.data.success) {
        setEvents(res.data.events);
        if (res.data.events.length > 0) {
          selectEvent(res.data.events[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching coordinator events:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectEvent = async (eventId) => {
    try {
      const res = await API.get(`/events/${eventId}`);
      if (res.data.success) {
        setSelectedEvent(res.data.event);
        setRegistrations(res.data.registrations);
        if (res.data.event.winners && res.data.event.winners.length > 0) {
          setWinners(res.data.event.winners);
        }
      }
    } catch (err) {
      console.error('Error fetching event detail:', err);
    }
  };

  const handleSaveWinners = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      const res = await API.post(`/events/${selectedEvent._id}/winners`, { winners });
      if (res.data.success) {
        setMsg('Winners declared successfully!');
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error saving winners:', err);
    }
  };

  const exportParticipantCSV = () => {
    if (!selectedEvent) return;
    const headers = ['Symposium Code,Register No,Student Name,College,Department,Team Members,Status,Checked In\n'];
    const rows = registrations.map(r => {
      const s = r.student;
      const uName = getStudentName(s, 'Student');
      const team = (r.teamMembers || []).map(tm => `${tm.name} (${tm.phone})`).join('; ');
      return `"${s?.symposiumCode}","${s?.registerNumber}","${uName}","${s?.collegeName}","${s?.department}","${team}","${s?.verificationStatus}","${s?.isCheckedIn ? 'Yes' : 'No'}"\n`;
    });

    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${selectedEvent.title}_Participants_${Date.now()}.csv`);
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
            Event Coordinator Portal
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Event Management & Winner Declaration</h1>
        </div>

        {selectedEvent && (
          <button
            onClick={exportParticipantCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Participant List (CSV)</span>
          </button>
        )}
      </div>

      {/* Select Event */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {events.map(ev => (
          <button
            key={ev._id}
            onClick={() => selectEvent(ev._id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedEvent && selectedEvent._id === ev._id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {ev.title} ({ev.category})
          </button>
        ))}
      </div>

      {selectedEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Col 1 & 2: Participants Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Registered Participants ({registrations.length})</h3>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Symposium Code</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">College & Dept</th>
                      <th className="p-3">Team</th>
                      <th className="p-3">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {registrations.map(r => {
                      const s = r.student;
                      if (!s) return null;
                      const uName = getStudentName(s, 'Student');
                      return (
                        <tr key={r._id}>
                          <td className="p-3 font-mono font-bold text-indigo-400">{s.symposiumCode}</td>
                          <td className="p-3 font-bold text-white">{uName}</td>
                          <td className="p-3 text-slate-300">{s.collegeName} ({s.department})</td>
                          <td className="p-3">
                            {r.teamMembers && r.teamMembers.length > 0 ? (
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {r.teamMembers.map((tm, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] text-cyan-200">
                                    {tm.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">Solo</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.isCheckedIn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {s.isCheckedIn ? 'Present' : 'Absent'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Col 3: Upload Winners */}
          <div className="space-y-4">
            <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 space-y-4">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Trophy className="w-5 h-5" />
                <h3>Declare Event Winners</h3>
              </div>

              {msg && <p className="text-xs text-emerald-400 font-bold">{msg}</p>}

              <form onSubmit={handleSaveWinners} className="space-y-3 text-xs">
                {winners.map((w, idx) => (
                  <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-amber-300 block">{w.position}</span>
                    <input
                      type="text"
                      placeholder="Student Full Name"
                      value={w.studentName}
                      onChange={(e) => {
                        const newW = [...winners];
                        newW[idx].studentName = e.target.value;
                        setWinners(newW);
                      }}
                      className="w-full p-2 bg-slate-950 rounded border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      placeholder="College Name"
                      value={w.college}
                      onChange={(e) => {
                        const newW = [...winners];
                        newW[idx].college = e.target.value;
                        setWinners(newW);
                      }}
                      className="w-full p-2 bg-slate-950 rounded border border-slate-700 text-white"
                    />
                  </div>
                ))}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-indigo-600 text-white font-bold rounded-xl shadow-md"
                >
                  Save Winners & Publish Results
                </button>
              </form>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
