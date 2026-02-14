import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Award, Star, Trophy, Medal } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { Profile as ProfileType, Badge } from '../types';

export function Profile() {
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<ProfileType | null>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                fetchProfileData(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                fetchProfileData(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function fetchProfileData(userId: string) {
        setLoading(true);
        try {
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Fetch badges
            const { data: badgesData, error: badgesError } = await supabase
                .from('user_badges')
                .select('*')
                .eq('user_id', userId);

            if (badgesError) throw badgesError;
            setBadges(badgesData || []);

        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8 bg-gray-50 min-h-screen items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const getBadgeDetails = (type: string) => {
        switch (type) {
            case 'FIRST_REPORT':
                return { label: 'First Report', desc: 'Submitted 1st issue', icon: <Star size={20} fill="currentColor" />, color: 'bg-yellow-100 text-yellow-600' };
            case 'HELPER':
                return { label: 'Top Helper', desc: '5 comments posted', icon: <Award size={20} />, color: 'bg-purple-100 text-purple-600' };
            case 'RESOLVER':
                return { label: 'Resolver', desc: '2 confirmed fixes', icon: <Medal size={20} />, color: 'bg-green-100 text-green-600' };
            default:
                return { label: 'Badge', desc: 'Awarded', icon: <Trophy size={20} />, color: 'bg-gray-100 text-gray-600' };
        }
    };

    return (
        <div className="pb-20">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-b-3xl shadow-lg mb-6 text-center -mx-4">
                <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm border-2 border-white/30 overflow-hidden">
                    {session?.user.user_metadata.avatar_url ? (
                        <img src={session.user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl">👤</span>
                    )}
                </div>
                <h2 className="text-2xl font-bold">{session?.user.user_metadata.full_name || 'Community Member'}</h2>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-md">
                        {badges.length > 2 ? 'Level 3 • Expert' : badges.length > 0 ? 'Level 2 • Active' : 'Level 1 • Rookie'}
                    </span>
                </div>

                <div className="flex justify-center gap-6 mt-6">
                    <div className="text-center">
                        <span className="block text-2xl font-bold">{profile?.points || 0}</span>
                        <span className="text-xs text-blue-100 uppercase tracking-wider">Points</span>
                    </div>
                    {/* Placeholder for report count - requires separate query or count trigger */}
                    <div className="text-center">
                        <span className="block text-2xl font-bold">--</span>
                        <span className="text-xs text-blue-100 uppercase tracking-wider">Reports</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-2xl font-bold">{badges.length}</span>
                        <span className="text-xs text-blue-100 uppercase tracking-wider">Badges</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6 px-4">
                <div>
                    <h3 className="font-bold text-gray-900 border-l-4 border-blue-600 pl-3 mb-4">Achievements</h3>

                    {badges.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {badges.map(badge => {
                                const details = getBadgeDetails(badge.badge_type);
                                return (
                                    <div key={badge.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
                                        <div className={`p-2 rounded-lg ${details.color}`}>
                                            {details.icon}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{details.label}</p>
                                            <p className="text-xs text-gray-500">{details.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <Trophy className="mx-auto text-gray-300 mb-2" size={32} />
                            <p className="text-gray-500 text-sm">No badges yet. Start reporting!</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-600 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
