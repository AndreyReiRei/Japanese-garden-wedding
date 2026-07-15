/**
 * slider.js — Полноэкранный слайдер на Swiper
 * Интегрируется с галереей
 */

let swiperInstance = null;

/**
 * Инициализирует и открывает слайдер.
 * @param {Object} config
 * @param {Array} config.photos - Массив фото [{ src, alt }]
 * @param {number} config.startIndex - Индекс стартового фото
 * @param {string} config.theme - Тема (garden/zags/home)
 */
function openSlider( config ) {
	'use strict';

	const { photos, startIndex = 0, theme = 'garden' } = config;

	// ============================================
	// Если слайдер уже открыт — не дублируем
	// ============================================
	if ( document.querySelector( '.slider-overlay' ) ) {
		return;
	}

	// ============================================
	// Строим HTML слайдера
	// ============================================
	const overlay = document.createElement( 'div' );
	overlay.className = 'slider-overlay';
	overlay.setAttribute( 'data-theme', theme );

	// Слайды
	const slidesHTML = photos.map( photo => `
        <div class="swiper-slide">
            <div class="image-wrapper">
                <img src="${photo.src}" alt="${photo.alt || ''}" data-swiper-parallax-x="30%" loading="lazy">
            </div>
            ${photo.alt ? `<p class="slide-caption">${photo.alt}</p>` : ''}
        </div>
    `).join( '' );

	overlay.innerHTML = `
        <button class="slider-close" id="sliderClose" aria-label="Закрыть">✕</button>
        
        <div class="slider-container">
            <div class="swiper">
                <div class="swiper-wrapper">
                    ${slidesHTML}
                </div>
                
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
        </div>
        
        <span class="slider-counter" id="sliderCounter">
            ${startIndex + 1} / ${photos.length}
        </span>
    `;

	document.body.appendChild( overlay );

	// ============================================
	// Запускаем анимацию появления
	// ============================================
	requestAnimationFrame( () => {
		overlay.classList.add( 'open' );
	} );

	// ============================================
	// Инициализируем Swiper
	// ============================================
	swiperInstance = new Swiper( overlay.querySelector( '.swiper' ), {
		grabCursor: true,
		slidesPerView: 1.5,
		centeredSlides: true,
		initialSlide: startIndex,
		speed: 900,
		parallax: true,
		spaceBetween: 40,

		// Навигация
		navigation: {
			nextEl: overlay.querySelector( '.swiper-button-next' ),
			prevEl: overlay.querySelector( '.swiper-button-prev' ),
		},

		// Пагинация
		pagination: {
			el: overlay.querySelector( '.swiper-pagination' ),
			clickable: true,
		},

		// Колёсико мыши
		mousewheel: {
			thresholdDelta: 50,
			sensitivity: 1,
		},

		// Клавиатура
		keyboard: {
			enabled: true,
			onlyInViewport: true,
		},

		// Адаптивность
		breakpoints: {
			320: { slidesPerView: 1.1, spaceBetween: 16 },
			481: { slidesPerView: 1.2, spaceBetween: 24 },
			769: { slidesPerView: 1.4, spaceBetween: 32 },
			993: { slidesPerView: 1.5, spaceBetween: 40 },
		},

		// События
		on: {
			slideChange: function () {
				updateCounter( this.activeIndex, photos.length );
			},
		},
	} );

	// ============================================
	// Обновление счётчика
	// ============================================
	function updateCounter( index, total ) {
		const counter = document.getElementById( 'sliderCounter' );
		if ( counter ) {
			counter.textContent = `${index + 1} / ${total}`;
		}
	}

	// ============================================
	// Закрытие слайдера
	// ============================================
	function closeSlider() {
		overlay.classList.remove( 'open' );

		// Ждём окончания анимации, затем удаляем
		setTimeout( () => {
			if ( swiperInstance ) {
				swiperInstance.destroy( true, true );
				swiperInstance = null;
			}
			overlay.remove();
			document.body.style.overflow = '';
		}, 400 );

		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 8 );
		}
	}

	// Кнопка закрытия
	const closeBtn = overlay.querySelector( '#sliderClose' );
	closeBtn.addEventListener( 'click', closeSlider );

	// Клик по фону (мимо слайда)
	overlay.addEventListener( 'click', function ( e ) {
		if ( e.target === overlay || e.target.classList.contains( 'slider-container' ) ) {
			closeSlider();
		}
	} );

	// Escape
	function handleEscape( e ) {
		if ( e.key === 'Escape' ) {
			closeSlider();
			document.removeEventListener( 'keydown', handleEscape );
		}
	}
	document.addEventListener( 'keydown', handleEscape );

	// Блокируем скролл body
	document.body.style.overflow = 'hidden';

	// Тактильный отклик
	if ( window.navigator?.vibrate ) {
		window.navigator.vibrate( 10 );
	}

	console.log( `📸 Слайдер открыт: фото ${startIndex + 1} из ${photos.length}` );
}