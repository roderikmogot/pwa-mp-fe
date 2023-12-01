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

    store.put(newItem); 
  };

  const getAllItems = async () => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        return reject(new Error('Database is not open'));
      }

      const transaction = db.value.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = (event) => {
        const items = event.target.result.map(item => {
          const imageBlob = new Blob([item.image], { type: 'image/jpeg' });
          const imageUrl = URL.createObjectURL(imageBlob);
          return { ...item, imageUrl };
        });
        resolve(items);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  };

  return { openDB, addItem, getAllItems };
}
