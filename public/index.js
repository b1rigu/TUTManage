const baseUrl = "http://localhost:3000/";
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

    const isOnetimeRequired = await fetch(baseUrl + "check-onetime-requirement", {
        method: "GET",
    });
    if (isOnetimeRequired.ok && (await isOnetimeRequired.json()).isRequired) {
        document.getElementById("onetimepass-field").style.display = "block";
    }
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
                            <p>Credit: ${singleClass.classCredit}</p>
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
                            <p>Credit: ${singleClass.secondHalfClassCredit}</p>
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

    const res = await fetch(
        baseUrl +
            `get-classes?username=${username}&password=${password}&onetimepass=${onetimepass}`,
        {
            method: "GET",
        }
    );

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

        clearAndSetClassDataToModal({
            i: iInput,
            y: yInput,
            s: sInput,
        });
    }
}

function addTodo(id, text, isDone = false) {
    let classToAdd = "";
    if (isDone) {
        classToAdd = "text-decoration-line-through";
    }

    const addTodoList = editModal.querySelector("#add-todo-list");
    const addTodoHtml = `
        <li class="list-group-item list-group-item-dark">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <input
                        type="checkbox"
                        id="todo-${id}"
                        onchange="todoChange(event, '${id}')"
                        ${isDone ? "checked" : ""}
                    />
                    <label class="d-inline ${classToAdd}" for="todo-${id}" id="todo-label-${id}">
                        ${text}
                    </label>
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
        addTodo(classData[iInput][yInput].classTodos.length, todoInputBox.value);
        classData[iInput][yInput].classTodos.push({
            text: todoInputBox.value,
            isDone: false,
        });
    } else {
        addTodo(classData[iInput][yInput].secondHalfClassTodos.length, todoInputBox.value);
        classData[iInput][yInput].secondHalfClassTodos.push({
            text: todoInputBox.value,
            isDone: false,
        });
    }

    todoInputBox.value = "";
    localStorage.setItem("classData", JSON.stringify(classData));
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
function sortOrHideTodosList(todos) {
    if (showCompletedTodos) {
        return todos.sort(function (x, y) {
            return x.isDone === y.isDone ? 0 : x.isDone ? -1 : 1;
        });
    }

    return todos.filter((todo) => !todo.isDone);
}

function clearAndSetClassDataToModal({ i, y, s }) {
    const classData = getClassDataFromLocalStorage();

    let className = "";
    let classroomLink = "";
    let todos = [];

    if (s == "false") {
        className = classData[i][y].className;
        classroomLink = classData[i][y].classClassroomLink;
        todos = classData[i][y].classTodos;
    } else {
        className = classData[i][y].secondHalfClassName;
        classroomLink = classData[i][y].secondHalfClassClassroomLink;
        todos = classData[i][y].secondHalfClassTodos;
    }

    todos = sortOrHideTodosList(todos);

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
        addTodo(i, todos[i].text, todos[i].isDone);
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
