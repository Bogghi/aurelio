<script setup> 
defineProps({
transaction: {
    type: Object,
    required: true
}
});
</script> 

<template>
  <div class="transaction">
    <div class="transaction-details">
      <p><strong>Debitor:</strong> {{ transaction.debitor }}</p>
      <p><strong>Debit:</strong> {{ transaction.debit }}</p>
      <p><strong>Credit:</strong> {{ transaction.credit }}</p>
      <p><strong>Creditor:</strong> {{ transaction.creditor }}</p>
    </div>
  </div>
</template>

<style scoped>
</style>