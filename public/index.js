// VARIABLES
const periods = [
    "08:50 - 10:20",
    "10:30 - 12:00",
    "13:00 - 14:30",
    "14:40 - 16:10",
    "16:20 - 17:50",
    "18:00 - 19:30",
];
let isLoggedIn = false;
let currentClassDataCache = [];
let showCompletedTodos = false;

// FUNCTION THAT RUNS ON LOAD
(async function () {
    const accessToken = localStorage.getItem("database_accessToken");
    if (accessToken) isLoggedIn = true;

    await getDataFromDatabase();

    const kyomuUsername = localStorage.getItem("kyomuUsername");
    const kyomuPassword = localStorage.getItem("kyomuPassword");
    if (kyomuUsername && kyomuPassword) {
        document.getElementById("kyomuUsername").value = kyomuUsername;
        document.getElementById("kyomuPassword").value = kyomuPassword;
    }
})();

// UTIL FUNCTIONS
function createCell(text) {
    let newCell = document.createElement("td");
    newCell.innerHTML = text;
    return newCell;
}

function createRow() {
    return document.createElement("tr");
}

function parseJwt(token) {
    if (token && token.length > 0) {
        var base64Url = token.split(".")[1];
        var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        var jsonPayload = decodeURIComponent(
            window
                .atob(base64)
                .split("")
                .map(function (c) {
                    return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join("")
        );

        return JSON.parse(jsonPayload);
    }

    return "";
}

function showToast(text) {
    const alertToast = document.getElementById("alert-toast");
    document.getElementById("alert-toast-msg").innerHTML = text;
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(alertToast);
    toastBootstrap.show();
}

function setLoginStatusFront() {
    if (isLoggedIn) {
        document.getElementById("login-status").innerHTML = "Logged in as: ";
        document.getElementById("loggedin-username").innerHTML = parseJwt(
            localStorage.getItem("database_accessToken")
        ).email;
        document.getElementById("login-btn-div").innerHTML = `
            <button type="button" class="btn btn-link p-0" onclick="logout()">Logout</button>
        `;
        document.getElementById("update-class-data-div").style.display = "block";
    } else {
        document.getElementById("login-status").innerHTML = "Logged out ";
        document.getElementById("loggedin-username").innerHTML = "";
        document.getElementById("login-btn-div").innerHTML = `
            <button
                type="button"
                class="btn btn-link p-0"
                data-bs-toggle="modal"
                data-bs-target="#loginModal"
            >Login</button>
        `;
        document.getElementById("cirriculum-table").querySelector("tbody").innerHTML = "";
        document.getElementById("total-credits").innerHTML = "0";
        document.getElementById("update-class-data-div").style.display = "none";
        localStorage.removeItem("kyomuUsername");
        localStorage.removeItem("kyomuPassword");
        document.getElementById("kyomuUsername").value = "";
        document.getElementById("kyomuPassword").value = "";
    }
}

function setLoadingStatus(isLoading) {
    if (isLoading) {
        document.querySelectorAll(".non-loading").forEach((el) => {
            el.style.display = "none";
        });
        document.querySelectorAll(".loading").forEach((el) => {
            el.style.display = "inline-block";
        });
    } else {
        document.querySelectorAll(".non-loading").forEach((el) => {
            el.style.display = "block";
        });
        document.querySelectorAll(".loading").forEach((el) => {
            el.style.display = "none";
        });
    }
}

function setDataToTable(data) {
    let totalCredits = 0;
    const table = document.getElementById("cirriculum-table").querySelector("tbody");
    table.innerHTML = "";

    data.forEach((period, i) => {
        const row = createRow();
        row.append(createCell(periods[i]));
        period.forEach((singleClass, y) => {
            const classroomLink1 =
                singleClass.classClassroomLink != ""
                    ? `<a href="${singleClass.classClassroomLink}" target="_blank">Classroom</a>`
                    : "";
            const classroomLink2 =
                singleClass.secondHalfClassClassroomLink != ""
                    ? `<a href="${singleClass.secondHalfClassClassroomLink}" target="_blank">Classroom</a>`
                    : "";
            const cellText =
                singleClass.classId.length > 0 == ""
                    ? `<div class="row-box-lighter"><span class="text-body-secondary">First half of semester not selected</span></div>`
                    : `<div class="row-box">
                            <a href="${singleClass.classLink}" target="_blank">
                                <h5>${singleClass.className}</h5>
                            </a>
                            <p class="m-0">Credit: ${singleClass.classCredit}</p>
                            <p class="m-0">Todos: ${
                                singleClass.classTodos.filter((task) => !task.isDone).length
                            }</p>
                            ${classroomLink1}
                            <button type="button" class="btn btn-secondary w-100" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-i="${i}" data-bs-y="${y}" data-bs-s="false">Extras</button>
                    </div>`;
            const cellText2 =
                singleClass.secondHalfClassId.length > 0 == ""
                    ? `<div class="row-box-lighter"><span class="text-body-secondary">Second half of semester not selected</span></div>`
                    : `<div class="row-box">
                            <a href="${singleClass.secondHalfClassLink}" target="_blank">
                                <h5>${singleClass.secondHalfClassName}</h5>
                            </a>
                            <p class="m-0">Credit: ${singleClass.secondHalfClassCredit}</p>
                            <p class="m-0">Todos: ${
                                singleClass.secondHalfClassTodos.filter((task) => !task.isDone)
                                    .length
                            }</p>
                            ${classroomLink2}
                            <button type="button" class="btn btn-secondary w-100" data-bs-toggle="modal" data-bs-target="#editModal" data-bs-i="${i}" data-bs-y="${y}" data-bs-s="true">Extras</button>
                    </div>`;
            row.append(createCell(cellText + cellText2));
            totalCredits +=
                Number(singleClass.classCredit) + Number(singleClass.secondHalfClassCredit);
        });
        table.appendChild(row);
    });

    document.getElementById("total-credits").innerHTML = totalCredits;
}

function clearAndSetClassDataToModal({ i, y, s }) {
    let className = "";
    let classroomLink = "";
    let todos = [];

    if (s == "false") {
        className = currentClassDataCache[i][y].className;
        classroomLink = currentClassDataCache[i][y].classClassroomLink;
        todos = currentClassDataCache[i][y].classTodos.map((todo, index) => {
            return { ...todo, origIndex: index };
        });
    } else {
        className = currentClassDataCache[i][y].secondHalfClassName;
        classroomLink = currentClassDataCache[i][y].secondHalfClassClassroomLink;
        todos = currentClassDataCache[i][y].secondHalfClassTodos.map((todo, index) => {
            return { ...todo, origIndex: index };
        });
    }

    todos = todos.sort(function (x, y) {
        return x.isDone === y.isDone ? 0 : x.isDone ? -1 : 1;
    });

    const modalTitle = editModal.querySelector("#edit-modal-title");
    const classroomLinkInput = editModal.querySelector("#classroom-link");
    const iInput = editModal.querySelector("#edit-modal-i");
    const yInput = editModal.querySelector("#edit-modal-y");
    const sInput = editModal.querySelector("#edit-modal-s");

    modalTitle.textContent = className;
    classroomLinkInput.value = classroomLink;
    const addTodoList = editModal.querySelector("#add-todo-list");
    addTodoList.innerHTML = "";
    for (let i = 0; i < todos.length; i++) {
        setTodoDataToFront(todos[i].origIndex, todos[i].text, todos[i].isDone);
    }
    iInput.value = i;
    yInput.value = y;
    sInput.value = s;
}

function setTodoDataToFront(id, text, isDone = false) {
    if (!showCompletedTodos && isDone) return;
    let classToAdd = "";
    if (isDone) {
        classToAdd = "text-decoration-line-through";
    }

    const addTodoList = editModal.querySelector("#add-todo-list");
    const addTodoHtml = `
        <li class="list-group-item list-group-item-dark">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-3 w-100 overflow-auto">
                    <input
                        type="checkbox"
                        id="todo-${id}"
                        onchange="todoChange(event, '${id}')"
                        ${isDone ? "checked" : ""}
                    />
                    <p class="m-0 overflow-auto ${classToAdd}" id="todo-label-${id}">
                            ${text}
                    </p>
                </div>
                <button type="button" class="btn-close" aria-label="Close" onclick="todoDelete('${id}')"></button>
            </div>
        </li>
    `;

    addTodoList.innerHTML = addTodoHtml + addTodoList.innerHTML;
}

function verifyData(data) {
    const classDataFlattened = data.flat();
    return !classDataFlattened.every((myClass) => myClass.classId == "");
}

function showTodoChange(event) {
    if (event.target.checked) {
        showCompletedTodos = true;
    } else {
        showCompletedTodos = false;
    }

    const iInput = editModal.querySelector("#edit-modal-i").value;
    const yInput = editModal.querySelector("#edit-modal-y").value;
    const sInput = editModal.querySelector("#edit-modal-s").value;
    clearAndSetClassDataToModal({
        i: iInput,
        y: yInput,
        s: sInput,
    });
}

// MAIN FUNCTIONS
async function login(e) {
    if (e) e.preventDefault();
    const database_username = document.getElementById("database_username").value;
    const database_password = document.getElementById("database_password").value;
    document.getElementById("database_password").value = "";
    if (database_username && database_password) {
        setLoadingStatus(true);
        const res = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: database_username,
                password: database_password,
            }),
        });
        setLoadingStatus(false);

        if (res.status == 200) {
            const resJson = await res.json();
            isLoggedIn = true;

            const loginModal = bootstrap.Modal.getOrCreateInstance("#loginModal");
            loginModal.hide();

            localStorage.setItem("database_accessToken", resJson.accessToken);
            localStorage.setItem("database_refreshToken", resJson.refreshToken);
            await getDataFromDatabase();
        } else {
            const error = await res.text();
            showToast(error);
        }
    } else {
        setLoadingStatus(false);
    }

    setLoginStatusFront();
}

