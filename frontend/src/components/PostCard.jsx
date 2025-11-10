function PostCard({ post }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Post image (if exists) */}
      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-56 object-cover"
        />
      )}
      <div className="p-5">
        {/* Title */}
        <h2 className="text-2xl font-semibold mb-2 hover:text-blue-600 cursor-pointer">
          {post.title}
        </h2>

        {/* Author + Date */}
        <div className="text-sm text-gray-500 mb-3">
          {post.author && <span>By {post.author}</span>}
          {post.created && (
            <span>
              {" "}
              | {new Date(post.created).toLocaleDateString("en-US")}
            </span>
          )}
        </div>

        {/* Body Preview */}
        <p className="text-gray-700 leading-relaxed mb-4">
          {post.body ? post.body.slice(0, 200) + "..." : "No content available."}
        </p>

        {/* Extra Info */}
        {post.category && (
          <p className="inline-block bg-blue-100 text-blue-600 px-3 py-1 text-sm rounded-full">
            {post.category}
          </p>
        )}
        {post.updated && (
          <p className="text-xs text-gray-400 mt-2">
            Updated on: {new Date(post.updated).toLocaleDateString("en-US")}
          </p>
        )}
      </div>
    </div>
  );
}

export default PostCard;
