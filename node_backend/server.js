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

const inputCard = document.querySelector(".input-card");
const collapseMainBtn = document.getElementById("collapseMainBtn");

// ================= INIT =================
window.onload = () => {
  loadTasks();
};

// ================= LOAD TASKS =================
async function loadTasks() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Server error");
    tasks = await res.json();

    render();
    stats();
  } catch (err) {
    console.error("Fetch Error:", err);
    toast("Server not connected", "error");
  }
}

// ================= ADD / UPDATE TASK =================
addBtn.onclick = async () => {
  const taskTitle = title.value.trim();
  if (!taskTitle) {
    toast("Enter task title", "error");
    return;
  }

  // Safe fallback to prevent runtime string-splitting errors
  const formattedDate = date.value ? date.value.split("T")[0] : "";

  const task = {
    title: taskTitle,
    date: formattedDate,
    priority: priority.value,
    category: category.value,
    description: desc.value.trim()
  };

  try {
    let response;

    // CREATE
    if (editTaskId === null) {
      task.done = false; // Prevent stats and toggle components from breaking

      response = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
      });

      if (!response.ok) throw new Error("Network save rejected");

      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Task Added",
        showConfirmButton: false,
        timer: 1500
      });
    } 
    // UPDATE
    else {
      const existing = tasks.find(t => String(t.id) === String(editTaskId));

      response = await fetch(`${API}/${editTaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...existing,
          ...task
        })
      });

      if (!response.ok) throw new Error("Network update rejected");

      toast("Task Updated");
      editTaskId = null;
      addBtn.innerText = "➕ Add Task";
    }

    clear();
    await loadTasks();

  } catch (err) {
    console.error("Database Save Exception:", err);
    toast("Error saving task", "error");
    
    // Always refresh states so the application layout unfreezes
    loadTasks();
  }
};

// ================= DELETE TASK =================
async function del(id) {
  try {
    const response = await fetch(`${API}/${id}`, {
      method: "DELETE"
    });
    if (!response.ok) throw new Error("Delete failed on server");

    toast("Task Deleted", "error");
    loadTasks();
  } catch (err) {
    console.error(err);
    toast("Delete failed", "error");
  }
}

// ================= TOGGLE TASK =================
async function toggleTask(id) {
  const task = tasks.find(t => String(t.id) === String(id));
  if (!task) return;

  try {
    const response = await fetch(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...task,
        done: !task.done
      })
    });
    if (!response.ok) throw new Error("Toggle update failed");

    loadTasks();
  } catch (err) {
    console.error(err);
    toast("Toggle failed", "error");
  }
}

// ================= EDIT TASK =================
function editTask(id) {
  const task = tasks.find(t => String(t.id) === String(id));
  if (!task) return;

  title.value = task.title;
  date.value = task.date || "";
  priority.value = task.priority;
  category.value = task.category;
  desc.value = task.description || "";

  editTaskId = id;
  addBtn.innerText = "✏ Update Task";

  if (inputCard) {
    inputCard.classList.remove("collapsed-note");
    title.placeholder = "What needs to be done?";
  }
}

// ================= RENDER =================
function render(data = tasks) {
  list.innerHTML = "";

  if (data.length === 0) {
    list.innerHTML = `<p class="opacity-60 text-sm font-medium italic py-4">No tasks found in your system.</p>`;
    return;
  }

  data.forEach(task => {
    const badgeColor = task.priority === "High" 
      ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" 
      : task.priority === "Medium" 
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" 
      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";

    // Fixed ID wrapping inside single quotes to avoid evaluation compilation exceptions
    list.innerHTML += `
      <div class="task w-full ${task.done ? 'done' : ''}">
        <div class="flex-1 min-w-0 pr-4">
          <div class="flex flex-wrap items-center gap-2 mb-1.5">
            <b class="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 break-words">${task.title}</b>
            <span class="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${badgeColor}">${task.priority}</span>
            <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-500/20">${task.category}</span>
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-300 mb-2 leading-relaxed break-words font-medium">${task.description || "No description provided."}</p>
          <div class="flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1.5 font-bold">
            <span>📅 ${task.date ? task.date : "No Date"}</span>
          </div>
        </div>
        <div class="flex sm:flex-col md:flex-row gap-2 self-end sm:self-center shrink-0">
          <button onclick="toggleTask('${task.id}')" class="bg-emerald-600 hover:bg-emerald-500 shadow-sm" title="Complete task">✔</button>
          <button onclick="editTask('${task.id}')" class="bg-amber-500 hover:bg-amber-400 shadow-sm" title="Edit task">✏</button>
          <button onclick="del('${task.id}')" class="bg-rose-600 hover:bg-rose-500 shadow-sm" title="Delete task">🗑</button>
        </div>
      </div>
    `;
  });
}

// ================= SEARCH =================
search.oninput = () => {
  const q = search.value.toLowerCase();
  const filtered = tasks.filter(t => t.title.toLowerCase().includes(q));
  render(filtered);
};

// ================= STATS =================
function stats() {
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.done).length;

  total.innerText = totalCount;
  done.innerText = completedCount;
  pending.innerText = totalCount - completedCount;
}

// ================= CLEAR =================
function clear() {
  title.value = "";
  date.value = "";
  desc.value = "";

  editTaskId = null;
  addBtn.innerText = "➕ Add Task";

  if (inputCard) {
    inputCard.classList.add("collapsed-note");
    title.placeholder = "Add the Task";
  }
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
  div.className = "toast shadow-xl";
  if (type === "error") {
    div.style.borderLeftColor = "#ef4444";
  }
  div.innerText = msg;

  toastBox.appendChild(div);

  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transform = 'translateY(10px)';
    div.style.transition = 'all 0.2s ease';
    setTimeout(() => div.remove(), 200);
  }, 2000);
}

// ================= COLLAPSIBLE FORM TOGGLE =================
if (collapseMainBtn) {
  collapseMainBtn.onclick = () => {
    const mainElement = document.querySelector(".main");
    if (mainElement) {
      mainElement.classList.toggle("collapsed-view");
    }
  };
}

// ================= GOOGLE NOTES EXPAND/COLLAPSE ENGINE =================
if (inputCard && title) {
  inputCard.onclick = () => {
    if (inputCard.classList.contains("collapsed-note")) {
      inputCard.classList.remove("collapsed-note");
      title.placeholder = "What needs to be done?";
      title.focus();
    }
  };

  document.addEventListener("click", (e) => {
    if (!inputCard.contains(e.target) && !editTaskId) {
      const titleValue = title.value.trim();
      const descValue = desc.value.trim();
      if (!titleValue && !descValue) {
        inputCard.classList.add("collapsed-note");
        title.placeholder = "Add the Task";
      }
    }
  });
}
