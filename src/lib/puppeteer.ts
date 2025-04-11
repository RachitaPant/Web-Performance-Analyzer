import puppeteer from "puppeteer";
type LongTaskEntry = {
  name: string;
  startTime: number;
  duration: number;
};
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
      navigationTiming: JSON.parse(JSON.stringify(perfData.getEntriesByType("navigation")[0] || {})),
      resourceTiming: JSON.parse(JSON.stringify(perfData.getEntriesByType("resource"))),
      paintTiming: JSON.parse(JSON.stringify(perfData.getEntriesByType("paint"))),
    };
  });
  

  
  const coreWebVitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      let LCP = 0;
      let CLS = 0;
      let FID = 0;
  
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        LCP = lastEntry.startTime;
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Type assertion to access `.value`
          CLS += (entry as PerformanceEntry & { value: number }).value;
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
  
      const fidObserver = new PerformanceObserver((entryList) => {
        const entry = entryList.getEntries()[0] as PerformanceEventTiming;
        if (entry) FID = entry.processingStart;
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
  
      setTimeout(() => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
        resolve({ LCP, CLS, FID });
      }, 3000);
    });
  });
  
  
 
  const jsExecutionTime = await page.evaluate(() => {
    const start = performance.now();
    new Array(1000000).fill(0).map((_, i) => i * 2); 
    return performance.now() - start;
  });
  const domContentLoadedTime = await page.evaluate(() => {
    const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return navEntry.domContentLoadedEventEnd - navEntry.startTime;
  });
  
  const unusedJSBytes = await page.evaluate(() => {
    return (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      .filter((r) => r.initiatorType === 'script')
      .map((script) => ({
        name: script.name,
        transferSize: script.transferSize,
        encodedBodySize: script.encodedBodySize,
      }));
  });
  

  

const totalDomNodes = await page.evaluate(() => {
  return document.getElementsByTagName("*").length;
});
const thirdPartyRequests = requests.filter((req) => {
  try {
    const urlObj = new URL(req);
    return !urlObj.hostname.includes("yourdomain.com"); 
  } catch {
    return false;
  }
});


const resourceBreakdown = await page.evaluate(() => {
  const types: Record<string, number> = {};
  performance.getEntriesByType("resource").forEach((res) => {
    const type = (res as PerformanceResourceTiming).initiatorType;
    if (['css', 'script', 'img', 'font'].includes(type)) {
      types[type] = (types[type] || 0) + 1;
    }
  });
  return types;
});

const largeImages = await page.evaluate(() => {
  return Array.from(document.images)
    .filter(img => img.naturalWidth > 1000 || img.naturalHeight > 1000)
    .map(img => ({
      src: img.src,
      width: img.naturalWidth,
      height: img.naturalHeight,
    }));
});
const longTasks = await page.evaluate(() => {
  return new Promise<LongTaskEntry[]>((resolve) => {
    const entries: LongTaskEntry[] = [];
    const observer = new PerformanceObserver((list) => {
      entries.push(
        ...list.getEntries().map((e) => ({
          name: e.name,
          startTime: e.startTime,
          duration: e.duration,
        }))
      );
    });
    observer.observe({ entryTypes: ['longtask'] });
    setTimeout(() => {
      observer.disconnect();
      resolve(entries);
    }, 3000);
  });
});




  
  await new Promise((resolve) => setTimeout(resolve, 3000));

  await browser.close();

  return {
    url,
    performanceMetrics,
    domContentLoadedTime,
    coreWebVitals,
    jsExecutionTime,
    networkRequests: requests,
    totalDomNodes,
    thirdPartyRequestsCount: thirdPartyRequests.length,
    resourceBreakdown,
    largeImages,
    longTasks,
    unusedJSBytes,

  };
}
