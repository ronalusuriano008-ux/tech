// frontend/registro-servicios/app.js
const API = 'https://api.vixbox.xyz/api';

const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
    window.location.href = '/login/index.html';
}

const headers = {
    'Content-Type': 'application/json',
    'x-user-id': user.id,
    'x-user-role': user.role
};

document.getElementById('userName').textContent =
    `BIENVENIDO, ${user.nombre}.`;

document.getElementById('filterFecha').value = new Date()
    .toLocaleDateString('en-CA', {
        timeZone: 'America/Lima'
    });

const getFecha = () =>
    document.getElementById('filterFecha').value;

// ===============================
// UTILIDADES
// ===============================
const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
};

const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Hoy';
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
};

const autoResizeTextarea = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 90) + 'px';
};

// ===============================
// SERVICIOS
// ===============================
const loadServicios = async () => {
    const res = await fetch(`${API}/servicios?fecha=${getFecha()}`, { headers });
    const servicios = await res.json();

    const tbody = document.querySelector('#serviciosTable tbody');
    tbody.innerHTML = servicios.map(s => `
        <tr>
            <td>${s.hora || new Date(s.fechaRegistro).toLocaleTimeString()}</td>
            <td>${s.servicio}</td>
            <td>${s.modelo}</td>
            <td>S/.${s.precio.toFixed(2)}</td>
            <td>S/.${s.costo.toFixed(2)}</td>
            <td>S/.${s.utilidad.toFixed(2)}</td>
            <td>
                <button class="btn-table" onclick="deleteServicio('${s.id}')">
                    <i class="bi bi-trash3"></i>
                </button>
            </td>
        </tr>
    `).join('');

    const ing = servicios.reduce((s, i) => s + i.precio, 0);
    const cos = servicios.reduce((s, i) => s + i.costo, 0);
    document.getElementById('resIngresos').textContent = `S/.${ing.toFixed(2)}`;
    document.getElementById('resCostos').textContent = `S/.${cos.toFixed(2)}`;
    document.getElementById('resUtilidad').textContent = `S/.${(ing - cos).toFixed(2)}`;
};

document.getElementById('servicioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const precio = parseFloat(document.getElementById('s-precio').value);
    const costo = parseFloat(document.getElementById('s-costo').value);

    const body = {
        servicio: document.getElementById('s-servicio').value,
        modelo: document.getElementById('s-modelo').value,
        precio,
        costo,
        utilidad: Math.round((precio - costo) * 100) / 100,
        fecha: getFecha()
    };

    await fetch(`${API}/servicios`, { method: 'POST', headers, body: JSON.stringify(body) });
    e.target.reset();
    loadServicios();
});

const deleteServicio = async (id) => {
    if (confirm('¿Eliminar este servicio?')) {
        await fetch(`${API}/servicios/${id}`, { method: 'DELETE', headers });
        loadServicios();
    }
};

// ===============================
// ASISTENCIA
// ===============================
const loadAsistenciaStatus = async () => {
    const res = await fetch(`${API}/asistencia?fecha=${getFecha()}`, { headers });
    const asist = await res.json();
    const el = document.getElementById('asistenciaStatus');
    const hoy = asist.find(a => a.usuarioId === user.id);

    if (hoy) {
        el.innerHTML = `<span style="color:green"><i class="bi bi-clock-history"></i> ${hoy.horaEntrada} - ${hoy.horaSalida || 'Pendiente'}</span>`;
        if (hoy.alertas) el.innerHTML += ` <span style="color:red">(!) ${hoy.alertas.join(', ')}</span>`;
    } else {
        el.innerHTML = `<span style="color:gray"><i class="bi bi-dash-circle"></i> Sin registrar</span>`;
    }
};

