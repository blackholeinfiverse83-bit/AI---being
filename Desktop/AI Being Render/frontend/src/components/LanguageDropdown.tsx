import React, { useState, useEffect, useRef } from 'react';

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'zh-CN', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'it', label: 'Italiano' },
  { code: 'ko', label: '한국어' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'tr', label: 'Türkçe' },
];

declare global {
  interface Window {
    google?: { translate: { TranslateElement: unknown } };
    googleTranslateElementInit?: () => void;
  }
}

const LanguageDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onReady = () => setReady(true);
    window.addEventListener('google-translate-ready', onReady);
    if (document.getElementById('google_translate_element')) {
      setReady(true);
      return () => window.removeEventListener('google-translate-ready', onReady);
    }
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.display = 'none';
    document.body.appendChild(div);

    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement && document.getElementById('google_translate_element')) {
          const Te = window.google.translate.TranslateElement as {
            new (opts: { pageLanguage: string; layout: number }, id: string): void;
            InlineLayout?: { SIMPLE: number };
          };
          new Te(
            { pageLanguage: 'en', layout: Te.InlineLayout?.SIMPLE ?? 0 },
            'google_translate_element'
          );
          window.dispatchEvent(new Event('google-translate-ready'));
        }
      } catch {
        window.dispatchEvent(new Event('google-translate-ready'));
      }
    };

    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
      const el = document.getElementById('google_translate_element');
      if (el) el.remove();
      window.removeEventListener('google-translate-ready', onReady);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const style = document.createElement('style');
    style.textContent = `
      .goog-te-banner-frame { display: none !important; }
      body { top: 0 !important; }
      #google_translate_element .goog-te-gadget { display: none !important; }
      .skiptranslate { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, [ready]);

  const selectLanguage = (code: string) => {
    const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (combo && code !== combo.value) {
      combo.value = code;
      combo.dispatchEvent(new Event('change'));
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-iosGray-100 dark:bg-iosGray-800 text-iosGray-700 dark:text-iosGray-300 hover:bg-iosGray-200 dark:hover:bg-iosGray-700 transition-colors font-sf text-sm"
        title="Translate page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span>Language</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 py-1 w-48 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-iosGray-800 shadow-ios border border-iosGray-200/50 dark:border-iosGray-700/50 font-sf text-sm">
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => selectLanguage(code)}
                className="w-full text-left px-4 py-2.5 hover:bg-iosGray-100 dark:hover:bg-iosGray-700 text-iosGray-900 dark:text-white transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageDropdown;
