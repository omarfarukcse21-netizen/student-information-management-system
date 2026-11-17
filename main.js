// Electron থেকে দরকারি দুটো জিনিস আনছি
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

// অ্যাপের লোগো: Windows-এ .ico সবচেয়ে ভালো দেখায়, অন্য সিস্টেমে .png
const ICON_PATH = path.join(__dirname, process.platform === 'win32' ? 'icon.ico' : 'icon.png');

// Windows-এ টাস্কবারে Electron-এর ডিফল্ট আইকনের বদলে আমাদের লোগো দেখাতে এটা লাগে
if (process.platform === 'win32') {
  app.setAppUserModelId('com.student.management.system');
}

// উইন্ডো তৈরির ফাংশন
function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    title: 'Student Management System',
    icon: ICON_PATH,            // উইন্ডো ও টাস্কবারের লোগো
    backgroundColor: '#0f172a', // লোড হওয়ার সময় সাদা ঝলক এড়াতে
    show: false,                // তৈরি হওয়ার আগে উইন্ডো দেখাবে না
    webPreferences: {
      nodeIntegration: true,     // renderer.js-এ require('fs') ব্যবহার করতে দেবে
      contextIsolation: false
    }
  });

  win.setMenuBarVisibility(false); // উপরের মেনু বার লুকিয়ে রাখা
  win.loadFile('index.html');      // আমাদের HTML পেজটা উইন্ডোতে দেখাবে

  // পেজ পুরো তৈরি হলে তবেই উইন্ডো দেখাবে (ঝলমলে ঝলক এড়াতে)
  win.once('ready-to-show', () => win.show());
}

// ===== PDF তৈরি =====
// HTML লেখাকে একটি অদৃশ্য উইন্ডোতে লোড করে PDF বানিয়ে ফাইলে সেভ করে
async function htmlToPdf(html, outputPath) {
  // বড় HTML (অনেক ছবিসহ) সরাসরি না দিয়ে আগে একটি অস্থায়ী ফাইলে রাখি
  const tmpFile = path.join(os.tmpdir(), 'student-export-' + Date.now() + '.html');
  fs.writeFileSync(tmpFile, html, 'utf-8');

  const pdfWin = new BrowserWindow({ show: false });
  try {
    await pdfWin.loadFile(tmpFile);
    const data = await pdfWin.webContents.printToPDF({
      printBackground: true,        // রং ও ব্যাকগ্রাউন্ড ছাপবে
      preferCSSPageSize: true,      // পাতার মাপ HTML-এর @page থেকে নেবে
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate:
        '<div style="width:100%; font-size:9px; color:#64748b; text-align:center;">' +
        'Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });
    fs.writeFileSync(outputPath, data);
  } finally {
    pdfWin.destroy();
    try { fs.unlinkSync(tmpFile); } catch (error) { /* অস্থায়ী ফাইল মোছা না গেলে সমস্যা নেই */ }
  }
}

// renderer.js থেকে 'export-pdf' অনুরোধ এলে এই অংশ চলবে
ipcMain.handle('export-pdf', async function (event, request) {
  const parent = BrowserWindow.fromWebContents(event.sender);

  // কোথায় সেভ করবে তা ইউজারকে জিজ্ঞেস করা
  const choice = await dialog.showSaveDialog(parent, {
    title: 'Save PDF',
    defaultPath: path.join(app.getPath('documents'), request.defaultName),
    filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
  });

  if (choice.canceled || !choice.filePath) {
    return { canceled: true };
  }

  try {
    await htmlToPdf(request.html, choice.filePath);
    return { ok: true, path: choice.filePath };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

// Electron তৈরি হলে উইন্ডো খুলবে
app.whenReady().then(() => {
  createWindow();

  // macOS-এর জন্য: উইন্ডো না থাকলে আবার খোলা
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// সব উইন্ডো বন্ধ করলে অ্যাপ বন্ধ হবে (macOS বাদে)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
