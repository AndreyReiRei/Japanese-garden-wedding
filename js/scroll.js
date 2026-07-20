/**
 * ============================================================
 * scroll.js — Блок свитка
 * Свёрнутый → разворачивается при клике
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
	const scrollExpanded = document.getElementById( 'scrollExpanded' );
	const collapseBtn = document.getElementById( 'scrollCollapseBtn' );

	if ( !scrollBlock ) {
		console.error( 'initScroll: не найден #scrollBlock' );
		return;
	}

	// Элементы внутри развёрнутого свитка
	const titleEl = scrollBlock.querySelector( '.scroll-title' );
	const textEl = scrollBlock.querySelector( '.scroll-text' );

	// ============================================================
	// 3. ЗАПОЛНЕНИЕ КОНТЕНТА
	// ============================================================

	if ( titleEl ) titleEl.textContent = story.title;
	if ( textEl ) textEl.textContent = story.text;

	// ============================================================
	// 4. ФУНКЦИИ РАЗВОРАЧИВАНИЯ / СВОРАЧИВАНИЯ
	// ============================================================

	/**
	 * Разворачивает свиток.
	 */
	function expand() {
		scrollBlock.classList.add( 'expanded' );

		// Плавный скролл к началу свитка
		setTimeout( () => {
			scrollBlock.scrollIntoView( { behavior: 'smooth', block: 'start' } );
		}, 100 );

		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 10 );
		}

		console.log( `📜 Свиток развёрнут: «${story.title}»` );
	}

	/**
	 * Сворачивает свиток.
	 */
	function collapse() {
		scrollBlock.classList.remove( 'expanded' );

		// Возвращаемся к кнопке
		setTimeout( () => {
			scrollTrigger.scrollIntoView( { behavior: 'smooth', block: 'center' } );
		}, 100 );

		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 8 );
		}

		console.log( '📜 Свиток свёрнут' );
	}

	/**
	 * Переключает состояние свитка.
	 */
	function toggle() {
		if ( scrollBlock.classList.contains( 'expanded' ) ) {
			collapse();
		} else {
			expand();
		}
	}

	// ============================================================
	// 5. ОБРАБОТЧИКИ СОБЫТИЙ
	// ============================================================

	// 5.1. Клик по свёрнутому свитку
	if ( scrollTrigger ) {
		scrollTrigger.addEventListener( 'click', function ( e ) {
			e.stopPropagation();
			expand();
		} );
	}

	// 5.2. Клик по кнопке «Свернуть»
	if ( collapseBtn ) {
		collapseBtn.addEventListener( 'click', function ( e ) {
			e.stopPropagation();
			collapse();
		} );
	}

	// ============================================================
	// 6. ВОЗВРАЩАЕМ МЕТОДЫ ДЛЯ ВНЕШНЕГО УПРАВЛЕНИЯ
	// ============================================================

	console.log( `📜 Свиток готов: «${story.title}»` );

	return {
		expand: expand,
		collapse: collapse,
		toggle: toggle
	};
}