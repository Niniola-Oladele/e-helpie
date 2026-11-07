import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SectionLoader from '../components/SectionLoader';
import './Exam.css';

function Exam() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [examDuration, setExamDuration] = useState('30');
  const [questions, setQuestions] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCourses() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('student_courses')
        .select(`
          courses (
            id,
            course_code,
            course_title,
            study_level
          )
        `)
        .eq('student_id', user.id);

      if (error) {
        console.error('Error loading courses:', error.message);
      } else {
        setCourses(data.map((item) => item.courses).filter(Boolean));
      }

      setLoading(false);
    }

    loadCourses();
  }, []);

  useEffect(() => {
    if (!examStarted || examSubmitted) return;

    if (timeLeft <= 0) {
        submitExam();
        return;
    }

    const timer = setTimeout(() => {
        setTimeLeft((previousTime) => previousTime - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [examStarted, examSubmitted, timeLeft]);
  
  async function startExam() {
    if (!selectedCourse) return;

    const { data, error } = await supabase
    .from('questions')
    .select(`
        id,
        question_text,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        explanation
    `)
    .eq('course_id', selectedCourse);
    
    if (error) {
        console.error('Error loading exam questions:', error.message);
        alert('Could not load exam questions. Please try again.');
        return;
    }

    if (!data || data.length === 0) {
        alert('There are no questions available for this course yet.');
        return;
    }

    const shuffledQuestions = [...data].sort(
        () => Math.random() - 0.5
    );

    setQuestions(shuffledQuestions);
    setQuestionIndex(0);
    setSelectedAnswers({});
    setTimeLeft(Number(examDuration) * 60);
    setExamScore(0);
    setExamSubmitted(false);
    setExamStarted(true);
  }

  async function submitExam() {
    if (examSubmitted || submitting) return;

    setSubmitting(true);

    const finalScore = questions.reduce((total, question) => {
        return selectedAnswers[question.id] === question.correct_answer
        ? total + 1
        : total;
    }, 0);

    const percentage = Math.round(
        (finalScore / questions.length) * 100
    );

    const { data: { user }, error: userError } =
    await supabase.auth.getUser();

    if (userError || !user) {
        console.error('Error getting user:', userError?.message);
        alert('Could not identify your account. Please try again.');
        setSubmitting(false);
        return;
    }

    const { error } = await supabase
    .from('student_results')
    .insert({
        student_id: user.id,
        course_id: selectedCourse,
        result_type: 'exam',
        score: finalScore,
        total_questions: questions.length,
        percentage: percentage
    });

    if (error) {
        console.error('Error saving exam result:', error.message);
        alert('Your exam result could not be saved. Please try again.');
        setSubmitting(false);
        return;
    }

    setExamScore(finalScore);
    setExamSubmitted(true);
    setExamStarted(false);
    setSubmitting(false);
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentQuestion = questions[questionIndex];

  return (
    <div className="exam-page">
      <div className="exam-container">
        <Link to="/dashboard" className="exam-back-link">
        ← Back to Dashboard
        </Link>
        <h1>Timed CBT Exams</h1>
        <p>Test your knowledge under exam conditions.</p>

        {loading ? (
            <SectionLoader message="Loading your courses..." />
        ) : examStarted && currentQuestion ? (
        <div className="exam-question-section">
            <div className="exam-top-bar">
                <span>
                    Question {questionIndex + 1} of {questions.length}
                </span>
                
                <span className="exam-timer">
                    Time remaining: {formattedTime}
                </span>
            </div>
            
            <div className="exam-progress">
                <div
                style={{
                    width: `${((questionIndex + 1) / questions.length) * 100}%`
                }}
                ></div>
            </div>
            
            <div className="exam-question-card">
                <h2>{currentQuestion.question_text}</h2>
                
                <div className="exam-options">
                    {['A', 'B', 'C', 'D'].map((option) => (
                        <label
                        key={option}
                        className={`exam-option ${
                            selectedAnswers[currentQuestion.id] === option
                            ? 'selected'
                            : ''
                        }`}
                        >
                            <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option}
                            checked={selectedAnswers[currentQuestion.id] === option}
                            onChange={() =>
                                setSelectedAnswers((previousAnswers) => ({
                                    ...previousAnswers,
                                    [currentQuestion.id]: option
                                }))
                            }
                            />
                        
                         <span>
                            <strong>{option}.</strong>{' '}
                            {currentQuestion[`option_${option.toLowerCase()}`]}
                         </span>
                        </label>
                    ))}
                </div>
            </div>
            
            <div className="exam-navigation">
                <button
                onClick={() => setQuestionIndex((previous) => previous - 1)}
                disabled={questionIndex === 0}
                >
                    Previous
                </button>
                
                {questionIndex < questions.length - 1 ? (
                    <button
                    onClick={() => setQuestionIndex((previous) => previous + 1)}
                    >
                        Next Question
                    </button>
                ) : (
                <button onClick={submitExam} disabled={submitting}>
                    {submitting ? 'Saving Result...' : 'Submit Exam'}
                </button>
                )}
            </div>
        </div>
        ) : examSubmitted ? (
        <div className="exam-results">
            <h2>Exam Completed!</h2>
            
            <h3>{examScore} / {questions.length}</h3>
            
            <p>
                You scored {Math.round((examScore / questions.length) * 100)}%.
            </p>
            
            <div className="exam-review">
                <h2>Answer Review</h2>
                
                {questions.map((question, index) => {
                    const selectedAnswer = selectedAnswers[question.id];
                    const isCorrect = selectedAnswer === question.correct_answer;
                    
                    return (
                    <div className="exam-review-card" key={question.id}>
                        <h3>
                            Question {index + 1}: {question.question_text}
                        </h3>

                        <p>
                            Your answer:{' '}
                            {selectedAnswer
                                ? `${selectedAnswer}. ${question[`option_${selectedAnswer.toLowerCase()}`]}`
                                : 'Not answered'}
                        </p>

                        <p>
                            Correct answer:{' '}
                            {question.correct_answer}.{' '}
                            {question[`option_${question.correct_answer.toLowerCase()}`]}
                        </p>

                        <p className={`exam-review-status ${
                            !selectedAnswer
                            ? 'unanswered'
                            : isCorrect
                            ? 'correct'
                            : 'incorrect'
                        }`}>
                            {!selectedAnswer
                            ? 'Not answered'
                            : isCorrect
                            ? 'Correct'
                            : 'Incorrect'}
                        </p>

                        {question.explanation && (
                            <p>Explanation: {question.explanation}</p>
                        )}
                    </div>
                    );
                })}
            </div>
        </div>
            ) : courses.length === 0 ? (
            <p>You haven't selected any courses yet.</p>
            ) : (
            <div className="exam-setup">
                <label htmlFor="exam-course">Select a course</label>
                
                <select
                id="exam-course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                >
                    <option value="">Choose a course</option>
                    
                    {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                            {course.course_code} - {course.course_title}
                        </option>
                    ))}
                </select>
                
                <label htmlFor="exam-duration">Exam duration</label>
                
                <select
                id="exam-duration"
                value={examDuration}
                onChange={(e) => setExamDuration(e.target.value)}
                >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                </select>
                
                <button onClick={startExam} disabled={!selectedCourse}>
                    Start Exam
                </button>
            </div>
        )}
      </div>
    </div>
  );
}

export default Exam;