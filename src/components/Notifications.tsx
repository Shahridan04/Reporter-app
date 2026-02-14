
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Bell, MessageSquare, Info, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: string;
    message: string;
    link: string;
    is_read: boolean;
    created_at: string;
}

export function Notifications({ onClose }: { onClose: () => void }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setNotifications(data || []);

            // Mark all as read
            if (data?.some(n => !n.is_read)) {
                await supabase
                    .from('notifications')
                    .update({ is_read: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="absolute top-14 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <button onClick={onClose} className="text-xs text-blue-600 hover:underline">Close</button>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <Bell className="mb-2 text-gray-300" />
                        <p className="text-sm">No new notifications</p>
                    </div>
                ) : (
                    notifications.map(n => (
                        <Link
                            key={n.id}
                            to={n.link}
                            onClick={onClose}
                            className={`block p-4 border-b border-gray-50 hover:bg-blue-50 transition-colors ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                        >
                            <div className="flex gap-3">
                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'COMMENT' ? 'bg-blue-100 text-blue-600' :
                                    n.type === 'STATUS_CHANGE' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'
                                    }`}>
                                    {n.type === 'COMMENT' ? <MessageSquare size={14} /> :
                                        n.type === 'STATUS_CHANGE' ? <CheckCircle size={14} /> : <Info size={14} />}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-800 leading-snug">{n.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
