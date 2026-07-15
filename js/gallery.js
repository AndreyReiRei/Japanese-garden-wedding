/**
 * ============================================================
 * gallery.js — Динамическая галерея с сеткой
 * ============================================================
 * 
 * НАЗНАЧЕНИЕ:
 *   Строит адаптивную сетку фотографий.
 *   При клике на фото — открывает полноэкранный слайдер (slider.js).
 * 
 * ИСПОЛЬЗОВАНИЕ:
 *   initGallery({
 *       section: 'garden',           // Идентификатор раздела
 *       photos: [                    // Массив фото
 *           { src: '...', alt: '...', span: '2-rows' },
 *           ...
 *       ]
 *   });
 * 
 * ЗАВИСИМОСТИ:
 *   - slider.js (функция openSlider)
 *   - gallery.css (стили сетки)
 * ============================================================
 */

function initGallery( config ) {
	'use strict';

	// ============================================================
	// 1. ДЕСТРУКТУРИЗАЦИЯ КОНФИГА
	// ============================================================

	const {
		section,        // 'garden' | 'zags' | 'home'
		photos          // Массив объектов фото
	} = config;

	// Защита: если нет секции или фото — выходим
	if ( !section || !photos || !photos.length ) {
		console.error( 'initGallery: не указан section или photos' );
		return;
	}

	// ============================================================
	// 2. ПОЛУЧЕНИЕ DOM-ЭЛЕМЕНТОВ
	// ============================================================

	const galleryGrid = document.getElementById( 'galleryGrid' );
	const photoCounter = document.getElementById( 'photoCounter' );

	// Если сетки нет на странице — выходим
	if ( !galleryGrid ) {
		console.error( 'initGallery: не найден #galleryGrid' );
		return;
	}

	// ============================================================
	// 3. УТИЛИТА: ОБНОВЛЕНИЕ СЧЁТЧИКА ФОТО
	// ============================================================

	/**
	 * Записывает в шапку количество фото.
	 * Пример: «12 фото»
	 */
	function updateCounter() {
		if ( photoCounter ) {
			photoCounter.textContent = `${photos.length} фото`;
		}
	}

	// ============================================================
	// 4. ФАБРИКА: СОЗДАНИЕ ОДНОГО ЭЛЕМЕНТА СЕТКИ
	// ============================================================

	/**
	 * Создаёт DOM-элемент для одного фото.
	 * 
	 * @param {Object} photo - Объект фото
	 * @param {string} photo.src - Путь к изображению
	 * @param {string} [photo.alt] - Подпись (опционально)
	 * @param {string} [photo.span] - Размер в сетке:
	 *        ''         — обычный (1×1)
	 *        '2-rows'   — двойная высота
	 *        '2-cols'   — двойная ширина
	 *        '2-both'   — двойной в обе стороны
	 * @param {number} index - Индекс фото в массиве
	 * @returns {HTMLElement} Готовый элемент галереи
	 */
	function createPhotoItem( photo, index ) {
		// --- Контейнер ---
		const item = document.createElement( 'div' );
		item.className = 'gallery-item';

		// Добавляем класс размера, если указан
		if ( photo.span ) {
			item.classList.add( `span-${photo.span}` );
		}

		// Задержка анимации: каждое следующее фото появляется чуть позже
		// Это создаёт красивый каскадный эффект при загрузке
		item.style.transitionDelay = `${index * 0.06}s`;

		// --- Изображение ---
		const img = document.createElement( 'img' );
		img.src = photo.src;
		img.alt = photo.alt || '';
		img.loading = 'lazy';        // Ленивая загрузка для производительности
		img.decoding = 'async';      // Асинхронный декодинг — не блокирует рендер

		// Если фото не загрузилось — показываем заглушку
		img.onerror = function () {
			this.src = 'data:image/svg+xml,' +
				'%3Csvg xmlns=\'http://www.w3.org/2000/svg\' ' +
				'width=\'400\' height=\'300\'%3E' +
				'%3Crect fill=\'%231a1a1a\' width=\'400\' height=\'300\'/%3E' +
				'%3Ctext fill=\'%23555\' x=\'50%25\' y=\'50%25\' ' +
				'text-anchor=\'middle\' dy=\'.3em\' font-size=\'14\'%3E' +
				'Фото не найдено%3C/text%3E%3C/svg%3E';
		};

		item.appendChild( img );

		// --- Подпись (появляется при тапе на мобильных) ---
		if ( photo.alt ) {
			const caption = document.createElement( 'div' );
			caption.className = 'gallery-caption';
			caption.textContent = photo.alt;
			item.appendChild( caption );
		}

		// --- Обработчик клика: открытие слайдера ---
		item.addEventListener( 'click', () => {
			// Вызывает функцию из slider.js
			if ( typeof openSlider === 'function' ) {
				openSlider( {
					photos: photos,           // Все фото раздела
					startIndex: index,        // С какого начать
					theme: section            // Тема для цветов
				} );
			} else {
				console.warn( 'openSlider не найден. Подключён ли slider.js?' );
			}
		} );

		return item;
	}

	// ============================================================
	// 5. ПОСТРОЕНИЕ ВСЕЙ СЕТКИ
	// ============================================================

	/**
	 * Очищает контейнер и наполняет его элементами фото.
	 * После вставки запускает анимацию появления.
	 */
	function buildGrid() {
		// Очищаем сетку (на случай повторного вызова)
		galleryGrid.innerHTML = '';

		// Создаём все элементы
		photos.forEach( ( photo, index ) => {
			galleryGrid.appendChild( createPhotoItem( photo, index ) );
		} );

		// Обновляем счётчик
		updateCounter();

		// Запускаем анимацию появления
		// requestAnimationFrame даёт браузеру отрисовать элементы
		// перед добавлением класса .visible
		requestAnimationFrame( () => {
			const items = galleryGrid.querySelectorAll( '.gallery-item' );
			items.forEach( item => item.classList.add( 'visible' ) );
		} );
	}

	// ============================================================
	// 6. ЗАПУСК
	// ============================================================

	buildGrid();

	console.log(
		`📸 Галерея «${section}» готова — ${photos.length} фото`
	);
}