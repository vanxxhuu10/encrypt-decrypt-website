document.addEventListener("DOMContentLoaded", () => {
    // Restore message and encrypted message from localStorage on page load
    const storedMessage = localStorage.getItem("messageInput");
    const storedEncrypted = localStorage.getItem("encryptedMessage");

    if (storedMessage) {
        document.getElementById("messageInput").value = storedMessage;
    }
    if (storedEncrypted) {
        document.getElementById("encryptedOutput").value = storedEncrypted;
    }
});
const backendURL = "https://encrypt-decrypt-website.vercel.app";

document.getElementById("encryptButton").addEventListener("click", async (event) => {
    event.preventDefault(); // Prevent page refresh

    const messageInput = document.getElementById("messageInput");
    const encryptedOutput = document.getElementById("encryptedOutput");

    const message = messageInput.value.trim();
    if (!message) return alert("Please enter a message!");

    try {
        const response = await fetch(`${backendURL}/encrypt`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        if (response.ok) {
            encryptedOutput.value = data.encryptedMessage;

            // Save both message and encrypted output in localStorage
            localStorage.setItem("messageInput", message);
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
window.onload = () => {
    const storedMessage = localStorage.getItem("encryptedMessage");
    if (storedMessage) {
        document.getElementById("encryptedOutput").value = storedMessage;
    }
};


document.getElementById("decryptButton").addEventListener("click", async () => {
    const encryptedMessage = document.getElementById("messageInput").value;
    if (!encryptedMessage) return alert("Please enter an encrypted message!");

    try {
        const response = await fetch(`${backendURL}/decrypt`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
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

document.querySelector("button[onclick='encryptMessage()']").addEventListener("click", async (event) => {
    event.preventDefault(); // Prevents any form submission or page reload

    const message = document.getElementById("messageInput").value;
    if (!message) return alert("Please enter a message!");

    try {
        const response = await fetch("http://localhost:5000/encrypt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById("encryptedOutput").value = data.encryptedMessage; // Ensure correct output ID
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        alert("Error connecting to server!");
        console.error(error);
    }
});
