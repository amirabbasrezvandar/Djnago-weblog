import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PostList from "./PostList";
import PostDetail from "./PostDetail";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PostList />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/weblog/:year/:month/:day/:slug" element={<PostDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
