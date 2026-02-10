const bgExit = document.getElementById("create-server-modal");

// Only close when clicking the backdrop itself, not children
bgExit.addEventListener("click", (e) => {
    if (e.target === bgExit) {
        bgExit.style.display = 'none';
    }
})

function exitCreateModal() {
    bgExit.style.display = 'none';
}

function showCreateModal() {
    bgExit.style.display = 'grid';
}

// Submit via fetch, then redirect to the new server
const createForm = bgExit.querySelector('form');
createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = createForm.querySelector('input[name="name"]').value.trim();
    if (!name) return;

    try {
        const res = await fetch('/api/servers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Failed to create server');
        const data = await res.json();
        window.location.href = '/server/' + data.id;
    } catch (err) {
        console.error(err);
    }
});
