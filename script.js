const storage = { get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }, set(key, value) { localStorage.setItem(key, JSON.stringify(value)); } };
let authenticatedUser = null;
let selectedEmotion = '';
const emotionButtons = document.querySelectorAll('.emotion-btn');
const selectedLabel = document.querySelector('#selectedEmotion');
const feedback = document.querySelector('#emotionFeedback');
const lastEmotion = document.querySelector('#lastEmotion');
emotionButtons.forEach((button) => button.addEventListener('click', () => { emotionButtons.forEach((item) => item.classList.remove('active')); button.classList.add('active'); selectedEmotion = button.dataset.emotion; selectedLabel.textContent = `Selecionado: ${selectedEmotion}`; feedback.textContent = ''; }));
function renderLastEmotion() { const record = storage.get('vitta-emotion', null); lastEmotion.innerHTML = record ? `<strong>Último registro:</strong> ${record.emotion} · ${record.date}${record.note ? `<br><span>“${record.note}”</span>` : ''}` : ''; }
document.querySelector('#saveEmotion').addEventListener('click', () => { if (!selectedEmotion) { feedback.textContent = 'Escolha uma emoção antes de salvar.'; return; } const note = document.querySelector('#emotionNote').value.trim(); const record = { emotion: selectedEmotion, note, date: new Date().toLocaleDateString('pt-BR') }; storage.set('vitta-emotion', record); feedback.textContent = 'Registro salvo com carinho neste dispositivo.'; document.querySelector('#emotionNote').value = ''; renderLastEmotion(); });
const appointmentList = document.querySelector('#appointmentList');
const foodDiaryForm = document.querySelector('#foodDiaryForm');
const foodDiaryEntries = document.querySelector('#foodDiaryEntries');
const foodDiaryFeedback = document.querySelector('#foodDiaryFeedback');
const foodDiaryStorageNote = document.querySelector('#foodDiaryStorageNote');
const foodMealCategoryLabels = { cafe_da_manha: 'Café da manhã', lanche_da_manha: 'Lanche da manhã', almoco: 'Almoço', lanche_da_tarde: 'Lanche da tarde', jantar: 'Jantar', ceia: 'Ceia', outro: 'Outro momento' };
function escapeFoodText(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
function localDateValue(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function renderFoodDiary() {
  if (!foodDiaryEntries) return;
  const items = storage.get('vitta-food-diary', []).map((item, index) => ({ ...item, originalIndex: index }))
    .sort((a, b) => `${b.date}${b.time || ''}`.localeCompare(`${a.date}${a.time || ''}`));
  foodDiaryStorageNote.textContent = authenticatedUser ? 'Salvo na sua conta' : 'Salvo neste dispositivo';
  foodDiaryEntries.innerHTML = items.length ? items.map((item) => {
    const date = item.date ? new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
    const category = foodMealCategoryLabels[item.category] || 'Outro momento';
    return `<article class="food-diary-entry"><div class="food-diary-entry-meta"><span class="food-meal-tag">${category}</span><time>${date}${item.time ? ` · ${escapeFoodText(String(item.time).slice(0, 5))}` : ''}</time></div><p>${escapeFoodText(item.description).replace(/\n/g, '<br>')}</p><button class="delete-btn food-delete-button" type="button" data-food-index="${item.originalIndex}">Remover</button></article>`;
  }).join('') : '<div class="food-diary-empty">Seus registros aparecerão aqui. Você pode começar quando quiser.</div>';
}
if (document.querySelector('#foodMealDate')) document.querySelector('#foodMealDate').value = localDateValue();
foodDiaryForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const category = document.querySelector('#foodMealCategory').value;
  const description = document.querySelector('#foodDescription').value.trim();
  const date = document.querySelector('#foodMealDate').value;
  const time = document.querySelector('#foodMealTime').value;
  if (!category || !description || !date) return;
  const localKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const record = { category, description, date, time, localKey };
  const items = storage.get('vitta-food-diary', []);
  items.push(record);
  storage.set('vitta-food-diary', items);
  event.target.reset();
  document.querySelector('#foodMealDate').value = localDateValue();
  foodDiaryFeedback.textContent = 'Registro salvo.';
  renderFoodDiary();
  if (authenticatedUser) apiRequest('food-diary.php', { method: 'POST', body: JSON.stringify(record) }).then((data) => {
    const savedItems = storage.get('vitta-food-diary', []);
    const savedRecord = savedItems.find((item) => item.localKey === localKey);
    if (savedRecord) savedRecord.id = data.id;
    storage.set('vitta-food-diary', savedItems);
    renderFoodDiary();
  }).catch((error) => { foodDiaryFeedback.textContent = `${error.message} O registro ficou salvo neste dispositivo.`; });
});
foodDiaryEntries?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-food-index]');
  if (!button) return;
  const items = storage.get('vitta-food-diary', []);
  const index = Number(button.dataset.foodIndex);
  const item = items[index];
  if (!item) return;
  if (authenticatedUser && item.id) {
    try { await apiRequest('food-diary.php', { method: 'DELETE', body: JSON.stringify({ id: item.id }) }); }
    catch (error) { foodDiaryFeedback.textContent = error.message; return; }
  }
  items.splice(index, 1);
  storage.set('vitta-food-diary', items);
  foodDiaryFeedback.textContent = 'Registro removido.';
  renderFoodDiary();
});
renderFoodDiary();
function renderAppointments() { const appointments = storage.get('vitta-appointments', []).sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)); appointmentList.innerHTML = appointments.length ? appointments.map((item, index) => `<article class="appointment-item"><div><div class="appointment-date">${new Date(`${item.date}T12:00:00`).toLocaleDateString('pt-BR', {day:'2-digit', month:'short'})}${item.time ? ` · ${item.time}` : ''}</div><h4>${item.title}</h4></div><button class="delete-btn" data-index="${index}">Remover</button></article>`).join('') : '<div class="panel-card text-center text-muted">Sua agenda está livre por enquanto.</div>'; document.querySelectorAll('.delete-btn').forEach((button) => button.addEventListener('click', () => { const items = storage.get('vitta-appointments', []); items.splice(Number(button.dataset.index), 1); storage.set('vitta-appointments', items); renderAppointments(); })); }
document.querySelector('#appointmentForm').addEventListener('submit', (event) => { event.preventDefault(); const title = document.querySelector('#appointmentTitle').value.trim(); const date = document.querySelector('#appointmentDate').value; const time = document.querySelector('#appointmentTime').value; const items = storage.get('vitta-appointments', []); items.push({ title, date, time }); storage.set('vitta-appointments', items); event.target.reset(); renderAppointments(); });
document.querySelectorAll('.read-more').forEach((button) => button.addEventListener('click', () => { document.querySelector('#modalTitle').textContent = button.dataset.modalTitle; document.querySelector('#modalText').textContent = button.dataset.modalText; bootstrap.Modal.getOrCreateInstance(document.querySelector('#contentModal')).show(); }));
document.querySelector('#year').textContent = new Date().getFullYear(); renderLastEmotion(); renderAppointments();

