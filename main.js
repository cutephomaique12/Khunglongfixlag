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

        // Bắt sự kiện bấm nút
        for (const key of Object.keys(CONFIG.ITEMS)) {
            const btn = document.getElementById(`btn-${key}`);
            if (btn) {
                btn.addEventListener("click", () => generateShortLink(key));
            }
        }

        // Mở popup khi vượt link quay về
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
            } catch (e) {}
        }
    } catch (err) {
        document.getElementById("noticeBox").innerText = "Lỗi cài đặt giao diện.";
    }
});

// HÀM API VÒNG LẶP VÔ CỰC
async function generateShortLink(itemKey) {
    const btn = document.getElementById(`btn-${itemKey}`);
    btn.innerText = "ĐANG KẾT NỐI API...";
    btn.disabled = true;

    try {
        if (!CONFIG.API_LINK4M || CONFIG.API_LINK4M.trim() === "") {
            alert("LỖI: Bạn chưa điền mã API_LINK4M trong file config.js!");
            return resetBtn(btn);
        }

        const currentUrl = window.location.origin + window.location.pathname;
        const returnUrl = currentUrl + "?unlock=" + btoa(itemKey);
        
        // Link API gốc
        const apiUrl = `https://link4m.co/api-shorten/v2?api=${CONFIG.API_LINK4M}&url=${encodeURIComponent(returnUrl)}`;

        // Danh sách 4 đường truyền để ép lấy bằng được link
        const proxyList = [
            `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`,
            `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(apiUrl)}`,
            apiUrl // Đường truyền gốc
        ];

        let apiSuccess = false;

        // Vòng lặp: Thử từng đường truyền, cái nào sập thì tự nhảy qua cái tiếp theo
        for (let i = 0; i < proxyList.length; i++) {
            try {
                console.log("Đang thử đường truyền số " + (i + 1));
                const response = await fetch(proxyList[i]);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.status === "success" && data.shortenedUrl) {
                        window.location.href = data.shortenedUrl; // Bay sang Link4M
                        apiSuccess = true;
                        break; // Thành công thì dừng vòng lặp
                    } else if (data.status === "error") {
                        // Nếu kết nối được mà Link4M báo lỗi (VD: Sai API, Chưa liên kết Telegram)
                        alert("LỖI TỪ LINK4M: " + data.message + "\n\n(Gợi ý: Hãy kiểm tra xem bạn đã liên kết Telegram trên web Link4M chưa!)");
                        apiSuccess = true; 
                        resetBtn(btn);
                        break;
                    }
                }
            } catch (err) {
                console.log("Đường truyền " + (i + 1) + " bị chặn, đang đổi...");
            }
        }

        // Nếu cả 4 đường đều sập (do mạng chặn hoàn toàn)
        if (!apiSuccess) {
            alert("LỖI MẠNG: Điện thoại hoặc Wifi của bạn đang chặn kết nối API. Vui lòng tắt các phần mềm chặn quảng cáo hoặc dùng 4G.");
            resetBtn(btn);
        }

    } catch (error) {
        alert("LỖI KHÔNG XÁC ĐỊNH: " + error.message);
        resetBtn(btn);
    }
}

function resetBtn(btn) {
    btn.innerText = "🚀 Lấy Link Ngay";
    btn.disabled = false;
}
