import { Language } from './translations';

const translationCache: Record<string, string> = {};

/**
 * Translate dynamic AI output text on-the-fly into the selected native language (Tamil, Hindi, etc.)
 * while leaving the stored backend records and PDF downloads in pristine English.
 */
export async function translateText(text: string, targetLang: Language): Promise<string> {
  if (!text || targetLang === 'en') return text;

  const cacheKey = `${targetLang}:${text}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    );
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && typeof translated === 'string' && !translated.includes('MYMEMORY WARNING')) {
        translationCache[cacheKey] = translated;
        return translated;
      }
    }
  } catch (err) {
    console.warn(`Translation to ${targetLang} failed:`, err);
  }

  return text; // Fallback to English
}

/**
 * Translate a list of observation or recommendation strings concurrently.
 */
export async function translateList(items: string[], targetLang: Language): Promise<string[]> {
  if (!items || items.length === 0 || targetLang === 'en') return items;
  return Promise.all(items.map(item => translateText(item, targetLang)));
}
