function likePost() {
    alert("Post liked!");
}

const postBtn = document.getElementById("postBtn");
const postInput = document.getElementById("postText");
const feed = document.getElementById("feed");

postBtn.addEventListener("click", function () {

    const text = postInput.value.trim();

    if (text === "") {
        alert("Please write something first!");
        return;
    }

    const newPost = document.createElement("div");

    newPost.className = "post";

    newPost.innerHTML = `
        <div class="post-header">
            <img src="https://i.pravatar.cc/100?img=8">
            <div>
                <h3>Soumya Nanda</h3>
                <small>Just now</small>
            </div>
        </div>

        <div class="actions">
            <button onclick="likePost()">❤️ Like</button>
            <button>💬 Comment</button>
            <button>🔄 Share</button>
        </div>

        <p class="caption">${text}</p>
    `;

    feed.prepend(newPost);

    postInput.value = "";
});