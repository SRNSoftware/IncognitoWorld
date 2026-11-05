function toggleMenu(){
    document.getElementById("mobileNav").classList.toggle("active");
}

window.addEventListener("load", function(){
    document.body.classList.add("loaded");
});

function openLogin() {
    document.getElementById("loginOverlay").style.display = "flex";
}

function closeLogin() {
    document.getElementById("loginOverlay").style.display = "none";
}
function openLogin() {
    alert("Login clicked");
}
