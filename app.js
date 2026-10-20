"use strict";

(() => {
    const STORAGE_KEY = "lindysPharmacy.demoAppointments.v1";
    const messageBox = document.querySelector("[data-message]");

    function showMessage(message, type = "error") {
        if (!messageBox) return;
        messageBox.textContent = message;
        messageBox.className = `message message-${type}`;
        messageBox.hidden = false;
    }

    function loadAppointments() {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved === null) return [];

        let appointments;
        try {
            appointments = JSON.parse(saved);
        } catch (error) {
            throw new Error("Saved demo requests could not be read. Clear this site's browser storage and try again.");
        }
        if (!Array.isArray(appointments)) {
            throw new Error("Saved demo requests have an invalid format. Clear this site's browser storage and try again.");
        }
        return appointments;
    }

    function saveAppointments(appointments) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
        } catch (error) {
            throw new Error("The browser could not save this request. Check that site storage is enabled and has available space.");
        }
    }

    function textElement(tagName, text, className) {
        const element = document.createElement(tagName);
        element.textContent = text;
        if (className) element.className = className;
        return element;
    }

    function referenceFor(appointments) {
        const now = new Date();
        const date = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0")
        ].join("");
        let sequence = appointments.length + 1001;
        let reference = `APT-${date}-${sequence}`;
        const existing = new Set(appointments.map((appointment) => appointment.reference_no));
        while (existing.has(reference)) {
            sequence += 1;
            reference = `APT-${date}-${sequence}`;
        }
        return reference;
    }

    function initializeSharedUi() {
        document.querySelectorAll("[data-current-year]").forEach((element) => {
            element.textContent = String(new Date().getFullYear());
        });

        const toggle = document.querySelector(".nav-toggle");
        const links = document.querySelector("#nav-links");
        if (toggle && links) {
            toggle.addEventListener("click", () => {
                const isOpen = toggle.getAttribute("aria-expanded") === "true";
                toggle.setAttribute("aria-expanded", String(!isOpen));
                links.classList.toggle("is-open", !isOpen);
            });
        }
    }

    function initializeBooking() {
        const form = document.querySelector("#appointment-form");
        if (!form) return;

        const service = document.querySelector("#service");
        const otherField = document.querySelector("#other-service-field");
        const otherInput = document.querySelector("#other_service");

        function updateOtherService() {
            const needsOther = service.value === "Others:";
            otherField.hidden = !needsOther;
            otherInput.required = needsOther;
        }

        service.addEventListener("change", updateOtherService);
        updateOtherService();

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const age = Number(formData.get("patient_age"));
            if (!Number.isInteger(age) || age < 0 || age > 120) {
                showMessage("Please enter a valid age between 0 and 120.");
                return;
            }

            const serviceValue = String(formData.get("service") || "");
            const otherService = String(formData.get("other_service") || "").trim();
            if (serviceValue === "Others:" && !otherService) {
                showMessage("Please specify the other service you need.");
                otherInput.focus();
                return;
            }

            try {
                const appointments = loadAppointments();
                const reference = referenceFor(appointments);
                const appointment = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    reference_no: reference,
                    patient_name: String(formData.get("patient_name") || "").trim(),
                    patient_phone: String(formData.get("patient_phone") || "").trim(),
                    patient_age: age,
                    patient_address: String(formData.get("patient_address") || "").trim(),
                    patient_gender: String(formData.get("patient_gender") || "").trim(),
                    marital_status: String(formData.get("marital_status") || ""),
                    appointment_date: "",
                    appointment_time: "",
                    service: serviceValue === "Others:" ? `Others: ${otherService}` : serviceValue,
                    notes: String(formData.get("notes") || "").trim(),
                    status: "Pending",
                    created_at: new Date().toISOString(),
                    doctor_name: ""
                };
                appointments.push(appointment);
                saveAppointments(appointments);
                window.location.href = `status.html?ref=${encodeURIComponent(reference)}&submitted=1`;
            } catch (error) {
                showMessage(error.message);
            }
        });
    }

    function appendResultRow(container, label, value) {
        const row = document.createElement("div");
        row.className = "result-row";
        row.append(textElement("span", label), textElement("span", value));
        container.append(row);
    }

    function initializeStatusLookup() {
        const form = document.querySelector("#status-form");
        const result = document.querySelector("#appointment-result");
        if (!form || !result) return;

        const input = document.querySelector("#reference");
        const params = new URLSearchParams(window.location.search);
        const initialReference = params.get("ref") || "";
        input.value = initialReference;
        if (params.get("submitted") === "1") {
            showMessage("Your demo request was saved in this browser. It has not been sent to the pharmacy.", "success");
        }

        function search(reference) {
            result.replaceChildren();
            const normalizedReference = reference.trim().toUpperCase();
            if (!normalizedReference) return;

            try {
                const appointment = loadAppointments().find((item) =>
                    String(item.reference_no || "").toUpperCase() === normalizedReference
                );
                if (!appointment) {
                    showMessage("No demo request with that reference code was found in this browser.");
                    return;
                }

                const card = document.createElement("section");
                card.className = "result-card";
                card.setAttribute("aria-label", "Appointment request details");
                card.append(textElement("h2", "Request details"));
                const status = textElement("span", String(appointment.status || "Pending"), `status-pill status-${String(appointment.status || "pending").toLowerCase()}`);
                const statusRow = document.createElement("div");
                statusRow.className = "result-row";
                statusRow.append(textElement("span", "Status"), status);
                card.append(statusRow);
                appendResultRow(card, "Reference", String(appointment.reference_no || ""));
                appendResultRow(card, "Patient", String(appointment.patient_name || ""));
                appendResultRow(card, "Service", String(appointment.service || ""));
                const schedule = appointment.appointment_date && appointment.appointment_time
                    ? `${appointment.appointment_date} at ${appointment.appointment_time}`
                    : "To be scheduled";
                appendResultRow(card, "Schedule", schedule);
                if (appointment.status === "Approved" && appointment.doctor_name) {
                    const note = textElement("p", `Your request was approved. Please call 0981 550 9921 to confirm your appointment details.`);
                    note.className = "notice notice-compact";
                    card.append(note);
                }
                result.append(card);
            } catch (error) {
                showMessage(error.message);
            }
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            search(input.value);
        });
        if (initialReference) search(initialReference);
    }

    function initializeAdmin() {
        const body = document.querySelector("#appointments-body");
        if (!body) return;

        const count = document.querySelector("#request-count");
        const emptyState = document.querySelector("#empty-state");
        const clearButton = document.querySelector("#clear-appointments");

        function render() {
            body.replaceChildren();
            try {
                const appointments = loadAppointments().sort((left, right) =>
                    String(right.created_at || "").localeCompare(String(left.created_at || ""))
                );
                count.textContent = `Saved requests: ${appointments.length}`;
                emptyState.hidden = appointments.length !== 0;

                appointments.forEach((appointment) => {
                    const row = document.createElement("tr");
                    const referenceCell = textElement("td", String(appointment.reference_no || ""));
                    const patientCell = document.createElement("td");
                    patientCell.append(textElement("strong", String(appointment.patient_name || "")));
                    patientCell.append(textElement("small", `${appointment.patient_phone || ""} · Age: ${appointment.patient_age ?? "-"} · ${appointment.patient_gender || "-"} · ${appointment.marital_status || "-"}`));
                    patientCell.append(textElement("small", String(appointment.patient_address || "-")));
                    const serviceCell = textElement("td", String(appointment.service || ""));
                    const schedule = appointment.appointment_date && appointment.appointment_time
                        ? `${appointment.appointment_date} ${appointment.appointment_time}`
                        : "To be scheduled";
                    const scheduleCell = textElement("td", schedule);
                    const statusCell = document.createElement("td");
                    statusCell.append(textElement("span", String(appointment.status || "Pending"), `status-pill status-${String(appointment.status || "pending").toLowerCase()}`));
                    const actionCell = document.createElement("td");
                    const actions = document.createElement("div");
                    actions.className = "table-actions";
                    ["Approved", "Pending", "Cancelled", "Remove"].forEach((action) => {
                        const button = textElement("button", action, action === "Remove" ? "remove-button" : "");
                        button.type = "button";
                        button.dataset.action = action;
                        button.dataset.id = String(appointment.id);
                        actions.append(button);
                    });
                    actionCell.append(actions);
                    row.append(referenceCell, patientCell, serviceCell, scheduleCell, statusCell, actionCell);
                    body.append(row);
                });
            } catch (error) {
                showMessage(error.message);
                count.textContent = "";
                emptyState.hidden = true;
            }
        }

        body.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-action]");
            if (!button) return;
            const action = button.dataset.action;
            const id = button.dataset.id;
            if (action === "Remove" && !window.confirm("Permanently remove this demo request? This cannot be undone.")) return;

            try {
                const appointments = loadAppointments();
                const appointment = appointments.find((item) => String(item.id) === id);
                if (!appointment) {
                    showMessage("That demo request could not be found.");
                    render();
                    return;
                }
                if (action === "Remove") {
                    saveAppointments(appointments.filter((item) => String(item.id) !== id));
                } else if (["Approved", "Pending", "Cancelled"].includes(action)) {
                    appointment.status = action;
                    saveAppointments(appointments);
                }
                render();
                showMessage(action === "Remove" ? "Demo request removed." : `Request set to ${action.toLowerCase()}.`, "success");
            } catch (error) {
                showMessage(error.message);
            }
        });

        clearButton.addEventListener("click", () => {
            if (!window.confirm("Clear every demo request saved in this browser? This cannot be undone.")) return;
            try {
                saveAppointments([]);
                render();
                showMessage("All demo requests were cleared.", "success");
            } catch (error) {
                showMessage(error.message);
            }
        });

        render();
    }

    initializeSharedUi();
    initializeBooking();
    initializeStatusLookup();
    initializeAdmin();
})();
