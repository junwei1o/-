# 原理引導其餘四項支架實作筆記

- 圖像化微互動應放在作答前的原理導航區，僅揭露可觀測線索；互動選擇需在換題、換領域與快速複習時重設。
- 選項檢核應在作答後的回饋區，以條件檢查問題呈現，不評判或揭露選項正解。
- 知識連結使用既有世界原理鍵值與卡片資訊，僅導向已存在的概念內容。
- 題後小型反思為不計分的選擇式反思；其選擇狀態與其他題目互動狀態一起重設。

新卡片應接在原理引導的作答前後區塊，沿用既有卡片焦點、減少動態與 640px 單欄規則，避免影響收藏筆記的雙篩選版面。

資料契約已提供 visualProbe、optionCheckPrompt、relatedPrincipleKeys 與 reflection；所有欄位由 domain 模板或當前題目的 principleKeys 衍生，不包含 correctIndex、答案選項或解析內容。

UI 接線：visualProbe 位於作答前支架；optionCheckPrompt 與 reflection 位於答題結果回饋附近；relatedPrincipleKeys 使用既有 getWorldPrinciple 安全解析名稱。所有互動狀態需在切換領域、收藏快速複習與下一題時清除。
