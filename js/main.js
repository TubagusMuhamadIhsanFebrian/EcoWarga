const themeStorageKey = 'ecowarga-theme';

function getPreferredTheme() {
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;

    const toggleButton = document.getElementById('themeToggle');
    if (toggleButton) {
        const icon = toggleButton.querySelector('.theme-toggle-icon');

        if (icon) {
            icon.innerHTML = theme === 'dark'
                ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.8"></circle><path d="M12 2.5v2.2"></path><path d="M12 19.3v2.2"></path><path d="M4.7 4.7l1.6 1.6"></path><path d="M17.7 17.7l1.6 1.6"></path><path d="M2.5 12h2.2"></path><path d="M19.3 12h2.2"></path><path d="M4.7 19.3l1.6-1.6"></path><path d="M17.7 6.3l1.6-1.6"></path></svg>'
                : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.4 14.8A7 7 0 0 1 9.2 5.6a7 7 0 1 0 9.2 9.2Z"></path></svg>';
        }

        toggleButton.setAttribute('aria-label', theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const btnTop = document.getElementById('btnTop');
    const toggleButton = document.getElementById('themeToggle');

    applyTheme(getPreferredTheme());

    if (toggleButton) {
        toggleButton.addEventListener('click', function () {
            const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            localStorage.setItem(themeStorageKey, nextTheme);
            applyTheme(nextTheme);
        });
    }

    if (!btnTop) return;

    const checkScroll = () => {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            btnTop.classList.add('show');
        } else {
            btnTop.classList.remove('show');
        }
    };

    window.addEventListener('scroll', checkScroll);

    btnTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});
