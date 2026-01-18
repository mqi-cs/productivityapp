import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Shell from './components/layout/Shell';
import Home from './pages/Home';

import DailyView from './pages/DailyView';
import LibraryView from './pages/LibraryView';
// Placeholders for now
import MacroView from './pages/MacroView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<DailyView />} />
          <Route path="library" element={<LibraryView />} />
          <Route path="macro" element={<MacroView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
