import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

interface LighthouseResult {
  report: any; 
}

export async function runLighthouse(url: string): Promise<LighthouseResult | { error: string }> {
  if (!url) {
    return { error: 'URL is required' };
  }

  try {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
    };
    const runnerResult = await lighthouse(url, options);

    await chrome.kill();

    const reportJson = runnerResult.report;
    const report = JSON.parse(reportJson);

    return { report };
  } catch (error: any) {
    console.error('Lighthouse error:', error);
    return { error: `Lighthouse analysis failed: ${error.message || 'Unknown error'}` };
  }
}