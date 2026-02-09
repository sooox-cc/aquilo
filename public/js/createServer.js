const bgExit = document.getElementById("create-server-modal");
const bgExitBtn = document.getElementById("exitButton");

bgExit.addEventListener("click", () => {
    bgExit.style.display = 'none';
})

function exitCreateModal() {
    bgExit.style.display = 'none';
}

function showCreateModal() {
    bgExit.style.display = 'grid';
}