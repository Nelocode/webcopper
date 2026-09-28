'use client';

import React, { useState, useEffect } from 'react';
import { Contact } from '@/types/crm';
import { FOLLOW_UP_STAGES, STAGE_COLORS } from '@/lib/constants';
import {
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Bell,
  Plus,
  User,
  MessageSquare,
  Flame,
  GripVertical,
  AlertTriangle,
  Mail,
  Shield,
  CheckSquare,
  UserCheck,
  Send,
} from 'lucide-react';

interface KanbanPipelineProps {
  contacts: Contact[];
  onOpen360: (contact: Contact) => void;
  onRefresh: () => void;
  tenantName?: string;
}

export interface TaskItem {
  id: string;
  contactId: string;
  contactName: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  assignee: string;
  alertChannel: 'CRM & Banner' | 'WhatsApp' | 'Email';
  completed: boolean;
}

export const KanbanPipeline: React.FC<KanbanPipelineProps> = ({ contacts, onOpen360, onRefresh, tenantName }) => {
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [targetContact, setTargetContact] = useState<Contact | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Drag and Drop States
  const [draggedContactId, setDraggedContactId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Task & Alert Creator Form States
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskContactId, setTaskContactId] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueTime, setTaskDueTime] = useState('14:30');
  const [taskAlertChannel, setTaskAlertChannel] = useState<'CRM & Banner' | 'WhatsApp' | 'Email'>('WhatsApp');

  // Active Tasks List
  const [tasksList, setTasksList] = useState<TaskItem[]>([]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (data.success && Array.isArray(data.tasks)) {
        const mappedTasks: TaskItem[] = data.tasks.map((t: any) => ({
          id: t.id,
          contactId: t.contactId || '',
          contactName: t.contact?.name || 'Contacto General',
          title: t.title,
          description: t.description || '',
          dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
          dueTime: t.dueDate ? t.dueDate.split('T')[1]?.slice(0, 5) || '12:00' : '12:00',
          priority: (t.priority?.toUpperCase() || 'MEDIUM') as any,
          assignee: t.assignee || 'Sin Asignar',
          alertChannel: 'CRM & Banner',
          completed: t.status === 'COMPLETED',
        }));
        setTasksList(mappedTasks);
      }
    } catch (e) {
      console.error('Error loading tasks from API:', e);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const contactObj = contacts.find((c) => c.id === taskContactId);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDescription,
          contactId: contactObj?.id || null,
          priority: taskPriority === 'HIGH' ? 'High' : taskPriority === 'LOW' ? 'Low' : 'Medium',
          dueDate: `${taskDueDate}T${taskDueTime || '12:00'}:00.000Z`,
          assignee: taskAssignee,
          status: 'PENDING',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateTaskModal(false);
        setTaskTitle('');
        setTaskDescription('');
        setToastMsg(`✅ Tarea guardada en Base de Datos y vinculada a ${contactObj?.name || 'Contacto General'}!`);
        setTimeout(() => setToastMsg(null), 3500);
        fetchTasks();
      } else {
        alert(data.error || 'Error al guardar tarea');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    const target = tasksList.find((t) => t.id === taskId);
    if (!target) return;
    const newCompleted = !target.completed;
    setTasksList(
      tasksList.map((t) => (t.id === taskId ? { ...t, completed: newCompleted } : t))
    );

    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status: newCompleted ? 'COMPLETED' : 'PENDING',
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeStage = async (contactId: string, newStage: string) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    e.dataTransfer.setData('text/plain', contactId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedContactId(contactId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeave = (colId: string) => {
    if (dragOverColumnId === colId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const contactId = e.dataTransfer.getData('text/plain') || draggedContactId;
    if (contactId) {
      await handleChangeStage(contactId, targetColId);
    }
    setDraggedContactId(null);
  };

  return (
    <div className="space-y-6 font-['Urbanist'] w-full overflow-hidden">
      {toastMsg && (
        <div className="bg-sky-500 text-white px-4 py-2 rounded shadow-lg text-sm font-bold animate-pulse text-center w-full z-50">
          {toastMsg}
        </div>
      )}
      {/* Header with New Task Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Clock style={{ color: 'var(--primary-color)' }} className="w-5 h-5" />
            <span>Follow-up Pipeline & IR Task Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Create tasks linked to contacts, assign team members, configure alerts (CRM, WhatsApp, Email), and move stages via Drag & Drop.
          </p>
        </div>

        <button
          onClick={() => {
            if (contacts.length > 0) setTaskContactId(contacts[0].id);
            setShowCreateTaskModal(true);
          }}
          className="hs-pill-btn hs-btn-lime py-2.5 px-5 text-xs font-black flex items-center gap-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Create IR Task & Alert</span>
        </button>
      </div>

      {/* Active Tasks & Reminders Widget */}
      {tasksList.length > 0 && (
        <div style={{ backgroundColor: 'var(--bg-card)' }} className="p-4 rounded-[28px] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
              <h4 className="text-xs font-black text-white">Scheduled Tasks & Alerts ({tasksList.filter(t => !t.completed).length} Pending)</h4>
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400">Alert System Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tasksList.map((t) => (
              <div
                key={t.id}
                style={{ backgroundColor: 'var(--bg-card-inner)' }}
                className={`p-3.5 rounded-2xl space-y-2 border transition-all ${
                  t.completed ? 'opacity-50 border-white/5' : t.priority === 'HIGH' ? 'border-rose-500/30' : 'border-amber-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => handleToggleTaskComplete(t.id)}
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        t.completed ? 'bg-emerald-500 text-black' : 'border border-slate-500 hover:border-white'
                      }`}
                    >
                      {t.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`text-xs font-black truncate ${t.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                      {t.title}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                      t.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">{t.description}</p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1 text-sky-400 font-bold">
                    <UserCheck className="w-3 h-3" />
                    <span>{t.contactName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 font-mono">
                    <span>{t.dueDate} {t.dueTime}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-bold">{t.alertChannel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kanban Board Container (Interactive Drag & Drop Columns) */}
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-zinc-700 w-full snap-x">
        {FOLLOW_UP_STAGES.map((col) => {
          const colContacts = contacts.filter((c) => {
            if (col.id === 'First Contact') {
              return c.stage === 'First Contact' || c.stage.includes('early') || c.stage.includes('Primer');
            }
            return c.stage === col.id || c.stage.includes(col.label);
          });

          const isOver = dragOverColumnId === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={() => handleDragLeave(col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              style={
                isOver
                  ? { borderColor: 'var(--primary-color)', backgroundColor: 'var(--bg-card-hover)' }
                  : { backgroundColor: 'var(--bg-card)' }
              }
              className={`p-4 flex flex-col justify-between min-w-[280px] sm:min-w-[310px] max-w-[340px] flex-shrink-0 rounded-[28px] transition-all snap-start shadow-xl border ${
                isOver ? 'scale-[1.02] shadow-2xl border-2' : 'border-white/5'
              }`}
            >
              <div>
                {/* Stage Column Header Pill */}
                <div className={`p-3.5 rounded-2xl border text-xs font-black mb-4 flex items-center justify-between shadow-md ${col.color}`}>
                  <span className="truncate pr-2">{col.label}</span>
                  <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0">
                    {colContacts.length}
                  </span>
                </div>

                {/* Contact Follow-up Cards */}
                <div className="space-y-3 min-h-[200px]">
                  {colContacts.map((contact) => {
                    const isDraggingThis = draggedContactId === contact.id;

                    return (
                      <div
                        key={contact.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, contact.id)}
                        onDragEnd={() => setDraggedContactId(null)}
                        style={{ backgroundColor: 'var(--bg-card-inner)' }}
                        className={`p-4 rounded-2xl border border-white/5 space-y-2.5 hover:border-white/20 transition-all group cursor-grab active:cursor-grabbing shadow-md ${
                          isDraggingThis ? 'opacity-40 scale-95 border-dashed border-sky-400' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-slate-500 opacity-40 group-hover:opacity-100 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h5
                                onClick={() => onOpen360(contact)}
                                className="text-xs font-black text-white group-hover:text-[#38bdf8] transition-colors cursor-pointer truncate"
                              >
                                {contact.name}
                              </h5>
                              <p className="text-[10px] text-slate-400 font-medium truncate">
                                {contact.company || 'Investor'}
                              </p>
                            </div>
                          </div>

                          <span
                            style={{
                              backgroundColor: 'var(--secondary-color-alpha)',
                              color: 'var(--secondary-color)',
                            }}
                            className="text-[9px] px-2 py-0.5 rounded-full font-black shrink-0 truncate max-w-[100px]"
                          >
                            {contact.investorType}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 italic line-clamp-2 font-medium">
                          "{contact.bio || contact.dynamicIcebreaker || 'No recent notes'}"
                        </p>

                        {/* Quick Card Actions */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 text-[10px]">
                          <button
                            onClick={() => {
                              setTaskContactId(contact.id);
                              setShowCreateTaskModal(true);
                            }}
                            style={{ color: 'var(--primary-color)' }}
                            className="hover:underline flex items-center gap-1 font-black shrink-0"
                          >
                            <Bell className="w-3 h-3" />
                            <span>+ Create Task</span>
                          </button>

                          <select
                            value={contact.stage}
                            onChange={(e) => handleChangeStage(contact.id, e.target.value)}
                            style={{ backgroundColor: 'var(--bg-card)' }}
                            className="text-[10px] text-slate-300 rounded-full px-2 py-1 focus:outline-none font-bold shrink-0 max-w-[130px]"
                          >
                            {FOLLOW_UP_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {colContacts.length === 0 && (
                    <div className="text-center py-12 text-[11px] text-slate-500 font-mono border-2 border-dashed border-white/5 rounded-2xl">
                      Drag a contact here
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task & Alert Creator Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div style={{ backgroundColor: 'var(--bg-card)' }} className="w-full max-w-lg p-6 rounded-[28px] shadow-2xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Bell style={{ color: 'var(--primary-color)' }} className="w-4 h-4" />
                <span>Create Task & Alert Linked to Contact</span>
              </h3>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                style={{ backgroundColor: 'var(--bg-card-inner)' }}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-300 mb-1">
                  📌 Task Title / IR Alert
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. Send ${tenantName || 'Project'} Q3 drill report...`}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full hs-input-hero text-xs py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    👤 Linked Contact
                  </label>
                  <select
                    value={taskContactId}
                    onChange={(e) => setTaskContactId(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-card-inner)' }}
                    className="w-full p-2.5 rounded-2xl text-xs text-white border border-white/10 focus:outline-none"
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company || 'No Company'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    👨‍💼 Assigned To (Agent / User)
                  </label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    style={{ backgroundColor: 'var(--bg-card-inner)' }}
                    className="w-full p-2.5 rounded-2xl text-xs text-white border border-white/10 focus:outline-none"
                  >
                    <option value="Carlos Carvajal (IR Lead)">Carlos Carvajal (IR Lead)</option>
                    <option value="Guillermo Gutiérrez (Director)">Guillermo Gutiérrez (Director)</option>
                    <option value="IR Team">{tenantName ? `${tenantName} IR Team` : 'IR Team'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    🚨 Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    style={{ backgroundColor: 'var(--bg-card-inner)' }}
                    className="w-full p-2.5 rounded-2xl text-xs text-white border border-white/10 focus:outline-none"
                  >
                    <option value="HIGH">🔴 HIGH</option>
                    <option value="MEDIUM">🟡 MEDIUM</option>
                    <option value="LOW">🟢 LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    📅 Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full hs-input-hero text-xs py-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-300 mb-1">
                    ⏰ Alert Time
                  </label>
                  <input
                    type="time"
                    required
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full hs-input-hero text-xs py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1">
                  🔔 Notification / Alert Channel
                </label>
                <select
                  value={taskAlertChannel}
                  onChange={(e) => setTaskAlertChannel(e.target.value as any)}
                  style={{ backgroundColor: 'var(--bg-card-inner)' }}
                  className="w-full p-2.5 rounded-2xl text-xs text-white border border-white/10 focus:outline-none"
                >
                  <option value="WhatsApp">💬 WhatsApp Immediate Alert</option>
                  <option value="CRM & Banner">📲 CRM On-Screen Banner Alert</option>
                  <option value="Email">📧 Scheduled Email Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 mb-1">
                  📝 Description / Task Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Key details for investor follow-up..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  style={{ backgroundColor: 'var(--bg-card-inner)' }}
                  className="w-full p-3 rounded-2xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="hs-pill-btn hs-btn-dark py-2 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hs-pill-btn hs-btn-lime py-2.5 px-6 text-xs font-black shadow-xl"
                >
                  Save & Activate Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
