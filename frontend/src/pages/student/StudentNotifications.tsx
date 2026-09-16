import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCheck,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Clock,
  Sparkles,
  CheckCircle,
  X,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { PageBanner } from '@/components/common/PageBanner';
import { useBaseLayout } from '@/layouts/BaseLayout';
import { BotSparkleIcon } from '@/components/common/icons/AppIcons';
import { mockNotifications } from '@/data/student/mockNotificationData';
import type {
  NotificationItem,
  NotificationCategory,
} from '@/types/student/notificationTypes';

export const StudentNotifications: React.FC = () => {
  const navigate = useNavigate();
  const { openAIConsult } = useBaseLayout();

  // State
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [activeNotification, setActiveNotification] = useState<NotificationItem | null>(null);

  // Derived Stats
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // Mark all as read
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Toggle single read status
  const handleToggleRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  // Delete notification
  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (activeNotification?.id === id) {
      setActiveNotification(null);
    }
  };

  // Filter & Sort notifications
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((n) => {
        if (selectedCategory !== 'all' && n.category !== selectedCategory) return false;
        if (onlyUnread && n.isRead) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            n.title.toLowerCase().includes(q) ||
            n.message.toLowerCase().includes(q) ||
            n.sender.name.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const priorityRank = { high: 3, medium: 2, low: 1 };
          return priorityRank[b.priority] - priorityRank[a.priority];
        }
        if (sortBy === 'oldest') {
          return a.id.localeCompare(b.id);
        }
        return b.id.localeCompare(a.id);
      });
  }, [notifications, selectedCategory, onlyUnread, searchQuery, sortBy]);

  // Icon & Style renderers
  const getCategoryBadge = (category: NotificationItem['category']) => {
    switch (category) {
      case 'ojt':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
            <Briefcase size={11} /> OJT & DN
          </span>
        );
      case 'ai_risk':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200/60">
            <Sparkles size={11} /> AI Cảnh báo
          </span>
        );
      case 'academic':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
            <GraduationCap size={11} /> PĐT & Học tập
          </span>
        );
      case 'deadline':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
            <Clock size={11} /> Hạn chót
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: NotificationItem['priority']) => {
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md">
          <AlertTriangle size={11} /> Khẩn cấp
        </span>
      );
    }
    return null;
  };

  return (
    <div className="font-inter space-y-5 w-full max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-12">
      {/* 1. Page Banner */}
      <PageBanner
        breadcrumb={
          <div className="flex items-center gap-2 text-xs font-semibold text-white/70">
            <button
              type="button"
              onClick={() => navigate('/student/dashboard')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Trang chủ
            </button>
            <span className="text-white/40">›</span>
            <span className="text-amber-300 font-bold">Thông báo</span>
          </div>
        }
        title="Trung tâm Thông báo"
        description="Theo dõi toàn bộ tin tức quan trọng về OJT, dự báo rủi ro AI, thông báo từ Phòng Đào tạo và các deadline từ doanh nghiệp."
        primaryAction={{
          label: 'Đánh dấu tất cả đã đọc',
          icon: <CheckCheck size={16} />,
          onClick: handleMarkAllRead,
        }}
        secondaryAction={{
          label: 'Hỏi AI về tin khẩn',
          icon: <BotSparkleIcon size={16} />,
          onClick: () =>
            openAIConsult(
              'Hãy tóm tắt các thông báo quan trọng nhất và nhiệm vụ cần làm ngay trong tuần này.'
            ),
        }}
      />

      {/* 2. Streamlined Search & Category Filter Panel */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thông báo, từ khóa, người gửi..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Controls: Unread Toggle & Sort select */}
          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
                className="rounded text-orange-500 focus:ring-orange-400 cursor-pointer"
              />
              <span>Chưa đọc ({unreadCount})</span>
            </label>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Filter size={15} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-orange-500 text-xs font-semibold cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="priority">Ưu tiên cao nhất</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 custom-scrollbar">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'ojt', label: 'OJT & Doanh nghiệp' },
            { id: 'ai_risk', label: 'Cảnh báo AI' },
            { id: 'academic', label: 'Học tập & PĐT' },
            { id: 'deadline', label: 'Hạn chót' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id as NotificationCategory)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === tab.id
                  ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Redesigned Minimalist Notification List (Unified Row List, No Cards) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
              <Bell size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Không tìm thấy thông báo phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang mục Tất cả thông báo.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveNotification(item);
                  if (!item.isRead) handleToggleRead(item.id);
                }}
                className={`group px-4 py-3.5 sm:px-6 sm:py-4 transition-all duration-150 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  !item.isRead
                    ? 'bg-orange-50/25 border-l-4 border-l-orange-500 hover:bg-orange-50/45'
                    : 'bg-white border-l-4 border-l-transparent hover:bg-slate-50/80'
                }`}
              >
                {/* Left Item Content */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 w-full">
                  {/* Avatar / Icon */}
                  <div className="flex-shrink-0 relative">
                    {item.sender.avatar ? (
                      <img
                        src={item.sender.avatar}
                        alt={item.sender.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shadow-inner">
                        {item.sender.name.charAt(0)}
                      </div>
                    )}
                    {!item.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Title & Content */}
                  <div className="space-y-1 flex-1 min-w-0">
                    {/* Header line: Badges + Sender + Time */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {getCategoryBadge(item.category)}
                      {getPriorityBadge(item.priority)}
                      <span className="text-slate-400 font-normal">•</span>
                      <span className="text-slate-600 font-semibold">{item.sender.name}</span>
                      <span className="text-slate-400 font-normal">•</span>
                      <span className="text-slate-400 font-normal">{item.createdAt}</span>
                    </div>

                    {/* Notification Title */}
                    <h3
                      className={`text-xs sm:text-sm font-bold transition-colors truncate ${
                        !item.isRead
                          ? 'text-slate-900 group-hover:text-orange-600'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.title}
                    </h3>

                    {/* Message Snippet */}
                    <p className="text-xs text-slate-500 line-clamp-1 font-normal leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100/80">
                  {item.actionLabel && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.actionUrl) navigate(item.actionUrl);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight size={13} />
                    </button>
                  )}

                  <div className="flex items-center gap-1 ml-auto sm:ml-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleRead(item.id, e)}
                      title={item.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                    >
                      <CheckCircle
                        size={16}
                        className={item.isRead ? 'text-emerald-500' : 'text-slate-300'}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      title="Xóa thông báo"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Detail Modal */}
      {activeNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-white space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {getCategoryBadge(activeNotification.category)}
                {getPriorityBadge(activeNotification.priority)}
              </div>
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {activeNotification.title}
              </h2>

              <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-2xl">
                <div className="font-bold text-slate-800">
                  {activeNotification.sender.name}
                </div>
                <span>•</span>
                <div>{activeNotification.sender.role}</div>
                <span className="ml-auto text-slate-400">{activeNotification.createdAt}</span>
              </div>

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                <p>{activeNotification.message}</p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveNotification(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              {activeNotification.actionUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const url = activeNotification.actionUrl;
                    setActiveNotification(null);
                    if (url) navigate(url);
                  }}
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{activeNotification.actionLabel || 'Đi tới liên kết'}</span>
                  <ExternalLink size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
