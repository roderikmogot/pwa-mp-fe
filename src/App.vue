<script setup>
import { useDevicesList, useUserMedia } from '@vueuse/core';
import { computed, onMounted, ref, watch, watchEffect } from "vue";
import useIndexedDB from "./hooks/useIndexedDb";
import ThickPlus from './svgs/ThickPlus.vue';

const { openDB, addItem, getAllItems } = useIndexedDB();

const uploader = ref(null);
const dialog = ref(false);
const isSelecting = ref(false);
const showImageDialog = ref(false);
const showCameraDialog = ref(false);

const formInput = ref({
  title: "",
  description: "",
  imageUrl: null,
});

const recipes = ref([]);

const isFormIncomplete = computed(() => {
  const { title, description, imageUrl } = formInput.value;
  return !title || !description || (!imageUrl && !capturedImage.value);
});

const openImageDialog = () => {
  showImageDialog.value = true;
};
const openCameraDialog = () => {
  showCameraDialog.value = true;
};
const closeCameraDialog = () => {
  showImageDialog.value = false;
  showCameraDialog.value = false;
};

onMounted(async () => {
  await openDB()
    .then(console.log)
    .catch(console.log);

  await getAllItems().then((items) => {
    console.log('All items:', items);
    recipes.value = items;
  });
})

const onSubmit = async () => {
  if (capturedImage.value) {
    const base64ImageContent = capturedImage.value.split(';base64,').pop();
    const arrayBuffer = Uint8Array.from(atob(base64ImageContent), c => c.charCodeAt(0)).buffer;

    formInput.value.imageUrl = arrayBuffer;

    capturedImage.value = null;
    showImageDialog.value = false;
    showCameraDialog.value = false;

    addItemToDatabase();
  } else {
    addItemToDatabase();
  }
};

const addItemToDatabase = async () => {
  try {
    await addItem(formInput.value.title, formInput.value.description, formInput.value.imageUrl);

    dialog.value = false;
    formInput.value = {
      title: '',
      description: '',
      imageUrl: null,
    };
    capturedImage.value = '';
  } catch (error) {
    console.error('Error adding item:', error);
  }
};

const onFileChange = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const imageArrayBuffer = e.target.result;
    formInput.value.imageUrl = imageArrayBuffer;
    showImageDialog.value = false;
  };

  reader.readAsArrayBuffer(file);
}

const handleFileImport = () => {
  isSelecting.value = true;

  window.addEventListener('focus', () => {
    isSelecting.value = false
  }, { once: true });

  uploader.value.click();
}

watch(formInput, async () => {
  await getAllItems().then((items) => {
    console.log('All items:', items);
    recipes.value = items;
  });
});

const currentCamera = ref('');
const { videoInputs: cameras } = useDevicesList({
  requestPermissions: true,

  onUpdated() {
    if (!cameras.value.find(i => i.deviceId === currentCamera.value))
      currentCamera.value = cameras.value[0]?.deviceId;
  },
});

const video = ref();
const { stream, enabled } = useUserMedia({
  constraints: { video: { deviceId: currentCamera } },
});

const capturedImage = ref(null);

const takePicture = async () => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.value.videoWidth;
    canvas.height = video.value.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video.value, 0, 0, canvas.width, canvas.height);

    const dataURL = canvas.toDataURL('image/png');
    capturedImage.value = dataURL;
    resolve();
  });
};

const toggleCamera = () => {
  enabled.value = !enabled.value;
};

const setCurrentCamera = (deviceId) => {
  currentCamera.value = deviceId;
};

watchEffect(() => {
  if (video.value)
    video.value.srcObject = stream.value;
});
</script>

