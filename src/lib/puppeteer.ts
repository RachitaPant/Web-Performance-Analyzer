import puppeteer from "puppeteer";

export async function analyzeWebsite(url: string) {
  const browser = await puppeteer.launch({
    headless: "new", // Runs in headless mode for performance
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for some environments
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "load" });

  // Capture Performance Metrics
  const performanceMetrics = await page.evaluate(() => {
    return JSON.stringify(window.performance);
  });

  // Capture JavaScript Execution Time
  const jsExecutionTime = await page.evaluate(() => {
    const start = performance.now();
    for (let i = 0; i < 1000000; i++) {} // Simulated computation
    return performance.now() - start;
  });

  // Capture Network Requests
  const requests: string[] = [];
  page.on("request", (req) => {
    requests.push(req.url());
  });

  // Wait for a few seconds to gather network data
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await browser.close();
  console.log(url);
  console.log(performanceMetrics);
  console.log(jsExecutionTime);

  return {
    url,
    performanceMetrics: JSON.parse(performanceMetrics),
    jsExecutionTime,
    networkRequests: requests,
  };
}
