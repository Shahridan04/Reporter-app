
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Report, Comment } from '../types';
import { ArrowLeft, Send, CheckCircle, Clock, AlertCircle, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export function ReportDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);

    const [currentProfile, setCurrentProfile] = useState<any>(null);

    // Check follow status & count & current user profile
    React.useEffect(() => {
        if (id) {
            checkFollowStatus();
            fetchFollowerCount();
            fetchCurrentProfile();
        }
    }, [id]);

    async function fetchCurrentProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setCurrentProfile(data);
        }
    }

    async function checkFollowStatus() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('follows')
                .select('*')
                .eq('report_id', id)
                .eq('user_id', user.id)
                .maybeSingle(); // Use maybeSingle to avoid 406 not found errors if not following

            setIsFollowing(!!data);
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    }

    async function fetchFollowerCount() {
        try {
            const { count } = await supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('report_id', id);

            setFollowerCount(count || 0);
        } catch (error) {
            console.error('Error fetching follower count:', error);
        }
    }

    const toggleFollow = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please sign in to follow reports');
                return;
            }

            if (isFollowing) {
                await supabase
                    .from('follows')
                    .delete()
                    .eq('report_id', id)
                    .eq('user_id', user.id);
                setIsFollowing(false);
                setFollowerCount(prev => Math.max(0, prev - 1));
            } else {
                await supabase
                    .from('follows')
                    .insert({
                        report_id: id,
                        user_id: user.id
                    });
                setIsFollowing(true);
                setFollowerCount(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            alert('Failed to update follow status');
        }
    };

    const updateStatus = async (newStatus: string) => {
        if (!id) return;
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ['report', id] });
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const { data: report, isLoading } = useQuery({
        queryKey: ['report', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reports')
                .select('*, profiles(username, avatar_url, is_admin)')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data as Report;
        },
    });

    const { data: comments } = useQuery({
        queryKey: ['comments', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('comments')
                .select('*, profiles(username, avatar_url)')
                .eq('report_id', id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Comment[];
        },
        enabled: !!id,
    });

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || !id) return;
        setSubmitting(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('comments').insert({
                report_id: id,
                user_id: user.id,
                content: commentText,
            });

            if (error) throw error;

            setCommentText('');
            queryClient.invalidateQueries({ queryKey: ['comments', id] });
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading...</div>;
    if (!report) return <div className="p-8 text-center">Report not found</div>;

    const statusSteps = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'CLOSED'];
    const currentStatusIndex = statusSteps.indexOf(report.status);
    const isOwner = currentProfile?.id === report.user_id;
    const isAdmin = currentProfile?.is_admin;
    const canEditStatus = isOwner || isAdmin;

    return (
        <div className="pb-20 bg-white min-h-screen">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 bg-white z-50 px-4 py-3 border-b flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="font-bold text-lg truncate">Report Details</h1>
            </div>

            <div className="pt-16">
                {/* Image */}
                {report.image_url ? (
                    <div className="w-full h-64 bg-gray-100">
                        <img src={report.image_url} alt={report.title} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                        No image provided
                    </div>
                )}

                <div className="p-4 space-y-6">
                    {/* Title & Meta */}
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                            {canEditStatus ? (
                                <select
                                    value={report.status}
                                    onChange={(e) => updateStatus(e.target.value)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${report.status === 'OPEN' ? 'bg-red-100 text-red-800 focus:ring-red-500' :
                                            report.status === 'CLOSED' ? 'bg-green-100 text-green-800 focus:ring-green-500' :
                                                'bg-blue-100 text-blue-800 focus:ring-blue-500'
                                        }`}
                                >
                                    {statusSteps.map(step => (
                                        <option key={step} value={step}>{step}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                                    report.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                    {report.status}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm flex items-center gap-2 mb-4">
                            <Clock size={14} />
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                            <span>•</span>
                            <span>{report.category}</span>
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                    {report.profiles?.avatar_url && <img src={report.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{report.profiles?.username || 'Anonymous'}</p>
                                    <p className="text-xs text-gray-500">Reported by</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleFollow}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${isFollowing
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Heart size={18} fill={isFollowing ? "currentColor" : "none"} />
                                <span>{followerCount}</span>
                            </button>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700">{report.description}</p>
                    </div>

                    {/* Status Timeline */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4">Status Timeline</h3>
                        <div className="flex justify-between relative px-2">
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 -translate-y-1/2 mx-4"></div>
                            {statusSteps.map((step, idx) => (
                                <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${idx <= currentStatusIndex
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-300'
                                        }`}>
                                        {idx < currentStatusIndex ? <CheckCircle size={16} /> :
                                            idx === currentStatusIndex ? <AlertCircle size={16} /> :
                                                <span className="text-xs">{idx + 1}</span>}
                                    </div>
                                    <span className={`text-[10px] font-medium ${idx <= currentStatusIndex ? 'text-blue-600' : 'text-gray-400'}`}>
                                        {step}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="h-48 rounded-lg overflow-hidden border border-gray-200 relative">
                        <MapContainer
                            center={[report.lat, report.lng]}
                            zoom={15}
                            scrollWheelZoom={false}
                            className="h-full w-full"
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[report.lat, report.lng]} />
                        </MapContainer>
                        <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs font-mono shadow-sm z-[1000]">
                            {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
                        </div>
                    </div>

                    {/* Comments */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4">Updates & Comments ({comments?.length || 0})</h3>
                        <div className="space-y-4 mb-6">
                            {comments?.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                        {comment.profiles?.avatar_url && <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 bg-gray-50 p-3 rounded-lg rounded-tl-none">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <span className="font-semibold text-sm">{comment.profiles?.username}</span>
                                            <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                                        </div>
                                        <p className="text-sm text-gray-700">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Comment Input */}
                        <form onSubmit={submitComment} className="relative">
                            <input
                                type="text"
                                placeholder="Add an update..."
                                className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={submitting || !commentText.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
