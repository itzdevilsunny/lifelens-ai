import React, { useState } from 'react';
import { Plus, Trash2, CalendarCheck, Clock, CheckCircle, Circle } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  due_time: string | null;
  date: string;
}

interface DailyPlannerProps {
  tasks: Task[];
  onAddTask: (title: string, dueTime: string) => Promise<void>;
  onToggleTask: (id: number, isCompleted: boolean) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
}

export const DailyPlanner: React.FC<DailyPlannerProps> = ({ 
  tasks, 
  onAddTask, 
  onToggleTask, 
  onDeleteTask 
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddTask(newTaskTitle, newTaskTime);
      setNewTaskTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = tasks.filter(t => t.is_completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-orange-50 p-6 shadow-premium transition-all duration-300 hover:shadow-premium-hover">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-orange-50 pb-5 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <CalendarCheck size={18} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Daily Routine Planner</h3>
            <p className="text-xs text-gray-400">Schedule and accomplish your goals</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2.5 py-1 rounded-full">
            {completedCount}/{tasks.length} Done
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {tasks.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-gray-500 font-medium">Daily Completion</span>
            <span className="text-orange-600 font-bold">{progressPct}%</span>
          </div>
          <div className="h-2 w-full bg-orange-100/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 rounded-full transition-all duration-500" 
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Task input form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Add a new task (e.g., Drink water, Walk, Read notice)..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-orange-100 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all placeholder-gray-300"
          required
        />
        <div className="flex items-center border border-orange-100 rounded-xl px-2">
          <Clock size={14} className="text-gray-400 mr-1" />
          <input
            type="time"
            value={newTaskTime}
            onChange={(e) => setNewTaskTime(e.target.value)}
            className="text-sm text-gray-600 focus:outline-none bg-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold px-4 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer shadow-md shadow-orange-500/10"
        >
          <Plus size={18} />
        </button>
      </form>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-orange-100/50 rounded-xl">
          <p className="text-sm">No tasks scheduled for today.</p>
          <p className="text-xs mt-1">Type one above to start planning your day!</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 group ${
                task.is_completed 
                  ? 'bg-orange-50/10 border-orange-100/30' 
                  : 'bg-white border-orange-100/50 hover:border-orange-200'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <button 
                  onClick={() => onToggleTask(task.id, !task.is_completed)}
                  className="text-orange-500 hover:scale-110 transition-transform cursor-pointer"
                >
                  {task.is_completed ? (
                    <CheckCircle size={20} className="fill-orange-100 text-orange-500" />
                  ) : (
                    <Circle size={20} className="text-orange-400" />
                  )}
                </button>
                <div className="flex flex-col">
                  <span className={`text-sm ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                    {task.title}
                  </span>
                  {task.due_time && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {task.due_time}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeleteTask(task.id)}
                className="text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
