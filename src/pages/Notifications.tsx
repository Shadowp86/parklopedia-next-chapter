import { useState, useEffect } from 'react';
import { Card, Loader } from '../components/ui';
import { Bell, BellOff, Trash2, Check, CheckCheck, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui';
import { api } from '../lib/api';
import { useRealtime } from '../hooks/useRealtime';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'booking' | 'document' | 'payment' | 'system' | 'reminder';
  is_read: boolean;
  read_at?: string;
  action_url?: string;
  action_text?: string;
  metadata?: any;
  created_at: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showMarkAllRead, setShowMarkAllRead] = useState(false);

  const categories = ['all', 'booking', 'document', 'payment', 'system', 'reminder'];

  // Real-time notifications
  useRealtime({
    table: 'notifications',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    onInsert: (payload: any) => {
      const newNotification = payload.new;
      setNotifications((prev: Notification[]) => [newNotification, ...prev]);

      // Show toast for new notifications
      showToast(newNotification.type as any, `${newNotification.title}: ${newNotification.message}`, 5000);
    },
  });

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    filterNotifications();
    updateMarkAllReadVisibility();
  }, [notifications, filter, categoryFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.notifications.getNotifications(user!.id);
      setNotifications(data as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      showToast('error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Status filter
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }

    setFilteredNotifications(filtered);
  };

  const updateMarkAllReadVisibility = () => {
    const hasUnread = notifications.some(n => !n.is_read);
    setShowMarkAllRead(hasUnread);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.notifications.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
    } catch (error) {
      showToast('error', 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead(user!.id);
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      showToast('success', 'All notifications marked as read');
    } catch (error) {
      showToast('error', 'Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.notifications.deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      showToast('success', 'Notification deleted');
    } catch (error) {
      showToast('error', 'Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'booking':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'document':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'payment':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'system':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'reminder':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader size="lg" text="Loading notifications..." />
      </div>
    );
  }

  return (
    <div className="px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100">
            Notifications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {notifications.filter(n => !n.is_read).length} unread notifications
          </p>
        </div>
        {showMarkAllRead && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-accent-blue text-white rounded-xl font-medium text-sm"
          >
            <CheckCheck size={16} />
            Mark All Read
          </motion.button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['all', 'unread', 'read'].map((statusFilter) => (
          <motion.button
            key={statusFilter}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(statusFilter as any)}
            className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-colors capitalize ${
              filter === statusFilter
                ? 'bg-accent-blue text-white border-accent-blue'
                : 'bg-white dark:bg-dark-elevated border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-accent-blue hover:text-white hover:border-accent-blue'
            }`}
          >
            {statusFilter}
          </motion.button>
        ))}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <motion.button
            key={category}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategoryFilter(category)}
            className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-colors capitalize ${
              categoryFilter === category
                ? 'bg-accent-blue text-white border-accent-blue'
                : 'bg-white dark:bg-dark-elevated border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-accent-blue hover:text-white hover:border-accent-blue'
            }`}
          >
            {category}
          </motion.button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-dark-elevated rounded-full flex items-center justify-center">
                {filter === 'unread' ? (
                  <BellOff size={40} className="text-gray-400" />
                ) : (
                  <Bell size={40} className="text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications Found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread'
                  ? 'You\'re all caught up!'
                  : 'Try adjusting your filters'
                }
              </p>
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card padding="none" className={`overflow-hidden ${!notification.is_read ? 'border-l-4 border-l-accent-blue' : ''}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${
                              notification.is_read
                                ? 'text-gray-700 dark:text-gray-300'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              notification.is_read
                                ? 'text-gray-500 dark:text-gray-400'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.message}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-4">
                            {!notification.is_read && (
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-gray-400 hover:text-accent-blue transition-colors"
                              >
                                <Check size={16} />
                              </motion.button>
                            )}
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deleteNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </motion.button>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                              {notification.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(notification.created_at)}
                            </span>
                          </div>

                          {notification.action_text && notification.action_url && (
                            <button className="text-xs text-accent-blue hover:text-accent-blue-dark font-medium">
                              {notification.action_text}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Notifications;
