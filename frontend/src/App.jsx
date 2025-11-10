import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PostList from "./pages/PostList";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PostList />} />
      </Routes>
    </Router>
  );
}

export default App;
