
import { useEffect, useMemo, useRef, useState } from "react";

import {
  BookOpen, Brain, Headphones, Home, Search, Bookmark,
  Flame, Target, ChevronLeft, Menu, X, Sparkles, Moon,
  BookmarkCheck, ArrowRight, Play, Check, RotateCcw,
  Volume2, CircleCheck, GraduationCap, Eye, EyeOff,
  Lightbulb, Trophy, Zap, Download, Wifi, WifiOff, Heart,
  PenLine, Map, Gift, CalendarDays, Send, RefreshCw
} from "lucide-react";

import "./App.css";
import { supabase } from "./supabase";
import {
  saveSurahOffline,
  getSurahOffline,
  getDownloadedSurahs,
  saveAudioOffline,
  getAudioOffline,
} from "./offline";

const API = "https://ummahapi.com/api";
const TOTAL_AYAHS = 6236;

const menu = [
  { id: "review", label: "مراجعتي اليوم", icon: CalendarDays },
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "quran", label: "القرآن الكريم", icon: BookOpen },
  { id: "memorize", label: "الحفظ والمراجعة", icon: Brain },
  { id: "smart", label: "الحفظ الذكي", icon: Zap },
  { id: "listen", label: "الاستماع", icon: Headphones },
  { id: "saved", label: "الآيات المحفوظة", icon: Bookmark },
  { id: "activity", label: "سجل النشاط", icon: Flame },
  { id: "daily", label: "آية اليوم", icon: CalendarDays },
  { id: "heart", label: "رسالة لقلبك", icon: Heart },
  { id: "challenge", label: "تحدي التطبيق", icon: Gift },
  { id: "journal", label: "بصمتي القرآنية", icon: PenLine },
  { id: "journey", label: "خريطة رحلتي", icon: Map },
];

const reciters = [
  { id: "ar.alafasy", name: "مشاري العفاسي" },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد" },
  { id: "ar.husary", name: "محمود خليل الحصري" },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي" },
];

const learningProfiles = [
  {
    id: "child",
    title: "وضع الطفل",
    english: "KIDS MODE",
    description: "رحلة قرآنية ممتعة مليئة بالتشجيع والإنجازات الصغيرة.",
    details: "واجهة بسيطة، ألوان مبهجة، ونجوم تحفّزك على الاستمرار.",
    icon: Gift,
    accent: "مرح ومليء بالألوان",
  },
  {
    id: "student",
    title: "وضع الطالب",
    english: "STUDENT MODE",
    description: "نظّم وقتك، حدّد أهدافك، وتابع تقدمك خطوة بخطوة.",
    details: "أهداف يومية وأسبوعية، جدول واضح، وإحصائيات لتقدمك.",
    icon: GraduationCap,
    accent: "منظم وعصري",
  },
  {
    id: "hafiz",
    title: "وضع الحافظ",
    english: "HAFIZ MODE",
    description: "ثبّت ما حفظته واعتنِ بمراجعتك القرآنية المتقدمة.",
    details: "مراجعة منظمة، متابعة الآيات المحفوظة، وسجل التقدم.",
    icon: BookOpen,
    accent: "هادئ وراقٍ",
  },
  {
    id: "teacher",
    title: "وضع الأستاذ",
    english: "TEACHER MODE",
    description: "مساحة مخصصة لمتابعة المتعلمين وتنظيم العمل التعليمي.",
    details: "هذا الوضع الآن واجهة تعريفية؛ صلاحيات إدارة الطلاب ستُبنى لاحقاً.",
    icon: Brain,
    accent: "احترافي وواضح",
  },
];

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const todayKey = () => new Date().toLocaleDateString("en-CA");

