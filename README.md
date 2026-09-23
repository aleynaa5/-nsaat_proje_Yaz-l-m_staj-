# BuildControl Pro — MS SQL Server Tam Uyumlu VS Code Projesi

Bu proje, MS SQL Server (T-SQL) veritabanınız ve 15 modüllü şantiye yönetim arayüzünüzün tamamen entegre çalıştığı Visual Studio Code projesidir.

---

## 📂 Proje Klasör Yolu
```text
C:\Users\aleyn\.gemini\antigravity\scratch\BuildControlPro-VSCode
```

---

## 🛠️ Proje İçeriği ve Dosya Yapısı

- 📄 **`index.html`**: Orijinal tasarımın 15 yan menü seçeneği, grafikler, Gantt iş programı, beton testleri ve ekipman bakım kartlarıyla eksiksiz halidir.
- ⚙️ **`server.js`**: MS SQL Server (`santiye_yonetim_db`) veritabanına bağlanan Node.js / Express API sunucusudur.
- 🗄️ **`database/schema_mssql.sql`**: Sizin gönderdiğiniz tüm T-SQL `CREATE TABLE` ve `INSERT` kodlarının yer aldığı hazır SQL şemasıdır.
- 🔐 **`.env.example`**: SQL Server bağlantı parametrelerinizi değiştirebileceğiniz ayar dosyasıdır.
- 📦 **`package.json`**: Gerekli tüm bağımlılık listesidir (`express`, `cors`, `mssql`, `sqlite3`).

---

## 🚀 VS Code (Visual Studio Code) İçinde Çalıştırma Adımları

1. **Visual Studio Code'u Açın**.
2. **File (Dosya)** -> **Open Folder (Klasörü Aç)** yolunu izleyin.
3. Klasör yolu olarak şu dizini seçin:
   `C:\Users\aleyn\.gemini\antigravity\scratch\BuildControlPro-VSCode`
4. VS Code içinde entegre terminali açın (`Ctrl + ~`).
5. Bağımlılıkları yüklemek için yazın:
   ```bash
   npm install
   ```
6. Uygulamayı ve Backend'i başlatmak için yazın:
   ```bash
   npm run dev
   ```
7. Tarayıcınızda açın:
   👉 **`http://localhost:5000`**
