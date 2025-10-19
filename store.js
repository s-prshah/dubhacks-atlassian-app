/*
Simple in-memory shared store for demo purposes.
This data lives for the lifetime of the runtime instance (not persisted).
*/

const _entries = [
  { id:1, amount:12.5, category:'Food', type:'expense', note:'Coffee', date:new Date().toISOString() },
  { id:2, amount:40, category:'Transport', type:'expense', note:'Bus pass', date:new Date().toISOString() },
  { id:3, amount:500, category:'Rent', type:'expense', note:'October rent', date:new Date().toISOString() },
  { id:4, amount:200, category:'Part-time', type:'income', note:'Freelance', date:new Date().toISOString() }
];

export function getEntries() {
  return _entries.slice(); // return a copy
}

export function addEntry(entry) {
  _entries.push(entry);
}
