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
        container.innerHTML = ""; 
        
        for (const [key, item] of Object.entries(CONFIG.ITEMS)) {
            const cardHTML = `
                <div class="card">
                    <h2>${item.title}</h2>
                    <div class="info">Update lên web ngày: <strong>${item.date}</strong></div>
                    <div class="info">Tình trạng: <strong style="color: ${item.statusColor}">${item.status}</strong></div>
                    <button class="btn-get" id="btn-${key}">🚀 Lấy Link Ngay</button>
                </div>
            `;
            container.innerHTML += cardHTML;
        }

        // Gán sự kiện click trực tiếp cho các nút
        for (const key of Object.keys(CONFIG.ITEMS)) {
            const btn = document.getElementById(`btn-${key}`);
            if (btn) {
                btn.addEventListener("click", () => generateShortLink(key));
            }
        }

        // Xử lý Popup khi vượt link thành công quay lại
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
            } catch (e) { console.log("Mã unlock không hợp lệ"); }
        }
    } catch (err) {
        document.getElementById("noticeBox").innerText = "Lỗi tải giao diện. Vui lòng báo Admin.";
    }
});

// Hàm gọi API Link4M siêu tốc - Chống treo web (Timeout 5 giây)
async function generateShortLink(itemKey) {
    const btn = document.getElementById(`btn-${itemKey}`);
    btn.innerText = "ĐANG KẾT NỐI...";
    btn.disabled = true;

    try {
        if (!CONFIG.API_LINK4M || CONFIG.API_LINK4M.trim() === "") {
            alert("LỖI: Bạn chưa điền mã API_LINK4M!");
            return resetBtn(btn);
        }

        const currentUrl = window.location.origin + window.location.pathname;
        const returnUrl = currentUrl + "?unlock=" + btoa(itemKey);
        const apiUrl = `https://link4m.co/api-shorten/v2?api=${CONFIG.API_LINK4M}&url=${encodeURIComponent(returnUrl)}`;

        // Hàm Ép giới hạn thời gian (5 giây không load được là hủy)
        const fetchWithTimeout = (url) => {
            return Promise.race([
                fetch(url),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
        };

        let data = null;

        // CÁCH 1: THỬ KẾT NỐI TRỰC TIẾP TRƯỚC (Nhanh Nhất)
        try {
            const res = await fetchWithTimeout(apiUrl);
            if (res.ok) data = await res.json();
        } catch (e) {
            console.log("Mạng chặn hoặc máy chủ chậm, đang đổi đường vòng...");
        }

        // CÁCH 2: THỬ DÙNG ĐƯỜNG VÒNG BẢO MẬT (Nếu Cách 1 thất bại)
        if (!data) {
            try {
                const proxyUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(apiUrl)}`;
                const res2 = await fetchWithTimeout(proxyUrl);
                if (res2.ok) data = await res2.json();
            } catch (e2) {
                console.log("Đường vòng cũng bị chậm.");
            }
        }

        // KIỂM TRA & XỬ LÝ KẾT QUẢ (Không bao giờ để treo nút)
        if (data && data.status === "success" && data.shortenedUrl) {
            // Bay thẳng sang Link4M
            window.location.href = data.shortenedUrl;
        } else {
            let msg = (data && data.message) ? data.message : "Máy chủ Link4M từ chối kết nối hoặc đang bảo trì.";
            alert("LỖI: " + msg + "\n\nGiải pháp: Vui lòng thử dùng mạng 4G hoặc Wifi khác để lấy link.");
            resetBtn(btn);
        }

    } catch (error) {
        alert("LỖI HỆ THỐNG: " + error.message);
        resetBtn(btn);
    }
}

function resetBtn(btn) {
    btn.innerText = "🚀 Lấy Link Ngay";
    btn.disabled = false;
}
