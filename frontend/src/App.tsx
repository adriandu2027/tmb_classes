import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import EmptyRoomSearcherPage from "./pages/EmptyRoomSearcherPage/EmptyRoomSearcher";
import "./App.css";

const MainPage: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to the App</h1>
        <div className="button-container">
          <Link to="/empty-room-searcher">
            <button>Go to Empty Room Searcher</button>
          </Link>
          <Link to="/other-page">
            <button>Go to Other Page</button>
          </Link>
        </div>
      </header>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route
          path="/empty-room-searcher"
          element={<EmptyRoomSearcherPage />}
        />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
};

export default App;
