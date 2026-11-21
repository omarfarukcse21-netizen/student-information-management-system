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

// স্প্ল্যাশ (লোডিং) স্ক্রিন কমপক্ষে কত মিলিসেকেন্ড দেখাবে (১০০০ = ১ সেকেন্ড)
// বেশি সময় দেখাতে চাইলে এই সংখ্যা বাড়াও
const MIN_SPLASH_MS = 2600;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// স্প্ল্যাশ উইন্ডো: বর্ডারহীন, ছোট, মাঝখানে, লোগো ও লোডিং বারসহ
function createSplash() {
  const splash = new BrowserWindow({
    width: 560,
    height: 380,
    frame: false,          // ওপরের টাইটেল বার নেই
    transparent: true,     // কোণা গোল দেখাতে ব্যাকগ্রাউন্ড স্বচ্ছ
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,     // টাস্কবারে আলাদা আইকন দেখাবে না
    hasShadow: false,
    show: false,
    icon: ICON_PATH
  });

  splash.loadFile('splash.html');
  splash.once('ready-to-show', () => splash.show());
  return splash;
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

  return win; // দেখানোর কাজটা নিচের startWithSplash() করবে
}

// আগে স্প্ল্যাশ দেখায়, মূল উইন্ডো তৈরি হলে এবং নির্ধারিত সময় পার হলে স্প্ল্যাশ বন্ধ করে মূল উইন্ডো খোলে
async function startWithSplash() {
  let shownAt = Date.now();
  const splash = createSplash();
  const win = createWindow();

  // স্প্ল্যাশ আসলে পর্দায় আসার সময়টা মনে রাখা (সময় এখান থেকেই গোনা হবে)
  const splashShown = new Promise((resolve) => splash.once('show', () => {
    shownAt = Date.now();
    resolve();
  }));
  const mainReady = new Promise((resolve) => win.once('ready-to-show', resolve));

  // স্প্ল্যাশ দেখা যাওয়া এবং মূল উইন্ডো তৈরি হওয়া, দুটোর জন্যই অপেক্ষা
  // (সর্বোচ্চ ১৫ সেকেন্ড, যাতে কখনো আটকে না থাকে)
  await Promise.race([Promise.all([splashShown, mainReady]), sleep(15000)]);

  // স্প্ল্যাশ পর্দায় আসার পর কমপক্ষে MIN_SPLASH_MS সময় দেখানো
  const remaining = MIN_SPLASH_MS - (Date.now() - shownAt);
  if (remaining > 0) await sleep(remaining);

  // স্প্ল্যাশ ধীরে মিলিয়ে বন্ধ করা
  if (!splash.isDestroyed()) {
    try {
      await splash.webContents.executeJavaScript("document.body.classList.add('closing')");
    } catch (error) { /* সমস্যা হলেও চলবে */ }
    await sleep(350);
    if (!splash.isDestroyed()) splash.destroy();
  }

  if (!win.isDestroyed()) {
    win.show();
    win.focus();
  }
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
  startWithSplash();

  // macOS-এর জন্য: উইন্ডো না থাকলে আবার খোলা (স্প্ল্যাশ ছাড়া)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const win = createWindow();
      win.once('ready-to-show', () => win.show());
    }
  });
});

// সব উইন্ডো বন্ধ করলে অ্যাপ বন্ধ হবে (macOS বাদে)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
