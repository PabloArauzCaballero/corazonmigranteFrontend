export function getDbRow0(res) {
  const r0 = Array.isArray(res?.rows) ? res.rows[0] : null;
  return r0 || null;
}

export function isDbOk(res) {
  if (res?.ok === false) return false;
  const r0 = getDbRow0(res);
  if (!r0?.status) return !!res?.ok;
  return String(r0.status).toLowerCase() === "ok";
}

export function getDbMessage(res, fallback = "") {
  const r0 = getDbRow0(res);
  return r0?.message || res?.message || fallback;
}
