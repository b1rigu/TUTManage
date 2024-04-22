import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
const mainPageUrl = "https://kyomu.office.tut.ac.jp/portal/StudentApp/Top.aspx";

chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

const loginWithUserPass = async (page, username, password) => {
    const loginBtnSelector = "button[type='submit']";
    await page.waitForSelector(loginBtnSelector);
    await page.type("#username", username);
    await page.type("#password", password);
    await page.click(loginBtnSelector);
    await page.waitForSelector("body");

    const error = await page.$(".form-error");
    if (error) {
        return false;
    }

    return true;
};

const checkIfOneTimePassNeeded = async (page, oneTimePass) => {
    const oneTimeBtn = "button[name='_eventId_ChooseExternal']";
    if (await page.$(oneTimeBtn)) {
        if (oneTimePass == "") {
            return false;
        }

        await page.click(oneTimeBtn);
        await page.waitForSelector("body");
        if (await page.$("#error_msg1")) {
            await page.click("a:has-text('Re-Login')");
        }
        const loginBtnSelector = "#login";
        await page.waitForSelector(loginBtnSelector);
        await page.type("input[name='candr']", oneTimePass);
        await page.click(loginBtnSelector);
        await page.waitForSelector("body");

        if (await page.$("#error_msg1")) {
            return false;
        }
    }

    return true;
};

export const getClasses = async (username, password, oneTimePass) => {
    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.goto(mainPageUrl);

    const goToLoginSelector = "#error_lnkLogin_lnk";
    await page.waitForSelector(goToLoginSelector);
    await page.click(goToLoginSelector);

    const userPassLoginSuccessful = await loginWithUserPass(page, username, password);
    if (!userPassLoginSuccessful) {
        await browser.close();
        return {
            status: "error",
            message: "Username or Password was wrong",
            data: "",
        };
    }

    const oneTimeLoginSuccessful = await checkIfOneTimePassNeeded(page, oneTimePass);
    if (!oneTimeLoginSuccessful) {
        await browser.close();
        return {
            status: "error",
            message: "OneTimePass was wrong or required",
            data: "",
        };
    }

    // Entered the main page

    const header1Sel = "#ctl00_bhHeader_ctl16_lnk";
    await page.waitForSelector(header1Sel);
    await page.click(header1Sel);

    const header2Sel = "#ctl00_bhHeader_ctl30_lnk";
    await page.waitForSelector(header2Sel);
    await page.click(header2Sel);

    await page.waitForSelector("#ctl00_lblToTop_lbl");

    // Entered the register page

    await browser.close();
    return {
        status: "success",
        message: "",
        data: [],
    };

    const allClasses = await page.evaluate(() => {
        let classes = [];
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        const periodCount = 6;
        for (let period = 1; period <= periodCount; period++) {
            let classesOnSinglePeriodByDays = [];
            for (let index = 0; index < days.length; index++) {
                const classIdSpan1 = document.getElementById(
                    `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl00_lblLctCd`
                );

                const classNameSpan1 = document.getElementById(
                    `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl00_lblSbjName`
                );
                let classLink1 = "";
                if (classNameSpan1) {
                    const aElement1 = classNameSpan1.querySelector("a");
                    if (aElement1) {
                        classLink1 = aElement1.getAttribute("href");
                    }
                }

                const classCredit1 = document.getElementById(
                    `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl00_lblCredit`
                );

                const classIdSpan2 = document.getElementById(
                    `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl02_lblLctCd`
                );

                const classNameSpan2 = document.getElementById(
                    `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl02_lblSbjName`
                );
                let classLink2 = "";
                if (classNameSpan2) {
                    const aElement2 = classNameSpan2.querySelector("a");
                    if (aElement2) {
                        classLink2 = aElement2.getAttribute("href");
                    }
                }

                const classCredit2 = document.getElementById(
                    `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl02_lblCredit`
                );

                const classIdSpan3 = document.getElementById(
                    `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl03_lblLctCd`
                );

                const classNameSpan3 = document.getElementById(
                    `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl03_lblSbjName`
                );
                let classLink3 = "";
                if (classNameSpan3) {
                    const aElement3 = classNameSpan3.querySelector("a");
                    if (aElement3) {
                        classLink3 = aElement3.getAttribute("href");
                    }
                }

                const classCredit3 = document.getElementById(
                    `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl03_lblCredit`
                );

                classesOnSinglePeriodByDays.push({
                    classId: classIdSpan1 ? classIdSpan1.textContent.trim() : "",
                    className: classNameSpan1 ? classNameSpan1.textContent.trim() : "",
                    classLink: classLink1,
                    classCredit: classCredit1
                        ? classCredit1.textContent.trim().replace(/[^0-9]/g, "")
                        : "",
                    classClassroomLink: "",
                    classTodos: [],
                    secondHalfClassId: classIdSpan2
                        ? classIdSpan2.textContent.trim()
                        : classIdSpan3
                        ? classIdSpan3.textContent.trim()
                        : "",
                    secondHalfClassName: classNameSpan2
                        ? classNameSpan2.textContent.trim()
                        : classNameSpan3
                        ? classNameSpan3.textContent.trim()
                        : "",
                    secondHalfClassLink:
                        classLink2 != "" ? classLink2 : classLink3 != "" ? classLink3 : "",
                    secondHalfClassCredit: classCredit2
                        ? classCredit2.textContent.trim().replace(/[^0-9]/g, "")
                        : classCredit3
                        ? classCredit3.textContent.trim().replace(/[^0-9]/g, "")
                        : "",
                    secondHalfClassClassroomLink: "",
                    secondHalfClassTodos: [],
                });
            }
            classes.push(classesOnSinglePeriodByDays);
        }
        return classes;
    });

    await browser.close();

    return {
        status: "success",
        message: "",
        data: allClasses,
    };
};
