import enLocale from '@/locales/en.json';
import hiLocale from '@/locales/hi.json';
import taLocale from '@/locales/ta.json';

export type Language = 'en' | 'hi' | 'ta' | 'gu' | 'pa' | 'mr' | 'te' | 'kn' | 'bn';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    ...enLocale,
  },
  hi: {
    ...hiLocale,
  },
  ta: {
    ...taLocale,
  },
  gu: {
    ...enLocale,
    nav_home: 'મુખ્ય પૃષ્ઠ',
    nav_farm: 'ફાર્મ મેનેજમેન્ટ',
    nav_muzzle_scan: 'મઝલ સ્કેન',
    nav_signin: 'સાઇન ઇન કરો',
    nav_signout: 'સાઇન આઉટ',
  },
  pa: {
    ...enLocale,
    nav_home: 'ਮੁੱਖ ਸਫ਼ਾ',
    nav_farm: 'ਫਾਰਮ ਪ੍ਰਬੰਧਨ',
    nav_muzzle_scan: 'ਮਜ਼ਲ ਸਕੈਨ',
  },
  mr: {
    ...enLocale,
    nav_home: 'मुख्य पृष्ठ',
    nav_farm: 'फार्म व्यवस्थापन',
    nav_muzzle_scan: 'मझल स्कॅन',
  },
  te: {
    ...enLocale,
    nav_home: 'హోమ్',
    nav_farm: 'ఫార్మ్ మేనేజ్మెంట్',
    nav_muzzle_scan: 'మజిల్ స్కాన్',
  },
  kn: {
    ...enLocale,
    nav_home: 'ಮುಖಪುಟ',
    nav_farm: 'ಫಾರ್ಮ್ ನಿರ್ವಹಣೆ',
    nav_muzzle_scan: 'ಮಜ್ಜಲ್ ಸ್ಕ್ಯಾನ್',
  },
  bn: {
    ...enLocale,
    nav_home: 'হোম',
    nav_farm: 'ফার্ম ব্যবস্থাপনা',
    nav_muzzle_scan: 'মাজল স্ক্যান',
  },
};

/**
 * Universal dynamic output translator for AI outputs, database strings,
 * disease diagnoses, breeds, colors, genders, and observations.
 */
