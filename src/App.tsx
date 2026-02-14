import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Layout, Feed, CreateReport, Profile, ReportDetail } from './components';
import { Session } from '@supabase/supabase-js';

function App() {
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (!session) {
        return <LoginScreen />;
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Feed />} />
                    <Route path="create" element={<CreateReport />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="report/:id" element={<ReportDetail />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

function LoginScreen() {
    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>

            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full animate-in fade-in zoom-in duration-500">
                <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-md shadow-lg border border-white/30">
                    <span className="text-4xl">🏘️</span>
                </div>

                <h1 className="text-4xl font-black mb-2 text-white tracking-tight drop-shadow-sm">
                    CommunityFix
                </h1>
                <p className="text-blue-100 mb-8 font-medium">
                    Report it. Track it. Fix it. <br />
                    <span className="text-white font-bold">Together.</span>
                </p>

                <button
                    onClick={handleLogin}
                    className="group relative w-full bg-white text-gray-900 px-6 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    <span>Continue with Google</span>
                    <div className="absolute inset-0 rounded-xl ring-2 ring-white/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <p className="mt-6 text-xs text-blue-200">
                    Join your neighbors in making a difference.
                </p>
            </div>
        </div>
    );
}

export default App;
