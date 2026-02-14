import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, PlusCircle, User, Bell } from 'lucide-react';
import { Notifications } from './Notifications';

export function Layout() {
    const location = useLocation();
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        // Mock checking unread count or implement real fetch
        // For now, we'll just leave it at 0 until we wire up real-time subscription
        setUnreadCount(0);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 px-4 py-3 z-50 flex items-center justify-between">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                    CommunityFix
                </h1>
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        )}
                    </button>
                    {showNotifications && <Notifications onClose={() => setShowNotifications(false)} />}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-16 pb-24 px-4 max-w-md mx-auto w-full">
                <Outlet />
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-2 z-50 safe-area-bottom pb-safe">
                <NavLink to="/" icon={<Home size={24} />} active={location.pathname === '/'} label="Home" />
                <NavLink to="/create" icon={<PlusCircle size={32} className="text-blue-600 fill-blue-50" />} active={location.pathname === '/create'} label="Report" />
                <NavLink to="/profile" icon={<User size={24} />} active={location.pathname === '/profile'} label="Profile" />
            </nav>
        </div>
    );
}

function NavLink({ to, icon, active, label }: { to: string; icon: React.ReactNode; active: boolean; label: string }) {
    return (
        <Link to={to} className={`flex flex-col items-center justify-center w-16 h-14 rounded-lg transition-colors ${active ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
            {icon}
            <span className="text-[10px] font-medium mt-1">{label}</span>
        </Link>
    );
}
