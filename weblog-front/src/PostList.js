import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("http://localhost:8000/weblog/viewset/")
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setPosts(data);
      } else if (Array.isArray(data.results)) {
        setPosts(data.results);
      } else {
        setPosts([]);
      }
      setLoading(false); // ✅ IMPORTANT
    })
    .catch(err => {
      console.error(err);
      setPosts([]);
      setLoading(false); // ✅ IMPORTANT
    });
}, []);


  if (loading) return <p style={{ padding: "40px" }}>Loading...</p>;

  return (
    <div style={{ padding: "40px" }}>
      <h1>Posts</h1>

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link to={`/posts/${post.id}`}>
              {post.title}<br/>
              {post.body.slice(0,50)}....<br/>
              tags: {post.tags}<br/>
              created :{post.created}<br/><br/><br/>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PostList;