function logout() {
    const refreshToken = localStorage.getItem("database_refreshToken");
    fetch("/logout", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            refreshToken: refreshToken,
        }),
    });
    localStorage.removeItem("database_accessToken");
    localStorage.removeItem("database_refreshToken");
    isLoggedIn = false;
    setLoginStatusFront();
}

async function resetPassword(e) {
    e.preventDefault();
    const resetEmail = document.getElementById("reset-email").value;
    const newPassword = document.getElementById("new-password").value;
    const newPasswordConfirm = document.getElementById("new-password-confirm").value;

    if (resetEmail && newPassword && newPasswordConfirm) {
        if (newPassword != newPasswordConfirm) {
            showToast("Passwords do not match");
            return setLoadingStatus(false);
        }
        document.getElementById("new-password").value = "";
        document.getElementById("new-password-confirm").value = "";
        setLoadingStatus(true);
        const res = await fetch("/send-reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: resetEmail,
                toPassword: newPassword,
            }),
        });
        setLoadingStatus(false);

        if (res.status == 200) {
            showToast(
                "Email will be sent if user is registered. Wait at least 30 seconds or check your spam folder too."
            );
        } else {
            const error = await res.text();
            showToast(error);
        }
    } else {
        setLoadingStatus(false);
    }
}

async function signup(e) {
    e.preventDefault();
    const database_username_signup = document.getElementById("database_username_signup").value;
    const database_password_signup = document.getElementById("database_password_signup").value;
    const database_password_signup_confirm = document.getElementById(
        "database_password_signup_confirm"
    ).value;

    if (database_username_signup && database_password_signup && database_password_signup_confirm) {
        if (database_password_signup != database_password_signup_confirm) {
            showToast("Passwords do not match");
            return setLoadingStatus(false);
        }
        document.getElementById("database_password_signup").value = "";
        document.getElementById("database_password_signup_confirm").value = "";
        setLoadingStatus(true);
        const res = await fetch("/create-account", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: database_username_signup,
                password: database_password_signup,
            }),
        });
        setLoadingStatus(false);

        if (res.status == 200) {
            document.getElementById("database_username").value = database_username_signup;
            document.getElementById("database_password").value = database_password_signup;
            await login(null);
        } else {
            const error = await res.text();
            showToast(error);
        }
    } else {
        setLoadingStatus(false);
    }
}