export function translateOutput(val: any, lang: Language): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';

  const dict = TRANSLATIONS[lang] || TRANSLATIONS['en'];

  // 1. Direct dictionary lookup
  if (dict[str]) return dict[str];

  // 2. Lookup with val_ prefix
  const cleaned = str.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const valKey = `val_${cleaned}`;
  if (dict[valKey]) return dict[valKey];

  // 3. Keyword-based matching for veterinary diagnoses & statuses
  const lower = str.toLowerCase();

  // Health / Disease
  if (lower === 'healthy' || lower.includes('healthy') || lower.includes('no visible')) {
    return dict['val_Healthy'] || str;
  }
  if (lower.includes('mastitis') || lower.includes('thanal') || lower.includes('thanaila')) {
    return dict['val_Mastitis'] || str;
  }
  if (lower.includes('lumpy')) {
    return dict['val_Lumpy_Skin_Disease'] || str;
  }
  if (lower.includes('foot') && lower.includes('mouth')) {
    return dict['val_Foot_and_Mouth'] || str;
  }
  if (lower.includes('tick fever')) {
    return dict['val_Tick_Fever'] || str;
  }
  if (lower.includes('tick')) {
    return dict['val_Tick_Infestation'] || str;
  }
  if (lower.includes('lame') || lower.includes('locomotion')) {
    return dict['val_Lameness'] || str;
  }

  // Gender
  if (lower === 'female' || lower.includes('female') || lower.includes('cow') || lower.includes('heifer')) {
    return dict['val_Female'] || str;
  }
  if (lower === 'male' || lower.includes('male') || lower.includes('bull') || lower.includes('ox')) {
    return dict['val_Male'] || str;
  }

  // Breeds
  if (lower.includes('crossbred') || lower.includes('mix')) {
    return dict['val_Crossbred_Cattle'] || str;
  }
  if (lower.includes('gir')) {
    return dict['val_Gir'] || str;
  }
  if (lower.includes('sahiwal')) {
    return dict['val_Sahiwal'] || str;
  }
  if (lower.includes('murrah')) {
    return dict['val_Murrah_Buffalo'] || str;
  }
  if (lower.includes('jersey')) {
    return dict['val_Jersey'] || str;
  }
  if (lower.includes('holstein') || lower.includes('hf')) {
    return dict['val_Holstein_Friesian'] || str;
  }

  // Severity
  if (lower === 'mild') return dict['val_Mild'] || str;
  if (lower === 'moderate') return dict['val_Moderate_Sev'] || dict['val_Moderate'] || str;
  if (lower === 'severe') return dict['val_Severe'] || str;
  if (lower === 'none' || lower === 'normal') return dict['val_None'] || dict['val_Healthy'] || str;

  // Urgency
  if (lower.includes('urgent')) return dict['val_urgent_veterinary_attention'] || str;
  if (lower.includes('consultation') || lower.includes('recommended')) return dict['val_veterinary_consultation_recommended'] || str;
  if (lower.includes('monitoring') || lower.includes('care')) return dict['val_monitoring'] || str;

  // Product Categories — checked first so full category names like "Udder Hygiene..." don't trigger simple body part words
  if (lower === 'all') return dict['cat_all'] || str;
  if (lower.includes('udder') && (lower.includes('hygiene') || lower.includes('prevention') || lower.includes('disease'))) return dict['cat_udder_hygiene'] || str;
  if (lower.includes('nutrition') || lower.includes('supplement') || lower.includes('feed supplement')) return dict['cat_nutrition'] || str;
  if (lower.includes('detection') || lower.includes('diagnostic')) return dict['cat_diagnostics'] || str;
  if (lower.includes('ethnoveterinary') || lower.includes('evm') || lower.includes('herbal')) return dict['cat_ethnoveterinary'] || str;
  if (lower.includes('reproductive') || lower.includes('reproduction') || lower.includes('fertility')) return dict['cat_reproductive'] || str;
  if (lower.includes('milk') && (lower.includes('quality') || lower.includes('test'))) return dict['cat_milk_quality'] || str;
  if (lower === 'udder' || lower === 'udder hygiene' || lower === 'udder_hygiene') return dict['cat_udder_hygiene'] || str;

  // Body areas (for disease scan results)
  if (lower === 'udder' || (lower.includes('udder') && !lower.includes('sealant'))) return dict['val_Udder'] || str;
  if (lower.includes('teat') && !lower.includes('sealant')) return dict['val_Teat'] || str;
  if (lower.includes('skin') || lower.includes('coat')) return dict['val_Skin'] || str;
  if (lower.includes('eye')) return dict['val_Eyes'] || str;
  if (lower.includes('hoof') || lower.includes('feet') || lower.includes('leg')) return dict['val_Hoof'] || str;
  if (lower.includes('muzzle') || lower.includes('snout')) return dict['val_Muzzle'] || str;

  // Coat Color
  if (lower.includes('black & white') || lower.includes('patch')) {
    return dict['val_Black_White_Patch'] || str;
  }
  if (lower === 'black') return dict['val_Black'] || str;
  if (lower === 'white') return dict['val_White'] || str;
  if (lower === 'brown') return dict['val_Brown'] || str;
  if (lower === 'red') return dict['val_Red'] || str;
  if (lower === 'fawn') return dict['val_Fawn'] || str;
  if (lower === 'grey' || lower === 'gray') return dict['val_Grey'] || str;

  // BCS condition labels
  if (lower === 'emaciated') return dict['val_Emaciated'] || str;
  if (lower === 'thin') return dict['val_Thin'] || str;
  if (lower === 'moderate') return dict['val_Moderate'] || str;
  if (lower === 'ideal') return dict['val_Ideal'] || str;
  if (lower === 'fat') return dict['val_Fat'] || str;
  if (lower === 'obese') return dict['val_Obese'] || str;

  // Product Names & Descriptions
  if (lower.includes('cmt paddle')) {
    if (lang === 'ta') return str.replace(/CMT Paddle/gi, 'சிஎம்டி துடுப்பு (CMT Paddle)');
    if (lang === 'hi') return str.replace(/CMT Paddle/gi, 'सीएमटी पैडल (CMT Paddle)');
  }
  if (lower.includes('finekine')) {
    if (lang === 'ta') return str.replace(/FineKine/gi, 'ஃபைன்கைன் (FineKine)');
    if (lang === 'hi') return str.replace(/FineKine/gi, 'फाइनकाइन (FineKine)');
  }
  if (lower.includes('iogiene')) {
    if (lang === 'ta') return str.replace(/Iogiene/gi, 'அயோஜீன் (Iogiene)');
    if (lang === 'hi') return str.replace(/Iogiene/gi, 'आयोजिन (Iogiene)');
  }

  // Product Descriptions
  if (lower.includes('durable, user-friendly tool') || lower.includes('mastitis testing in dairy animals')) {
    if (lang === 'ta') return 'பால் பண்ணை மாடுகளில் ஆரம்ப நிலை மடிநோயை துல்லியமாக கண்டறிய உதவும் எளிமையான, நம்பகமான சோதனை கருவி.';
    if (lang === 'hi') return 'डेयरी पशुओं में थनैला रोग की त्वरित और सटीक जांच के लिए टिकाऊ एवं उपयोग में आसान परीक्षण उपकरण।';
  }
  if (lower.includes('finekine teat sealant') || (lower.includes('teat sealant is an all-natural solution'))) {
    if (lang === 'ta') return 'பால் கறந்த பின் மடி ஆரோக்கியத்தைப் பாதுகாக்கவும் தொற்று நோய்களைத் தடுக்கவும் இயற்கை மூலிகை அடிப்படையிலான சீலண்ட் கலவை.';
    if (lang === 'hi') return 'दूध निकालने के बाद थन की संपूर्ण सुरक्षा एवं संक्रमण से बचाव के लिए 100% प्राकृतिक सुरक्षात्मक सीलेंट।';
  }
  if (lower.includes('iodine-based teat sealant') || lower.includes('iogiene is an iodine-based')) {
    if (lang === 'ta') return 'பால் கறந்த பின் மடி சுகாதாரத்திற்கான அயோடின் அடிப்படையிலான பாதுகாப்பு தீர்வு. பாக்டீரியா பரவலைத் தடுத்து பால் தரத்தை பாதுகாக்கிறது.';
    if (lang === 'hi') return 'दूध निकालने के बाद अयन स्वच्छता के लिए आयोडीन आधारित सुरक्षात्मक सीलेंट। बैक्टीरिया संक्रमण को रोककर दूध की गुणवत्ता सुधारता है।';
  }

  // Common clinical observation phrases
  if (lower.includes('alert') && (lower.includes('active') || lower.includes('posture'))) {
    if (lang === 'hi') return 'सचेत एवं सक्रिय शारीरिक मुद्रा';
    if (lang === 'ta') return 'விழிப்புணர்வு மற்றும் சுறுசுறுப்பான உடல் தோரணை';
  }
  if (lower.includes('ribs') && lower.includes('visible')) {
    if (lang === 'hi') return 'पसलियां स्पष्ट रूप से दिखाई दे रही हैं (कम वसा आवरण)';
    if (lang === 'ta') return 'விலா எலும்புகள் தெரிகின்றன (குறைந்த கொழுப்பு உறை)';
  }
  if (lower.includes('spine') || lower.includes('backbone')) {
    if (lang === 'hi') return 'रीढ़ की हड्डी पर संतुलित मांसपेशी आवरण';
    if (lang === 'ta') return 'முதுகெலும்பில் சமநிலையான தசை அமைப்பு';
  }
  if (lower.includes('clean') || lower.includes('hygiene')) {
    if (lang === 'hi') return 'शरीर की अच्छी स्वच्छता और साफ-सफाई स्थिति';
    if (lang === 'ta') return 'உடலில் நல்ல தூய்மை மற்றும் சுகாதார நிலை';
  }
  if (lower.includes('coat') && (lower.includes('smooth') || lower.includes('shiny') || lower.includes('good'))) {
    if (lang === 'hi') return 'चमकदार त्वचा और स्वस्थ रोएं';
    if (lang === 'ta') return 'பளபளப்பான தோல் மற்றும் ஆரோக்கியமான முடி';
  }
  if (lower.includes('lesion') || lower.includes('nodule') || lower.includes('lump')) {
    if (lang === 'hi') return 'त्वचा पर उभार अथवा घाव के लक्षण';
    if (lang === 'ta') return 'தோலில் வீக்கம் அல்லது கட்டிகள் காணப்படுகின்றன';
  }
  if (lower.includes('balanced') || lower.includes('ration') || lower.includes('feed')) {
    if (lang === 'hi') return 'खनिजों और प्रोटीन युक्त संतुलित आहार प्रदान करें';
    if (lang === 'ta') return 'தாதுக்கள் மற்றும் புரதம் நிறைந்த சமச்சீர் தீவனம் வழங்கவும்';
  }
  if (lower.includes('veterinary') || lower.includes('vet') || lower.includes('doctor')) {
    if (lang === 'hi') return 'नियमित पशु चिकित्सा जांच एवं टीकाकरण सुनिश्चित करें';
    if (lang === 'ta') return 'வழக்கமான கால்நடை மருத்துவ பரிசோதனை மற்றும் தடுப்பூசி உறுதி செய்யவும்';
  }
  if (lower.includes('suggested for cattle health') || lower.includes('live camera scan')) {
    if (lang === 'hi') return 'लाइव कैमरा स्कैन के आधार पर पशु स्वास्थ्य के लिए अनुशंसित';
    if (lang === 'ta') return 'நேரடி கேமரா ஸ்கேன் அடிப்படையில் கால்நடை ஆரோக்கியத்திற்கு பரிந்துரைக்கப்படுகிறது';
  }

  return str;
}
