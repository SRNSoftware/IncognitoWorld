// ================================
// SUPABASE CONFIGURATION
// ================================

const SUPABASE_URL =
  "https://eoglnncvacmzbrgdfwyv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_K-1QCrNIPG29Cq73uuIyqg_O2vt2zh0";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ================================ 
// USER IDs 
// ================================ 

const USER_1 = "c4a3b506-a455-4dce-81d2-694e539b03d3"; 
const USER_2 = "2fcb71c0-c0d8-473e-bd0d-8d2339ea1328"; 
let currentUser = null; 
let otherUser = null;

// ================================
// CHAT ELEMENTS
// ================================

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");


// ================================
// YOUR NAME
// ================================

// Change this to your name
const MY_NAME = "You";


// ================================
// LOAD OLD MESSAGES
// ================================

async function loadMessages() {

  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser}),and(sender_id.eq.${otherUser},receiver_id.eq.${currentUser.id})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading messages:", error);
    return;
  }

  chatMessages.innerHTML = "";

  data.forEach(message => {
    displayMessage(message);
  });

  scrollToBottom();
}


// ================================
// DISPLAY MESSAGE
// ================================

function displayMessage(message) {
  const messageDiv = document.createElement("div");
  const type =
   message.sender_id === currentUser.id
    ? "sent"
    : "received";
  messageDiv.classList.add("message", type);
  const textElement = document.createElement("p");
  textElement.classList.add("message-text");
  textElement.textContent = message.message;
  const timeElement = document.createElement("span");
  timeElement.classList.add("message-time");
  const date = new Date(message.created_at);
  timeElement.textContent =
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  
  messageDiv.appendChild(textElement);
  messageDiv.appendChild(timeElement);
  chatMessages.appendChild(messageDiv);
}


// ================================
// SEND MESSAGE
// ================================

chatForm.addEventListener("submit", async function(event) {

  event.preventDefault();

  const text = messageInput.value.trim();

  if (!text) {
    return;
  }

  const { error } = await supabaseClient
  .from("messages")
  .insert({
    sender: currentUser.id,
    sender_id: currentUser.id,
    receiver_id: otherUser,
    message: text
  });

  if (error) {
    console.error("Error sending message:", error);
    alert("Message could not be sent.");
    return;
  }

  messageInput.value = "";
});
// ================================
// REAL-TIME CHAT
// ================================

supabaseClient
  .channel("chat-room")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages"
    },
    payload => {

      const message = payload.new;

      if (
        (message.sender_id === currentUser?.id &&
         message.receiver_id === otherUser) ||
        (message.sender_id === otherUser &&
         message.receiver_id === currentUser?.id)
      ) {
        displayMessage(message);
        scrollToBottom();
      }
    }
  )
  .subscribe();


// ================================
// SCROLL TO BOTTOM
// ================================

function scrollToBottom() {
  chatMessages.scrollTop =
    chatMessages.scrollHeight;
}


// ================================
// START CHAT
// ================================

async function startChat() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = data.user;

  if (currentUser.id === USER_1) {
    otherUser = USER_2;
  } else if (currentUser.id === USER_2) {
    otherUser = USER_1;
  } else {
    alert("Unauthorized user");
    return;
  }

  loadMessages();
}

startChat();

//===================================
// LOG OUT 
//===================================

async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
}

//===================================
// AUTO LOGOUT AFTER 1 MINUTE
//===================================

setTimeout(async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
}, 60000);
