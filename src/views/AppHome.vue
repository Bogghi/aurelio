<script setup>
import { ref, onMounted } from 'vue';
import Transaction from '@/components/AppHome/Transaction.vue';

import { writeTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import Database from '@tauri-apps/plugin-sql';

let debitor = ref('');
let debit = ref(0);
let credit = ref(0);
let creditor = ref('');
let db = ref(null);
let transactions = ref([]);

const saveToLadger = async () => {
  // Function to save the ladger entry
  const content = `---\ndebitor: ${debitor.value}\ndebit: ${debit.value}\ncredit: ${credit.value}\ncreditor: ${creditor.value}\n---\n`;

  try {
    const dirPath = "Vault/Finance/Transactions";
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ladger-entry-${timestamp}.md`;
    const fullPath = `${dirPath}/${filename}`;

    // Check if directory exists, create if not
    const dirExists = await exists(dirPath, { baseDir: BaseDirectory.Home });
    console.log("Directory exists:", dirExists);

    if (!dirExists) {
      console.log("Creating directory:", dirPath);
      await mkdir(dirPath, { baseDir: BaseDirectory.Home, recursive: true });
    }

    // Write the file
    await writeTextFile(fullPath, content, {
      baseDir: BaseDirectory.Home,
    });
    console.log("Saved ladger entry to", fullPath);

    await db.value.execute(`
      INSERT INTO transactions (debitor, debit, credit, creditor, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `, [
      debitor.value,
      debit.value,
      credit.value,
      creditor.value,
      new Date().toISOString()
    ]);
    transactions.value = await db.value.select(`select * from transactions`,[]);

    debitor.value = '';
    debit.value = 0;
    credit.value = 0;
    creditor.value = '';
  }
  catch (error) {
    console.error("Error saving ladger entry:", error);
  }

}
const updateDebitCreditValues = value => {
  credit.value = Math.abs(value);
  debit.value = value > 0 ? -(value) : value;
  console.log(value);
};

onMounted(async () => {
  db.value = await Database.load('sqlite:aurelio.db');
  transactions.value = await db.value.select(`select * from transactions`,[]);
});
</script>

<template>
  <div class="home-view">
    <div class="ladger">
      <div class="ladger-insert">
        <!-- ladger form should be placed here --> 
        <div class="row">
          <div class="form-col">
            <label for="debitor">Debitor</label>
            <input type="text" id="debitor" v-model="debitor">
          </div>
          <div class="form-col">
            <label for="debit">Debit</label>
            <input type="number" id="debit" v-model="debit" @input="evt => updateDebitCreditValues(evt.target.value)">
          </div>
          <div class="form-col right">
            <label for="credit">Credit</label>
            <input type="number" id="credit" v-model="credit" @input="evt => updateDebitCreditValues(evt.target.value)">
          </div>
          <div class="form-col right">
            <label for="creditor">Creditor</label>
            <input type="text" id="creditor" v-model="creditor" @keyup.enter="saveToLadger">
          </div>
        </div>
      </div>
      <div class="ladger-transactions">
        <Transaction v-for="transaction in transactions" :key="transaction.id" :transaction="transaction" />       
      </div>
    </div>
  </div>
</template>

<style scoped>
  .home-view {
    display: flex;
    justify-content: center;

    .ladger {
      width: 800px;
      height: 100vh;
      display: flex;
      flex-direction: column;

      .ladger-insert {
        margin-top: 10px;
        display: flex;
        border-radius: 5px;
        box-shadow: 0px 0px 3px #9c9c9c;
        max-height: 100px;

        .row {
          display: flex;
          flex-direction: row;
          gap: 10px;
          min-width: 0;
          padding: 10px;

          .form-col {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;

            label {
              font-size: 13px;
            }

            input {
              font-size: 15px;
              border: none;
              box-shadow: 0px 0px 3px #9c9c9c;
              border-radius: 5px;
              padding: 5px;
            }
          }

          .right {
            text-align: right;

            input {
              text-align: right;
            }
          }
        }
      }

      .ladger-transactions {
        margin: 10px 0 10px 0;
        display: flex;
        height: 100%;
        background-color: #f5f5f5;
        border-radius: 10px;
      }
    }
  }
</style>
