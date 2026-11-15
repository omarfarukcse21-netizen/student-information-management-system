// Electron থেকে দরকারি দুটো জিনিস আনছি
const { app, BrowserWindow } = require('electron');

// উইন্ডো তৈরির ফাংশন
function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    title: 'Student Management System',
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
