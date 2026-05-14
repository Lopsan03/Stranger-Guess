/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SharedScreen from './pages/SharedScreen';
import Controller from './pages/Controller';
import QuickJoin from './pages/QuickJoin';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#050508] relative overflow-hidden">
        {/* Background Orbs */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse-glow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[120px] animate-pulse-glow" />
        </div>

        <div className="relative z-10 min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/screen/:roomCode" element={<SharedScreen />} />
            <Route path="/play/:roomCode" element={<Controller />} />
            <Route path="/join/:roomCode" element={<QuickJoin />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
