import { useEffect, useState } from "react";

function App() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/weblog/api/posts/")
      .then(res => res.json())
      .then(data => {
        setPosts(data);
      })
      .catch(err => {
        console.error(err);
      });
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Posts</h1>

      <ul>
        {posts.map(post => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
