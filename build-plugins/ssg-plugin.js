import fs from 'fs/promises';
import path from 'path';

/**
 * Парсинг frontmatter из markdown файлов
 */
function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return {};
  
  const data = {};
  match[1].split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      data[key.trim()] = value;
    }
  });
  
  return data;
}

/**
 * Загрузка JSON локализации
 */
async function loadTranslations(lang) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'locales', `${lang}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
    return null;
  }
}

/**
 * Загрузка отзывов
 */
async function loadReviews() {
  try {
    const reviewsDir = path.join(process.cwd(), 'public', 'reviews');
    const files = await fs.readdir(reviewsDir);
    
    const reviews = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async (file) => {
          const content = await fs.readFile(path.join(reviewsDir, file), 'utf-8');
          return parseFrontmatter(content);
        })
    );

    return reviews
      .filter(r => r.text_ru) // Проверяем что отзыв валидный
      .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));
  } catch (error) {
    console.error('Error loading reviews:', error);
    return [];
  }
}

/**
 * Загрузка галереи
 */
async function loadGallery() {
  try {
    const galleryDir = path.join(process.cwd(), 'public', 'gallery-items');
    const files = await fs.readdir(galleryDir);
    
    const items = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async (file) => {
          const content = await fs.readFile(path.join(galleryDir, file), 'utf-8');
          return parseFrontmatter(content);
        })
    );

    return items
      .filter(i => i.image)
      .sort((a, b) => (parseInt(a.order) || 0) - (parseInt(b.order) || 0));
  } catch (error) {
    console.error('Error loading gallery:', error);
    return [];
  }
}

/**
 * Простой парсер markdown для About секции
 */
function markdownToHtml(markdown) {
  return markdown
    .split('\n\n')
    .map(para => {
      let text = para
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, ' ');
      return `<p>${text}</p>`;
    })
    .join('');
}

/**
 * Генерация HTML для отзывов
 */
function generateReviewsHtml(reviews, lang) {
  const textKey = `text_${lang}`;
  
  return reviews.map(review => {
    const text = review[textKey] || review.text_ru || '';
    return `
      <article class="review-card">
        <p class="review-card__text">${text}</p>
        <button
          class="review-card__btn"
          type="button"
          data-open-proof
          data-proof-src="${review.proofImage || ''}"
          data-proof-alt="${review.proofAlt || 'Скриншот отзыва'}"
        >
          Показать оригинал
        </button>
      </article>
    `;
  }).join('');
}

/**
 * Генерация данных для галереи (для JS)
 */
function generateGalleryData(gallery, lang) {
  const altKey = `alt_${lang}`;
  
  return gallery.map(item => ({
    src: item.image || '',
    alt: item[altKey] || item.alt_ru || ''
  }));
}

/**
 * Инжект данных галереи в HTML
 */
function injectGalleryScript(html, galleryData) {
  const scriptTag = `
    <script id="gallery-data" type="application/json">
      ${JSON.stringify(galleryData)}
    </script>
  `;
  
  // Вставляем перед закрывающим </body>
  return html.replace('</body>', `${scriptTag}</body>`);
}

/**
 * Применение переводов к HTML
 */
function applyTranslationsToHtml(html, t) {
  let result = html;

  // Hero section
  result = result.replace(
    /<h1 class="hero__title">[\s\S]*?<\/h1>/,
    `<h1 class="hero__title">
      ${t.heroTitle} <span>PARTY</span> — <br />
      <small class="hero__subtitle">${t.heroSubtitle}</small>
    </h1>`
  );

  result = result.replace(
    /<p class="hero__lead">.*?<\/p>/,
    `<p class="hero__lead">${t.heroLead}</p>`
  );

  result = result.replace(
    /<a class="hero__button btn" href="#booking">.*?<\/a>/,
    `<a class="hero__button btn" href="#booking">${t.heroButton}</a>`
  );

  // Navigation
  result = result.replace(
    /<a class="nav__link" href="#about">.*?<\/a>/g,
    `<a class="nav__link" href="#about">${t.nav.about}</a>`
  );
  result = result.replace(
    /<a class="nav__link" href="#formats">.*?<\/a>/g,
    `<a class="nav__link" href="#formats">${t.nav.formats}</a>`
  );
  result = result.replace(
    /<a class="nav__link" href="#reviews">.*?<\/a>/g,
    `<a class="nav__link" href="#reviews">${t.nav.reviews}</a>`
  );
  result = result.replace(
    /<a class="nav__link" href="#faq">.*?<\/a>/g,
    `<a class="nav__link" href="#faq">${t.nav.faq}</a>`
  );
  result = result.replace(
    /<a class="nav__link" href="#booking">.*?<\/a>/g,
    `<a class="nav__link" href="#booking">${t.nav.contacts}</a>`
  );

  // Mobile menu - аналогично
  result = result.replace(
    /<a class="menu__link" href="#about">.*?<\/a>/g,
    `<a class="menu__link" href="#about">${t.nav.about}</a>`
  );
  result = result.replace(
    /<a class="menu__link" href="#formats">.*?<\/a>/g,
    `<a class="menu__link" href="#formats">${t.nav.formats}</a>`
  );
  result = result.replace(
    /<a class="menu__link" href="#reviews">.*?<\/a>/g,
    `<a class="menu__link" href="#reviews">${t.nav.reviews}</a>`
  );
  result = result.replace(
    /<a class="menu__link" href="#faq">.*?<\/a>/g,
    `<a class="menu__link" href="#faq">${t.nav.faq}</a>`
  );
  result = result.replace(
    /<a class="menu__link" href="#booking">.*?<\/a>/g,
    `<a class="menu__link" href="#booking">${t.nav.contacts}</a>`
  );

  // About section
  result = result.replace(
    /<p class="about__kicker">.*?<\/p>/,
    `<p class="about__kicker">${t.about.kicker}</p>`
  );
  result = result.replace(
    /<h2 class="about__title">.*?<\/h2>/,
    `<h2 class="about__title">${t.about.title}</h2>`
  );
  result = result.replace(
    /<div class="about__body">([\s\S]*?)<\/div>/,
    `<div class="about__body">
      ${markdownToHtml(t.about.content)}
      <p class="about__note">${t.about.note}</p>
    </div>`
  );

  // Formats section
  result = result.replace(
    /<p class="formats__label">.*?<\/p>/,
    `<p class="formats__label">${t.formats.label}</p>`
  );
  result = result.replace(
    /<h2 class="formats__title">.*?<\/h2>/,
    `<h2 class="formats__title">${t.formats.title}</h2>`
  );

  // Why section
  result = result.replace(
    /<p class="why__label">.*?<\/p>/,
    `<p class="why__label">${t.why.label}</p>`
  );
  result = result.replace(
    /<h2 class="why__title">([\s\S]*?)<\/h2>/,
    `<h2 class="why__title">${t.why.title}</h2>`
  );

  // Reviews section
  result = result.replace(
    /<p class="reviews__label">.*?<\/p>/,
    `<p class="reviews__label">${t.reviewsSection.label}</p>`
  );
  result = result.replace(
    /<h2 class="reviews__title">.*?<\/h2>/,
    `<h2 class="reviews__title">${t.reviewsSection.title}</h2>`
  );

  // FAQ section
  result = result.replace(
    /<p class="faq__label">.*?<\/p>/,
    `<p class="faq__label">${t.faqSection.label}</p>`
  );
  result = result.replace(
    /<h2 class="faq__title">.*?<\/h2>/,
    `<h2 class="faq__title">${t.faqSection.title}</h2>`
  );

  // Gallery section
  result = result.replace(
    /<p class="gallery__label">.*?<\/p>/,
    `<p class="gallery__label">${t.gallery.label}</p>`
  );
  result = result.replace(
    /<h2 class="gallery__title">.*?<\/h2>/,
    `<h2 class="gallery__title">${t.gallery.title}</h2>`
  );

  // Contact section
  result = result.replace(
    /<p class="contact__kicker">.*?<\/p>/,
    `<p class="contact__kicker">${t.contact.kicker}</p>`
  );
  result = result.replace(
    /<h2 class="contact__title">.*?<\/h2>/,
    `<h2 class="contact__title">${t.contact.title}</h2>`
  );
  result = result.replace(
    /<p class="contact__text">[\s\S]*?<\/p>/,
    `<p class="contact__text">${t.contact.text}</p>`
  );
  result = result.replace(
    /<p class="contact__note">.*?<\/p>/,
    `<p class="contact__note">${t.contact.note}</p>`
  );

  // Footer
  result = result.replace(
    /<p class="footer__name">.*?<\/p>/,
    `<p class="footer__name">${t.footer.name}</p>`
  );
  result = result.replace(
    /<p class="footer__meta">.*?<\/p>/,
    `<p class="footer__meta">${t.footer.meta}</p>`
  );

  return result;
}

/**
 * Плагин для генерации статических HTML с контентом из CMS
 */
export function ssgPlugin() {
  return {
    name: 'vite-plugin-ssg',
    
    async transformIndexHtml(html, ctx) {
      // Определяем язык по пути файла
      const lang = ctx.path.includes('/lv/') ? 'lv' 
                 : ctx.path.includes('/en/') ? 'en' 
                 : 'ru';

      console.log(`\n🌍 Generating ${lang.toUpperCase()} version...`);

      // Загружаем данные
      const [translations, reviews, gallery] = await Promise.all([
        loadTranslations(lang),
        loadReviews(),
        loadGallery()
      ]);

      if (!translations) {
        console.warn(`⚠️  No translations found for ${lang}, using original HTML`);
        return html;
      }

      // Применяем переводы
      let result = applyTranslationsToHtml(html, translations);

      // Заменяем отзывы
      const reviewsHtml = generateReviewsHtml(reviews, lang);
      result = result.replace(
        /<div class="reviews__track"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<dialog/,
        `<div class="reviews__track" aria-label="Отзывы">${reviewsHtml}</div>
        </div>

        <dialog`
      );

      // Инжектим данные галереи для JS
      const galleryData = generateGalleryData(gallery, lang);
      result = injectGalleryScript(result, galleryData);

      console.log(`✅ Generated ${lang.toUpperCase()} with ${reviews.length} reviews and ${gallery.length} gallery items`);

      return result;
    }
  };
}
