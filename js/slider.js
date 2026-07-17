/**
 * ============================================================
 * slider.js — Полноэкранный слайдер на Swiper
 * ============================================================
 * 
 * ВОЗМОЖНОСТИ:
 *   - Перелистывание (свайп, стрелки, колёсико, клавиатура)
 *   - Все фото видны целиком (object-fit: contain)
 *   - Ч/б → цвет при активации слайда
 *   - Встроенный зум Swiper (двойной тап / пинч / перетаскивание)
 *   - Кнопки +/− для зума
 *   - Автоматическая блокировка перелистывания при зуме
 * 
 * ИСПОЛЬЗОВАНИЕ:
 *   openSlider({
 *       photos: [{ src: '...', alt: '...' }, ...],
 *       startIndex: 0,
 *       theme: 'garden'
 *   });
 * 
 * ЗАВИСИМОСТИ:
 *   - Swiper 11 (CDN: swiper-bundle.min.js)
 *   - slider.css
 * ============================================================
 */

let swiperInstance = null;

function openSlider( config ) {
	'use strict';

	const { photos, startIndex = 0, theme = 'garden' } = config;

	// ============================================================
	// 1. ЗАЩИТА ОТ ДУБЛИРОВАНИЯ
	// ============================================================
	if ( document.querySelector( '.slider-overlay' ) ) return;
	if ( !photos || !photos.length ) return;

	// ============================================================
	// 2. ПОСТРОЕНИЕ HTML
	// ============================================================
	const overlay = document.createElement( 'div' );
	overlay.className = 'slider-overlay';
	overlay.setAttribute( 'data-theme', theme );

	const slidesHTML = photos.map( ( photo, i ) => `
        <div class="swiper-slide">
            <div class="swiper-zoom-container">
                <img 
                    src="${photo.src}" 
                    alt="${photo.alt || ''}" 
                    data-index="${i}"
                    loading="lazy"
                    draggable="false"
                >
            </div>
            ${photo.alt ? `<p class="slide-caption">${photo.alt}</p>` : ''}
        </div>
    ` ).join( '' );

	overlay.innerHTML = `
        <button class="slider-close" id="sliderClose" aria-label="Закрыть">✕</button>
        <div class="slider-container">
            <div class="swiper">
                <div class="swiper-wrapper">${slidesHTML}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
        </div>
        <span class="slider-counter" id="sliderCounter">${startIndex + 1} / ${photos.length}</span>
        <div class="slider-zoom-controls" id="sliderZoomControls">
            <button class="zoom-btn zoom-out" id="zoomOut" aria-label="Уменьшить">−</button>
            <span class="zoom-level" id="zoomLevel">1×</span>
            <button class="zoom-btn zoom-in" id="zoomIn" aria-label="Увеличить">+</button>
        </div>
        <span class="slider-zoom-hint" id="sliderZoomHint">Двойной тап — увеличить</span>
    `;

	document.body.appendChild( overlay );
	document.body.style.overflow = 'hidden';

	// ============================================================
	// 3. АНИМАЦИЯ ПОЯВЛЕНИЯ
	// ============================================================
	requestAnimationFrame( () => overlay.classList.add( 'open' ) );

	// ============================================================
	// 4. ИНИЦИАЛИЗАЦИЯ SWIPER
	// ============================================================
	const swiperEl = overlay.querySelector( '.swiper' );

	// Скрываем до готовности
	swiperEl.style.visibility = 'hidden';
	swiperEl.style.opacity = '0';
	swiperEl.style.transition = 'opacity 0.3s ease';

	swiperInstance = new Swiper( swiperEl, {
		grabCursor: true,
		slidesPerView: 1.5,
		centeredSlides: true,
		initialSlide: startIndex,
		speed: 900,
		spaceBetween: 40,
		watchSlidesProgress: true,

		// Встроенный зум Swiper
		zoom: {
			enabled: true,
			maxRatio: 4,
			minRatio: 1,
			toggle: false,
			containerClass: 'swiper-zoom-container',
			zoomedSlideClass: 'swiper-slide-zoomed',
		},

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
			320: { slidesPerView: 1.1, spaceBetween: 12 },
			481: { slidesPerView: 1.2, spaceBetween: 20 },
			769: { slidesPerView: 1.4, spaceBetween: 30 },
			993: { slidesPerView: 1.5, spaceBetween: 40 },
		},

		// События
		on: {
			slideChange: function () {
				updateCounter( this.activeIndex, photos.length );
				updateZoomUI();
			},
			zoomChange: function ( swiper, scale ) {
				updateZoomUI( scale );
			},
		},
	} );

	// ============================================================
	// 5. ЦЕНТРИРОВАНИЕ ПРИ ПЕРВОМ ЗАПУСКЕ
	// ============================================================
	function refreshSwiper() {
		if ( !swiperInstance || swiperInstance.destroyed ) return;
		swiperInstance.updateSize();
		swiperInstance.updateSlides();
		swiperInstance.update();
		swiperInstance.slideTo( startIndex, 0 );
	}

	function showSwiper() {
		if ( !swiperEl ) return;
		swiperEl.style.visibility = 'visible';
		swiperEl.style.opacity = '1';
	}

	const allSliderImages = overlay.querySelectorAll( 'img[data-index]' );
	const totalImages = allSliderImages.length;
	let loadedCount = 0;
	let isReady = false;

	function onImageReady() {
		loadedCount++;
		if ( loadedCount >= totalImages && !isReady ) {
			isReady = true;
			requestAnimationFrame( () => {
				refreshSwiper();
				requestAnimationFrame( () => {
					refreshSwiper();
					requestAnimationFrame( () => {
						refreshSwiper();
						showSwiper();
					} );
				} );
			} );
		}
	}

	allSliderImages.forEach( img => {
		if ( img.complete && img.naturalWidth > 0 ) {
			onImageReady();
		} else {
			img.addEventListener( 'load', onImageReady, { once: true } );
			img.addEventListener( 'error', onImageReady, { once: true } );
		}
	} );

	setTimeout( () => {
		if ( !isReady ) {
			isReady = true;
			refreshSwiper();
			showSwiper();
		}
	}, 1500 );

	// ============================================================
	// 6. СЧЁТЧИК
	// ============================================================
	function updateCounter( index, total ) {
		const counter = document.getElementById( 'sliderCounter' );
		if ( counter ) {
			counter.textContent = `${index + 1} / ${total || photos.length}`;
		}
	}

	// ============================================================
	// 7. ЗУМ — ДВОЙНОЙ ТАП И КНОПКИ +/−
	// ============================================================

	/**
	 * Ступени зума: 1× → 2× → 4× → 1×
	 */
	const ZOOM_STEPS = [1, 2, 4, 8];

	/**
	 * Вычисляет следующий масштаб по кругу.
	 * 1 → 2 → 4 → 1 → ...
	 */
	function getNextZoomStep( currentScale ) {
		// Находим текущую ступень или ближайшую
		let currentStep = 1;
		for ( let i = ZOOM_STEPS.length - 1; i >= 0; i-- ) {
			if ( currentScale >= ZOOM_STEPS[i] - 0.1 ) {
				currentStep = ZOOM_STEPS[i];
				break;
			}
		}

		// Находим индекс текущей ступени
		const currentIndex = ZOOM_STEPS.indexOf( currentStep );

		// Следующая ступень (по кругу)
		const nextIndex = ( currentIndex + 1 ) % ZOOM_STEPS.length;

		return ZOOM_STEPS[nextIndex];
	}

	/**
	 * Двойной тап — переключение зума по ступеням.
	 * Swiper сам определяет двойной тап через doubleTapClick.
	 */
	swiperInstance.on( 'doubleTap', function ( swiper, event ) {
		const currentScale = swiper.zoom.scale || 1;
		const nextScale = getNextZoomStep( currentScale );

		if ( nextScale <= 1 ) {
			// Сбрасываем зум
			swiper.zoom.out( 1 );
		} else {
			// Увеличиваем до следующей ступени
			swiper.zoom.in( nextScale );
		}

		updateZoomUI( nextScale );

		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 8 );
		}
	} );

	/**
	 * Кнопка «+» — следующая ступень зума.
	 */
	const zoomInBtn = overlay.querySelector( '#zoomIn' );
	zoomInBtn.addEventListener( 'click', function ( e ) {
		e.stopPropagation();
		if ( !swiperInstance?.zoom ) return;

		const currentScale = swiperInstance.zoom.scale || 1;
		const nextScale = getNextZoomStep( currentScale );

		if ( nextScale <= 1 ) {
			swiperInstance.zoom.out( 1 );
		} else {
			swiperInstance.zoom.in( nextScale );
		}

		updateZoomUI( nextScale );

		if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
	} );

	/**
	 * Кнопка «−» — предыдущая ступень зума.
	 */
	const zoomOutBtn = overlay.querySelector( '#zoomOut' );
	zoomOutBtn.addEventListener( 'click', function ( e ) {
		e.stopPropagation();
		if ( !swiperInstance?.zoom ) return;

		const currentScale = swiperInstance.zoom.scale || 1;

		// Находим предыдущую ступень
		let prevStep = 1;
		for ( let i = 0; i < ZOOM_STEPS.length; i++ ) {
			if ( currentScale > ZOOM_STEPS[i] + 0.1 ) {
				prevStep = ZOOM_STEPS[i];
			}
		}

		if ( prevStep <= 1 ) {
			swiperInstance.zoom.out( 1 );
		} else {
			swiperInstance.zoom.in( prevStep );
		}

		updateZoomUI( prevStep );

		if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
	} );

	/**
	 * Обновление интерфейса зума.
	 */
	function updateZoomUI( currentScale ) {
		const hint = document.getElementById( 'sliderZoomHint' );
		const zoomLevel = document.getElementById( 'zoomLevel' );
		const zoomControls = document.getElementById( 'sliderZoomControls' );

		const scale = currentScale || ( swiperInstance?.zoom?.scale || 1 );
		const isZoomed = scale > 1.05;

		if ( hint ) {
			hint.textContent = isZoomed ? 'Двойной тап — уменьшить' : 'Двойной тап — увеличить';
			hint.classList.add( 'visible' );
			clearTimeout( hint._timeout );
			if ( !isZoomed ) {
				hint._timeout = setTimeout( () => hint.classList.remove( 'visible' ), 3000 );
			}
		}

		if ( zoomLevel ) {
			zoomLevel.textContent = `${Math.round( scale * 10 ) / 10}×`;
		}

		if ( zoomControls ) {
			zoomControls.classList.toggle( 'visible', isZoomed );
		}
	}

	// ============================================================
	// 8. ЗАКРЫТИЕ
	// ============================================================
	function closeSlider() {
		overlay.classList.remove( 'open' );
		setTimeout( () => {
			if ( swiperInstance ) {
				swiperInstance.destroy( true, true );
				swiperInstance = null;
			}
			overlay.remove();
			document.body.style.overflow = '';
		}, 400 );
		if ( window.navigator?.vibrate ) window.navigator.vibrate( 8 );
	}

	overlay.querySelector( '#sliderClose' ).addEventListener( 'click', closeSlider );
	overlay.addEventListener( 'click', e => {
		if ( e.target === overlay || e.target.classList.contains( 'slider-container' ) ) {
			closeSlider();
		}
	} );
	document.addEventListener( 'keydown', function esc( e ) {
		if ( e.key === 'Escape' ) {
			closeSlider();
			document.removeEventListener( 'keydown', esc );
		}
	} );

	// ============================================================
	// 9. ЗАПУСК
	// ============================================================
	updateZoomUI();
	if ( window.navigator?.vibrate ) window.navigator.vibrate( 10 );
	console.log( `📸 Слайдер открыт: ${startIndex + 1} / ${photos.length}` );
}