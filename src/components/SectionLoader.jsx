import './SectionLoader.css';

function SectionLoader({ message = 'Loading...' }) {
  return (
    <div className="section-loader">
      <div className="section-spinner"></div>
      <p>{message}</p>
    </div>
  );
}

export default SectionLoader;
