const baseUrl = "/";
const periods = [
    "08:50 - 10:20",
    "10:30 - 12:00",
    "13:00 - 14:30",
    "14:40 - 16:10",
    "16:20 - 17:50",
    "18:00 - 19:30",
];

(async function () {
    const classData = getClassDataFromLocalStorage();
    if (classData) {
        addData(classData);
    }

    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");
    if (username && password) {
        document.getElementById("username").value = username;
        document.getElementById("password").value = password;
    }

    document.getElementById("onetimepass-field").style.display = "block";
})();

function addData(data) {
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

function createCell(text) {
    let newCell = document.createElement("td");
    newCell.innerHTML = text;
    return newCell;
}

function createRow() {
    return document.createElement("tr");
}

function backupData() {
    download(
        "var data = " +
            JSON.stringify(localStorage) +
            ";Object.keys(data).forEach(function (k){localStorage.setItem(k, data[k]);});",
        "backup.txt"
    );
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
        alert("No class selected or failed");
        return;
    }
    
    document.getElementById("total-credits").innerHTML = "0";
    const table = document.getElementById("cirriculum-table").querySelector("tbody");
    table.innerHTML = "";
    saveClassDataToLocalStorage(classes);
    addData(classes);
}

async function getClasses(e) {
    e.preventDefault();
    document.getElementById("total-credits").innerHTML = "0";
    const table = document.getElementById("cirriculum-table").querySelector("tbody");
    table.innerHTML = "";
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const onetimepass = document.getElementById("onetimepass").value;
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);

    const res = await fetch(baseUrl + "get-classes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            password,
            onetimepass,
        }),
    });

    const resJson = await res.json();
    if (resJson.status == "success") {
        const data = resJson.data;
        if (!verifyData(data)) {
            alert("No class selected or failed");
            return;
        }
        saveClassDataToLocalStorage(data);
        addData(data);
    } else {
        alert(resJson.message);
    }
}

