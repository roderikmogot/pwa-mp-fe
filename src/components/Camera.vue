<script setup>
import { useDevicesList, useUserMedia } from '@vueuse/core';
import { ref, watchEffect } from 'vue';

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
  constraints: { video: { deviceId: currentCamera, aspectRatio: 2 } },
});

const capturedImage = ref('');

const takePicture = async () => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.value.videoWidth;
    canvas.height = video.value.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video.value, 0, 0, canvas.width, canvas.height);

    const dataURL = canvas.toDataURL('image/png');
    capturedImage.value = dataURL;
    emit('image-captured', dataURL);
    resolve(dataURL);
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
  <div class="flex flex-col gap-4 items-center justify-center w-full">
    <div>
      <button @click="toggleCamera" :class="{ 'bg-red-500': enabled, 'bg-green-500': !enabled }"
        class="px-4 py-2 rounded text-white">
        {{ enabled ? "Stop Camera" : "Start Camera" }}
      </button>
      <button @click="takePicture" :disabled="!enabled" class="px-4 py-2 rounded bg-blue-500 text-white">
        Take Picture
      </button>
    </div>

    <div class="flex flex-wrap gap-2">
      <div v-for="camera of cameras" :key="camera.deviceId" @click="setCurrentCamera(camera.deviceId)"
        :class="{ 'bg-gray-200': currentCamera === camera.deviceId }" class="px-2 py-1 cursor-pointer rounded">
        {{ camera.label }}
      </div>
    </div>

    <div>
      <video ref="video" muted autoplay controls class="h-80 w-auto border-2 border-gray-400" />
    </div>

    <div v-if="capturedImage">
      <img :src="capturedImage" alt="Captured" class="mt-4 border-2 border-gray-400" />
    </div>
  </div>
</template>
