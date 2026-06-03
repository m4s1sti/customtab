document.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.getElementById("wallpaper-btn");
  const bgUploader = document.getElementById("bg-uploader");
  const linkModal = document.getElementById("link-modal");
  const closeModal = document.getElementById("close-modal");
  const saveLink = document.getElementById("save-link");
  const boardGrid = document.getElementById("board-grid");
  const modalTitle = linkModal.querySelector("h3");

  // Saat & Hava Durumu Elementleri
  const clockElement = document.getElementById("digital-clock");
  const greetingElement = document.getElementById("greeting-text");
  const weatherElement = document.getElementById("weather-info");

  // Menü ve Buton Tanımlamaları
  const menuToggleBtn = document.getElementById("menu-toggle-btn");
  const controlsContainer = document.getElementById("controls-container");
  const copyLinksBtn = document.getElementById("copy-links-btn");
  const streamerModeBtn = document.getElementById("streamer-mode-btn"); 
  const toastNotification = document.getElementById("toast-notification");

  // Import & Export Butonları
  const importBtn = document.getElementById("import-btn");
  const exportBtn = document.getElementById("export-btn");

  let activeTargetColumn = null;
  let editingCardInfo = null; 

  const defaultColumnsData = [[], [], [], []];
  let columnsData = defaultColumnsData;

  // ==========================================================================
  // ZAMAN VE SELAMLAMA FONKSİYONU
  // ==========================================================================
  function updateClockAndGreeting() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;

    clockElement.innerText = `${hours}:${minutes}`;

    const currentHour = now.getHours();
    let greeting = "Merhaba";

    if (currentHour >= 5 && currentHour < 12) {
      greeting = "Günaydın";
    } else if (currentHour >= 12 && currentHour < 17) {
      greeting = "Tünaydın, iyi günler";
    } else if (currentHour >= 17 && currentHour < 22) {
      greeting = "İyi akşamlar";
    } else {
      greeting = "İyi geceler";
    }

    greetingElement.innerText = greeting;
  }

  updateClockAndGreeting();
  setInterval(updateClockAndGreeting, 1000);

  // ==========================================================================
  // API ANAHTARSIZ HAVA DURUMU SİSTEMİ
  // ==========================================================================
  function fetchLiveWeather() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

          fetch(url)
            .then(res => res.json())
            .then(data => {
              if (data && data.current_weather) {
                const temp = Math.round(data.current_weather.temperature);
                const code = data.current_weather.weathercode;
                
                let condition = "Açık";
                if (code >= 1 && code <= 3) condition = "Parçalı Bulutlu";
                else if (code >= 45 && code <= 48) condition = "Sisli";
                else if (code >= 51 && code <= 67) condition = "Yağmurlu";
                else if (code >= 71 && code <= 77) condition = "Karlı";
                else if (code >= 80 && code <= 82) condition = "Sağanak Yağışlı";
                else if (code >= 95) condition = "Fırtınalı";

                weatherElement.innerText = `Konumunuz: ${temp}°C | ${condition}`;
              } else {
                weatherElement.innerText = `Hava durumu alınamadı`;
              }
            })
            .catch(() => {
              weatherElement.innerText = `Bağlantı hatası`;
            });
        },
        () => {
          fetch("https://wttr.in/?format=%l:+%t+%C")
            .then(res => res.text())
            .then(text => {
              if (text && !text.includes("Unknown")) {
                weatherElement.innerText = text.trim();
              } else {
                weatherElement.innerText = `Hava durumu için konum izni verin`;
              }
            })
            .catch(() => {
              weatherElement.innerText = `Hava durumu yüklenemedi`;
            });
        }
      );
    } else {
      weatherElement.innerText = "Konum servisi desteklenmiyor";
    }
  }

  fetchLiveWeather();

  // ==========================================================================
  // HAFIZA VE RENDER İŞLEMLERİ
  // ==========================================================================
  chrome.storage.local.get(["customColumnsLinksData", "customBackground", "isStreamerModeActive"], (result) => {
    if (result.customColumnsLinksData) {
      columnsData = result.customColumnsLinksData;
    } else {
      chrome.storage.local.set({ customColumnsLinksData: defaultColumnsData });
    }

    if (result.customBackground) {
      document.body.style.backgroundImage = `url('${result.customBackground}')`;
    }

    if (result.isStreamerModeActive) {
      document.body.classList.add("streamer-mode-active");
      streamerModeBtn.classList.add("active-mode");
    }
    
    renderLinks();
  });

  menuToggleBtn.addEventListener("click", (e) => {
    e.stopPropagation(); 
    controlsContainer.classList.toggle("open-menu");
  });

  document.addEventListener("click", () => {
    if (controlsContainer) {
      controlsContainer.classList.remove("open-menu");
    }
  });

  streamerModeBtn.addEventListener("click", (e) => {
    e.stopPropagation(); 
    const isNowActive = document.body.classList.toggle("streamer-mode-active");
    streamerModeBtn.classList.toggle("active-mode", isNowActive);
    chrome.storage.local.set({ isStreamerModeActive: isNowActive });

    if (isNowActive) {
      showToast("Yayıncı Modu Aktif");
    } else {
      showToast("Yayıncı Modu Kapatıldı");
    }
  });

  copyLinksBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    let textToCopy = "";
    let hasLinks = false;
    
    columnsData.forEach((columnLinks) => {
      columnLinks.forEach(link => {
        hasLinks = true;
        textToCopy += `${link.url}\n`;
      });
    });

    if (!hasLinks) {
      showToast("Kopyalanacak link bulunamadı! Önce link ekleyin.");
      return;
    }

    navigator.clipboard.writeText(textToCopy.trim()).then(() => {
      showToast("Tüm linkler başarıyla kopyalandı! 📋");
    }).catch(err => {
      console.error("Kopyalama başarısız: ", err);
    });
  });

  // ==========================================================================
  // EXPORT (VERİLERİ TXT OLARAK DIŞA AKTAR) İŞLEVİ
  // ==========================================================================
  if (exportBtn) {
    exportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      
      chrome.storage.local.get(["customColumnsLinksData", "customBackground", "isStreamerModeActive"], (result) => {
        const currentData = result.customColumnsLinksData || defaultColumnsData;
        
        // En üstte insanların elle düzenlerken anlayabileceği kılavuz belirteç satırı
        let txtContent = "=== EKLENTI LINK YEDEGI ===\n";
        txtContent += "FORMAT -> ISIM: LİNK (Alt satırları bu formata göre elinizle düzenleyebilirsiniz)\n";
        txtContent += "==================================================================\n\n";

        // Her sütunu ve içindeki kartları alt alta sıralı yazıyoruz
        currentData.forEach((columnLinks, colIndex) => {
          txtContent += `[SUTUN ${colIndex + 1}]\n`;
          if (columnLinks.length === 0) {
            txtContent += "(Bu sütun boş)\n";
          }
          columnLinks.forEach(link => {
            txtContent += `${link.name}: ${link.url}\n`;
          });
          txtContent += "\n";
        });

        // Arka plan resmi ve yayıncı modu ayarını bozmamak için en alta tek satır sistem config ekliyoruz
        txtContent += "=== SISTEM AYARLARI (BURAYI DEGISTIRMEYIN) ===\n";
        const configLine = {
          bg: result.customBackground || "",
          streamer: result.isStreamerModeActive || false
        };
        txtContent += JSON.stringify(configLine);

        // .txt dosyası üretme ve indirme tetikleme
        const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", url);
        downloadAnchor.setAttribute("download", "linklerim_yedek.txt");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(url);
        
        showToast("TXT yedek dosyası indirildi! 📥");
      });
    });
  }

  // ==========================================================================
  // IMPORT (TXT DOSYASINDAN VERİ YÜKLE) İŞLEVİ
  // ==========================================================================
  if (importBtn) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".txt";

    importBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const lines = event.target.result.split("\n");
          const newColumnsData = [[], [], [], []];
          let currentColIndex = 0;
          let systemConfig = { bg: "", streamer: false };

          lines.forEach(line => {
            const trimmed = line.trim();
            
            // Sütun tespit başlığı kontrolü
            if (trimmed.startsWith("[SUTUN")) {
              const match = trimmed.match(/\[SUTUN (\d+)\]/);
              if (match) {
                currentColIndex = parseInt(match[1]) - 1;
              }
              return;
            }

            // Sistem ayar satırını yakalama
            if (trimmed.startsWith('{"bg":')) {
              try {
                systemConfig = JSON.parse(trimmed);
              } catch (e) {}
              return;
            }

            // Atlanacak dekoratif veya boş satırlar
            if (!trimmed || trimmed.startsWith("==") || trimmed.startsWith("FORMAT") || trimmed.startsWith("(Bu sütun")) {
              return;
            }

            // İSİM: LİNK yapısını ayırma
            const separatorIndex = trimmed.indexOf(":");
            if (separatorIndex !== -1) {
              const name = trimmed.substring(0, separatorIndex).trim();
              let url = trimmed.substring(separatorIndex + 1).trim();

              if (name && url) {
                if (!/^https?:\/\//i.test(url)) {
                  url = 'https://' + url;
                }
                if (currentColIndex >= 0 && currentColIndex < 4) {
                  newColumnsData[currentColIndex].push({ name: name, url: url });
                }
              }
            }
          });

          // Chrome belleğe yazma ve sayfayı tazeleme
          chrome.storage.local.set({
            customColumnsLinksData: newColumnsData,
            customBackground: systemConfig.bg,
            isStreamerModeActive: systemConfig.streamer
          }, () => {
            showToast("TXT verileri başarıyla yüklendi! 🔄");
            setTimeout(() => {
              window.location.reload();
            }, 1200);
          });

        } catch (error) {
          alert("Hata: TXT dosyası işlenirken bir sorun oluştu. Dosya yapısı bozulmuş olabilir.");
        }
      };
      reader.readAsText(file);
      fileInput.value = ""; 
    });
  }

  // ==========================================================================
  // TOAST BİLDİRİM FONKSİYONU
  // ==========================================================================
  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.innerText = message;
    toastNotification.classList.add("toast-show");
    setTimeout(() => {
      toastNotification.classList.remove("toast-show");
    }, 2500);
  }

  // ==========================================================================
  // KARTLARI/LİNKLERİ EKRANA BASMA (RENDER) FONKSİYONU
  // ==========================================================================
  function renderLinks() {
    boardGrid.innerHTML = "";
    columnsData.forEach((columnLinks, colIndex) => {
      const columnDOM = document.createElement("div");
      columnDOM.classList.add("grid-column");
      columnDOM.setAttribute("data-col-index", colIndex);
      initColumnDragEvents(columnDOM);

      columnLinks.forEach((link, cardIndex) => {
        const wrapper = document.createElement("div");
        wrapper.classList.add("grid-card-wrapper");
        wrapper.setAttribute("draggable", "true");
        wrapper.setAttribute("data-card-index", cardIndex);
        
        wrapper.innerHTML = `
          <a href="${link.url}" class="grid-card">
            <div class="card-label">${link.name}</div>
            <div class="card-main">
              <img src="https://www.google.com/s2/favicons?sz=32&domain=${link.url}" alt="">
              <span>${link.name}</span>
            </div>
          </a>
          <div class="card-actions-container">
            <button class="action-card-btn edit-btn" title="Düzenle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="action-card-btn delete-btn" title="Sil">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        `;
        
        wrapper.addEventListener("dragstart", (e) => {
          wrapper.classList.add("dragging");
          e.dataTransfer.setData("text/plain", `${colIndex},${cardIndex}`);
        });

        wrapper.addEventListener("dragend", () => {
          wrapper.classList.remove("dragging");
          document.querySelectorAll(".grid-column").forEach(c => c.classList.remove("drag-over-column"));
        });

        const editBtn = wrapper.querySelector(".edit-btn");
        editBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          editingCardInfo = { col: colIndex, card: cardIndex };
          modalTitle.innerText = "Linki Düzenle";
          saveLink.innerText = "Değişiklikleri Kaydet";
          document.getElementById("site-name").value = link.name;
          document.getElementById("site-url").value = link.url;
          linkModal.classList.add("open");
          document.getElementById("site-name").focus();
        });

        const deleteBtn = wrapper.querySelector(".delete-btn");
        deleteBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          deleteLink(colIndex, cardIndex);
        });

        columnDOM.appendChild(wrapper);
      });

      const addCardBtn = document.createElement("button");
      addCardBtn.classList.add("column-add-card-btn");
      addCardBtn.innerText = "+";
      addCardBtn.addEventListener("dragover", (e) => e.stopPropagation());
      addCardBtn.addEventListener("click", () => {
        activeTargetColumn = colIndex;
        editingCardInfo = null; 
        modalTitle.innerText = "Yeni Link Ekle";
        saveLink.innerText = "Ekle";
        linkModal.classList.add("open");
        document.getElementById("site-name").focus();
      });

      columnDOM.appendChild(addCardBtn);
      boardGrid.appendChild(columnDOM);
    });
  }

  // ==========================================================================
  // SÜRÜKLE BIRAK OLAYLARI
  // ==========================================================================
  function initColumnDragEvents(column) {
    column.addEventListener("dragover", (e) => {
      e.preventDefault();
      column.classList.add("drag-over-column");
      const draggingCard = document.querySelector(".dragging");
      const afterElement = getDragAfterElement(column, e.clientY);
      if (afterElement == null) {
        const addBtn = column.querySelector(".column-add-card-btn");
        column.insertBefore(draggingCard, addBtn);
      } else {
        column.insertBefore(draggingCard, afterElement);
      }
    });

    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over-column");
    });

    column.addEventListener("drop", (e) => {
      e.preventDefault();
      column.classList.remove("drag-over-column");
      const dataSource = e.dataTransfer.getData("text/plain");
      if (!dataSource) return;

      const [sourceCol, sourceCard] = dataSource.split(",").map(Number);
      const targetCol = parseInt(column.getAttribute("data-col-index"));
      const cardData = columnsData[sourceCol][sourceCard];
      columnsData[sourceCol].splice(sourceCard, 1);

      const childWrappers = [...column.querySelectorAll(".grid-card-wrapper")];
      const draggingCard = document.querySelector(".dragging");
      const targetCardIndex = childWrappers.indexOf(draggingCard);

      if (targetCardIndex === -1) {
        columnsData[targetCol].push(cardData);
      } else {
        columnsData[targetCol].splice(targetCardIndex, 0, cardData);
      }

      chrome.storage.local.set({ customColumnsLinksData: columnsData });
      renderLinks();
    });
  }

  function getDragAfterElement(column, y) {
    const draggableElements = [...column.querySelectorAll(".grid-card-wrapper:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function deleteLink(colIndex, cardIndex) {
    columnsData[colIndex].splice(cardIndex, 1);
    chrome.storage.local.set({ customColumnsLinksData: columnsData });
    renderLinks();
  }

  // ==========================================================================
  // DUVAR KAĞIDI SEÇİMİ
  // ==========================================================================
  if (settingsBtn && bgUploader) {
    settingsBtn.addEventListener("click", () => bgUploader.click());
    bgUploader.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const base64Image = event.target.result;
          document.body.style.backgroundImage = `url('${base64Image}')`;
          chrome.storage.local.set({ customBackground: base64Image });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // ==========================================================================
  // MODAL KAPATMA VE KAYDETME
  // ==========================================================================
  closeModal.addEventListener("click", () => {
    linkModal.classList.remove("open");
    document.getElementById("site-name").value = "";
    document.getElementById("site-url").value = "";
    activeTargetColumn = null;
    editingCardInfo = null;
  });

  saveLink.addEventListener("click", () => {
    let nameInput = document.getElementById("site-name").value.trim();
    let urlInput = document.getElementById("site-url").value.trim();

    if (!urlInput) {
      alert("Lütfen URL alanını doldurun!");
      return;
    }

    if (!nameInput) {
      nameInput = "Tablo";
    }

    if (!/^https?:\/\//i.test(urlInput)) {
      urlInput = 'https://' + urlInput;
    }

    if (editingCardInfo !== null) {
      const { col, card } = editingCardInfo;
      columnsData[col][card] = { name: nameInput, url: urlInput };
    } else {
      if (activeTargetColumn !== null && activeTargetColumn >= 0 && activeTargetColumn < 4) {
        columnsData[activeTargetColumn].push({ name: nameInput, url: urlInput });
      } else {
        columnsData[0].push({ name: nameInput, url: urlInput });
      }
    }

    if (controlsContainer) {
      controlsContainer.classList.remove("open-menu");
    }

    chrome.storage.local.set({ customColumnsLinksData: columnsData });
    renderLinks();
    closeModal.click();
  });
});