/**
 * ============================================================
 * scroll.js — Блок свитка с историей дня
 * Плавное разворачивание как на главной странице
 * + светлячки внутри развёрнутого свитка
 * ============================================================
 * 
 * ИСПОЛЬЗОВАНИЕ:
 *   initScroll( {
 *       stories: {
 *           garden: { title: '...', text: '...' },
 *           zags:   { title: '...', text: '...' },
 *           home:   { title: '...', text: '...' }
 *       },
 *       section: 'garden'
 *   } );
 * 
 * ЗАВИСИМОСТИ:
 *   - effects.js (для светлячков: startOverlayFireflies / stopOverlayFireflies)
 *   - scroll.css
 * ============================================================
 */

function initScroll( config ) {
	'use strict';

	// ============================================================
	// 1. ПРОВЕРКА ПАРАМЕТРОВ
	// ============================================================

	if ( !config || !config.stories || !config.section ) {
		console.error( 'initScroll: не указаны stories или section' );
		return;
	}

	const { stories, section } = config;
	const story = stories[section];

	if ( !story ) {
		console.error( `initScroll: нет истории для раздела «${section}»` );
		return;
	}

	// ============================================================
	// 2. DOM-ЭЛЕМЕНТЫ
	// ============================================================

	const scrollBlock = document.getElementById( 'scrollBlock' );
	const scrollTrigger = document.getElementById( 'scrollTrigger' );
	const collapseBtn = document.getElementById( 'scrollCollapseBtn' );

	if ( !scrollBlock ) {
		console.error( 'initScroll: не найден #scrollBlock' );
		return;
	}

	// Элементы внутри развёрнутого свитка
	const titleEl = scrollBlock.querySelector( '.scroll-title' );
	const textEl = scrollBlock.querySelector( '.scroll-text' );
	const paperEl = scrollBlock.querySelector( '.scroll-paper' );

	// ============================================================
	// 3. ЗАПОЛНЕНИЕ КОНТЕНТА
	// ============================================================

	if ( titleEl ) titleEl.textContent = story.title;
	if ( textEl ) textEl.textContent = story.text;

	// ============================================================
	// 4. ХРАНИЛИЩЕ ДЛЯ КОНТРОЛЛЕРА СВЕТЛЯЧКОВ
	// ============================================================

	let firefliesController = null;

	// ============================================================
	// 5. ФУНКЦИИ РАЗВОРАЧИВАНИЯ / СВОРАЧИВАНИЯ
	// ============================================================

	/**
	 * 5.1. РАЗВОРАЧИВАЕТ СВИТОК
	 * 
	 * Анимация:
	 * 1. Добавляем класс .expanded — запускается CSS-переход
	 *    max-height: 0 → 3000px и opacity: 0 → 1.
	 * 2. Бумага выезжает снизу вверх через transform.
	 * 3. После раскрытия запускаем светлячков внутри бумаги.
	 * 4. Прокручиваем страницу к началу свитка.
	 */
	function expand() {
		// Запускаем CSS-анимацию разворачивания
		scrollBlock.classList.add( 'expanded' );

		// Даём анимации начаться, затем прокручиваем
		setTimeout( () => {
			scrollBlock.scrollIntoView( { behavior: 'smooth', block: 'start' } );
		}, 250 );

		// Запускаем светлячков внутри развёрнутой бумаги
		if ( typeof window.startOverlayFireflies === 'function' && paperEl ) {
			// Небольшая задержка — чтобы бумага уже была видна
			setTimeout( () => {
				firefliesController = window.startOverlayFireflies( paperEl );
			}, 400 );
		}

		// Тактильный отклик
		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 10 );
		}

		console.log( `📜 Свиток развёрнут: «${story.title}»` );
	}

	/**
	 * 5.2. СВОРАЧИВАЕТ СВИТОК
	 * 
	 * Анимация:
	 * 1. Останавливаем и удаляем светлячков.
	 * 2. Убираем класс .expanded — запускается обратный CSS-переход.
	 * 3. Прокручиваем страницу обратно к кнопке.
	 */
	function collapse() {
		// Останавливаем светлячков
		if ( firefliesController ) {
			window.stopOverlayFireflies( firefliesController );
			firefliesController = null;
		}

		// Запускаем CSS-анимацию сворачивания
		scrollBlock.classList.remove( 'expanded' );

		// Прокручиваем обратно к кнопке
		setTimeout( () => {
			if ( scrollTrigger ) {
				scrollTrigger.scrollIntoView( { behavior: 'smooth', block: 'center' } );
			}
		}, 150 );

		// Тактильный отклик
		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 8 );
		}

		console.log( '📜 Свиток свёрнут' );
	}

	// ============================================================
	// 6. ОБРАБОТЧИКИ СОБЫТИЙ
	// ============================================================

	// 6.1. Клик по свёрнутой кнопке — разворачиваем
	if ( scrollTrigger ) {
		scrollTrigger.addEventListener( 'click', function ( e ) {
			e.stopPropagation();
			expand();
		} );
	}

	// 6.2. Клик по кнопке «Свернуть» — сворачиваем
	if ( collapseBtn ) {
		collapseBtn.addEventListener( 'click', function ( e ) {
			e.stopPropagation();
			collapse();
		} );
	}

	// ============================================================
	// 7. ВОЗВРАЩАЕМ МЕТОДЫ ДЛЯ ВНЕШНЕГО УПРАВЛЕНИЯ
	// ============================================================

	console.log( `📜 Свиток готов: «${story.title}»` );

	return {
		expand: expand,
		collapse: collapse
	};
}