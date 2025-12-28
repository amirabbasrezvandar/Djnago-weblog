import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";




function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [similarPosts, setSimilarPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/weblog/viewset/${id}/`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const fetchSimilarPosts = (tag) => {
    fetch(`http://localhost:8000/weblog/viewset/?tag=${tag}`)
      .then(res => res.json())
      .then(data =>
        setSimilarPosts(data.filter(p => p.id !== post.id))
      );
  };

  if (loading) return <p>Loading...</p>;
  if (!post) return <p>Post not found</p>;

  return (
    <div>

<h1>{post.title}</h1>

{post.author && (<p><b>Author:</b> {post.author}</p>)}

{post.created && (<p><b>Created:</b> {post.created}</p>)}

{post.updated && (<p><b>Updated:</b> {post.updated}</p>)}

<p>{post.body}</p>

      {post.tags?.map((tag, index) => (
        <span
          key={index}
          onClick={() => fetchSimilarPosts(tag)}
          style={{ cursor: "pointer", marginRight: "8px" }}
        >
          #{tag}
        </span>
      ))}

      {similarPosts.length > 0 && (
        <ul>
          {similarPosts.map(sp => (
            <li key={sp.id}>{sp.title}</li>
            
          ))}
        </ul>
      )}
    </div>
  );
  
}

export default PostDetail;
