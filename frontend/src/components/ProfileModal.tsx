import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, MapPin, CircleDollarSign, Cake } from 'lucide-react';

interface UserProfile {
  name: string;
  age: number;
  state: string;
  occupation: string;
  monthly_budget: number;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (updatedUser: UserProfile) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onSave }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(30);
  const [state, setState] = useState('Delhi');
  const [occupation, setOccupation] = useState('Working Professional');
  const [budget, setBudget] = useState(25000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state with user prop when modal opens
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setAge(user.age);
      setState(user.state);
      setOccupation(user.occupation);
      setBudget(user.monthly_budget);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !occupation.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        age: Number(age),
        state: state,
        occupation: occupation.trim(),
        monthly_budget: Number(budget)
      });
      onClose();
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Error saving profile updates.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const statesOfIndia = [
    "Maharashtra",
    "Madhya Pradesh",
    "Delhi",
    "Karnataka",
    "Uttar Pradesh",
    "Gujarat",
    "Tamil Nadu",
    "West Bengal",
    "Rajasthan",
    "Haryana",
    "Kerala"
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div 
        className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium max-w-md w-full mx-4 relative text-left animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          aria-label="Close profile editor"
          title="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-orange-50 pb-4 mb-5">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <User size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-base">Edit User Profile</h3>
            <p className="text-xs text-gray-400">Update your dashboard personalization settings</p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User size={10} className="text-orange-500" />
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3.5 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300"
              required
            />
          </div>

          {/* Age & State Row */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Cake size={10} className="text-orange-500" />
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                min={1}
                max={120}
                aria-label="Age"
                title="Age"
                placeholder="e.g. 32"
                className="w-full px-3 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin size={10} className="text-orange-500" />
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                aria-label="State"
                title="State"
                className="w-full px-2 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 bg-white text-gray-600 transition-all"
              >
                {statesOfIndia.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Briefcase size={10} className="text-orange-500" />
              Occupation
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Small Business Owner"
              className="w-full px-3.5 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300"
              required
            />
          </div>

          {/* Monthly Budget */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CircleDollarSign size={10} className="text-orange-500" />
              Monthly Budget (Rs.)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              min={1}
              placeholder="e.g. 30000"
              className="w-full px-3.5 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 transition-all placeholder-gray-300"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-orange-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-orange-200 text-orange-600 font-semibold text-xs rounded-xl hover:bg-orange-50/50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : 'Save Updates'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