function dateAfterDays(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function getSurahName(surah) {
  return (
    surah?.name_arabic ||
    surah?.nameArabic ||
    surah?.arabic ||
    surah?.name ||
    "سورة"
  );
}

function getAyahText(ayah) {
  return (
    ayah?.text_uthmani ||
    ayah?.text ||
    ayah?.arabic ||
    ayah?.text_arabic ||
    ""
  );
}

function getSurahNumber(surah) {
  return Number(surah?.number || surah?.id);
}

function extractVerses(result) {
  const data = result?.data || result;

  return (
    data?.verses ||
    data?.ayahs ||
    data?.surah?.verses ||
    data?.surah?.ayahs ||
    []
  );
}

const dailyVerses = [
  { surah: 2, ayah: 286, title: "رحمة الله وسعة رحمته", meaning: "يطمئننا الله أن تكاليفه لا تتجاوز طاقة الإنسان، وأن لكل نفس جزاء ما كسبت، ثم يعلّمنا دعاءً نلجأ به إليه." },
  { surah: 13, ayah: 28, title: "طمأنينة القلب", meaning: "تجد القلوب سكينتها الحقيقية في ذكر الله، والرجوع إليه والثقة بوعده." },
  { surah: 94, ayah: 5, title: "مع العسر يسر", meaning: "يبشّر الله عباده بأن الشدة لا تدوم، وأن اليسر يصاحب العسر ويأتي بعده." },
  { surah: 39, ayah: 53, title: "باب الأمل مفتوح", meaning: "ينهى الله عباده عن اليأس من رحمته، ويدعوهم إلى الرجوع إليه مهما عظمت ذنوبهم." },
  { surah: 14, ayah: 7, title: "الشكر يزيد النعم", meaning: "وعد الله من يشكره بالزيادة، وفي الآية تذكير بقيمة الاعتراف بالنعم واستعمالها في الخير." },
  { surah: 3, ayah: 173, title: "حسبنا الله", meaning: "تعلّمنا الآية أن المؤمن يواجه التخويف بالتوكل على الله والثقة بكفايته ونصره." },
  { surah: 93, ayah: 3, title: "لست متروكًا", meaning: "في سياق السورة تسلية للنبي ﷺ وتأكيد أن ربه لم يتركه ولم يبغضه." },
];

const heartGuides = {
  "قلق": {
    label: "عندما يزدحم قلبك بالقلق",
    verses: [
      { surah: 13, ayah: 28, meaning: "تأمل كيف جعل الله ذكره طريقًا لطمأنينة القلب؛ فالسكينة قد تبدأ بذكر صادق وسط انشغال الحياة.", action: "ابتعد قليلًا عن مصدر التشتت، وخذ أنفاسًا هادئة، وردّد ذكرًا تحبه بتأنٍ." },
      { surah: 2, ayah: 286, meaning: "تذكّرك الآية أن الله يعلم طاقتك، فلا تحمّل نفسك ما لا تطيق، واستعن به في ما صعب عليك.", action: "قسّم ما يقلقك إلى أمور صغيرة، وابدأ بما تستطيع اليوم، واترك ما عجزت عنه لله." },
      { surah: 3, ayah: 139, meaning: "تدعوك الآية إلى ألا تستسلم للضعف؛ فالتعثر لا يعني أن الطريق انتهى.", action: "اذكر موقفًا تجاوزته من قبل، ثم اختر خطوة عملية صغيرة تعيد إليك الثبات." },
      { surah: 9, ayah: 51, meaning: "تعلّمك الآية أن ما قدّره الله لا يقع إلا بعلمه، وأن المؤمن يجمع بين الثقة بالله والعمل.", action: "افعل ما تستطيع من أسباب، ثم فوّض النتيجة إلى الله ولا تستنزف قلبك في توقع المجهول." },
      { surah: 65, ayah: 3, meaning: "تفتح الآية باب الرجاء في كفاية الله لمن يتوكل عليه، مع السعي والأخذ بالأسباب.", action: "حدّد أمرًا خارج سيطرتك، وادعُ الله بشأنه، ثم وجّه جهدك إلى ما يمكنك فعله." },
    ],
    meaning: "تذكّر أن ذكر الله باب للسكينة، وأنك تستطيع أخذ الأسباب مع تفويض ما لا تملك إلى الله.",
    action: "خذ دقيقة هادئة، وردّد ذكرًا تعرفه بتأنٍ، ثم اكتب خطوة صغيرة تستطيع القيام بها الآن.",
  },
  "حزن": {
    label: "عندما يثقل عليك الحزن",
    verses: [
      { surah: 94, ayah: 5, meaning: "في الآية وعد بأن مع العسر يسرًا؛ فالشدة ليست الصورة الكاملة لحياتك.", action: "ابحث اليوم عن أمر واحد يخفف عنك، ولو كان راحة قصيرة أو حديثًا مع شخص قريب." },
      { surah: 94, ayah: 6, meaning: "تكرار الوعد باليسر يثبّت القلب ويذكّره بأن الضيق لا يدوم على حاله.", action: "لا تطلب من نفسك حل كل شيء الآن؛ أنجز خطوة واحدة واترك للغد ما يمكن تأجيله." },
      { surah: 12, ayah: 86, meaning: "يعقوب عليه السلام بثّ حزنه إلى الله؛ فاللجوء إليه لا ينافي الصبر، بل هو من أبواب الرجاء.", action: "تحدّث إلى الله بدعائك كما أنت، واكتب ما يثقل قلبك إن كان ذلك يعينك على ترتيبه." },
      { surah: 2, ayah: 153, meaning: "تجمع الآية بين الصبر والصلاة، وتذكّرك أن الاستعانة بالله سند في أوقات الشدة.", action: "صلّ ركعتين إن تيسّر، أو خصص لحظة دعاء هادئة، ثم اطلب دعم من تثق به." },
      { surah: 39, ayah: 53, meaning: "تذكّرك الآية بسعة رحمة الله، وأن باب الرجوع إليه لا يُغلق في وجه من أقبل عليه.", action: "جدّد نيتك، واستغفر الله، وابدأ عملًا صالحًا صغيرًا دون أن تستسلم لليأس." },
    ],
    meaning: "تذكّر أن القرآن يفتح باب الصبر والرجاء، وأن الضيق ليس نهاية الطريق.",
    action: "امنح نفسك وقتًا، وتواصل مع شخص تثق به، وابدأ بأمر يسير يخفف عنك.",
  },
  "خوف": {
    label: "عندما تشعر بالخوف",
    verses: [
      { surah: 3, ayah: 173, meaning: "تبيّن الآية كيف يقوى القلب حين يواجه التخويف بالتوكل والثقة بالله.", action: "قل: حسبنا الله ونعم الوكيل، ثم تعامل مع السبب الواقعي الذي أمامك خطوة خطوة." },
      { surah: 9, ayah: 51 },
      { surah: 2, ayah: 255, meaning: "تعرّفك آية الكرسي بعظمة الله وكمال قيوميته؛ فتستحضر أن أمرك ليس خارج علمه وقدرته.", action: "اقرأ آية الكرسي بتدبر، ثم اكتب ما يمكنك فعله وما ينبغي أن تفوّضه إلى الله." },
      { surah: 8, ayah: 2, meaning: "تصف الآية أثر ذكر الله في قلوب المؤمنين؛ فالذكر يعيد للقلب انتباهه إلى ربه.", action: "اقرأ شيئًا من القرآن بهدوء، وتوقف عند معنى يبعث فيك الثقة بالله." },
      { surah: 65, ayah: 3 },
    ],
    meaning: "تذكّرك هذه الآيات بالتوكل على الله، وذكره، والأخذ بالأسباب مع الاستعانة به.",
    action: "سمِّ ما تخافه بوضوح، وخذ بالأسباب الممكنة، واستعن بالله فيما لا تستطيع التحكم فيه.",
  },
  "أمل": {
    label: "عندما تبحث عن الأمل",
    verses: [
      { surah: 39, ayah: 53 },
      { surah: 12, ayah: 87, meaning: "تنهى الآية عن القنوط من روح الله، وتفتح نافذة رجاء مهما طال الانتظار.", action: "اختر أمرًا فقدت الأمل فيه، وادعُ الله به، ثم خذ سببًا جديدًا إن كان متاحًا." },
      { surah: 94, ayah: 5 },
      { surah: 15, ayah: 56, meaning: "تعلّمك الآية أن الرجاء في رحمة الله لا ينقطع، وأن اليأس ليس طريق المؤمن.", action: "استبدل فكرة محبطة بدعاء رجاء، وتذكّر نعمة أو باب خير ما زال مفتوحًا." },
      { surah: 2, ayah: 218, meaning: "تربط الآية بين الإيمان والهجرة والجهاد في سبيل الله وبين رجاء رحمة الله؛ فالرجاء يصاحبه سعي.", action: "حوّل أمنية واحدة إلى خطوة واضحة، وابدأ بها اليوم ولو كانت بسيطة." },
    ],
    meaning: "تذكّرك هذه الآيات بسعة رحمة الله، وبأن المؤمن لا يقطع رجاءه من رحمته.",
    action: "ابدأ من جديد بخطوة واحدة، ولو كانت صغيرة جدًا، ولا تتردد في طلب المساندة ممن تثق به.",
  },
  "امتنان": {
    label: "عندما يمتلئ قلبك امتنانًا",
    verses: [
      { surah: 14, ayah: 7, meaning: "تذكّرك الآية بوعد الله بالزيادة لمن يشكر؛ والشكر يوقظ القلب لرؤية النعم.", action: "اشكر الله على نعمة محددة، واستعملها اليوم في خير أو في نفع إنسان." },
      { surah: 16, ayah: 18, meaning: "تذكّرك الآية أن نعم الله أكثر من أن تُحصى؛ فكل يوم يحمل أسبابًا جديدة للحمد.", action: "لاحظ ثلاث نعم حولك الآن، وعبّر عن شكرك لله بقول أو عمل." },
      { surah: 2, ayah: 152, meaning: "تدعوك الآية إلى ذكر الله وشكره؛ فالذكر صلة متجددة، والشكر اعتراف بالفضل.", action: "خصص دقائق لذكر الله، ثم اشكر شخصًا أحسن إليك بكلمة صادقة." },
      { surah: 31, ayah: 12, meaning: "تربط الآية الحكمة بالشكر، وتذكّرك أن ثمرة الشكر تعود على النفس.", action: "اختر نعمة تستخدمها كثيرًا، وفكّر كيف توظفها اليوم فيما يرضي الله." },
      { surah: 55, ayah: 13, meaning: "يتكرر السؤال في سورة الرحمن ليوقظ القلب إلى نعم الله الظاهرة والخفية.", action: "تأمل نعمة اعتدت وجودها، واذكر الله حمدًا عليها، ولا تؤجل شكر من كان سببًا فيها." },
    ],
    meaning: "الشكر اعتراف بالنعمة بالقلب واللسان والعمل، وتذكير باستعمال النعم في الخير.",
    action: "اكتب ثلاث نعم، واختر نعمة واحدة تشكر الله عليها بعمل صالح.",
  },
};

const dailyChallenges = [
  { title: "برّ الوالدين", description: "اتصل بأحد والديك أو قدّم لهما مساعدة أو كلمة طيبة بنية البر.", value: "الإحسان" },
  { title: "صدقة خفية", description: "قدّم مساعدة بسيطة لمحتاج، ولو بابتسامة أو كلمة طيبة.", value: "الرحمة" },
  { title: "الصبر عند الغضب", description: "إذا استفزك موقف اليوم، تمهّل قبل الرد واختر الكلمة الأحسن.", value: "الصبر" },
  { title: "صلة الرحم", description: "اسأل عن قريب لم تتواصل معه منذ مدة.", value: "الصلة" },
  { title: "ورد من القرآن", description: "اقرأ صفحة بتأنٍ، وحاول أن تتوقف عند معنى واحد تعمل به.", value: "التدبر" },
  { title: "كلمة طيبة", description: "اختر شخصًا وقل له كلمة صادقة ترفع معنوياته.", value: "الإحسان" },
  { title: "العفو", description: "اترك جدالًا لا فائدة منه، أو سامح في أمر تستطيع تجاوزه.", value: "العفو" },
];

function App() {
 const [profile, setProfile] = useState(() => {
  const savedProfile = readStorage("hifdhi-learning-profile", null);

  if (!savedProfile) return null;

  const originalProfile = learningProfiles.find(
    (item) => item.id === savedProfile.id
  );

  return originalProfile
    ? { ...originalProfile, ...savedProfile, icon: originalProfile.icon }
    : null;
});
  const [active, setActive] = useState("home");
  const [authOpen, setAuthOpen] = useState(false);
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");
const [authLoading, setAuthLoading] = useState(false);
const [authMessage, setAuthMessage] = useState("");
const [user, setUser] = useState(null);

useEffect(() => {
  let mounted = true;

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (mounted) {
      setUser(session?.user ?? null);
    }
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);
const [authUser, setAuthUser] = useState(null);

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setAuthUser(session?.user ?? null);
  });

  const { data: { subscription } } =
    supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

  return () => subscription.unsubscribe();
}, []);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");

  const [downloadedSurahs, setDownloadedSurahs] = useState([]);
  const [downloadingSurah, setDownloadingSurah] = useState(null);
  const [offlineMessage, setOfflineMessage] = useState("");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  const [surahs, setSurahs] = useState(() =>
    readStorage("hifdhi-surahs-list", [])
  );
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [ayahs, setAyahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [memorizedAyahs, setMemorizedAyahs] = useState(
    () => readStorage("hifdhi-memorized", [])
  );
  // Smart Review
const [reviewSchedule, setReviewSchedule] = useState(
  () => readStorage("hifdhi-review-schedule", {})
);

const [reviewCurrent, setReviewCurrent] = useState(null);
const [reviewAyah, setReviewAyah] = useState(null);
const [reviewLoading, setReviewLoading] = useState(false);
const [showReviewAnswer, setShowReviewAnswer] = useState(false);

  const [savedAyahs, setSavedAyahs] = useState(
    () => readStorage("hifdhi-saved", [])
  );

  const [readingHistory, setReadingHistory] = useState(
    () => readStorage("hifdhi-history", {})
  );

  // Memorization practice
  const [practiceSurah, setPracticeSurah] = useState("");
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
  const [practiceAyahs, setPracticeAyahs] = useState([]);
  const [practiceLoading, setPracticeLoading] = useState(false);

  // Smart Hifdh
  const [smartSurah, setSmartSurah] = useState("");
  const [smartAyahs, setSmartAyahs] = useState([]);
  const [smartIndex, setSmartIndex] = useState(0);
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartHiddenCount, setSmartHiddenCount] = useState(3);
  const [revealedWords, setRevealedWords] = useState([]);
  const [smartCompleted, setSmartCompleted] = useState(
    () => readStorage("hifdhi-smart-completed", 0)
  );
  const [smartFinishedAyahs, setSmartFinishedAyahs] = useState(
    () => readStorage("hifdhi-smart-finished", [])
  );

  // Audio player
  const audioRef = useRef(null);
  const audioObjectUrlRef = useRef("");
  const [listenSurah, setListenSurah] = useState("1");
  const [listenAyah, setListenAyah] = useState(1);
  const [reciter, setReciter] = useState("ar.alafasy");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [dailyAyah, setDailyAyah] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [heartAyah, setHeartAyah] = useState(null);
  const [heartReflection, setHeartReflection] = useState(null);
  const [heartLoading, setHeartLoading] = useState(false);
  const [challengeDone, setChallengeDone] = useState(() => readStorage("hifdhi-challenge-done", {}));
  const [journalEntries, setJournalEntries] = useState(() => readStorage("hifdhi-reflections", []));
  const [journalVerse, setJournalVerse] = useState("");
  const [journalLearning, setJournalLearning] = useState("");
  const [journalAction, setJournalAction] = useState("");

  const todayChallenge = dailyChallenges[Math.floor(new Date().setHours(0,0,0,0) / 86400000) % dailyChallenges.length];
  const todayDailyVerse = dailyVerses[Math.floor(new Date().setHours(0,0,0,0) / 86400000) % dailyVerses.length];

  // Child-mode stars are a lightweight reward layer based on completed daily challenges.
  const childStars = Object.values(challengeDone).filter(Boolean).length * 10;
  const childRewards = [
    { stars: 10, title: "بداية رائعة", icon: "⭐" },
    { stars: 30, title: "بطل التحديات", icon: "🏅" },
    { stars: 50, title: "نجم حِفْظِي", icon: "🌟" },
    { stars: 100, title: "وسام المثابرة", icon: "🏆" },
  ];
  const nextChildReward = childRewards.find((reward) => childStars < reward.stars) || null;
  const childRewardProgress = nextChildReward
    ? Math.min(100, Math.round((childStars / nextChildReward.stars) * 100))
    : 100;

  useEffect(() => {
    localStorage.setItem("hifdhi-challenge-done", JSON.stringify(challengeDone));
  }, [challengeDone]);

  useEffect(() => {
    localStorage.setItem("hifdhi-reflections", JSON.stringify(journalEntries));
  }, [journalEntries]);

  async function fetchFeatureAyah(surahNumber, ayahNumber) {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}`);
    if (!response.ok) throw new Error("تعذر تحميل الآية. تحقّق من اتصال الإنترنت.");
    const result = await response.json();
    if (result?.code !== 200 || !result?.data?.text) throw new Error("لم نتمكن من العثور على الآية.");
    return result.data;
  }

  useEffect(() => {
    let cancelled = false;
    setDailyLoading(true);
    fetchFeatureAyah(todayDailyVerse.surah, todayDailyVerse.ayah)
      .then((data) => { if (!cancelled) setDailyAyah(data); })
      .catch(() => { if (!cancelled) setDailyAyah(null); })
      .finally(() => { if (!cancelled) setDailyLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // نتذكر آخر آية ظهرت لكل شعور حتى لا تتكرر مباشرة عند الضغط مرة أخرى.
  const heartLastAyahRef = useRef({});

  async function chooseEmotion(emotion) {
    const guide = heartGuides[emotion];
    if (!guide?.verses?.length) return;

    const previousKey = heartLastAyahRef.current[emotion];
    const availableVerses = guide.verses.filter(
      (verse) => `${verse.surah}:${verse.ayah}` !== previousKey
    );
    const choices = availableVerses.length ? availableVerses : guide.verses;
    const selectedVerse = choices[Math.floor(Math.random() * choices.length)];
    const selectedKey = `${selectedVerse.surah}:${selectedVerse.ayah}`;

    // نحفظ الاختيار قبل جلب الآية حتى لا تتكرر مباشرة.
    heartLastAyahRef.current[emotion] = selectedKey;

    setSelectedEmotion(emotion);
    setHeartAyah(null);
    setHeartReflection(selectedVerse);
    setHeartLoading(true);

    try {
      const data = await fetchFeatureAyah(
        selectedVerse.surah,
        selectedVerse.ayah
      );
      setHeartAyah(data);
    } catch (error) {
      setOfflineMessage(error.message);
    } finally {
      setHeartLoading(false);
    }
  }

  function saveReflection(event) {
    event.preventDefault();
    if (!journalLearning.trim() && !journalAction.trim()) return;
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ar-DZ"),
      verse: journalVerse.trim(),
      learning: journalLearning.trim(),
      action: journalAction.trim(),
    };
    setJournalEntries((previous) => [entry, ...previous]);
    setJournalVerse("");
    setJournalLearning("");
    setJournalAction("");
  }

  // Save data
  useEffect(() => {
    localStorage.setItem("hifdhi-memorized", JSON.stringify(memorizedAyahs));
  }, [memorizedAyahs]);
  // Save review schedule
useEffect(() => {
  localStorage.setItem(
    "hifdhi-review-schedule",
    JSON.stringify(reviewSchedule)
  );
}, [reviewSchedule]);

// Add previously memorized ayahs to the review system
useEffect(() => {
  setReviewSchedule((previous) => {
    const updated = { ...previous };
    let changed = false;

    memorizedAyahs.forEach((key) => {
      if (updated[key]) return;

      const [surahNumber, ayahNumber] = key.split(":").map(Number);

      if (!surahNumber || !ayahNumber) return;

      updated[key] = {
        key,
        surahNumber,
        ayahNumber,
        dueDate: todayKey(),
        intervalDays: 0,
      };

      changed = true;
    });

    return changed ? updated : previous;
  });
}, [memorizedAyahs]);

  useEffect(() => {
    localStorage.setItem("hifdhi-saved", JSON.stringify(savedAyahs));
  }, [savedAyahs]);

  useEffect(() => {
    localStorage.setItem("hifdhi-history", JSON.stringify(readingHistory));
  }, [readingHistory]);

  useEffect(() => {
    localStorage.setItem(
      "hifdhi-smart-completed",
      JSON.stringify(smartCompleted)
    );
  }, [smartCompleted]);

  useEffect(() => {
    localStorage.setItem(
      "hifdhi-smart-finished",
      JSON.stringify(smartFinishedAyahs)
    );
  }, [smartFinishedAyahs]);

  // Online/offline status and IndexedDB
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    getDownloadedSurahs()
      .then(setDownloadedSurahs)
      .catch((error) => console.error("Offline storage error:", error));

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);

      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current);
      }
    };
  }, []);

  // Load surahs
  useEffect(() => {
    fetchSurahs();
  }, []);

  async function fetchSurahs() {
    const storageKey = "hifdhi-surahs-list";
    const cachedList = readStorage(storageKey, []);

    if (Array.isArray(cachedList) && cachedList.length > 0) {
      setSurahs(cachedList);
      setApiError("");
    }

    if (!navigator.onLine) {
      if (!cachedList.length) {
        setApiError(
          "قائمة السور غير متاحة. اتصلي بالإنترنت مرة واحدة لتحميلها."
        );
      }
      return;
    }

    try {
      const response = await fetch(`${API}/quran/surahs`);

      if (!response.ok) {
        throw new Error("تعذر الاتصال بالخادم");
      }

      const result = await response.json();

      const list =
        result?.data?.surahs ||
        result?.data ||
        result?.surahs ||
        result?.results ||
        [];

      if (!Array.isArray(list) || list.length === 0) {
        throw new Error("صيغة البيانات غير متوقعة");
      }

      setSurahs(list);
      localStorage.setItem(storageKey, JSON.stringify(list));
      setApiError("");
    } catch {
      if (!cachedList.length) {
        setApiError(
          "ما قدرناش نحمّلو قائمة السور. تأكدي من اتصال الإنترنت وحاولي مجددًا."
        );
      }
    }
  }

  // Activity tracking
  function recordActivity(surahNumber) {
    const key = todayKey();

    setReadingHistory((previous) => {
      const current = previous[key] || { surahs: [] };

      const numbers = [
        ...new Set([
          ...(current.surahs || []),
          Number(surahNumber),
        ].filter(Boolean)),
      ];

      return {
        ...previous,
        [key]: { surahs: numbers },
      };
    });
  }

  function getActivityStreak() {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let cursor = new Date(todayKey());

    if (!readingHistory[todayKey()]) {
      if (!readingHistory[yesterday.toLocaleDateString("en-CA")]) {
        return 0;
      }
      cursor = yesterday;
    }

    let streak = 0;

    while (true) {
      const key = cursor.toLocaleDateString("en-CA");
      if (!readingHistory[key]) break;

      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  const readSurahsCount = useMemo(() => {
    const numbers = new Set();

    Object.values(readingHistory).forEach((day) => {
      (day.surahs || []).forEach((number) => numbers.add(number));
    });

    return numbers.size;
  }, [readingHistory]);

  // Load surah verses from IndexedDB first, then API
  async function loadSurahVerses(number) {
    const offlineData = await getSurahOffline(number);

    if (offlineData?.verses?.length) {
      return offlineData.verses;
    }

    if (!navigator.onLine) {
      throw new Error(
        "هذه السورة غير محمّلة على جهازك. اتصلي بالإنترنت وحمّليها أولًا."
      );
    }

    const response = await fetch(
      `${API}/quran/surah/${number}?script=uthmani`
    );

    if (!response.ok) {
      throw new Error("تعذر تحميل السورة");
    }

    const result = await response.json();
    const verses = extractVerses(result);

    if (!Array.isArray(verses) || verses.length === 0) {
      throw new Error("لم يتم العثور على آيات");
    }

    const surah = surahs.find(
      (item) => getSurahNumber(item) === Number(number)
    );

    await saveSurahOffline(
      number,
      getSurahName(surah),
      verses
    );

    setDownloadedSurahs(await getDownloadedSurahs());

    return verses;
  }

  // Download a surah manually
  async function downloadSurah(surah) {
    const number = getSurahNumber(surah);
    if (!number) return;

    setDownloadingSurah(number);
    setOfflineMessage("");

    try {
      const existing = await getSurahOffline(number);

      if (existing?.verses?.length) {
        setDownloadedSurahs(await getDownloadedSurahs());
        setOfflineMessage(
          `${getSurahName(surah)} محفوظة بالفعل على جهازك.`
        );
        return;
      }

      if (!navigator.onLine) {
        throw new Error(
          "لا يوجد اتصال بالإنترنت لتحميل سورة جديدة."
        );
      }

      const response = await fetch(
        `${API}/quran/surah/${number}?script=uthmani`
      );

      if (!response.ok) {
        throw new Error("تعذر تحميل السورة");
      }

      const result = await response.json();
      const verses = extractVerses(result);

      if (!Array.isArray(verses) || verses.length === 0) {
        throw new Error("لم يتم العثور على آيات");
      }

      await saveSurahOffline(number, getSurahName(surah), verses);

      setDownloadedSurahs(await getDownloadedSurahs());
      setOfflineMessage(
        `تم تحميل ${getSurahName(surah)} للاستعمال دون إنترنت.`
      );
    } catch (error) {
      setOfflineMessage(
        error.message || "تعذر تحميل السورة. حاولي مرة أخرى."
      );
    } finally {
      setDownloadingSurah(null);
    }
  }

  function isSurahDownloaded(surah) {
    const number = getSurahNumber(surah);

    return downloadedSurahs.some(
      (item) => Number(item.number) === number
    );
  }

  async function openSurah(surah) {
    const number = getSurahNumber(surah);
    if (!number) return;

    setSelectedSurah(surah);
    setActive("quran");
    setAyahs([]);
    setLoading(true);
    setApiError("");

    try {
      const verses = await loadSurahVerses(number);

      setAyahs(verses);
      recordActivity(number);
    } catch (error) {
      setApiError(
        error.message || "تعذر تحميل آيات السورة. حاولي مرة أخرى."
      );
    } finally {
      setLoading(false);
    }
  }

  // Saved ayahs
  function toggleSaved(ayah, index, surah = selectedSurah) {
    const surahNumber = getSurahNumber(surah);
    const ayahNumber = Number(
      ayah?.number || ayah?.number_in_surah || index + 1
    );
    const key = `${surahNumber}:${ayahNumber}`;

    setSavedAyahs((previous) => {
      const exists = previous.some((item) => item.key === key);

      if (exists) {
        return previous.filter((item) => item.key !== key);
      }

      return [
        ...previous,
        {
          key,
          surahNumber,
          surahName: getSurahName(surah),
          ayahNumber,
          text: getAyahText(ayah),
        },
      ];
    });
  }

  function isSaved(ayah, index, surah = selectedSurah) {
    const surahNumber = getSurahNumber(surah);
    const ayahNumber = Number(
      ayah?.number || ayah?.number_in_surah || index + 1
    );

    return savedAyahs.some(
      (item) => item.key === `${surahNumber}:${ayahNumber}`
    );
  }

  // Mark memorized
  function markAyahMemorized(ayah, index, surah = selectedSurah) {
    const surahNumber = getSurahNumber(surah);
    const ayahNumber = Number(
      ayah?.number || ayah?.number_in_surah || index + 1
    );
    const key = `${surahNumber}:${ayahNumber}`;
setReviewSchedule((previous) => {
  if (previous[key]) return previous;

  return {
    ...previous,
    [key]: {
      key,
      surahNumber,
      ayahNumber,
      dueDate: dateAfterDays(1),
      intervalDays: 1,
    },
  };
});
    setMemorizedAyahs((previous) => {
      if (previous.includes(key)) return previous;
      return [...previous, key];
    });

    recordActivity(surahNumber);
  }

  // Memorization practice
  async function startPractice(surah) {
    const number = getSurahNumber(surah);
    if (!number) return;

    setPracticeSurah(number);
    setPracticeIndex(0);
    setShowPracticeAnswer(false);
    setPracticeAyahs([]);
    setPracticeLoading(true);
    setActive("memorize");
    setApiError("");

    try {
      const verses = await loadSurahVerses(number);

      setPracticeAyahs(verses);
      recordActivity(number);
    } catch (error) {
      setApiError(
        error.message || "تعذر تحميل آيات التدريب. حاولي مرة أخرى."
      );
      setPracticeSurah("");
    } finally {
      setPracticeLoading(false);
    }
  }

  function markPracticeMemorized() {
    const ayah = practiceAyahs[practiceIndex];
    if (!ayah) return;

   const ayahNumber = Number(
  ayah.number || ayah.number_in_surah || practiceIndex + 1
);
const surahNumber = Number(practiceSurah);
const key = `${surahNumber}:${ayahNumber}`;

setReviewSchedule((previous) => {
  if (previous[key]) return previous;

  return {
    ...previous,
    [key]: {
      key,
      surahNumber,
      ayahNumber,
      dueDate: dateAfterDays(1),
      intervalDays: 1,
    },
  };
});

    setMemorizedAyahs((previous) =>
      previous.includes(key) ? previous : [...previous, key]
    );

    nextPracticeAyah();
  }

  function nextPracticeAyah() {
    setPracticeIndex((index) =>
      Math.min(index + 1, practiceAyahs.length - 1)
    );
    setShowPracticeAnswer(false);
  }

  function resetPractice() {
    setPracticeIndex(0);
    setShowPracticeAnswer(false);
  }

  // Smart Hifdh
  async function startSmartPractice(surah) {
    const number = getSurahNumber(surah);
    if (!number) return;

    setSmartSurah(number);
    setSmartIndex(0);
    setRevealedWords([]);
    setSmartAyahs([]);
    setSmartLoading(true);
    setActive("smart");
    setApiError("");

    try {
      const verses = await loadSurahVerses(number);

      setSmartAyahs(verses);
      recordActivity(number);
    } catch (error) {
      setApiError(
        error.message || "تعذر تحميل آيات الحفظ الذكي. حاولي مرة أخرى."
      );
      setSmartSurah("");
    } finally {
      setSmartLoading(false);
    }
  }

  const currentSmartAyah = smartAyahs[smartIndex];

  const smartWords = currentSmartAyah
    ? getAyahText(currentSmartAyah).trim().split(/\s+/).filter(Boolean)
    : [];

  const hiddenWordIndexes = useMemo(() => {
    if (!smartWords.length) return [];

    const count = Math.min(
      Math.max(1, Number(smartHiddenCount)),
      Math.max(1, smartWords.length - 1)
    );

    const indexes = [];
    const step = smartWords.length / (count + 1);

    for (let i = 1; i <= count; i++) {
      const index = Math.min(
        smartWords.length - 1,
        Math.floor(step * i)
      );

      if (!indexes.includes(index)) indexes.push(index);
    }

    return indexes;
  }, [smartWords.join(" "), smartHiddenCount]);

  const revealedCount = hiddenWordIndexes.filter((index) =>
    revealedWords.includes(index)
  ).length;

  const smartProgress = hiddenWordIndexes.length
    ? Math.round((revealedCount / hiddenWordIndexes.length) * 100)
    : 0;

  function revealSmartWord(index) {
    setRevealedWords((previous) =>
      previous.includes(index) ? previous : [...previous, index]
    );
  }

  function revealAllSmartWords() {
    setRevealedWords(hiddenWordIndexes);
  }

  function resetSmartAyah() {
    setRevealedWords([]);
  }

  function finishSmartAyah() {
    if (!currentSmartAyah) return;

    const ayahNumber = Number(
      currentSmartAyah.number ||
      currentSmartAyah.number_in_surah ||
      smartIndex + 1
    );

    const key = `${smartSurah}:${ayahNumber}`;
    const surahNumber = Number(smartSurah);

setReviewSchedule((previous) => {
  if (previous[key]) return previous;

  return {
    ...previous,
    [key]: {
      key,
      surahNumber,
      ayahNumber,
      dueDate: dateAfterDays(1),
      intervalDays: 1,
    },
  };
});
    setSmartFinishedAyahs((previous) =>
      previous.includes(key) ? previous : [...previous, key]
    );

    setSmartCompleted((previous) => previous + 1);

    setMemorizedAyahs((previous) =>
      previous.includes(key) ? previous : [...previous, key]
    );

    recordActivity(smartSurah);

    if (smartIndex < smartAyahs.length - 1) {
      setSmartIndex((previous) => previous + 1);
      setRevealedWords([]);
    } else {
      setSmartIndex(smartAyahs.length);
      setRevealedWords([]);
    }
  }

  function restartSmartPractice() {
    
    setSmartIndex(0);
    setRevealedWords([]);
  }
// Smart Review System
const dueReviews = useMemo(() => {
  return Object.values(reviewSchedule)
    .filter((item) => item.dueDate <= todayKey())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}, [reviewSchedule]);

const futureReviewsCount = Object.values(reviewSchedule).filter(
  (item) => item.dueDate > todayKey()
).length;

async function startScheduledReview(item) {
  setReviewCurrent(item);
  setReviewAyah(null);
  setShowReviewAnswer(false);
  setReviewLoading(true);
  setApiError("");

  try {
    const verses = await loadSurahVerses(item.surahNumber);

    const verse = verses.find((ayah, index) => {
      const number = Number(
        ayah.number || ayah.number_in_surah || index + 1
      );

      return number === item.ayahNumber;
    });

    if (!verse) {
      throw new Error("لم نتمكن من العثور على هذه الآية.");
    }

    setReviewAyah(verse);
  } catch (error) {
    setApiError(error.message || "تعذر تحميل الآية.");
    setReviewCurrent(null);
  } finally {
    setReviewLoading(false);
  }
}

function completeScheduledReview(isDifficult = false) {
  if (!reviewCurrent) return;

  const previousInterval = reviewCurrent.intervalDays || 0;

  let nextInterval;

  if (isDifficult) {
    nextInterval = 1;
  } else if (previousInterval <= 0) {
    nextInterval = 1;
  } else if (previousInterval <= 1) {
    nextInterval = 3;
  } else if (previousInterval <= 3) {
    nextInterval = 7;
  } else if (previousInterval <= 7) {
    nextInterval = 14;
  } else {
    nextInterval = 30;
  }

  setReviewSchedule((previous) => ({
    ...previous,
    [reviewCurrent.key]: {
      ...previous[reviewCurrent.key],
      dueDate: dateAfterDays(nextInterval),
      intervalDays: nextInterval,
    },
  }));

  setReviewCurrent(null);
  setReviewAyah(null);
  setShowReviewAnswer(false);
}
  // Audio player
  function getListenSurah() {
    return surahs.find(
      (surah) => getSurahNumber(surah) === Number(listenSurah)
    );
  }

  function getListenAyahCount() {
    const surah = getListenSurah();

    return Number(
      surah?.number_of_ayahs ||
      surah?.numberOfAyahs ||
      surah?.ayahs_count ||
      surah?.numberOfAyat ||
      286
    );
  }

  function setAudioSource(url) {
    if (audioObjectUrlRef.current) {
      URL.revokeObjectURL(audioObjectUrlRef.current);
      audioObjectUrlRef.current = "";
    }

    if (url.startsWith("blob:")) {
      audioObjectUrlRef.current = url;
    }

    setAudioUrl(url);
  }

  async function playListenAyah(
    surahNumber = listenSurah,
    ayahNumber = listenAyah,
    selectedReciter = reciter
  ) {
    const audioKey =
      `${Number(surahNumber)}:${Number(ayahNumber)}:${selectedReciter}`;

    try {
      setAudioLoading(true);
      setAudioError("");
      setAudioPlaying(false);
      setListenSurah(String(surahNumber));
      setListenAyah(Number(ayahNumber));

      // First try locally saved audio
      const cachedAudio = await getAudioOffline(audioKey);

      if (cachedAudio?.blob) {
        const localUrl = URL.createObjectURL(cachedAudio.blob);
        setAudioSource(localUrl);
        return;
      }

      if (!navigator.onLine) {
        throw new Error(
          "هذه التلاوة غير محفوظة على جهازك. اتصلي بالإنترنت وشغّليها أولًا."
        );
      }

      const response = await fetch(
        `https://api.alquran.cloud/v1/ayah/${Number(surahNumber)}:${Number(ayahNumber)}/${selectedReciter}`
      );

      if (!response.ok) {
        throw new Error("تعذر الحصول على التلاوة");
      }

      const result = await response.json();
      const remoteUrl = result?.data?.audio;

      if (!remoteUrl) {
        throw new Error("لم يتم العثور على الملف الصوتي");
      }

      let finalUrl = remoteUrl;

      // Try caching audio for future offline playback
      try {
        const audioResponse = await fetch(remoteUrl);

        if (audioResponse.ok) {
          const audioBlob = await audioResponse.blob();

          if (audioBlob.size > 0) {
            await saveAudioOffline(audioKey, audioBlob);
            finalUrl = URL.createObjectURL(audioBlob);
          }
        }
      } catch (storageError) {
        console.warn("Audio could not be cached:", storageError);
      }

      setAudioSource(finalUrl);
    } catch (error) {
      setAudioError(
        error.message ||
        "ما قدرناش نشغلو التلاوة. تأكدي من الإنترنت وحاولي مرة أخرى."
      );
    } finally {
      setAudioLoading(false);
    }
  }

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;

    audioRef.current.load();

    audioRef.current.play()
      .then(() => setAudioPlaying(true))
      .catch(() => {
        setAudioPlaying(false);
        setAudioError("اضغطي على زر التشغيل لبدء التلاوة.");
      });
  }, [audioUrl]);

  function nextListenAyah() {
    const next = listenAyah + 1;

    if (next <= getListenAyahCount()) {
      playListenAyah(listenSurah, next);
    }
  }

  function previousListenAyah() {
    const previous = Math.max(1, listenAyah - 1);
    playListenAyah(listenSurah, previous);
  }

  function changeListenSurah(number) {
    setListenSurah(number);
    setListenAyah(1);
    setAudioSource("");
    setAudioError("");
    setAudioPlaying(false);
  }

  function handleAudioEnded() {
    if (listenAyah < getListenAyahCount()) {
      playListenAyah(listenSurah, listenAyah + 1);
    } else {
      setAudioPlaying(false);
    }
  }

  // Search
  const filteredSurahs = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return surahs;

    return surahs.filter((surah) =>
      `${getSurahName(surah)} ${surah.name || ""} ${surah.number || surah.id}`
        .toLowerCase()
        .includes(query)
    );
  }, [surahs, search]);

  const selectedName = getSurahName(selectedSurah);

  const progress = Math.min(
    100,
    Math.round((memorizedAyahs.length / TOTAL_AYAHS) * 100)
  );

  function changePage(page) {
    setActive(page);
    setMobileMenu(false);
    setSearch("");
    setApiError("");
    setOfflineMessage("");
  }

  const smartSurahName =
    surahs.find((s) => getSurahNumber(s) === Number(smartSurah))
      ? getSurahName(
          surahs.find((s) => getSurahNumber(s) === Number(smartSurah))
        )
      : `سورة رقم ${smartSurah}`;

  function chooseLearningProfile(selectedProfile) {
  const originalProfile = learningProfiles.find(
    (item) => item.id === selectedProfile.id
  );

  if (!originalProfile) return;

  setProfile(originalProfile);

  localStorage.setItem(
    "hifdhi-learning-profile",
    JSON.stringify({ id: originalProfile.id })
  );
}

  if (!profile) {
    return (
<div className="profile-onboarding welcome-page" dir="rtl">        <div className="profile-onboarding-glow profile-glow-one" />
        <div className="profile-onboarding-glow profile-glow-two" />
        <div className="profile-onboarding-inner">
          <div className="profile-brand">
            <span className="profile-brand-icon"><BookOpen size={27} /></span>
            <span>
              <strong>حِفْظِي</strong>
              <small>HIFDHI · رحلتك مع القرآن</small>
            </span>
          </div>

          <div className="profile-intro">
            <span className="profile-eyebrow"><Sparkles size={15} /> تجربة قرآنية تناسبك</span>
            <h1>كيف تحب أن تعيش رحلتك مع القرآن؟</h1>
            <p>اختر الوضع المناسب لك، وسنخصص تجربتك وواجهة التطبيق حسب احتياجاتك.</p>
          </div>

          <div className="profile-grid">
            {learningProfiles.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  className={`profile-choice profile-choice-${item.id}`}
                  key={item.id}
                  onClick={() => chooseLearningProfile(item)}
                >
                  <span className="profile-choice-top">
                    <span className="profile-choice-icon"><Icon size={27} /></span>
                    <span className="profile-choice-en">{item.english}</span>
                  </span>
                  <strong>{item.title}</strong>
                  <span className="profile-choice-description">{item.description}</span>
                  <span className="profile-choice-details">{item.details}</span>
                  <span className="profile-choice-action">اختيار هذا الوضع <ArrowRight size={16} /></span>
                </button>
              );
            })}
          </div>

          <p className="profile-footnote">
            يمكنك تغيير اختيارك لاحقاً. بيانات الحفظ والمراجعة الحالية تبقى محفوظة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app" data-theme={profile.id} dir="rtl">
      {mobileMenu && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
          aria-label="إغلاق القائمة"
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={25} />
          </div>

          <div>
            <h1>حِفْظِي</h1>
            <span>رحلتك مع القرآن</span>
          </div>

          <button
            className="close-menu"
            onClick={() => setMobileMenu(false)}
            aria-label="إغلاق القائمة"
          >
            <X size={20} />
          </button>
        </div>

        <button
          type="button"
          className="profile-switch-button"
          onClick={() => {
            setProfile(null);
            localStorage.removeItem("hifdhi-learning-profile");
            setMobileMenu(false);
          }}
        >
        <span className="profile-switch-icon">
  {(() => {
    const Icon = learningProfiles.find(
      (item) => item.id === profile.id
    )?.icon || GraduationCap;

    return <Icon size={17} />;
  })()}
</span>
          <span>
            <small>الوضع الحالي</small>
            <strong>{profile.title}</strong>
          </span>
          <RefreshCw size={15} className="profile-switch-refresh" />
        </button>

        <div className="sidebar-label">القائمة الرئيسية</div>

        <nav className="nav-list">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                className={`nav-item ${active === item.id ? "active" : ""}`}
                onClick={() => changePage(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {active === item.id && (
                  <span className="nav-active-dot" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-quote">
            <Sparkles size={19} />
            <p>خيركم من تعلم القرآن وعلمه</p>
            <span>صحيح البخاري</span>
          </div>

          <div className="sidebar-footer">
            <Moon size={16} />
            <span>HIFDHI · حِفْظِي</span>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="topbar">
          <div className="topbar-start">
            <button
              className="menu-toggle"
              onClick={() => setMobileMenu(true)}
              aria-label="فتح القائمة"
            >
              <Menu size={22} />
            </button>

            <div>
              <span className="topbar-eyebrow">مرحبًا بك في</span>
              <strong>مساحتك القرآنية</strong>
            </div>
          </div>

          <div className="topbar-badge">
            {isOnline ? (
              <Wifi size={15} className="online-dot" />
            ) : (
              <WifiOff size={15} />
            )}
            {isOnline ? "متصل بالإنترنت" : "وضع دون إنترنت"}
          </div>
         <button
  className="login-btn"
  onClick={() => {
    if (user) {
      supabase.auth.signOut();
    } else {
      setAuthOpen(true);
    }
  }}
>
  {user ? "تسجيل الخروج" : "تسجيل الدخول"}
</button>
        </header>

        {offlineMessage && (
          <div className="error-message">
            <span>{offlineMessage}</span>
            <button
              onClick={() => setOfflineMessage("")}
              aria-label="إغلاق الرسالة"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {apiError && (
          <div className="error-message">
            <span>{apiError}</span>
            <button onClick={() => setApiError("")}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* HOME */}
        {active === "home" && profile.id === "child" && (
          <section className="page-content child-dashboard">
            <div className="child-welcome-card">
              <div className="child-welcome-copy">
                <span className="child-eyebrow"><Sparkles size={15} /> مغامرتك القرآنية</span>
                <h2>أهلاً يا بطل القرآن! 🌈</h2>
                <p>كل آية تتعلمها وكل خطوة تقوم بها تقرّبك من هدفك. هيا نبدأ إنجازًا جديدًا اليوم!</p>
                <button className="child-main-button" onClick={() => changePage("quran")}>
                  <BookOpen size={18} /> ابدأ القراءة <ArrowRight size={17} />
                </button>
              </div>
              <div className="child-welcome-art" aria-hidden="true">
                <span className="child-art-star star-a">✦</span>
                <span className="child-art-star star-b">✧</span>
                <span className="child-art-book">📖</span>
                <span className="child-art-spark">✨</span>
              </div>
            </div>

            <div className="child-stats-grid">
              <article className="child-stat-card child-stars-card">
                <span className="child-stat-icon">⭐</span>
                <strong>{childStars}</strong>
                <span>نجوم جمعتها</span>
              </article>
              <article className="child-stat-card">
                <span className="child-stat-icon">📖</span>
                <strong>{readSurahsCount}</strong>
                <span>سور قرأتها</span>
              </article>
              <article className="child-stat-card">
                <span className="child-stat-icon">🧠</span>
                <strong>{memorizedAyahs.length}</strong>
                <span>آيات حفظتها</span>
              </article>
              <article className="child-stat-card">
                <span className="child-stat-icon">🔥</span>
                <strong>{getActivityStreak()}</strong>
                <span>أيام نشاط متتالية</span>
              </article>
            </div>

            <div className="child-challenge-card">
              <div className="child-card-heading">
                <span className="child-card-icon">🎯</span>
                <div>
                  <span>مهمة اليوم</span>
                  <h3>{todayChallenge.title}</h3>
                </div>
                <span className="child-points-pill">+10 ⭐</span>
              </div>
              <p>{todayChallenge.description}</p>
              <button
                className="child-complete-button"
                disabled={Boolean(challengeDone[todayKey()])}
                onClick={() => setChallengeDone((old) => ({ ...old, [todayKey()]: true }))}
              >
                {challengeDone[todayKey()] ? <><Check size={18} /> أحسنت! أكملت مهمة اليوم</> : <><Trophy size={18} /> أكملت المهمة</>}
              </button>
              <small>اختَر إنجاز المهمة عندما تنتهي منها فعلًا. كل إنجاز يمنحك 10 نجوم.</small>
            </div>

            <div className="child-reward-card">
              <div className="child-reward-top">
                <div>
                  <span className="child-section-kicker">طريق المكافآت</span>
                  <h3>{nextChildReward ? `باقي لك ${nextChildReward.stars - childStars} نجمة للمكافأة القادمة` : "رائع! وصلت إلى كل المكافآت"}</h3>
                </div>
                <span className="child-reward-trophy">🏆</span>
              </div>
              <div className="child-reward-track"><div style={{ width: `${childRewardProgress}%` }} /></div>
              <div className="child-reward-progress-label"><span>{childStars} نجمة</span><span>{nextChildReward ? `${nextChildReward.stars} نجمة` : "كل المكافآت مفتوحة"}</span></div>
              <div className="child-reward-list">
                {childRewards.map((reward) => (
                  <div className={`child-reward-item ${childStars >= reward.stars ? "unlocked" : ""}`} key={reward.stars}>
                    <span>{reward.icon}</span>
                    <small>{reward.title}</small>
                    <b>{childStars >= reward.stars ? "مفتوحة" : `${reward.stars} ⭐`}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="child-quick-actions">
              <button onClick={() => changePage("memorize")}><span>🧠</span><strong>وقت الحفظ</strong><small>تدرّب على آيات جديدة</small></button>
              <button onClick={() => changePage("challenge")}><span>🎁</span><strong>تحديات أخرى</strong><small>اكتشف قيمة جديدة</small></button>
              <button onClick={() => changePage("activity")}><span>🌟</span><strong>إنجازاتي</strong><small>شاهد رحلتك وتقدمك</small></button>
            </div>
          </section>
        )}

        {active === "home" && profile.id !== "child" && (
          <section className="page-content">
            <div className="hero">
              <div className="hero-content">
                <span className="hero-kicker">
                  <Sparkles size={15} />
                  ابدأ رحلتك اليوم
                </span>

                <h2>وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ</h2>

                <p>
                  فهل من مُدَّكِر؟ اجعل لك مع القرآن وردًا لا ينقطع.
                </p>

               <button
  className="primary-button"
  onClick={() => changePage("quran")}
>
  <BookOpen size={18} />
  ابدأ القراءة
  <ArrowRight size={17} />
</button>
</div>
              <div className="hero-decoration">
                <div className="hero-orbit orbit-one" />
                <div className="hero-orbit orbit-two" />
                <div className="hero-book">
                  <BookOpen size={76} strokeWidth={1.1} />
                </div>
                <Sparkles className="hero-sparkle sparkle-one" size={22} />
                <Sparkles className="hero-sparkle sparkle-two" size={16} />
              </div>
            </div>

            <div className="section-heading">
              <div>
                <span className="section-kicker">إنجازاتك</span>
                <h3>ملخص رحلتك</h3>
              </div>

              <span className="section-note">
                تقدّمك محفوظ على هذا الجهاز
              </span>
            </div>

            <div className="stats-grid">
            <button
  type="button"
  className="stat-card"
  onClick={() => changePage("quran")}
  aria-label="افتح القرآن الكريم"
>
  <div className="stat-icon blue"><BookOpen size={21} /></div>
  <div className="stat-number">{readSurahsCount}</div>
  <div className="stat-label">سور قرأتها</div>
</button>

              <button type="button" className="stat-card" onClick={() => changePage("memorize")} aria-label="افتح الحفظ والمراجعة">
                <div className="stat-icon gold"><Brain size={21} /></div>
                <div className="stat-number">{memorizedAyahs.length}</div>
                <div className="stat-label">آيات حفظتها</div>
              </button>

              <button type="button" className="stat-card" onClick={() => changePage("activity")} aria-label="افتح سجل النشاط">
                <div className="stat-icon purple"><Flame size={21} /></div>
                <div className="stat-number">{getActivityStreak()}</div>
                <div className="stat-label">أيام متتالية</div>
              </button>

              <button type="button" className="stat-card" onClick={() => changePage("saved")} aria-label="افتح الآيات المحفوظة">
                <div className="stat-icon silver"><Bookmark size={21} /></div>
                <div className="stat-number">{savedAyahs.length}</div>
                <div className="stat-label">آيات محفوظة للرجوع</div>
              </button>
            </div>

            <div className="progress-card">
              <div className="progress-top">
                <div>
                  <span className="section-kicker">إنجاز الحفظ</span>
                  <h3>رحلتك نحو إتمام حفظ القرآن</h3>
                </div>
                <div className="progress-percent">{progress}%</div>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="progress-bottom">
                <span>{memorizedAyahs.length.toLocaleString("ar")} آية محفوظة</span>
                <span>من ٦٢٣٦ آية</span>
              </div>
            </div>

            <div className="section-heading feature-heading">
              <div>
                <span className="section-kicker">اكتشف حِفْظِي</span>
                <h3>ماذا تريد أن تفعل اليوم؟</h3>
              </div>
            </div>

            <div className="features-grid">
              <button className="feature-card" onClick={() => changePage("quran")}>
                <div className="feature-icon"><BookOpen size={23} /></div>
                <h4>تلاوة القرآن</h4>
                <p>اقرأ السور والآيات بخط واضح ومريح.</p>
                <span className="feature-link">ابدأ القراءة <ArrowRight size={15} /></span>
              </button>

              <button className="feature-card" onClick={() => changePage("memorize")}>
                <div className="feature-icon"><Brain size={23} /></div>
                <h4>الحفظ والمراجعة</h4>
                <p>تدرّب على حفظ الآيات وراجع ما حفظته.</p>
                <span className="feature-link">ابدأ الحفظ <ArrowRight size={15} /></span>
              </button>

              <button className="feature-card" onClick={() => changePage("smart")}>
                <div className="feature-icon"><Zap size={23} /></div>
                <h4>الحفظ الذكي</h4>
                <p>اختبر ذاكرتك بإخفاء كلمات من الآيات.</p>
                <span className="feature-link">جرّب الآن <ArrowRight size={15} /></span>
              </button>

              <button className="feature-card" onClick={() => changePage("saved")}>
                <div className="feature-icon"><BookmarkCheck size={23} /></div>
                <h4>آياتي المفضلة</h4>
                <p>احتفظ بالآيات التي تريد الرجوع إليها.</p>
                <span className="feature-link">عرض المحفوظات <ArrowRight size={15} /></span>
              </button>
            </div>
            <div className="section-heading feature-heading">
              <div>
                <span className="section-kicker">رفقة قرآنية يومية</span>
                <h3>مساحة لقلبك وتدبّرك</h3>
              </div>
            </div>
            <div className="features-grid new-features-grid">
              <button className="feature-card" onClick={() => changePage("daily")}><div className="feature-icon"><CalendarDays size={23} /></div><h4>آية اليوم</h4><p>آية مختارة ومعنى ميسّر للتأمل.</p><span className="feature-link">اقرأ آية اليوم <ArrowRight size={15} /></span></button>
              <button className="feature-card" onClick={() => changePage("heart")}><div className="feature-icon"><Heart size={23} /></div><h4>رسالة لقلبك</h4><p>اختر شعورك واكتشف آية تذكّرك بمعنى قرآني.</p><span className="feature-link">افتح المساحة <ArrowRight size={15} /></span></button>
              <button className="feature-card" onClick={() => changePage("challenge")}><div className="feature-icon"><Gift size={23} /></div><h4>تحدي التطبيق</h4><p>حوّل قيمة قرآنية إلى عمل صغير اليوم.</p><span className="feature-link">ابدأ التحدي <ArrowRight size={15} /></span></button>
              <button className="feature-card" onClick={() => changePage("journal")}><div className="feature-icon"><PenLine size={23} /></div><h4>بصمتي القرآنية</h4><p>دوّن ما تعلمته وكيف ستطبقه في حياتك.</p><span className="feature-link">اكتب تأملك <ArrowRight size={15} /></span></button>
              <button className="feature-card" onClick={() => changePage("journey")}><div className="feature-icon"><Map size={23} /></div><h4>خريطة رحلتي</h4><p>تابع القراءة والحفظ والتدبر في مكان واحد.</p><span className="feature-link">شاهد تقدمك <ArrowRight size={15} /></span></button>
            </div>
          </section>
        )}

        {/* QURAN */}
        {active === "quran" && (
          <section className="page-content">
            <div className="page-title-row">
              <div>
                <span className="section-kicker">القرآن الكريم</span>
                <h2>المصحف الشريف</h2>
                <p>اختر سورة وابدأ تلاوتك بتدبر وطمأنينة.</p>
              </div>

              {selectedSurah && (
                <button
                  className="back-button"
                  onClick={() => setSelectedSurah(null)}
                >
                  <ChevronLeft size={17} />
                  قائمة السور
                </button>
              )}
            </div>

            {!selectedSurah ? (
              <>
                <div className="search-box">
                  <Search size={19} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="ابحث عن سورة..."
                  />
                  {search && (
                    <button onClick={() => setSearch("")}>
                      <X size={17} />
                    </button>
                  )}
                </div>

                {surahs.length === 0 && !apiError ? (
                  <div className="loading-state">
                    <div className="loader" />
                    جارٍ تحميل السور...
                  </div>
                ) : (
                  <div className="surah-grid">
                    {filteredSurahs.map((surah, index) => {
                      const number = getSurahNumber(surah) || index + 1;
                      const downloaded = isSurahDownloaded(surah);

                      return (
                        <div className="surah-card" key={number}>
                          <button
                            className="surah-card-open"
                            onClick={() => openSurah(surah)}
                          >
                            <span className="surah-number">{number}</span>
                            <span className="surah-info">
                              <strong>{getSurahName(surah)}</strong>
                              <small>
                                {surah.name_english ||
                                  surah.nameEnglish ||
                                  surah.english_name ||
                                  `السورة رقم ${number}`}
                              </small>
                            </span>
                            <BookOpen size={19} className="surah-book-icon" />
                          </button>

                          <button
                            className="surah-download-button"
                            onClick={() => downloadSurah(surah)}
                            disabled={
                              downloadingSurah === number || downloaded
                            }
                            title={
                              downloaded
                                ? "محفوظة دون إنترنت"
                                : "تحميل السورة"
                            }
                          >
                            {downloadingSurah === number ? (
                              <span className="audio-mini-loader" />
                            ) : downloaded ? (
                              <CircleCheck size={18} />
                            ) : (
                              <Download size={18} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {filteredSurahs.length === 0 && surahs.length > 0 && (
                  <div className="empty-state">
                    ما لقيناش سورة بهذا الاسم.
                  </div>
                )}

                <div className="section-note">
                  السور المحمّلة على جهازك: {downloadedSurahs.length}
                </div>
              </>
            ) : (
              <div className="mushaf-container">
                <div className="mushaf-header">
                  <span>الجزء من المصحف الشريف</span>
                  <h3>{selectedName}</h3>
                  <span>{ayahs.length} آية</span>
                </div>

                {loading ? (
                  <div className="loading-state">
                    <div className="loader" />
                    جارٍ تحميل الآيات...
                  </div>
                ) : (
                  <>
                    {getSurahNumber(selectedSurah) !== 1 &&
                      getSurahNumber(selectedSurah) !== 9 && (
                        <div className="bismillah">
                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </div>
                      )}

                    <div className="mushaf-text">
                      {ayahs.map((ayah, index) => {
                        const ayahNumber = Number(
                          ayah.number || ayah.number_in_surah || index + 1
                        );

                        const saved = isSaved(ayah, index);
                        const memorized = memorizedAyahs.includes(
                          `${getSurahNumber(selectedSurah)}:${ayahNumber}`
                        );

                        return (
                          <span className="ayah-inline" key={ayahNumber}>
                            <span className="ayah-text">
                              {getAyahText(ayah)}
                            </span>

                            <span className="ayah-actions">
                              <button
                                className={`ayah-action ${saved ? "is-saved" : ""}`}
                                onClick={() => toggleSaved(ayah, index)}
                                title="حفظ في المفضلة"
                              >
                                <Bookmark size={13} />
                              </button>

                              <button
                                className={`ayah-action ${memorized ? "is-memorized" : ""}`}
                                onClick={() => markAyahMemorized(ayah, index)}
                                title="تحديد كمحفوظة"
                              >
                                <Check size={13} />
                              </button>
                            </span>

                            <span className="ayah-number">{ayahNumber}</span>
                          </span>
                        );
                      })}
                    </div>

                    {ayahs.length === 0 && !loading && (
                      <div className="empty-state">
                        لا توجد آيات لعرضها.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* MEMORIZATION */}
        {active === "memorize" && (
          <section className="page-content">
            <div className="page-title-row">
              <div>
                <span className="section-kicker">ثبّت حفظك</span>
                <h2>الحفظ والمراجعة</h2>
                <p>اختر سورة، اقرأ الآية، ثم حاول استرجاعها من ذاكرتك.</p>
              </div>
              <div className="memorize-title-icon"><Brain size={27} /></div>
            </div>

            {!practiceSurah ? (
              <div className="practice-start-card">
                <div className="practice-start-icon">
                  <GraduationCap size={36} />
                </div>
                <h3>ابدأ جلسة الحفظ</h3>
                <p>اختر السورة التي تريد مراجعتها، وسنرافقك آية بآية.</p>

                <div className="practice-surah-list">
                  {surahs.map((surah, index) => {
                    const number = getSurahNumber(surah) || index + 1;

                    return (
                      <button
                        className="practice-surah-option"
                        key={number}
                        onClick={() => startPractice(surah)}
                      >
                        <span className="surah-number">{number}</span>
                        <strong>{getSurahName(surah)}</strong>
                        <ArrowRight size={16} />
                      </button>
                    );
                  })}
                </div>

                {surahs.length === 0 && (
                  <button className="primary-button" onClick={fetchSurahs}>
                    تحميل قائمة السور
                  </button>
                )}
              </div>
            ) : (
              <div className="practice-card">
                <div className="practice-card-top">
                  <div>
                    <span className="section-kicker">جلسة المراجعة</span>
                    <h3>
                      {surahs.find(
                        (s) => getSurahNumber(s) === Number(practiceSurah)
                      )
                        ? getSurahName(
                            surahs.find(
                              (s) => getSurahNumber(s) === Number(practiceSurah)
                            )
                          )
                        : `سورة رقم ${practiceSurah}`}
                    </h3>
                  </div>

                  <button
                    className="back-button"
                    onClick={() => setPracticeSurah("")}
                  >
                    تغيير السورة
                  </button>
                </div>

                {practiceLoading ? (
                  <div className="loading-state">
                    <div className="loader" />
                    جارٍ تحضير جلسة الحفظ...
                  </div>
                ) : practiceAyahs.length > 0 ? (
                  <>
                    <div className="practice-progress">
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${((practiceIndex + 1) / practiceAyahs.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span>
                        الآية {practiceIndex + 1} من {practiceAyahs.length}
                      </span>
                    </div>

                    <div className="practice-ayah-box">
                      {showPracticeAnswer ? (
                        <p className="practice-ayah-text">
                          {getAyahText(practiceAyahs[practiceIndex])}
                        </p>
                      ) : (
                        <div className="hidden-answer">
                          <Moon size={30} />
                          <h4>حاولي تذكّر الآية</h4>
                          <p>خذي وقتك، ثم اضغطي على إظهار الآية.</p>
                        </div>
                      )}
                    </div>

                    <div className="practice-actions">
                      {!showPracticeAnswer ? (
                        <button
                          className="primary-button"
                          onClick={() => setShowPracticeAnswer(true)}
                        >
                          <BookOpen size={17} />
                          إظهار الآية
                        </button>
                      ) : (
                        <>
                          <button
                            className="secondary-button"
                            onClick={() => setShowPracticeAnswer(false)}
                          >
                            <RotateCcw size={17} />
                            أخفي الآية
                          </button>

                          <button
                            className="primary-button"
                            onClick={markPracticeMemorized}
                            disabled={
                              practiceIndex === practiceAyahs.length - 1
                            }
                          >
                            <Check size={17} />
                            حفظتها، التالي
                          </button>
                        </>
                      )}
                    </div>

                    {practiceIndex === practiceAyahs.length - 1 &&
                      showPracticeAnswer && (
                        <div className="practice-complete">
                          <CircleCheck size={17} />
                          وصلتِ إلى آخر آية في هذه السورة.
                        </div>
                      )}

                    {practiceIndex === practiceAyahs.length - 1 && (
                      <button
                        className="secondary-button"
                        onClick={resetPractice}
                      >
                        <RotateCcw size={17} />
                        إعادة المراجعة من البداية
                      </button>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    لم نتمكن من تحميل آيات هذه السورة.
                  </div>
                )}
              </div>
            )}

            <div className="memorized-summary">
              <div className="stat-icon gold"><Target size={21} /></div>
              <div>
                <strong>{memorizedAyahs.length} آية</strong>
                <span>إجمالي الآيات التي علّمتِها كمحفوظة</span>
              </div>
            </div>
          </section>
        )}

        {/* SMART HIFDH */}
        {active === "smart" && (
          <section className="page-content smart-page">
            <div className="page-title-row">
              <div>
                <span className="section-kicker">
                  <Sparkles size={14} />
                  تقنية الحفظ التفاعلي
                </span>
                <h2>الحفظ الذكي</h2>
                <p>
                  اختبري ذاكرتك! نخفي بعض كلمات الآية وأنتِ تحاولي استرجاعها.
                </p>
              </div>

              <div className="memorize-title-icon smart-title-icon">
                <Zap size={28} />
              </div>
            </div>

            <div className="smart-intro-card">
              <div className="smart-intro-icon">
                <Brain size={31} />
              </div>
              <div>
                <h3>تعلّم بالتذكّر النشط</h3>
                <p>
                  كلما حاولتِ استرجاع الكلمات بنفسك، ساعدتِ على تثبيت الحفظ.
                  اضغطي على الكلمة المخفية بعد محاولة تذكّرها.
                </p>
              </div>
            </div>

            <div className="smart-stats">
              <div className="smart-stat-card">
                <Trophy size={20} />
                <strong>{smartCompleted}</strong>
                <span>آيات أتممتِها</span>
              </div>

              <div className="smart-stat-card">
                <Target size={20} />
                <strong>{smartFinishedAyahs.length}</strong>
                <span>آيات راجعتِها</span>
              </div>

              <div className="smart-stat-card">
                <Flame size={20} />
                <strong>{memorizedAyahs.length}</strong>
                <span>إجمالي المحفوظ</span>
              </div>
            </div>

            {!smartSurah ? (
              <div className="smart-start-card">
                <div className="smart-start-heading">
                  <div>
                    <span className="section-kicker">الخطوة الأولى</span>
                    <h3>اختاري سورة للتدريب</h3>
                    <p>ابدئي بسورة تعرفينها حتى تختبري مدى ثبات حفظك.</p>
                  </div>
                  <BookOpen size={29} />
                </div>

                <label
                  className="smart-setting-label"
                  htmlFor="smart-hidden-count"
                >
                  عدد الكلمات المخفية
                </label>

                <select
                  id="smart-hidden-count"
                  className="smart-select"
                  value={smartHiddenCount}
                  onChange={(event) =>
                    setSmartHiddenCount(Number(event.target.value))
                  }
                >
                  <option value={2}>كلمتان - سهل</option>
                  <option value={3}>3 كلمات - متوسط</option>
                  <option value={5}>5 كلمات - صعب</option>
                  <option value={7}>7 كلمات - تحدّي</option>
                </select>

                <div className="smart-surah-grid">
                  {surahs.map((surah, index) => {
                    const number = getSurahNumber(surah) || index + 1;

                    return (
                      <button
                        key={number}
                        className="smart-surah-option"
                        onClick={() => startSmartPractice(surah)}
                      >
                        <span className="surah-number">{number}</span>
                        <strong>{getSurahName(surah)}</strong>
                        <ArrowRight size={16} />
                      </button>
                    );
                  })}
                </div>

                {surahs.length === 0 && (
                  <div className="loading-state">
                    <div className="loader" />
                    جارٍ تحميل قائمة السور...
                  </div>
                )}
              </div>
            ) : (
              <div className="smart-session-card">
                <div className="smart-session-top">
                  <div>
                    <span className="section-kicker">جلسة الحفظ الذكي</span>
                    <h3>{smartSurahName}</h3>
                  </div>

                  <button
                    className="back-button"
                    onClick={() => {
                      setSmartSurah("");
                      setSmartAyahs([]);
                      setSmartIndex(0);
                      setRevealedWords([]);
                    }}
                  >
                    تغيير السورة
                  </button>
                </div>

                {smartLoading ? (
                  <div className="loading-state">
                    <div className="loader" />
                    جارٍ تحضير التمرين...
                  </div>
                ) : smartIndex >= smartAyahs.length &&
                  smartAyahs.length > 0 ? (
                  <div className="smart-finish">
                    <div className="smart-finish-icon">
                      <Trophy size={42} />
                    </div>
                    <h3>ما شاء الله! أكملتِ السورة</h3>
                    <p>
                      أتممتِ تدريب الحفظ الذكي على جميع آيات هذه السورة.
                      واصلي المراجعة لتثبيت حفظك.
                    </p>

                    <div className="smart-finish-actions">
                      <button
                        className="primary-button"
                        onClick={restartSmartPractice}
                      >
                        <RotateCcw size={17} />
                        إعادة التدريب
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() => setSmartSurah("")}
                      >
                        اختيار سورة أخرى
                      </button>
                    </div>
                  </div>
                ) : currentSmartAyah ? (
                  <>
                    <div className="smart-progress-info">
                      <span>
                        الآية {smartIndex + 1} من {smartAyahs.length}
                      </span>
                      <span>{smartProgress}% من الكلمات المكشوفة</span>
                    </div>

                    <div className="progress-track smart-progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${smartProgress}%` }}
                      />
                    </div>

                    <div className="smart-instruction">
                      <Lightbulb size={18} />
                      حاولي تذكّر الكلمات المخفية، ثم اضغطي على الفراغ لكشفها.
                    </div>

                    <div className="smart-ayah-box">
                      <div className="smart-ayah-label">
                        <span>تحدّي الآية</span>
                        <span>
                          {revealedCount} / {hiddenWordIndexes.length} كلمات
                        </span>
                      </div>

                      <div className="smart-ayah-text">
                        {smartWords.map((word, index) => {
                          const isHidden = hiddenWordIndexes.includes(index);
                          const isRevealed = revealedWords.includes(index);

                          return (
                            <span
                              key={`${index}-${word}`}
                              className={
                                isHidden
                                  ? `smart-word ${
                                      isRevealed
                                        ? "smart-word-revealed"
                                        : "smart-word-hidden"
                                    }`
                                  : "smart-word"
                              }
                            >
                              {isHidden && !isRevealed ? (
                                <button
                                  className="smart-word-blank"
                                  onClick={() => revealSmartWord(index)}
                                  aria-label="كشف الكلمة المخفية"
                                  title="اضغطي لكشف الكلمة"
                                >
                                  <Eye size={15} />
                                  <span>؟</span>
                                </button>
                              ) : (
                                <span>{word}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>

                      <div className="smart-ayah-number">
                        الآية{" "}
                        {Number(
                          currentSmartAyah.number ||
                          currentSmartAyah.number_in_surah ||
                          smartIndex + 1
                        )}
                      </div>
                    </div>

                    <div className="smart-hint">
                      <EyeOff size={17} />
                      <span>الكلمات المخفية: {hiddenWordIndexes.length}</span>
                      <span className="smart-hint-divider">·</span>
                      <span>
                        المتبقي: {hiddenWordIndexes.length - revealedCount}
                      </span>
                    </div>

                    <div className="smart-actions">
                      <button
                        className="secondary-button"
                        onClick={resetSmartAyah}
                      >
                        <RotateCcw size={17} />
                        إعادة إخفاء الكلمات
                      </button>

                      <button
                        className="secondary-button"
                        onClick={revealAllSmartWords}
                        disabled={revealedCount === hiddenWordIndexes.length}
                      >
                        <Eye size={17} />
                        كشف كل الكلمات
                      </button>
                    </div>

                    {revealedCount === hiddenWordIndexes.length && (
                      <div className="smart-success">
                        <CircleCheck size={19} />
                        أحسنتِ! كشفتِ جميع الكلمات. يمكنك الانتقال للآية التالية.
                      </div>
                    )}

                    <button
                      className="primary-button smart-next-button"
                      onClick={finishSmartAyah}
                      disabled={revealedCount !== hiddenWordIndexes.length}
                    >
                      <Check size={18} />
                      {smartIndex === smartAyahs.length - 1
                        ? "إنهاء التدريب"
                        : "أتممت الحفظ · الآية التالية"}
                      <ArrowRight size={17} />
                    </button>
                  </>
                ) : (
                  <div className="empty-state">
                    لم نتمكن من تحميل آيات هذه السورة.
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* SAVED */}
        {/* SMART REVIEW */}
{active === "review" && (
  <section className="page-content">
    <div className="page-title-row">
      <div>
        <span className="section-kicker">ثبّتي ما حفظتِ</span>
        <h2>مراجعتي اليوم</h2>
        <p>آياتك المستحقة للمراجعة، في الوقت المناسب.</p>
      </div>

      <div className="memorize-title-icon">
        <CalendarDays size={27} />
      </div>
    </div>

    <div className="smart-stats">
      <div className="smart-stat-card">
        <Target size={20} />
        <strong>{dueReviews.length}</strong>
        <span>مراجعات اليوم</span>
      </div>

      <div className="smart-stat-card">
        <CalendarDays size={20} />
        <strong>{futureReviewsCount}</strong>
        <span>مراجعات قادمة</span>
      </div>

      <div className="smart-stat-card">
        <BookmarkCheck size={20} />
        <strong>{Object.keys(reviewSchedule).length}</strong>
        <span>آيات في البرنامج</span>
      </div>
    </div>

    {reviewCurrent ? (
      <div className="practice-card">
        <div className="practice-card-top">
          <div>
            <span className="section-kicker">جلسة المراجعة</span>
            <h3>
              {surahs.find(
                (s) => getSurahNumber(s) === reviewCurrent.surahNumber
              )
                ? getSurahName(
                    surahs.find(
                      (s) => getSurahNumber(s) === reviewCurrent.surahNumber
                    )
                  )
                : `سورة رقم ${reviewCurrent.surahNumber}`}
            </h3>
          </div>

          <button
            className="back-button"
            onClick={() => {
              setReviewCurrent(null);
              setReviewAyah(null);
              setShowReviewAnswer(false);
            }}
          >
            رجوع
          </button>
        </div>

        <div className="practice-progress">
          <span>الآية رقم {reviewCurrent.ayahNumber}</span>
        </div>

        <div className="practice-ayah-box">
          {reviewLoading ? (
            <div className="loading-state">
              <div className="loader" />
              جارٍ تحميل الآية...
            </div>
          ) : showReviewAnswer && reviewAyah ? (
            <p className="practice-ayah-text">
              {getAyahText(reviewAyah)}
            </p>
          ) : (
            <div className="hidden-answer">
              <Brain size={30} />
              <h4>اختبري ذاكرتك</h4>
              <p>حاولي تذكّر الآية قبل إظهارها.</p>
            </div>
          )}
        </div>

        {!showReviewAnswer && !reviewLoading && (
          <button
            className="primary-button"
            onClick={() => setShowReviewAnswer(true)}
            disabled={!reviewAyah}
          >
            <Eye size={17} />
            إظهار الآية
          </button>
        )}

        {showReviewAnswer && reviewAyah && (
          <div className="practice-actions">
            <button
              className="secondary-button"
              onClick={() => completeScheduledReview(true)}
            >
              <RotateCcw size={17} />
              كانت صعبة عليّ
            </button>

            <button
              className="primary-button"
              onClick={() => completeScheduledReview(false)}
            >
              <Check size={17} />
              راجعتها بنجاح
            </button>
          </div>
        )}
      </div>
    ) : dueReviews.length > 0 ? (
      <div className="practice-start-card">
        <div className="practice-start-icon">
          <Brain size={36} />
        </div>

        <h3>لديكِ {dueReviews.length} آية للمراجعة</h3>
        <p>اختاري آية وابدئي مراجعتها. بالتوفيق!</p>

        <div className="practice-surah-list">
          {dueReviews.map((item) => {
            const surah = surahs.find(
              (s) => getSurahNumber(s) === item.surahNumber
            );

            return (
              <button
                className="practice-surah-option"
                key={item.key}
                onClick={() => startScheduledReview(item)}
              >
                <span className="surah-number">
                  {item.surahNumber}
                </span>

                <strong>
                  {getSurahName(surah)} · الآية {item.ayahNumber}
                </strong>

                <ArrowRight size={16} />
              </button>
            );
          })}
        </div>
      </div>
    ) : (
      <div className="empty-card">
        <div className="empty-icon">
          <CircleCheck size={32} />
        </div>

        <h3>ما شاء الله! لا توجد مراجعات مستحقة اليوم.</h3>
        <p>
          {futureReviewsCount > 0
            ? `لديكِ ${futureReviewsCount} مراجعة قادمة. واصلي الحفظ والمراجعة.`
            : "علّمي آية كمحفوظة، وسنضيفها تلقائيًا إلى برنامج المراجعة."}
        </p>

        <button
          className="primary-button"
          onClick={() => changePage("memorize")}
        >
          <Brain size={17} />
          اذهبي إلى الحفظ
        </button>
      </div>
    )}
  </section>
)}
        {active === "saved" && (
          <section className="page-content">
            <div className="page-title-row">
              <div>
                <span className="section-kicker">مجموعتك الخاصة</span>
                <h2>الآيات المحفوظة</h2>
                <p>الآيات التي أضفتِها إلى قائمتك للرجوع إليها لاحقًا.</p>
              </div>
              <div className="memorize-title-icon">
                <BookmarkCheck size={27} />
              </div>
            </div>

            {savedAyahs.length === 0 ? (
              <div className="empty-card">
                <div className="empty-icon"><Bookmark size={32} /></div>
                <h3>قائمتك فارغة حاليًا</h3>
                <p>
                  عندما تجدين آية تريدين الاحتفاظ بها،
                  اضغطي على علامة الحفظ بجانبها.
                </p>
                <button
                  className="primary-button"
                  onClick={() => changePage("quran")}
                >
                  <BookOpen size={17} />
                  تصفحي القرآن
                </button>
              </div>
            ) : (
              <div className="saved-list">
                {savedAyahs.map((item) => (
                  <div className="saved-ayah-card" key={item.key}>
                    <div className="saved-card-top">
                      <span>
                        {item.surahName} · الآية {item.ayahNumber}
                      </span>
                      <button
                        className="remove-saved"
                        onClick={() =>
                          setSavedAyahs((previous) =>
                            previous.filter(
                              (saved) => saved.key !== item.key
                            )
                          )
                        }
                        title="إزالة من المحفوظات"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    <p>{item.text}</p>

                    <button
                      className="text-button"
                      onClick={() => {
                        const surah = surahs.find(
                          (s) =>
                            getSurahNumber(s) === item.surahNumber
                        );

                        if (surah) openSurah(surah);
                        else changePage("quran");
                      }}
                    >
                      فتح السورة
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* LISTEN */}
        {active === "listen" && (
          <section className="page-content">
            <div className="page-title-row">
              <div>
                <span className="section-kicker">أنصت بقلبك</span>
                <h2>الاستماع إلى القرآن</h2>
                <p>اختر السورة والقارئ، واستمتع بتلاوة القرآن الكريم.</p>
              </div>
              <div className="memorize-title-icon">
                <Headphones size={27} />
              </div>
            </div>

            <div className="audio-player-card">
              <div className="audio-cover">
                <div className="audio-cover-circle">
                  <BookOpen size={52} strokeWidth={1.2} />
                </div>
                <Sparkles className="audio-sparkle audio-sparkle-one" size={20} />
                <Sparkles className="audio-sparkle audio-sparkle-two" size={15} />
              </div>

              <span className="section-kicker">مشغّل التلاوة</span>
              <h3>{getSurahName(getListenSurah())}</h3>

              <p className="audio-ayah-label">
                الآية {listenAyah} ·{" "}
                {reciters.find((item) => item.id === reciter)?.name}
              </p>

              <div className="audio-selectors">
                <label>
                  <span>اختيار السورة</span>
                  <select
                    value={listenSurah}
                    onChange={(event) =>
                      changeListenSurah(event.target.value)
                    }
                  >
                    {surahs.map((surah, index) => {
                      const number = getSurahNumber(surah) || index + 1;

                      return (
                        <option key={number} value={number}>
                          {number}. {getSurahName(surah)}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label>
                  <span>اختيار القارئ</span>
                  <select
                    value={reciter}
                    onChange={(event) => {
                      const value = event.target.value;
                      setReciter(value);

                      if (audioUrl) {
                        playListenAyah(listenSurah, listenAyah, value);
                      }
                    }}
                  >
                    {reciters.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="audio-ayah-control">
                <label htmlFor="listen-ayah">رقم الآية</label>
                <input
                  id="listen-ayah"
                  type="number"
                  min="1"
                  max={getListenAyahCount()}
                  value={listenAyah}
                  onChange={(event) => {
                    const value = Math.max(
                      1,
                      Math.min(
                        getListenAyahCount(),
                        Number(event.target.value) || 1
                      )
                    );
                    setListenAyah(value);
                  }}
                />
              </div>

              {audioError && (
                <div className="audio-error">{audioError}</div>
              )}

              <audio
                ref={audioRef}
                src={audioUrl || undefined}
                controls
                onPlay={() => setAudioPlaying(true)}
                onPause={() => setAudioPlaying(false)}
                onEnded={handleAudioEnded}
                className="audio-element"
              />

              <div className="audio-controls">
                <button
                  className="audio-skip-button"
                  onClick={previousListenAyah}
                  disabled={listenAyah <= 1 || audioLoading}
                  title="الآية السابقة"
                >
                  <ChevronLeft size={22} />
                </button>

                <button
                  className="audio-main-button"
                  onClick={() => {
                    if (audioUrl && audioRef.current) {
                      if (audioPlaying) {
                        audioRef.current.pause();
                      } else {
                        audioRef.current.play().catch(() => {
                          setAudioError(
                            "تعذر تشغيل الصوت. حاولي مجددًا."
                          );
                        });
                      }
                    } else {
                      playListenAyah();
                    }
                  }}
                  disabled={audioLoading || surahs.length === 0}
                  title="تشغيل التلاوة"
                >
                  {audioLoading ? (
                    <span className="audio-mini-loader" />
                  ) : audioPlaying ? (
                    <Volume2 size={25} />
                  ) : (
                    <Play size={25} fill="currentColor" />
                  )}
                </button>

                <button
                  className="audio-skip-button"
                  onClick={nextListenAyah}
                  disabled={
                    listenAyah >= getListenAyahCount() || audioLoading
                  }
                  title="الآية التالية"
                >
                  <ChevronLeft
                    size={22}
                    className="next-audio-icon"
                  />
                </button>
              </div>

              <p className="audio-status">
                {audioLoading
                  ? "جارٍ تحضير التلاوة..."
                  : audioPlaying
                    ? "التلاوة قيد التشغيل"
                    : "اختاري السورة والقارئ ثم اضغطي تشغيل"}
              </p>

              <button
                className="audio-play-surah"
                onClick={() => playListenAyah(listenSurah, 1)}
                disabled={audioLoading}
              >
                <RotateCcw size={16} />
                إعادة السورة من البداية
              </button>
            </div>
          </section>
        )}

        {/* DAILY VERSE */}
        {active === "daily" && (
          <section className="page-content feature-page">
            <div className="page-title-row"><div><span className="section-kicker">وقفة يومية مع كتاب الله</span><h2>آية اليوم</h2><p>آية نتأمل معناها ونحمل أثرها معنا.</p></div><div className="memorize-title-icon"><CalendarDays size={27} /></div></div>
            <article className="reflection-card daily-card">
              <span className="reflection-label"><Sparkles size={16} /> {todayDailyVerse.title}</span>
              {dailyLoading ? <div className="loading-state"><div className="loader" /> جارٍ تحميل الآية...</div> : dailyAyah ? <><p className="feature-ayah">{dailyAyah.text}</p><div className="verse-reference">سورة {dailyAyah.surah?.name || ""} · الآية {dailyAyah.numberInSurah}</div></> : <p className="feature-hint">تعذّر تحميل نص الآية. اتصل بالإنترنت ثم أعد المحاولة.</p>}
              <div className="meaning-panel"><strong>المعنى الميسّر</strong><p>{todayDailyVerse.meaning}</p><small>هذا تلخيص مبسّط للتأمل، وليس بديلًا عن كتب التفسير المعتمدة.</small></div>
              <button className="secondary-button" onClick={() => changePage("quran")}><BookOpen size={16} /> انتقل إلى المصحف</button>
            </article>
          </section>
        )}

        {/* HEART MESSAGE */}
        {active === "heart" && (
          <section className="page-content feature-page">
            <div className="page-title-row"><div><span className="section-kicker">رفقًا بقلبك</span><h2>رسالة لقلبك</h2><p>اختر الشعور الأقرب إليك لتجد آية ومعنى للتأمل.</p></div><div className="memorize-title-icon"><Heart size={27} /></div></div>
            <div className="emotion-grid">{Object.keys(heartGuides).map((emotion) => <button key={emotion} className={`emotion-button ${selectedEmotion === emotion ? "selected" : ""}`} onClick={() => chooseEmotion(emotion)}>{emotion}</button>)}</div>
            {selectedEmotion && <article className="reflection-card"><span className="reflection-label"><Heart size={16} /> {heartGuides[selectedEmotion].label}</span>{heartLoading ? <div className="loading-state"><div className="loader" /> جارٍ جلب الآية...</div> : heartAyah ? <><p className="feature-ayah">{heartAyah.text}</p><div className="verse-reference">سورة {heartAyah.surah?.name || ""} · الآية {heartAyah.numberInSurah}</div></> : null}<div className="meaning-panel"><strong>وقفة للتأمل</strong><p>{heartReflection?.meaning || heartGuides[selectedEmotion].meaning}</p><strong>خطوة لطيفة</strong><p>{heartReflection?.action || heartGuides[selectedEmotion].action}</p></div><p className="feature-hint">هذه مساحة للتذكير والتأمل فقط، وليست تشخيصًا نفسيًا أو علاجًا أو فتوى. عند الحاجة، اطلب دعم شخص مختص أو موثوق.</p></article>}
          </section>
        )}

        {/* DAILY CHALLENGE */}
        {active === "challenge" && (
          <section className="page-content feature-page">
            <div className="page-title-row"><div><span className="section-kicker">الإيمان قول وعمل</span><h2>تحدي التطبيق</h2><p>خطوة عملية صغيرة مستوحاة من قيمة إسلامية.</p></div><div className="memorize-title-icon"><Gift size={27} /></div></div>
            <article className="reflection-card challenge-card"><span className="reflection-label"><Sparkles size={16} /> قيمة اليوم: {todayChallenge.value}</span><h3>{todayChallenge.title}</h3><p>{todayChallenge.description}</p><button className="primary-button" disabled={Boolean(challengeDone[todayKey()])} onClick={() => setChallengeDone((old) => ({ ...old, [todayKey()]: true }))}>{challengeDone[todayKey()] ? <><CircleCheck size={18} /> أنجزت تحدي اليوم</> : <><Check size={18} /> أتممت التحدي</>}</button><p className="feature-hint">اختر ما تستطيع فعله بصدق وإخلاص، ولا تجعل التحدي عبئًا عليك.</p></article>
          </section>
        )}

        {/* QURAN JOURNAL */}
        {active === "journal" && (
          <section className="page-content feature-page">
            <div className="page-title-row"><div><span className="section-kicker">أثر القرآن في يومك</span><h2>بصمتي القرآنية</h2><p>سجّل وقفتك مع آية وما تريد تطبيقه في حياتك.</p></div><div className="memorize-title-icon"><PenLine size={27} /></div></div>
            <form className="reflection-card journal-form" onSubmit={saveReflection}><label>الآية أو السورة (اختياري)<input value={journalVerse} onChange={(e) => setJournalVerse(e.target.value)} placeholder="مثال: سورة العصر، الآية ٢" /></label><label>ماذا تعلمت اليوم؟<textarea value={journalLearning} onChange={(e) => setJournalLearning(e.target.value)} rows={3} placeholder="اكتب المعنى أو الفائدة التي لامست قلبك..." /></label><label>كيف سأطبق ذلك؟<textarea value={journalAction} onChange={(e) => setJournalAction(e.target.value)} rows={3} placeholder="خطوة عملية ألتزم بها..." /></label><button className="primary-button" type="submit" disabled={!journalLearning.trim() && !journalAction.trim()}><Send size={17} /> احفظ بصمتي</button></form>
            <div className="section-heading"><div><span className="section-kicker">ذكريات التدبر</span><h3>تأملاتي السابقة ({journalEntries.length})</h3></div></div>
            {journalEntries.length ? <div className="journal-list">{journalEntries.map((entry) => <article className="journal-entry" key={entry.id}><div className="journal-entry-top"><strong>{entry.verse || "وقفة قرآنية"}</strong><span>{entry.date}</span></div>{entry.learning && <p><b>ما تعلمته:</b> {entry.learning}</p>}{entry.action && <p><b>تطبيقي:</b> {entry.action}</p>}<button className="text-button" onClick={() => setJournalEntries((items) => items.filter((item) => item.id !== entry.id))}>حذف هذه الوقفة</button></article>)}</div> : <div className="empty-state">لم تسجل أي تأمل بعد. ابدأ بأول وقفة قرآنية.</div>}
          </section>
        )}

        {/* ACTIVITY HISTORY */}
        {active === "activity" && (
          <section className="page-content feature-page">
            <div className="page-title-row">
              <div>
                <span className="section-kicker">مواظبتك مع القرآن</span>
                <h2>سجل النشاط</h2>
                <p>كل يوم اقتربت فيه من القرآن هو خطوة تستحق التقدير.</p>
              </div>
              <div className="memorize-title-icon"><Flame size={27} /></div>
            </div>
            <div className="progress-card">
              <div className="progress-top">
                <div><span className="section-kicker">استمرارية الرحلة</span><h3>أيام النشاط المسجلة</h3></div>
                <div className="progress-percent">{Object.keys(readingHistory).length}</div>
              </div>
              <p>سلسلتك الحالية: {getActivityStreak()} أيام متتالية</p>
            </div>
            {Object.keys(readingHistory).length ? (
              <div className="journal-list">
                {Object.entries(readingHistory).sort(([a], [b]) => b.localeCompare(a)).map(([date, day]) => (
                  <article className="journal-entry" key={date}>
                    <div className="journal-entry-top">
                      <strong>{new Date(`${date}T12:00:00`).toLocaleDateString("ar", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>
                      <span>{(day.surahs || []).length} سورة</span>
                    </div>
                    <p>{(day.surahs || []).map((number) => {
                      const found = surahs.find((item) => getSurahNumber(item) === Number(number));
                      return found ? getSurahName(found) : `سورة رقم ${number}`;
                    }).join("، ") || "تم تسجيل نشاط قرآني"}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-card">
                <div className="empty-icon"><Flame size={32} /></div>
                <h3>لم يُسجّل نشاط بعد</h3>
                <p>ابدأ بقراءة سورة أو مراجعة حفظك، وسيظهر نشاطك هنا تلقائيًا.</p>
                <button className="primary-button" onClick={() => changePage("quran")}><BookOpen size={17} /> ابدأ القراءة</button>
              </div>
            )}
          </section>
        )}

        {/* JOURNEY MAP */}
        {active === "journey" && (
          <section className="page-content feature-page">
            <div className="page-title-row"><div><span className="section-kicker">كل خطوة لها أثر</span><h2>خريطة رحلتي</h2><p>نظرة على ما أنجزته في القراءة والحفظ والتدبر.</p></div><div className="memorize-title-icon"><Map size={27} /></div></div>
            <div className="journey-map"><div className="journey-node"><span className="journey-node-icon"><BookOpen size={22} /></span><div><strong>القراءة</strong><p>{readSurahsCount} سورة قرأتها</p></div><span className="journey-count">{Object.keys(readingHistory).length} يوم نشاط</span></div><div className="journey-line" /><div className="journey-node"><span className="journey-node-icon gold-node"><Brain size={22} /></span><div><strong>الحفظ</strong><p>{memorizedAyahs.length} آية محفوظة</p></div><span className="journey-count">{progress}% من القرآن</span></div><div className="journey-line" /><div className="journey-node"><span className="journey-node-icon"><Sparkles size={22} /></span><div><strong>التدبر</strong><p>{journalEntries.length} وقفة مسجلة</p></div><span className="journey-count">{journalEntries.length} تأمل</span></div><div className="journey-line" /><div className="journey-node"><span className="journey-node-icon gold-node"><Gift size={22} /></span><div><strong>التطبيق</strong><p>{Object.values(challengeDone).filter(Boolean).length} تحديات مكتملة</p></div><span className="journey-count">عمل وقيمة</span></div></div>
            <div className="progress-card"><div className="progress-top"><div><span className="section-kicker">إجمالي الحفظ</span><h3>استمر ولو بالقليل</h3></div><div className="progress-percent">{progress}%</div></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div><div className="progress-bottom"><span>{memorizedAyahs.length.toLocaleString("ar")} آية</span><span>٦٢٣٦ آية</span></div></div>
          </section>
        )}
        {authOpen && (
          <div className="auth-overlay">
            <div className="auth-modal">
              <button
                className="auth-close"
                onClick={() => setAuthOpen(false)}
              >
                <X size={20} />
              </button>

              <h2>مرحبًا بك في حِفْظِي</h2>
              <p>سجّلي الدخول لمزامنة بياناتك بين أجهزتك.</p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setAuthLoading(true);
                setAuthMessage("");

                const { error } = await supabase.auth.signInWithPassword({
                  email: authEmail,
                  password: authPassword,
                });

                setAuthMessage(
                  error ? error.message : "تم تسجيل الدخول بنجاح."
                );
                setAuthLoading(false);
              }}>
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />

                <input
                  type="password"
                  placeholder="كلمة المرور"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />

                <button type="submit" disabled={authLoading}>
                  {authLoading ? "جارٍ الدخول..." : "تسجيل الدخول"}
                </button>
              </form>

              <button
                className="auth-signup"
                disabled={authLoading}
                onClick={async () => {
                  setAuthLoading(true);
                  setAuthMessage("");

                  const { error } = await supabase.auth.signUp({
                    email: authEmail,
                    password: authPassword,
                  });

                  setAuthMessage(
                    error
                      ? error.message
                      : "تم إنشاء الحساب. تحققي من بريدك الإلكتروني لتأكيده."
                  );
                  setAuthLoading(false);
                }}
              >
                إنشاء حساب جديد
              </button>

              {authMessage && <p>{authMessage}</p>}
            </div>
          </div>
        )}
        <footer className="app-footer">
          <span>حِفْظِي · HIFDHI</span>
          <span>اللهم اجعل القرآن ربيع قلوبنا</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
