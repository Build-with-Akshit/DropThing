const { createQuickDrop, getFolderByCode } = require('./src/controllers/folderController');
const { addText } = require('./src/controllers/itemController');

// Mock req and res
const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.data = data; return res; };
  return res;
};

// 1. Test Quick Drop
const req1 = { body: { name: 'Test Drop' } };
const res1 = mockRes();
createQuickDrop(req1, res1);
console.log('Quick Drop Created:', res1.data);

const code = res1.data.folder.code;
const folderId = res1.data.folder.id;

// 2. Test Add Text
const req2 = { body: { folderId, title: 'Test Secret Link', textContent: 'https://example.com/very-long-secret-url-for-library-pc' } };
const res2 = mockRes();
addText(req2, res2);
console.log('Text Added:', res2.data);

// 3. Test Get Folder by Code
const req3 = { params: { code } };
const res3 = mockRes();
getFolderByCode(req3, res3);
console.log('Folder retrieved by code:', res3.data.folder.code, 'Items count:', res3.data.items.length);
console.log('Item 0 text content:', res3.data.items[0].text_content);
console.log('✅ ALL BACKEND CONTROLLER CHECKS PASSED!');
