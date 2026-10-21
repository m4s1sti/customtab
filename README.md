<div align="center">

# CustomTab

![Manifest V3](https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge&logo=googlechrome)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge&logo=javascript)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

Google Chrome için geliştirilmiş; varsayılan yeni sekme sayfasını tamamen kişiselleştirilebilir, minimalist bir bağlantı panosuna dönüştüren eklentidir. Linklerinizi sütunlar halinde organize edebilir, sürükle bırak yöntemiyle sıralayabilir ve kendi temiz çalışma alanınızı oluşturabilirsiniz.

</div>

---

##  Özellikler

- **4 Sütunlu Bağlantı Panosu:** Linklerinizi kategorize ederek düzenli bir şekilde saklayın.
- **Sürükle-Bırak (Drag & Drop):** Eklediğiniz link kartlarını sütunlar arasında veya sütun içinde özgürce taşıyın.
- **Kişiselleştirilebilir Arka Plan:** Bilgisayarınızdan istediğiniz görseli yükleyerek duvar kağıdını anlık olarak değiştirin.
- **Minimalist Canlı Saat:** Odaklanmayı artırmak için sadeleştirilmiş dijital saat ekranı.
- **Yayıncı Modu (Streamer Mode):** Ekran paylaşırken veya video kaydederken gizliliğinizi korumak için tek tıkla link detaylarını bulanıklaştırma.
- **TXT Yedekleme (Import/Export):** Tüm bağlantılarınızı ve ayarlarınızı Not Defteri (`.txt`) formatında dışa aktarın ve geri yükleyin.
- **Hızlı Kopyalama:** Paneldeki tüm linkleri tek tıkla panoya kopyalayın.

---


![CustomTab Ekran Görüntüsü](ornek.png)

---

##  Kurulum

Eklentiyi Chrome tarayıcınıza kurmak için aşağıdaki adımları takip edin:

1. Bu projeyi bilgisayarınıza indirin (`Code > Download ZIP`) ve bir klasöre çıkartın.
2. Google Chrome'u açın ve adres çubuğuna `chrome://extensions/` yazarak **Uzantılar** sayfasını açın.
3. Sayfanın sağ üst köşesinde bulunan **"Geliştirici Modu" (Developer Mode)** anahtarını aktif hale getirin.
4. Sol üstte beliren **"Paketlenmemiş öğe yükle"** butonuna tıklayın.
5. Bilgisayarınıza çıkardığınız eklenti klasörünü seçin.
6. Artık yeni bir sekme açtığınızda özel panonuz sizi karşılayacaktır.

---

##  Kullanılan Teknolojiler

- **HTML5 & CSS3:** Flexbox, CSS Grid ve Glassmorphism arayüz tasarımı.
- **Pure JavaScript (Vanilla JS):** DOM manipülasyonu, Drag and Drop API.
- **Chrome Extension API (Manifest V3):** `chrome.storage.local` ile yerel veri yönetimi ve `chrome_url_overrides`.
