# 專案資訊

## 專案名稱

跑者菲迪（Pheidi the Runner）

## 技術棧

### 前端開發

- Vue 3
- Vite
- Pinia
- PrimeVue
- Tailwind CSS
- GSAP
- TypeScript

### 後端開發

- Node.js
- Express.js
- JWT

### 資料庫

- MongoDB

### 版本控制

- Git
- GitHub

## 開發原則

### 開發規範

- 優先使用 Composition API
- 優先使用 TypeScript 型別定義
- UI 元件優先使用 PrimeVue
- 樣式優先使用 Tailwind CSS

### 工作流程

- 開始修改前，請先閱讀 https://github.com/ZhengFang121/Pheidi.git 和相關檔案，理解現有架構後再進行修改。
- 優先遵循現有專案的程式風格與命名規則，請優先套用 pheidi\frontend\src\styles 的樣式設定。
- 除非我要求，否則不要進行大規模重構。
- 修改時請只調整與需求相關的程式碼，避免影響其他功能。
- 發現潛在問題時可以提出建議，但不要擅自修改無關內容。
- 若我的需求可以有多種做法，請先採用：
  - 官方推薦
  - 社群主流
  - 容易維護
  - 容易理解

## 程式碼品質

- 保持程式碼簡潔、可讀、易維護。
- 避免重複程式碼（DRY）。
- 優先採用符合目前專案技術棧的寫法。
- 新增功能時請考慮錯誤處理與邊界情況。

## 驗證流程

- 修改程式後，能測試就測試。
- 若無法測試，請明確說明原因。
- 如有 lint、build 或 test 指令，請優先執行驗證。
- 若執行驗證失敗，請提供錯誤訊息與可能原因。

## UI 與 Design System

新增或修改任何 Frontend 頁面、元件與樣式前，必須先讀取：

- `frontend/src/styles/index.css`
- `frontend/src/styles/base.css`
- `frontend/src/styles/colors.css`
- `frontend/src/styles/typography.css`
- `frontend/src/styles/spacing.css`
- `frontend/src/styles/radius.css`
- `frontend/src/styles/shadow.css`
- `frontend/src/styles/components/`

修改 UI 時，優先使用現有 Design Token 與共用元件樣式。
除非現有 Token 無法表達需求，否則不要硬編碼重複的顏色、間距、圓角、字體與陰影。

## Skills 使用與優先權

### 核心原則

- Skills 是協助分析、設計、實作與檢查的工具，不是改寫專案規範或替換既有架構的依據。
- Pheidi 現有程式碼、專案架構、程式風格，以及 `frontend/src/styles/` Design System，皆優先於任何 Project Skill 或 Global Skill 的預設建議。
- 所有 Skill 產出的設計、元件、樣式、動畫與程式碼，都必須映射回 Pheidi 既有技術棧、Design Token、共用樣式與元件模式後才能採用。
- 僅使用完成目前需求所必要的 Skills，避免因 Skill 的通用範本擴大修改範圍或進行無關重構。

### 衝突時的優先順序

當 Skill 建議與專案規範衝突時，依下列順序判斷，前者優先於後者：

1. 本 `AGENTS.md` 的專案規範
2. Pheidi 現有專案架構、既有程式碼與程式風格
3. `frontend/src/styles/` 既有 Design System、Design Token 與共用元件樣式
4. Vue 3、TypeScript、PrimeVue、Tailwind CSS 的既有實作方式
5. Pheidi Project Skills
6. Global Skills

若仍無法判斷，應先說明衝突內容、可能影響與建議做法，取得使用者確認後再修改，不得自行選擇會改變架構或視覺系統的方案。

### Frontend 與 Design System 規範

