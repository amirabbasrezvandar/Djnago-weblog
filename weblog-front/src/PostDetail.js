import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API = "http://localhost:8000/weblog/viewset/";

/* fetch all posts (handles pagination) */
async function fetchAllPosts(url) {
  let results = [];
  let next = url;

  while (next) {
    const res = await fetch(next);
    const data = await res.json();

    if (Array.isArray(data)) return data;

    results = results.concat(data.results);
    next = data.next;
  }
  return results;
}

function PostDetail() {
  const { id, year, month, day, slug } = useParams();

  const [post, setPost] = useState(null);
  const [latestPosts, setLatestPosts] = useState([]);
  const [similarPosts, setSimilarPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const posts = await fetchAllPosts(API);

        let currentPost = null;

        // 🔹 find current post
        if (id) {
          currentPost = posts.find(p => String(p.id) === id);
        } else {
          currentPost = posts.find(p => {
            if (!p.created || !p.slug) return false;
            const d = new Date(p.created);
            return (
              d.getFullYear() === Number(year) &&
              d.getMonth() + 1 === Number(month) &&
              d.getDate() === Number(day) &&
              p.slug === slug
            );
          });
        }

        if (!currentPost) {
          if (mounted) setLoading(false);
          return;
        }

        /* 🔹 latest posts (same as Django) */
        const latest = [...posts]
          .sort((a, b) => new Date(b.created) - new Date(a.created))
          .slice(0, 5);

        /* 🔹 similar posts (shared tags) */
        const currentTags = currentPost.tags || [];

        const similar = posts
          .filter(p => p.id !== currentPost.id)
          .map(p => {
            const sharedTags = (p.tags || []).filter(tag =>
              currentTags.includes(tag)
            );
            return { ...p, sharedTags: sharedTags.length };
          })
          .filter(p => p.sharedTags > 0)
          .sort((a, b) => b.sharedTags - a.sharedTags)
          .slice(0, 5);

        if (mounted) {
          setPost(currentPost);
          setLatestPosts(latest);
          setSimilarPosts(similar);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [id, year, month, day, slug]);

  if (loading) return <div>Loading...</div>;
  if (!post) return <div>Post not found</div>;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>
      {/* MAIN POST */}
      <h1>{post.title}</h1>
      <p style={{ color: "#777" }}>{post.created}</p>

      <div dangerouslySetInnerHTML={{ __html: post.body }} />

      <hr />

      {/* SIMILAR POSTS */}
      {similarPosts.length > 0 && (
        <>
          <h3>Similar posts</h3>
          <ul>
            {similarPosts.map(p => (
              <li key={p.id}>
                <Link to={`/posts/${p.id}`}>{p.title}</Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* LATEST POSTS */}
      <h3>Latest posts</h3>
      <ul>
        {latestPosts.map(p => (
          <li key={p.id}>
            <Link to={`/posts/${p.id}`}>{p.title}</Link>
          </li>
        ))}
      </ul>

      <Link to="/">← Back to posts</Link>
    </div>
  );
}

export default PostDetail;
