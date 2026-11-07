
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import '../Auth.css';

function Login() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  
  async function handleLogin(event) {
    event.preventDefault();

    setLoading(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email').trim();
    const password = formData.get('password');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

      if (profileError) {
        throw profileError;
      }

      if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      setMessage(
        error.message || 'Unable to log in. Please try again.'
      );
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Link to="/" className="auth-logo">
        E-Helpie<span>.</span>
      </Link>

      <section className="auth-card">
        <div className="auth-heading">
          <span className="auth-label">WELCOME BACK</span>
          <h1>Log in to E-Helpie</h1>
          <p>Continue your learning journey.</p>
        </div>

        <form className="auth-form" onSubmit={handleLogin}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          {message && (
            <p
              className={`signup-message ${messageType}`}
              role="alert"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to home
        </Link>
      </section>

      <p className="auth-footer">
        Learn smarter. Prepare better. Excel.
      </p>
    </main>
  );
}

export default Login;
