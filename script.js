function toggleMenu(){
    document.getElementById("mobileNav").classList.toggle("active");
}

window.addEventListener("load", function(){
    document.body.classList.add("loaded");
});

window.addEventListener("pageshow", function () {
    const mobileNav = document.getElementById("mobileNav");

    if (mobileNav) {
        mobileNav.classList.remove("active");
    }
});

window.addEventListener("load", async () => {
    const page = window.location.pathname;
    // Allow chat page
    if (page.includes("chat.html")) {
        return;
    }
    // Redirect every other page refresh to home
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav && nav.type === "reload") {
        window.location.replace("index.html");
    }
});
