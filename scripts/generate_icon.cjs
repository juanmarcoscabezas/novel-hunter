const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 600,
    height: 600,
    webPreferences: {
      offscreen: true,
      webSecurity: false
    }
  });

  const inputArg = process.argv[2];
  let imgPath = inputArg ? path.resolve(process.cwd(), inputArg) : path.resolve(__dirname, '../electron/assets/icon.png');
  if (!fs.existsSync(imgPath)) {
    console.error(`Source image not found: ${imgPath}`);
    process.exit(1);
  }
  const imgData = fs.readFileSync(imgPath).toString('base64');

  await win.loadURL('about:blank');

  const base64Png = await win.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.onload = () => {
        const w = 512;
        const h = 512;
        // Inset squircle by 6px to eliminate external black background
        const pad = 8;
        const radius = 105; // standard modern squircle / iOS icon radius

        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, radius);
        ctx.clip();

        // Draw image scaled to fill
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl.split(',')[1]);
      };
      img.src = 'data:image/jpeg;base64,${imgData}';
    });
  `);

  const outPath = path.resolve(__dirname, '../electron/assets/icon.png');
  fs.writeFileSync(outPath, Buffer.from(base64Png, 'base64'));
  console.log(`Generated icon at ${outPath} (${fs.statSync(outPath).size} bytes)`);

  app.quit();
});
