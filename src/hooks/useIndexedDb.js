import { ref } from 'vue';

export default function useIndexedDB() {
  const dbName = 'team_2';
  const storeName = 'items';
  const db = ref(null);

  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = (event) => {
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        db.value = event.target.result;
        resolve(db.value);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(storeName)) {
          const objectStore = database.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          objectStore.createIndex('title', 'title', { unique: false });
          objectStore.createIndex('description', 'description', { unique: false });
          objectStore.createIndex('image', 'image', { unique: false });
        }
      };
    });
  };

  const addItem = async (title, description, imageArrayBuffer) => {
    const transaction = db.value.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const newItem = { title, description, image: imageArrayBuffer };

    store.add(newItem);
  };

  const getAllItems = async () => {
    return new Promise((resolve, reject) => {
      const transaction = db.value.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  return { openDB, addItem, getAllItems };
}
