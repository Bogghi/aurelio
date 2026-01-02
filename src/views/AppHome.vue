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
            <input type="number" id="debit">
          </div>
          <div class="form-col right">
            <label for="credit">Credit</label>
            <input type="number" id="credit">
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
        margin-top: 10px;
        display: flex;
        border-radius: 5px;
        box-shadow: 0px 0px 3px #9c9c9c;

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
    }
  }
</style>
