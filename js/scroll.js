/**
 * ============================================================
 * scroll.js — Блок свитка с историей дня
 * Плавное разворачивание как на главной странице
 * + светлячки на весь экран при открытом свитке
 * ============================================================
 * 
 * ЧТО ДЕЛАЕТ:
 *   - Управляет раскрытием/сворачиванием свитка.
 *   - Заполняет заголовок из переданных данных.
 *   - Запускает светлячков (position: fixed) при открытии.
 *   - Удаляет светлячков при закрытии.
 * 
 * ИСПОЛЬЗОВАНИЕ:
 *   initScroll( {
 *       stories: {
 *           garden: { title: 'Японский сад' },
 *           zags:   { title: 'Бракосочетание' },
 *           home:   { title: 'Купеческий дом' }
 *       },
 *       section: 'garden'
 *   } );
 * 
 * ЗАВИСИМОСТИ:
 *   - effects.js (startOverlayFireflies / stopOverlayFireflies)
 *   - scroll.css
 * 
 * ВАЖНО:
 *   - Светлячки добавляются в document.body (position: fixed).
 *   - Они видны на всём экране, не скроллятся, не привязаны к бумаге.
 *   - При сворачивании свитка светлячки полностью удаляются.
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
	const closeBtnTop = document.getElementById( 'scrollCloseBtnTop' ); // Новая кнопка закрытия сверху

	if ( !scrollBlock ) {
		console.error( 'initScroll: не найден #scrollBlock' );
		return;
	}

	// Элементы внутри свитка
	const titleEl = scrollBlock.querySelector( '.scroll-title' );

	// ============================================================
	// 3. ЗАПОЛНЕНИЕ ЗАГОЛОВКА
	// Текст истории уже находится в HTML.
	// ============================================================

	if ( titleEl ) {
		titleEl.textContent = story.title;
	}

	// ============================================================
	// 4. ПЕРЕМЕННАЯ ДЛЯ СВЕТЛЯЧКОВ
	// ============================================================

	let firefliesCtrl = null;

	// ============================================================
	// 5. РАЗВОРАЧИВАНИЕ СВИТКА
	// ============================================================

	function expand() {
		// Запускаем CSS-анимацию раскрытия
		scrollBlock.classList.add( 'expanded' );

		// Прокручиваем страницу к началу свитка
		setTimeout( () => {
			scrollBlock.scrollIntoView( { behavior: 'smooth', block: 'start' } );
		}, 250 );

		/*
		 * Запускаем светлячков на весь экран.
		 * Они position: fixed — видны всегда, даже при скролле.
		 * Добавляются в document.body, удаляются при закрытии.
		 */
		if ( typeof window.startOverlayFireflies === 'function' ) {
			setTimeout( () => {
				firefliesCtrl = window.startOverlayFireflies( document.body );
			}, 400 );
		}

		// Тактильный отклик
		if ( window.navigator?.vibrate ) {
			window.navigator.vibrate( 10 );
		}

		console.log( `📜 Свиток развёрнут: «${story.title}» 🪲` );
	}

	// ============================================================
	// 6. СВОРАЧИВАНИЕ СВИТКА
	// ============================================================

	function collapse() {
		/*
		 * Останавливаем и удаляем светлячков.
		 * Они полностью удаляются из DOM.
		 */
		if ( firefliesCtrl ) {
			window.stopOverlayFireflies( firefliesCtrl );
			firefliesCtrl = null;
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
	// 7. ОБРАБОТЧИКИ СОБЫТИЙ
	// ============================================================

	// Клик по свёрнутой кнопке → разворачиваем
	if ( scrollTrigger ) {
		scrollTrigger.addEventListener( 'click', ( e ) => {
			e.stopPropagation();
			expand();
		} );
	}

	// Клик по нижней кнопке «Свернуть» → сворачиваем
	if ( collapseBtn ) {
		collapseBtn.addEventListener( 'click', ( e ) => {
			e.stopPropagation();
			collapse();
		} );
	}

	// Клик по верхней кнопке закрытия (крестик) → сворачиваем
	if ( closeBtnTop ) {
		closeBtnTop.addEventListener( 'click', ( e ) => {
			e.stopPropagation();
			collapse();
		} );
	}

	// ============================================================
	// 8. ВОЗВРАЩАЕМ МЕТОДЫ ДЛЯ ВНЕШНЕГО УПРАВЛЕНИЯ
	// ============================================================

	console.log( `📜 Свиток готов: «${story.title}»` );

	return {
		expand: expand,
		collapse: collapse
	};
}