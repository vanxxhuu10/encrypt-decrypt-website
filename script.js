document.addEventListener("DOMContentLoaded", () => {
    // Restore values from localStorage
    const storedMessage = localStorage.getItem("messageInput");
    const storedEncrypted = localStorage.getItem("encryptedMessage");

    if (storedMessage) document.getElementById("messageInput").value = storedMessage;
    if (storedEncrypted) document.getElementById("encryptedOutput").value = storedEncrypted;
});

const backendURL = "https://encrypt-decrypt-website.vercel.app"; // Ensure this matches your deployed backend

document.getElementById("encryptButton").addEventListener("click", async (event) => {
    event.preventDefault(); // Prevent page refresh

    const messageInput = document.getElementById("messageInput").value.trim();
    if (!messageInput) return alert("Please enter a message!");

    try {
        const response = await fetch(`${backendURL}/encrypt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: messageInput })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById("encryptedOutput").value = data.encryptedMessage;

            // Save to localStorage
            localStorage.setItem("messageInput", messageInput);
            localStorage.setItem("encryptedMessage", data.encryptedMessage);

            console.log("✅ Encrypted Message:", data.encryptedMessage);
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        alert("Error connecting to server!");
        console.error(error);
    }
});

document.getElementById("decryptButton").addEventListener("click", async () => {
    const encryptedMessage = document.getElementById("encryptedOutput").value.trim();
    if (!encryptedMessage) return alert("Please enter an encrypted message!");

    try {
        const response = await fetch(`${backendURL}/decrypt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encryptedMessage })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById("decryptedOutput").value = data.decryptedMessage;
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        alert("Error connecting to server!");
        console.error(error);
    }
});
