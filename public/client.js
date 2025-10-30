let socket;
const messagesDiv = document.getElementById('messages');
const joinBtn = document.getElementById('join');
const msgInput = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const typingDiv = document.getElementById('typing');
const fileInput = document.getElementById('fileInput');
const imgBtn = document.getElementById('imgBtn');

joinBtn.onclick = () => {
  const username = document.getElementById('username').value || 'Anonyme';
  const room = document.getElementById('room').value || 'general';
  socket = io({ query: { username, room } });
  document.querySelector('header').classList.add('hidden');
  document.getElementById('chat').classList.remove('hidden');

  socket.on('history', (history) => {
    messagesDiv.innerHTML = '';
    history.forEach(addMessage);
  });

  socket.on('message', addMessage);

  socket.on('typing', (d) => {
    typingDiv.textContent = d.typing ? `${d.user} écrit...` : '';
  });
};

msgInput.addEventListener('input', () => {
  socket.emit('typing', msgInput.value.length > 0);
});

sendBtn.onclick = () => {
  if (!msgInput.value) return;
  socket.emit('message', { text: msgInput.value });
  msgInput.value = '';
  socket.emit('typing', false);
};

imgBtn.onclick = () => fileInput.click();

fileInput.onchange = async () => {
  const file = fileInput.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/upload', { method: 'POST', body: formData });
  const { url } = await res.json();
  socket.emit('message', { text: url, type: 'image' });
};

function addMessage(m) {
  const el = document.createElement('div');
  el.className = 'msg';
  el.innerHTML = `<b>${m.user}</b>: ${m.type === 'image' ? `<img src="${m.text}" class="imgMsg"/>` : m.text}`;
  messagesDiv.appendChild(el);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}