# 健身紀錄

個人健身訓練紀錄 PWA。單人使用，資料完全存在本機（IndexedDB），可選擇串接 Google Drive 自動備份。

## 功能

- **動作庫**：自訂訓練動作，分類（胸/背/肩/腿/手臂/核心/有氧/全身）、器材、追蹤類型（重量×次數／次數／時間／重量×時間）
- **訓練紀錄**：即時記錄訓練組數，自動休息計時器（含音效、震動）、螢幕保持開啟（Wake Lock）
- **訓練範本**：可排定星期的訓練範本，快速開始
- **歷史紀錄**：依月份分組，訓練量/時長/動作數統計
- **進步統計**：每週肌群訓練量圖表、單一動作的重量/預估 1RM/訓練量趨勢圖、PR（個人紀錄）自動偵測
- **身體數據**：體重、體脂記錄與趨勢圖
- **備份**：本機 JSON 匯出/匯入（Zod 驗證），或串接 Google Drive 自動雲端備份

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

## 設定 Google Drive 自動備份（選填）

不設定也完全不影響 App 的其他功能，只是不會有雲端自動備份。設定步驟：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)，建立一個新專案（或使用現有專案）。
2. 左側選單「OAuth 同意畫面」：
   - 使用者類型選「外部」。
   - 發布狀態保持「測試中」（Testing），並在「測試使用者」加入你自己的 Google 帳號 email。這樣只有你自己能授權，不需要 Google 審核。
3. 左側選單「憑證」→「建立憑證」→「OAuth 用戶端 ID」：
   - 應用程式類型選「網頁應用程式」。
   - 「已授權的 JavaScript 來源」加入你會執行這個 App 的網址，例如 `http://localhost:5173`（開發環境）以及你實際部署的網址（例如 GitHub Pages 網址）。**不要**填「已授權的重新導向 URI」，這個 App 使用的是 token flow，不需要重新導向。
   - 建立後複製「用戶端 ID」（格式類似 `xxxxxxxx.apps.googleusercontent.com`）。
4. 專案根目錄新增 `.env` 檔（複製 `.env.example`），填入剛才的用戶端 ID：
   ```
   VITE_GOOGLE_CLIENT_ID=你的用戶端ID.apps.googleusercontent.com
   ```
5. 重新啟動 dev server（或重新建置）。到「設定」頁的「雲端備份」區塊按「連接 Google 帳號」即可。

App 只會請求 `drive.file` 這個最小權限範圍，代表它只能存取「自己上傳過的檔案」，無法讀取你 Google Drive 裡的其他任何檔案。存取權杖只存在記憶體中，不會寫入 localStorage，重新整理頁面後需要重新登入（若你仍登入 Google，會嘗試靜默刷新）。

## 資料安全注意事項

這是純前端 App，沒有後端伺服器，所有資料存在瀏覽器的 IndexedDB。因此：

- 沒有帳號系統、沒有伺服器端驗證 —— 因為沒有伺服器可以被攻擊。
- 匯入備份 JSON 時會用 Zod 嚴格驗證格式，避免載入格式錯誤或被竄改的資料。
- 沒有串接任何第三方分析或追蹤程式碼。
- Google OAuth 用戶端 ID 雖然會出現在前端程式碼中，但這是 Google 公開客戶端流程的正常設計（用戶端 ID 本身不是密鑰），配合「測試中」發布狀態與最小權限範圍，風險已降到最低。
