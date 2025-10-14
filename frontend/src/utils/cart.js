// src/utils/cart.js
/* ===== Per-user Cart Store (namespaced) ===== */
const GUEST_KEY = "cart::guest";

/* ==== Safe JSON ==== */
function safeJSONParse(str, fallback) {
  try { return JSON.parse(str); }
  catch { return fallback; } // không đặt tên biến -> không bị no-unused-vars
}

/* ==== User helpers ==== */
export function readUser() {
  const raw = localStorage.getItem("user");
  return safeJSONParse(raw, null);
}
export function getUserId(user = readUser()) {
  return user?.MaTaiKhoan ?? user?.MaKhachHang ?? user?.id ?? user?._id ?? null;
}
export function cartKeyFor(uid = getUserId()) {
  return uid ? `cart::${uid}` : GUEST_KEY;
}

/* ==== Item helpers ==== */
function normalizeItems(list = []) {
  return Array.isArray(list)
    ? list.map((it) => ({
        id: it.id,
        name: it.name,
        image: it.image,
        color: it.color || "",
        capacity: it.capacity || "",
        price: Number(it.price) || 0,
        qty: Math.max(1, Number(it.qty) || 1),
      }))
    : [];
}
function itemSig(it) {
  return `${it.id || ""}|${it.color || ""}|${it.capacity || ""}`;
}

/* ==== Core API (giữ tên cũ) ==== */
export const readCart = (uid = getUserId()) => {
  const key = cartKeyFor(uid);
  const raw = localStorage.getItem(key);
  return normalizeItems(safeJSONParse(raw, []) || []);
};

export const writeCart = (items, uid = getUserId()) => {
  const key = cartKeyFor(uid);
  localStorage.setItem(key, JSON.stringify(normalizeItems(items)));
  window.dispatchEvent(new CustomEvent("CART_UPDATED", { detail: { items, key } }));
};

/** Merge theo chữ ký id|color|capacity — GIỮ API cũ */
export function upsertCartItem({ id, name, image, price, color, capacity }, qty = 1, uid = getUserId()) {
  const key = cartKeyFor(uid);
  const list = readCart(uid);
  const sig = `${id || ""}|${color || ""}|${capacity || ""}`;
  const idx = list.findIndex(x => `${x.id || ""}|${x.color || ""}|${x.capacity || ""}` === sig);

  if (idx >= 0) {
    const cur = list[idx];
    list[idx] = {
      ...cur,
      name: name ?? cur.name,
      image: image ?? cur.image,
      price: Number(price ?? cur.price) || 0,
      qty: Math.max(1, (Number(cur.qty) || 0) + (Number(qty) || 0)),
    };
  } else {
    list.unshift({
      id, name, image,
      price: Number(price) || 0,
      color: color || "",
      capacity: capacity || "",
      qty: Math.max(1, Number(qty) || 1),
    });
  }
  localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("CART_UPDATED", { detail: { items: list, key } }));
  return list;
}

/* ==== Tiện ích thêm ==== */
export function mergeItems(base = [], incoming = []) {
  const map = new Map();
  normalizeItems(base).forEach((it) => map.set(itemSig(it), { ...it }));
  normalizeItems(incoming).forEach((it) => {
    const k = itemSig(it);
    if (map.has(k)) {
      const cur = map.get(k);
      map.set(k, { ...cur, qty: (Number(cur.qty) || 0) + (Number(it.qty) || 0) });
    } else {
      map.set(k, { ...it });
    }
  });
  return Array.from(map.values());
}

export function migrateGuestCartToUser(uid = getUserId()) {
  if (!uid) return;
  const userKey = cartKeyFor(uid);

  const guestRaw = localStorage.getItem(GUEST_KEY);
  const userRaw  = localStorage.getItem(userKey);

  const guest = normalizeItems(safeJSONParse(guestRaw, []) || []);
  const user  = normalizeItems(safeJSONParse(userRaw, []) || []);

  if (!guest.length) return;

  const merged = mergeItems(user, guest);
  localStorage.setItem(userKey, JSON.stringify(merged));
  localStorage.removeItem(GUEST_KEY);

  window.dispatchEvent(new CustomEvent("CART_UPDATED", {
    detail: { items: merged, key: userKey }
  }));
}

export function clearCart(uid = getUserId()) {
  const key = cartKeyFor(uid);
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent("CART_UPDATED", { detail: { items: [], key } }));
}
