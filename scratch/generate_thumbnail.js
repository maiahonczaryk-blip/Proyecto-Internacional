const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          width: 1200px;
          height: 630px;
          background: linear-gradient(135deg, #04081a 0%, #003f99 50%, #880000 100%);
          font-family: 'Inter', -apple-system, sans-serif;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
        }
        .container {
          z-index: 2;
          background: rgba(0, 0, 0, 0.4);
          padding: 60px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          max-width: 900px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 68, 68, 0.15);
          border: 1px solid rgba(255, 68, 68, 0.3);
          padding: 10px 24px;
          border-radius: 50px;
          color: #ff4444;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 30px;
          font-size: 20px;
        }
        .pulse {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ff4444;
          box-shadow: 0 0 15px #ff4444;
        }
        h1 {
          font-size: 72px;
          margin: 0 0 20px 0;
          font-weight: 800;
          line-height: 1.1;
          background: linear-gradient(to right, #ffffff, #e0e0e0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          font-size: 32px;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 40px;
          font-weight: 500;
        }
        .details {
          display: flex;
          justify-content: center;
          gap: 30px;
          font-size: 24px;
          font-weight: 600;
          color: #fff;
        }
        .detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.1);
          padding: 15px 30px;
          border-radius: 15px;
        }
        .logo {
          position: absolute;
          top: 40px;
          left: 40px;
          height: 50px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">
          <div class="pulse"></div>
          LIVE WEBINAR
        </div>
        <h1>Beyond Borders</h1>
        <div class="subtitle">Scale Your Business Globally with Spain's Luxury Market</div>
        <div class="details">
          <div class="detail-item">📅 August 28</div>
          <div class="detail-item">🕒 12 PM EDT</div>
          <div class="detail-item">🇺🇸🇨🇦 Free for Realtors</div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html);
  
  const imagesDir = '/Users/maiahonczaryk/Desktop/Proyecto Internacional/images';
  if (!fs.existsSync(imagesDir)){
    fs.mkdirSync(imagesDir);
  }
  
  await page.screenshot({ path: '/Users/maiahonczaryk/Desktop/Proyecto Internacional/images/webinar-thumbnail.png' });
  await browser.close();
})();
