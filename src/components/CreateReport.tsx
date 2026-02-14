import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Camera, MapPin, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export function CreateReport() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Infrastructure',
        image: null as File | null,
        lat: 3.1390, // Default to KL
        lng: 101.6869,
    });

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, image: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            let imageUrl = null;

            if (formData.image) {
                const fileExt = formData.image.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('reports')
                    .upload(filePath, formData.image);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('reports')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const { error } = await supabase.from('reports').insert({
                user_id: user.id,
                title: formData.title,
                description: formData.description,
                category: formData.category,
                lat: formData.lat,
                lng: formData.lng,
                status: 'OPEN',
                image_url: imageUrl,
            });

            if (error) throw error;

            navigate('/');
        } catch (error) {
            console.error('Error creating report:', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-20 relative">
            <h2 className="text-xl font-bold mb-4">New Report</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                        required
                        type="text"
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="e.g., Deep Pothole"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                        <option>Infrastructure</option>
                        <option>Sanitation</option>
                        <option>Safety</option>
                        <option>Other</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        required
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none h-24"
                        placeholder="Describe the issue..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Camera & Location Picker */}
                <div className="grid grid-cols-2 gap-3">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer relative overflow-hidden h-32"
                    >
                        {preview ? (
                            <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                            <>
                                <Camera size={24} className="mb-1" />
                                <span className="text-xs">Add Photo</span>
                            </>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageSelect}
                        />
                    </div>

                    <div
                        onClick={() => setShowMap(true)}
                        className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 cursor-pointer h-32"
                    >
                        <MapPin size={24} className="mb-1 text-red-500" />
                        <span className="text-xs mt-1">
                            {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1">Tap to change</span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 shadow-lg shadow-blue-200"
                >
                    {loading ? 'Submitting...' : 'Submit Report'}
                </button>
            </form>

            {/* Map Modal */}
            {showMap && (
                <div className="fixed inset-0 z-[60] bg-white flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-bold">Set Location</h3>
                        <button onClick={() => setShowMap(false)} className="p-2 bg-gray-100 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex-1 relative">
                        <MapContainer
                            center={[formData.lat, formData.lng]}
                            zoom={15}
                            className="h-full w-full"
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            />
                            <LocationMarker
                                position={[formData.lat, formData.lng]}
                                setPosition={(lat, lng) => setFormData({ ...formData, lat, lng })}
                            />
                        </MapContainer>
                        <div className="absolute bottom-6 left-4 right-4 z-[1000]">
                            <button
                                onClick={() => setShowMap(false)}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-xl"
                            >
                                Confirm Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (lat: number, lng: number) => void }) {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng.lat, e.latlng.lng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}
