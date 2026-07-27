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
        try {
            const decodedKey = atob(unlockKey);
            const itemData = CONFIG.ITEMS[decodedKey];
            
            if (itemData && itemData.driveLink) {
                // Hiển thị Popup và gắn link Drive gốc
                const modal = document.getElementById("successModal");
                const finalLink = document.getElementById("finalDownloadLink");
                finalLink.href = itemData.driveLink;
                modal.style.display = "flex";
                
                // Xóa url param để làm sạch thanh địa chỉ
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (e) {
            console.log("Mã unlock không hợp lệ");
        }
    }
});

// 4. Hàm xử lý khi bấm nút "Lấy Link" (Đã nâng cấp chống lỗi CORS)
async function generateShortLink(itemKey) {
    const btn = document.getElementById(`btn-${itemKey}`);
    btn.innerText = "Đang tạo link...";
    btn.disabled = true;

    try {
        // Kiểm tra xem đã điền API chưa
        if (!CONFIG.API_LINK4M || CONFIG.API_LINK4M.trim() === "") {
            alert("Lỗi: Bạn chưa điền mã API_LINK4M trong file config.js!");
            btn.innerText = "🚀 Lấy Link Ngay";
            btn.disabled = false;
            return;
        }

        const currentUrl = window.location.origin + window.location.pathname;
        const returnUrl = currentUrl + "?unlock=" + btoa(itemKey);
        
        // Link API gốc
        const apiUrl = `https://link4m.co/api-shorten/v2?api=${CONFIG.API_LINK4M}&url=${encodeURIComponent(returnUrl)}`;
        
        let response;
        try {
            // Thử gọi API trực tiếp trước
            response = await fetch(apiUrl);
        } catch (fetchError) {
            // Nếu bị trình duyệt chặn (CORS/Adblock), dùng đường vòng Proxy
            console.log("Bị chặn CORS, chuyển sang dùng Proxy...");
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
            response = await fetch(proxyUrl);
        }

        if (!response.ok) {
            throw new Error("Lỗi máy chủ Link4M (Mã lỗi: " + response.status + ")");
        }

        const result = await response.json();
        
        if (result.status === "success" || result.status === "error") {
            if (result.shortenedUrl) {
                // Chuyển hướng sang trang vượt link
                window.location.href = result.shortenedUrl;
            } else {
                alert("Lỗi từ Link4M: " + (result.message || "Không lấy được link rút gọn."));
                btn.innerText = "🚀 Lấy Link Ngay";
                btn.disabled = false;
            }
        } else {
            alert("Lỗi phản hồi API. Vui lòng kiểm tra lại API Key.");
            btn.innerText = "🚀 Lấy Link Ngay";
            btn.disabled = false;
        }

    } catch (error) {
        alert("Chi tiết lỗi: " + error.message + "\n\nHãy tắt trình chặn quảng cáo nếu có và thử lại.");
        btn.innerText = "🚀 Lấy Link Ngay";
        btn.disabled = false;
    }
}
