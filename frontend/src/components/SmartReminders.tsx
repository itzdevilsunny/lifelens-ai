import React, { useState } from 'react';
import { Plus, Trash2, BellRing, Pill, AlertTriangle, Check, Play, Square } from 'lucide-react';

interface Reminder {
  id: number;
  title: string;
  time: string;
  type: string; // "medicine", "bill", "general"
  details: string | null;
  is_active: boolean;
}

interface SmartRemindersProps {
  reminders: Reminder[];
  onAddReminder: (title: string, time: string, type: string, details: string) => Promise<void>;
  onToggleReminder: (id: number, isActive: boolean) => Promise<void>;
  onDeleteReminder: (id: number) => Promise<void>;
}

export const SmartReminders: React.FC<SmartRemindersProps> = ({
  reminders,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder
}) => {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [type, setType] = useState('medicine');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddReminder(title, time, type, details);
      setTitle('');
      setDetails('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group reminders
  const medicines = reminders.filter(r => r.type === 'medicine');
  const others = reminders.filter(r => r.type !== 'medicine');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Left 2 Cols: Main Reminders List */}
      <div className="md:col-span-2 space-y-6">
        {/* Medicines Section */}
        <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover">
          <div className="flex items-center gap-3 border-b border-orange-50 pb-4 mb-4">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Pill size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Medicine Reminders</h3>
              <p className="text-xs text-gray-400">Track and take your prescriptions on time</p>
            </div>
          </div>

          {medicines.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-orange-100/50 rounded-xl">
              <p className="text-sm">No medicine reminders active.</p>
              <p className="text-xs mt-1">Upload a prescription via the OCR Scanner to schedule automatically!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[350px] overflow-y-auto pr-1">
              {medicines.map((med) => (
                <div 
                  key={med.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-all duration-300 group ${
                    med.is_active 
                      ? 'bg-white border-orange-100 hover:border-orange-200' 
                      : 'bg-emerald-50/10 border-emerald-100/30'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2.5 items-start">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                        med.is_active ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        <Pill size={14} />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold ${med.is_active ? 'text-gray-700' : 'line-through text-gray-400'}`}>
                          {med.title}
                        </h4>
                        <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">
                          🕒 {med.time}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteReminder(med.id)}
                      className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {med.details && (
                    <p className={`text-xs ${med.is_active ? 'text-gray-500' : 'line-through text-gray-400'}`}>
                      {med.details}
                    </p>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onToggleReminder(med.id, !med.is_active)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                        med.is_active 
                          ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-500/10'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      {med.is_active ? (
                        <>
                          <Check size={12} />
                          <span>Mark Taken</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} />
                          <span>Undo / Re-active</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Reminders Section */}
        <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover">
          <div className="flex items-center gap-3 border-b border-orange-50 pb-4 mb-4">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <BellRing size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">General Alerts</h3>
              <p className="text-xs text-gray-400">Bills, notices and general reminders</p>
            </div>
          </div>

          {others.length === 0 ? (
            <div className="text-center py-6 text-gray-400 border-2 border-dashed border-orange-100/50 rounded-xl">
              <p className="text-sm">No general reminders scheduled.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {others.map((rem) => (
                <div 
                  key={rem.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border group transition-all ${
                    rem.is_active ? 'bg-white border-orange-100/50 hover:border-orange-200' : 'bg-gray-50/50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      rem.type === 'bill' ? 'bg-amber-100 text-amber-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      <AlertTriangle size={14} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${rem.is_active ? 'text-gray-700' : 'line-through text-gray-400'}`}>
                        {rem.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        {rem.details ? `${rem.details} | ` : ''}Scheduled: {rem.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleReminder(rem.id, !rem.is_active)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors border ${
                        rem.is_active 
                          ? 'border-orange-200 hover:bg-orange-50 text-orange-500' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      }`}
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => onDeleteReminder(rem.id)}
                      className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right 1 Col: Add Reminder Form */}
      <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium h-fit">
        <h3 className="font-bold text-gray-800 text-lg border-b border-orange-50 pb-4 mb-4">Add Reminder</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Reminder Name</label>
            <input
              type="text"
              placeholder="e.g. Paracetamol 650mg, Electricity Bill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-2.5 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 bg-white transition-all text-gray-600"
              >
                <option value="medicine">💊 Medicine</option>
                <option value="bill">💵 Utility Bill</option>
                <option value="general">🔔 General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Dosage / Details</label>
            <textarea
              placeholder="e.g., Take 1 tablet after breakfast, Bill amount Rs. 1500"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl flex items-center justify-center gap-1 transition-all duration-300 shadow-md shadow-orange-500/15 cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Reminder</span>
          </button>
        </form>
      </div>
    </div>
  );
};
