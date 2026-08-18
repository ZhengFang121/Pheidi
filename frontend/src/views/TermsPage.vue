<template>
  <main class="terms-page">
    <article class="terms-card">
      <header class="terms-header">
        <p class="terms-eyebrow">Pheidi the Runner</p>
        <h1 class="terms-title">服務條款</h1>
        <p class="terms-updated">生效日期：2026 年 8 月 18 日</p>
      </header>

      <div class="terms-content">
        <section>
          <h2>一、條款的接受</h2>
          <p>
            歡迎使用「跑者菲迪 Pheidi the Runner」。當你註冊帳號、登入或使用本服務，即表示你已閱讀、理解並同意遵守本服務條款。
          </p>
        </section>

        <section>
          <h2>二、服務內容</h2>
          <p>
            本服務提供跑步紀錄、成長任務、成就徽章、學習內容與跑者交流等功能。實際提供的功能可能隨開發與營運狀況調整。
          </p>
        </section>

        <section>
          <h2>三、帳號使用與安全</h2>
          <ul>
            <li>你應提供正確且完整的註冊資料。</li>
            <li>你有責任妥善保管帳號與密碼，不應與他人共用。</li>
            <li>若發現帳號遭到未授權使用，請儘速通知我們。</li>
            <li>不得冒用他人身分、建立誤導性帳號或以自動化方式大量註冊。</li>
          </ul>
        </section>

        <section>
          <h2>四、使用者行為規範</h2>
          <p>使用本服務時，不得從事下列行為：</p>
          <ul>
            <li>發布違法、侵權、仇恨、騷擾或不實內容。</li>
            <li>干擾服務運作、嘗試未經授權存取系統或他人資料。</li>
            <li>散布惡意程式、垃圾訊息或從事其他可能損害服務與使用者的行為。</li>
          </ul>
        </section>

        <section>
          <h2>五、使用者內容</h2>
          <p>
            你仍保有自己發布內容的相關權利。為了提供、維護與展示服務功能，你同意授權本服務在必要範圍內儲存、處理與顯示該內容。
          </p>
        </section>

        <section>
          <h2>六、跑步與健康資訊</h2>
          <p>
            本服務提供的跑步建議、任務與相關內容僅供一般參考，不構成醫療診斷或專業醫療建議。請依自身健康狀況評估是否參與，必要時先諮詢合格醫療人員。
          </p>
        </section>

        <section>
          <h2>七、服務變更與中止</h2>
          <p>
            為了維護安全、改善功能或因不可抗力因素，本服務可能調整、暫停或中止部分功能。我們會在合理可行的範圍內提前公告重要變更。
          </p>
        </section>

        <section>
          <h2>八、智慧財產權</h2>
          <p>
            除使用者自行發布的內容外，本服務中的品牌名稱、角色、圖像、文字、介面與程式等內容，其相關權利屬本服務或合法權利人所有。未經許可，不得擅自重製、修改或作商業使用。
          </p>
        </section>

        <section>
          <h2>九、條款修改</h2>
          <p>
            本條款可能因功能、法令或營運需求而更新。更新後的內容將公布於本頁面，並標示新的生效日期。
          </p>
        </section>

        <section>
          <h2>十、聯絡方式</h2>
          <p>
            若對本服務條款或帳號使用有任何疑問，請透過網站提供的聯絡方式與我們聯繫。
          </p>
        </section>
      </div>

      <footer class="terms-footer">
        <RouterLink to="/login" class="terms-back-link">返回登入／註冊</RouterLink>
      </footer>
    </article>
  </main>
</template>

<style scoped>
.terms-page {
  min-height: 100vh;
  padding: var(--space-6) var(--space-5);
  background-color: var(--color-primary-pale);
}

.terms-card {
  width: min(100%, 52rem);
  margin: 0 auto;
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.terms-header {
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
  text-align: center;
}

.terms-eyebrow {
  margin: 0 0 var(--space-2);
  color: var(--color-dark-light);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wide);
}

.terms-title {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-heading);
}

.terms-updated {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.terms-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6) 0;
}

.terms-content section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.terms-content h2 {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.terms-content p,
.terms-content ul {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
}

.terms-content ul {
  padding-left: var(--space-4);
}

.terms-content li + li {
  margin-top: var(--space-2);
}

.terms-footer {
  display: flex;
  justify-content: center;
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}

.terms-back-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  color: var(--color-surface);
  background-color: var(--color-primary);
  font-weight: var(--font-weight-bold);
  text-decoration: none;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.terms-back-link:hover {
  border-color: color-mix(in srgb, var(--color-primary) 85%, var(--color-dark));
  background-color: color-mix(in srgb, var(--color-primary) 85%, var(--color-dark));
}

.terms-back-link:focus-visible {
  outline: 2px solid var(--color-dark);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .terms-page {
    padding: var(--space-4);
  }

  .terms-card {
    padding: var(--space-5);
    border-radius: var(--radius-lg);
  }

  .terms-title {
    font-size: var(--font-size-lg);
  }
}
</style>