- 修改任何 Frontend 頁面、元件或樣式前，必須先閱讀相關程式碼與本文件「UI 與 Design System」列出的 `frontend/src/styles/` 檔案及相關 component styles。
- 優先沿用既有 Design Token、CSS 變數、共用類別與 PrimeVue 元件；Tailwind CSS 應依專案現行慣例使用。
- 除非使用者明確要求且確認影響，否則不得建立第二套 Design Token、平行 Design System、重複的 CSS 變數或新的視覺規範。
- 不得因外部 Skill 的建議，將既有 PrimeVue 架構改為或混入 `shadcn/ui`、`shadcn-vue`、Radix UI、Reka UI、Nuxt UI，或其他替代 UI 元件系統。
- 若 Skill 提供的範例基於 React、Next.js、shadcn、Radix 或其他非本專案技術，只能採用其中通用的視覺、響應式、可用性與無障礙原則，並以 Vue 3、TypeScript、PrimeVue、Tailwind CSS 及既有 Pheidi 樣式重新實作。

### Project Skills

Project Skills 用於 Pheidi 專案特定的動畫設計與技術實作，其產出仍須遵循既有 Design System、元件架構與效能要求。

- `motion-design`：負責動畫設計原則，例如動態層級、節奏、敘事、轉場、回饋與可理解性；不直接決定或替換專案架構。
- `gsap-core`：負責 GSAP 核心 API 與基本動畫實作。
- `gsap-frameworks`：負責 GSAP 與 Vue 3 的生命週期、作用域及清理方式。
- `gsap-performance`：負責動畫效能、重繪成本與裝置相容性檢查。
- `gsap-plugins`：負責 GSAP Plugin 的選擇與正確用法。
- `gsap-scrolltrigger`：負責 ScrollTrigger 的捲動觸發、同步、固定與響應式實作。
- `gsap-timeline`：負責時間軸、動畫排序、標籤與可維護的動畫流程。
- `gsap-utils`：負責 GSAP 工具函式與可重用的動畫計算。

使用動畫 Skills 時，應先由 `motion-design` 確認動態目的與體驗原則，再依需求選用最少數量的 GSAP Skills 完成技術實作；不得為展示 Skill 能力而加入與需求無關的動畫。

### Global Skills

下列 Global Skills 僅作為設計分析、方向建議與品質檢查顧問，不得自行改變 Pheidi 的 Vue 3、TypeScript、PrimeVue、Tailwind CSS 架構或建立新的設計系統：

- `frontend-design`
- `ui-ux-pro-max`
- `design`
- `design-system`
- `ui-styling`
- `brand`
- `design-dna`
- `impeccable`
- `web-design-guidelines`

使用 Global Skills 時，必須遵守下列規則：

- 將建議轉換為既有 Design Token、PrimeVue 元件、Tailwind CSS 寫法與專案命名規則，不直接複製不相容的範本或技術。
- `design-dna` 主要用於分析參考圖片、網站、品牌線索、設計語言、Design Token 與視覺效果；其分析結果是設計依據，不得直接以生成結果取代 Pheidi 的 Vue／PrimeVue 架構。
- `design-system` 只能協助檢查或補足既有系統的一致性；未經使用者確認，不得另外建立一套 Token 架構。
- `ui-styling` 若提供 shadcn、Radix 或其他框架專屬做法，只能採用其中可映射至 Pheidi 的通用 Tailwind、響應式與無障礙原則。
- `brand`、`design`、`frontend-design`、`ui-ux-pro-max` 的視覺建議，必須符合 Pheidi 既有品牌、版面、字體、色彩與元件語言。
- `impeccable` 與 `web-design-guidelines` 主要用於功能完成後的 UI／UX、響應式、無障礙與介面規範 audit；audit 發現的問題應先列出影響與建議，不得藉此進行需求外的大規模改版。

### 建議工作流程

1. 先確認使用者需求、影響範圍與本 `AGENTS.md` 規範。
2. 閱讀相關現有程式碼、元件與 `frontend/src/styles/` Design System。
3. 判斷是否真的需要 Skill，並只選用與需求直接相關的 Project Skills 或 Global Skills。
4. 將 Skill 建議映射回 Vue 3、TypeScript、PrimeVue、Tailwind CSS 與既有 Design Token 後再實作。
5. 完成後執行適當的 lint、build、test 與必要的互動／視覺驗證。
6. 如為 UI 修改，再使用 `impeccable` 或 `web-design-guidelines` 進行完成後 audit；只修正需求範圍內的問題，其他發現另行提出。
