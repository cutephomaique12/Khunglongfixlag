document.addEventListener("DOMContentLoaded", () => {
    try {
        // Cập nhật text và link MXH
        document.getElementById("noticeBox").innerText = CONFIG.NOTICE_TEXT;
        document.getElementById("ytLink").href = CONFIG.YOUTUBE_LINK || "#";
        document.getElementById("teleGroupLink").href = CONFIG.TELEGRAM_GROUP || "#";
        document.getElementById("teleAdminLink").href = CONFIG.TELEGRAM_ADMIN || "#";
        document.getElementById("tiktokLink").href = CONFIG.TIKTOK_LINK || "#";

        // Vẽ 4 nút
        const container = document.getElementById("cardContainer");
        container.innerHTML = ""; // Xóa dữ liệu cũ để chống nhân đôi
        for (const [key, item] of Object.entries(CONFIG.ITEMS)) {
            const cardHTML = `
                <div class="card">
                    <h2>${item.title}</h2>
                    <div class="info">Update lên web ngày: <strong>${item.date}</strong></div>
                    <div class="info">Tình trạng: <strong style="color: ${item.statusColor}">${item.status}</strong></div>
                    <button class="btn-get" onclick="generateShortLink('${key}')" id="btn-${key}">🚀 Lấy Link Ngay</button>
                </div>
            `;
            container.innerHTML += cardHTML;
        }

        // Kiểm tra url xem có phải vừa vượt link xong quay về không
        const urlParams = new URLSearchParams(window.location.search);
        const unlockKey = urlParams.get('unlock');
        
        if (unlockKey) {
            try {
                const decodedKey = atob(unlockKey);
                const itemData = CONFIG.ITEMS[decodedKey];
                
                if (itemData && itemData.driveLink) {
                    const modal = document.getElementById("successModal");
                    const finalLink = document.getElementById("finalDownloadLink");
                    finalLink.href = itemData.driveLink;
                    modal.style.display = "flex";
                    
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (e) {
                console.log("Mã unlock không hợp lệ");
            }
        }
    } catch (err) {
        document.getElementById("noticeBox").innerText = "Lỗi tải giao diện: Sai cú pháp file config.js";
    }
});

// Hàm gọi API vượt link siêu cấp (Chống lỗi mạng)
async function generateShortLink(itemKey) {
    const btn = document.getElementById(`btn-${itemKey}`);
    btn.innerText = "Đang kết nối...";
    btn.disabled = true;

    try {
        if (!CONFIG.API_LINK4M || CONFIG.API_LINK4M.trim() === "") {
            alert("LỖI: Bạn chưa điền mã API_LINK4M trong file config.js!");
            return resetBtn(btn);
        }

        const currentUrl = window.location.origin + window.location.pathname;
        const returnUrl = currentUrl + "?unlock=" + btoa(itemKey);
        const apiUrl = `https://link4m.co/api-shorten/v2?api=${CONFIG.API_LINK4M}&url=${encodeURIComponent(returnUrl)}`;
        
        let data = null;

        // CÁCH 1: Dùng allorigins
        try {
            const res1 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`);
            if (res1.ok) {
                const proxyData = await res1.json();
                data = JSON.parse(proxyData.contents);
            }
        } catch (e1) {
            console.log("Cách 1 lỗi, thử Cách 2...");
        }

        // CÁCH 2: Dùng codetabs
        if (!data) {
            try {
                const res2 = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(apiUrl)}`);
                if (res2.ok) data = await res2.json();
            } catch (e2) {
                console.log("Cách 2 lỗi, thử Cách 3...");
            }
        }

        // CÁCH 3: Dùng corsproxy
        if (!data) {
            try {
                const res3 = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiUrl)}`);
                if (res3.ok) data = await res3.json();
            } catch (e3) {
                console.log("Cách 3 lỗi, thử Cách 4...");
            }
        }

        // CÁCH 4: Gọi trực tiếp
        if (!data) {
            try {
                const res4 = await fetch(apiUrl);
                if (res4.ok) data = await res4.json();
            } catch (e4) {
                throw new Error("Mạng của bạn đang chặn kết nối. Hãy thử mạng khác.");
            }
        }

        if (data && data.status === "success" && data.shortenedUrl) {
            window.location.href = data.shortenedUrl;
        } else {
            alert("Lỗi từ máy chủ Link4M: " + (data?.message || "Lỗi API."));
            resetBtn(btn);
        }

    } catch (error) {
        alert("LỖI KẾT NỐI: " + error.message);
        resetBtn(btn);
    }
}

function resetBtn(btn) {
    btn.innerText = "🚀 Lấy Link Ngay";
    btn.disabled = false;
}
