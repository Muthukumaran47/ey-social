const API = "https://ey-social.onrender.com";
//const API = "http://localhost:3000";

let token = sessionStorage.getItem("token") || "";

// ---------------- UI CONTROL ----------------

function updateUI() {
  const authSection = document.getElementById("authSection");
  const appSection = document.getElementById("appSection");
  const userInfo = document.getElementById("userInfo");

  if (token) {
    authSection.style.display = "none";
    appSection.style.display = "block";

    const payload = JSON.parse(atob(token.split('.')[1]));
    userInfo.innerText = "👋 " + payload.email;
  } else {
    authSection.style.display = "block";
    appSection.style.display = "none";
  }
}

// ---------------- SIGNUP ----------------

async function signup() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  const res = await fetch(API + "/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();

  alert(res.ok ? "Signup successful" : data.message);
}

// ---------------- LOGIN ----------------

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    token = data.token;
    sessionStorage.setItem("token", token);
    updateUI();
    getPosts();
  } else {
    alert(data.message);
  }
}

// ---------------- LOGOUT ----------------

function logout() {
  sessionStorage.removeItem("token");
  token = "";
  updateUI();
  document.getElementById("posts").innerHTML = "";
}

// ---------------- CREATE POST ----------------

async function createPost() {
  const content = document.getElementById("content").value;

  const res = await fetch(API + "/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    body: JSON.stringify({ content })
  });

  if (res.ok) {
    document.getElementById("content").value = "";
    getPosts();
  }
}

// ---------------- GET POSTS ----------------

async function getPosts() {
  const res = await fetch(API + "/posts", {
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  const data = await res.json();

  const container = document.getElementById("posts");
  container.innerHTML = "";

  const payload = JSON.parse(atob(token.split('.')[1]));
  const currentUserId = payload.id;

  data.posts.slice().reverse().forEach(p => {
    const alreadyLiked = p.likes.includes(currentUserId);
    const isOwner = p.userId === currentUserId;

    const div = document.createElement("div");
    div.className = "box post " + (isOwner ? "own-post" : "");
    const name = p.userName ? p.userName : p.userEmail;
const initial = name.charAt(0).toUpperCase();

div.innerHTML = `
  <div class="avatar">${initial}</div>
  <div class="content">
    <strong>${name}</strong><br>
    ${p.content}<br><br>
    ❤️ ${p.likes.length}
    ${alreadyLiked ? "<span style='color:green'> You liked</span>" : ""}
    <br><br>

    <button class="like" onclick="likePost(${p.id})" ${alreadyLiked ? "disabled" : ""}>
      ${alreadyLiked ? "Liked" : "Like"}
    </button>

    ${isOwner ? `<button class="danger" onclick="deletePost(${p.id})">Delete</button>` : ""}
  </div>
`;


    container.appendChild(div);
  });
}

// ---------------- LIKE ----------------

async function likePost(id) {
  await fetch(API + `/posts/${id}/like`, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  getPosts();
}

// ---------------- DELETE ----------------

async function deletePost(id) {
  await fetch(API + `/posts/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": "Bearer " + token
    }
  });

  getPosts();
}

// ---------------- INIT ----------------

updateUI();

if (token) {
  getPosts();
}
