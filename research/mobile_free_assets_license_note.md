# 手機專版免費素材授權決策紀錄

**日期：** 2026-08-15  
**範圍：** Academy Expedition 手機網頁遊戲的自然、農場與奇幻森林環境裝飾。此文件僅記錄素材授權與部署決策，並非法律意見。

## 採用決策

本次手機專版將優先採用 **Kenney Foliage Pack** 的少量 2D 植被 PNG 作為環境裝飾，並以既有原創角色、課綱內容、互動邏輯與 UI 作為產品主體。官方頁面列出此素材包為 100 個 2D 檔案，授權為 **Creative Commons CC0**；因此可在符合 CC0 條款的前提下整合與修改。雖然 CC0 不要求署名，本專案仍會在素材說明中保留來源致謝，以維持可追溯性。[1]

| 來源 | 查核結果 | 本次處理方式 |
| --- | --- | --- |
| Kenney Foliage Pack | 官方頁面標示 2D、100 個檔案、CC0。 | **採用**少量 PNG 裝飾；原始下載檔不隨網站部署。 |
| Kenney Background Elements | 官方頁面標示 2D、110 個檔案、CC0。 | **採用**少量場景元素與範例背景作為競技場環境層；以原創色彩、CSS 天候層與介面組合，不呈現為既有作品場景。 |
| Kenney Toon Characters | 官方頁面標示 2D、270 個檔案、CC0。 | 僅保留為未來原創學苑角色姿勢的**候選基礎**；不可作為既有受保護角色、作品名稱或角色識別的替代。 |
| Kenney Monster Builder Pack | 官方頁面標示 2D、170 個檔案、CC0。 | 僅保留為未來原創夥伴／守門者組合素材的**候選基礎**；需經自訂色彩、部件與世界觀命名轉譯，並維持現有 CSS 肖像作為可近用回退。 |
| Kenney Nature Kit | 官方頁面標示為 3D、330 個檔案、CC0。 | 不納入本次手機版首批資產，以降低網頁載入與處理成本；保留為日後 WebGL 場景的候選。 |
| itch.io | 站內存在 CC0 與免費素材篩選，但每個作品仍需在個別頁面確認授權與再散布條件。 | **僅作探索來源**；本次不使用未逐項查核的檔案。 |
| Unity Asset Store | 官方 FAQ 說明資產須作為具實質原創功能的產品內嵌使用，且不可讓終端使用者將素材作為獨立檔案下載／擷取。 | **不納入**公開網頁部署；瀏覽器交付靜態素材難以保證不可擷取，需個別取得明確的網頁散布權利才可評估。 |

## 整合原則

環境素材只擔任可愛、可讀的視覺點綴，不作為答題正確、捕捉成功或戰鬥傷害的條件。所有觸控控制仍須保有可見焦點、語意標籤與 reduced-motion 靜態回退；非裝飾性圖片須提供有意義的替代文字，純裝飾圖片則以 `aria-hidden` 排除於朗讀內容之外。

## 來源

[1]: https://kenney.nl/assets/foliage-pack "Kenney Foliage Pack — 官方資產頁"
[5]: https://kenney.nl/assets/background-elements "Kenney Background Elements — 官方資產頁"
[6]: https://kenney.nl/assets/toon-characters "Kenney Toon Characters — 官方資產頁"
[7]: https://kenney.nl/assets/monster-builder-pack "Kenney Monster Builder Pack — 官方資產頁"
[2]: https://kenney.nl/assets/nature-kit "Kenney Nature Kit — 官方資產頁"
[3]: https://itch.io/game-assets/assets-cc0/tag-nature "itch.io：CC0 自然素材分類頁"
[4]: https://assetstore.unity.com/browse/eula-faq "Unity Asset Store Terms of Service and EULA FAQ"

## 跨平台題目朗讀相容性依據（2026-08-15）

