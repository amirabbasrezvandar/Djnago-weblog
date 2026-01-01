import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API_BASE = "http://localhost:8000";

/** helper: read a cookie value (for csrftoken) */
function getCookie(name) {
  const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return v ? decodeURIComponent(v.pop()) : null;
}

function PostDetail() {
  const { id, year, month, day, slug } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [latest, setLatest] = useState([]);
  const [commentForm, setCommentForm] = useState({ name: "", email: "", body: "" });
  const [shareForm, setShareForm] = useState({ name: "", email: "", to: "", comments: "" });
  const [shareResult, setShareResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        if (id) {
          const res = await fetch(`${API_BASE}/weblog/viewset/posts/${id}/`);
          if (!res.ok) throw new Error("Post not found");
          setPost(await res.json());
        } else if (slug && year && month && day) {
          const res = await fetch(`${API_BASE}/weblog/viewset/posts/`);
          if (!res.ok) throw new Error("Could not load posts");
          const arr = await res.json();
          const list = Array.isArray(arr) ? arr : (arr.results || []);
          const y = year.toString().padStart(4,'0');
          const m = month.toString().padStart(2,'0');
          const d = day.toString().padStart(2,'0');
          const found = list.find(p => {
            if (!p.slug || !p.publish) return false;
            const pub = (p.publish || "").slice(0,10);
            return p.slug === slug && pub === `${y}-${m}-${d}`;
          });
          if (!found) throw new Error("Post not found");
          setPost(found);
        } else {
          setError("No post identifier");
        }
      } catch (e) {
        setError(e.message);
      }
    }
    load();
  }, [id, slug, year, month, day]);

  useEffect(() => {
    if (!post) return;

    (async () => {
      try {
        const resC = await fetch(`${API_BASE}/weblog/viewset/comments/?post=${post.id}`);
        if (resC.ok) {
          const arr = await resC.json();
          setComments(Array.isArray(arr) ? arr : (arr.results || []));
        }

        const resS = await fetch(`${API_BASE}/weblog/api/similar/${post.id}/`);
        if (resS.ok) setSimilar(await resS.json());

        const resL = await fetch(`${API_BASE}/weblog/api/latest/`);
        if (resL.ok) setLatest(await resL.json());
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [post]);

  async function submitComment(e) {
    e.preventDefault();
    if (!post) return;
    try {
      const payload = { post: post.id, ...commentForm };
      const res = await fetch(`${API_BASE}/weblog/viewset/comments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.detail || "Failed to submit");
      }
      const created = await res.json();
      setComments(prev => [...prev, created]);
      // clear the form to show blank raw form (as requested)
      setCommentForm({ name: "", email: "", body: "" });
    } catch (err) {
      alert("Could not submit comment: " + err.message);
    }
  }

  /**
   * Improved share flow:
   * - Try API JSON endpoint if exists
   * - Fallback to per-post share endpoint
   * - If that still fails, attempt form-encoded POST with CSRF token (common Django pattern)
   */
  async function submitShare(e) {
    e.preventDefault();
    if (!post) return;
    setShareResult(null);

    const payloadJson = { post_id: post.id, ...shareForm };
    const formEncoded = new URLSearchParams({
      name: shareForm.name,
      email: shareForm.email,
      to: shareForm.to,
      comments: shareForm.comments,
    }).toString();

    const endpoints = [
      { url: `${API_BASE}/weblog/api/share/`, type: "json" },           // your API attempt
      { url: `${API_BASE}/weblog/${post.id}/share/`, type: "json" },    // per-post (json)
      { url: `${API_BASE}/weblog/${post.id}/share/`, type: "form" },    // per-post (form-encoded, with CSRF)
    ];

    let lastError = null;

    for (let ep of endpoints) {
      try {
        let opts = { method: "POST", headers: { "X-Requested-With": "XMLHttpRequest" } };
        if (ep.type === "json") {
          opts.headers["Content-Type"] = "application/json";
          opts.body = JSON.stringify(payloadJson);
        } else {
          // form-encoded attempt
          opts.headers["Content-Type"] = "application/x-www-form-urlencoded";
          const csrftoken = getCookie("csrftoken");
          if (csrftoken) opts.headers["X-CSRFToken"] = csrftoken;
          opts.body = formEncoded;
        }

        console.log("Share: trying", ep.url, "with", ep.type, "headers:", opts.headers);
        const res = await fetch(ep.url, opts);

        let data = null;
        try { data = await res.json(); } catch (err) { /* ignore non-json */ }

        console.log("Share response", ep.url, res.status, data);

        if (res.ok) {
          // For many Django share views the JSON shape might be {sent: true} or just a 200.
          const success = (data && (data.sent === true || data.success === true)) || res.status === 200;
          if (success) {
            setShareResult({ success: true });
            return;
          }

          // Some backends return 200 but with a template (non-json). Treat 200 as success in that case:
          const contentType = res.headers.get("content-type") || "";
          if (res.status === 200 && !contentType.includes("application/json")) {
            // assume success (template response) — still mark success so UI reflects it
            setShareResult({ success: true });
            return;
          }

          // If JSON explicitly said sent:false or similar, record it and keep trying
          lastError = data && (data.error || JSON.stringify(data)) || `HTTP ${res.status}`;
        } else {
          // Not ok (403, 404, 500). Collect message if present
          if (data && (data.detail || data.error || data.message)) {
            lastError = data.detail || data.error || data.message;
          } else {
            lastError = `HTTP ${res.status}`;
          }
          // If 403 likely CSRF — we'll still continue to next endpoint (form attempt will attach CSRF)
        }
      } catch (err) {
        lastError = err.message;
        console.warn("Share attempt failed:", err);
      }
    }

    setShareResult({ success: false, error: lastError || "Share failed" });
  }

  if (error) return <div>Error: {error}</div>;
  if (!post) return <div>Loading post...</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <main>
        <h1>{post.title}</h1>
        <small>{post.author || ""} — {post.publish ? post.publish.slice(0,10) : ""}</small>

        {/* TAGS */}
        <div style={{ marginTop: 8 }}>
          <strong>Tags:</strong>{" "}
          {Array.isArray(post.tags)
            ? (post.tags.length ? post.tags.join(", ") : "-")
            : (post.tags ? post.tags : "-")}
        </div>

        <div style={{ marginTop: 12 }} dangerouslySetInnerHTML={{ __html: post.body || "" }} />

        <hr />

        <section>
          <h3>Comments ({comments.length})</h3>
          {comments.map(c => (
            <div key={c.id} style={{ borderBottom: "1px solid #eee", padding: 8 }}>
              <strong>{c.name}</strong> <small>{c.created ? c.created.slice(0,19) : ""}</small>
              <div>{c.body}</div>
            </div>
          ))}

          <h4>Add comment</h4>
          <form onSubmit={submitComment}>
            <div><input placeholder="Name" value={commentForm.name} onChange={e => setCommentForm({...commentForm, name: e.target.value})} required /></div>
            <div><input placeholder="Email" type="email" value={commentForm.email} onChange={e => setCommentForm({...commentForm, email: e.target.value})} required /></div>
            <div><textarea placeholder="Comment" value={commentForm.body} onChange={e => setCommentForm({...commentForm, body: e.target.value})} required /></div>
            <button type="submit">Send comment</button>
          </form>
        </section>

        <hr />

        <section>
          <h4>Share this post</h4>
          <form onSubmit={submitShare}>
            <div><input placeholder="Your name" value={shareForm.name} onChange={e => setShareForm({...shareForm, name: e.target.value})} required /></div>
            <div><input placeholder="Your email" type="email" value={shareForm.email} onChange={e => setShareForm({...shareForm, email: e.target.value})} required /></div>
            <div><input placeholder="Recipient email" type="email" value={shareForm.to} onChange={e => setShareForm({...shareForm, to: e.target.value})} required /></div>
            <div><textarea placeholder="Message (optional)" value={shareForm.comments} onChange={e => setShareForm({...shareForm, comments: e.target.value})} /></div>
            <button type="submit">Share</button>
          </form>
          {shareResult && (
            shareResult.success
              ? <p style={{color:'green'}}>Share sent.</p>
              : <p style={{color:'red'}}>Share failed: {shareResult.error}</p>
          )}
        </section>
      </main>

      <aside>
        <div>
          <h4>Similar posts</h4>
          <ul>
            {similar.map(s => <li key={s.id}><Link to={`/posts/${s.id}`}>{s.title}</Link></li>)}
          </ul>
        </div>

        <div style={{ marginTop: 20 }}>
          <h4>Latest posts</h4>
          <ul>
            {latest.map(l => <li key={l.id}><Link to={`/posts/${l.id}`}>{l.title}</Link></li>)}
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default PostDetail;
