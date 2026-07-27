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

// 4. Hàm xử lý API Siêu cấp (Vượt CORS qua 3 lớp)
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
        
        let result = null;

        // CÁCH 1: Dùng hệ thống Proxy corsproxy.io (Mạnh & Nhanh nhất)
        try {
            const res1 = await fetch(`https://corsproxy.io/?${encodeURIComponent(apiUrl)}`);
            if (res1.ok) result = await res1.json();
        } catch (err1) {
            console.log("Cách 1 bị mạng chặn, đang chuyển Cách 2...");
        }

        // CÁCH 2: Dùng hệ thống Proxy codetabs (Dự phòng nếu cách 1 xịt)
        if (!result) {
            try {
                const res2 = await fetch(`https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(apiUrl)}`);
                if (res2.ok) result = await res2.json();
            } catch (err2) {
                console.log("Cách 2 bị mạng chặn, đang chuyển Cách 3...");
            }
        }

        // CÁCH 3: Cố gắng gọi trực tiếp thẳng tới máy chủ Link4M
        if (!result) {
            try {
                const res3 = await fetch(apiUrl);
                if (res3.ok) result = await res3.json();
            } catch (err3) {
                throw new Error("Mạng của bạn đang chặn kết nối an toàn. Hãy thử dùng mạng 4G hoặc WiFi khác.");
            }
        }

        // Kiểm tra kết quả xử lý
        if (result && result.status === "success" && result.shortenedUrl) {
            // Nhảy sang trang rút gọn thành công
            window.location.href = result.shortenedUrl;
        } else {
            alert("Lỗi từ Link4M: " + (result?.message || "Đã xảy ra lỗi, vui lòng báo Admin."));
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
