import { useState, useEffect, useRef } from 'react';
import { Bell, UserPlus, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../../stores/notificationStore';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    fetchUnreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    
    // Refresh unread count every 1 minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.read_at) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);
    
    // GitHub-style: Navigate to the relevant page
    if (notif.data?.action_url) {
      navigate(notif.data.action_url);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={handleOpen}
        className="relative p-2 rounded-full text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-hover)] transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[color:var(--color-bg-primary)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[color:var(--color-bg-secondary)] border border-[color:var(--color-border-primary)] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[color:var(--color-border-primary)] flex justify-between items-center">
            <h3 className="text-sm font-bold text-[color:var(--color-text-primary)]">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-[color:var(--color-accent)] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-[color:var(--color-text-muted)] text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 border-b border-[color:var(--color-border-primary)] last:border-0 hover:bg-[color:var(--color-bg-hover)] cursor-pointer transition-colors ${!notif.read_at ? 'bg-[color:var(--color-accent)]/[0.03]' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.read_at ? 'bg-[color:var(--color-accent)] text-white' : 'bg-[color:var(--color-bg-tertiary)] text-[color:var(--color-text-muted)]'}`}>
                      {notif.data?.type === 'site_invitation' ? <UserPlus size={16} /> : <Bell size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[color:var(--color-text-primary)] leading-tight">
                        {notif.data?.message || 'New notification'}
                      </p>
                      <p className="text-[10px] text-[color:var(--color-text-muted)] mt-1">
                        {new Date(notif.created_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2 px-1">
                      {!notif.read_at && (
                        <>
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="p-1 rounded-md hover:bg-black/10 text-[color:var(--color-text-muted)] hover:text-blue-500 transition-colors"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 bg-[color:var(--color-bg-tertiary)] border-t border-[color:var(--color-border-primary)] text-center">
            <button className="text-xs text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-primary)] transition-colors">
              View All Notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
