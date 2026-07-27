document.addEventListener("DOMContentLoaded", () => {
    // Cập nhật text và link MXH
    document.getElementById("noticeBox").innerText = CONFIG.NOTICE_TEXT;
    document.getElementById("ytLink").href = CONFIG.YOUTUBE_LINK || "#";
    document.getElementById("teleGroupLink").href = CONFIG.TELEGRAM_GROUP || "#";
    document.getElementById("teleAdminLink").href = CONFIG.TELEGRAM_ADMIN || "#";

    // Vẽ 4 nút
    const container = document.getElementById("cardContainer");
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
});

// Hàm gọi API vượt link
async function generateShortLink(itemKey) {
    const btn = document.getElementById(`btn-${itemKey}`);
    btn.innerText = "Đang tạo link...";
    btn.disabled = true;

    try {
        if (!CONFIG.API_LINK4M || CONFIG.API_LINK4M.trim() === "") {
            alert("LỖI: Bạn chưa điền mã API_LINK4M trong file config.js!");
            return resetBtn(btn);
        }

        const currentUrl = window.location.origin + window.location.pathname;
        const returnUrl = currentUrl + "?unlock=" + btoa(itemKey);
        
        // Link API gốc của Link4M
        const apiUrl = `https://link4m.co/api-shorten/v2?api=${CONFIG.API_LINK4M}&url=${encodeURIComponent(returnUrl)}`;
        
        // Dùng Proxy allorigins để vượt rào CORS chặn API
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Không thể kết nối với hệ thống trung gian.");
        
        const data = await response.json();
        if (!data.contents) throw new Error("Hệ thống trung gian không trả về dữ liệu.");
        
        // Phân tích dữ liệu JSON trả về từ Proxy
        const result = JSON.parse(data.contents);
        
        if (result.status === "success" && result.shortenedUrl) {
            // Nhảy sang trang rút gọn thành công
            window.location.href = result.shortenedUrl;
        } else {
            alert("Lỗi từ máy chủ Link4M: " + (result.message || "Sai API Key hoặc lỗi hệ thống"));
            resetBtn(btn);
        }

    } catch (error) {
        alert("LỖI BẢN MỚI: " + error.message + "\n\nHãy đảm bảo bạn không bật trình chặn quảng cáo nào trên điện thoại.");
        resetBtn(btn);
    }
}

function resetBtn(btn) {
    btn.innerText = "🚀 Lấy Link Ngay";
    btn.disabled = false;
}
