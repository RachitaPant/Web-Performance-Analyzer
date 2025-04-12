
import React, { useState } from 'react';
import { supabase } from '@/supabase/supabaseClient';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const authFn = isSignUp
      ? supabase.auth.signUp
      : supabase.auth.signInWithPassword;

    const { error } = await authFn({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(isSignUp ? 'Check your email to confirm sign up!' : 'Logged in!');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-sm mx-auto bg-white shadow-lg rounded-xl p-6 mt-10">
      <h2 className="text-xl font-bold mb-4 text-center">
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      {message && <p className="text-red-600 mt-3 text-center">{message}</p>}

      <p className="mt-4 text-center text-sm">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-blue-600 underline"
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
};

export default AuthForm;
