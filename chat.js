// ================================
// SUPABASE CONFIGURATION
// ================================

const SUPABASE_URL = "https://eoglnncvacmzbrgdfwyv.supabase.co";
const SUPABASE_KEY = "sb_publishable_K-1QCrNIPG29Cq73uuIyqg_O2vt2zh0";
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ================================
// USER IDS
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

const MY_NAME = "You";


// ================================
// LOAD OLD MESSAGES
// ================================

async function loadMessages() {
  if (!currentUser || !otherUser) return;
  const { data, error } = await supabaseClient
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser}),and(sender_id.eq.${otherUser},receiver_id.eq.${currentUser.id})`
    )
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Load Message Error:", error);
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

chatForm.addEventListener("submit", async function(event){
  event.preventDefault();

  if (!currentUser || !otherUser) {
    console.log("User not ready");
    return;
  }

  const text = messageInput.value.trim();
  if (!text) return;

  const { error } = await supabaseClient
    .from("messages")
    .insert({
      sender: currentUser.id,
      sender_id: currentUser.id,
      receiver_id: otherUser,
      message: text
    });


  if(error){
    console.error("Send Message Error:", error);
    return;
  }
  messageInput.value = "";
});

// ================================
// REALTIME CHAT
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
       message.receiver_id === otherUser)
      ||
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
// START CHAT
// ================================

async function startChat(){
const {data,error} =
await supabaseClient.auth.getUser();
if(error || !data.user){
window.location.replace("index.html");
return;
}


currentUser=data.user;
if(currentUser.id===USER_1){
otherUser=USER_2;
}
else if(currentUser.id===USER_2){
otherUser=USER_1;
}
else{
alert("Unauthorized user");
return;
}

// create new session

const newSessionId = crypto.randomUUID();
const {data:oldSession,error:sessionError}
=
await supabaseClient
.from("active_sessions")
.select("*")
.eq("user_id",currentUser.id)
.maybeSingle();

if(sessionError){
console.log(sessionError);
}

// update old session

if(oldSession){
const {error:updateError}
=
await supabaseClient
.from("active_sessions")
.update({
session_id:newSessionId,
login_time:new Date().toISOString(),
last_seen:new Date().toISOString()
})
.eq("user_id",currentUser.id);

if(updateError){
console.log(updateError);
return;
}
}

else{
const {error:insertError}
=
await supabaseClient
.from("active_sessions")
.insert({
user_id:currentUser.id,
session_id:newSessionId,
login_time:new Date().toISOString(),
last_seen:new Date().toISOString()
});

if(insertError){
console.log(insertError);
return;
}
}
localStorage.setItem(
"session_id",
newSessionId
);
startHeartbeat();
startSessionListener();
loadMessages();
}
startChat();

// ================================
// HEARTBEAT
// ================================

function startHeartbeat(){
setInterval(async()=>{
const mySession =
localStorage.getItem("session_id");

if(!mySession) return;
const {data,error}
=
await supabaseClient
.from("active_sessions")
.select("session_id")
.eq("user_id",currentUser.id)
.single();

if(error){
console.log(error);
return;
}

// another login detected

if(data.session_id !== mySession){
alert("This account is logged in somewhere else");
await supabaseClient.auth.signOut();
localStorage.removeItem("session_id");
window.location.replace("index.html");
return;
}

await supabaseClient
.from("active_sessions")
.update({
last_seen:new Date().toISOString()
})
.eq("session_id",mySession);
},30000);
}

// ================================
// REALTIME SESSION MONITOR
// ================================

function startSessionListener() {
  const mySessionId = localStorage.getItem("session_id");
  supabaseClient
    .channel("session-monitor")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "active_sessions",
        filter: `user_id=eq.${currentUser.id}`
      },
      async (payload) => {
        const newSessionId = payload.new.session_id;
        if (newSessionId !== mySessionId) {
          alert("This account is logged in somewhere else");
          await supabaseClient.auth.signOut();
          localStorage.removeItem("session_id");
          window.location.replace("index.html");
        }
      }
    )
    .subscribe();
}

// ================================
// LOGOUT
// ================================

async function logout(){
const sessionId =
localStorage.getItem("session_id");

if(sessionId){
await supabaseClient
.from("active_sessions")
.delete()
.eq("session_id",sessionId);
}
    
await supabaseClient.auth.signOut();
localStorage.removeItem("session_id");
window.location.replace("index.html");
}

// ================================
// AUTO DELETE CHAT
// ================================

/*setInterval(async()=>{
const {error}=
await supabaseClient
.from("messages")
.delete()
.neq("id",0);
   
if(error){
console.log(error);
}
else{
chatMessages.innerHTML="";
console.log("Messages deleted");
}
},60000);*/

// ================================
// SCROLL
// ================================

function scrollToBottom(){
chatMessages.scrollTop =
chatMessages.scrollHeight;
}
