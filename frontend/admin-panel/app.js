// frontend/admin-panel/app.js
const API = '/api';
const user = JSON.parse(localStorage.getItem('user'));
const headers = { 'Content-Type': 'application/json', 'x-user-id': user.id, 'x-user-role': user.role };

if (!user || user.role !== 'ADMIN') window.location.href = '/login/index.html';

// ===============================
// FECHA DE LIMA - FUNCIÓN CORREGIDA
// ===============================
const getFechaLima = () => {
    const ahora = new Date();

    const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

    return formatter.format(ahora);
};

// Establecer fecha inicial del filtro
document.getElementById('filterFecha').value = getFechaLima();

const getFecha = () => document.getElementById('filterFecha').value;

console.log('Fecha filtro admin (Lima):', getFecha());

// ===============================
// NAVEGACIÓN
// ===============================
const showSection = (id) => {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(`sec-${id}`).style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-${id}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (id === 'mensajes') loadChatData();
};

const loadAll = () => {
    loadMetrics();
    loadUsers();
    loadConfig();
    loadAsistencia();
};

// ===============================
// UTILIDADES GLOBALES
// ===============================
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-PE', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Lima'
    });
};

const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Comparar solo la fecha (sin hora) en zona Lima
    const todayStr = today.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
    const msgDateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

    if (msgDateStr === todayStr) return 'Hoy';
    if (msgDateStr === yesterdayStr) return 'Ayer';
    return d.toLocaleDateString('es-PE', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        timeZone: 'America/Lima'
    });
};

// ===============================
// MÉTRICAS
// ===============================
const loadMetrics = async () => {
    const [metricsRes, usersRes] = await Promise.all([
        fetch(`${API}/servicios/metrics?fecha=${getFecha()}`, { headers }),
        fetch(`${API}/users`, { headers })
    ]);

    const data = await metricsRes.json();
    const users = await usersRes.json();
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));

    document.getElementById('metricsContent').innerHTML = `
        <div class="metric-card"><h4>Ingresos</h4><p>S/.${data.totalIngresos}</p></div>
        <div class="metric-card"><h4>Costos</h4><p>S/.${data.totalCostos}</p></div>
        <div class="metric-card"><h4>Utilidad</h4><p>S/.${data.utilidad}</p></div>
        <div class="metric-card"><h4>Servicios</h4><p>${data.totalServicios}</p></div>
    `;

    document.getElementById('techMetrics').innerHTML = Object.entries(data.serviciosPorTecnico || {})
        .sort((a, b) => b[1].utilidad - a[1].utilidad)
        .map(([id, val], index) => {
            const nombre = userMap[id] || 'Desconocido';
            return `
                <li class="tech-card">
                    <div class="tech-rank">#${index + 1}</div>
                    <div class="tech-info">
                        <span class="tech-name">${nombre}</span>
                        <span class="tech-services">${val.count} servicios</span>
                    </div>
                    <div class="tech-profit">S/.${val.utilidad}</div>
                </li>`;
        })
        .join('');
};

// ===============================
// USUARIOS / TÉCNICOS
// ===============================
const loadUsers = async () => {
    const res = await fetch(`${API}/users`, { headers });
    const users = await res.json();
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = users.filter(u => u.role === 'TECNICO').map(u => `
        <tr>
            <td>${u.nombre}</td><td>${u.usuario}</td>
            <td>${u.horarioEntrada} - ${u.horarioSalida}</td>
            <td><button class="btn-table" onclick="deleteUser('${u.id}')"><i class="bi bi-trash3"></i></button></td>
        </tr>
    `).join('');
};

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        nombre: document.getElementById('u-nombre').value,
        usuario: document.getElementById('u-usuario').value,
        password: document.getElementById('u-password').value,
        role: 'TECNICO',
        horarioEntrada: document.getElementById('u-entrada').value,
        horarioSalida: document.getElementById('u-salida').value,
        diasDescanso: []
    };
    await fetch(`${API}/users`, { method: 'POST', headers, body: JSON.stringify(body) });
    e.target.reset();
    loadUsers();
});