async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("database_refreshToken");
    if (refreshToken) {
        setLoadingStatus(true);
        const res = await fetch("/refresh-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refreshToken: refreshToken,
            }),
        });
        setLoadingStatus(false);

        if (res.status == 200) {
            const resJson = await res.json();
            localStorage.setItem("database_accessToken", resJson.accessToken);
            return true;
        } else {
            const error = await res.text();
            showToast(error);
            if (res.status == 401 || res.status == 403) {
                logout();
            }
            return false;
        }
    } else {
        setLoadingStatus(false);
    }

    return false;
}

async function getDataFromDatabase() {
    const accessToken = localStorage.getItem("database_accessToken");
    if (accessToken) {
        setLoadingStatus(true);
        const res = await fetch("/get-userdata", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: accessToken,
            },
        }).catch((err) => {
            console.log(err);
        });
        setLoadingStatus(false);

        if (res.status == 200) {
            const resJson = await res.json();

            if (resJson.data != "") {
                const classData = JSON.parse(resJson.data);
                setDataToTable(classData);
                currentClassDataCache = classData;
            }
        } else {
            const error = await res.text();
            if (res.status == 401 || res.status == 403) {
                if (await refreshAccessToken()) {
                    await getDataFromDatabase();
                }
            } else if (res.status == 400) {
                showToast(error);
                logout();
            } else {
                showToast(error);
            }
        }
    } else {
        setLoadingStatus(false);
    }

    setLoginStatusFront();
}