本專案持續使用瀏覽器原生 `SpeechSynthesis`，不把語音檔或第三方 TTS 服務當成必要依賴。`SpeechSynthesis` 提供裝置可用語音清單、`speak()`、`cancel()`、`pause()`、`resume()`，並以 `voiceschanged` 事件處理延遲載入的語音；`SpeechSynthesisUtterance` 可設定語言、音量、語速與語音，並以 start／end／error／pause／resume 事件回報狀態。Android Chrome 與 iOS Safari 均採取「由使用者明確點按開始」的控制設計；發生無聲或不可用時保留題目文字與可近用狀態說明，不阻斷答題。

[8]: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis "MDN：SpeechSynthesis"
[9]: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance "MDN：SpeechSynthesisUtterance"
[10]: https://developer.chrome.com/blog/web-apps-that-talk-introduction-to-the-speech-synthesis-api "Chrome for Developers：Web apps that talk"

## Kenney／itch.io 手機介面候選（2026-08-15）

| 來源 | 候選素材 | 授權核對結果 | 建議使用邊界 |
| --- | --- | --- | --- |
| Kenney | UI Pack (RPG Expansion) | 官方資產頁標示 **Creative Commons CC0**，含 85 個按鈕、面板與滑桿檔案。 | 僅挑選少量框線、徽記或按鈕形狀，保留 Academy Expedition 的紙質圖鑑色票與文字。 |
| itch.io | Game Icon Pack（Nieobie） | itch.io CC0 UI 清單描述為「800+ Rounded Free Icons (CC0)」；下載前仍要在個別作品頁再次核對檔案與授權。 | 候選為手機任務、設定或學習狀態的裝飾性圖示，不以清單頁取代個別下載授權。 |
| itch.io | 50 Free Nature Assets Flat Greyscale（MarkGosbell） | itch.io 免費 CC0 自然素材清單描述為「Collection of CC0 Naturepng assets」；下載前仍要在個別作品頁再次核對。 | 候選為低密度背景植物、步道與任務板邊飾；僅作為 PNG 裝飾，不承載互動或文字內容。 |

本輪僅會採用授權在單一作品頁可再次確認，且能以少量、壓縮後 PNG／SVG 輸出提供的資產。第三方素材不作為角色、世界觀、獎勵或答題邏輯的主體，也不將原始壓縮包或完整素材集放入網站部署。

[11]: https://kenney.nl/assets/ui-pack-rpg-expansion "Kenney UI Pack (RPG Expansion) — 官方資產頁"
[12]: https://itch.io/game-assets/assets-cc0/tag-user-interface "itch.io：CC0 UI 素材分類頁"
[13]: https://itch.io/game-assets/assets-cc0/free/tag-nature "itch.io：免費 CC0 自然素材分類頁"

## 本輪直接整合核對（2026-08-15）

本輪再次於官方作品頁確認 **Kenney UI Pack (RPG Expansion)** 為 2D RPG 介面素材包、含 85 個檔案，並標示為 **Creative Commons CC0**；因此僅擇取少量邊框、星級或徽記形狀，套用 Academy Expedition 自有的課綱色彩、文字與狀態資料，不匯入整套 UI 或使用其範例介面作為產品主視覺。[14] 既有的 **Kenney Monster Builder Pack** 官方頁同樣標示為 2D、170 個檔案與 **Creative Commons CC0**，本輪延續既有的原創組合頭像，不直接使用素材包中的預設角色，也不與既有受保護角色或標誌連結。[15]

| 素材 | 授權與用途核對 | 本輪採用邊界 |
| --- | --- | --- |
| Kenney UI Pack (RPG Expansion) | 官方頁明示 CC0、2D、85 個檔案。 | 僅取少量介面框線與徽記，作為 RPG 儀表與成就卡的裝飾；文字、語意、顏色與互動均由專案維護。 |
| Kenney Monster Builder Pack | 官方頁明示 CC0、2D、170 個檔案。 | 維持已部署的原創合成肖像與 CSS 回退，不增添可辨識的第三方角色／商標。 |

[14]: https://kenney.nl/assets/ui-pack-rpg-expansion "Kenney UI Pack (RPG Expansion) — 官方素材頁"
[15]: https://kenney.nl/assets/monster-builder-pack "Kenney Monster Builder Pack — 官方素材頁"
