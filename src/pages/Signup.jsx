import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import '../Auth.css';

function Signup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  async function handleSignup(event) {
    event.preventDefault();

    setLoading(true);
    setMessage('');
    setMessageType('');

    const formData = new FormData(event.currentTarget);

    const fullName = formData.get('fullName').trim();
    const email = formData.get('signupEmail').trim();
    const university = formData.get('university').trim();
    const department = formData.get('department').trim();
    const studyLevel = formData.get('studyLevel');
    const password = formData.get('signupPassword');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            university,
            department,
            study_level: studyLevel,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setMessage(
        'Your account has been created. Please check your email for a confirmation link before logging in.'
      );
      setMessageType('success');
    } catch (error) {
      setMessage(
        error.message || 'Something went wrong. Please try again.'
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
          <span className="auth-label">YOUR LEARNING SPACE</span>
          <h1>Create your account</h1>
          <p>
            Create your account to practise courses, prepare for exams,
            and track your academic progress.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSignup}>
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            required
          />

          <label htmlFor="signupEmail">Email address</label>
          <input
            id="signupEmail"
            name="signupEmail"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="university">University or Institution</label>
          <input
            id="university"
            name="university"
            type="text"
            placeholder="Enter your university"
            autoComplete="organization"
            required
          />

          <label htmlFor="department">Department or Course of Study</label>
          <input
            id="department"
            name="department"
            type="text"
            placeholder="e.g. Computer Science"
            required
          />

          <label htmlFor="studyLevel">Current level</label>
          <select
            id="studyLevel"
            name="studyLevel"
            defaultValue=""
            required
          >
            <option value="" disabled>
              Select your level
            </option>
            <option value="100">100 level</option>
            <option value="200">200 level</option>
            <option value="300">300 level</option>
            <option value="400">400 level</option>
            <option value="500">500 level</option>
          </select>

          <label htmlFor="signupPassword">Create password</label>
          <input
            id="signupPassword"
            name="signupPassword"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            minLength={8}
            required
          />

          {message && (
            <p
              className={`signup-message ${messageType}`}
              role="status"
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
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

export default Signup;