<template>
  <main class="min-h-screen w-full relative">
    <div class="w-full">
      <div class="container m-auto">
        <p class="text-[max(48px,min(5vw,76px))] font-bold">Untitled recipe</p>

        <div v-if="recipes.length > 0">
          <v-expansion-panels variant="accordion">
            <v-expansion-panel v-for="recipe in recipes" :key="recipe.id" :title="recipe.id + ' ' + recipe.title">
              <template v-slot:text>
                <div class="flex items-center flex-col">
                  <img class="mr-2" :src="recipe.imageUrl" alt="Recipe Image">
                  <span>{{ recipe.title }}</span>
                </div>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>

        <v-dialog width="500" v-model="dialog">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" class="w-full mt-2" variant="flat" color="primary">
              <ThickPlus />
              Add another recipe
            </v-btn>
          </template>

          <template v-slot:default="{ isActive }">
            <v-card title="Add List" class="font-bold">
              <div class="p-5 grid gap-y-4">
                <div>
                  <h3 class="font-bold text-lg">To Do*</h3>
                  <v-text-field v-model="formInput.title" required hide-details></v-text-field>
                </div>
                <div>
                  <h3 class="font-bold text-lg">Description</h3>
                  <v-textarea v-model="formInput.description" required hide-details></v-textarea>
                </div>
                <div>
                  <h3 class="font-bold text-lg">Image</h3>
                  <div v-if="capturedImage">
                    <div v-if="capturedImage">
                      <img :src="capturedImage" alt="Captured" class="mt-4 border-2 border-gray-400" />
                    </div>
                  </div>
                  <div v-else>
                    <v-dialog v-model="showImageDialog" width="50%">
                      <template v-slot:activator="{ on }">
                        <v-btn v-on="on" class="w-full font-bold" text="Add Image" @click="openImageDialog"></v-btn>
                      </template>
                      <v-card>
                        <v-card-title>Choose an option</v-card-title>
                        <v-card-actions class="w-full flex flex-row">
                          <v-btn variant="elevated" class="w-1/2" :loading="isSelecting" @click="handleFileImport">
                            Upload File
                          </v-btn>
                          <input ref="uploader" class="d-none" type="file" @change="onFileChange" />

                          <v-dialog v-model="showCameraDialog">
                            <template v-slot:activator="{ onCamera }">
                              <v-btn v-on="onCamera" variant="elevated" class="font-bold w-1/2" text="Capture"
                                @click="openCameraDialog" />
                            </template>
                            <v-card>
                              <v-card-title>Camera</v-card-title>
                              <v-card-actions class="w-full flex flex-row">
                                <div class="flex flex-col gap-4 items-center justify-center w-full">
                                  <div>
                                    <button @click="toggleCamera"
                                      :class="{ 'bg-red-500': enabled, 'bg-green-500': !enabled }"
                                      class="px-4 py-2 rounded text-white">
                                      {{ enabled ? "Stop Camera" : "Start Camera" }}
                                    </button>
                                    <button @click="takePicture" :disabled="!enabled"
                                      class="px-4 py-2 rounded bg-blue-500 text-white">
                                      Take Picture
                                    </button>
                                  </div>

                                  <div class="flex flex-wrap gap-2">
                                    <div v-for="camera of cameras" :key="camera.deviceId"
                                      @click="setCurrentCamera(camera.deviceId)"
                                      :class="{ 'bg-gray-200': currentCamera === camera.deviceId }"
                                      class="px-2 py-1 cursor-pointer rounded">
                                      {{ camera.label }}
                                    </div>
                                  </div>

                                  <div>
                                    <video ref="video" muted autoplay controls
                                      class="h-80 w-auto border-2 border-gray-400" />
                                  </div>

                                  <div v-if="capturedImage">
                                    <img :src="capturedImage" alt="Captured" class="mt-4 border-2 border-gray-400" />
                                  </div>
                                  <div v-if="capturedImage">
                                    <v-btn @click="closeCameraDialog">Save</v-btn>
                                  </div>
                                </div>
                              </v-card-actions>
                            </v-card>
                          </v-dialog>

                        </v-card-actions>
                      </v-card>
                    </v-dialog>

                  </div>

                </div>
                <v-btn variant="flat" color="primary" text="Submit" @click="onSubmit" :disabled="isFormIncomplete" />
              </div>

            </v-card>
          </template>
        </v-dialog>
      </div>
    </div>
  </main>
</template>

<style scoped></style>
