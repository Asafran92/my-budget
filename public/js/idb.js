let db;
const request = indexedDB.open("my_budget_hero", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_budget", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  // log error here
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(["new_budget"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_budget");

  // add record to your store with add method
  budgetObjectStore.add(record);
}

function uploadBudget() {
  // open a transaction on your db
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access your object store
  const budgetObjectStore = transaction.objectStore("new_budget");

  // get all records from store and set to a variable
  const getAll = budgetObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
    // if there was data in indexedDb's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_budget"], "readwrite");
          // access the new_budget object store
          const budgetObjectStore = transaction.objectStore("new_budget");
          // clear all items in your store
          budgetObjectStore.clear();

          alert("All saved budgets have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadBudget);
