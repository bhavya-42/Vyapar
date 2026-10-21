const API_URL = 'http://localhost:5000/api';

let currentUser = JSON.parse(localStorage.getItem('vyapar_current_user')) || null;

let db = {
  firm: "Shiv Shakti Garments",
  phone: "9352407578",
  gst: "08XXXXX1234X1Z5",
  cash: 0,
  bank: 0,
  items: [],
  parties: [],
  bills: [],
  expenses: [],
  payments: [],
  cashAdjustments: []
};

let currentBillItems = [];
let partyFilterMode = 'ALL';
let chartPeriod = 'CURR';
let editingItemIdx = null;
let activePaymentBillIdx = null;
