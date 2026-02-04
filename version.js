/**
 * Stack & Crack - Конфигурация версии
 * Централизованное управление версией приложения
 */

const APP_VERSION = {
    major: 2,
    minor: 0,
    patch: 0,
    build: Date.now(),
    
    get full() {
        return `${this.major}.${this.minor}.${this.patch}`;
    },
    
    get cache() {
        return `stack-crack-v${this.major}.${this.minor}.${this.patch}`;
    },
    
    get display() {
        return `v${this.full}`;
    }
};

// Экспорт для Service Worker и основного кода
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_VERSION;
}
