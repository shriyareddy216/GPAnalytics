const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/fetch-data", async (req, res) => {
  const { username, password } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    // Login page
    await page.goto("https://erp.cbit.org.in/", { waitUntil: "domcontentloaded" });

    // Username
    await page.type("#txtUserName", username, { delay: 100 });
    await page.click("#btnNext");

    // Password
    await page.waitForSelector("#txtPassword", { visible: true });
    await page.type("#txtPassword", password, { delay: 100 });
    await page.click("#btnSubmit");

    // CGPA
    await page.waitForSelector("#ctl00_cpStud_lnkOverallMarksSemwiseMarks", { visible: true });
    await page.click("#ctl00_cpStud_lnkOverallMarksSemwiseMarks");

    await page.waitForSelector("#ctl00_cpStud_lblMarks", { visible: true });
    const cgpa = await page.$eval("#ctl00_cpStud_lblMarks", el => el.innerText.trim());

    // Go back and fetch subjects
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.click("#ctl00_cpHeader_ucStudCorner_lnkQuit")
    ]);

    await page.waitForSelector("#ctl00_cpStud_lnkStudentMain", { visible: true });
    await page.click("#ctl00_cpStud_lnkStudentMain");

    await page.waitForSelector("#ctl00_cpStud_grdSubject", { visible: true, timeout: 60000 });
    const subjects = await page.$$eval(
      "#ctl00_cpStud_grdSubject tr td:nth-child(2) a",
      (nodes) => nodes.map((n) => n.innerText.trim())
    );

    await browser.close();

    res.json({ cgpa, subjects });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
