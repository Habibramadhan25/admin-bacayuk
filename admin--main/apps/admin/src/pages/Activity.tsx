import { useState } from 'react';
import type { ActivityLog } from '../lib/mockData';
import { Activity as ActivityIcon, CheckCircle2, AlertCircle, Info, Trash2, X } from 'lucide-react';

const Activity = () => {
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('bacayuk_activity');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const confirmClear = () => {
    localStorage.setItem('bacayuk_activity', JSON.stringify([]));
    setLogs([]);
    setShowClearConfirm(false);
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  const getIcon = (status: string) => {
    if (status === 'Success') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (status === 'Warning') return <AlertCircle className="w-5 h-5 text-[#8a6d1c]" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2a160b]">Activity Log</h1>
          <p className="text-[#8a6d1c]">Catatan riwayat seluruh aktivitas di dalam sistem</p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Riwayat
          </button>
        )}
      </div>

      <div className="bg-[#f9f6f0] rounded-xl shadow-sm border border-[#d4c3a3] overflow-hidden">
        <div className="divide-y divide-[#d4c3a3]/30">
          {logs.map(log => (
            <div key={log.id} className="p-5 hover:bg-[#ebdcb8] transition-colors flex items-start gap-4">
              <div className="mt-0.5">{getIcon(log.status)}</div>
              <div className="flex-1">
                <p className="text-[#2a160b]">
                  <span className="font-bold">{log.user}</span> {log.action} <span className="font-medium text-[#8a6d1c]">{log.target}</span>
                </p>
                <p className="text-sm text-[#8a6d1c] mt-1 flex items-center gap-1">
                  <ActivityIcon className="w-3.5 h-3.5" />
                  {formatTime(log.time)}
                </p>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
             <div className="p-8 text-center text-[#8a6d1c]">Belum ada aktivitas yang tercatat.</div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#fcfaf7] border border-[#d4c3a3] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#ebdcb8]">
              <div className="flex items-center gap-2 text-rose-700 font-bold">
                <Trash2 className="w-5 h-5" />
                <span>Konfirmasi Kosongkan Riwayat</span>
              </div>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="p-1 hover:bg-[#ebdcb8] rounded-full text-[#8a6d1c] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#5c3e1e]">
              Apakah Anda yakin ingin mengosongkan seluruh riwayat aktivitas sistem? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-[#5c3e1e] hover:bg-[#ebdcb8] rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmClear}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Activity;
