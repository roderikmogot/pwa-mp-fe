<script setup>
import { onMounted, ref, watch } from "vue";
import useIndexedDB from "./hooks/useIndexedDb";

import ThickPlus from './svgs/ThickPlus.vue';

const { openDB, addItem, getAllItems } = useIndexedDB();

const dialog = ref(false);
const formInput = ref({
  title: "",
  description: "",
  imageUrl: "",
});

const recipes = ref([]);

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
  await addItem(formInput.value.title, formInput.value.description, formInput.value.imageUrl)
    .then(console.log)
    .catch(console.log);

  dialog.value = false;
  formInput.value = {
    title: "",
    description: "",
    imageUrl: "",
  };
}

const onFileChange = (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const imageArrayBuffer = e.target.result;
    formInput.value.imageUrl = imageArrayBuffer;
  };

  reader.readAsArrayBuffer(file);
}

watch(formInput, async () => {
  await getAllItems().then((items) => {
    console.log('All items:', items);
    recipes.value = items;
  });
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
            <v-btn v-bind="props" class="w-full" variant="flat" color="primary">
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
                  <h3 class="font-bold text-lg">Add Image</h3>
                  <v-file-input accept="image/*" @change="onFileChange"></v-file-input>
                </div>
                <v-btn variant="flat" color="primary" text="Submit" @click="onSubmit"></v-btn>
              </div>

            </v-card>
          </template>
        </v-dialog>
      </div>
    </div>
  </main>
</template>

<style scoped></style>