// Navegação em sessões: no desktop e no celular apenas uma etapa fica visível por vez.
const sectionGroups = [
  { name: 'Início', hash: 'inicio', elements: Array.from(document.querySelectorAll('main > section')).slice(0, 2) },
  { name: 'Diário de emoções', hash: 'diario', elements: [document.querySelector('#diario')] },
  { name: 'Diário alimentar', hash: 'alimentar', elements: [document.querySelector('#alimentar')] },
  { name: 'Agenda de cuidado', hash: 'agenda', elements: [document.querySelector('#agenda')] },
  { name: 'Conteúdos', hash: 'conteudos', elements: [document.querySelector('#conteudos')] },
  { name: 'Kids', hash: 'kids', elements: [document.querySelector('#kids')] },
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

// Calendário mensal: os lembretes aparecem apenas após selecionar um dia.
let calendarView = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedCalendarDate = '';
renderAppointments = function renderCalendarAgenda() {
  const appointments = storage.get('vitta-appointments', []);
  const year = calendarView.getFullYear();
  const month = calendarView.getMonth();
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((start + daysInMonth) / 7) * 7;
  const monthName = calendarView.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const eventDays = new Set(appointments.filter((item) => item.date).map((item) => item.date));
  let calendarDays = '';
  for (let cell = 0; cell < totalCells; cell += 1) {
    const day = cell - start + 1;
    if (day < 1 || day > daysInMonth) {
      const adjacentDay = day < 1 ? new Date(year, month, day).getDate() : new Date(year, month + 1, day - daysInMonth).getDate();
      calendarDays += `<span class="calendar-day muted" aria-hidden="true">${adjacentDay}</span>`;
      continue;
    }
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
    const isSelected = selectedCalendarDate === dateKey;
    const classes = ['calendar-day', isToday ? 'today' : '', isSelected ? 'selected' : '', eventDays.has(dateKey) ? 'has-event' : ''].filter(Boolean).join(' ');
    calendarDays += `<button class="${classes}" type="button" data-calendar-date="${dateKey}" aria-pressed="${isSelected}" aria-label="${day} de ${calendarView.toLocaleDateString('pt-BR', { month: 'long' })}${eventDays.has(dateKey) ? ', tem lembrete' : ''}">${day}</button>`;
  }

  let detailsMarkup = '<p class="calendar-selection-empty">Selecione um dia para ver os lembretes.</p>';
  if (selectedCalendarDate) {
    const selectedItems = appointments.map((item, index) => ({ ...item, originalIndex: index }))
      .filter((item) => item.date === selectedCalendarDate)
      .sort((a, b) => `${a.time || ''}`.localeCompare(`${b.time || ''}`));
    const selectedLabel = new Date(`${selectedCalendarDate}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const itemsMarkup = selectedItems.length
      ? selectedItems.map((item) => `<article class="appointment-item"><div><div class="appointment-date">${item.time || 'Sem horário definido'}</div><h4>${item.title}</h4></div><button class="delete-btn" type="button" data-index="${item.originalIndex}">Remover</button></article>`).join('')
      : '<p class="text-muted small mb-0">Nenhum lembrete para este dia.</p>';
    detailsMarkup = `<h4 class="agenda-items-title">${selectedLabel}</h4><div class="appointment-list">${itemsMarkup}</div>`;
  }

  appointmentList.innerHTML = `<div class="calendar-card"><div class="calendar-header"><div><h3>${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h3><p class="calendar-caption">Organize seus momentos de cuidado</p></div><div class="calendar-month-nav" aria-label="Navegar entre meses"><button type="button" class="calendar-nav-button" data-calendar-step="-1" aria-label="Mês anterior">‹</button><button type="button" class="calendar-nav-button" data-calendar-step="1" aria-label="Próximo mês">›</button></div></div><div class="calendar-weekdays"><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div><div>Dom</div></div><div class="calendar-grid">${calendarDays}</div><div class="calendar-legend"><span></span> Dia com lembrete</div></div><div class="calendar-day-details" aria-live="polite">${detailsMarkup}</div>`;

  appointmentList.querySelectorAll('[data-calendar-step]').forEach((button) => button.addEventListener('click', () => {
    calendarView = new Date(year, month + Number(button.dataset.calendarStep), 1);
    selectedCalendarDate = '';
    renderAppointments();
  }));
  appointmentList.querySelectorAll('[data-calendar-date]').forEach((button) => button.addEventListener('click', () => {
    selectedCalendarDate = button.dataset.calendarDate;
    renderAppointments();
  }));
  appointmentList.querySelectorAll('.delete-btn').forEach((button) => button.addEventListener('click', () => {
    const current = storage.get('vitta-appointments', []);
    current.splice(Number(button.dataset.index), 1);
    storage.set('vitta-appointments', current);
    renderAppointments();
  }));
};
renderAppointments();

const kidsFeedback = document.querySelector('#kidsFeedback');
document.querySelectorAll('.kids-choice').forEach((choice) => choice.addEventListener('click', () => { document.querySelectorAll('.kids-choice').forEach((item) => item.classList.remove('active')); choice.classList.add('active'); kidsFeedback.textContent = `Você escolheu uma carinha ${choice.dataset.feeling}. Toda emoção pode ser conversada!`; }));
let breathRunning = false;
document.querySelector('#breathGame')?.addEventListener('click', () => { const ball = document.querySelector('#breathGame'); const message = document.querySelector('#breathMessage'); breathRunning = !breathRunning; ball.classList.toggle('inhale', breathRunning); message.textContent = breathRunning ? 'Inspire devagar...' : 'Expire devagar...'; });
const kindnessPhrases = ['Você faz diferença!', 'Seu jeito é especial!', 'Está tudo bem pedir ajuda.', 'Você pode ir com calma.', 'Que bom que você está aqui!'];
document.querySelector('#kindnessGame')?.addEventListener('click', () => { const phrase = kindnessPhrases[Math.floor(Math.random() * kindnessPhrases.length)]; document.querySelector('#kindnessMessage').textContent = phrase; });

const supportContainer = document.querySelector('#apoio .container');
if (supportContainer) supportContainer.innerHTML = `<div class="support-intro"><p class="eyebrow">Você não precisa enfrentar isso sozinho</p><h2>Encontre apoio quando precisar</h2><p>O VITTA informa e orienta, mas não substitui profissionais. Se houver risco imediato, procure ajuda agora e chame um adulto ou alguém de confiança.</p></div><div class="support-alert"><span>💛</span><div><strong>Se você estiver pensando em se machucar:</strong> não fique sozinho. Ligue para o SAMU 192 em uma emergência ou converse agora com o CVV pelo 188.</div></div><div class="row g-4"><div class="col-md-4"><article class="support-card emotional"><div class="support-number">188</div><h3>CVV — apoio emocional</h3><p>Conversa gratuita, sigilosa e disponível 24 horas todos os dias para quem precisa falar.</p><a class="btn btn-primary rounded-pill" href="tel:188">Ligar para 188</a></article></div><div class="col-md-4"><article class="support-card emergency"><div class="support-number">192</div><h3>SAMU — urgência</h3><p>Para situações de urgência ou emergência, inclusive crises relacionadas à saúde mental.</p><a class="btn btn-primary rounded-pill" href="tel:192">Chamar SAMU</a></article></div><div class="col-md-4"><article class="support-card sus"><div class="support-number">CAPS</div><h3> cuidado contínuo pelo SUS</h3><p>Procure o CAPS, uma UBS, uma UPA ou a Secretaria de Saúde do seu município para encontrar atendimento.</p><a class="btn btn-outline-primary rounded-pill" href="https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps/caps" target="_blank" rel="noreferrer">Ver orientações do SUS ↗</a></article></div></div><p class="support-source">Informações: Ministério da Saúde e CVV. Em perigo imediato, vá a uma UPA ou pronto-socorro.</p>`;

const modeToggle = document.querySelector('#kidsModeToggle');
const modeTexts = [
  ['#inicio h1', 'Como você está hoje?<br><span>Vamos conversar?</span>'],
  ['#inicio .hero-copy', 'Aqui você pode contar o que sente, aprender e pedir ajuda a um adulto de confiança.'],
  ['#diario h2', 'Que emoção apareceu hoje?'],
  ['#diario .lead-muted', 'Escolha uma carinha e conte, do seu jeito, como você está.'],
  ['#alimentar h2', 'Diário das refeições'],
  ['#alimentar .section-heading p:not(.eyebrow)', 'Conte o que você comeu em cada momento do dia. É só um registro, sem certo ou errado.'],
  ['#agenda h2', 'Vamos organizar seu dia?'],
  ['#agenda .lead-muted', 'Você pode anotar consultas e momentos importantes com a ajuda de um adulto.'],
  ['#conteudos h2', 'Vamos aprender juntos?'],
  ['#conteudos .section-heading p:not(.eyebrow)', 'Histórias e dicas simples para entender melhor o que sentimos.'],
  ['#apoio h2', 'Você não precisa ficar sozinho.'],
  ['#apoio .support-intro p:not(.eyebrow)', 'Se algo estiver difícil, fale com um adulto de confiança. Aqui estão caminhos seguros para pedir ajuda.']
];
function applyMode(kids) { document.body.classList.toggle('kids-mode', kids); modeToggle?.setAttribute('aria-pressed', String(kids)); if (modeToggle) modeToggle.innerHTML = kids ? '🌈 Modo adulto' : '🧸 Modo Kids'; modeTexts.forEach(([selector, kidsHtml]) => { const element = document.querySelector(selector); if (!element) return; if (!element.dataset.adultHtml) element.dataset.adultHtml = element.innerHTML; element.innerHTML = kids ? kidsHtml : element.dataset.adultHtml; }); localStorage.setItem('vitta-kids-mode', kids ? 'on' : 'off'); }
const savedKidsMode = localStorage.getItem('vitta-kids-mode') === 'on';
applyMode(savedKidsMode);
modeToggle?.addEventListener('click', () => applyMode(!document.body.classList.contains('kids-mode')));

const kidsCopy = [
  ['.feature-card h3', ['Missão: notar emoções', 'Missão: organizar o dia', 'Missão: descobrir e aprender']],
  ['.feature-card p', ['Escolha uma carinha e descubra como seu coração está hoje.', 'Monte sua rotina com a ajuda de um adulto.', 'Aprenda brincando com dicas fáceis de entender.']],
  ['#diario .form-label', ['Quer contar mais alguma coisa?']],
  ['#alimentar label[for="foodMealCategory"]', ['Qual foi a sua refeição?']],
  ['#alimentar label[for="foodDescription"]', ['O que você comeu?']],
  ['#alimentar button[type="submit"]', ['Guardar registro']],
  ['#agenda label[for="appointmentTitle"]', ['Qual é a sua próxima missão?']],
  ['#agenda button[type="submit"]', ['Guardar lembrete']],
  ['#conteudos .content-card h3', ['Descubra os sentimentos', 'Quando pedir ajuda?', 'Ideias para cuidar de você']],
  ['#conteudos .content-card p', ['Uma aventura para entender melhor o que acontece dentro da gente.', 'Aprenda com quem conversar quando algo ficar difícil.', 'Pequenas escolhas que ajudam seu dia a ficar mais leve.']],
  ['#apoio .support-card h3', ['Alguém para conversar', 'Ajuda em uma emergência', 'Cuidado perto de você']]
];
function applyKidsCopy(enabled) { kidsCopy.forEach(([selector, texts]) => { document.querySelectorAll(selector).forEach((element, index) => { if (!element.dataset.adultKidsHtml) element.dataset.adultKidsHtml = element.innerHTML; element.innerHTML = enabled ? (texts[index] || texts[0]) : element.dataset.adultKidsHtml; }); }); }
applyKidsCopy(savedKidsMode);
modeToggle?.addEventListener('click', () => applyKidsCopy(document.body.classList.contains('kids-mode')));
function syncKidsVisibility() { const enabled = document.body.classList.contains('kids-mode'); document.querySelectorAll('a[href="#kids"]').forEach((link) => link.setAttribute('aria-hidden', String(!enabled))); if (!enabled && (sectionGroups[currentSection]?.hash === 'kids' || window.location.hash === '#kids')) showSection(0, false); }
syncKidsVisibility();
modeToggle?.addEventListener('click', () => setTimeout(syncKidsVisibility, 0));

// Conta simples e sincronização com MySQL através dos endpoints PHP.
const API_BASE = 'api';
const authButton = document.querySelector('#authButton');
const logoutNavButton = document.querySelector('#logoutNavButton');
const authModal = document.querySelector('#authModal');
const authForm = document.querySelector('#authForm');
const authFeedback = document.querySelector('#authFeedback');
const logoutButton = document.querySelector('#logoutButton');
const authModalInstance = authModal && window.bootstrap ? bootstrap.Modal.getOrCreateInstance(authModal) : null;
function openVittaAuth() { if (!authModal) return; if (authModalInstance) authModalInstance.show(); else { authModal.style.display = 'block'; authModal.classList.add('show'); authModal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); } }
function closeVittaAuth() { if (!authModal) return; if (authModalInstance) authModalInstance.hide(); else { authModal.style.display = 'none'; authModal.classList.remove('show'); authModal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); } }
function showAuthMessage(message, success = false) { if (authFeedback) { authFeedback.textContent = message; authFeedback.style.color = success ? '#368b71' : '#a45763'; } }
async function apiRequest(endpoint, options = {}) { const response = await fetch(`${API_BASE}/${endpoint}`, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options }); const data = await response.json().catch(() => ({ ok: false, message: 'Resposta inválida do servidor.' })); if (!response.ok || data.ok === false) throw new Error(data.message || 'Não foi possível concluir a operação.'); return data; }
function updateAccountUI() { if (!authButton) return; authButton.textContent = authenticatedUser ? `Olá, ${authenticatedUser.username}` : 'Entrar'; if (logoutNavButton) { logoutNavButton.classList.toggle('hidden', !authenticatedUser); logoutNavButton.style.display = authenticatedUser ? 'inline-block' : 'none'; } logoutButton?.classList.toggle('d-none', !authenticatedUser); document.querySelector('#loginButton')?.classList.toggle('d-none', !!authenticatedUser); document.querySelector('#registerButton')?.classList.toggle('d-none', !!authenticatedUser); }
async function loadServerData() { if (!authenticatedUser) return; try { const [emotionData, appointmentData, foodDiaryData] = await Promise.all([apiRequest('emotions.php'), apiRequest('appointments.php'), apiRequest('food-diary.php')]); if (emotionData.items?.length) { const latest = emotionData.items[0]; storage.set('vitta-emotion', { emotion: latest.emotion, note: latest.note || '', date: new Date(latest.created_at).toLocaleDateString('pt-BR') }); renderLastEmotion(); } storage.set('vitta-appointments', (appointmentData.items || []).map((item) => ({ id: item.id, title: item.title, date: item.date, time: item.time || '' }))); storage.set('vitta-food-diary', (foodDiaryData.items || []).map((item) => ({ id: item.id, category: item.category, description: item.description, date: item.date, time: item.time || '' }))); renderAppointments(); renderFoodDiary(); } catch (error) { showAuthMessage(error.message); } }
if (authButton?.tagName !== 'A') authButton?.addEventListener('click', () => { showAuthMessage(''); openVittaAuth(); });
authModal?.querySelector('.btn-close')?.addEventListener('click', closeVittaAuth);
authForm?.addEventListener('submit', async (event) => { event.preventDefault(); showAuthMessage('Entrando...'); try { const data = await apiRequest('login.php', { method: 'POST', body: JSON.stringify({ username: document.querySelector('#authUsername').value.trim(), password: document.querySelector('#authPassword').value }) }); authenticatedUser = data.user; updateAccountUI(); await loadServerData(); showAuthMessage('Login realizado com sucesso.', true); setTimeout(closeVittaAuth, 700); } catch (error) { showAuthMessage(error.message); } });
document.querySelector('#registerButton')?.addEventListener('click', async () => { showAuthMessage('Criando cadastro...'); try { const data = await apiRequest('register.php', { method: 'POST', body: JSON.stringify({ username: document.querySelector('#authUsername').value.trim(), password: document.querySelector('#authPassword').value }) }); authenticatedUser = data.user; updateAccountUI(); showAuthMessage('Cadastro criado com sucesso.', true); setTimeout(closeVittaAuth, 700); } catch (error) { showAuthMessage(error.message); } });
logoutButton?.addEventListener('click', async () => { try { await apiRequest('logout.php', { method: 'POST' }); } finally { authenticatedUser = null; localStorage.removeItem('vitta-food-diary'); updateAccountUI(); authForm?.reset(); showAuthMessage('Você saiu da conta.', true); } });
logoutNavButton?.addEventListener('click', async () => { logoutNavButton.disabled = true; try { await apiRequest('logout.php', { method: 'POST' }); } finally { authenticatedUser = null; localStorage.removeItem('vitta-emotion'); localStorage.removeItem('vitta-appointments'); localStorage.removeItem('vitta-food-diary'); updateAccountUI(); window.location.reload(); } });
document.querySelector('#saveEmotion')?.addEventListener('click', () => { if (!authenticatedUser) return; const record = storage.get('vitta-emotion', null); if (record) apiRequest('emotions.php', { method: 'POST', body: JSON.stringify(record) }).catch((error) => showAuthMessage(error.message)); });
document.querySelector('#appointmentForm')?.addEventListener('submit', () => { if (!authenticatedUser) return; setTimeout(() => { const items = storage.get('vitta-appointments', []); const latest = items[items.length - 1]; if (latest) apiRequest('appointments.php', { method: 'POST', body: JSON.stringify(latest) }).catch((error) => showAuthMessage(error.message)); }, 0); });
apiRequest('me.php').then((data) => { authenticatedUser = data.user; updateAccountUI(); return loadServerData(); }).catch(() => updateAccountUI());
appointmentList?.addEventListener('click', (event) => { const button = event.target.closest('.delete-btn'); if (!button || !authenticatedUser) return; const item = storage.get('vitta-appointments', [])[Number(button.dataset.index)]; if (item?.id) apiRequest('appointments.php', { method: 'DELETE', body: JSON.stringify({ id: item.id }) }).catch((error) => showAuthMessage(error.message)); }, true);

// Jogos Kids: experiências curtas, guiadas e com recompensa visual.
const breathButton = document.querySelector('#breathGame');
const breathMessage = document.querySelector('#breathMessage');
if (breathButton && breathMessage) {
  const breathTimerLabel = document.createElement('strong');
  breathTimerLabel.className = 'breath-timer';
  breathTimerLabel.textContent = '30s';
  breathMessage.before(breathTimerLabel);
  const cleanBreathButton = breathButton.cloneNode(true);
  breathButton.replaceWith(cleanBreathButton);
  let breathInterval = null;
  let breathRemaining = 30;
  let breathElapsed = 0;
  const finishBreathing = () => { clearInterval(breathInterval); breathInterval = null; cleanBreathButton.classList.remove('inhale'); cleanBreathButton.disabled = false; cleanBreathButton.textContent = '●'; breathMessage.textContent = 'Muito bem! Seu corpo agradece 💛'; breathTimerLabel.textContent = 'feito!'; };
  cleanBreathButton.addEventListener('click', () => {
    if (breathInterval) return;
    breathRemaining = 30; breathElapsed = 0; cleanBreathButton.disabled = true; cleanBreathButton.textContent = '…'; breathMessage.textContent = 'Inspire pelo nariz...'; breathTimerLabel.textContent = '30s';
    breathInterval = setInterval(() => { breathRemaining -= 1; breathElapsed += 1; const phase = breathElapsed % 12; const inhale = phase < 4; cleanBreathButton.classList.toggle('inhale', inhale); breathMessage.textContent = phase < 4 ? 'Inspire devagar...' : phase < 6 ? 'Segure um pouquinho...' : 'Expire bem devagar...'; breathTimerLabel.textContent = `${breathRemaining}s`; if (breathRemaining <= 0) finishBreathing(); }, 1000);
  });
}

const emotionCard = document.querySelector('.game-emotions');
if (emotionCard) {
  const challenge = document.createElement('div'); challenge.id = 'emotionChallenge'; challenge.className = 'emotion-challenge';
  const score = document.createElement('div'); score.id = 'emotionScore'; score.className = 'game-score'; score.textContent = '⭐ 0 estrelinhas';
  emotionCard.querySelector('p')?.after(challenge); emotionCard.querySelector('.emotion-game-options')?.before(score);
  const challenges = ['Qual carinha combina com o seu coração agora?', 'Como você ficou depois de brincar?', 'Escolha uma carinha para contar seu momento:'];
  let round = 0; let points = 0;
  const updateChallenge = () => { challenge.textContent = challenges[round % challenges.length]; score.textContent = `⭐ ${points} estrelinha${points === 1 ? '' : 's'}`; };
  updateChallenge();
  document.querySelectorAll('.kids-choice').forEach((choice) => choice.addEventListener('click', () => { points += 1; round += 1; choice.classList.add('picked'); setTimeout(() => choice.classList.remove('picked'), 500); updateChallenge(); kidsFeedback.textContent = `${choice.textContent} Que legal você conseguir contar o que sente!`; }));
}

const kindnessButton = document.querySelector('#kindnessGame');
const kindnessMessage = document.querySelector('#kindnessMessage');
if (kindnessButton && kindnessMessage) {
  kindnessButton.textContent = 'Abrir cartinha ✨';
  const kindnessScore = document.createElement('div'); kindnessScore.className = 'game-score'; kindnessScore.id = 'kindnessScore'; kindnessScore.textContent = '⭐ 0 descobertas'; kindnessButton.before(kindnessScore);
  const cards = ['Você é importante do jeitinho que é! 💜', 'Pedir ajuda é uma atitude corajosa! 🌈', 'Seu sentimento merece espaço. 💛', 'Você pode respirar e ir com calma. 🌿', 'Tem sempre alguém que pode ouvir você. 🤝'];
  let discoveries = 0;
  kindnessButton.addEventListener('click', () => { discoveries += 1; kindnessMessage.classList.remove('reveal'); void kindnessMessage.offsetWidth; kindnessMessage.textContent = cards[Math.floor(Math.random() * cards.length)]; kindnessMessage.classList.add('reveal'); document.querySelector('#kindnessScore').textContent = `⭐ ${discoveries} descoberta${discoveries === 1 ? '' : 's'}`; });
}

// Jogo da cesta: funciona dentro da área Kids sem alterar os outros jogos.
(() => {
  const arena = document.querySelector('#catcherArena');
  const basket = document.querySelector('#catcherBasket');
  const itemsLayer = document.querySelector('#catcherItems');
  const overlay = document.querySelector('#catcherOverlay');
  const startButton = document.querySelector('#catcherStart');
  if (!arena || !basket || !itemsLayer || !overlay || !startButton) return;

  const scoreOutput = document.querySelector('#catcherScore');
  const livesOutput = document.querySelector('#catcherLives');
  const statusOutput = document.querySelector('#catcherStatus');
  const overlayTitle = document.querySelector('#catcherOverlayTitle');
  const overlayText = document.querySelector('#catcherOverlayText');
  const food = ['🍎', '🍌', '🍓', '🥕', '🍞', '🍊', '🥑', '🍇', '🧀', '🥨'];
  const basketWidth = 58;
  let running = false;
  let raf = 0;
  let lastTime = 0;
  let spawnElapsed = 0;
  let score = 0;
  let lives = 3;
  let basketX = 0.5;
  let direction = 0;
  let pointerIsDown = false;
  let objects = [];

  function positionBasket() {
    const half = basketWidth / 2;
    const x = Math.max(half, Math.min(arena.clientWidth - half, basketX * arena.clientWidth));
    basket.style.left = `${x}px`;
  }
  function showLives() {
    livesOutput.textContent = `${'❤️'.repeat(lives)}${'🤍'.repeat(3 - lives)}`;
    livesOutput.setAttribute('aria-label', `${lives} ${lives === 1 ? 'vida' : 'vidas'}`);
  }
  function clearObjects() {
    objects.forEach((object) => object.element.remove());
    objects = [];
  }
  function reset() {
    cancelAnimationFrame(raf);
    running = false;
    lastTime = 0;
    spawnElapsed = 0;
    score = 0;
    lives = 3;
    basketX = 0.5;
    direction = 0;
    pointerIsDown = false;
    clearObjects();
    scoreOutput.textContent = '0';
    showLives();
    positionBasket();
  }
  function endGame() {
    running = false;
    cancelAnimationFrame(raf);
    direction = 0;
    overlay.hidden = false;
    overlayTitle.textContent = 'Que boa brincadeira!';
    overlayText.textContent = `Você fez ${score} ${score === 1 ? 'ponto' : 'pontos'}. Obrigado por jogar — cada tentativa é uma aventura!`;
    startButton.textContent = 'Jogar de novo';
    statusOutput.textContent = `Fim da rodada. Você fez ${score} ${score === 1 ? 'ponto' : 'pontos'}. Que bom que você brincou!`;
    startButton.focus();
  }
  function startGame() {
    reset();
    running = true;
    overlay.hidden = true;
    statusOutput.textContent = 'Rodada iniciada. Pegue as comidas e desvie das bombas!';
    arena.focus({ preventScroll: true });
    raf = requestAnimationFrame(frame);
  }
  function spawn() {
    const isBomb = Math.random() < 0.2;
    const element = document.createElement('span');
    element.className = 'catcher-item';
    element.textContent = isBomb ? '💣' : food[Math.floor(Math.random() * food.length)];
    element.setAttribute('aria-hidden', 'true');
    const item = { element, x: 24 + Math.random() * Math.max(1, arena.clientWidth - 48), y: -48, isBomb };
    itemsLayer.append(element);
    objects.push(item);
  }
  function frame(time) {
    if (!running) return;
    const dt = Math.min((time - (lastTime || time)) / 1000, 0.04);
    lastTime = time;
    const width = arena.clientWidth;
    if (direction) basketX += direction * 0.62 * dt;
    basketX = Math.max((basketWidth / 2) / width, Math.min(1 - (basketWidth / 2) / width, basketX));
    positionBasket();

    const speed = 155 + Math.min(score, 40) * 4;
    const spawnEvery = Math.max(420, 1050 - score * 15);
    spawnElapsed += dt * 1000;
    if (spawnElapsed >= spawnEvery) {
      spawnElapsed %= spawnEvery;
      spawn();
    }

    const floorY = arena.clientHeight - 58;
    const basketCenter = basketX * width;
    objects = objects.filter((item) => {
      item.y += speed * dt;
      item.element.style.transform = `translate(${item.x - 23}px, ${item.y}px)`;
      const touchingBasket = item.y + 38 >= floorY && item.y <= floorY + 42 && Math.abs(item.x - basketCenter) < 43;
      if (touchingBasket) {
        item.element.remove();
        if (item.isBomb) {
          lives -= 1;
          showLives();
          statusOutput.textContent = lives ? `Ops, uma bomba! Restam ${lives} ${lives === 1 ? 'vida' : 'vidas'}. Continue brincando!` : 'A rodada terminou. Obrigado por brincar!';
          if (!lives) endGame();
        } else {
          score += 1;
          scoreOutput.textContent = String(score);
          statusOutput.textContent = `${item.element.textContent} Ponto! Você tem ${score} ${score === 1 ? 'ponto' : 'pontos'}.`;
        }
        return false;
      }
      if (item.y > arena.clientHeight) { item.element.remove(); return false; }
      return true;
    });
    if (running) raf = requestAnimationFrame(frame);
  }
  function moveByPointer(event) {
    const bounds = arena.getBoundingClientRect();
    basketX = (event.clientX - bounds.left) / bounds.width;
    positionBasket();
  }

  startButton.addEventListener('click', startGame);
  arena.addEventListener('pointerdown', (event) => { if (!running) return; pointerIsDown = true; arena.setPointerCapture?.(event.pointerId); moveByPointer(event); });
  arena.addEventListener('pointermove', (event) => { if (running && pointerIsDown) moveByPointer(event); });
  arena.addEventListener('pointerup', () => { pointerIsDown = false; });
  arena.addEventListener('pointercancel', () => { pointerIsDown = false; });
  arena.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) event.preventDefault();
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') direction = -1;
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') direction = 1;
  });
  arena.addEventListener('keyup', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) event.preventDefault();
    if ((event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') && direction < 0) direction = 0;
    if ((event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') && direction > 0) direction = 0;
  });
  window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a' || event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') direction = 0;
  });
  window.addEventListener('blur', () => { direction = 0; pointerIsDown = false; });
  window.addEventListener('resize', positionBasket);
  document.querySelector('#catcherLeft')?.addEventListener('pointerdown', (event) => { event.preventDefault(); direction = -1; });
  document.querySelector('#catcherRight')?.addEventListener('pointerdown', (event) => { event.preventDefault(); direction = 1; });
  ['#catcherLeft', '#catcherRight'].forEach((selector) => {
    const button = document.querySelector(selector);
    button?.addEventListener('pointerup', () => { direction = 0; });
    button?.addEventListener('pointercancel', () => { direction = 0; });
    button?.addEventListener('pointerleave', () => { direction = 0; });
    button?.addEventListener('click', () => { basketX += selector === '#catcherLeft' ? -0.12 : 0.12; positionBasket(); });
  });
  showLives();
  positionBasket();
})();
