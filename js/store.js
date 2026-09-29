(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LostFoundCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const VALID_TYPES = ['lost', 'found'];
  const VALID_STATUS = ['寻找中', '待认领', '已找到', '已归还'];

  function cleanText(value) { return String(value ?? '').trim(); }

  function validateItem(input) {
    const errors = {};
    const item = {
      type: cleanText(input.type), name: cleanText(input.name), category: cleanText(input.category),
      location: cleanText(input.location), time: cleanText(input.time), description: cleanText(input.description),
      publisher: cleanText(input.publisher), contact: cleanText(input.contact), image: cleanText(input.image)
    };
    if (!VALID_TYPES.includes(item.type)) errors.type = '请选择寻物或招领类型';
    if (!item.name || item.name.length > 30) errors.name = '物品名称为 1-30 个字符';
    if (!item.category) errors.category = '请选择物品类别';
    if (!item.location || item.location.length > 40) errors.location = '地点为 1-40 个字符';
    if (!item.time || Number.isNaN(Date.parse(item.time))) errors.time = '请选择有效时间';
    if (item.description.length < 5 || item.description.length > 200) errors.description = '描述为 5-200 个字符';
    if (!item.publisher) errors.publisher = '请填写联系人';
    if (!item.contact) errors.contact = '请填写联系方式';
    return { valid: Object.keys(errors).length === 0, errors, item };
  }

  function createItem(input, options = {}) {
    const result = validateItem(input);
    if (!result.valid) return result;
    const now = options.now || new Date().toISOString();
    return { valid: true, errors: {}, item: { ...result.item, id: options.id || `item-${Date.now()}`, status: result.item.type === 'lost' ? '寻找中' : '待认领', createdAt: now, owner: options.owner || '102402101' } };
  }

  function searchItems(items, filters = {}) {
    const keyword = cleanText(filters.keyword).toLowerCase();
    return [...items].filter(item => {
      const text = [item.name, item.location, item.description, item.category].join(' ').toLowerCase();
      return (!keyword || text.includes(keyword)) && (!filters.type || filters.type === 'all' || item.type === filters.type) && (!filters.category || filters.category === 'all' || item.category === filters.category) && (!filters.status || filters.status === 'all' || item.status === filters.status);
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getItem(items, id) { return items.find(item => item.id === id) || null; }

  function updateStatus(items, id, status) {
    if (!VALID_STATUS.includes(status)) return { ok: false, error: '无效状态', items };
    if (!getItem(items, id)) return { ok: false, error: '信息不存在', items };
    return { ok: true, items: items.map(item => item.id === id ? { ...item, status } : item) };
  }

  function deleteItem(items, id) {
    if (!getItem(items, id)) return { ok: false, error: '信息不存在', items };
    return { ok: true, items: items.filter(item => item.id !== id) };
  }

  function stats(items) {
    const done = items.filter(item => ['已找到', '已归还'].includes(item.status)).length;
    return { total: items.length, active: items.length - done, done };
  }

  return { VALID_TYPES, VALID_STATUS, cleanText, validateItem, createItem, searchItems, getItem, updateStatus, deleteItem, stats };
});
