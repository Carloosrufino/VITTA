const storage = { get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }, set(key, value) { localStorage.setItem(key, JSON.stringify(value)); } };
let selectedEmotion = '';
const emotionButtons = document.querySelectorAll('.emotion-btn');
const selectedLabel = document.querySelector('#selectedEmotion');
const feedback = document.querySelector('#emotionFeedback');
const lastEmotion = document.querySelector('#lastEmotion');
emotionButtons.forEach((button) => button.addEventListener('click', () => { emotionButtons.forEach((item) => item.classList.remove('active')); button.classList.add('active'); selectedEmotion = button.dataset.emotion; selectedLabel.textContent = `Selecionado: ${selectedEmotion}`; feedback.textContent = ''; }));
function renderLastEmotion() { const record = storage.get('vitta-emotion', null); lastEmotion.innerHTML = record ? `<strong>Último registro:</strong> ${record.emotion} · ${record.date}${record.note ? `<br><span>“${record.note}”</span>` : ''}` : ''; }
document.querySelector('#saveEmotion').addEventListener('click', () => { if (!selectedEmotion) { feedback.textContent = 'Escolha uma emoção antes de salvar.'; return; } const note = document.querySelector('#emotionNote').value.trim(); const record = { emotion: selectedEmotion, note, date: new Date().toLocaleDateString('pt-BR') }; storage.set('vitta-emotion', record); feedback.textContent = 'Registro salvo com carinho neste dispositivo.'; document.querySelector('#emotionNote').value = ''; renderLastEmotion(); });
const appointmentList = document.querySelector('#appointmentList');
function renderAppointments() { const appointments = storage.get('vitta-appointments', []).sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)); appointmentList.innerHTML = appointments.length ? appointments.map((item, index) => `<article class="appointment-item"><div><div class="appointment-date">${new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}${item.time ? ` · ${item.time}` : ''}</div><h4>${item.title}</h4></div><button class="delete-btn" data-index="${index}">Remover</button></article>`).join('') : '<div class="panel-card text-center text-muted">Sua agenda está livre por enquanto.</div>'; document.querySelectorAll('.delete-btn').forEach((button) => button.addEventListener('click', () => { const items = storage.get('vitta-appointments', []); items.splice(Number(button.dataset.index), 1); storage.set('vitta-appointments', items); renderAppointments(); })); }
document.querySelector('#appointmentForm').addEventListener('submit', (event) => { event.preventDefault(); const title = document.querySelector('#appointmentTitle').value.trim(); const date = document.querySelector('#appointmentDate').value; const time = document.querySelector('#appointmentTime').value; const items = storage.get('vitta-appointments', []); items.push({ title, date, time }); storage.set('vitta-appointments', items); event.target.reset(); renderAppointments(); });
document.querySelectorAll('.read-more').forEach((button) => button.addEventListener('click', () => { document.querySelector('#modalTitle').textContent = button.dataset.modalTitle; document.querySelector('#modalText').textContent = button.dataset.modalText; bootstrap.Modal.getOrCreateInstance(document.querySelector('#contentModal')).show(); }));
document.querySelector('#year').textContent = new Date().getFullYear(); renderLastEmotion(); renderAppointments();

