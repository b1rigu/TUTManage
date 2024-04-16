import puppeteer from "puppeteer";
const mainPageUrl = "https://kyomu.office.tut.ac.jp/portal/StudentApp/Top.aspx";

const loginWithUserPass = async (page, username, password) => {
    const loginBtnSelector = "button[type='submit']";
    await page.waitForSelector(loginBtnSelector);
    await page.type("#username", username);
    await page.type("#password", password);
    await page.click(loginBtnSelector);
};

const checkIfOneTimePassNeeded = async (page, oneTimePass) => {
    try {
        await page.waitForNavigation();
        const oneTimeBtn = "button[name='_eventId_ChooseExternal']";
        await page.waitForSelector(oneTimeBtn, { timeout: 500 });
        await page.click(oneTimeBtn);
        const loginBtnSelector = "#login";

        try {
            await page.$("#error_msg1");
            await page.click("a:has-text('Re-Login')");

            await page.waitForSelector(loginBtnSelector);
            await page.type("input[name='candr']", oneTimePass);
            await page.click(loginBtnSelector);

            return;
        } catch {}

        await page.waitForSelector(loginBtnSelector);
        await page.type("input[name='candr']", oneTimePass);
        await page.click(loginBtnSelector);
    } catch (error) {}
};

export const getClasses = async (username, password, oneTimePass) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.emulateTimezone("Asia/Tokyo");
    await page.goto(mainPageUrl);

    const goToLoginSelector = "#error_lnkLogin_lnk";
    await page.waitForSelector(goToLoginSelector);
    await page.click(goToLoginSelector);

    await loginWithUserPass(page, username, password);

    await checkIfOneTimePassNeeded(page, oneTimePass);

    const header1Sel = "#ctl00_bhHeader_ctl16_lnk";
    await page.waitForSelector(header1Sel);
    await page.click(header1Sel);

    const header2Sel = "#ctl00_bhHeader_ctl28_lnk";
    await page.waitForSelector(header2Sel);
    await page.click(header2Sel);

    await page.waitForNavigation();

    // Entered the register page

    const allClasses = await page.evaluate(() => {
        let classes = [];
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        const periodCount = 6;
        for (let period = 1; period <= periodCount; period++) {
            let classesOnSinglePeriodByDays = [];
            for (let index = 0; index < days.length; index++) {
                const classIdSpan1 = document.getElementById(
                    `ctl00_phContents_ucRegistEdit_reTable_ttTable_lct${days[index]}${period}_ctl00_lblLctCd`
                );

                const classNameSpan1 = document.getElementById(
                    `ctl00_phContents_ucRegistEdit_reTable_ttTable_lct${days[index]}${period}_ctl00_lblSbjName`
                );
                let classLink1 = "";
                if (classNameSpan1) {
                    const aElement1 = classNameSpan1.querySelector("a");
                    if (aElement1) {
                        classLink1 = aElement1.getAttribute("href");
                    } else {
                        console.log("No <a> element found within the <span>.");
                    }
                }

                const classCredit1 = document.getElementById(
                    `ctl00_phContents_ucRegistEdit_reTable_ttTable_lct${days[index]}${period}_ctl00_lblCredit`
                );

                const classIdSpan2 = document.getElementById(
                    `ctl00_phContents_ucRegistEdit_reTable_ttTable_lct${days[index]}${period}_ctl02_lblLctCd`
                );

                const classNameSpan2 = document.getElementById(
                    `ctl00_phContents_ucRegistEdit_reTable_ttTable_lct${days[index]}${period}_ctl02_lblSbjName`
                );
                let classLink2 = "";
                if (classNameSpan2) {
                    const aElement2 = classNameSpan1.querySelector("a");
                    if (aElement2) {
                        classLink2 = aElement2.getAttribute("href");
                    } else {
                        console.log("No <a> element found within the <span>.");
                    }
                }

                const classCredit2 = document.getElementById(
                    `ctl00_phContents_ucRegistEdit_reTable_ttTable_lct${days[index]}${period}_ctl02_lblCredit`
                );

                classesOnSinglePeriodByDays.push({
                    classId: classIdSpan1 ? classIdSpan1.textContent : "",
                    className: classNameSpan1 ? classNameSpan1.textContent : "",
                    classLink: classLink1,
                    classCredit: classCredit1
                        ? classCredit1.textContent.replace(/[^0-9]/g, "")
                        : "",
                    classClassroomLink: "",
                    classNote: "",
                    secondHalfClassId: classIdSpan2 ? classIdSpan2.textContent : "",
                    secondHalfClassName: classNameSpan2 ? classNameSpan2.textContent : "",
                    secondHalfClassLink: classLink2,
                    secondHalfClassCredit: classCredit2
                        ? classCredit2.textContent.replace(/[^0-9]/g, "")
                        : "",
                    secondHalfClassClassroomLink: "",
                    secondHalfClassNote: "",
                });
            }
            classes.push(classesOnSinglePeriodByDays);
        }
        return classes;
    });
    await browser.close();

    return allClasses;
};
