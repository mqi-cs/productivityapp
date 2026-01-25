import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-neutral-800 text-neutral-200 font-sans">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-50%] left-[-20%] w-[80vw] h-[80vw] bg-neutral-900/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-neutral-900/20 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-light tracking-tight text-white mb-2">
                            {isLogin ? 'Welcome Back' : 'Begin Your Journey'}
                        </h1>
                        <p className="text-neutral-500 text-sm">
                            {isLogin ? 'Enter your credentials to access your workspace.' : 'Create an account to verify your existence.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium ml-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                                placeholder="seeker@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-neutral-500 font-medium ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-medium py-3.5 rounded-xl hover:bg-neutral-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? 'Processing...' : (isLogin ? 'Enter Workspace' : 'Create Account')}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-neutral-500 text-sm hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
