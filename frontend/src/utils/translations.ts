export type Language = 'en' | 'hi' | 'gu' | 'pa' | 'mr' | 'ta' | 'te' | 'kn' | 'bn';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    nav_home: 'Home',
    nav_live: 'Live 10s Scan',
    nav_bcs: 'BCS Detection',
    nav_disease: 'Disease Detection',
    nav_history: 'History',
    nav_products: 'Products',
    nav_signin: 'Sign in',
    nav_signout: 'Sign out',
    nav_download_app: 'Download iHerd App',
    
    // Landing
    hero_badge: 'AI Cattle Health Intelligence',
    hero_title: 'Instant Cattle BCS & Health Screening with 10s Video AI',
    hero_subtitle: 'Upload a 10-second camera clip to extract clear frame shots, score Body Condition (BCS 1-5), detect early disease signs, and download PDF reports.',
    hero_start_scan: 'Start Live 10s Camera Scan',
    hero_explore_bcs: 'Explore BCS Detection',
    feature_bcs_title: 'Precision BCS Scoring',
    feature_bcs_desc: 'Analyzes subcutaneous fat cover across ribs, hooks, and tailhead using 5-point scale.',
    feature_disease_title: 'Early Disease Detection',
    feature_disease_desc: 'Screen for mastitis, skin nodules, lameness, and eye/nasal discharges.',
    feature_pdf_title: 'Instant PDF Health Reports',
    feature_pdf_desc: 'Generate complete veterinary diagnostic PDFs with product recommendations.',

    // Scanner & Camera
    scan_upload_title: 'Live 10s Camera Video & Photo Analysis',
    scan_upload_desc: 'Record a 10-second video of your cow or buffalo. Our AI extracts optimal frames for instant diagnostic analysis.',
    scan_record_camera: 'Record Live Camera Video',
    scan_select_file: 'Select Video / Photo File',
    scan_analyzing: 'Analyzing Cattle Video & Frames...',
    scan_extracted_frames: 'Extracted Frames (Min 3 to Max 10)',
    scan_clarity_score: 'Clarity Score',
    scan_pdf_report: 'Download PDF Report',

    // Results & Products
    res_bcs_score: 'Body Condition Score (BCS)',
    res_condition: 'Screened Condition',
    res_severity: 'Severity Level',
    res_observations: 'Clinical Observations',
    res_recommendations: 'Actionable Protocols',
    res_ai_reply: 'AI Veterinary Specialist Reply',
    res_recommended_products: 'Recommended Feeds & Medicines',
    prod_store_title: 'Cattle Health & Veterinary Care Store',
    prod_buy_online: 'Buy Online',
  },

  hi: {
    // Nav
    nav_home: 'मुख्य पृष्ठ',
    nav_live: 'लाइव 10s स्कैन',
    nav_bcs: 'बीसीएस जांच (BCS)',
    nav_disease: 'रोग पहचान (Disease)',
    nav_history: 'इतिहास',
    nav_products: 'पशु उत्पाद',
    nav_signin: 'साइन इन करें',
    nav_signout: 'साइन आउट',
    nav_download_app: 'iHerd ऐप डाउनलोड करें',
    
    // Landing
    hero_badge: 'एआई पशु स्वास्थ्य इंटेलिजेंस',
    hero_title: '10 सेकंड के वीडियो एआई से पशु शरीर स्कोर और रोग पहचान',
    hero_subtitle: 'पशु का 10 सेकंड का वीडियो अपलोड करें, बॉडी कंडीशन स्कोर (BCS 1-5) और रोगों की सटीक जानकारी और पीडीएफ रिपोर्ट पाएं।',
    hero_start_scan: 'लाइव 10s कैमरा स्कैन शुरू करें',
    hero_explore_bcs: 'बीसीएस जांच देखें',
    feature_bcs_title: 'सटीक बीसीएस स्कोरिंग',
    feature_bcs_desc: 'पसली, पीठ और पूंछ के पास की वसा परत का 5-पॉइंट स्केल पर सटीक विश्लेषण।',
    feature_disease_title: 'शुरुआती रोग पहचान',
    feature_disease_desc: 'मस्टाइटिस (थनैला), लंपी त्वचा रोग और लंगड़ापन की शुरुआती जांच।',
    feature_pdf_title: 'तुरंत पीडीएफ स्वास्थ्य रिपोर्ट',
    feature_pdf_desc: 'पशु चिकित्सक सलाह और दवा सिफारिशों के साथ पूर्ण रिपोर्ट डाउनलोड करें।',

    // Scanner & Camera
    scan_upload_title: 'लाइव 10s कैमरा वीडियो और फोटो विश्लेषण',
    scan_upload_desc: 'अपनी गाय या भैंस का 10 सेकंड का वीडियो रिकॉर्ड करें। हमारा एआई सबसे स्पष्ट फ्रेम चुनकर जांच करता है।',
    scan_record_camera: 'लाइव कैमरा वीडियो रिकॉर्ड करें',
    scan_select_file: 'वीडियो / फोटो चुनें',
    scan_analyzing: 'पशु वीडियो और फ्रेम का विश्लेषण हो रहा है...',
    scan_extracted_frames: 'निकाले गए फ्रेम (न्यूनतम 3 से अधिकतम 10)',
    scan_clarity_score: 'स्पष्टता स्कोर',
    scan_pdf_report: 'पीडीएफ रिपोर्ट डाउनलोड करें',

    // Results & Products
    res_bcs_score: 'बॉडी कंडीशन स्कोर (BCS)',
    res_condition: 'पहचाना गया रोग / स्थिति',
    res_severity: 'गंभीरता का स्तर',
    res_observations: 'नैदानिक अवलोकन',
    res_recommendations: 'आवश्यक कदम व उपचार',
    res_ai_reply: 'एआई पशु चिकित्सक परामर्श',
    res_recommended_products: 'अनुशंसित आहार और दवाएं',
    prod_store_title: 'पशु स्वास्थ्य एवं पोषण स्टोर',
    prod_buy_online: 'ऑनलाइन खरीदें',
  },

  gu: {
    // Nav
    nav_home: 'મુખ્ય પૃષ્ઠ',
    nav_live: 'લાઇવ 10s સ્કેન',
    nav_bcs: 'બીસીએસ તપાસ (BCS)',
    nav_disease: 'રોગ નિદાન (Disease)',
    nav_history: 'ઇતિહાસ',
    nav_products: 'પશુ ઉત્પાદનો',
    nav_signin: 'સાઇન ઇન કરો',
    nav_signout: 'સાઇન આઉટ',
    nav_download_app: 'iHerd એપ ડાઉનલોડ કરો',
    
    // Landing
    hero_badge: 'એઆઈ પશુ આરોગ્ય ઇન્ટેલિજન્સ',
    hero_title: '10 સેકન્ડના વીડિયો એઆઈ દ્વારા પશુ શારીરિક સ્કોર અને રોગ નિદાન',
    hero_subtitle: 'તમારી ગાય કે ભેંસનો 10 સેકન્ડનો વીડિયો અપલોડ કરી બીસીએસ સ્કોર (1-5), રોગ નિદાન અને પીડીએફ રિપોર્ટ મેળવો.',
    hero_start_scan: 'લાઇવ 10s કેમેરા સ્કેન શરૂ કરો',
    hero_explore_bcs: 'બીસીએસ તપાસ જુઓ',
    feature_bcs_title: 'ચોક્કસ બીસીએસ સ્કોરિંગ',
    feature_bcs_desc: 'પાંસળી અને પીઠ પર ચરબીના થરનું ચોક્કસ 5-પોઇન્ટ સ્કેલ પર વિશ્લેષણ.',
    feature_disease_title: 'વહેલું રોગ નિદાન',
    feature_disease_desc: 'મસ્ટીટીસ (મસ્તરોગ), લમ્પી સ્કીન અને લંગડાપણુંનું નિદાન.',
    feature_pdf_title: 'ત્વરિત પીડીએફ હેલ્થ રિપોર્ટ',
    feature_pdf_desc: 'વેટરનરી ડાયગ્નોસ્ટિક પીડીએફ અને દવાઓની ભલામણ સાથે ડાઉનલોડ કરો.',

    // Scanner & Camera
    scan_upload_title: 'લાઇવ 10s કેમેરા વીડિયો અને ફોટો વિશ્લેષણ',
    scan_upload_desc: 'તમારા પશુનો 10 સેકન્ડનો વીડિયો રેકોર્ડ કરો. એઆઈ આપોઆપ શ્રેષ્ઠ ફ્રેમ પસંદ કરશે.',
    scan_record_camera: 'લાઇવ કેમેરા વીડિયો રેકોર્ડ કરો',
    scan_select_file: 'વીડિયો / ફોટો પસંદ કરો',
    scan_analyzing: 'વીડિયો અને ફ્રેમનું વિશ્લેષણ થઈ રહ્યું છે...',
    scan_extracted_frames: 'પસંદ કરેલ ફ્રેમ્સ (3 થી 10)',
    scan_clarity_score: 'ક્લેરિટી સ્કોર',
    scan_pdf_report: 'પીડીએફ રિપોર્ટ ડાઉનલોડ કરો',

    // Results & Products
    res_bcs_score: 'બોડી કન્ડીશન સ્કોર (BCS)',
    res_condition: 'નિદાન થયેલ પરિસ્થિતિ',
    res_severity: 'ગંભીરતાનું સ્તર',
    res_observations: 'મુખ્ય અવલોકનો',
    res_recommendations: 'ભલામણ કરેલ પગલાં',
    res_ai_reply: 'એઆઈ પશુ ચિકિત્સક સલાહ',
    res_recommended_products: 'ભલામણ કરેલ ખોરાક અને દવાઓ',
    prod_store_title: 'પશુ આરોગ્ય અને પોષણ સ્ટોર',
    prod_buy_online: 'ઓનલાઇન ખરીદો',
  },

  pa: {
    // Nav
    nav_home: 'ਮੁੱਖ ਸਫ਼ਾ',
    nav_live: 'ਲਾਈਵ 10s ਸਕੈਨ',
    nav_bcs: 'ਬੀ.ਸੀ.ਐਸ. ਜਾਂਚ',
    nav_disease: 'ਬੀਮਾਰੀ ਦੀ ਪਛਾਣ',
    nav_history: 'ਇਤਿਹਾਸ',
    nav_products: 'ਪਸ਼ੂ ਉਤਪਾਦ',
    nav_signin: 'ਸਾਈਨ ਇਨ ਕਰੋ',
    nav_signout: 'ਸਾਈਨ ਆਊਟ',
    nav_download_app: 'iHerd ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ',

    // Landing
    hero_badge: 'ਏ.ਆਈ. ਪਸ਼ੂ ਸਿਹਤ ਇੰਟੈਲੀਜੈਂਸ',
    hero_title: '10 ਸੈਕਿੰਡ ਦੀ ਵੀਡੀਓ ਏ.ਆਈ. ਨਾਲ ਪਸ਼ੂ ਦਾ ਸਰੀਰਕ ਸਕੋਰ ਅਤੇ ਬੀਮਾਰੀ ਜਾਂਚ',
    hero_subtitle: 'ਗਾਂ/ਮੱਝ ਦੀ 10 ਸੈਕਿੰਡ ਵੀਡੀਓ ਅੱਪਲੋਡ ਕਰੋ, ਬੀ.ਸੀ.ਐਸ. ਸਕੋਰ (1-5), ਬੀਮਾਰੀ ਦੀ ਜਾਂਚ ਅਤੇ ਪੀ.ਡੀ.ਐਫ. ਰਿਪੋਰਟ ਪ੍ਰਾਪਤ ਕਰੋ।',
    hero_start_scan: 'ਲਾਈਵ 10s ਕੈਮਰਾ ਸਕੈਨ ਸ਼ੁਰੂ ਕਰੋ',
    hero_explore_bcs: 'ਬੀ.ਸੀ.ਐਸ. ਜਾਂਚ ਵੇਖੋ',
    feature_bcs_title: 'ਸਟੀਕ ਬੀ.ਸੀ.ਐਸ. ਸਕੋਰਿੰਗ',
    feature_bcs_desc: 'ਪਸਲੀਆਂ ਅਤੇ ਪਿੱਠ ਦੀ ਚਰਬੀ ਦਾ 5-ਪੁਆਇੰਟ ਸਕੇਲ ਤੇ ਸਟੀਕ ਮੁਲਾਂਕਣ।',
    feature_disease_title: 'ਬੀਮਾਰੀ ਦੀ ਪਹਿਲਾਂ ਪਛਾਣ',
    feature_disease_desc: 'ਥਨੈਲਾ (Mastitis), ਲੰਪੀ ਸਕਿਨ ਅਤੇ ਲੰਗੜੇਪਣ ਦੀ ਸ਼ੁਰੂਆਤੀ ਜਾਂਚ।',
    feature_pdf_title: 'ਤੁਰੰਤ PDF ਸਿਹਤ ਰਿਪੋਰਟ',
    feature_pdf_desc: 'ਡਾਕਟਰੀ ਸਲਾਹ ਅਤੇ ਦਵਾਈਆਂ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਨਾਲ ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ।',

    // Scanner & Camera
    scan_upload_title: 'ਲਾਈਵ 10s ਕੈਮਰਾ ਵੀਡੀਓ ਅਤੇ ਫੋਟੋ ਜਾਂਚ',
    scan_upload_desc: 'ਆਪਣੇ ਪਸ਼ੂ ਦੀ 10 ਸੈਕਿੰਡ ਵੀਡੀਓ ਬਣਾਓ। ਏ.ਆਈ. ਸਭ ਤੋਂ ਸਾਫ਼ ਫ੍ਰੇਮ ਚੁਣ ਕੇ ਜਾਂਚ ਕਰੇਗਾ।',
    scan_record_camera: 'ਲਾਈਵ ਕੈਮਰਾ ਵੀਡੀਓ ਰਿਕਾਰਡ ਕਰੋ',
    scan_select_file: 'ਵੀਡੀਓ / ਫੋਟੋ ਚੁਣੋ',
    scan_analyzing: 'ਵੀਡੀਓ ਅਤੇ ਫ੍ਰੇਮਾਂ ਦੀ ਜਾਂਚ ਹੋ ਰਹੀ ਹੈ...',
    scan_extracted_frames: 'ਚੁਣੇ ਗਏ ਫ੍ਰੇਮ (3 ਤੋਂ 10)',
    scan_clarity_score: 'ਸਪੱਸ਼ਟਤਾ ਸਕੋਰ',
    scan_pdf_report: 'PDF ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ',

    // Results & Products
    res_bcs_score: 'ਬੋਡੀ ਕੰਡੀਸ਼ਨ ਸਕੋਰ (BCS)',
    res_condition: 'ਬੀਮਾਰੀ / ਸਥਿਤੀ',
    res_severity: 'ਗੰਭੀਰਤਾ ਦਾ ਪੱਧਰ',
    res_observations: 'ਮੁੱਖ ਨਿਰੀਖਣ',
    res_recommendations: 'ਲੋੜੀਂਦੇ ਕਦਮ',
    res_ai_reply: 'ਏ.ਆਈ. ਡਾਕਟਰੀ ਸਲਾਹ',
    res_recommended_products: 'ਸਿਫ਼ਾਰਸ਼ ਕੀਤੀਆਂ ਦਵਾਈਆਂ ਅਤੇ ਖੁਰਾਕ',
    prod_store_title: 'ਪਸ਼ੂ ਸਿਹਤ ਅਤੇ ਖੁਰਾਕ ਸਟੋਰ',
    prod_buy_online: 'ਔਨਲਾਈਨ ਖਰੀਦੋ',
  },

  mr: {
    // Nav
    nav_home: 'मुख्य पृष्ठ',
    nav_live: 'लाइव्ह 10s स्कॅन',
    nav_bcs: 'बीसीएस तपासणी (BCS)',
    nav_disease: 'आजार निदान (Disease)',
    nav_history: 'इतिहास',
    nav_products: 'पशू उत्पादने',
    nav_signin: 'साइन इन करा',
    nav_signout: 'साइन आउट',
    nav_download_app: 'iHerd अ‍ॅप डाउनलोड करा',

    // Landing
    hero_badge: 'एआय पशू आरोग्य बुद्धिमत्ता',
    hero_title: '१० सेकंदांच्या व्हिडिओ एआयने जनावर शरीर स्कोअर आणि आजार निदान',
    hero_subtitle: 'गाई/म्हशीचा १० सेकंदांचा व्हिडिओ अपलोड करा, बीसीएस स्कोअर (१-५), आजार निदान आणि पीडीएफ रिपोर्ट मिळवा.',
    hero_start_scan: 'लाइव्ह 10s कॅमेरा स्कॅन सुरू करा',
    hero_explore_bcs: 'बीसीएस तपासणी पहा',
    feature_bcs_title: 'अचूक बीसीएस स्कोअरिंग',
    feature_bcs_desc: 'बरगड्या आणि पाठीवरील चरबीच्या थराचे ५-पॉइंट स्केलवर अचूक विश्लेषण.',
    feature_disease_title: 'लवकर आजार ओळख',
    feature_disease_desc: 'मस्टायटिस (स्तनदाह), लंपी त्वचा आजार आणि लंगडेपणाची प्राथमिक तपासणी.',
    feature_pdf_title: 'त्वरित पीडीएफ आरोग्य अहवाल',
    feature_pdf_desc: 'वैद्यकीय सल्ला आणि औषधांच्या शिफारसीसह अहवाल डाउनलोड करा.',

    // Scanner & Camera
    scan_upload_title: 'लाइव्ह 10s कॅमेरा व्हिडिओ आणि फोटो विश्लेषण',
    scan_upload_desc: 'तुमच्या जनावराचा १० सेकंदांचा व्हिडिओ रेकॉर्ड करा. एआय आपोआप स्पष्ट फ्रेम निवडून तपासणी करेल.',
    scan_record_camera: 'लाइव्ह कॅमेरा व्हिडिओ रेकॉर्ड करा',
    scan_select_file: 'व्हिडिओ / फोटो निवडा',
    scan_analyzing: 'व्हिडिओ आणि फ्रेमचे विश्लेषण होत आहे...',
    scan_extracted_frames: 'निवडलेले फ्रेम्स (३ ते १०)',
    scan_clarity_score: 'स्पष्टता स्कोअर',
    scan_pdf_report: 'पीडीएफ रिपोर्ट डाउनलोड करा',

    // Results & Products
    res_bcs_score: 'बॉडी कंडिशन स्कोअर (BCS)',
    res_condition: 'निदान झालेला आजार',
    res_severity: 'गंभीरता पातळी',
    res_observations: 'महत्त्वाचे निरीक्षण',
    res_recommendations: 'उपाय व शिफारसी',
    res_ai_reply: 'एआय पशुवैद्यकीय सल्ला',
    res_recommended_products: 'शिफारस केलेले खाद्य व औषधे',
    prod_store_title: 'पशू आरोग्य व पोषण दालन',
    prod_buy_online: 'ऑनलाइन खरेदी करा',
  },

  ta: {
    // Nav
    nav_home: 'முகப்பு',
    nav_live: 'லைவ் 10s ஸ்கேன்',
    nav_bcs: 'பிசிஎஸ் பரிசோதனை (BCS)',
    nav_disease: 'நோய் கண்டறிதல்',
    nav_history: 'வரலாறு',
    nav_products: 'கால்நடை தயாரிப்புகள்',
    nav_signin: 'உள்நுழைய',
    nav_signout: 'வெளியேறு',
    nav_download_app: 'iHerd செயலியை பதிவிறக்குக',

    // Landing
    hero_badge: 'AI கால்நடை சுகாதார அறிவகம்',
    hero_title: '10 வினாடி வீடியோ AI மூலம் கால்நடை உடல் நிலை மற்றும் நோய் பரிசோதனை',
    hero_subtitle: 'பசு அல்லது எருமையின் 10 வினாடி வீடியோவை பதிவேற்றி, BCS ஸ்கோர் (1-5), நோய் அறியுதல் மற்றும் PDF அறிக்கை பெறவும்.',
    hero_start_scan: 'லைவ் 10s கேமரா ஸ்கேன் தொடங்கவும்',
    hero_explore_bcs: 'BCS பரிசோதனையை பார்க்க',
    feature_bcs_title: 'துல்லியமான BCS மதிப்பீடு',
    feature_bcs_desc: 'விலா எலும்புகள் மற்றும் கொழுப்பு அடுக்கை 5-புள்ளி அளவீட்டில் துல்லியமாக பகுப்பாய்வு செய்கிறது.',
    feature_disease_title: 'ஆரம்பகால நோய் கண்டறிதல்',
    feature_disease_desc: 'மடிநோய் (Mastitis), லம்பி தோல் நோய் மற்றும் நொண்டி நிலையை ஆரம்பத்திலேயே கண்டறியலாம்.',
    feature_pdf_title: 'உடனடி PDF மருத்துவ அறிக்கை',
    feature_pdf_desc: 'கால்நடை மருத்துவர் பரிந்துரைகளுடன் முழுமையான அறிக்கையை பதிவிறக்கவும்.',

    // Scanner & Camera
    scan_upload_title: 'லைவ் 10s கேமரா வீடியோ மற்றும் புகைப்பட பகுப்பாய்வு',
    scan_upload_desc: 'உங்கள் கால்நடையின் 10 வினாடி வீடியோவை பதிவு செய்யுங்கள். AI துல்லியமான படங்களை தேர்ந்தெடுக்கும்.',
    scan_record_camera: 'கேமரா வீடியோ பதிவு செய்',
    scan_select_file: 'வீடியோ / படம் தேர்வு செய்',
    scan_analyzing: 'வீடியோ பகுப்பாய்வு செய்யப்படுகிறது...',
    scan_extracted_frames: 'தேர்ந்தெடுக்கப்பட்ட படங்கள் (3 முதல் 10)',
    scan_clarity_score: 'தெளிவு மதிப்பெண்',
    scan_pdf_report: 'PDF அறிக்கை பதிவிறக்கு',

    // Results & Products
    res_bcs_score: 'உடல் நிலை மதிப்பெண் (BCS)',
    res_condition: 'கண்டறியப்பட்ட நோய்',
    res_severity: 'பாதிப்பு நிலை',
    res_observations: 'முக்கிய அவதானிப்புகள்',
    res_recommendations: 'பரிந்துரைக்கப்பட்ட நடவடிக்கைகள்',
    res_ai_reply: 'AI கால்நடை மருத்துவ ஆலோசனை',
    res_recommended_products: 'பரிந்துரைக்கப்பட்ட தீவனம் மற்றும் மருந்துகள்',
    prod_store_title: 'கால்நடை பராமரிப்பு & மருந்து கடை',
    prod_buy_online: 'ஆன்லைனில் வாங்கவும்',
  },

  te: {
    // Nav
    nav_home: 'హోమ్',
    nav_live: 'లైవ్ 10s స్కాన్',
    nav_bcs: 'BCS శరీరం స్కోర్',
    nav_disease: 'వ్యాధి నిర్ధారణ',
    nav_history: 'చరిత్ర',
    nav_products: 'పశువుల ఉత్పత్తులు',
    nav_signin: 'సైన్ ఇన్ చేయండి',
    nav_signout: 'సైన్ అవుట్',
    nav_download_app: 'iHerd యాప్ డౌన్‌లోడ్ చేయండి',

    // Landing
    hero_badge: 'AI పశు ఆరోగ్య ఇంటెలిజెన్స్',
    hero_title: '10 సెకన్ల వీడియో AI ద్వారా పశువుల శరీర స్కోరు & వ్యాధి నిర్ధారణ',
    hero_subtitle: 'మీ ఆవు లేదా గేదె 10 సెకన్ల వీడియో అప్‌లోడ్ చేసి, BCS స్కోరు (1-5), వ్యాధి నిర్ధారణ మరియు PDF నివేదిక పొందండి.',
    hero_start_scan: 'లైవ్ 10s కెమెరా స్కాన్ ప్రారంభించండి',
    hero_explore_bcs: 'BCS పరిశీలన చూడండి',
    feature_bcs_title: 'ఖచ్చితమైన BCS స్కోరింగ్',
    feature_bcs_desc: 'పక్కటెముకలు మరియు కొవ్వు పొరను 5-పాయింట్ స్కేల్‌పై ఖచ్చితంగా విశ్లేషిస్తుంది.',
    feature_disease_title: 'ప్రారంభ వ్యాధి గుర్తింపు',
    feature_disease_desc: 'పొదుగు వాపు (Mastitis), లంపీ చర్మ వ్యాధి మరియు కుంటితనాన్ని త్వరగా గుర్తించవచ్చు.',
    feature_pdf_title: 'తక్షణ PDF ఆరోగ్య నివేదిక',
    feature_pdf_desc: 'పశువైద్య నిపుణుల సలహాలు మరియు మందుల సిఫార్సులతో నివేదిక డౌన్‌లోడ్ చేయండి.',

    // Scanner & Camera
    scan_upload_title: 'లైవ్ 10s కెమెరా వీడియో & ఫోటో విశ్లేషణ',
    scan_upload_desc: 'మీ పశువు 10 సెకన్ల వీడియో రికార్డ్ చేయండి. AI స్పష్టమైన ఫ్రేమ్‌లను ఎంచుకుంటుంది.',
    scan_record_camera: 'లైవ్ కెమెరా వీడియో రికార్డ్ చేయండి',
    scan_select_file: 'వీడియో / ఫోటో ఎంచుకోండి',
    scan_analyzing: 'వీడియో విశ్లేషణ జరుగుతోంది...',
    scan_extracted_frames: 'ఎంచుకున్న ఫ్రేమ్‌లు (3 నుండి 10)',
    scan_clarity_score: 'స్పష్టత స్కోరు',
    scan_pdf_report: 'PDF నివేదిక డౌన్‌లోడ్ చేయండి',

    // Results & Products
    res_bcs_score: 'బాడీ కండిషన్ స్కోరు (BCS)',
    res_condition: 'గుర్తించిన వ్యాధి / పరిస్థితి',
    res_severity: 'తీవ్రత స్థాయి',
    res_observations: 'ముఖ్యమైన పరిశీలనలు',
    res_recommendations: 'చేయవలసిన పనులు',
    res_ai_reply: 'AI పశువైద్య సలహా',
    res_recommended_products: 'సిఫార్సు చేసిన దాణా మరియు మందులు',
    prod_store_title: 'పశు ఆరోగ్య & పోషణ స్టోర్',
    prod_buy_online: 'ఆన్‌లైన్‌లో కొనండి',
  },

  kn: {
    // Nav
    nav_home: 'ಮುಖಪುಟ',
    nav_live: 'ಲೈವ್ 10s ಸ್ಕ್ಯಾನ್',
    nav_bcs: 'BCS ಶರೀರ ಸ್ಕೋರ್',
    nav_disease: 'ರೋಗ ಪತ್ತೆ (Disease)',
    nav_history: 'ಇತಿಹಾಸ',
    nav_products: 'ಸಾಕುಪ್ರಾಣಿ ಉತ್ಪನ್ನಗಳು',
    nav_signin: 'ಸೈನ್ ಇನ್ ಮಾಡಿ',
    nav_signout: 'ಸೈನ್ ಔಟ್',
    nav_download_app: 'iHerd ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',

    // Landing
    hero_badge: 'AI ಪಶು ಆರೋಗ್ಯ ತಂತ್ರಜ್ಞಾನ',
    hero_title: '10 ಸೆಕೆಂಡ್ ವಿಡಿಯೋ AI ಮೂಲಕ ಪಶು ಶರೀರ ಸ್ಕೋರ್ ಮತ್ತು ರೋಗ ಪತ್ತೆ',
    hero_subtitle: 'ನಿಮ್ಮ ಹಸು ಅಥವಾ ಎಮ್ಮೆಯ 10 ಸೆಕೆಂಡ್ ವಿಡಿಯೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ BCS ಸ್ಕೋರ್ (1-5), ರೋಗ ನಿರ್ಧಾರ ಮತ್ತು PDF ವರದಿ ಪಡೆಯಿರಿ.',
    hero_start_scan: 'ಲೈವ್ 10s ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನ್ ಪ್ರಾರಂಭಿಸಿ',
    hero_explore_bcs: 'BCS ಪರಿಶೀಲನೆ ನೋಡಿ',
    feature_bcs_title: 'ಖಚಿತ BCS ಸ್ಕೋರಿಂಗ್',
    feature_bcs_desc: 'ಪಕ್ಕಟೆಲುಬು ಮತ್ತು ಕೊಬ್ಬಿನ ಪದರವನ್ನು 5-ಪಾಯಿಂಟ್ ಸ್ಕೇಲ್‌ನಲ್ಲಿ ಖಚಿತವಾಗಿ ವಿಶ್ಲೇಷಿಸುತ್ತದೆ.',
    feature_disease_title: 'ಆರಂಭಿಕ ರೋಗ ಪತ್ತೆ',
    feature_disease_desc: 'ಕೆಚ್ಚಲು ಬಾವು (Mastitis), ಲಂಪಿ ಚರ್ಮ ರೋಗ ಮತ್ತು ಕುಂಟತನವನ್ನು ಆರಂಭದಲ್ಲೇ ಪತ್ತೆ ಮಾಡಿ.',
    feature_pdf_title: 'ತಕ್ಷಣದ PDF ಆರೋಗ್ಯ ವರದಿ',
    feature_pdf_desc: 'ಪಶುವೈದ್ಯರ ಸಲಹೆ ಮತ್ತು ಔಷಧಗಳ ಶಿಫಾರಸಿನೊಂದಿಗೆ ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.',

    // Scanner & Camera
    scan_upload_title: 'ಲೈವ್ 10s ಕ್ಯಾಮೆರಾ ವಿಡಿಯೋ ಮತ್ತು ಫೋಟೋ ವಿಶ್ಲೇಷಣೆ',
    scan_upload_desc: 'ನಿಮ್ಮ ಪಶುವಿನ 10 ಸೆಕೆಂಡ್ ವಿಡಿಯೋ ರೆಕಾರ್ಡ್ ಮಾಡಿ. AI ಅತ್ಯುತ್ತಮ ಫ್ರೇಮ್‌ಗಳನ್ನು ಆಯ್ಕೆ ಮಾಡುತ್ತದೆ.',
    scan_record_camera: 'ಕ್ಯಾಮೆರಾ ವಿಡಿಯೋ ರೆಕಾರ್ಡ್ ಮಾಡಿ',
    scan_select_file: 'ವಿಡಿಯೋ / ಫೋಟೋ ಆಯ್ಕೆ ಮಾಡಿ',
    scan_analyzing: 'ವಿಡಿಯೋ ವಿಶ್ಲೇಷಣೆ ನಡೆಯುತ್ತಿದೆ...',
    scan_extracted_frames: 'ಆಯ್ಕೆಯಾದ ಫ್ರೇಮ್‌ಗಳು (3 ರಿಂದ 10)',
    scan_clarity_score: 'ಸ್ಪಷ್ಟತೆ ಸ್ಕೋರ್',
    scan_pdf_report: 'PDF ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',

    // Results & Products
    res_bcs_score: 'ಬಾಡಿ ಕಂಡಿಷನ್ ಸ್ಕೋರ್ (BCS)',
    res_condition: 'ಪತ್ತೆಯಾದ ರೋಗ / ಸ್ಥಿತಿ',
    res_severity: 'ತೀವ್ರತೆಯ ಮಟ್ಟ',
    res_observations: 'ಮುಖ್ಯ ವೀಕ್ಷಣೆಗಳು',
    res_recommendations: 'ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು',
    res_ai_reply: 'AI ಪಶುವೈದ್ಯರ ಸಲಹೆ',
    res_recommended_products: 'ಶಿಫಾರಸು ಮಾಡಿದ ಆಹಾರ ಮತ್ತು ಔಷಧಗಳು',
    prod_store_title: 'ಪಶು ಆರೋಗ್ಯ ಮತ್ತು ಪೋಷಣೆ ಅಂಗಡಿ',
    prod_buy_online: 'ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಖರೀದಿಸಿ',
  },

  bn: {
    // Nav
    nav_home: 'হোম',
    nav_live: 'লাইভ 10s স্ক্যান',
    nav_bcs: 'বিসিএস স্কোর (BCS)',
    nav_disease: 'রোগ শনাক্তকরণ',
    nav_history: 'ইতিহাস',
    nav_products: 'পশু পণ্য',
    nav_signin: 'সাইন ইন করুন',
    nav_signout: 'সাইন আউট',
    nav_download_app: 'iHerd অ্যাপ ডাউনলোড করুন',

    // Landing
    hero_badge: 'এআই গবাদি পশু স্বাস্থ্য কৃত্রিম বুদ্ধিমত্তা',
    hero_title: '১০ সেকেন্ডের ভিডিও এআই দিয়ে গবাদি পশুর বডি স্কোর এবং রোগ শনাক্তকরণ',
    hero_subtitle: 'আপনার গরু বা মহিষের ১০ সেকেন্ডের ভিডিও আপলোড করে বডি কন্ডিশন স্কোর (BCS ১-৫), রোগ পরীক্ষা এবং পিডিএফ রিপোর্ট পান।',
    hero_start_scan: 'লাইভ 10s ক্যামেরা স্ক্যান শুরু করুন',
    hero_explore_bcs: 'বিসিএস পরীক্ষা দেখুন',
    feature_bcs_title: 'সঠিক বিসিএস স্কোয়ারিং',
    feature_bcs_desc: 'পাঁজর এবং চর্বির স্তর ৫-পয়েন্ট স্কেলে নিখুঁতভাবে বিশ্লেষণ করে।',
    feature_disease_title: 'প্রাথমিক রোগ শনাক্তকরণ',
    feature_disease_desc: 'ওলান ফোলা (ম্যাস্টাইটিস), লাম্পি স্কিন এবং খুড়িয়ে চলা প্রাথমিক পর্যায়ে শনাক্ত করুন।',
    feature_pdf_title: 'তাত্ক্ষণিক পিডিএফ স্বাস্থ্য রিপোর্ট',
    feature_pdf_desc: 'পশু চিকিৎসকের পরামর্শ ও ওষুধের সুপারিশসহ রিপোর্ট ডাউনলোড করুন।',

    // Scanner & Camera
    scan_upload_title: 'লাইভ 10s ক্যামেরা ভিডিও ও ছবি বিশ্লেষণ',
    scan_upload_desc: 'আপনার পশুর ১০ সেকেন্ডের ভিডিও রেকর্ড করুন। এআই স্পষ্ট ফ্রেম বেছে নিয়ে পরীক্ষা করবে।',
    scan_record_camera: 'লাইভ ক্যামেরা ভিডিও রেকর্ড করুন',
    scan_select_file: 'ভিডিও / ছবি নির্বাচন করুন',
    scan_analyzing: 'ভিডিও এবং ফ্রেম বিশ্লেষণ করা হচ্ছে...',
    scan_extracted_frames: 'সংগৃহীত ফ্রেমসমূহ (৩ থেকে ১০)',
    scan_clarity_score: 'স্পষ্টতা স্কোর',
    scan_pdf_report: 'পিডিএফ রিপোর্ট ডাউনলোড করুন',

    // Results & Products
    res_bcs_score: 'বডি কন্ডিশন স্কোর (BCS)',
    res_condition: 'শনাক্তকৃত রোগ / অবস্থা',
    res_severity: 'ঝুঁকির মাত্রা',
    res_observations: 'গুরুত্বপূর্ণ পর্যবেক্ষণ',
    res_recommendations: 'করণীয় পদক্ষেপ',
    res_ai_reply: 'এআই পশু চিকিৎসক পরামর্শ',
    res_recommended_products: 'সুপারিশকৃত খাবার ও ওষুধ',
    prod_store_title: 'পশু স্বাস্থ্য ও পুষ্টি দোকান',
    prod_buy_online: 'অনলাইনে কিনুন',
  },
};