async function updateClassDataOnDatabase(classData, previousClassData) {
    const accessToken = localStorage.getItem("database_accessToken");
    if (accessToken) {
        setLoadingStatus(true);
        const res = await fetch("/update-userdata", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: accessToken,
            },
            body: JSON.stringify({
                data: JSON.stringify(classData),
            }),
        });
        setLoadingStatus(false);

        if (res.status == 200) {
            currentClassDataCache = classData;
            bootstrap.Modal.getOrCreateInstance("#refreshModal").hide();
        } else {
            currentClassDataCache = previousClassData;
            const error = await res.text();

            if (res.status == 401 || res.status == 403) {
                if (await refreshAccessToken()) {
                    await updateClassDataOnDatabase(classData, previousClassData);
                }
            } else if (res.status == 400) {
                bootstrap.Modal.getOrCreateInstance("#editModal").hide();
                showToast(error);
                currentClassDataCache = [];
                logout();
            } else {
                bootstrap.Modal.getOrCreateInstance("#editModal").hide();
                showToast(error);
            }
        }
    } else {
        setLoadingStatus(false);
    }
}

async function getClassesManual(e) {
    e.preventDefault();
    const rawhtml = document.getElementById("rawhtml").value;
    document.getElementById("rawhtml").value = "";

    const parser = new DOMParser();
    const kyoumuDoc = parser.parseFromString(rawhtml, "text/html");

    let classes = [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const periodCount = 6;
    for (let period = 1; period <= periodCount; period++) {
        let classesOnSinglePeriodByDays = [];
        for (let index = 0; index < days.length; index++) {
            const classIdSpan1 = kyoumuDoc.getElementById(
                `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl00_lblLctCd`
            );

            const classNameSpan1 = kyoumuDoc.getElementById(
                `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl00_lblSbjName`
            );
            let classLink1 = "";
            if (classNameSpan1) {
                const aElement1 = classNameSpan1.querySelector("a");
                if (aElement1) {
                    classLink1 = aElement1.getAttribute("href");
                }
            }

            const classCredit1 = kyoumuDoc.getElementById(
                `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl00_lblCredit`
            );

            const classIdSpan2 = kyoumuDoc.getElementById(
                `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl02_lblLctCd`
            );

            const classNameSpan2 = kyoumuDoc.getElementById(
                `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl02_lblSbjName`
            );
            let classLink2 = "";
            if (classNameSpan2) {
                const aElement2 = classNameSpan2.querySelector("a");
                if (aElement2) {
                    classLink2 = aElement2.getAttribute("href");
                }
            }

            const classCredit2 = kyoumuDoc.getElementById(
                `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl02_lblCredit`
            );

            const classIdSpan3 = kyoumuDoc.getElementById(
                `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl03_lblLctCd`
            );

            const classNameSpan3 = kyoumuDoc.getElementById(
                `ctl00_phContents_rrMain_ttTable_lct${days[index]}${period}_ctl03_lblSbjName`
            );
            let classLink3 = "";
            if (classNameSpan3) {
                const aElement3 = classNameSpan3.querySelector("a");
                if (aElement3) {
                    classLink3 = aElement3.getAttribute("href");
                }
            }

            const classCredit3 = kyoumuDoc.getElementById(
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

    if (!verifyData(classes)) {
        showToast("No class selected or failed");
        return;
    }

    document.getElementById("total-credits").innerHTML = "0";
    const table = document.getElementById("cirriculum-table").querySelector("tbody");
    table.innerHTML = "";
    await processFetchedClassData(classes);
    setDataToTable(currentClassDataCache);
}

async function getClassesAuto(e) {
    e.preventDefault();
    const kyomuUsername = document.getElementById("kyomuUsername").value;
    const kyomuPassword = document.getElementById("kyomuPassword").value;
    const onetimepass = document.getElementById("onetimepass").value;
    if (
        kyomuPassword &&
        kyomuPassword &&
        onetimepass &&
        kyomuPassword != "" &&
        kyomuPassword != "" &&
        onetimepass != ""
    ) {
        document.getElementById("total-credits").innerHTML = "0";
        const table = document.getElementById("cirriculum-table").querySelector("tbody");
        table.innerHTML = "";
        document.getElementById("onetimepass").value = "";

        setLoadingStatus(true);
        const res = await fetch("/get-classes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: kyomuUsername,
                password: kyomuPassword,
                onetimepass,
            }),
        });
        setLoadingStatus(false);

        const resJson = await res.json();
        if (resJson.status == "success") {
            localStorage.setItem("kyomuUsername", kyomuUsername);
            localStorage.setItem("kyomuPassword", kyomuPassword);
            const data = resJson.data;
            if (!verifyData(data)) {
                showToast("No class selected or failed");
                return;
            }
            await processFetchedClassData(data);
            setDataToTable(currentClassDataCache);
        } else {
            showToast(resJson.message);
        }
    } else {
        showToast("Some fields are empty");
    }
}

async function processFetchedClassData(classData) {
    const existingClassData = currentClassDataCache;

    if (existingClassData) {
        const existingClassDataFlattened = existingClassData.flat();

        classData.forEach((period, i) => {
            period.forEach((singleClass, y) => {
                if (singleClass.classId != "") {
                    const existingClass = existingClassDataFlattened.find(
                        (existingClass) => existingClass.classId == singleClass.classId
                    );
                    if (existingClass) {
                        classData[i][y].classClassroomLink = existingClass.classClassroomLink;
                        classData[i][y].classTodos = existingClass.classTodos;
                    }
                }

                if (singleClass.secondHalfClassId != "") {
                    const existingClass2 = existingClassDataFlattened.find(
                        (existingClass2) =>
                            existingClass2.secondHalfClassId == singleClass.secondHalfClassId
                    );
                    if (existingClass2) {
                        classData[i][y].secondHalfClassClassroomLink =
                            existingClass2.secondHalfClassClassroomLink;
                        classData[i][y].secondHalfClassTodos = existingClass2.secondHalfClassTodos;
                    }
                }
            });
        });
    }

    await updateClassDataOnDatabase(classData, existingClassData);
}

async function todoChange(event, id) {
    const todoLabelEl = document.querySelector(`#todo-label-${id}`);
    const iInput = editModal.querySelector("#edit-modal-i").value;
    const yInput = editModal.querySelector("#edit-modal-y").value;
    const sInput = editModal.querySelector("#edit-modal-s").value;

    let todos;
    const previousClassData = JSON.parse(JSON.stringify(currentClassDataCache));

    if (sInput == "false") {
        todos = currentClassDataCache[iInput][yInput].classTodos;
    } else {
        todos = currentClassDataCache[iInput][yInput].secondHalfClassTodos;
    }

    if (event.target.checked) {
        todoLabelEl.classList.add("text-decoration-line-through");
        todos[Number(id)].isDone = true;
    } else {
        todoLabelEl.classList.remove("text-decoration-line-through");
        todos[Number(id)].isDone = false;
    }

    setDataToTable(currentClassDataCache);

    clearAndSetClassDataToModal({
        i: iInput,
        y: yInput,
        s: sInput,
    });

    await updateClassDataOnDatabase(currentClassDataCache, previousClassData);

    setDataToTable(currentClassDataCache);

    clearAndSetClassDataToModal({
        i: iInput,
        y: yInput,
        s: sInput,
    });
}

async function todoDelete(id) {
    if (confirm("Are you sure you want to delete?")) {
        const iInput = editModal.querySelector("#edit-modal-i").value;
        const yInput = editModal.querySelector("#edit-modal-y").value;
        const sInput = editModal.querySelector("#edit-modal-s").value;

        let todos;
        const previousClassData = JSON.parse(JSON.stringify(currentClassDataCache));

        if (sInput == "false") {
            todos = currentClassDataCache[iInput][yInput].classTodos;
        } else {
            todos = currentClassDataCache[iInput][yInput].secondHalfClassTodos;
        }

        todos.splice(Number(id), 1);

        setDataToTable(currentClassDataCache);

        clearAndSetClassDataToModal({
            i: iInput,
            y: yInput,
            s: sInput,
        });

        await updateClassDataOnDatabase(currentClassDataCache, previousClassData);

        setDataToTable(currentClassDataCache);

        clearAndSetClassDataToModal({
            i: iInput,
            y: yInput,
            s: sInput,
        });
    }
}

async function addAndSaveTodoFromUserInput(e) {
    e.preventDefault();
    const todoInputBox = editModal.querySelector("#add-todo-box");

    if (todoInputBox.value == "") return;

    const iInput = editModal.querySelector("#edit-modal-i").value;
    const yInput = editModal.querySelector("#edit-modal-y").value;
    const sInput = editModal.querySelector("#edit-modal-s").value;
    const previousClassData = JSON.parse(JSON.stringify(currentClassDataCache));

    if (sInput == "false") {
        currentClassDataCache[iInput][yInput].classTodos.push({
            text: todoInputBox.value,
            isDone: false,
        });
    } else {
        currentClassDataCache[iInput][yInput].secondHalfClassTodos.push({
            text: todoInputBox.value,
            isDone: false,
        });
    }

    todoInputBox.value = "";
    setDataToTable(currentClassDataCache);
    clearAndSetClassDataToModal({
        i: iInput,
        y: yInput,
        s: sInput,
    });

    await updateClassDataOnDatabase(currentClassDataCache, previousClassData);

    setDataToTable(currentClassDataCache);
    clearAndSetClassDataToModal({
        i: iInput,
        y: yInput,
        s: sInput,
    });
}

async function saveClassClassroomData() {
    const classroomLinkInput = editModal.querySelector("#classroom-link").value;
    const iInput = editModal.querySelector("#edit-modal-i").value;
    const yInput = editModal.querySelector("#edit-modal-y").value;
    const sInput = editModal.querySelector("#edit-modal-s").value;
    const previousClassData = JSON.parse(JSON.stringify(currentClassDataCache));

    if (sInput == "false") {
        currentClassDataCache[iInput][yInput].classClassroomLink = classroomLinkInput;
    } else {
        currentClassDataCache[iInput][yInput].secondHalfClassClassroomLink = classroomLinkInput;
    }

    setDataToTable(currentClassDataCache);

    await updateClassDataOnDatabase(currentClassDataCache, previousClassData);

    setDataToTable(currentClassDataCache);
}

const editModal = document.getElementById("editModal");
if (editModal) {
    editModal.addEventListener("show.bs.modal", (event) => {
        const button = event.relatedTarget;
        const i = button.getAttribute("data-bs-i");
        const y = button.getAttribute("data-bs-y");
        const s = button.getAttribute("data-bs-s");
        clearAndSetClassDataToModal({
            i: i,
            y: y,
            s: s,
        });
    });
}
