const loginForm = document.querySelector('#loginPageForm');
const loginFeedback = document.querySelector('#loginFeedback');
const loginTitle = document.querySelector('#loginTitle');
const loginSubtitle = document.querySelector('#loginSubtitle');
const loginSubmit = document.querySelector('#loginSubmit');
const registerSubmit = document.querySelector('#registerSubmit');
const API_BASE = 'api';
let registerMode = false;
function message(text, success = false) { loginFeedback.textContent = text; loginFeedback.style.color = success ? '#368b71' : '#a45763'; }
async function send(endpoint) { const response = await fetch(`${API_BASE}/${endpoint}`, { method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username: document.querySelector('#loginUsername').value.trim(), password: document.querySelector('#loginPassword').value }) }); const data = await response.json().catch(() => ({ok:false, message:'Resposta inválida do servidor.'})); if (!response.ok || data.ok === false) throw new Error(data.message || 'Não foi possível concluir.'); return data; }
function setRegisterMode(value) { registerMode = value; loginTitle.textContent = value ? 'Criar cadastro' : 'Entrar'; loginSubtitle.textContent = value ? 'Crie um usuário simples para guardar seus registros.' : 'Use seu usuário e senha para continuar.'; loginSubmit.textContent = value ? 'Cadastrar e entrar' : 'Entrar'; registerSubmit.textContent = value ? 'Já tenho uma conta' : 'Criar cadastro'; message(''); }
loginForm.addEventListener('submit', async (event) => { event.preventDefault(); message(registerMode ? 'Criando cadastro...' : 'Entrando...'); try { await send(registerMode ? 'register.php' : 'login.php'); message(registerMode ? 'Cadastro criado! Abrindo seu espaço...' : 'Login realizado! Abrindo seu espaço...', true); setTimeout(() => { window.location.href = 'index.html'; }, 600); } catch (error) { message(error.message); } });
registerSubmit.addEventListener('click', () => setRegisterMode(!registerMode));
