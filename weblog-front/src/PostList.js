import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8000";

function PostList() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const resPosts = await fetch(`${API_BASE}/weblog/viewset/posts/`);
        const dataPosts = await resPosts.json();
        const arr = Array.isArray(dataPosts) ? dataPosts : (dataPosts.results || []);
        setPosts(arr);

        const resStats = await fetch(`${API_BASE}/weblog/api/stats/`);
        if (resStats.ok) {
          const dataStats = await resStats.json();
          setStats(dataStats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20, display: "grid", gridTemplateColumns: "3fr 1fr", gap: 20 }}>
      <main>
        <h1>This is my weblog</h1>
        <p>{stats ? `I've written ${stats.post_count} posts so far.` : '...'}</p>

        {posts.map(p => (
          <article key={p.id} style={{ borderBottom: "1px solid #eee", paddingBottom: 12, marginBottom: 12 }}>
            <h2><Link to={`/posts/${p.id}`}>{p.title}</Link></h2>
            <p><small>{p.publish ? p.publish.slice(0,10) : ''} — {p.author || ''}</small></p>

            <div dangerouslySetInnerHTML={{ __html: p.excerpt || (p.body || "").slice(0,200) }} />

            {/* TAGS: show tags if present. Handles array or string fallback. */}
            <div style={{ marginTop: 8, color: "#555" }}>
              <strong>Tags:</strong>{" "}
              {Array.isArray(p.tags)
                ? (p.tags.length ? p.tags.join(", ") : "-")
                : (p.tags ? p.tags : "-")}
            </div>

            <p><Link to={`/posts/${p.id}`}>Read more →</Link></p>
          </article>
        ))}
      </main>

      <aside>
        <div>
          <h4>Subscribe</h4>
          {stats && <p><a href={stats.rss_feed} target="_blank" rel="noreferrer">Subscribe to my RSS feed</a></p>}
        </div>

        <div style={{ marginTop: 20 }}>
          <h4>Latest posts</h4>
          {stats && stats.latest_posts ? (
            <ul>
              {stats.latest_posts.map(lp => <li key={lp.id}><Link to={`/posts/${lp.id}`}>{lp.title}</Link></li>)}
            </ul>
          ) : <p>Loading...</p>}
        </div>

        <div style={{ marginTop: 20 }}>
          <h4>Most commented</h4>
          {stats && stats.most_commented_posts ? (
            <ul>
              {stats.most_commented_posts.map(mp => <li key={mp.id}><Link to={`/posts/${mp.id}`}>{mp.title}</Link></li>)}
            </ul>
          ) : <p>Loading...</p>}
        </div>
      </aside>
    </div>
  );
}

export default PostList;
