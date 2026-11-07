
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import SectionLoader from '../components/SectionLoader';
import './Admin.css';

const emptyCourse = {
  course_code: '',
  course_title: '',
  department: 'Computer Science',
  study_level: '100',
  description: '',
};

const emptyQuestion = {
  course_id: '',
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_answer: 'A',
  explanation: '',
};

// Handles commas, quoted fields and line breaks inside CSV cells.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell.trim());

      if (row.some((value) => value !== '')) rows.push(row);

      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (quoted) throw new Error('The CSV contains an unclosed quotation mark.');

  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    if (row.some((value) => value !== '')) rows.push(row);
  }

  if (rows.length < 2) {
    throw new Error('The CSV must contain a header row and at least one question.');
  }

  const headers = rows[0].map((header, index) =>
    (index === 0 ? header.replace(/^\uFEFF/, '') : header)
      .trim()
      .toLowerCase()
  );

  if (new Set(headers).size !== headers.length) {
    throw new Error('The CSV contains duplicate column headings.');
  }

  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] || '').trim();
    });
    return record;
  });
}

function Admin() {
  const [activeTab, setActiveTab] = useState('courses');

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState('');
  const [courseMessage, setCourseMessage] = useState('');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState(emptyCourse);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [questionMessage, setQuestionMessage] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionCourseFilter, setQuestionCourseFilter] = useState('all');
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [csvErrors, setCsvErrors] = useState([]);
  const [csvPreview, setCsvPreview] = useState([]);
  const fileInputRef = useRef(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'questions') fetchQuestions();
  }, [activeTab]);

  async function fetchCourses() {
    setLoadingCourses(true);
    setCourseError('');

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('study_level', { ascending: true })
      .order('course_code', { ascending: true });

    if (error) {
      setCourseError(error.message);
      setCourses([]);
    } else {
      setCourses(data || []);
    }

    setLoadingCourses(false);
  }

  async function fetchQuestions() {
    setLoadingQuestions(true);
    setQuestionError('');

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setQuestionError(error.message);
      setQuestions([]);
    } else {
      setQuestions(data || []);
    }

    setLoadingQuestions(false);
  }

  function openAddCourseForm() {
    setCourseForm(emptyCourse);
    setEditingCourseId(null);
    setCourseMessage('');
    setCourseError('');
    setShowCourseForm(true);
  }

  function openEditCourseForm(course) {
    setCourseForm({
      course_code: course.course_code || '',
      course_title: course.course_title || '',
      department: course.department || 'Computer Science',
      study_level: course.study_level || '100',
      description: course.description || '',
    });
    setEditingCourseId(course.id);
    setCourseMessage('');
    setCourseError('');
    setShowCourseForm(true);
  }

  function handleCourseInput(event) {
    const { name, value } = event.target;
    setCourseForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleCourseSubmit(event) {
    event.preventDefault();
    setSavingCourse(true);
    setCourseError('');
    setCourseMessage('');

    const courseData = {
      course_code: courseForm.course_code.trim() || null,
      course_title: courseForm.course_title.trim(),
      department: courseForm.department.trim(),
      study_level: courseForm.study_level,
      description: courseForm.description.trim() || null,
    };

    const result = editingCourseId
      ? await supabase.from('courses').update(courseData).eq('id', editingCourseId)
      : await supabase.from('courses').insert([courseData]);

    if (result.error) {
      setCourseError(result.error.message);
    } else {
      setCourseMessage(editingCourseId ? 'Course updated successfully.' : 'Course added successfully.');
      setShowCourseForm(false);
      setEditingCourseId(null);
      setCourseForm(emptyCourse);
      await fetchCourses();
    }

    setSavingCourse(false);
  }

  async function handleDeleteCourse(course) {
    if (!window.confirm(`Delete ${course.course_code || course.course_title}?`)) return;

    setCourseError('');
    setCourseMessage('');

    const { error } = await supabase.from('courses').delete().eq('id', course.id);

    if (error) {
      setCourseError(
        'Could not delete this course. It may have linked questions. Check the database error: ' +
        error.message
      );
      return;
    }

    setCourseMessage('Course deleted successfully.');
    await fetchCourses();
  }

  function openAddQuestionForm() {
    setQuestionForm({
      ...emptyQuestion,
      course_id: questionCourseFilter !== 'all' ? questionCourseFilter : courses[0]?.id || '',
    });
    setEditingQuestionId(null);
    setQuestionError('');
    setQuestionMessage('');
    setShowQuestionForm(true);
  }

  function openEditQuestionForm(question) {
    setQuestionForm({
      course_id: question.course_id || '',
      question_text: question.question_text || '',
      option_a: question.option_a || '',
      option_b: question.option_b || '',
      option_c: question.option_c || '',
      option_d: question.option_d || '',
      correct_answer: question.correct_answer || 'A',
      explanation: question.explanation || '',
    });
    setEditingQuestionId(question.id);
    setQuestionError('');
    setQuestionMessage('');
    setShowQuestionForm(true);
  }

  function handleQuestionInput(event) {
    const { name, value } = event.target;
    setQuestionForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleQuestionSubmit(event) {
    event.preventDefault();
    setSavingQuestion(true);
    setQuestionError('');
    setQuestionMessage('');

    const questionData = {
      course_id: questionForm.course_id,
      question_text: questionForm.question_text.trim(),
      option_a: questionForm.option_a.trim(),
      option_b: questionForm.option_b.trim(),
      option_c: questionForm.option_c.trim(),
      option_d: questionForm.option_d.trim(),
      correct_answer: questionForm.correct_answer,
      explanation: questionForm.explanation.trim() || null,
    };

    const result = editingQuestionId
      ? await supabase.from('questions').update(questionData).eq('id', editingQuestionId)
      : await supabase.from('questions').insert([questionData]);

    if (result.error) {
      setQuestionError(result.error.message);
    } else {
      setQuestionMessage(editingQuestionId ? 'Question updated successfully.' : 'Question added successfully.');
      setShowQuestionForm(false);
      setEditingQuestionId(null);
      setQuestionForm(emptyQuestion);
      await fetchQuestions();
    }

    setSavingQuestion(false);
  }

  async function handleDeleteQuestion(question) {
    if (!window.confirm('Delete this question permanently?')) return;

    setQuestionError('');
    setQuestionMessage('');

    const { error } = await supabase.from('questions').delete().eq('id', question.id);

    if (error) {
      setQuestionError(error.message);
      return;
    }

    setQuestionMessage('Question deleted successfully.');
    await fetchQuestions();
  }

  function handleCSVSelection(event) {
    const file = event.target.files?.[0];
    setCsvFile(file || null);
    setCsvErrors([]);
    setCsvPreview([]);
    setQuestionError('');
    setQuestionMessage('');

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvFile(null);
      setQuestionError('Please select a .csv file.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const records = parseCSV(String(reader.result || ''));
        const required = [
          'course_code', 'question_text', 'option_a',
          'option_b', 'option_c', 'option_d', 'correct_answer',
        ];

        const missing = required.filter(
          (header) => !Object.hasOwn(records[0], header)
        );

        if (missing.length) {
          setQuestionError(`Missing CSV columns: ${missing.join(', ')}`);
          setCsvFile(null);
          return;
        }

        const courseMap = new Map(
          courses
            .filter((course) => course.course_code)
            .map((course) => [course.course_code.trim().toLowerCase(), course])
        );

        const errors = [];
        const validRows = [];

        records.forEach((record, index) => {
          const rowNumber = index + 2;
          const course = courseMap.get((record.course_code || '').toLowerCase());
          const answer = (record.correct_answer || '').toUpperCase();

          const missingFields = required.filter(
            (field) => !record[field]
          );

          if (missingFields.length) {
            errors.push(`Row ${rowNumber}: missing ${missingFields.join(', ')}.`);
            return;
          }

          if (!course) {
            errors.push(`Row ${rowNumber}: course code "${record.course_code}" was not found.`);
            return;
          }

          if (!['A', 'B', 'C', 'D'].includes(answer)) {
            errors.push(`Row ${rowNumber}: correct_answer must be A, B, C or D.`);
            return;
          }

          validRows.push({
            course_id: course.id,
            question_text: record.question_text,
            option_a: record.option_a,
            option_b: record.option_b,
            option_c: record.option_c,
            option_d: record.option_d,
            correct_answer: answer,
            explanation: record.explanation || null,
          });
        });

        setCsvErrors(errors);
        setCsvPreview(validRows);
      } catch (error) {
        setQuestionError(error.message || 'Could not read this CSV file.');
        setCsvFile(null);
      }
    };

    reader.onerror = () => {
      setQuestionError('The CSV file could not be read.');
      setCsvFile(null);
    };

    reader.readAsText(file);
  }

  async function handleCSVImport() {
    if (!csvFile || csvPreview.length === 0) return;

    if (csvErrors.length > 0) {
      setQuestionError('Fix the CSV errors before importing. No questions were imported.');
      return;
    }

    if (!window.confirm(`Import ${csvPreview.length} questions into E-Helpie?`)) return;

    setImporting(true);
    setQuestionError('');
    setQuestionMessage('');

    // Import in batches. Stop if a batch fails and report the error.
    let inserted = 0;
    const batchSize = 100;

    for (let i = 0; i < csvPreview.length; i += batchSize) {
      const batch = csvPreview.slice(i, i + batchSize);
      const { error } = await supabase.from('questions').insert(batch);

      if (error) {
        setQuestionError(
          `Import stopped after ${inserted} questions. ${error.message} ` +
          'Please check the database before retrying to avoid duplicates.'
        );
        break;
      }

      inserted += batch.length;
    }

    if (inserted === csvPreview.length) {
      setQuestionMessage(`Successfully imported ${inserted} questions.`);
      setCsvFile(null);
      setCsvPreview([]);
      setCsvErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchQuestions();
    }

    setImporting(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert('Unable to log out. Please try again.');
      setLoggingOut(false);
      return;
    }

    navigate('/login', { replace: true });
  }

  const filteredQuestions = questions.filter((question) => {
    const matchesCourse =
      questionCourseFilter === 'all' || question.course_id === questionCourseFilter;
    const search = questionSearch.trim().toLowerCase();
    const matchesSearch =
      !search ||
      question.question_text?.toLowerCase().includes(search) ||
      question.option_a?.toLowerCase().includes(search) ||
      question.option_b?.toLowerCase().includes(search) ||
      question.option_c?.toLowerCase().includes(search) ||
      question.option_d?.toLowerCase().includes(search);

    return matchesCourse && matchesSearch;
  });

  function getCourseLabel(courseId) {
    const course = courses.find((item) => item.id === courseId);
    return course
      ? `${course.course_code || ''} ${course.course_title}`.trim()
      : 'Unknown course';
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>E-Helpie</h2>
        <p>Admin Dashboard</p>

        <button
          className={activeTab === 'courses' ? 'active' : ''}
          onClick={() => setActiveTab('courses')}
        >
          Courses
        </button>

        <button
          className={activeTab === 'questions' ? 'active' : ''}
          onClick={() => setActiveTab('questions')}
        >
          Questions
        </button>

        <button className="admin-logout" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? 'Logging out...' : 'Log Out'}
        </button>
      </aside>

      <main className="admin-content">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Manage E-Helpie courses and question banks.</p>
        </header>

        {activeTab === 'courses' && (
          <section className="admin-course-section">
            <div className="admin-section-heading">
              <div>
                <h2>Course Management</h2>
                <p>Add, edit, and manage courses available to students.</p>
              </div>
              <button className="admin-primary-button" onClick={openAddCourseForm}>
                + Add Course
              </button>
            </div>

            {courseMessage && <p className="admin-success-message">{courseMessage}</p>}
            {courseError && <p className="admin-error-message">{courseError}</p>}

            {showCourseForm && (
              <form className="admin-course-form" onSubmit={handleCourseSubmit}>
                <h3>{editingCourseId ? 'Edit Course' : 'Add New Course'}</h3>

                <label>
                  Course Code
                  <input name="course_code" value={courseForm.course_code} onChange={handleCourseInput} placeholder="e.g. COS 101" />
                </label>

                <label>
                  Course Title
                  <input name="course_title" value={courseForm.course_title} onChange={handleCourseInput} required />
                </label>

                <label>
                  Department
                  <input name="department" value={courseForm.department} onChange={handleCourseInput} required />
                </label>

                <label>
                  Level
                  <select name="study_level" value={courseForm.study_level} onChange={handleCourseInput} required>
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                  </select>
                </label>

                <label className="admin-full-width">
                  Course Description
                  <textarea name="description" value={courseForm.description} onChange={handleCourseInput} rows={4} />
                </label>

                <div className="admin-form-actions">
                  <button className="admin-primary-button" type="submit" disabled={savingCourse}>
                    {savingCourse ? 'Saving...' : editingCourseId ? 'Save Changes' : 'Add Course'}
                  </button>
                  <button className="admin-secondary-button" type="button" onClick={() => setShowCourseForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {loadingCourses ? (
                <SectionLoader message="Loading courses..." />
            ) : (
              <div className="admin-course-list">
                <p className="admin-course-count">{courses.length} courses found</p>
                {courses.map((course) => (
                  <article className="admin-course-card" key={course.id}>
                    <div className="admin-course-details">
                      <span className="admin-course-code">{course.course_code || 'No course code'}</span>
                      <h3>{course.course_title}</h3>
                      <p>{course.department} · {course.study_level} Level</p>
                      <p>{course.description || 'No description added yet.'}</p>
                    </div>
                    <div className="admin-course-actions">
                      <button className="admin-secondary-button" onClick={() => openEditCourseForm(course)}>Edit</button>
                      <button className="admin-delete-button" onClick={() => handleDeleteCourse(course)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'questions' && (
          <section className="admin-question-section">
            <div className="admin-section-heading">
              <div>
                <h2>Question Bank</h2>
                <p>Manage questions and import question banks in bulk.</p>
              </div>
              <button className="admin-primary-button" onClick={openAddQuestionForm}>
                + Add Question
              </button>
            </div>

            {questionMessage && <p className="admin-success-message">{questionMessage}</p>}
            {questionError && <p className="admin-error-message">{questionError}</p>}

            <div className="admin-question-tools">
              <input
                type="search"
                value={questionSearch}
                onChange={(event) => setQuestionSearch(event.target.value)}
                placeholder="Search question text or options..."
                aria-label="Search questions"
              />

              <select
                value={questionCourseFilter}
                onChange={(event) => setQuestionCourseFilter(event.target.value)}
                aria-label="Filter questions by course"
              >
                <option value="all">All courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.course_code ? `${course.course_code} — ` : ''}{course.course_title}
                  </option>
                ))}
              </select>
            </div>

            {showQuestionForm && (
              <form className="admin-course-form" onSubmit={handleQuestionSubmit}>
                <h3>{editingQuestionId ? 'Edit Question' : 'Add Question'}</h3>

                <label className="admin-full-width">
                  Course
                  <select name="course_id" value={questionForm.course_id} onChange={handleQuestionInput} required>
                    <option value="">Choose a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.course_code ? `${course.course_code} — ` : ''}{course.course_title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-full-width">
                  Question
                  <textarea name="question_text" value={questionForm.question_text} onChange={handleQuestionInput} rows={3} required />
                </label>

                {['a', 'b', 'c', 'd'].map((letter) => (
                  <label key={letter}>
                    Option {letter.toUpperCase()}
                    <input name={`option_${letter}`} value={questionForm[`option_${letter}`]} onChange={handleQuestionInput} required />
                  </label>
                ))}

                <label>
                  Correct Answer
                  <select name="correct_answer" value={questionForm.correct_answer} onChange={handleQuestionInput}>
                    {['A', 'B', 'C', 'D'].map((answer) => (
                      <option key={answer} value={answer}>{answer}</option>
                    ))}
                  </select>
                </label>

                <label className="admin-full-width">
                  Explanation (optional)
                  <textarea name="explanation" value={questionForm.explanation} onChange={handleQuestionInput} rows={3} />
                </label>

                <div className="admin-form-actions">
                  <button className="admin-primary-button" type="submit" disabled={savingQuestion}>
                    {savingQuestion ? 'Saving...' : editingQuestionId ? 'Save Changes' : 'Add Question'}
                  </button>
                  <button className="admin-secondary-button" type="button" onClick={() => setShowQuestionForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="admin-import-panel">
              <h3>Bulk CSV Import</h3>
              <p>Upload a CSV file with the required columns. Course codes must match courses already in E-Helpie.</p>
              <p className="admin-csv-format">
                Required: course_code, question_text, option_a, option_b, option_c, option_d, correct_answer
                <br />
                Optional: explanation
              </p>

              <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleCSVSelection} />

              {csvFile && <p>Selected: {csvFile.name}</p>}
              {csvPreview.length > 0 && (
                <p>{csvPreview.length} valid questions ready to import.</p>
              )}

              {csvErrors.length > 0 && (
                <div className="admin-csv-errors">
                  <strong>Fix these errors before importing:</strong>
                  <ul>
                    {csvErrors.slice(0, 20).map((error, index) => <li key={index}>{error}</li>)}
                  </ul>
                  {csvErrors.length > 20 && <p>And {csvErrors.length - 20} more errors.</p>}
                </div>
              )}

              <button
                className="admin-primary-button"
                onClick={handleCSVImport}
                disabled={importing || !csvFile || csvPreview.length === 0 || csvErrors.length > 0}
              >
                {importing ? 'Importing...' : `Import ${csvPreview.length} Questions`}
              </button>
            </div>

            <div className="admin-question-results">
              <h3>Saved Questions ({filteredQuestions.length})</h3>

              {loadingQuestions ? (
                <SectionLoader message="Loading questions..." />
            ) : questionError && questions.length === 0 ? (
                <p>Questions could not be loaded. Check the error above.</p>
              ) : filteredQuestions.length === 0 ? (
                <p>No questions match your search or course filter.</p>
              ) : (
                filteredQuestions.map((question) => (
                  <article className="admin-question-card" key={question.id}>
                    <div className="admin-question-card-top">
                      <span className="admin-course-code">{getCourseLabel(question.course_id)}</span>
                      <span className="admin-answer-label">Correct: {question.correct_answer}</span>
                    </div>

                    <h4>{question.question_text}</h4>

                    <ol className="admin-options-list" type="A">
                      {[question.option_a, question.option_b, question.option_c, question.option_d].map((option, index) => (
                        <li key={index}>{option}</li>
                      ))}
                    </ol>

                    {question.explanation && <p><strong>Explanation:</strong> {question.explanation}</p>}

                    <div className="admin-course-actions">
                      <button className="admin-secondary-button" onClick={() => openEditQuestionForm(question)}>Edit</button>
                      <button className="admin-delete-button" onClick={() => handleDeleteQuestion(question)}>Delete</button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Admin;
