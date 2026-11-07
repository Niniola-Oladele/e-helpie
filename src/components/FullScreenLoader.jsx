
import './FullScreenLoader.css';

function FullScreenLoader() {
  return (
    <div className="fullscreen-loader">
      <div className="loader-content">
        <div className="loader-logo">E</div>

        <h1>E-Helpie</h1>

        <div className="loader-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <p>Preparing your learning space...</p>
      </div>
    </div>
  );
}

export default FullScreenLoader;
