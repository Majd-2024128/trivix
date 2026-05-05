import { useState, useEffect, createContext, useContext } from "react";

const translations = {
  en: {
    system: "System", display: "Display", desktopDock: "Desktop & Dock", lockScreen: "Lock Screen",
    about: "About", mouse: "Mouse", language: "Language", brightness: "Brightness", darkMode: "Dark Mode",
    darkInterface: "Dark interface", lightInterface: "Light interface", wallpaperFit: "Wallpaper Fit",
    fillScreen: "Fill screen", showFull: "Show full image", cover: "cover", contain: "contain",
    autoHideDock: "Auto-hide Dock", dockOnHover: "Dock appears on hover", dockVisible: "Dock always visible",
    clockStyle: "Clock Style", clockSize: "Clock Size", password: "Password", optional: "Optional",
    resetAll: "Reset All", resetTrivix: "Reset Trivix?", resetDesc: "This will clear settings, files, and desktop layout.",
    cancel: "Cancel", reset: "Reset", bold: "bold", thin: "thin",
    version: "Version", copyright: "Copyright © 2026 Tejt",
    cursorSize: "Cursor Size", cursorBlinkSpeed: "Cursor Blink Speed",
    sameWallpaper: "Same wallpaper for lock screen", sameWpDesc: "Use home screen wallpaper on lock screen",
    lockWallpaper: "Lock Screen Wallpaper",
    search: "Search", searchApps: "Search apps and folders...",
    pressSpace: "Press Space to unlock", wrongPassword: "Wrong password",
    addWidget: "Add Widget", customizeWallpaper: "Customize Wallpaper", closeAllApps: "Close All Apps",
    open: "Open", closeWindow: "Close Window", lock: "Lock", hideFromDock: "Hide from Dock",
    pin: "Pin to Dock", addToDock: "Add to Dock",
    tips: "Tips", tipsDesc: "A quick guide to Trivix OS.",
    shortcuts: "Shortcuts", desktop: "Desktop", widgets: "Widgets", files: "Files", apps: "Apps", proTouches: "Pro touches",
    noNotes: "No notes yet.", clickPlus: "Click + to create one.", selectNote: "Select a note or create a new one",
    notes: "notes", note: "note", title: "Title", startTyping: "Start typing...", untitled: "Untitled", noContent: "No content",
    save: "Save", dropFiles: "Drop files here", folderName: "Folder name...", create: "Create",
    rename: "Rename", delete: "Delete", moveTo: "Move to",
    pinCity: "Pin", unpinCity: "Unpin", searchCity: "Search city...", cityNotFound: "City not found",
    maxCities: "Max 5 pinned cities", noCities: "Search and pin your favorite cities",
    sleepMode: "Alt/Option + K enters sleep mode",
  },
  ar: {
    system: "النظام", display: "العرض", desktopDock: "سطح المكتب والشريط", lockScreen: "شاشة القفل",
    about: "حول", mouse: "الفأرة", language: "اللغة", brightness: "السطوع", darkMode: "الوضع الداكن",
    darkInterface: "واجهة داكنة", lightInterface: "واجهة فاتحة", wallpaperFit: "ملاءمة الخلفية",
    fillScreen: "ملء الشاشة", showFull: "عرض الصورة كاملة", cover: "ملء", contain: "احتواء",
    autoHideDock: "إخفاء الشريط تلقائياً", dockOnHover: "يظهر الشريط عند التمرير", dockVisible: "الشريط مرئي دائماً",
    clockStyle: "نمط الساعة", clockSize: "حجم الساعة", password: "كلمة المرور", optional: "اختياري",
    resetAll: "إعادة تعيين الكل", resetTrivix: "إعادة تعيين Trivix؟", resetDesc: "سيتم مسح الإعدادات والملفات وتخطيط سطح المكتب.",
    cancel: "إلغاء", reset: "إعادة تعيين", bold: "عريض", thin: "رفيع",
    version: "الإصدار", copyright: "حقوق النشر © 2026 Tejt",
    cursorSize: "حجم المؤشر", cursorBlinkSpeed: "سرعة وميض المؤشر",
    sameWallpaper: "نفس الخلفية لشاشة القفل", sameWpDesc: "استخدام خلفية الشاشة الرئيسية في شاشة القفل",
    lockWallpaper: "خلفية شاشة القفل",
    search: "بحث", searchApps: "البحث في التطبيقات والمجلدات...",
    pressSpace: "اضغط مسافة لفتح القفل", wrongPassword: "كلمة مرور خاطئة",
    addWidget: "إضافة أداة", customizeWallpaper: "تخصيص الخلفية", closeAllApps: "إغلاق كل التطبيقات",
    open: "فتح", closeWindow: "إغلاق النافذة", lock: "قفل", hideFromDock: "إخفاء من الشريط",
    pin: "تثبيت في الشريط", addToDock: "إضافة إلى الشريط",
    tips: "نصائح", tipsDesc: "دليل سريع لنظام Trivix.",
    shortcuts: "اختصارات", desktop: "سطح المكتب", widgets: "أدوات", files: "ملفات", apps: "تطبيقات", proTouches: "لمسات احترافية",
    noNotes: "لا توجد ملاحظات بعد.", clickPlus: "اضغط + لإنشاء واحدة.", selectNote: "اختر ملاحظة أو أنشئ واحدة جديدة",
    notes: "ملاحظات", note: "ملاحظة", title: "العنوان", startTyping: "ابدأ الكتابة...", untitled: "بدون عنوان", noContent: "بدون محتوى",
    save: "حفظ", dropFiles: "أسقط الملفات هنا", folderName: "اسم المجلد...", create: "إنشاء",
    rename: "إعادة تسمية", delete: "حذف", moveTo: "نقل إلى",
    pinCity: "تثبيت", unpinCity: "إلغاء التثبيت", searchCity: "ابحث عن مدينة...", cityNotFound: "المدينة غير موجودة",
    maxCities: "الحد الأقصى 5 مدن مثبتة", noCities: "ابحث وثبّت مدنك المفضلة",
    sleepMode: "Alt/Option + K يدخل وضع السكون",
  },
  ru: {
    system: "Система", display: "Дисплей", desktopDock: "Рабочий стол и Док", lockScreen: "Экран блокировки",
    about: "О системе", mouse: "Мышь", language: "Язык", brightness: "Яркость", darkMode: "Тёмный режим",
    darkInterface: "Тёмный интерфейс", lightInterface: "Светлый интерфейс", wallpaperFit: "Масштаб обоев",
    fillScreen: "Заполнить экран", showFull: "Показать полностью", cover: "заполнить", contain: "вместить",
    autoHideDock: "Автоскрытие дока", dockOnHover: "Док появляется при наведении", dockVisible: "Док всегда виден",
    clockStyle: "Стиль часов", clockSize: "Размер часов", password: "Пароль", optional: "Необязательно",
    resetAll: "Сбросить всё", resetTrivix: "Сбросить Trivix?", resetDesc: "Это очистит настройки, файлы и макет.",
    cancel: "Отмена", reset: "Сбросить", bold: "жирный", thin: "тонкий",
    version: "Версия", copyright: "Copyright © 2026 Tejt",
    cursorSize: "Размер курсора", cursorBlinkSpeed: "Скорость мигания курсора",
    sameWallpaper: "Одинаковые обои для блокировки", sameWpDesc: "Использовать обои рабочего стола на экране блокировки",
    lockWallpaper: "Обои экрана блокировки",
    search: "Поиск", searchApps: "Поиск приложений и папок...",
    pressSpace: "Нажмите Пробел для разблокировки", wrongPassword: "Неверный пароль",
    addWidget: "Добавить виджет", customizeWallpaper: "Настроить обои", closeAllApps: "Закрыть все приложения",
    open: "Открыть", closeWindow: "Закрыть окно", lock: "Заблокировать", hideFromDock: "Скрыть из дока",
    pin: "Закрепить в доке", addToDock: "Добавить в док",
    tips: "Советы", tipsDesc: "Краткое руководство по Trivix OS.",
    shortcuts: "Горячие клавиши", desktop: "Рабочий стол", widgets: "Виджеты", files: "Файлы", apps: "Приложения", proTouches: "Профи-фишки",
    noNotes: "Заметок пока нет.", clickPlus: "Нажмите + чтобы создать.", selectNote: "Выберите заметку или создайте новую",
    notes: "заметок", note: "заметка", title: "Заголовок", startTyping: "Начните печатать...", untitled: "Без названия", noContent: "Нет содержимого",
    save: "Сохранить", dropFiles: "Перетащите файлы сюда", folderName: "Имя папки...", create: "Создать",
    rename: "Переименовать", delete: "Удалить", moveTo: "Переместить в",
    pinCity: "Закрепить", unpinCity: "Открепить", searchCity: "Поиск города...", cityNotFound: "Город не найден",
    maxCities: "Максимум 5 закреплённых городов", noCities: "Найдите и закрепите любимые города",
    sleepMode: "Alt/Option + K переходит в спящий режим",
  },
  fr: {
    system: "Système", display: "Affichage", desktopDock: "Bureau et Dock", lockScreen: "Écran de verrouillage",
    about: "À propos", mouse: "Souris", language: "Langue", brightness: "Luminosité", darkMode: "Mode sombre",
    darkInterface: "Interface sombre", lightInterface: "Interface claire", wallpaperFit: "Ajustement du fond",
    fillScreen: "Remplir l'écran", showFull: "Afficher l'image complète", cover: "remplir", contain: "contenir",
    autoHideDock: "Masquer le dock", dockOnHover: "Le dock apparaît au survol", dockVisible: "Dock toujours visible",
    clockStyle: "Style d'horloge", clockSize: "Taille de l'horloge", password: "Mot de passe", optional: "Optionnel",
    resetAll: "Tout réinitialiser", resetTrivix: "Réinitialiser Trivix ?", resetDesc: "Cela effacera les paramètres, fichiers et la disposition.",
    cancel: "Annuler", reset: "Réinitialiser", bold: "gras", thin: "fin",
    version: "Version", copyright: "Copyright © 2026 Tejt",
    cursorSize: "Taille du curseur", cursorBlinkSpeed: "Vitesse de clignotement",
    sameWallpaper: "Même fond pour l'écran de verrouillage", sameWpDesc: "Utiliser le fond d'écran principal",
    lockWallpaper: "Fond de l'écran de verrouillage",
    search: "Recherche", searchApps: "Rechercher des apps et dossiers...",
    pressSpace: "Appuyez sur Espace pour déverrouiller", wrongPassword: "Mot de passe incorrect",
    addWidget: "Ajouter un widget", customizeWallpaper: "Personnaliser le fond", closeAllApps: "Fermer toutes les apps",
    open: "Ouvrir", closeWindow: "Fermer la fenêtre", lock: "Verrouiller", hideFromDock: "Masquer du dock",
    pin: "Épingler au dock", addToDock: "Ajouter au dock",
    tips: "Astuces", tipsDesc: "Guide rapide de Trivix OS.",
    shortcuts: "Raccourcis", desktop: "Bureau", widgets: "Widgets", files: "Fichiers", apps: "Applications", proTouches: "Touches pro",
    noNotes: "Pas encore de notes.", clickPlus: "Cliquez + pour en créer une.", selectNote: "Sélectionnez une note ou créez-en une",
    notes: "notes", note: "note", title: "Titre", startTyping: "Commencez à écrire...", untitled: "Sans titre", noContent: "Pas de contenu",
    save: "Enregistrer", dropFiles: "Déposez les fichiers ici", folderName: "Nom du dossier...", create: "Créer",
    rename: "Renommer", delete: "Supprimer", moveTo: "Déplacer vers",
    pinCity: "Épingler", unpinCity: "Désépingler", searchCity: "Rechercher une ville...", cityNotFound: "Ville introuvable",
    maxCities: "Maximum 5 villes épinglées", noCities: "Recherchez et épinglez vos villes favorites",
    sleepMode: "Alt/Option + K entre en mode veille",
  },
};

let _lang = localStorage.getItem("trivix_lang") || "en";
const _listeners = new Set();

export function getLang() { return _lang; }
export function setLang(lang) {
  _lang = lang;
  localStorage.setItem("trivix_lang", lang);
  if (lang === "ar") {
    document.documentElement.dir = "rtl";
    document.documentElement.style.fontFamily = "'IBM Plex Sans Arabic', 'Space Grotesk', sans-serif";
  } else {
    document.documentElement.dir = "ltr";
    document.documentElement.style.fontFamily = "'Space Grotesk', sans-serif";
  }
  for (const fn of _listeners) fn(lang);
}

export function t(key) {
  return translations[_lang]?.[key] || translations.en[key] || key;
}

export function useLang() {
  const [lang, set] = useState(_lang);
  useEffect(() => {
    const fn = (l) => set(l);
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  }, []);
  return lang;
}

// Init dir on load
if (_lang === "ar") {
  document.documentElement.dir = "rtl";
}

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
  { code: "fr", label: "Français" },
];
