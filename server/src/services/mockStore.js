import { v4 as uuid } from "uuid";
import { db } from "../data/mockData.js";

export function list(collection) {
  return db[collection] || [];
}

export function create(collection, payload) {
  if (!db[collection]) db[collection] = [];
  const item = {
    id: uuid(),
    ...payload,
    status: payload.status || "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db[collection].unshift(item);
  return item;
}

export function findById(collection, id) {
  return (db[collection] || []).find((item) => item.id === id) || null;
}

export function update(collection, id, payload) {
  const items = db[collection] || [];
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...payload, updatedAt: new Date().toISOString() };
  return items[index];
}

export function remove(collection, id) {
  const items = db[collection] || [];
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  return true;
}
