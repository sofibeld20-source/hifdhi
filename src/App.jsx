
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, Brain, Headphones, Home, Search, Bookmark,
  Flame, Target, ChevronLeft, Menu, X, Sparkles, Moon,
  BookmarkCheck, ArrowRight, Play, Check, RotateCcw,
  Volume2, CircleCheck, GraduationCap, Eye, EyeOff,
  Lightbulb, Trophy, Zap, Download, Wifi, WifiOff
} from "lucide-react";
import "./App.css";

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
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "quran", label: "القرآن الكريم", icon: BookOpen },
  { id: "memorize", label: "الحفظ والمراجعة", icon: Brain },
  { id: "smart", label: "الحفظ الذكي", icon: Zap },
  { id: "listen", label: "الاستماع", icon: Headphones },
  { id: "saved", label: "الآيات المحفوظة", icon: Bookmark },
];

const reciters = [
  { id: "ar.alafasy", name: "مشاري العفاسي" },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد" },
  { id: "ar.husary", name: "محمود خليل الحصري" },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي" },
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

function App() {
  const [active, setActive] = useState("home");
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

  // Save data
  useEffect(() => {
    localStorage.setItem("hifdhi-memorized", JSON.stringify(memorizedAyahs));
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

    const key = `${practiceSurah}:${Number(
      ayah.number || ayah.number_in_surah || practiceIndex + 1
    )}`;

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

  return (
    <div className="app" dir="rtl">
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
        {active === "home" && (
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
              <div className="stat-card">
                <div className="stat-icon blue"><BookOpen size={21} /></div>
                <div className="stat-number">{readSurahsCount}</div>
                <div className="stat-label">سور قرأتها</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon gold"><Brain size={21} /></div>
                <div className="stat-number">{memorizedAyahs.length}</div>
                <div className="stat-label">آيات حفظتها</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple"><Flame size={21} /></div>
                <div className="stat-number">{getActivityStreak()}</div>
                <div className="stat-label">أيام متتالية</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon silver"><Bookmark size={21} /></div>
                <div className="stat-number">{savedAyahs.length}</div>
                <div className="stat-label">آيات محفوظة للرجوع</div>
              </div>
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

        <footer className="app-footer">
          <span>حِفْظِي · HIFDHI</span>
          <span>اللهم اجعل القرآن ربيع قلوبنا</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
