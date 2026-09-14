const SUPABASE_URL =
  "https://eoglnncvacmzbrgdfwyv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_K-1QCrNIPG29Cq73uuIyqg_O2vt2zh0";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// SIGNUP Function

async function signup() {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const message = document.getElementById("signupMessage");
    console.log("Signup button clicked");
    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });


    /*if (error) {
        console.error(error);
        message.style.color = "red";
        message.innerText = error.message;
    } else {
        console.log(data);
        message.style.color = "green";
        message.innerText = "Signup successful! Please check your email.";
    }*/

    if (error) {
    console.error(error);
    message.style.color = "red";

    if (error.message.toLowerCase().includes("rate limit")) {
        message.innerText = "Too many signup attempts. Please wait a few minutes and try again.";
    } else {
        message.innerText = error.message;
    }

} else {
    console.log(data);
    message.style.color = "green";
    message.innerText = "Signup successful! Please check your email.";
}

}

// Login Function
async function login() {
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    let message = document.getElementById("message");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });


    if (error) {
        message.style.color = "red";
        message.innerText = error.message;

    } else {
        message.style.color = "green";
        message.innerText = "Login Successful";
        setTimeout(() => {
            window.location.href = "chat.html";
        }, 3000);
    }
}
