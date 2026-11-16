
const DB_NAME = "hifdhi-offline";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("surahs")) {
        db.createObjectStore("surahs", { keyPath: "number" });
      }

      if (!db.objectStoreNames.contains("audio")) {
        db.createObjectStore("audio", { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeRecord(storeName, record) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(record);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function getRecord(storeName, key) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readonly")
      .objectStore(storeName)
      .get(key);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function getAllRecords(storeName) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readonly")
      .objectStore(storeName)
      .getAll();

    request.onsuccess = () => {
      db.close();
      resolve(request.result || []);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function saveSurahOffline(number, name, verses) {
  return storeRecord("surahs", {
    number: Number(number),
    name,
    verses,
    savedAt: Date.now(),
  });
}

export async function getSurahOffline(number) {
  return getRecord("surahs", Number(number));
}

export async function getDownloadedSurahs() {
  return getAllRecords("surahs");
}

export async function saveAudioOffline(key, blob) {
  return storeRecord("audio", {
    key,
    blob,
    savedAt: Date.now(),
  });
}

export async function getAudioOffline(key) {
  return getRecord("audio", key);
}

export async function deleteAudioOffline(key) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction("audio", "readwrite");
    transaction.objectStore("audio").delete(key);

    transaction.oncomplete = () => {
      db.close();
      resolve(true);
    };

    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}