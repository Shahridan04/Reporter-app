export interface Profile {
    id: string;
    username: string;
    avatar_url: string;
    points: number;
}

export interface Badge {
    id: string;
    user_id: string;
    badge_type: 'FIRST_REPORT' | 'HELPER' | 'RESOLVER';
    awarded_at: string;
}

export interface Report {
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'CLOSED';
    lat: number;
    lng: number;
    image_url: string | null;
    created_at: string;
    user_id: string;
    profiles?: Profile;
    likes_count?: number;
    comments_count?: number;
}

export interface Comment {
    id: string;
    report_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: Profile;
}
