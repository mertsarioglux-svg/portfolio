# Mert Sarıoğlu — kişisel site

Astro ile yapılmış statik site. Girişteki yaka kartı three.js ve Rapier fizik motoruyla çalışır.

## Çalıştırma

```bash
npm install
npm run dev
```

Site http://localhost:4321 adresinde açılır. Türkçe sayfalar `/` ve `/projeler/<proje>/`, İngilizce sayfalar `/en/` ve `/en/projects/<proje>/` adresinde.

## İçeriği düzenleme

| Ne | Nerede |
|---|---|
| İsim, giriş cümleleri, okul, e-posta, sosyal medya, yaka kartı yazıları, sertifikalar, "Hakkımda" paneli | `src/data/site.ts` |
| Projeler (ana sayfadaki satır + detay sayfası) | `src/content/projects/tr/*.mdx` ve `src/content/projects/en/*.mdx` |
| Proje görselleri | `src/assets/work/<proje>/` (site derlenirken otomatik küçültülüp WebP'ye çevrilir) |
| Hakkımda fotoğrafı | `public/about/` (yolu `src/data/site.ts` içinde güncelle) |
| Buton ve etiket metinleri (iki dilde) | `src/i18n/ui.ts` |
| Renkler, font | `src/styles/global.css` |

### Yeni proje eklemek

1. `src/content/projects/tr/` içine yeni bir `.mdx` dosyası aç (örneğin `yeni-proje.mdx`). En kolayı mevcut bir dosyayı kopyalamak.
2. Aynı adla `src/content/projects/en/` içine İngilizcesini ekle.
3. Görselleri `src/assets/work/yeni-proje/` klasörüne koy ve dosyanın başındaki `hero` ve `previews` yollarını güncelle.
4. `order` alanı ana sayfadaki sırayı belirler.

Detay sayfasında `##` ile başlayan her başlık numaralı bir bölüm olur ve alttaki bölüm listesinde görünür.

## Yayına alma

`npm run build` komutu siteyi `dist/` klasörüne üretir. Vercel veya Netlify bu projeyi otomatik tanır.
Yayına almadan önce `astro.config.mjs` içindeki `site` adresini kendi alan adınla değiştir.
