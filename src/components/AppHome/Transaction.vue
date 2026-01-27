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
        <div class="debitor">
            <p><strong>Debitor:</strong> {{ transaction.debitor }}</p>
            <p><strong>Debit:</strong> {{ transaction.debit }}</p>
        </div>
        <div class="creditor">
            <p><strong>Creditor:</strong> {{ transaction.creditor }}</p>
            <p><strong>Credit:</strong> {{ transaction.credit }}</p>
        </div>
    </div>
  </div>
</template>

<style scoped>
.transaction {
    display: flex;
    margin: 10px 10px 0 10px;
    padding: 10px;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
    border-radius: 10px;

    .transaction-details {
        display: flex;
        width: 100%;
        
        .debitor {
            display: flex;
            flex: 1;
            flex-direction: column;
            align-items: flex-start;
        }
        .creditor {
            display: flex;
            flex: 1;
            flex-direction: column;
            align-items: flex-end;
        }
    }
}
</style>