const checkIn = async () => {
    try {
        const res = await fetch(`${API}/asistencia/check-in`, { method: 'POST', headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error en check-in');
        loadAsistenciaStatus();
    } catch (error) {
        alert(error.message);
    }
};

const checkOut = async () => {
    try {
        const res = await fetch(`${API}/asistencia/check-out`, { method: 'POST', headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error en check-out');
        loadAsistenciaStatus();
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ===============================
// REPORTE
// ===============================
const descargarReporte = async () => {
    try {
        const btnReporte = document.querySelector('[onclick="descargarReporte()"]');
        const textoOriginal = btnReporte.innerHTML;
        btnReporte.innerHTML = '<i class="bi bi-hourglass-split"></i> Generando...';
        btnReporte.disabled = true;

        const res = await fetch(`${API}/reportes/diario`, { headers });
        if (!res.ok) throw new Error('Error al generar reporte');
        const data = await res.json();

        const container = document.getElementById('reporte-render-container');

        let serviciosHTML = data.servicios.map(s => `
            <tr>
                <td>${s.hora || '--:--'}</td>
                <td>${s.servicio} (${s.modelo})</td>
                <td style="text-align:right">S/.${s.precio.toFixed(2)}</td>
                <td style="text-align:right">S/.${s.costo.toFixed(2)}</td>
                <td style="text-align:right">S/.${s.utilidad.toFixed(2)}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="report-img-wrapper" style="background:#ffffff; color:#000000; padding:20px; font-family:Arial;">
                <h2 style="color:#000000;">
                    <i class="bi bi-file-earmark-text"></i> Reporte Diario
                </h2>
                <div class="report-img-header" style="display:flex; justify-content:space-between; color:#000000;">
                    <div><span>Técnico:</span><br><strong>${data.tecnico.toUpperCase()}</strong></div>
                    <div style="text-align:right"><span>Fecha:</span><br><strong>${data.fecha}</strong></div>
                </div>
                <table class="report-img-table" style="width:100%; border-collapse:collapse; margin-top:10px;">
                    <thead>
                        <tr style="background:#ffffff; color:#000000;">
                            <th style="border:1px solid #000000; padding:8px;">Hora</th>
                            <th style="border:1px solid #000000; padding:8px;">Servicio</th>
                            <th style="border:1px solid #000000; padding:8px;">Precio</th>
                            <th style="border:1px solid #000000; padding:8px;">Costo</th>
                            <th style="border:1px solid #000000; padding:8px;">Utilidad</th>
                        </tr>
                    </thead>
                    <tbody>${serviciosHTML}</tbody>
                </table>
                <div class="report-img-totals" style="margin-top:15px; color:#000000;">
                    <div class="report-img-row" style="display:flex; justify-content:space-between;">
                        <span>Ingresos (${data.cantidadServicios} srv):</span>
                        <span style="color:#000000; font-weight:bold;">S/.${data.totalIngresos.toFixed(2)}</span>
                    </div>
                    <div class="report-img-row" style="display:flex; justify-content:space-between;">
                        <span>Costos:</span>
                        <span style="color:#000000; font-weight:bold;">S/.${data.totalCostos.toFixed(2)}</span>
                    </div>
                    <div class="report-img-row report-img-total-final" style="display:flex; justify-content:space-between; font-size:18px;">
                        <span>Utilidad:</span>
                        <span style="color:#000000; font-weight:bold;">S/.${data.utilidadTotal.toFixed(2)}</span>
                    </div>
                    <div class="report-img-row" style="display:flex; justify-content:space-between;">
                        <span>Distribucion de utilidad:</span>
                        <span style="color:#000000; font-weight:bold;">S/.${(data.utilidadTotal / 2).toFixed(2)}</span>
                    </div>
                </div>
            </div>`;

        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(
            container.querySelector('.report-img-wrapper'),
            {
                backgroundColor: '#ffffff',
                scale: 3,
                useCORS: true
            }
        );

        const link = document.createElement('a');
        link.download = `reporte_${data.fecha}_${data.tecnico.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        container.innerHTML = '';
        btnReporte.innerHTML = textoOriginal;
        btnReporte.disabled = false;

    } catch (error) {
        alert('Error al generar imagen: ' + error.message);
    }
};

// ===============================
// CHAT BILATERAL CON ADMIN
// ===============================
let chatMessages = [];
let adminId = null;
let chatPollingInterval = null;

const initChat = async () => {
    try {
        const res = await fetch(`${API}/users/admin-info`, { headers });

        if (res.ok) {
            const adminData = await res.json();
            adminId = adminData.id;
            document.getElementById('chatAdminName').textContent = adminData.nombre;
            document.getElementById('chatAdminAvatar').textContent =
                adminData.nombre.split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase();
        }

        await loadChatMessages();

        if (chatPollingInterval) clearInterval(chatPollingInterval);
        chatPollingInterval = setInterval(pollChatMessages, 5000);

    } catch (e) {
        console.error('Error iniciando chat:', e);
        document.getElementById('chatMessages').innerHTML = `
            <div class="chat-thread-empty">
                <i class="bi bi-wifi-off"></i>
                <span>Error de conexión</span>
            </div>`;
    }
};

const loadChatMessages = async () => {
    try {
        const res = await fetch(`${API}/mensajes`, { headers });
        chatMessages = await res.json();
        renderChatBubbles();
        markAdminMessagesAsRead();
        updateChatFab();
    } catch (e) {
        console.error('Error cargando mensajes:', e);
    }
};

const pollChatMessages = async () => {
    try {
        const res = await fetch(`${API}/mensajes`, { headers });
        const fresh = await res.json();
        const changed = JSON.stringify(fresh) !== JSON.stringify(chatMessages);

        if (changed) {
            const prevUnread = chatMessages.filter(m => m.de !== user.id && !m.leido).length;
            chatMessages = fresh;
            renderChatBubbles();
            markAdminMessagesAsRead();
            updateChatFab();

            if (chatMessages.filter(m => m.de !== user.id && !m.leido).length > prevUnread) {
                flashChatHeader();
            }
        }
    } catch (_) {}
};

const renderChatBubbles = () => {
    const container = document.getElementById('chatMessages');

    if (chatMessages.length === 0) {
        container.innerHTML = `
            <div class="chat-thread-empty">
                <i class="bi bi-chat-dots"></i>
                <span>Aún no hay mensajes</span>
            </div>`;
        return;
    }

    const sorted = [...chatMessages].sort((a, b) =>
        new Date(a.fechaRegistro) - new Date(b.fechaRegistro)
    );

    let html = '';
    let lastDate = '';

    sorted.forEach(msg => {
        const msgDate = new Date(msg.fechaRegistro).toDateString();

        if (msgDate !== lastDate) {
            lastDate = msgDate;
            html += `<div class="chat-date-sep"><span>${formatDateSeparator(msg.fechaRegistro)}</span></div>`;
        }

        const isSent = msg.de === user.id;
        const senderName = isSent ? 'Tú' : 'Administrador';

        html += `
            <div class="chat-bubble ${isSent ? 'sent' : 'received'}">
                <span class="chat-bubble-sender">${escapeHtml(senderName)}</span>
                ${escapeHtml(msg.contenido)}
                <span class="chat-bubble-time">${formatTime(msg.fechaRegistro)}</span>
            </div>`;
    });

    container.innerHTML = html;

    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });
};

const markAdminMessagesAsRead = async () => {
    const unread = chatMessages.filter(m => m.de !== user.id && !m.leido);
    if (unread.length === 0) return;

    chatMessages = chatMessages.map(m =>
        (m.de !== user.id && !m.leido) ? { ...m, leido: true } : m
    );
    updateChatFab();

    await Promise.all(
        unread.map(m =>
            fetch(`${API}/mensajes/${m.id}/leido`, { method: 'PUT', headers }).catch(() => {})
        )
    );
};

const enviarMensajeChat = async () => {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();

    if (!text) return;

    if (!adminId) {
        alert('No se encontró al administrador');
        return;
    }

    const body = {
        de: user.id,
        para: adminId,
        contenido: text
    };

    try {
        const res = await fetch(`${API}/mensajes`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (res.ok) {
            const newMsg = await res.json();
            chatMessages.push(newMsg);

            input.value = '';
            autoResizeTextarea(input);
            document.getElementById('chatSendBtn').disabled = true;

            renderChatBubbles();
            updateChatFab();
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Error al enviar mensaje');
        }
    } catch (e) {
        alert('Error de conexión');
        console.error(e);
    }
};

const handleChatKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensajeChat();
    }
};

const updateChatFab = () => {
    const unread = chatMessages.filter(m => m.de !== user.id && !m.leido).length;
    const fab = document.getElementById('chatFab');
    const count = document.getElementById('chatFabCount');

    if (unread > 0) {
        fab.classList.add('visible');
        count.style.display = 'flex';
        count.textContent = unread > 9 ? '9+' : unread;
    } else {
        fab.classList.remove('visible');
        count.style.display = 'none';
    }
};

const scrollToChat = () => {
    const chatEl = document.getElementById('chatMessages');
    chatEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateChatFab();
};

const flashChatHeader = () => {
    const header = document.querySelector('.chat-thread-header');
    header.style.background = 'rgba(188, 19, 254, 0.15)';
    header.style.transition = 'background 0.3s ease';
    setTimeout(() => {
        header.style.background = 'rgba(0, 243, 255, 0.04)';
    }, 1200);
};

document.getElementById('chatInput').addEventListener('input', function () {
    document.getElementById('chatSendBtn').disabled = !this.value.trim();
    autoResizeTextarea(this);
});

// ===============================
// LOGOUT
// ===============================
const logout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login/index.html';
};

window.addEventListener('beforeunload', () => {
    if (chatPollingInterval) clearInterval(chatPollingInterval);
});

// ===============================
// INICIO
// ===============================
loadServicios();
loadAsistenciaStatus();
initChat();