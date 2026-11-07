import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SectionLoader from '../components/SectionLoader';
import './Practice.css';

function Practice() {
    const [searchParams] = useSearchParams();
    const courseIdFromUrl = searchParams.get('courseId');
    const [selectedCourse, setSelectedCourse] = useState(courseIdFromUrl || '');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [practiceStarted, setPracticeStarted] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [answerHistory, setAnswerHistory] = useState([]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [answerSubmitted, setAnswerSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [savingResult, setSavingResult] = useState(false);
    const currentQuestion = questions[questionIndex];

  useEffect(() => {
  async function loadCourses() {
    const { data: { user }, error: userError } =
      await supabase.auth.getUser();

    if (userError || !user) {
      setCourses([]);
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
      console.error('Error loading selected courses:', error.message);
      setCourses([]);
    } else {
      setCourses(
        data.map((item) => item.courses).filter(Boolean)
      );
    }

    setLoading(false);
  }

  loadCourses();
 }, []);

   async function startPractice() {
    if (!selectedCourse) return;

    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        course_id,
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
      console.error('Error loading practice questions:', error.message);
      alert('Could not load questions. Please try again.');
      return;
    }

    if (!data || data.length === 0) {
      alert('There are no practice questions available for this course yet.');
      return;
    }

    const shuffledQuestions = [...data].sort(
        () => Math.random() - 0.5
    );

    setQuestions(shuffledQuestions);
    setQuestionIndex(0);
    setSelectedAnswer('');
    setAnswerSubmitted(false);
    setScore(0);
    setAnswerHistory([]);
    setShowResults(false);
    setPracticeStarted(true);
  }

    function submitAnswer() {
        if (!selectedAnswer || answerSubmitted) return;

        const isCorrect =
        selectedAnswer === currentQuestion.correct_answer;

        setAnswerHistory((previousHistory) => [
            ...previousHistory,
            {
                question: currentQuestion.question_text,
                selectedAnswer,
                selectedAnswerText: currentQuestion[`option_${selectedAnswer.toLowerCase()}`],
                correctAnswer: currentQuestion.correct_answer,
                correctAnswerText: currentQuestion[
                    `option_${currentQuestion.correct_answer.toLowerCase()}`
                ],
                explanation: currentQuestion.explanation,
                isCorrect,
            }
        ]);

        if (isCorrect) {
            setScore((previousScore) => previousScore + 1);
        }

        setAnswerSubmitted(true);
    }

    async function nextQuestion() {
        if (savingResult) return;

        if (questionIndex < questions.length - 1) {
            setSelectedAnswer('');
            setAnswerSubmitted(false);
            setQuestionIndex((previousIndex) => previousIndex + 1);
        } else {
            setSavingResult(true);

            const percentage = Math.round(
                (score / questions.length) * 100
            );

            const { data: { user }, error: userError } =
            await supabase.auth.getUser();

            if (userError || !user) {
                console.error('Error getting user:', userError?.message);
                alert('Could not identify your account. Please try again.');
                setSavingResult(false);
                return;
            }

            const { error } = await supabase
            .from('student_results')
            .insert({ 
                student_id: user.id,
                course_id: selectedCourse,
                result_type: 'practice',
                score: score,
                total_questions: questions.length,
                percentage: percentage
            });

            if (error) {
                console.error('Error saving practice result:', error.message);
                alert('Your practice result could not be saved. Please try again.');
                setSavingResult(false);
                return;
            }

            setPracticeStarted(false);
            setShowResults(true);
            setSavingResult(false);
        }
    }

  return (
    <main className="practice-page">
      <div className="practice-container">
        <Link to="/dashboard" className="practice-back-link">
          ← Back to Dashboard
        </Link>

        <span className="practice-eyebrow">PRACTISE & IMPROVE</span>
        <h1>Practice Questions</h1>
        <p>
          Strengthen your understanding, practise at your own pace,
          and build confidence in your courses.
        </p>

        {showResults ? (
            <section className="practice-selection practice-results">
                <span className="practice-eyebrow">PRACTICE COMPLETED</span>
                
                <h2>Your Results</h2>
                
                <div className="results-score">
                    <h3>{score} / {questions.length}</h3>
                    <p>{Math.round((score / questions.length) * 100)}% Score</p>
                </div>
                
                <div className="results-summary">
                    <div>
                        <strong>{score}</strong>
                        <span>Correct</span>
                    </div>
                        
                    <div>
                        <strong>{questions.length - score}</strong>
                        <span>Incorrect</span>
                    </div>
                </div>
                
                <h3 className="results-review-heading">Review Your Answers</h3>
                
                {answerHistory.map((answer, index) => (
                    <div
                    key={index}
                    className={`results-review-card ${
                        answer.isCorrect ? 'correct' : 'incorrect'
                    }`}
                    >
                        <span>
                            Question {index + 1} · {answer.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                        
                        <h4>{answer.question}</h4>
                        
                        <p>
                            <strong>Your answer:</strong> {answer.selectedAnswer}. {answer.selectedAnswerText}
                        </p>
                        
                        <p>
                            <strong>Correct answer:</strong> {answer.correctAnswer}. {answer.correctAnswerText}
                        </p>
                        
                        <p>
                            <strong>Explanation:</strong> {answer.explanation || 'No explanation available.'}
                        </p>
                    </div>
                ))}
                <button
                type="button"
                onClick={() => {
                    setQuestions((previousQuestions) =>
                        [...previousQuestions].sort(() => Math.random() - 0.5)
                    );
                    setQuestionIndex(0);
                    setSelectedAnswer('');
                    setAnswerSubmitted(false);
                    setScore(0);
                    setAnswerHistory([]);
                    setShowResults(false);
                    setPracticeStarted(false);
                    }}
                >
                    Practise Again
                </button>
            </section>
            ) : practiceStarted ? (
            <section className="practice-selection">
                 <div className="practice-question-header">
                    <span>
                        Question {questionIndex + 1} of {questions.length}
                    </span>
                    <span>Score: {score}</span>
                 </div>
                 
                 <h2>{currentQuestion.question_text}</h2>
                 
                 <div className="practice-options">
                    {['A', 'B', 'C', 'D'].map((option) => {
                        const optionText = currentQuestion[`option_${option.toLowerCase()}`];

                        return (
                        <label key={option} className="practice-option">
                            <input
                            type="radio"
                            name="practice-answer"
                            value={option}
                            checked={selectedAnswer === option}
                            onChange={() => setSelectedAnswer(option)}
                            disabled={answerSubmitted}
                            />
                            
                            <span>
                                <strong>{option}.</strong> {optionText}
                            </span>
                        </label>
                        );
                    })}
                 </div>
                 
                 {answerSubmitted && (
                    <div
                    className={`practice-feedback ${
                        selectedAnswer === currentQuestion.correct_answer
                        ? 'correct'
                        : 'incorrect'
                    }`}
                    >
                        <h3>
                            {selectedAnswer === currentQuestion.correct_answer
                            ? 'Correct answer!'
                            : 'Incorrect answer'}
                        </h3>
                        
                        <p>
                            Correct answer: {currentQuestion.correct_answer}
                        </p>
                        
                        <p>
                            {currentQuestion.explanation || 'No explanation available.'}
                        </p>
                    </div>
                 )}
                 
                 {!answerSubmitted ? (
                    <button
                    type="button"
                    onClick={submitAnswer}
                    disabled={!selectedAnswer}
                    >
                        Submit Answer
                    </button>
                    ) : (
                    <button
                    type="button"
                    onClick={nextQuestion}
                    disabled={savingResult}
                    >
                        {savingResult
                        ? 'Saving Result...'
                        : questionIndex === questions.length - 1
                        ? 'Finish Practice'
                        : 'Next Question'}
                    </button>
                 )}
            </section>
            ) : (
            <section className="practice-selection">
                    <h2>Choose a course</h2>
                    <p>Select one of your courses to begin practising.</p>
                    
                    {loading ? (
                        <SectionLoader message="Loading your courses..." />
                    ) : (
                    <select
                    value={selectedCourse}
                    onChange={(event) => setSelectedCourse(event.target.value)}
                    disabled={courses.length === 0}
                    >
                        <option value="">Choose a course</option>
                        
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.course_code} — {course.course_title} ({course.study_level} Level)
                            </option>
                        ))}
                    </select>
                )}
                    
                    <button
                    type="button"
                    onClick={startPractice}
                    disabled={!selectedCourse}
                    >
                        Start Practice
                    </button>
            </section>
        )}
      </div>
    </main>
  );
}

export default Practice;
