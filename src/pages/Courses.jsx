import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import SectionLoader from '../components/SectionLoader';
import './Courses.css';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [studyLevel, setStudyLevel] = useState('100');
  const [selectedCourseDetails, setSelectedCourseDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    async function fetchCourses() {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('courses')
        .select('id, course_code, course_title, study_level, description')
        .eq('study_level', studyLevel)
        .order('course_code');

      if (error) {
        setError(error.message);
        setCourses([]);
      } else {
        setCourses(data ?? []);
      }

      setLoading(false);
    }

    fetchCourses();
  }, [studyLevel]);

  useEffect(() => {
  async function fetchSelectedCourses() {
    const { data: { user }, error: userError } =
      await supabase.auth.getUser();

    if (userError || !user) {
      setError('Please log in to view your selected courses.');
      return;
    }

    const { data, error: selectionError } = await supabase
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

    if (selectionError) {
      setError(selectionError.message);
      return;
    }

    setSelectedCourses(data.map((item) => item.course_id));
    setSelectedCourseDetails(
        data.map((item) => item.courses).filter(Boolean)
    );
  }

  fetchSelectedCourses();
 }, []);

  async function handleSelectCourse(courseId) {
  const { data: { user }, error: userError } =
    await supabase.auth.getUser();

  if (userError || !user) {
    setError('Please log in to manage your courses.');
    return;
  }

  const isSelected = selectedCourses.includes(courseId);

  if (isSelected) {
    const { error: deleteError } = await supabase
      .from('student_courses')
      .delete()
      .eq('student_id', user.id)
      .eq('course_id', courseId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSelectedCourses((previous) =>
        previous.filter((id) => id !== courseId)
);

setSelectedCourseDetails((previous) =>
  previous.filter((course) => course.id !== courseId)
);
  } else {
    const { error: saveError } = await supabase
      .from('student_courses')
      .insert({
        student_id: user.id,
        course_id: courseId,
      });

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setSelectedCourses((previous) => [...previous, courseId]);

    const selectedCourse = courses.find(
        (course) => course.id === courseId
    );

    if (selectedCourse) {
        setSelectedCourseDetails((previous) => [
            ...previous,
            selectedCourse,
        ]);
    }
  }

  setError('');
 }

  return (
    <main className="courses-page">
        <div className="courses-container">
        <a href="/dashboard" className="back-to-dashboard">
        ← Back to Dashboard
        </a>
      <h1>My Courses</h1>
      <p>
        <strong>Browse the NUC CCMAS-aligned Computer Science course catalogue
        and choose your study level.</strong>
      </p>

      <div className="selected-courses-summary">
        <span className="summary-label">Your selected courses</span>
        <p className="summary-count">
            <strong>{selectedCourses.length}</strong>
            {selectedCourses.length === 1 ? ' course selected' : ' courses selected'}
        </p>
      </div>

 <section className="selected-courses-section">
  <h2>Your Selected Courses</h2>

  {selectedCourseDetails.length === 0 ? (
    <p>You haven't selected any courses yet.</p>
  ) : (
    <div className="selected-courses-list">
      {selectedCourseDetails.map((course) => (
        <article className="selected-course-item" key={course.id}>
          <div>
            <span>{course.course_code}</span>
            <h3>{course.course_title}</h3>
            <p>{course.study_level} Level</p>
          </div>

          <button
            type="button"
            onClick={() => handleSelectCourse(course.id)}
          >
            Remove
          </button>
        </article>
      ))}
    </div>
  )}
 </section>

      <label htmlFor="study-level">Study level</label>
      <select
        id="study-level"
        value={studyLevel}
        onChange={(event) => setStudyLevel(event.target.value)}
      >
        <option value="100">100 Level</option>
        <option value="200">200 Level</option>
        <option value="300">300 Level</option>
        <option value="400">400 Level</option>
      </select>

      {loading && <SectionLoader message="Loading available courses..." />}

      {error && <p role="alert">Could not load courses: {error}</p>}

      {!loading && !error && courses.length === 0 && (
        <p>No courses found for this level.</p>
      )}

      {!loading && !error && courses.length > 0 && (
        
        <section className="courses-list">
          {courses.map((course) => (
            <article className="course-card" key={course.id}>
                <span>{course.course_code}</span>
                <h2>{course.course_title}</h2>
                
                <button
                type="button"
                className={`select-course-btn ${
                    selectedCourses.includes(course.id) ? 'is-selected' : ''
                }`}
                onClick={() => handleSelectCourse(course.id)}
                >
                    {selectedCourses.includes(course.id) ? 'Selected ✓' : 'Select Course'}
                </button>

            </article>
          ))}
        </section>
      )}
      </div>
    </main>
  );
}

export default Courses;
