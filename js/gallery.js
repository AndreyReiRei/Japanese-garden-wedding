/**
 * gallery.js — Динамическая галерея с лайтбоксом
 * Используется страницами: garden.html, zags.html, home.html
 */

/**
 * Инициализирует галерею.
 * @param {Object} config
 * @param {string} config.section - Идентификатор раздела (garden/zags/home)
 * @param {Array} config.photos - Массив объектов { src, alt, span }
 *   span: '' | '2-rows' | '2-cols' | '2-both'
 */
function initGallery( config ) {
	'use strict';

	const { section, photos } = config;

	// ============================================
	// DOM-элементы
	// ============================================
	const galleryGrid = document.getElementById( 'galleryGrid' );
	const photoCounter = document.getElementById( 'photoCounter' );
	const lightbox = document.getElementById( 'lightbox' );
	const lightboxImg = document.getElementById( 'lightboxImg' );
	const lightboxClose = document.getElementById( 'lightboxClose' );
	const lightboxPrev = document.getElementById( 'lightboxPrev' );
	const lightboxNext = document.getElementById( 'lightboxNext' );
	const lightboxCounter = document.getElementById( 'lightboxCounter' );

	// ============================================
	// СОСТОЯНИЕ
	// ============================================
	let currentPhotoIndex = 0;
	let touchStartX = 0;
	let touchEndX = 0;

	// ============================================
	// ПОСТРОЕНИЕ СЕТКИ
	// ============================================

	/**
	 * Создаёт DOM-элемент для одного фото.
	 */
	function createPhotoItem( photo, index ) {
		const item = document.createElement( 'div' );
		item.className = 'gallery-item';

		// Добавляем модификатор размера
		if ( photo.span ) {
			item.classList.add( `span-${photo.span}` );
		}

		// Задержка для каскадной анимации
		item.style.transitionDelay = `${index * 0.08}s`;

		// Изображение
		const img = document.createElement( 'img' );
		img.src = photo.src;
		img.alt = photo.alt || '';
		img.loading = 'lazy';           // Ленивая загрузка
		img.decoding = 'async';         // Асинхронный декодинг

		// Обработка ошибки загрузки
		img.onerror = function () {
			this.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'300\'%3E%3Crect fill=\'%231a1a1a\' width=\'400\' height=\'300\'/%3E%3Ctext fill=\'%23555\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' font-size=\'14\'%3EФото не найдено%3C/text%3E%3C/svg%3E';
		};

		item.appendChild( img );

		// Подпись (появляется при тапе)
		if ( photo.alt ) {
			const caption = document.createElement( 'div' );
			caption.className = 'gallery-caption';
			caption.textContent = photo.alt;
			item.appendChild( caption );
		}

		// Клик → открыть лайтбокс
		item.addEventListener( 'click', () => openLightbox( index ) );

		return item;
	}

	/**
	 * Строит всю сетку.
	 */
	function buildGrid() {
		if ( !galleryGrid ) return;

		// Очищаем
		galleryGrid.innerHTML = '';

		// Создаём элементы
		photos.forEach( ( photo, index ) => {
			galleryGrid.appendChild( createPhotoItem( photo, index ) );
		} );

		// Обновляем счётчик
		updateCounter();

		// Запускаем анимацию появления
		requestAnimationFrame( () => {
			const items = galleryGrid.querySelectorAll( '.gallery-item' );
			items.forEach( item => item.classList.add( 'visible' ) );
		} );
	}

	/**
	 * Обновляет счётчик фото в шапке.
	 */
	function updateCounter() {
		if ( photoCounter ) {
			photoCounter.textContent = `${photos.length} фото`;
		}
	}

	// ============================================
	// ЛАЙТБОКС
	// ============================================

	/**
	 * Открывает лайтбокс с фото по индексу.
	 */
	function openLightbox( index ) {
		if ( index < 0 || index >= photos.length ) return;

		currentPhotoIndex = index;
		updateLightboxImage();
		lightbox.classList.add( 'open' );

		// Блокируем скролл body
		document.body.style.overflow = 'hidden';

		// Тактильный отклик
		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 8 );
		}
	}

	/**
	 * Закрывает лайтбокс.
	 */
	function closeLightbox() {
		lightbox.classList.remove( 'open' );
		document.body.style.overflow = '';
	}

	/**
	 * Обновляет изображение и счётчик в лайтбоксе.
	 */
	function updateLightboxImage() {
		const photo = photos[currentPhotoIndex];
		lightboxImg.src = photo.src;
		lightboxImg.alt = photo.alt || '';
		lightboxCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;

		// Показываем/скрываем стрелки
		lightboxPrev.style.visibility = currentPhotoIndex > 0 ? 'visible' : 'hidden';
		lightboxNext.style.visibility = currentPhotoIndex < photos.length - 1 ? 'visible' : 'hidden';
	}

	/**
	 * Предыдущее фото.
	 */
	function prevPhoto() {
		if ( currentPhotoIndex > 0 ) {
			currentPhotoIndex--;
			updateLightboxImage();
			if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
		}
	}

	/**
	 * Следующее фото.
	 */
	function nextPhoto() {
		if ( currentPhotoIndex < photos.length - 1 ) {
			currentPhotoIndex++;
			updateLightboxImage();
			if ( window.navigator?.vibrate ) window.navigator.vibrate( 5 );
		}
	}

	// ============================================
	// ОБРАБОТЧИКИ СОБЫТИЙ
	// ============================================

	// Закрытие лайтбокса
	lightboxClose.addEventListener( 'click', closeLightbox );

	// Клик по фону → закрыть
	lightbox.addEventListener( 'click', ( e ) => {
		if ( e.target === lightbox ) {
			closeLightbox();
		}
	} );

	// Стрелки
	lightboxPrev.addEventListener( 'click', ( e ) => {
		e.stopPropagation();
		prevPhoto();
	} );

	lightboxNext.addEventListener( 'click', ( e ) => {
		e.stopPropagation();
		nextPhoto();
	} );

	// Клавиатура
	document.addEventListener( 'keydown', ( e ) => {
		if ( !lightbox.classList.contains( 'open' ) ) return;

		switch ( e.key ) {
			case 'Escape':
				closeLightbox();
				break;
			case 'ArrowLeft':
				prevPhoto();
				break;
			case 'ArrowRight':
				nextPhoto();
				break;
		}
	} );

	// Свайпы на лайтбоксе
	lightbox.addEventListener( 'touchstart', ( e ) => {
		touchStartX = e.touches[0].clientX;
	}, { passive: true } );

	lightbox.addEventListener( 'touchend', ( e ) => {
		touchEndX = e.changedTouches[0].clientX;
		handleSwipe();
	} );

	function handleSwipe() {
		const diff = touchStartX - touchEndX;
		const threshold = 60;  // Минимальное расстояние свайпа

		if ( Math.abs( diff ) > threshold ) {
			if ( diff > 0 ) {
				nextPhoto();     // Свайп влево → следующее
			} else {
				prevPhoto();     // Свайп вправо → предыдущее
			}
		}
	}

	// ============================================
	// ЗАПУСК
	// ============================================

	buildGrid();
	console.log( `📸 Галерея «${section}» готова — ${photos.length} фото` );
}