import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SectionLoader from '../components/SectionLoader';
import './CourseDetails.css';

function CourseDetails() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCourse() {
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_code, course_title, study_level, description')
        .eq('id', courseId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setCourse(data);
      }

      setLoading(false);
    }

    fetchCourse();
  }, [courseId]);

  if (loading) {
    return <SectionLoader message="Loading course details..." />;
  }

  if (error || !course) {
    return <p>Could not load course details. {error}</p>;
  }

  return (
  <main className="course-details-page">
    <div className="course-details-container">
      <Link to="/dashboard">← Back to Dashboard</Link>

      <div className="course-details-content">
        <span className="course-details-code">{course.course_code}</span>

        <h1>{course.course_title}</h1>

        <p className="course-details-level">
          {course.study_level} Level
        </p>

        <section className="course-description-section">
          <h2>About this course</h2>
          <p>
            {course.description || 'No course description available yet.'}
          </p>
        </section>

        <Link
          to={`/practice?courseId=${course.id}`}
          className="start-practice-btn"
        >
          Start Practice <span>→</span>
        </Link>
      </div>
    </div>
  </main>
 );
}

export default CourseDetails;