import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import DrivingRange from './pages/DrivingRange';
import CourseDashboard from './pages/CourseDashboard';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-900 font-mono">
        {/* Top navigation bar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-800/90 backdrop-blur-md border-b border-neon-green/10 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Golf flag icon */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#39FF14" strokeWidth="1.5" strokeOpacity="0.4"/>
              <path d="M9 22V8" stroke="#39FF14" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 8 L20 12 L9 16" fill="#39FF14" fillOpacity="0.8"/>
            </svg>
            <span className="text-neon-green font-bold text-lg tracking-wider">SWING<span className="text-white/60">DASH</span></span>
            <span className="text-xs text-slate-500 ml-2 hidden sm:block">Golf Simulator Analytics</span>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              Driving Range
            </NavLink>
            <NavLink
              to="/course"
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              Course Play
            </NavLink>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="hidden md:block">GSPro Connected</span>
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse_slow"/>
          </div>
        </nav>

        {/* Page content */}
        <div className="pt-14">
          <Routes>
            <Route path="/" element={<DrivingRange />} />
            <Route path="/course" element={<CourseDashboard />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
