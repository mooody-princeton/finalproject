// Sidebar.js
// Scripts for handling sidebar

function w3_open() {
    document.getElementById("moodSidebar").style.display = "block";
    document.getElementById("mainContent").style.marginLeft = "300px";
}

function w3_close() {
    document.getElementById("moodSidebar").style.display = "none";
    document.getElementById("mainContent").style.marginLeft = "0px";
}
