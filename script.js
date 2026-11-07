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
