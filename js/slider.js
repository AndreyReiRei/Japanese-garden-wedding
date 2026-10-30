/**
 * ============================================================
 * slider.js — Полноэкранный слайдер на Swiper
 * ============================================================
 * 
 * ВОЗМОЖНОСТИ:
 *   - Перелистывание (свайп, стрелки, колёсико, клавиатура)
 *   - Все фото видны целиком (object-fit: contain)
 *   - Встроенный зум Swiper (двойной тап / пинч / перетаскивание)
 *   - Кнопки +/− для зума
 *   - Кнопки «Скачать» и «Поделиться»
 *   - Полоска миниатюр внизу (Thumbs)
 *   - Умный лоадер (появляется только если фото грузится > 1 сек)
 * ============================================================
 */

let swiperInstance = null;
let thumbsInstance = null;

function openSlider( config ) {
	'use strict';

	const { photos, startIndex = 0, theme = 'garden' } = config;

	// ============================================================
	// 1. ЗАЩИТА ОТ ДУБЛИРОВАНИЯ
	// ============================================================
	if ( document.querySelector( '.slider-overlay' ) ) return;
	if ( !photos || !photos.length ) return;

	// ============================================================
	// 2. ВНЕДРЕНИЕ CSS ДЛЯ ЛОАДЕРА
	// ============================================================
	if ( !document.getElementById( 'slider-loader-styles' ) ) {
		const style = document.createElement( 'style' );
		style.id = 'slider-loader-styles';
		style.textContent = `
			.slider-loader {
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				z-index: 5;
				display: flex;
				align-items: center;
				justify-content: center;
				pointer-events: none;
				opacity: 0;
				transition: opacity 0.3s ease;
			}
			.slider-loader.visible {
				opacity: 1;
			}
			.slider-loader-ring {
				width: 48px;
				height: 48px;
				border-radius: 50%;
				border: 3px solid rgba(255, 255, 255, 0.1);
				border-top-color: var(--accent-color, #E8A0B4);
				animation: sliderLoaderSpin 1s linear infinite;
				box-shadow: 0 0 20px rgba(var(--accent-rgb, 232, 160, 180), 0.2);
			}
			@keyframes sliderLoaderSpin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
			@media (width < 481px) {
				.slider-loader-ring {
					width: 36px;
					height: 36px;
					border-width: 2px;
				}
			}
		`;
		document.head.appendChild( style );
	}

	// ============================================================
	// 3. ПОСТРОЕНИЕ HTML
	// ============================================================
	const overlay = document.createElement( 'div' );
	overlay.className = 'slider-overlay';
	overlay.setAttribute( 'data-theme', theme );

	const slidesHTML = photos.map( ( photo, i ) => {
		const fullSrc = photo.srcFull || photo.src;
		return `
        <div class="swiper-slide">
            <div class="swiper-zoom-container">
                <img 
                    src="${fullSrc}" 
                    alt="${photo.alt || ''}" 
                    data-index="${i}"
                    loading="lazy"
                    draggable="false"
                >
            </div>
            ${photo.alt ? `<p class="slide-caption">${photo.alt}</p>` : ''}
        </div>
    `;
	} ).join( '' );

	const thumbsHTML = photos.map( ( photo, i ) => {
		const thumbSrc = photo.src || photo.srcFull;
		return `
        <div class="swiper-slide thumb-slide">
            <img 
                src="${thumbSrc}" 
                alt="Миниатюра ${i + 1}"
                loading="lazy"
                draggable="false"
            >
        </div>
    `;
	} ).join( '' );

	overlay.innerHTML = `
        <div class="slider-actions">
            <button class="slider-action-btn" id="sliderDownload" aria-label="Скачать" title="Скачать фото">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </button>
            <button class="slider-action-btn" id="sliderShare" aria-label="Поделиться" title="Поделиться фото">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
            </button>
        </div>

        <button class="slider-close" id="sliderClose" aria-label="Закрыть">✕</button>
        
        <div class="slider-container">
            <div class="slider-loader" id="sliderLoader">
                <div class="slider-loader-ring"></div>
            </div>

            <div class="swiper swiper-main">
                <div class="swiper-wrapper">${slidesHTML}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
            </div>
            
            <div class="swiper swiper-thumbs">
                <div class="swiper-wrapper">${thumbsHTML}</div>
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

	requestAnimationFrame( () => overlay.classList.add( 'open' ) );

	// ============================================================
	// 4. ИНИЦИАЛИЗАЦИЯ SWIPER
	// ============================================================
	const swiperMainEl = overlay.querySelector( '.swiper-main' );
	const swiperThumbsEl = overlay.querySelector( '.swiper-thumbs' );
	const loaderEl = overlay.querySelector( '#sliderLoader' );

	// --- ПЕРЕМЕННЫЕ ДЛЯ ЛОАДЕРА (ОБЪЯВЛЯЕМ ЗАРАНЕЕ) ---
	let loaderTimer = null;

	function checkCurrentImageLoaded() {
		if ( loaderTimer ) {
			clearTimeout( loaderTimer );
			loaderTimer = null;
		}
		if ( loaderEl ) loaderEl.classList.remove( 'visible' );

		if ( !swiperInstance ) return;

		const activeSlide = swiperInstance.slides[swiperInstance.activeIndex];
		if ( !activeSlide ) return;

		const img = activeSlide.querySelector( 'img' );
		if ( !img ) return;

		if ( img.complete && img.naturalWidth > 0 ) return;

		loaderTimer = setTimeout( () => {
			if ( loaderEl ) loaderEl.classList.add( 'visible' );
		}, 1000 );

		const onLoad = () => {
			if ( loaderTimer ) clearTimeout( loaderTimer );
			if ( loaderEl ) loaderEl.classList.remove( 'visible' );
		};

		img.addEventListener( 'load', onLoad, { once: true } );
		img.addEventListener( 'error', onLoad, { once: true } );
	}
	// ----------------------------------------------------

	// Скрываем до готовности
	swiperMainEl.style.visibility = 'hidden';
	swiperMainEl.style.opacity = '0';
	swiperMainEl.style.transition = 'opacity 0.3s ease';

	swiperThumbsEl.style.opacity = '0';
	swiperThumbsEl.style.transition = 'opacity 0.3s ease';

	// 4.1. Миниатюры
	thumbsInstance = new Swiper( swiperThumbsEl, {
		spaceBetween: 8,
		slidesPerView: 'auto',
		freeMode: true,
		watchSlidesProgress: true,
		lazy: {
			loadPrevNext: true,
			loadPrevNextAmount: 5,
		},
	} );

	// 4.2. Основной слайдер
	swiperInstance = new Swiper( swiperMainEl, {
		grabCursor: true,
		slidesPerView: 1.5,
		centeredSlides: true,
		initialSlide: startIndex,
		speed: 900,
		spaceBetween: 40,
		watchSlidesProgress: true,

		thumbs: {
			swiper: thumbsInstance,
		},

		zoom: {
			enabled: true,
			maxRatio: 4,
			minRatio: 1,
			toggle: false,
			containerClass: 'swiper-zoom-container',
			zoomedSlideClass: 'swiper-slide-zoomed',
		},

		navigation: {
			nextEl: overlay.querySelector( '.swiper-button-next' ),
			prevEl: overlay.querySelector( '.swiper-button-prev' ),
		},

		mousewheel: {
			thresholdDelta: 50,
			sensitivity: 1,
		},

		keyboard: {
			enabled: true,
			onlyInViewport: true,
		},

		breakpoints: {
			320: { slidesPerView: 1.1, spaceBetween: 12 },
			481: { slidesPerView: 1.2, spaceBetween: 20 },
			769: { slidesPerView: 1.4, spaceBetween: 30 },
			993: { slidesPerView: 1.5, spaceBetween: 40 },
		},

		on: {
			slideChange: function () {
				updateCounter( this.activeIndex, photos.length );
				updateZoomUI();
				updateActionButtons( this.activeIndex );
				checkCurrentImageLoaded();
			},
			zoomChange: function ( swiper, scale ) {
				updateZoomUI( scale );
			},
		},
	} );

	// Проверка при открытии
	checkCurrentImageLoaded();

	// ============================================================
	// 5. КНОПКИ СКАЧАТЬ / ПОДЕЛИТЬСЯ
	// ============================================================
	function updateActionButtons( index ) {
		const photo = photos[index];
		if ( !photo ) return;

		const fullSrc = photo.srcFull || photo.src;
		const downloadBtn = document.getElementById( 'sliderDownload' );
		const shareBtn = document.getElementById( 'sliderShare' );

		if ( downloadBtn ) {
			downloadBtn.onclick = () => {
				const a = document.createElement( 'a' );
				a.href = fullSrc;
				const filename = fullSrc.split( '/' ).pop() || 'photo.avif';
				a.download = filename;
				document.body.appendChild( a );
				a.click();
				document.body.removeChild( a );
			};
		}

		if ( shareBtn ) {
			shareBtn.onclick = async () => {
				if ( navigator.share ) {
					try {
						await navigator.share( {
							title: 'Японский сад — Андрей и Татьяна',
							text: photo.alt || 'Свадебное фото',
							url: window.location.href
						} );
					} catch ( err ) {
						console.log( 'Поделиться отменено', err );
					}
				} else {
					try {
						await navigator.clipboard.writeText( window.location.href );
						const originalHTML = shareBtn.innerHTML;
						shareBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
						setTimeout( () => shareBtn.innerHTML = originalHTML, 2000 );
					} catch ( err ) {
						alert( 'Не удалось скопировать ссылку. Скопируйте вручную: ' + window.location.href );
					}
				}
			};
		}
	}

	updateActionButtons( startIndex );

	// ============================================================
	// 6. ЦЕНТРИРОВАНИЕ И ПОКАЗ
	// ============================================================
	function refreshSwiper() {
		if ( !swiperInstance || swiperInstance.destroyed ) return;
		swiperInstance.updateSize();
		swiperInstance.updateSlides();
		swiperInstance.update();
		swiperInstance.slideTo( startIndex, 0 );

		if ( thumbsInstance && !thumbsInstance.destroyed ) {
			thumbsInstance.updateSize();
			thumbsInstance.updateSlides();
			thumbsInstance.update();
			thumbsInstance.slideTo( startIndex, 0 );
		}
	}

	function showSwiper() {
		if ( swiperMainEl ) {
			swiperMainEl.style.visibility = 'visible';
			swiperMainEl.style.opacity = '1';
		}
		if ( swiperThumbsEl ) {
			swiperThumbsEl.style.opacity = '1';
		}
	}

	const allSliderImages = overlay.querySelectorAll( '.swiper-main img[data-index]' );
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
	// 7. СЧЁТЧИК
	// ============================================================
	function updateCounter( index, total ) {
		const counter = document.getElementById( 'sliderCounter' );
		if ( counter ) {
			counter.textContent = `${index + 1} / ${total || photos.length}`;
		}
	}

	// ============================================================
	// 8. ЗУМ
	// ============================================================
	const ZOOM_STEPS = [1, 2, 4, 8];

	function getNextZoomStep( currentScale ) {
		let currentStep = 1;
		for ( let i = ZOOM_STEPS.length - 1; i >= 0; i-- ) {
			if ( currentScale >= ZOOM_STEPS[i] - 0.1 ) {
				currentStep = ZOOM_STEPS[i];
				break;
			}
		}
		const currentIndex = ZOOM_STEPS.indexOf( currentStep );
		const nextIndex = ( currentIndex + 1 ) % ZOOM_STEPS.length;
		return ZOOM_STEPS[nextIndex];
	}

	swiperInstance.on( 'doubleTap', function ( swiper, event ) {
		const currentScale = swiper.zoom.scale || 1;
		const nextScale = getNextZoomStep( currentScale );

		if ( nextScale <= 1 ) swiper.zoom.out( 1 );
		else swiper.zoom.in( nextScale );

		updateZoomUI( nextScale );
		if ( window.navigator?.vibrate ) window.navigator.vibrate( 8 );
	} );

	const zoomInBtn = overlay.querySelector( '#zoomIn' );
	zoomInBtn.addEventListener( 'click', function ( e ) {
		e.stopPropagation();
		if ( !swiperInstance?.zoom ) return;

		const currentScale = swiperInstance.zoom.scale || 1;
		const nextScale = getNextZoomStep( currentScale );

		if ( nextScale <= 1 ) swiperInstance.zoom.out( 1 );
		else swiperInstance.zoom.in( nextScale );

		updateZoomUI( nextScale );
		if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
	} );

	const zoomOutBtn = overlay.querySelector( '#zoomOut' );
	zoomOutBtn.addEventListener( 'click', function ( e ) {
		e.stopPropagation();
		if ( !swiperInstance?.zoom ) return;

		const currentScale = swiperInstance.zoom.scale || 1;
		let prevStep = 1;
		for ( let i = 0; i < ZOOM_STEPS.length; i++ ) {
			if ( currentScale > ZOOM_STEPS[i] + 0.1 ) {
				prevStep = ZOOM_STEPS[i];
			}
		}

		if ( prevStep <= 1 ) swiperInstance.zoom.out( 1 );
		else swiperInstance.zoom.in( prevStep );

		updateZoomUI( prevStep );
		if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
	} );

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
	// 9. ЗАКРЫТИЕ
	// ============================================================
	function closeSlider() {
		overlay.classList.remove( 'open' );
		setTimeout( () => {
			if ( swiperInstance ) {
				swiperInstance.destroy( true, true );
				swiperInstance = null;
			}
			if ( thumbsInstance ) {
				thumbsInstance.destroy( true, true );
				thumbsInstance = null;
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
	// 10. ЗАПУСК
	// ============================================================
	updateZoomUI();
	if ( window.navigator?.vibrate ) window.navigator.vibrate( 10 );
	console.log( `📸 Слайдер открыт с миниатюрами: ${startIndex + 1} / ${photos.length}` );
}