
window.addEventListener("pageshow", async function(event) {

    if (event.persisted) {

        const { data } = await supabaseClient.auth.getUser();

        if (!data.user) {
            window.location.replace("index.html");
        }

    }

});


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

const USER_1 = "d1b240e1-0c4a-43e6-affe-c689f8a75e4d"; 
const USER_2 = "c970b048-a9b2-43a6-8a2e-164520300dc1"; 
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

  /*if (error || !data.user) {
    window.location.href = "login.html";
    return;
  }*/

  if (error || !data.user) {
    window.location.replace("index.html");
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

  //loadMessages();
  const newSessionId = crypto.randomUUID();

const { error: insertError } = await supabaseClient
  .from("active_sessions")
  .insert({
    user_id: currentUser.id,
    session_id: newSessionId
  });

console.log("Insert Error:", insertError);

if (insertError) {
  alert("Already logged in on another device");
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
  return;
}

localStorage.setItem("session_id", newSessionId);

loadMessages();
}

startChat();

//===================================
// LOG OUT 
//===================================

/*async function logout() {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
}*/

async function logout() {
    
    const mySessionId = localStorage.getItem("session_id");
    
    console.log("Session ID:", mySessionId);
  
    if (mySessionId) {

        const { error } = await supabaseClient
            .from("active_sessions")
            .delete()
            .eq("session_id", mySessionId);

        console.log("Delete Error:", error);
    }


    localStorage.removeItem("session_id");

    await supabaseClient.auth.signOut();

    window.location.replace("index.html");
}

//===================================
// AUTO LOGOUT AFTER 1 MINUTE
//===================================

/*setTimeout(async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
}, 90000);*/

//===================================
// AUTO DELETE CHAT FROM DATABASE EVERY 2 MINUTES
//===================================

setInterval(async () => {

    const { error } = await supabaseClient
        .from("messages")
        .delete()
        .neq("id", 0);

    if (error) {
        console.error("Delete Error:", error);
    } else {
        console.log("All messages deleted from database");
        chatMessages.innerHTML = "";
    }

}, 10000); // 10 seconds
