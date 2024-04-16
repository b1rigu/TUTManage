const baseUrl = "http://localhost:3000/";
const periods = [
    "08:50 - 10:20",
    "10:30 - 12:00",
    "13:00 - 14:30",
    "14:40 - 16:10",
    "16:20 - 17:50",
    "18:00 - 19:30",
];

(function () {
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
                singleClass.classCredit.length == 0
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
                singleClass.secondHalfClassCredit.length == 0
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

async function getClasses(e) {
    e.preventDefault();
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
    const data = await res.json();
    saveClassDataToLocalStorage(data);
    addData(data);
}

function saveClassDataToLocalStorage(data) {
    data.forEach((period, i) => {
        period.forEach((singleClass, y) => {
            data[i][y].classId = singleClass.classId.replace(/\s/g, "");
            data[i][y].secondHalfClassId = singleClass.secondHalfClassId.replace(/\s/g, "");
        });
    });
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
                    data[i][y].classNote = existingClass.classNote;
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
                    data[i][y].secondHalfClassNote = existingClass2.secondHalfClassNote;
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

function saveClassDataFromUserInput() {
    const classroomLinkInput = editModal.querySelector("#classroom-link").value;
    const noteInput = editModal.querySelector("#class-note").value;
    const iInput = editModal.querySelector("#edit-modal-i").value;
    const yInput = editModal.querySelector("#edit-modal-y").value;
    const sInput = editModal.querySelector("#edit-modal-s").value;

    let classData = getClassDataFromLocalStorage();

    if (sInput == "false") {
        classData[iInput][yInput].classClassroomLink = classroomLinkInput;
        classData[iInput][yInput].classNote = noteInput;
    } else {
        classData[iInput][yInput].secondHalfClassClassroomLink = classroomLinkInput;
        classData[iInput][yInput].secondHalfClassNote = noteInput;
    }

    localStorage.setItem("classData", JSON.stringify(classData));
    location.reload();
}

const editModal = document.getElementById("editModal");
if (editModal) {
    editModal.addEventListener("show.bs.modal", (event) => {
        const button = event.relatedTarget;
        const i = button.getAttribute("data-bs-i");
        const y = button.getAttribute("data-bs-y");
        const s = button.getAttribute("data-bs-s");
        const classData = getClassDataFromLocalStorage();

        let className = "";
        let classroomLink = "";
        let note = "";

        if (s == "false") {
            className = classData[i][y].className;
            classroomLink = classData[i][y].classClassroomLink;
            note = classData[i][y].classNote;
        } else {
            className = classData[i][y].secondHalfClassName;
            classroomLink = classData[i][y].secondHalfClassClassroomLink;
            note = classData[i][y].secondHalfClassNote;
        }

        // Update the modal's content.
        const modalTitle = editModal.querySelector("#edit-modal-title");
        const classroomLinkInput = editModal.querySelector("#classroom-link");
        const noteInput = editModal.querySelector("#class-note");
        const iInput = editModal.querySelector("#edit-modal-i");
        const yInput = editModal.querySelector("#edit-modal-y");
        const sInput = editModal.querySelector("#edit-modal-s");

        modalTitle.textContent = className;
        classroomLinkInput.value = classroomLink;
        noteInput.value = note;
        iInput.value = i;
        yInput.value = y;
        sInput.value = s;
    });
}
