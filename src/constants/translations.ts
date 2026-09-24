import { Language } from '@/lib/profile-storage';

export type SupportedLanguage = Language; // 'English' | 'Tamil' | 'Hindi'
export type LanguageCode = 'en' | 'ta' | 'hi';

export interface StepItem {
  type: 'step';
  stepNumber: number;
  totalSteps: number;
  phase: string;
  text: string;
  durationMs: number;
}

export interface WarningItem {
  type: 'warning';
  title: string;
  phase: string;
  triggers: string[];
  responseRule: string;
  durationMs: number;
}

export type SequenceItem = StepItem | WarningItem;

export interface TranslationSet {
  locale: string; // 'en-IN', 'ta-IN', 'hi-IN'
  sequence: SequenceItem[];
  buttons: {
    repeat: string;
    repeatSub: string;
    goBack: string;
    goBackSub: string;
    next: string;
    nextSub: string;
    getAmbulance: string;
    getAmbulanceSub: string;
    getAmbulanceSubPractice: string;
    talkToDoctor: string;
    talkToDoctorSub: string;
    talkToDoctorSubPractice: string;
    restartSequence: string;
    returnHome: string;
  };
  completion: {
    titleEmergency: string;
    titlePractice: string;
    subtitleEmergency: string;
    subtitlePractice: string;
  };
  ui: {
    step: string;
    of: string;
    warningCard: string;
    autoAdvancingIn: string;
    stayingOnScreenFor: string;
    practiceModeBanner: string;
  };
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationSet> = {
  English: {
    locale: 'en-IN',
    sequence: [
      {
        type: 'step',
        stepNumber: 1,
        totalSteps: 10,
        phase: 'BEFORE BIRTH',
        text: 'Call for help immediately (102 or 108)',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 2,
        totalSteps: 10,
        phase: 'BEFORE BIRTH',
        text: 'Call a known doctor/midwife if available',
        durationMs: 12000,
      },
      {
        type: 'warning',
        title: 'If any of these happen, stop and get real help immediately',
        phase: 'CRITICAL SAFETY CHECK',
        triggers: [
          'Heavy / unusual bleeding',
          'Cord wrapped tightly around the neck',
          'Breech presentation',
          'Baby not breathing or responding',
          'Stalled labor',
          'Flagged prior C-section',
        ],
        responseRule: 'Get real help by any means — never attempt a DIY instruction.',
        durationMs: 15000,
      },
      {
        type: 'step',
        stepNumber: 3,
        totalSteps: 10,
        phase: 'SUPPORTING DELIVERY',
        text: 'Encourage pushing with contractions',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 4,
        totalSteps: 10,
        phase: 'SUPPORTING DELIVERY',
        text: 'Help find a comfortable position',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 5,
        totalSteps: 10,
        phase: 'SUPPORTING DELIVERY',
        text: "Support the baby's head and body gently as it emerges; never pull",
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 6,
        totalSteps: 10,
        phase: 'IMMEDIATELY AFTER BIRTH',
        text: 'Dry and warm the baby (especially the head)',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 7,
        totalSteps: 10,
        phase: 'IMMEDIATELY AFTER BIRTH',
        text: 'Skin-to-skin contact',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 8,
        totalSteps: 10,
        phase: 'IMMEDIATELY AFTER BIRTH',
        text: 'Do not cut or tie the cord',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 9,
        totalSteps: 10,
        phase: 'IMMEDIATELY AFTER BIRTH',
        text: 'Do not pull the cord to deliver the placenta',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 10,
        totalSteps: 10,
        phase: 'IMMEDIATELY AFTER BIRTH',
        text: 'Reassure that some blood/fluid loss is normal',
        durationMs: 12000,
      },
    ],
    buttons: {
      repeat: '↺ Repeat',
      repeatSub: 'Single shake',
      goBack: '⏮ Go Back',
      goBackSub: 'Double shake',
      next: '⏭ Next',
      nextSub: 'Skip forward',
      getAmbulance: '🚑 Get an Ambulance',
      getAmbulanceSub: 'Dials 102 + SMS Alert',
      getAmbulanceSubPractice: 'Simulate 102 Call',
      talkToDoctor: '🩺 Talk to a Doctor',
      talkToDoctorSub: 'Dials 104 Helpline',
      talkToDoctorSubPractice: 'Simulate 104 Call',
      restartSequence: '↺ Restart Sequence',
      returnHome: '← Return to Home',
    },
    completion: {
      titleEmergency: 'Guidance Complete — Continue supporting until help arrives',
      titlePractice: 'Practice Complete',
      subtitleEmergency: 'Keep the mother warm, calm, and supported. Ensure real emergency medical responders are on their way.',
      subtitlePractice: 'Great job rehearsing the flow! You have completed all emergency steps and safety checks.',
    },
    ui: {
      step: 'Step',
      of: 'of',
      warningCard: 'WARNING CARD',
      autoAdvancingIn: 'Auto-advancing in',
      stayingOnScreenFor: 'Staying on screen for',
      practiceModeBanner: 'PRACTICE MODE — No real calls will be made',
    },
  },

  Tamil: {
    locale: 'ta-IN',
    sequence: [
      {
        type: 'step',
        stepNumber: 1,
        totalSteps: 10,
        phase: 'பிரசவத்திற்கு முன்',
        text: 'உடனடியாக உதவிக்கு அழைக்கவும் (102 அல்லது 108)',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 2,
        totalSteps: 10,
        phase: 'பிரசவத்திற்கு முன்',
        text: 'கிடைத்தால் அறிந்த மருத்துவர்/மருத்துவச்சியை அழைக்கவும்',
        durationMs: 12000,
      },
      {
        type: 'warning',
        title: 'பின்வருவனவற்றில் ஏதேனும் நிகழ்ந்தால், உடனடியாக மெய்யான உதவியைப் பெறுங்கள்',
        phase: 'முக்கியமான பாதுகாப்பு சோதனை',
        triggers: [
          'அதிகமான/அசாதாரண இரத்தப்போக்கு',
          'கழுத்தைச் சுற்றி இறுக்கமாக தொப்புள்கொடி சுற்றியிருத்தல்',
          'தலைகீழ் பிரசவம் (கால் முதலில்)',
          'குழந்தை சுவாசிக்கவில்லை அல்லது பதிலளிக்கவில்லை',
          'பிரசவம் நீண்ட நேரம் முன்னேறவில்லை',
          'முந்தைய C-செக்ஷன் குறிக்கப்பட்டுள்ளது',
        ],
        responseRule: 'எந்த வகையிலும் மெய்யான உதவியைப் பெறுங்கள் - சொந்தமாக முயற்சி செய்ய வேண்டாம்',
        durationMs: 15000,
      },
      {
        type: 'step',
        stepNumber: 3,
        totalSteps: 10,
        phase: 'பிரசவத்திற்கு உதவுதல்',
        text: 'சுருக்கங்களுடன் தள்ள ஊக்குவிக்கவும்',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 4,
        totalSteps: 10,
        phase: 'பிரசவத்திற்கு உதவுதல்',
        text: 'வசதியான நிலையைக் கண்டறிய உதவுங்கள்',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 5,
        totalSteps: 10,
        phase: 'பிரசவத்திற்கு உதவுதல்',
        text: 'குழந்தையின் தலையையும் உடலையும் மெதுவாக ஆதரிக்கவும்; இழுக்க வேண்டாம்',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 6,
        totalSteps: 10,
        phase: 'பிரசவத்திற்குப் பிறகு உடனடியாக',
        text: 'குழந்தையை உலர வைத்து சூடாக வையுங்கள் (குறிப்பாக தலை)',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 7,
        totalSteps: 10,
        phase: 'பிரசவத்திற்குப் பிறகு உடனடியாக',
        text: 'தோலுக்கு தோல் தொடர்பு',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 8,
        totalSteps: 10,
        phase: 'பிரசவத்திற்குப் பிறகு உடனடியாக',
        text: 'தொப்புள்கொடியை வெட்டவோ கட்டவோ வேண்டாம்',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 9,
        totalSteps: 10,
        phase: 'பிரசவத்திற்குப் பிறகு உடனடியாக',
        text: 'நஞ்சுக்கொடியை வெளியேற்ற தொப்புள்கொடியை இழுக்க வேண்டாம்',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 10,
        totalSteps: 10,
        phase: 'பிரசவத்திற்குப் பிறகு உடனடியாக',
        text: 'சிறிது இரத்தம்/திரவ இழப்பு இயல்பானது என்று உறுதியளிக்கவும்',
        durationMs: 12000,
      },
    ],
    buttons: {
      repeat: '↺ மீண்டும்',
      repeatSub: 'ஒருமுறை குலுக்கவும்',
      goBack: '⏮ பின்செல்லவும்',
      goBackSub: 'இரண்டு முறை குலுக்கவும்',
      next: '⏭ அடுத்து',
      nextSub: 'முன்னோக்கிச் செல்லவும்',
      getAmbulance: '🚑 ஆம்புலன்ஸ் பெறவும்',
      getAmbulanceSub: '102 அழைக்கவும் + SMS எச்சரிக்கை',
      getAmbulanceSubPractice: '102 அழைப்பை மாதிரியாக்கு',
      talkToDoctor: '🩺 மருத்துவரிடம் பேசவும்',
      talkToDoctorSub: '104 உதவி எண் அழைக்கவும்',
      talkToDoctorSubPractice: '104 அழைப்பை மாதிரியாக்கு',
      restartSequence: '↺ வரிசையை மீண்டும் தொடங்கு',
      returnHome: '← முகப்புக்குத் திரும்பு',
    },
    completion: {
      titleEmergency: 'வழிகாட்டல் முடிந்தது — உதவி வரும் வரை தொடர்ந்து ஆதரிக்கவும்',
      titlePractice: 'பயிற்சி முடிந்தது',
      subtitleEmergency: 'தாயை சூடாகவும், அமைதியாகவும், ஆதரவாகவும் வைத்திருக்கவும். மெய்யான அவசர மருத்துவ உதவியாளர்கள் வருவதை உறுதிசெய்யவும்.',
      subtitlePractice: 'செயல்முறையைப் பயிற்சி செய்ததற்கு நல்வாழ்த்துகள்! அனைத்து அவசரக் படிகளையும் பாதுகாப்புச் சோதனைகளையும் முடித்துவிட்டீர்கள்.',
    },
    ui: {
      step: 'படி',
      of: 'இல்',
      warningCard: 'எச்சரிக்கை கார்டு',
      autoAdvancingIn: 'தானாக அடுத்த படிக்கு நகரும் நேரம்',
      stayingOnScreenFor: 'பாதுகாப்புச் சோதனைக்காக திரையில் இருக்கும் நேரம்',
      practiceModeBanner: 'பயிற்சி முறை — மெய்யான அழைப்புகள் செய்யப்படாது',
    },
  },

  Hindi: {
    locale: 'hi-IN',
    sequence: [
      {
        type: 'step',
        stepNumber: 1,
        totalSteps: 10,
        phase: 'प्रसव से पहले',
        text: 'तुरंत मदद के लिए कॉल करें (102 या 108)',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 2,
        totalSteps: 10,
        phase: 'प्रसव से पहले',
        text: 'यदि उपलब्ध हो तो परिचित डॉक्टर/दाई को कॉल करें',
        durationMs: 12000,
      },
      {
        type: 'warning',
        title: 'यदि इनमें से कोई भी हो, तो तुरंत वास्तविक मदद लें',
        phase: 'महत्वपूर्ण सुरक्षा जांच',
        triggers: [
          'भारी/असामान्य रक्तस्राव',
          'गर्भनाल गर्दन के चारों ओर कसकर लिपटी होना',
          'उल्टा प्रसव (पैर पहले)',
          'बच्चा सांस नहीं ले रहा या प्रतिक्रिया नहीं दे रहा',
          'प्रसव में लंबे समय तक कोई प्रगति नहीं',
          'पूर्व सी-सेक्शन चिह्नित',
        ],
        responseRule: 'किसी भी तरह से वास्तविक मदद लें - खुद कोशिश न करें',
        durationMs: 15000,
      },
      {
        type: 'step',
        stepNumber: 3,
        totalSteps: 10,
        phase: 'प्रसव में सहायता',
        text: 'संकुचन के साथ धक्का देने के लिए प्रोत्साहित करें',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 4,
        totalSteps: 10,
        phase: 'प्रसव में सहायता',
        text: 'आरामदायक स्थिति खोजने में मदद करें',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 5,
        totalSteps: 10,
        phase: 'प्रसव में सहायता',
        text: 'बच्चे के सिर और शरीर को धीरे से सहारा दें; कभी न खींचें',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 6,
        totalSteps: 10,
        phase: 'प्रसव के तुरंत बाद',
        text: 'बच्चे को सुखाएं और गर्म रखें (विशेष रूप से सिर)',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 7,
        totalSteps: 10,
        phase: 'प्रसव के तुरंत बाद',
        text: 'त्वचा से त्वचा का संपर्क',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 8,
        totalSteps: 10,
        phase: 'प्रसव के तुरंत बाद',
        text: 'गर्भनाल को काटें या बांधें नहीं',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 9,
        totalSteps: 10,
        phase: 'प्रसव के तुरंत बाद',
        text: 'नाल निकालने के लिए गर्भनाल को न खींचें',
        durationMs: 12000,
      },
      {
        type: 'step',
        stepNumber: 10,
        totalSteps: 10,
        phase: 'प्रसव के तुरंत बाद',
        text: 'आश्वस्त करें कि थोड़ा खून/तरल पदार्थ का बहना सामान्य है',
        durationMs: 12000,
      },
    ],
    buttons: {
      repeat: '↺ दोहराएं',
      repeatSub: 'एक बार हिलाएं',
      goBack: '⏮ पीछे जाएं',
      goBackSub: 'दो बार हिलाएं',
      next: '⏭ आगे',
      nextSub: 'आगे बढ़ें',
      getAmbulance: '🚑 एम्बुलेंस बुलाएं',
      getAmbulanceSub: '102 कॉल + SMS अलर्ट',
      getAmbulanceSubPractice: '102 कॉल सिमुलेशन',
      talkToDoctor: '🩺 डॉक्टर से बात करें',
      talkToDoctorSub: '104 हेल्पलाइन पर कॉल',
      talkToDoctorSubPractice: '104 कॉल सिमुलेशन',
      restartSequence: '↺ प्रक्रिया पुनः शुरू करें',
      returnHome: '← होम पर वापस जाएं',
    },
    completion: {
      titleEmergency: 'मार्गदर्शन पूर्ण — मदद आने तक सहायता जारी रखें',
      titlePractice: 'अभ्यास पूर्ण',
      subtitleEmergency: 'मां को गर्म, शांत और सुरक्षित रखें। सुनिश्चित करें कि आपातकालीन चिकित्सा दल रास्ते में है।',
      subtitlePractice: 'प्रक्रिया का अभ्यास करने के लिए बहुत बढ़िया! आपने सभी आपातकालीन चरणों और सुरक्षा जांचों को पूरा कर लिया है।',
    },
    ui: {
      step: 'चरण',
      of: 'का',
      warningCard: 'चेतावनी कार्ड',
      autoAdvancingIn: 'स्वचालित आगे बढ़ना',
      stayingOnScreenFor: 'सुरक्षा जांच के लिए स्क्रीन पर रहने का समय',
      practiceModeBanner: 'अभ्यास मोड — कोई वास्तविक कॉल नहीं की जाएगी',
    },
  },
};

/**
 * Gets translation set for language, defaulting to English if invalid/unsupported.
 */
export function getTranslation(lang?: SupportedLanguage): TranslationSet {
  if (lang && TRANSLATIONS[lang]) {
    return TRANSLATIONS[lang];
  }
  return TRANSLATIONS.English;
}
