// import { getClasses } from "./scraper.js";
import { JSDOM } from "jsdom";

// export default async (event, context) => {
//     // Parse the request body from the event object
//     const { body } = JSON.parse(event.body);

//     // Your logic here
//     const allClasses = await getClasses(body.username, body.password, body.onetimepass);

//     // Return the response
//     return {
//         statusCode: 200,
//         body: JSON.stringify(allClasses),
//         headers: {
//             "Content-Type": "application/json",
//         },
//     };
// };

export const config = {
    runtime: "edge",
};

export default async function handler(req) {
    const response = await fetch("https://kyomu.office.tut.ac.jp/portal/StudentApp/Top.aspx");
    const html = await response.text();

    const dom = new JSDOM(html);
    const text = dom.window.document.getElementById("error_lnkLogin_lnk").textContent;

    return new Response(text);
}
