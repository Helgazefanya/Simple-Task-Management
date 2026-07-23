"use client";
import { useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  assignee: User;
}

export default function Home() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Todo");
  const [deadline, setDeadline] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const getAuthHeaders = (customToken?: string) => ({
    Authorization: `Bearer ${customToken || token}`,
    "Content-Type": "application/json",
  });

  // --- Fungsi Autentikasi ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        const newToken = data.access_token;
        setToken(newToken);
        await fetchData(newToken);
      } else {
        setError(data.detail || "Login gagal. Cek username/password.");
      }
    } catch (err) {
      setError("Tidak dapat terhubung ke server backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setTasks([]);
    setUsers([]);
    resetForm();
  };

  // --- Ambil Data dari API ---
  const fetchData = async (authToken: string) => {
    try {
      const [taskRes, userRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/api/tasks", {
          headers: getAuthHeaders(authToken),
        }),
        fetch("http://127.0.0.1:8000/api/users", {
          headers: getAuthHeaders(authToken),
        }),
      ]);

      if (taskRes.ok) setTasks(await taskRes.json());
      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(userData);
        if (userData.length > 0 && !assigneeId) setAssigneeId(userData[0].id);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    }
  };

  // --- Reset Form ---
  const resetForm = () => {
    setEditingTaskId(null);
    setTitle("");
    setDescription("");
    setStatus("Todo");
    setDeadline("");
    if (users.length > 0) setAssigneeId(users[0].id);
  };

  // --- Tambah / Edit Task (Submit Form) ---
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadline) {
      alert("Tentukan deadline task.");
      return;
    }

    const payload = {
      title,
      description,
      status,
      deadline: new Date(deadline).toISOString(),
      assignee_id: assigneeId,
    };

    try {
      const url = editingTaskId
        ? `http://127.0.0.1:8000/api/tasks/${editingTaskId}`
        : "http://127.0.0.1:8000/api/tasks";
      const method = editingTaskId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        fetchData(token);
      } else {
        const errData = await res.json();
        alert("Gagal menyimpan task: " + JSON.stringify(errData));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Masuk ke Mode Edit ---
  const handleEditClick = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    // Format tanggal untuk input datetime-local (YYYY-MM-DDTHH:mm)
    const formattedDate = new Date(task.deadline).toISOString().slice(0, 16);
    setDeadline(formattedDate);
    if (task.assignee) setAssigneeId(task.assignee.id);
    // Scroll ke atas menuju form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Ubah Status Langsung dari Kartu Task ---
  const handleQuickStatusChange = async (task: Task, newStatus: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/tasks/${task.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: task.title,
          description: task.description,
          status: newStatus,
          deadline: task.deadline,
          assignee_id: task.assignee?.id || assigneeId,
        }),
      });
      if (res.ok) fetchData(token);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Hapus Task ---
  const handleDeleteTask = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus task ini?")) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/tasks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        if (editingTaskId === id) resetForm();
        fetchData(token);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= TAMPILAN LOGIN =================
  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <form
          onSubmit={handleLogin}
          className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-slate-100"
        >
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 text-center">
            Task Management
          </h1>
          <p className="text-slate-500 mb-8 text-center text-sm">
            Silakan masuk untuk mengelola tugas Anda
          </p>
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-slate-700 text-sm font-semibold mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-md"
          >
            {isLoading ? "Memproses..." : "Login"}
          </button>
        </form>
      </main>
    );
  }

  // ================= TAMPILAN DASHBOARD =================
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Task Management Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Kelola tugas, status, dan penanggung jawab dengan mudah.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-red-100 transition text-sm self-start sm:self-center"
          >
            Logout
          </button>
        </header>

        {/* --- Form Tambah / Edit Task --- */}
        <section
          className={`p-6 md:p-8 rounded-2xl shadow-sm mb-8 border transition ${
            editingTaskId
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-slate-100"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              {editingTaskId ? "✏️ Edit Task" : "➕ Tambah Task Baru"}
            </h2>
            {editingTaskId && (
              <button
                onClick={resetForm}
                className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-300 transition"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSaveTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-slate-700 text-sm font-semibold mb-2">
                Judul Task
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Masukkan judul task..."
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-700 text-sm font-semibold mb-2">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none bg-white"
                placeholder="Deskripsi singkat tugas..."
              />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-semibold mb-2">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-semibold mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-700 text-sm font-semibold mb-2">
                Assignee (Penanggung Jawab)
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 pt-2 flex gap-3">
              <button
                type="submit"
                className={`w-full text-white py-3.5 rounded-xl font-bold transition shadow-md ${
                  editingTaskId
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {editingTaskId ? "Simpan Perubahan" : "Simpan Task Baru"}
              </button>
            </div>
          </form>
        </section>

        {/* --- Daftar Task --- */}
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Daftar Task</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-6 rounded-2xl shadow-sm border flex flex-col justify-between transition ${
                editingTaskId === task.id
                  ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-400"
                  : "bg-white border-slate-100"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>
                  
                  {/* Dropdown Ubah Status Cepat */}
                  <select
                    value={task.status}
                    onChange={(e) => handleQuickStatusChange(task, e.target.value)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none transition ${
                      task.status === "Done"
                        ? "bg-teal-50 text-teal-700 border-teal-200"
                        : task.status === "In Progress"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <p className="text-slate-600 text-sm mb-4 whitespace-pre-wrap">
                  {task.description || "Tidak ada deskripsi"}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <p>📅 {new Date(task.deadline).toLocaleString()}</p>
                  <p className="mt-1">
                    👤 <span className="font-medium text-slate-700">{task.assignee?.username}</span>
                  </p>
                </div>
                
                {/* Tombol Aksi: Edit & Hapus */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(task)}
                    className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-100 transition border border-amber-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition border border-red-100"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-10 bg-white rounded-2xl border border-slate-100">
              Belum ada task yang tersedia.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}