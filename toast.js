// toast.js

let isToastActive = false;

// Function to show a toast message
function showToast(message) {
    if (isToastActive) return;
    isToastActive = true;

    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 100000;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
        isToastActive = false;
    }, 10000);
}

