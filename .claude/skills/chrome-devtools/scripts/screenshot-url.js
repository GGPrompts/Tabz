#!/usr/bin/env node
import puppeteer from 'puppeteer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('browserUrl', { type: 'string', description: 'Browser URL to connect to' })
  .option('url', { type: 'string', description: 'URL to navigate to' })
  .option('output', { type: 'string', description: 'Output file path', demandOption: true })
  .option('fullPage', { type: 'boolean', default: false })
  .parse();

async function main() {
  const browser = await puppeteer.connect({
    browserURL: argv.browserUrl
  });

  try {
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();

    if (argv.url) {
      await page.goto(argv.url, { waitUntil: 'networkidle2' });
    }

    await page.screenshot({
      path: argv.output,
      fullPage: argv.fullPage
    });

    const result = {
      success: true,
      output: argv.output,
      url: page.url(),
      title: await page.title()
    };

    console.log(JSON.stringify(result, null, 2));
    await browser.disconnect();
  } catch (error) {
    console.error(JSON.stringify({
      success: false,
      error: error.message
    }, null, 2));
    process.exit(1);
  }
}

main();