const deleteUser = async (id) => {
    if (confirm('¿Eliminar técnico?')) {
        await fetch(`${API}/users/${id}`, { method: 'DELETE', headers });
        loadUsers();
    }
};

// ===============================
// CONFIGURACIÓN
// ===============================
const loadConfig = async () => {
    const res = await fetch(`${API}/config`, { headers });
    const c = await res.json();
    document.getElementById('c-vh').value = c.vh;
    document.getElementById('c-cf').value = c.cf;
    document.getElementById('c-margen').value = c.margen;
    document.getElementById('c-riesgo').value = c.riesgo;
    document.getElementById('c-garantia').value = c.garantia;
};

document.getElementById('configForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
        vh: parseFloat(document.getElementById('c-vh').value),
        cf: parseFloat(document.getElementById('c-cf').value),
        margen: parseFloat(document.getElementById('c-margen').value),
        riesgo: parseFloat(document.getElementById('c-riesgo').value),
        garantia: parseFloat(document.getElementById('c-garantia').value)
    };
    await fetch(`${API}/config`, { method: 'PUT', headers, body: JSON.stringify(body) });
    alert('Configuración guardada');
});

// ===============================
// ASISTENCIA
// ===============================
const loadAsistencia = async () => {
    const [asistRes, usersRes] = await Promise.all([
        fetch(`${API}/asistencia?fecha=${getFecha()}`, { headers }),
        fetch(`${API}/users`, { headers })
    ]);

    const asistencias = await asistRes.json();
    const users = await usersRes.json();
    const userMap = Object.fromEntries(users.map(u => [u.id, u.nombre]));

    const tbody = document.querySelector('#asistenciaTable tbody');
    tbody.innerHTML = asistencias.map(a => `
        <tr>
            <td>${userMap[a.usuarioId] || a.usuarioId}</td>
            <td>${a.horaEntrada}</td>
            <td>${a.horaSalida || '-'}</td>
            <td style="color:#ff0050; font-size:0.8rem;">${(a.alertas || []).join(', ') || '-'}</td>
        </tr>
    `).join('');
};

// ===============================
// CHAT BILATERAL
// ===============================
let allMessages = [];
let allUsers = [];
let userMap = {};
let activeChatContact = null;
let chatPollingInterval = null;

const loadChatData = async () => {
    const [msgsRes, usersRes] = await Promise.all([
        fetch(`${API}/mensajes`, { headers }),
        fetch(`${API}/users`, { headers })
    ]);

    allMessages = await msgsRes.json();
    allUsers = await usersRes.json();
    userMap = Object.fromEntries(allUsers.map(u => [u.id, u.nombre]));

    renderChatContacts();
    updateNavBadge();

    if (chatPollingInterval) clearInterval(chatPollingInterval);
    chatPollingInterval = setInterval(pollNewMessages, 4000);
};

const pollNewMessages = async () => {
    try {
        const res = await fetch(`${API}/mensajes`, { headers });
        const fresh = await res.json();
        const changed = JSON.stringify(fresh) !== JSON.stringify(allMessages);

        if (changed) {
            allMessages = fresh;
            renderChatContacts();
            if (activeChatContact) renderChatMessages(activeChatContact);
            updateNavBadge();
        }
    } catch (_) { }
};

const getConversations = () => {
    const map = {};

    allMessages.forEach(msg => {
        let otherId = null;

        if (msg.para && msg.de === user.id) {
            otherId = msg.para;
        } else if (msg.para && msg.de !== user.id && msg.para === user.id) {
            otherId = msg.de;
        } else if (!msg.para && msg.de !== user.id) {
            otherId = msg.de;
        }

        if (!otherId) return;

        const otherUser = allUsers.find(u => u.id === otherId);
        if (!otherUser || otherUser.role !== 'TECNICO') return;

        if (!map[otherId]) {
            map[otherId] = {
                userId: otherId,
                nombre: userMap[otherId] || 'Desconocido',
                messages: [],
                unread: 0,
                lastMessage: null
            };
        }

        map[otherId].messages.push(msg);

        if (msg.de !== user.id && !msg.leido) {
            map[otherId].unread++;
        }

        const last = map[otherId].lastMessage;
        if (!last || new Date(msg.fechaRegistro) > new Date(last.fechaRegistro)) {
            map[otherId].lastMessage = msg;
        }
    });

    return Object.values(map).sort((a, b) => {
        if (a.unread > 0 && b.unread === 0) return -1;
        if (a.unread === 0 && b.unread > 0) return 1;
        const tA = a.lastMessage ? new Date(a.lastMessage.fechaRegistro).getTime() : 0;
        const tB = b.lastMessage ? new Date(b.lastMessage.fechaRegistro).getTime() : 0;
        return tB - tA;
    });
};