function download(text, name) {
    const a = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

function verifyData(data) {
    console.log(data);
    const classDataFlattened = data.flat();
    return !classDataFlattened.every((myClass) => myClass.classId == "");
}

function saveClassDataToLocalStorage(data) {
    const existingClassData = getClassDataFromLocalStorage();

    if (!existingClassData) {
        localStorage.setItem("classData", JSON.stringify(data));
        return;
    }

    const existingClassDataFlattened = existingClassData.flat();

    data.forEach((period, i) => {
        period.forEach((singleClass, y) => {
            if (singleClass.classId != "") {
                const existingClass = existingClassDataFlattened.find(
                    (existingClass) => existingClass.classId == singleClass.classId
                );
                if (existingClass) {
                    data[i][y].classClassroomLink = existingClass.classClassroomLink;
                    data[i][y].classTodos = existingClass.classTodos;
                }
            }

            if (singleClass.secondHalfClassId != "") {
                const existingClass2 = existingClassDataFlattened.find(
                    (existingClass2) =>
                        existingClass2.secondHalfClassId == singleClass.secondHalfClassId
                );
                if (existingClass2) {
                    data[i][y].secondHalfClassClassroomLink =
                        existingClass2.secondHalfClassClassroomLink;
                    data[i][y].secondHalfClassTodos = existingClass2.secondHalfClassTodos;
                }
            }
        });
    });

    localStorage.setItem("classData", JSON.stringify(data));
}

function getClassDataFromLocalStorage() {
    const classData = localStorage.getItem("classData");
    if (classData) {
        return JSON.parse(classData);
    }
    return null;
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

function todoChange(event, id) {
    let classData = getClassDataFromLocalStorage();
    const todoLabelEl = document.querySelector(`#todo-label-${id}`);
    const iInput = editModal.querySelector("#edit-modal-i").value;
    const yInput = editModal.querySelector("#edit-modal-y").value;
    const sInput = editModal.querySelector("#edit-modal-s").value;

    let todos;

    if (sInput == "false") {
        todos = classData[iInput][yInput].classTodos;
    } else {
        todos = classData[iInput][yInput].secondHalfClassTodos;
    }

    if (event.target.checked) {
        todoLabelEl.classList.add("text-decoration-line-through");
        todos[Number(id)].isDone = true;
    } else {
        todoLabelEl.classList.remove("text-decoration-line-through");
        todos[Number(id)].isDone = false;
    }

    localStorage.setItem("classData", JSON.stringify(classData));

    addData(classData);

    clearAndSetClassDataToModal({
        i: iInput,
        y: yInput,
        s: sInput,
    });
}

function todoDelete(id) {
    if (confirm("Are you sure you want to delete?")) {
        let classData = getClassDataFromLocalStorage();
        const iInput = editModal.querySelector("#edit-modal-i").value;
        const yInput = editModal.querySelector("#edit-modal-y").value;
        const sInput = editModal.querySelector("#edit-modal-s").value;

        let todos;

        if (sInput == "false") {
            todos = classData[iInput][yInput].classTodos;
        } else {
            todos = classData[iInput][yInput].secondHalfClassTodos;
        }

        todos.splice(Number(id), 1);

        localStorage.setItem("classData", JSON.stringify(classData));

        addData(classData);

        clearAndSetClassDataToModal({
            i: iInput,
            y: yInput,
            s: sInput,
        });
    }
}

function addTodo(id, text, isDone = false) {
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

function addAndSaveTodoFromUserInput() {
    const todoInputBox = editModal.querySelector("#add-todo-box");

    if (todoInputBox.value == "") return;

    let classData = getClassDataFromLocalStorage();
    const iInput = editModal.querySelector("#edit-modal-i").value;
    const yInput = editModal.querySelector("#edit-modal-y").value;
    const sInput = editModal.querySelector("#edit-modal-s").value;

    if (sInput == "false") {
        classData[iInput][yInput].classTodos.push({
            text: todoInputBox.value,
            isDone: false,
        });
    } else {
        classData[iInput][yInput].secondHalfClassTodos.push({
            text: todoInputBox.value,
            isDone: false,
        });
    }

    todoInputBox.value = "";
    localStorage.setItem("classData", JSON.stringify(classData));

    addData(classData);
    clearAndSetClassDataToModal({
        i: iInput,
        y: yInput,
        s: sInput,
    });
}

function saveClassClassroomData() {
    let classData = getClassDataFromLocalStorage();
    const classroomLinkInput = editModal.querySelector("#classroom-link").value;
    const iInput = editModal.querySelector("#edit-modal-i").value;
    const yInput = editModal.querySelector("#edit-modal-y").value;
    const sInput = editModal.querySelector("#edit-modal-s").value;

    if (sInput == "false") {
        classData[iInput][yInput].classClassroomLink = classroomLinkInput;
    } else {
        classData[iInput][yInput].secondHalfClassClassroomLink = classroomLinkInput;
    }

    localStorage.setItem("classData", JSON.stringify(classData));

    if (classData) {
        addData(classData);
    }
}

let showCompletedTodos = false;

function clearAndSetClassDataToModal({ i, y, s }) {
    const classData = getClassDataFromLocalStorage();

    let className = "";
    let classroomLink = "";
    let todos = [];

    if (s == "false") {
        className = classData[i][y].className;
        classroomLink = classData[i][y].classClassroomLink;
        todos = classData[i][y].classTodos.map((todo, index) => {
            return { ...todo, origIndex: index };
        });
    } else {
        className = classData[i][y].secondHalfClassName;
        classroomLink = classData[i][y].secondHalfClassClassroomLink;
        todos = classData[i][y].secondHalfClassTodos.map((todo, index) => {
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
        addTodo(todos[i].origIndex, todos[i].text, todos[i].isDone);
    }
    iInput.value = i;
    yInput.value = y;
    sInput.value = s;
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
