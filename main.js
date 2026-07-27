document.addEventListener("DOMContentLoaded", () => {
    // 1. Cập nhật thông tin text và Mạng xã hội từ config
    document.getElementById("noticeBox").innerText = CONFIG.NOTICE_TEXT;
    document.getElementById("ytLink").href = CONFIG.YOUTUBE_LINK || "#";
    document.getElementById("teleGroupLink").href = CONFIG.TELEGRAM_GROUP || "#";
    document.getElementById("teleAdminLink").href = CONFIG.TELEGRAM_ADMIN || "#";

    // 2. Tự động vẽ 4 nút từ CONFIG.ITEMS
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

    // 3. Kiểm tra xem người dùng có phải vừa vượt link xong quay lại không
    const urlParams = new URLSearchParams(window.location.search);
    const unlockKey = urlParams.get('unlock');
    
    if (unlockKey) {
        // Giải mã key
        const decodedKey = atob(unlockKey);
        const itemData = CONFIG.ITEMS[decodedKey];
        
        if (itemData && itemData.driveLink) {
            // Hiển thị Popup và gắn link Drive gốc
            const modal = document.getElementById("successModal");
            const finalLink = document.getElementById("finalDownloadLink");
            finalLink.href = itemData.driveLink;
            modal.style.display = "flex";
            
            // Xóa url param để làm sạch thanh địa chỉ (Tránh bị f5 lặp lại popup)
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
});

// 4. Hàm xử lý khi bấm nút "Lấy Link"
async function generateShortLink(itemKey) {
    const btn = document.getElementById(`btn-${itemKey}`);
    btn.innerText = "Đang tạo link...";
    btn.disabled = true;

    try {
        // Link trả về web của bạn sau khi vượt (Mã hóa itemKey nhẹ để ẩn)
        const currentUrl = window.location.origin + window.location.pathname;
        const returnUrl = currentUrl + "?unlock=" + btoa(itemKey);
        
        // Gọi API Link4M
        const apiUrl = `https://link4m.co/api-shorten/v2?api=${CONFIG.API_LINK4M}&url=${encodeURIComponent(returnUrl)}`;
        
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.status === "success" || result.status === "error") {
            // Nếu thành công, mở trang Link4M ở tab hiện tại
            let shortUrl = result.shortenedUrl; 
            window.location.href = shortUrl;
        } else {
            alert("Có lỗi khi tạo link. Vui lòng kiểm tra lại cấu hình API.");
            btn.innerText = "🚀 Lấy Link Ngay";
            btn.disabled = false;
        }
    } catch (error) {
        alert("Lỗi kết nối API rút gọn link. Vui lòng thử lại sau.");
        btn.innerText = "🚀 Lấy Link Ngay";
        btn.disabled = false;
    }
}
