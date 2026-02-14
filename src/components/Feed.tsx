import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Report } from '../types';
import { MapPin, ThumbsUp, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export function Feed() {
    const { data: reports, isLoading } = useQuery({
        queryKey: ['reports'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reports')
                .select('*, profiles(username, avatar_url)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Report[];
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20">
            {reports?.map((report) => (
                <ReportCard key={report.id} report={report} />
            ))}
            {reports?.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    No reports yet. Be the first to add one!
                </div>
            )}
        </div>
    );
}

function ReportCard({ report }: { report: Report }) {
    const statusColors = {
        OPEN: 'bg-red-100 text-red-800',
        ACKNOWLEDGED: 'bg-yellow-100 text-yellow-800',
        IN_PROGRESS: 'bg-blue-100 text-blue-800',
        CLOSED: 'bg-green-100 text-green-800',
    };

    return (
        <a href={`/report/${report.id}`} className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition hover:shadow-md">
            {/* Header */}
            <div className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                    {report.profiles?.avatar_url && <img src={report.profiles.avatar_url} alt={report.profiles.username} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{report.profiles?.username || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[report.status] || 'bg-gray-100 text-gray-800'}`}>
                    {report.status}
                </span>
            </div>

            {/* Image */}
            {report.image_url ? (
                <div className="aspect-video bg-gray-100 overflow-hidden">
                    <img src={report.image_url} alt={report.title} className="w-full h-full object-cover" />
                </div>
            ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400">
                    <span className="text-sm">No image provided</span>
                </div>
            )}

            {/* Content */}
            <div className="p-3">
                <h3 className="font-semibold text-gray-900 mb-1">{report.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{report.description}</p>

                <div className="h-32 w-full rounded-lg overflow-hidden mb-3 border border-gray-100 z-0 relative pointer-events-none">
                    <MapContainer
                        center={[report.lat, report.lng]}
                        zoom={15}
                        scrollWheelZoom={false}
                        dragging={false}
                        zoomControl={false}
                        className="h-full w-full"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[report.lat, report.lng]} />
                    </MapContainer>
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <MapPin size={14} />
                    <span>{report.lat.toFixed(4)}, {report.lng.toFixed(4)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        <ThumbsUp size={18} />
                        <span>{report.likes_count || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        <MessageSquare size={18} />
                        <span>{report.comments_count || 0}</span>
                    </button>
                </div>
            </div>
        </a>
    );
}