const renderChatContacts = () => {
    const conversations = getConversations();
    const container = document.getElementById('chatContacts');

    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="chat-contacts-empty">
                <i class="bi bi-chat-square"></i>
                <span>No hay conversaciones aún</span>
                <small>Los mensajes de los técnicos aparecerán aquí</small>
            </div>`;
        return;
    }

    container.innerHTML = conversations.map(conv => {
        const isActive = activeChatContact === conv.userId;
        const last = conv.lastMessage;
        const senderLabel = last && last.de === user.id ? 'Tú: ' : '';
        const preview = last ? senderLabel + last.contenido : '';
        const time = last ? formatTime(last.fechaRegistro) : '';

        return `
            <div class="chat-contact ${isActive ? 'active' : ''}"
                 onclick="selectChatContact('${conv.userId}')">
                <div class="chat-contact-avatar">${getInitials(conv.nombre)}</div>
                <div class="chat-contact-info">
                    <div class="chat-contact-name">${escapeHtml(conv.nombre)}</div>
                    <div class="chat-contact-preview">${escapeHtml(preview)}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                    <span class="chat-contact-time">${time}</span>
                    ${conv.unread > 0 ? `<span class="chat-badge">${conv.unread > 9 ? '9+' : conv.unread}</span>` : ''}
                </div>
            </div>`;
    }).join('');
};

const selectChatContact = async (contactId) => {
    activeChatContact = contactId;
    renderChatContacts();

    document.getElementById('chatSidebar').classList.remove('hidden-mobile');
    document.getElementById('chatMain').classList.remove('hidden-mobile');
    document.getElementById('chatEmptyState').style.display = 'none';
    document.getElementById('chatMainHeader').style.display = 'flex';
    document.getElementById('chatMessages').style.display = 'flex';
    document.getElementById('chatInputArea').style.display = 'flex';

    if (window.innerWidth <= 768) {
        document.getElementById('chatSidebar').classList.add('hidden-mobile');
    }

    const contactName = userMap[contactId] || 'Desconocido';
    document.getElementById('chatHeaderName').textContent = contactName;
    document.getElementById('chatHeaderAvatar').textContent = getInitials(contactName);
    document.getElementById('chatHeaderAvatar').className = 'chat-contact-avatar';
    document.getElementById('chatHeaderStatus').textContent = 'Técnico';

    renderChatMessages(contactId);
    await markConversationAsRead(contactId);
    setTimeout(() => document.getElementById('chatInput').focus(), 100);
};

const renderChatMessages = (contactId) => {
    const conversations = getConversations();
    const conv = conversations.find(c => c.userId === contactId);
    const container = document.getElementById('chatMessages');

    if (!conv || conv.messages.length === 0) {
        container.innerHTML = `
            <div class="chat-messages-empty">
                <i class="bi bi-chat-left"></i>
                <span>Sin mensajes aún</span>
            </div>`;
        return;
    }

    const sorted = [...conv.messages].sort((a, b) =>
        new Date(a.fechaRegistro) - new Date(b.fechaRegistro)
    );

    let html = '';
    let lastDate = '';

    sorted.forEach(msg => {
        const msgDate = new Date(msg.fechaRegistro).toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

        if (msgDate !== lastDate) {
            lastDate = msgDate;
            html += `<div class="chat-date-separator"><span>${formatDateSeparator(msg.fechaRegistro)}</span></div>`;
        }

        const isSent = msg.de === user.id;
        const senderName = isSent ? 'Tú' : (userMap[msg.de] || 'Desconocido');

        html += `
            <div class="chat-bubble ${isSent ? 'sent' : 'received'}">
                <small style="font-weight:600;font-size:0.7rem;
                    color:${isSent ? 'rgba(0,255,163,0.7)' : 'rgba(255,255,255,0.45)'};
                    display:block;margin-bottom:3px;">
                    ${escapeHtml(senderName)}
                </small>
                ${escapeHtml(msg.contenido)}
                <span class="chat-bubble-time">${formatTime(msg.fechaRegistro)}</span>
            </div>`;
    });

    container.innerHTML = html;
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
};

const markConversationAsRead = async (contactId) => {
    const unread = allMessages.filter(m => m.de === contactId && !m.leido);

    if (unread.length === 0) return;

    for (const m of unread) {
        try {
            await fetch(`${API}/mensajes/${m.id}/leido`, {
                method: 'PUT',
                headers
            });
            m.leido = true;
        } catch (err) {
            console.error('Error marcando leído:', m.id, err);
        }
    }

    allMessages = allMessages.map(m =>
        (m.de === contactId && m.de !== user.id && !m.leido) ? { ...m, leido: true } : m
    );

    renderChatContacts();
    updateNavBadge();
};

const enviarMensajeChat = async () => {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();

    if (!text || !activeChatContact) return;

    const body = {
        de: user.id,
        para: activeChatContact,
        contenido: text
    };

    try {
        const res = await fetch(`${API}/mensajes`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (res.ok) {
            input.value = '';
            autoResizeTextarea(input);
            document.getElementById('chatSendBtn').disabled = true;

            const newMsg = await res.json();
            allMessages.push(newMsg);
            renderChatContacts();
            renderChatMessages(activeChatContact);
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Error al enviar mensaje');
        }
    } catch (e) {
        alert('Error de conexión al enviar');
        console.error(e);
    }
};

const handleChatKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensajeChat();
    }
};

const closeChatMobile = () => {
    activeChatContact = null;
    document.getElementById('chatMain').classList.add('hidden-mobile');
    document.getElementById('chatSidebar').classList.remove('hidden-mobile');
    renderChatContacts();
};

const updateNavBadge = () => {
    const total = allMessages.filter(m => m.de !== user.id && !m.leido).length;
    const badge = document.getElementById('navUnreadBadge');

    if (total > 0) {
        badge.style.display = 'flex';
        badge.textContent = total > 9 ? '9+' : total;
    } else {
        badge.style.display = 'none';
    }
};

const autoResizeTextarea = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
};

document.getElementById('chatInput').addEventListener('input', function () {
    document.getElementById('chatSendBtn').disabled = !this.value.trim();
    autoResizeTextarea(this);
});

// ===============================
// BACKUP / RESTORE DATABASE
// ===============================
const descargarBackup = async () => {
    try {
        const res = await fetch(`${API}/backup/export`, { headers });
        const data = await res.json();

        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            { type: 'application/json' }
        );

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${getFechaLima()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error al descargar backup');
        console.error(error);
    }
};

const subirBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!confirm('Esto reemplazará toda la base de datos actual. ¿Continuar?')) {
        event.target.value = '';
        return;
    }

    try {
        const text = await file.text();
        const backupData = JSON.parse(text);

        await fetch(`${API}/backup/import`, {
            method: 'POST',
            headers,
            body: JSON.stringify(backupData)
        });

        alert('Backup restaurado correctamente');
        loadAll();
        event.target.value = '';
    } catch (error) {
        alert('Archivo inválido o error al restaurar');
        console.error(error);
    }
};

// ===============================
// LOGOUT
// ===============================
const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login/index.html';
};

// Limpiar polling al cerrar
window.addEventListener('beforeunload', () => {
    if (chatPollingInterval) clearInterval(chatPollingInterval);
});

// ===============================
// INICIO
// ===============================
loadAll();