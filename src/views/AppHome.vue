<script setup>
import { ref, onMounted } from 'vue';
import { writeTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import Database from '@tauri-apps/plugin-sql';

let debitor = ref('');
let debit = ref(0);
let credit = ref(0);
let creditor = ref('');
let db = ref(null);
let transactions = ref([]);

onMounted(async () => {
  db.value = await Database.load('sqlite:aurelio.db');
  transactions.value = await db.value.select(`select * from transactions`,[]);
});
</script>

<template>
  this is the home page
</template>

<style scoped>
</style>
