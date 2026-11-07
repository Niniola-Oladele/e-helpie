import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SectionLoader from '../components/SectionLoader';
import '../Dashboard.css';

function Dashboard() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
      const [studentName, setStudentName] = useState('');
      const [selectedCourses, setSelectedCourses] = useState([]);
      const [loadingCourses, setLoadingCourses] = useState(true);
      const [results, setResults] = useState([]);
      const [loadingResults, setLoadingResults] = useState(true);

      useEffect(() => {
        async function loadStudentProfile() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

            if (!error && data) {
                setStudentName(data.full_name);
            }
        }

        loadStudentProfile();
      }, []);

      useEffect(() => {
        async function loadSelectedCourses() {
          const { data: { user }, error: userError } =
          await supabase.auth.getUser();

          if (userError || !user) {
            setLoadingCourses(false);
            return;
          }

          const { data, error } = await supabase
          .from('student_courses')
          .select(`
            course_id,
            courses (
            id,
            course_code,
            course_title,
            study_level,
            description
           )
         `)
         .eq('student_id', user.id);

         if (!error && data) {
          setSelectedCourses(
            data.map((item) => item.courses).filter(Boolean)
          );
        }
        
        setLoadingCourses(false);
        }

      loadSelectedCourses();
      }, []);

      useEffect(() => {
        async function loadResults() {
          const { data: { user }, error: userError } =
          await supabase.auth.getUser();

          if (userError || !user) {
            setLoadingResults(false);
            return;
          }

          const { data, error } = await supabase
          .from('student_results')
          .select(`
            id,
            result_type,
            score,
            total_questions,
            percentage,
            created_at,
            courses (
            course_code,
            course_title
            )
            `)
            .eq('student_id', user.id)
            .order('created_at', { ascending: false });

            if (error) {
              console.error('Error loading results:', error.message);
            } else {
              setResults(data || []);
            }

            setLoadingResults(false);
          }

          loadResults();
        }, []);

        const questionsPractised = results
        .filter((result) => result.result_type === 'practice')
        .reduce((total, result) => total + result.total_questions, 0);

        const examsCompleted = results
        .filter((result) => result.result_type === 'exam').length;

        const examResults = results.filter(
          (result) => result.result_type === 'exam'
        );

        const averageScore = examResults.length > 0
        ? Math.round(
          examResults.reduce(
            (total, result) => total + Number(result.percentage), 0
          ) / examResults.length
        )
        : null;

      async function handleLogout() {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            alert('Unable to log out. Please try again.');
            return;
        }
        
        navigate('/login', { replace: true });
      }
  return (
    <div className="dashboard-page">
      {mobileMenuOpen && (
        <div
        className="mobile-menu-overlay"
        onClick={() => setMobileMenuOpen(false)}
        />
      )}

<aside className={`dashboard-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to="/" className="dashboard-logo">
          <span className="dashboard-logo-icon">E</span>
          E-Helpie<span className="logo-dot">.</span>
        </Link>

        <p className="sidebar-label">LEARNING SPACE</p>

        <nav className="dashboard-nav">
          <a
          href="#overview"
          className="dashboard-nav-item active"
          onClick={() => setMobileMenuOpen(false)}
          >
            <span>⌂</span> Overview
          </a>
          
          <a
          href="#courses"
          className="dashboard-nav-item"
          onClick={() => setMobileMenuOpen(false)}
          >
            <span>▤</span> My courses
          </a>
          
          <a
          href="#practice"
          className="dashboard-nav-item"
          onClick={() => setMobileMenuOpen(false)}
          >
            <span>✓</span> Practice questions
          </a>
          
          <a
          href="#exams"
          className="dashboard-nav-item"
          onClick={() => setMobileMenuOpen(false)}
          >
            <span>◷</span> CBT exams
          </a>
          
          <a
          href="#results"
          className="dashboard-nav-item"
          onClick={() => setMobileMenuOpen(false)}
          >
            <span>↗</span> My results
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">?</span>
            <strong>Need help?</strong>
            <p>Your learning journey matters.</p>
          </div>

          <button
          type="button"
          className="dashboard-logout"
          onClick={() => {
            setMobileMenuOpen(false);
            handleLogout();
          }}
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="dashboard-main" id="overview">
        <header className="dashboard-header">
          <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          >
            ☰
          </button>    

          <div>
            <h1>
                Welcome{studentName ? `, ${studentName}` : ' to E-Helpie'}!
            </h1>
          </div>

          <div className="dashboard-avatar">
            {studentName ? studentName.charAt(0).toUpperCase() : 'S'}
          </div>
        </header>

        <section className="dashboard-welcome">
          <div>
            <span className="welcome-label">KEEP MOVING FORWARD</span>
            <h2>Your next achievement starts here.</h2>
            <p>
              Explore your courses, practise questions, and prepare
              for your upcoming examinations.
            </p>
            <Link to="/courses" className="dashboard-primary-btn">
            Explore courses <span>→</span>
            </Link>
          </div>

          <div className="welcome-decoration">✦</div>
        </section>

        <section className="dashboard-stats">
          <article className="stat-card">
            <div className="stat-icon courses-stat">▤</div>
            <span>My courses</span>
            <strong>{selectedCourses.length}</strong>
            <p>Courses selected</p>
          </article>

          <article className="stat-card">
            <div className="stat-icon practice-stat">✓</div>
            <span>Questions practised</span>
            <strong>{questionsPractised}</strong>
            <p>Keep building your knowledge</p>
          </article>

          <article className="stat-card">
            <div className="stat-icon exams-stat">◷</div>
            <span>Exams completed</span>
            <strong>{examsCompleted}</strong>
            <p>Your progress starts here</p>
          </article>

          <article className="stat-card">
            <div className="stat-icon results-stat">↗</div>
            <span>Average score</span>
            <strong>{averageScore !== null ? `${averageScore}%` : '—'}</strong>
            <p>Available after your first exam</p>
          </article>
        </section>

        <section className="dashboard-section" id="courses">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-date">YOUR STUDIES</span>
              <h2>Explore your courses</h2>
              <p>Your selected courses will appear here.</p>
            </div>
          </div>

          {loadingCourses ? (
            <SectionLoader message="Loading your courses..." />
          ) : selectedCourses.length === 0 ? (
          <div className="dashboard-empty">
            <div className="empty-icon">▤</div>
            <h3>No courses selected yet</h3>
            <p>
              Choose your Computer Science courses to build your
              learning space and prepare for your examinations.
            </p>
            <Link to="/courses" className="dashboard-primary-btn">
            Browse courses <span>→</span>
            </Link>
          </div>
        ) : (
        <div className="dashboard-courses-grid">
          {selectedCourses.map((course) => (
            <article className="dashboard-course-card" key={course.id}>
              <span className="dashboard-course-level">
                {course.study_level} Level
              </span>
                <h3>{course.course_code}</h3>
                <p>{course.course_title}</p>
                <Link
                to={`/courses/${course.id}`}
                className="dashboard-course-link"
                >
                  View course →
                </Link>
            </article>
          ))}
        </div>
        )}
        </section>

        <section className="dashboard-section" id="practice">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-date">PRACTISE & IMPROVE</span>
              <h2>Continue learning</h2>
              <p>Build confidence one question at a time.</p>
            </div>
          </div>

          <div className="dashboard-quick-grid">
            <article className="quick-card">
              <div className="quick-icon">✓</div>
              <h3>Practice questions</h3>
              <p>Test your understanding of course topics.</p>
              <Link to="/practice">Start practising →</Link>
            </article>

            <article className="quick-card" id="exams">
              <div className="quick-icon">◷</div>
              <h3>Timed CBT exams</h3>
              <p>Prepare for examinations under timed conditions.</p>
              <Link to="/exam">Start exam →</Link>
            </article>
          </div>
        </section>

        <section className="dashboard-section" id="results">
          <div className="dashboard-section-heading">
            <div>
              <span className="dashboard-date">YOUR PERFORMANCE</span>
              <h2>Recent results</h2>
              <p>Your completed practice sessions and exams will appear here.</p>
            </div>
          </div>

          {loadingResults ? (
            <SectionLoader message="Loading your results..." />
              ) : results.length === 0 ? (
              <div className="dashboard-empty results-empty">
                <div className="empty-icon">↗</div>
                <h3>No results yet</h3>
                <p>
                  Your results and performance history will appear here
                  after you complete a practice session or exam.
                </p>
              </div>
              ) : (
              <div className="dashboard-results-list">
                {results.map((result) => (
                  <article className="dashboard-result-card" key={result.id}>
                    <div>
                      <h3>
                        {result.courses?.course_code} — {result.courses?.course_title}
                      </h3>
                      <p>
                        {new Date(result.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="dashboard-result-score">
                      <strong>
                        {result.score}/{result.total_questions}
                      </strong>
                      <span>{Number(result.percentage)}%</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
        </section>

        <footer className="dashboard-footer">
          E-Helpie · Your university learning companion.
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
