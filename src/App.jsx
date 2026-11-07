import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Exam from './pages/Exam';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import ProtectedRoute from './ProtectedRoute';
import './App.css'
import Admin from './pages/Admin';

function HomePage() {
  return (
    <div className="app">
      <header className="navbar">
        <a href="/" className="logo">
          <span className="logo-icon">E</span>
          <span>E-Helpie</span>
        </a>

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="login-btn">Log in</Link>
          <Link to="/signup" className="signup-btn">Get started</Link>
          </div>

      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="announcement">
              <span className="announcement-dot"></span>
              For Computer Science Students
            </div>

            <h1>
              Learn smarter.
              <br />
              Prepare better.
              <br />
              <span>Excel.</span>
            </h1>

            <p className="hero-description">
              Computer Science Students, prepare for university exams with course-based practice questions,
              timed CBT tests, and helpful explanations designed to support
              your academic journey.
            </p>

            <div className="hero-actions">
              <Link to="/signup" className="primary-btn">
               Start learning <span>→</span>
              </Link>
              <a href="#features" className="secondary-btn">
                Explore features
              </a>
            </div>

            <div className="hero-note">
              <span>✓</span> Free to use
              <span>✓</span> Learn at your own pace
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="study-card">
              <div className="study-card-header">
                <div>
                  <span className="small-label">YOUR LEARNING SPACE</span>
                  <h3>Ready to practise?</h3>
                </div>
                <span className="study-icon">✦</span>
              </div>

              <div className="progress-card">
                <div className="progress-top">
                  <span>Weekly progress</span>
                  <strong>Keep going!</strong>
                </div>
                <div className="progress-bars">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="progress-days">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>

              <div className="subjects-heading">
                <h4>Explore Courses</h4>
                <span>Start anywhere</span>
              </div>

              <div className="subject-list">
                <div className="subject-item">
                  <div className="subject-icon maths">{"</>"}</div>
                  <div className="subject-info">
                    <strong>Introduction to Programming</strong>
                    <span>Build your coding foundations</span>
                  </div>
                  <span className="subject-arrow">↗</span>
                </div>

                <div className="subject-item">
                  <div className="subject-icon english">DB</div>
                  <div className="subject-info">
                    <strong>Database Fundamentals</strong>
                    <span>Understanding data and databases</span>
                  </div>
                  <span className="subject-arrow">↗</span>
                </div>

                <div className="subject-item">
                  <div className="subject-icon science">∑</div>
                  <div className="subject-info">
                    <strong>Data Structure</strong>
                    <span>Strengthen your problem-solving</span>
                  </div>
                  <span className="subject-arrow">↗</span>
                </div>
              </div>

              <div className="study-card-footer">
                <span className="footer-check">✓</span>
                <span>Small steps lead to big achievements.</span>
              </div>
            </div>

            <div className="floating-badge">
              <span>✦</span>
              Your potential is limitless
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <span className="eyebrow">BUILT FOR YOUR SUCCESS</span>
            <h2>Everything you need to prepare</h2>
            <p>
              A simpler way to practise, test your knowledge, and get ready
              for your next examination.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon practice-icon">✎</div>
              <h3>Practise by course</h3>
              <p>
                Explore course-based questions and strengthen your understanding
                of important university topics.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon exam-icon">◷</div>
              <h3>Take timed exams</h3>
              <p>
                Simulate exam conditions, manage your time, and test your
                knowledge before the real examination.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon results-icon">↗</div>
              <h3>Track your progress</h3>
              <p>
                Review your results, understand your mistakes, and identify
                topics that need more attention.
              </p>
            </article>
          </div>
        </section>

        <section className="about-section" id="about">
          <span className="eyebrow">ABOUT E-HELPIE</span>
          <h2>Your partner in university learning.</h2>
          <p>
            E-Helpie is a learning platform designed to help computer science university
            students practise course-related questions, prepare for
            examinations, access useful study resources, and monitor
            their academic progress. We aim to make learning more
            accessible to students across universities and disciplines.
          </p>
        </section>

        <section className="cta-section">
          <div>
            <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
            <h2>Make your next exam your best one.</h2>
            <p>Practise consistently, build your confidence, and take charge
              of your university learning journey.
            </p>
          </div>
          <Link to="/signup" className="primary-btn">
           Get started <span>→</span>
          </Link>
        </section>
      </main>

      <footer className="footer">
        <a href="/" className="logo">
          <span className="logo-icon">E</span>
          <span>E-Helpie</span>
        </a>
        <p><p>Your university learning companion.</p></p>
        <span>© {new Date().getFullYear()} E-Helpie</span>
      </footer>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
        path="/dashboard"
        element={
        <ProtectedRoute>
          <Dashboard />
          </ProtectedRoute>
        }
        />
        <Route
        path="/practice"
        element={
        <ProtectedRoute>
          <Practice />
        </ProtectedRoute>
        }
       />
       <Route
       path="/exam"
       element={
       <ProtectedRoute>
        <Exam />
        </ProtectedRoute>
       }
       />
        <Route
        path="/courses"
        element={
        <ProtectedRoute>
          <Courses />
          </ProtectedRoute>
        }
        />
        <Route
        path="/courses/:courseId"
        element={
        <ProtectedRoute>
          <CourseDetails />
          </ProtectedRoute>
        }
        />
        <Route
        path="/admin"
        element={
        <ProtectedRoute adminOnly>
          <Admin />
        </ProtectedRoute>
        }
       />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

