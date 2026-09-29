const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../js/store.js');

const valid = { type:'lost', name:'校园卡', category:'证件卡片', location:'东区食堂', time:'2026-09-28T12:00', description:'蓝色卡套，背面有贴纸', publisher:'小章', contact:'QQ123456', image:'' };
const items = [
  { id:'1', type:'lost', name:'校园卡', category:'证件卡片', location:'食堂', description:'蓝色卡套', status:'寻找中', createdAt:'2026-09-28T12:00:00Z' },
  { id:'2', type:'found', name:'钥匙', category:'钥匙', location:'图书馆', description:'黄铜钥匙', status:'待认领', createdAt:'2026-09-29T12:00:00Z' },
  { id:'3', type:'found', name:'耳机', category:'数码产品', location:'教学楼', description:'白色右耳', status:'已归还', createdAt:'2026-09-27T12:00:00Z' }
];

test('有效表单通过校验',()=>assert.equal(core.validateItem(valid).valid,true));
test('名称为空时校验失败',()=>assert.equal(core.validateItem({...valid,name:'  '}).valid,false));
test('描述少于 5 个字符时校验失败',()=>assert.ok(core.validateItem({...valid,description:'太短'}).errors.description));
test('无效时间时校验失败',()=>assert.ok(core.validateItem({...valid,time:'not-a-date'}).errors.time));
test('创建寻物信息自动进入寻找中状态',()=>assert.equal(core.createItem(valid,{id:'x'}).item.status,'寻找中'));
test('创建招领信息自动进入待认领状态',()=>assert.equal(core.createItem({...valid,type:'found'},{id:'x'}).item.status,'待认领'));
test('关键词可匹配物品名称',()=>assert.deepEqual(core.searchItems(items,{keyword:'校园'}).map(x=>x.id),['1']));
test('关键词可匹配地点且忽略空白',()=>assert.deepEqual(core.searchItems(items,{keyword:' 图书馆 '}).map(x=>x.id),['2']));
test('可按类型筛选',()=>assert.equal(core.searchItems(items,{type:'found'}).length,2));
test('可组合类别与状态筛选',()=>assert.deepEqual(core.searchItems(items,{category:'数码产品',status:'已归还'}).map(x=>x.id),['3']));
test('结果按创建时间倒序排列',()=>assert.deepEqual(core.searchItems(items,{}).map(x=>x.id),['2','1','3']));
test('合法状态更新成功且不改变原数组',()=>{const r=core.updateStatus(items,'1','已找到');assert.equal(r.ok,true);assert.equal(r.items[0].status,'已找到');assert.equal(items[0].status,'寻找中');});
test('不存在的信息更新失败',()=>assert.equal(core.updateStatus(items,'404','已找到').ok,false));
test('非法状态不会写入',()=>assert.equal(core.updateStatus(items,'1','已删除').ok,false));
test('删除已有信息成功',()=>{const r=core.deleteItem(items,'2');assert.equal(r.ok,true);assert.equal(r.items.length,2);});
test('统计结果正确',()=>assert.deepEqual(core.stats(items),{total:3,active:2,done:1}));
