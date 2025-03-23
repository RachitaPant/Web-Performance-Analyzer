import puppeteer from "puppeteer";

export async function analyzeWebsite(url: string) {
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS !== "false", 
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

 
  const requests: string[] = [];
  page.on("request", (req) => {
    requests.push(req.url());
  });

  await page.goto(url, { waitUntil: "load" });

 
  const performanceMetrics = await page.evaluate(() => {
    const perfData = window.performance;
    return {
      navigationTiming: perfData.timing,
      resourceTiming: perfData.getEntriesByType("resource"),
      paintTiming: perfData.getEntriesByType("paint"), 
    };
  });

  
  const coreWebVitals = await page.evaluate(() => {
    return {
      LCP: performance.getEntriesByType("largest-contentful-paint")[0]?.startTime || 0,
      FID: performance.getEntriesByType("first-input")[0]?.processingStart || 0,
      CLS: performance.getEntriesByType("layout-shift")[0]?.value || 0,
    };
  });

 
  const jsExecutionTime = await page.evaluate(() => {
    const start = performance.now();
    new Array(1000000).fill(0).map((_, i) => i * 2); 
    return performance.now() - start;
  });

  
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await browser.close();

  return {
    url,
    performanceMetrics,
    coreWebVitals,
    jsExecutionTime,
    networkRequests: requests,
  };
}
