import https from 'https';

const url = 'https://www.zillow.com/homedetails/115-Allen-St-UNIT-3-New-York-NY-10002/31499503_zpid/';

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    const match = data.match(/<meta property="og:image"\s*content="([^"]*)"/i);
    if (match) {
      console.log('Found image:', match[1]);
    } else {
      console.log('No image found. Body length:', data.length);
    }
  });
});
