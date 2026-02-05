import './scss/main.scss';
import Swiper from 'swiper';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

const headerEl = document.querySelector('.header');

// ==================== HELPERS ====================
const lockBody = (lock) => {
  document.body.classList.toggle('body--locked', lock);
};

// ==================== HEADER ====================
window.addEventListener('scroll', () => {
  if (!headerEl) return;
  headerEl.classList.toggle('header--scrolled', window.scrollY > 30);
});

// ==================== BURGER MENU ====================
const burger = document.querySelector('.burger');
const menu = document.querySelector('.menu');

if (burger && menu) {
  const OPEN_BURGER = 'burger--open';
  const OPEN_MENU = 'menu--open';

  const setMenuOpen = (open) => {
    burger.classList.toggle(OPEN_BURGER, open);
    menu.classList.toggle(OPEN_MENU, open);

    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');

    lockBody(open);
  };

  burger.addEventListener('click', () => {
    setMenuOpen(!menu.classList.contains(OPEN_MENU));
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('[data-menu-close]')) {
      setMenuOpen(false);
      return;
    }

    const link = e.target.closest('a[href^="#"]');
    if (link) setMenuOpen(false);
  });
}

// ==================== ACCORDION ====================
const detailsList = Array.from(document.querySelectorAll('.acc-trigger'));

detailsList.forEach((detail) => {
  detail.addEventListener('click', () => {
    detailsList.forEach((d) => {
      if (d !== detail) {
        d.removeAttribute('open');
      }
    });
  });
});

// Клик по "Подробнее"
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-acc]');
  if (!link) return;

  const id = link.dataset.acc;
  if (!id) return;

  const target = document.getElementById(id);
  if (!target || target.tagName !== 'DETAILS') return;

  detailsList.forEach((d) => {
    d.removeAttribute('open');
  });

  target.setAttribute('open', true);
});

// ==================== PROOF DIALOG ====================
const proofDialog = document.querySelector('#proof');
const proofImg = proofDialog?.querySelector('.proof__img');
const proofClose = proofDialog?.querySelector('[data-proof-close]');

const canUseDialog =
  typeof HTMLDialogElement !== 'undefined' &&
  typeof proofDialog?.showModal === 'function';

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open-proof]');
  if (!btn) return;

  const src = btn.dataset.proofSrc;
  const alt = btn.dataset.proofAlt || 'Оригинал отзыва';
  if (!src) return;

  if (!canUseDialog) {
    window.open(src, '_blank', 'noopener,noreferrer');
    return;
  }

  if (proofImg) {
    proofImg.src = src;
    proofImg.alt = alt;
  }

  proofDialog.showModal();
});

proofClose?.addEventListener('click', () => {
  proofDialog?.close();
});

proofDialog?.addEventListener('close', () => {
  if (!proofImg) return;
  proofImg.src = '';
  proofImg.alt = '';
});

// ==================== FOOTER YEAR ====================
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ==================== ГАЛЕРЕЯ (SWIPER) ====================
const initGallerySwiper = () => {
  const swiperEl = document.querySelector('.gallery__swiper');
  if (!swiperEl) return;

  // Загружаем данные из инжектнутого скрипта
  const dataScript = document.getElementById('gallery-data');
  let galleryImages = [];
  
  if (dataScript) {
    try {
      galleryImages = JSON.parse(dataScript.textContent);
    } catch (e) {
      console.error('Error parsing gallery data:', e);
    }
  }

  // Fallback на дефолтные изображения если данных нет
  if (galleryImages.length === 0) {
    galleryImages = [
      { src: '/gallery/1.jpg', alt: 'Let\'s Party — мероприятие' },
      { src: '/gallery/2.jpg', alt: 'Let\'s Party — атмосфера' },
      { src: '/gallery/3.jpg', alt: 'Let\'s Party — эмоции гостей' },
      { src: '/gallery/4.jpg', alt: 'Let\'s Party — ведущие' },
    ];
  }

  // Монтируем слайды
  const wrapper = swiperEl.querySelector('.swiper-wrapper');
  if (wrapper) {
    wrapper.innerHTML = galleryImages
      .map(
        (img) => `
          <div class="swiper-slide gallery__slide">
            <img
              class="gallery__img"
              src="${img.src}"
              alt="${img.alt}"
              loading="lazy"
              decoding="async"
            />
          </div>
        `
      )
      .join('');
  }

  // Инициализируем Swiper
  new Swiper('.gallery__swiper', {
    modules: [Navigation, Pagination, Keyboard],
    slidesPerView: 1,
    spaceBetween: 12,
    speed: 350,
    loop: galleryImages.length > 3,
    grabCursor: true,
    keyboard: { enabled: true },

    navigation: {
      prevEl: '.gallery__nav--prev',
      nextEl: '.gallery__nav--next',
    },

    pagination: {
      el: '.gallery__pagination',
      clickable: true,
    },

    breakpoints: {
      768: { slidesPerView: 1, spaceBetween: 16 },
      1200: { slidesPerView: 1, spaceBetween: 18 },
    },
  });
};

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
initGallerySwiper();
