const API = "http://127.0.0.1:4000/tasks";

let tasks = [];
let editTaskId = null;

// ================= ELEMENTS =================
const list = document.getElementById("list");

const title = document.getElementById("title");
const date = document.getElementById("date");
const priority = document.getElementById("priority");
const category = document.getElementById("category");
const desc = document.getElementById("description");
const search = document.getElementById("search");

const total = document.getElementById("total");
const done = document.getElementById("done");
const pending = document.getElementById("pending");

const addBtn = document.getElementById("addBtn");
const clearBtn = document.getElementById("clearBtn");
const toastBox = document.getElementById("toast");

const themeBtn = document.getElementById("themeBtn");

// ================= INIT =================
window.onload = () => {
  loadTasks();
};

// ================= LOAD TASKS =================
async function loadTasks() {
  try {
    const res = await fetch(API);
    tasks = await res.json();

    render();
    stats();

  } catch (err) {
    toast("Server not connected", "error");
  }
}

// ================= ADD / UPDATE TASK =================
addBtn.onclick = async () => {

  const task = {
    title: title.value.trim(),
    date: date.value,
    priority: priority.value,
    category: category.value,
    description: desc.value.trim()
  };

  if (!task.title) {
    toast("Enter task title", "error");
    return;
  }

  try {

    // CREATE
    if (editTaskId === null) {

      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
      });

      toast("Task Added");

    } 
    // UPDATE
    else {

      const existing = tasks.find(t => t.id === editTaskId);

      await fetch(`${API}/${editTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...existing,
          ...task
        })
      });

      toast("Task Updated");

      editTaskId = null;
      addBtn.innerText = "➕ Add Task";
    }

    clear();
    loadTasks();

  } catch (err) {
    toast("Error saving task", "error");
  }
};

// ================= DELETE TASK =================
async function del(id) {
  try {
    await fetch(`${API}/${id}`, {
      method: "DELETE"
    });

    toast("Task Deleted", "error");
    loadTasks();

  } catch (err) {
    toast("Delete failed", "error");
  }
}

// ================= TOGGLE TASK =================
async function toggleTask(id) {

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  try {

    await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...task,
        done: !task.done
      })
    });

    loadTasks();

  } catch (err) {
    toast("Toggle failed", "error");
  }
}

// ================= EDIT TASK =================
function editTask(id) {

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  title.value = task.title;
  date.value = task.date;
  priority.value = task.priority;
  category.value = task.category;
  desc.value = task.description;

  editTaskId = id;
  addBtn.innerText = "✏ Update Task";
}

// ================= RENDER =================
function render(data = tasks) {

  list.innerHTML = "";

  if (data.length === 0) {
    list.innerHTML = `<p class="opacity-70">No tasks found</p>`;
    return;
  }

  data.forEach(task => {

    list.innerHTML += `
      <div class="glass task ${task.done ? 'done' : ''}">

        <div>
          <b>${task.title}</b>
          <p>${task.description || ""}</p>
          <small>${task.date || ""} | ${task.priority} | ${task.category}</small>
        </div>

        <div class="flex gap-2 mt-2">

          <button onclick="toggleTask(${task.id})" class="bg-green-500 px-2">✔</button>

          <button onclick="editTask(${task.id})" class="bg-yellow-500 px-2">✏</button>

          <button onclick="del(${task.id})" class="bg-red-500 px-2">🗑</button>

        </div>

      </div>
    `;
  });
}

// ================= SEARCH =================
search.oninput = () => {

  const q = search.value.toLowerCase();

  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(q)
  );

  render(filtered);
};

// ================= STATS =================
function stats() {

  total.innerText = tasks.length;

  done.innerText = tasks.filter(t => t.done).length;

  pending.innerText = tasks.length - tasks.filter(t => t.done).length;
}

// ================= CLEAR =================
function clear() {

  title.value = "";
  date.value = "";
  desc.value = "";

  editTaskId = null;
  addBtn.innerText = "➕ Add Task";
}

// ================= CLEAR BTN =================
clearBtn.onclick = clear;

// ================= THEME =================
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
};

// ================= TOAST =================
function toast(msg, type = "success") {

  const div = document.createElement("div");
  div.className = "toast";
  div.innerText = msg;

  toastBox.appendChild(div);

  setTimeout(() => div.remove(), 2000);
}