<script setup>
</script>

<template>
  <div class="home-view">
    <div class="ladger">
      <div class="ladger-insert">
        <!-- ladger form should be placed here --> 
        <div class="row">
          <div class="form-col">
            <label for="debitor">Debitor</label>
            <input type="text" id="debitor">
          </div>
          <div class="form-col">
            <label for="debit">Debit</label>
            <input type="text" id="debit">
          </div>
          <div class="form-col right">
            <label for="credit">Credit</label>
            <input type="text" id="credit">
          </div>
          <div class="form-col right">
            <label for="creditor">Creditor</label>
            <input type="text" id="creditor">
          </div>
        </div>
      </div>
      <div class="ladger-transactions">
        <!-- ladger transaction should go in here --> 
      </div>
    </div>
  </div>
</template>

<style scoped>
  .home-view {
    display: flex;
    justify-content: center;

    .ladger {
      width: 600px;
      height: 100vh;

      .ladger-insert {
        display: flex;
        border: 1px solid black;
        height: 50px;

        .row {
          display: flex;
          flex-direction: row;
          gap: 10px;
          min-width: 0;
          padding: 5px;

          .form-col {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-width: 0;
          }

          .right {
            text-align: right;
          }
        }
      }
    }
  }
</style>
