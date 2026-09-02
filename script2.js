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
    message.sender === MY_NAME
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
      sender: MY_NAME,
      message: text
    });


  if (error) {

    console.error("Error sending message:", error);

    alert("Message could not be sent.");

    return;
  }


  messageInput.value = "";
  scrollToBottom();

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

      displayMessage(payload.new);

      scrollToBottom();

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

loadMessages();
