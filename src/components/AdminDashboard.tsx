import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Report, Profile } from '../types';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Ban, CheckCircle, ArrowLeft } from 'lucide-react';

export function AdminDashboard() {
    const navigate = useNavigate();
    const [reports, setReports] = useState<Report[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdmin();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/');
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!data?.is_admin) {
            navigate('/');
            return;
        }

        setIsAdmin(true);
        fetchData();
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all reports (including hidden ones, thanks to policy)
            const { data: reportsData } = await supabase
                .from('reports')
                .select('*, profiles(username)')
                .order('created_at', { ascending: false });

            if (reportsData) setReports(reportsData as Report[]);

            // Fetch all users
            const { data: usersData } = await supabase
                .from('profiles')
                .select('*')
                .order('username');

            if (usersData) setUsers(usersData);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleReportVisibility = async (reportId: string, currentHidden: boolean) => {
        try {
            const { error } = await supabase
                .from('reports')
                .update({ is_hidden: !currentHidden })
                .eq('id', reportId);

            if (error) throw error;

            setReports(reports.map(r =>
                r.id === reportId ? { ...r, is_hidden: !currentHidden } : r
            ));
        } catch (error) {
            console.error('Error toggling visibility:', error);
            alert('Failed to update report');
        }
    };

    const toggleUserBan = async (userId: string, currentBanned: boolean) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_banned: !currentBanned })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_banned: !currentBanned } : u
            ));
        } catch (error) {
            console.error('Error toggling ban:', error);
            alert('Failed to update user');
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white shadow px-4 py-4 flex items-center gap-4 sticky top-0 z-50">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <Shield className="text-blue-600" />
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-4 space-y-8">
                {/* Reports Section */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        Manage Reports
                        <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{reports.length}</span>
                    </h2>
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Title</th>
                                        <th className="px-4 py-3">Author</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{report.title}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{report.description}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{report.profiles?.username}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${report.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                                                        report.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                                                            'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => toggleReportVisibility(report.id, report.is_hidden || false)}
                                                    className={`p-2 rounded-lg transition-colors ${report.is_hidden
                                                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                    title={report.is_hidden ? "Unhide Report" : "Hide Report"}
                                                >
                                                    {report.is_hidden ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Users Section */}
                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        Manage Users
                        <span className="text-sm font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{users.length}</span>
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {users.map((user) => (
                            <div key={user.id} className="bg-white p-4 rounded-xl shadow flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        {user.avatar_url && <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">{user.username}</div>
                                        <div className="text-xs text-gray-500">{user.points} points</div>
                                        {user.is_admin && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleUserBan(user.id, user.is_banned || false)}
                                    disabled={user.is_admin} // Prevent banning admins
                                    className={`p-2 rounded-lg transition-colors ${user.is_banned
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        } ${user.is_admin ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={user.is_banned ? "Unban User" : "Ban User"}
                                >
                                    {user.is_banned ? <Ban size={18} /> : <CheckCircle size={18} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