// Navegação em sessões: no desktop e no celular apenas uma etapa fica visível por vez.
const sectionGroups = [
  { name: 'Início', hash: 'inicio', elements: Array.from(document.querySelectorAll('main > section')).slice(0, 2) },
  { name: 'Diário de emoções', hash: 'diario', elements: [document.querySelector('#diario')] },
  { name: 'Agenda de cuidado', hash: 'agenda', elements: [document.querySelector('#agenda')] },
  { name: 'Conteúdos', hash: 'conteudos', elements: [document.querySelector('#conteudos')] },
  { name: 'Apoio', hash: 'apoio', elements: [document.querySelector('#apoio')] }
];
let currentSection = 0;
function showSection(index, updateHash = true) {
  currentSection = (index + sectionGroups.length) % sectionGroups.length;
  sectionGroups.forEach((group, groupIndex) => group.elements.forEach((element) => element?.classList.toggle('section-hidden', groupIndex !== currentSection)));
  document.querySelector('#sectionCounter').textContent = `${currentSection + 1} de ${sectionGroups.length}`;
  document.querySelector('#sectionTitle').textContent = sectionGroups[currentSection].name;
  document.querySelector('#prevSection').disabled = currentSection === 0;
  document.querySelector('#prevSection').style.opacity = currentSection === 0 ? '.45' : '1';
  if (updateHash) history.replaceState(null, '', `#${sectionGroups[currentSection].hash}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.querySelector('#menu')?.classList.remove('show');
}
document.querySelector('#nextSection').addEventListener('click', () => showSection(currentSection + 1));
document.querySelector('#prevSection').addEventListener('click', () => showSection(currentSection - 1));
window.nextVittaSection = () => showSection(currentSection + 1);
window.previousVittaSection = () => showSection(currentSection - 1);
document.querySelectorAll('.nav-link, .navbar-brand, .btn[href^="#"]').forEach((link) => link.addEventListener('click', (event) => { const hash = link.getAttribute('href')?.slice(1); const target = sectionGroups.findIndex((group) => group.hash === hash); if (target >= 0) { event.preventDefault(); showSection(target); } }));
const initialHash = window.location.hash.slice(1); const initialSection = sectionGroups.findIndex((group) => group.hash === initialHash); showSection(initialSection >= 0 ? initialSection : 0, false);
window.addEventListener('hashchange', () => { const target = sectionGroups.findIndex((group) => group.hash === window.location.hash.slice(1)); if (target >= 0 && target !== currentSection) showSection(target, false); });

// Calendário mensal da agenda.
renderAppointments = function renderCalendarAgenda() {
  const appointments = storage.get('vitta-appointments', []);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const start = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((start + daysInMonth) / 7) * 7;
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const eventDays = new Set(appointments.filter((item) => item.date).map((item) => item.date));
  let calendarDays = '';
  for (let cell = 0; cell < totalCells; cell += 1) {
    let day = cell - start + 1;
    let muted = false;
    let dateKey = '';
    if (day < 1) { day = previousMonthDays + day; muted = true; }
    else if (day > daysInMonth) { day -= daysInMonth; muted = true; }
    else dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = !muted && day === now.getDate();
    calendarDays += `<div class="calendar-day${muted ? ' muted' : ''}${today ? ' today' : ''}${eventDays.has(dateKey) ? ' has-event' : ''}">${day}</div>`;
  }
  const items = [...appointments].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const itemMarkup = items.length ? items.map((item, index) => `<article class="appointment-item"><div><div class="appointment-date">${new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}${item.time ? ` · ${item.time}` : ''}</div><h4>${item.title}</h4></div><button class="delete-btn" data-index="${index}">Remover</button></article>`).join('') : '<p class="text-muted small mb-0">Nenhum compromisso cadastrado neste mês.</p>';
  appointmentList.innerHTML = `<div class="calendar-card"><div class="calendar-header"><div><h3>${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h3><p class="calendar-caption">Organize seus momentos de cuidado</p></div><span class="icon-bubble lilac">□</span></div><div class="calendar-weekdays"><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div><div>Dom</div></div><div class="calendar-grid">${calendarDays}</div><div class="calendar-legend"><span></span> Dia com compromisso</div></div><h4 class="agenda-items-title">Próximos lembretes</h4><div class="appointment-list">${itemMarkup}</div>`;
  appointmentList.querySelectorAll('.delete-btn').forEach((button) => button.addEventListener('click', () => { const current = storage.get('vitta-appointments', []); current.splice(Number(button.dataset.index), 1); storage.set('vitta-appointments', current); renderAppointments(); }));
};
renderAppointments();
