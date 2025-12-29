import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

/**
 * Fetches posts from the DRF viewset endpoint and handles both
 * non-paginated arrays and paginated responses with { results, next }.
 */
async function fetchAllPosts(url) {
  const all = [];
  let nextUrl = url;

  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${nextUrl}: ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      // not paginated
      return data;
    } else if (Array.isArray(data.results)) {
      all.push(...data.results);
      nextUrl = data.next; // DRF gives full absolute URL in .next (or null)
    } else {
      // unexpected format
      throw new Error("Unexpected response format from API");
    }
  }

  return all;
}

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = "http://localhost:8000/weblog/viewset/";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await fetchAllPosts(API);
        if (mounted) {
          setPosts(all);
        }
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Loading posts...</div>;
  if (!posts || posts.length === 0) return <div>No posts found.</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Posts</h1>
      <ul>
        {posts.map(post => {
          // Some serializers return created as ISO timestamp
          const created = post.created ? new Date(post.created) : null;
          const year = created ? created.getFullYear() : "YYYY";
          const month = created ? String(created.getMonth() + 1) : "M";
          const day = created ? String(created.getDate()) : "D";
          const slug = post.slug || (post.title ? post.title.toLowerCase().replace(/\s+/g,'-') : 'post');

          return (
            <li key={post.id} style={{ marginBottom: 18 }}>
              {/* link to React detail by id */}
              <div>
                <Link to={`/posts/${post.id}`} style={{ fontSize: 18, fontWeight: 600 }}>
                  {post.title}
                </Link>
              </div>
              {/* show short excerpt */}
              <div>
                {post.body ? (post.body.slice(0, 140) + (post.body.length > 140 ? '…' : '')) : ''}
              </div>
              {/* Django-style permalink so you can open the exact path you mentioned */}
              <div style={{ marginTop: 6 }}>
                <Link to={`/weblog/${year}/${month}/${day}/${slug}`}>
                  Open Django-style permalink: /weblog/{year}/{month}/{day}/{slug}/
                </Link>
              </div>

              <div style={{ marginTop: 6, color: "#666" }}>
                tags: {Array.isArray(post.tags) ? post.tags.join(", ") : post.tags}
                {" | "}
                created: {post.created}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PostList;
