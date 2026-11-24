/**
 * FLASHCARDS HÁN - VIỆT & NGÔN NGỮ CHIẾN LƯỢC
 * Bộ điều khiển tương tác (Mobile Drawer + Search + Swipe + Mermaid Dynamic Render)
 */

document.addEventListener("DOMContentLoaded", () => {
  const cards = window.FLASHCARDS_DATA || [];
  if (cards.length === 0) {
    console.error("Không tìm thấy dữ liệu từ vựng trong cards-data.js");
    return;
  }

  let currentIndex = 0;
  let isFlipped = false;
  let isDrawerOpen = false;
  let touchStartX = 0;
  let touchStartY = 0;

  // DOM Elements - Card Scene
  const cardElement = document.getElementById("card");
  const cardScene = document.getElementById("card-scene");
  const progressBar = document.getElementById("progress-bar");
  const btnPrev = document.getElementById("btn-prev");
  const btnNext = document.getElementById("btn-next");
  const btnFlip = document.getElementById("btn-flip");
  const flipBtnText = document.getElementById("flip-btn-text");
  const flipBackBtn = document.getElementById("flip-back-btn");

  // DOM Elements - Front
  const cardCounter = document.getElementById("card-counter");
  const frontEnglish = document.getElementById("front-english");
  const frontSub = document.getElementById("front-sub");
  const frontQuote = document.getElementById("front-quote");
  const frontMechanism = document.getElementById("front-mechanism");

  // DOM Elements - Back
  const backHanviet = document.getElementById("back-hanviet");
  const backHantu = document.getElementById("back-hantu");
  const mermaidContainer = document.getElementById("mermaid-container");
  const decompressionContainer = document.getElementById("decompression-container");
  const synthesisBox = document.getElementById("synthesis-box");
  const fieldAppText = document.getElementById("field-app-text");

  // DOM Elements - Drawer & Search
  const btnCatalog = document.getElementById("btn-catalog");
  const catalogLabel = document.getElementById("catalog-label");
  const drawerOverlay = document.getElementById("drawer-overlay");
  const catalogDrawer = document.getElementById("catalog-drawer");
  const btnCloseDrawer = document.getElementById("btn-close-drawer");
  const catalogSearch = document.getElementById("catalog-search");
  const btnClearSearch = document.getElementById("btn-clear-search");
  const drawerListContainer = document.getElementById("drawer-list-container");
  const drawerStats = document.getElementById("drawer-stats");

  // Update Total Count in Header Button
  if (catalogLabel) {
    catalogLabel.textContent = `Kho Từ Vựng (${cards.length})`;
  }

  // Initialize Mermaid with Luxury Dark Theme
  if (window.mermaid) {
    window.mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        darkMode: true,
        background: "#0f121a",
        primaryColor: "#1e2333",
        primaryTextColor: "#f0f3f6",
        primaryBorderColor: "#d4af37",
        lineColor: "#61afef",
        secondaryColor: "#161922",
        tertiaryColor: "#191c28",
        fontSize: "13px"
      },
      flowchart: {
        curve: "basis",
        useMaxWidth: true,
        htmlLabels: true
      }
    });
  }

  // ==========================================
  // DRAWER & GROUPED CATALOG LOGIC
  // ==========================================

  function openDrawer() {
    isDrawerOpen = true;
    drawerOverlay.classList.add("active");
    catalogDrawer.classList.add("active");
    catalogDrawer.setAttribute("aria-hidden", "false");
    renderDrawerList(catalogSearch.value.trim());

    // Auto scroll to active item
    setTimeout(() => {
      const activeItem = drawerListContainer.querySelector(".catalog-item.active");
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  }

  function closeDrawer() {
    isDrawerOpen = false;
    drawerOverlay.classList.remove("active");
    catalogDrawer.classList.remove("active");
    catalogDrawer.setAttribute("aria-hidden", "true");
  }

  function renderDrawerList(searchQuery = "") {
    drawerListContainer.innerHTML = "";
    const query = searchQuery.toLowerCase();

    // Group cards by date (or session)
    const grouped = {};
    let matchedCount = 0;

    cards.forEach((card, index) => {
      const matchEn = card.englishTerm.toLowerCase().includes(query);
      const matchHv = card.hanVietTerm.toLowerCase().includes(query);
      const matchHt = (card.hanTu || "").includes(query);
      const matchQuote = (card.quote || "").toLowerCase().includes(query);
      const matchSub = (card.phoneticOrSub || "").toLowerCase().includes(query);

      if (!query || matchEn || matchHv || matchHt || matchQuote || matchSub) {
        matchedCount++;
        const groupKey = card.date || "Chung";
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push({ card, index });
      }
    });

    // Update Drawer Stats
    drawerStats.textContent = `Hiển thị ${matchedCount} / ${cards.length} từ`;

    if (matchedCount === 0) {
      drawerListContainer.innerHTML = `
        <div class="no-results-msg">
          <p>Không tìm thấy từ vựng nào khớp với "<b>${searchQuery}</b>"</p>
        </div>
      `;
      return;
    }

    // Render Groups
    Object.keys(grouped).forEach((dateKey) => {
      const groupData = grouped[dateKey];
      const groupEl = document.createElement("div");
      groupEl.className = "catalog-group";

      const sampleSource = groupData[0].card.source ? ` • ${groupData[0].card.source.split("(")[0].trim()}` : "";
      groupEl.innerHTML = `
        <div class="catalog-group-title">
          <span>📅 ${dateKey}${sampleSource} (${groupData.length} từ)</span>
        </div>
        <div class="catalog-group-items"></div>
      `;

      const itemsContainer = groupEl.querySelector(".catalog-group-items");

      groupData.forEach(({ card, index }) => {
        const itemEl = document.createElement("div");
        itemEl.className = `catalog-item ${index === currentIndex ? "active" : ""}`;
        itemEl.innerHTML = `
          <div class="catalog-item-num">${String(index + 1).padStart(2, "0")}</div>
          <div class="catalog-item-content">
            <span class="catalog-item-en">${card.englishTerm}</span>
            <span class="catalog-item-hv">${card.hanVietTerm} <small style="color:#8c95a6; font-weight:normal;">(${card.hanTu})</small></span>
          </div>
          <div class="catalog-item-active-dot"></div>
        `;

        itemEl.addEventListener("click", () => {
          goToCard(index);
          closeDrawer();
        });

        itemsContainer.appendChild(itemEl);
      });

      drawerListContainer.appendChild(groupEl);
    });
  }

  // Drawer Event Listeners
  btnCatalog.addEventListener("click", openDrawer);
  btnCloseDrawer.addEventListener("click", closeDrawer);
  drawerOverlay.addEventListener("click", closeDrawer);

  catalogSearch.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val) {
      btnClearSearch.classList.add("visible");
    } else {
      btnClearSearch.classList.remove("visible");
    }
    renderDrawerList(val.trim());
  });

  btnClearSearch.addEventListener("click", () => {
    catalogSearch.value = "";
    btnClearSearch.classList.remove("visible");
    catalogSearch.focus();
    renderDrawerList("");
  });

  // ==========================================
  // FLASHCARD RENDERING LOGIC
  // ==========================================

  async function renderCard(index) {
    const card = cards[index];
    if (!card) return;

    // Reset Flip state
    if (isFlipped) {
      cardElement.classList.remove("is-flipped");
      isFlipped = false;
      flipBtnText.textContent = "Lật Giải Mã";
    }

    // Update Counter & Progress
    cardCounter.textContent = `THẺ ${index + 1} / ${cards.length}`;
    progressBar.style.width = `${((index + 1) / cards.length) * 100}%`;

    // Update Buttons State
    btnPrev.disabled = index === 0;
    btnNext.disabled = index === cards.length - 1;

    // Populate Front
    frontEnglish.textContent = card.englishTerm;
    frontSub.textContent = card.phoneticOrSub || "";
    frontQuote.textContent = `"${card.quote}"`;
    frontMechanism.textContent = card.contextMechanism || "";

    // Populate Back
    backHanviet.textContent = card.hanVietTerm;
    backHantu.textContent = card.hanTu;
    synthesisBox.textContent = `⚡ BẢN CHẤT HỢP NHẤT: ${card.unifiedSynthesis}`;
    fieldAppText.textContent = card.fieldApplication;

    // Populate Decompressed Characters
    decompressionContainer.innerHTML = "";
    if (card.decompressedChars && card.decompressedChars.length > 0) {
      card.decompressedChars.forEach((c) => {
        const charDiv = document.createElement("div");
        charDiv.className = "char-card";
        charDiv.innerHTML = `
          <div class="char-header">
            <span class="char-hantu">${c.hanTu}</span>
            <span class="char-title">${c.char}</span>
            <span class="char-soul">${c.soul}</span>
          </div>
          <div class="char-etymology"><b>Chiết tự:</b> ${c.etymology}</div>
          <div class="char-worldview"><b>Thế giới quan:</b> ${c.worldview}</div>
        `;
        decompressionContainer.appendChild(charDiv);
      });
    }

    // Render Mermaid Diagram
    renderMermaidDiagram(card.mermaidCode, index);

    // Update Active state in Drawer if drawer is open or re-opened
    if (isDrawerOpen) {
      renderDrawerList(catalogSearch.value.trim());
    }
  }

  async function renderMermaidDiagram(code, id) {
    mermaidContainer.innerHTML = '<div style="color:#8c95a6; font-size:12px;">Đang vẽ đồ phổ...</div>';
    if (!window.mermaid || !code) {
      mermaidContainer.innerHTML = '<div style="color:#8c95a6;">Sơ đồ chưa sẵn sàng</div>';
      return;
    }

    try {
      const uniqueId = `mermaid-svg-${id}-${Date.now()}`;
      const { svg } = await window.mermaid.render(uniqueId, code);
      mermaidContainer.innerHTML = svg;
    } catch (err) {
      console.warn("Lỗi render Mermaid:", err);
      mermaidContainer.innerHTML = `<pre style="font-size:11px; color:#f0f3f6; text-align:left;">${code}</pre>`;
    }
  }

  function toggleFlip() {
    isFlipped = !isFlipped;
    if (isFlipped) {
      cardElement.classList.add("is-flipped");
      flipBtnText.textContent = "Xem Mặt Trước";
    } else {
      cardElement.classList.remove("is-flipped");
      flipBtnText.textContent = "Lật Giải Mã";
    }
  }

  function goToCard(index) {
    if (index >= 0 && index < cards.length) {
      currentIndex = index;
      renderCard(currentIndex);
    }
  }

  function nextCard() {
    if (currentIndex < cards.length - 1) {
      goToCard(currentIndex + 1);
    }
  }

  function prevCard() {
    if (currentIndex > 0) {
      goToCard(currentIndex - 1);
    }
  }

  // ==========================================
  // NAVIGATION EVENT LISTENERS
  // ==========================================

  btnFlip.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFlip();
  });

  flipBackBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFlip();
  });

  btnNext.addEventListener("click", (e) => {
    e.stopPropagation();
    nextCard();
  });

  btnPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    prevCard();
  });

  // Click on Front Face flips to Back
  document.querySelector(".card-front").addEventListener("click", () => {
    toggleFlip();
  });

  // Desktop Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    // If Drawer is Open
    if (isDrawerOpen) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
      }
      return;
    }

    // Ignore if typing in an input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    if (e.code === "Space") {
      e.preventDefault();
      toggleFlip();
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      nextCard();
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      prevCard();
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      openDrawer();
    }
  });

  // Mobile Touch Gestures (Swipe Left / Right to navigate)
  cardScene.addEventListener("touchstart", (e) => {
    if (isDrawerOpen) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  cardScene.addEventListener("touchend", (e) => {
    if (isDrawerOpen) return;
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 65) {
      if (deltaX < 0) {
        nextCard();
      } else {
        prevCard();
      }
    }
  }, { passive: true });

  // Initial Render
  renderCard(currentIndex);
});
