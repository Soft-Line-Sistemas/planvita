// ===== MOCK DATA =====
const USER = {
  name: 'Leonardo', fullName: 'Leonardo de Queiroz Silva',
  cpf: '025.***.***-94', plano: 'Bosque Social', validade: '03/2031',
  avatar: 'https://i.pravatar.cc/150?img=12'
};

const FATURAS = [
  { id: 1, titulo: 'Plano Mensal - Bosque Social', vencimento: '27 de março de 2026', valor: 'R$ 49,90', status: 'atual' },
  { id: 2, titulo: 'Plano Mensal - Bosque Social', vencimento: '27 de março de 2026', valor: 'R$ 49,90', status: 'vencido' },
  { id: 3, titulo: 'Plano Mensal - Bosque Social', vencimento: '27 de março de 2026', valor: 'R$ 49,90', status: 'pago' },
  { id: 4, titulo: 'Plano Mensal - Bosque Social', vencimento: '27 de fevereiro de 2026', valor: 'R$ 49,90', status: 'pago' },
  { id: 5, titulo: 'Plano Mensal - Bosque Social', vencimento: '27 de janeiro de 2026', valor: 'R$ 49,90', status: 'pago' },
];

// ===== ROUTER =====
let currentScreen = 'splash';
let history = [];

function navigate(screenId, addHistory = true) {
  const prev = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + screenId);
  if (!next || currentScreen === screenId) return;
  if (addHistory) history.push(currentScreen);
  if (prev) { prev.classList.remove('active'); prev.classList.add('prev'); }
  next.classList.remove('prev');
  next.classList.add('active');
  currentScreen = screenId;
  setTimeout(() => { if (prev) prev.classList.remove('prev'); }, 320);
}

function goBack() {
  if (history.length === 0) return;
  const prev = history.pop();
  const curr = document.querySelector('.screen.active');
  const target = document.getElementById('screen-' + prev);
  if (!target) return;
  curr.classList.remove('active');
  target.classList.remove('prev');
  target.classList.add('active');
  currentScreen = prev;
}

// ===== LOGO SVG (inline) =====
const LOGO_WHITE = `<svg width="180" height="60" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="70" y="42" font-family="Inter,sans-serif" font-size="30" font-weight="800" fill="white">CAMPO</text>
  <text x="70" y="74" font-family="Inter,sans-serif" font-size="30" font-weight="800" fill="white">DO BOSQUE</text>
  <text x="70" y="90" font-family="Inter,sans-serif" font-size="10" font-weight="500" fill="rgba(255,255,255,0.8)" letter-spacing="3">ASSISTÊNCIA FAMILIAR</text>
  <g transform="translate(8,10)">
    <circle cx="28" cy="28" r="26" fill="rgba(255,255,255,0.15)"/>
    <path d="M28 8 C28 8 12 18 12 30 C12 38 20 44 28 44 C36 44 44 38 44 30 C44 18 28 8 28 8Z" fill="rgba(255,255,255,0.9)"/>
    <path d="M28 44 L28 56" stroke="rgba(255,255,255,0.9)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="20" cy="24" r="5" fill="rgba(255,255,255,0.6)"/>
    <circle cx="36" cy="20" r="4" fill="rgba(255,255,255,0.6)"/>
    <circle cx="22" cy="34" r="4" fill="rgba(255,255,255,0.6)"/>
    <circle cx="34" cy="32" r="5" fill="rgba(255,255,255,0.6)"/>
  </g>
</svg>`;

const LOGO_COLOR = `<svg width="160" height="55" viewBox="0 0 300 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="70" y="42" font-family="Inter,sans-serif" font-size="30" font-weight="800" fill="#2d7a1f">CAMPO</text>
  <text x="70" y="74" font-family="Inter,sans-serif" font-size="30" font-weight="800" fill="#2d7a1f">DO BOSQUE</text>
  <text x="70" y="90" font-family="Inter,sans-serif" font-size="10" font-weight="500" fill="#e67e00" letter-spacing="3">ASSISTÊNCIA FAMILIAR</text>
  <g transform="translate(8,10)">
    <path d="M28 8 C28 8 12 18 12 30 C12 38 20 44 28 44 C36 44 44 38 44 30 C44 18 28 8 28 8Z" fill="#3a9b28"/>
    <path d="M28 44 L28 56" stroke="#3a9b28" stroke-width="3" stroke-linecap="round"/>
    <circle cx="20" cy="24" r="5" fill="#4cbb30"/>
    <circle cx="36" cy="20" r="4" fill="#4cbb30"/>
    <circle cx="22" cy="34" r="4" fill="#4cbb30"/>
    <circle cx="34" cy="32" r="5" fill="#4cbb30"/>
  </g>
</svg>`;

// ===== TAB BAR =====
function renderTabBar(active) {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Início' },
    { id: 'atendimento', icon: '🎧', label: 'Atendimento' },
    { id: 'faturas', icon: '📄', label: 'Faturas' },
    { id: 'ajustes', icon: '⚙️', label: 'Ajustes' },
  ];
  return `<nav class="tab-bar" role="tablist">
    ${tabs.map(t => `
      <button class="tab-item ${t.id === active ? 'active' : ''}" role="tab" aria-label="${t.label}"
        onclick="navigate('${t.id}')">
        <span class="tab-icon">${t.icon}</span>
        <span>${t.label}</span>
      </button>`).join('')}
  </nav>`;
}

// ===== HEADER =====
function renderHeader(title, backTo) {
  return `<header class="app-header">
    ${backTo ? `<button class="btn-back" onclick="goBack()" aria-label="Voltar">&#8592;</button>` : ''}
    <h1>${title}</h1>
  </header>`;
}

// ===== SCREENS HTML =====
const SCREENS = {
  splash: () => `
    <div id="screen-splash" class="screen active" role="main">
      <div class="splash-logo">${LOGO_WHITE}</div>
      <span class="splash-url">campodobosque.com.br</span>
    </div>`,

  onboarding: () => `
    <div id="screen-onboarding" class="screen">
      <div class="carousel-wrapper">
        <div class="carousel-track" id="carousel-track">
          <div class="carousel-slide">
            <div class="carousel-image">🌳</div>
            <h2 class="carousel-title">Bem-vindo à Campo do Bosque</h2>
            <p class="carousel-desc">Assistência familiar de qualidade para você e sua família em momentos que mais importam.</p>
          </div>
          <div class="carousel-slide">
            <div class="carousel-image" style="font-size:80px">💚</div>
            <h2 class="carousel-title">Carteirinha Digital</h2>
            <p class="carousel-desc">Acesse sua carteirinha de qualquer lugar, a qualquer hora, direto pelo aplicativo.</p>
          </div>
          <div class="carousel-slide">
            <div class="carousel-image" style="font-size:80px">📱</div>
            <h2 class="carousel-title">Gerencie com facilidade</h2>
            <p class="carousel-desc">Acompanhe faturas, dependentes e muito mais na palma da sua mão.</p>
          </div>
        </div>
      </div>
      <div class="carousel-bottom">
        <div class="dots" id="carousel-dots">
          <div class="dot active"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <button class="btn-primary" id="carousel-btn" style="max-width:340px;width:100%"
          onclick="carouselNext()">Próximo</button>
      </div>
    </div>`,

  login: () => `
    <div id="screen-login" class="screen">
      <div class="login-logo-box">${LOGO_COLOR}</div>
      <div class="login-form-area">
        <p class="login-title">Faça login para continuar<br>ou crie uma conta</p>
        <div class="input-group">
          <div class="input-wrap">
            <span class="icon">👤</span>
            <input type="email" id="input-email" placeholder="E-mail" autocomplete="email" />
          </div>
        </div>
        <div class="input-group">
          <div class="input-wrap">
            <span class="icon">🔒</span>
            <input type="password" id="input-senha" placeholder="Senha" autocomplete="current-password" />
          </div>
        </div>
        <a href="#" class="forgot-link" onclick="alert('Enviaremos um link de recuperação para seu e-mail.')">Esqueceu a senha?</a>
        <button class="btn-primary" id="btn-entrar" onclick="doLogin()">Entrar</button>
        <p class="register-link">Não tem uma conta? <span onclick="navigate('cadastro')" style="cursor:pointer">Crie uma agora!</span></p>
      </div>
    </div>`,

  home: () => `
    <div id="screen-home" class="screen">
      <div class="home-header">
        <div class="home-header-top">
          <div class="home-logo">${LOGO_WHITE}</div>
          <button class="btn-logout" onclick="navigate('login')">&#x2192; Sair</button>
        </div>
        <p class="home-greeting">Olá, <span>${USER.name}</span></p>
        <div class="plan-card">
          <div class="plan-card-info">
            <div class="plan-avatar"><img src="${USER.avatar}" alt="Foto do perfil" /></div>
            <div class="plan-details">
              <p class="plan-name">${USER.fullName}</p>
              <p class="plan-meta">
                Cpf: ${USER.cpf}<br>
                Tipo de plano: <strong>${USER.plano}</strong><br>
                Validade: ${USER.validade}
              </p>
            </div>
          </div>
          <button class="btn-carteirinha" onclick="navigate('carteirinha')">
            <span class="icon">🪪</span>Carteirinha digital
          </button>
        </div>
      </div>
      <div class="home-panel">
        <p class="section-title">Selecione a opção desejada</p>
        <div class="menu-grid">
          <button class="menu-item" onclick="navigate('assinaturas')">
            <span class="menu-icon">📋</span>
            <span class="menu-label">Contrato<br>seu plano</span>
          </button>
          <button class="menu-item" onclick="navigate('faturas')">
            <span class="menu-icon">💰</span>
            <span class="menu-label">Acesse<br>suas faturas</span>
          </button>
          <button class="menu-item" onclick="alert('Parcerias e vantagens em breve!')">
            <span class="menu-icon">🤝</span>
            <span class="menu-label">Parcerias e<br>vantagens</span>
          </button>
          <button class="menu-item" onclick="navigate('assinaturas')">
            <span class="menu-icon">✍️</span>
            <span class="menu-label">Assinaturas</span>
          </button>
        </div>
        <button class="btn-atendimento-banner" onclick="navigate('atendimento')">
          <div class="btn-atendimento-left">
            <span class="icon">🎧</span>
            <span>Fale com um atendente</span>
          </div>
          <span class="chevron">›</span>
        </button>
      </div>
      ${renderTabBar('home')}
    </div>`,

  carteirinha: () => `
    <div id="screen-carteirinha" class="screen">
      ${renderHeader('Carteirinha Digital', true)}
      <div class="panel" style="border-radius:20px 20px 0 0; margin-top:-12px; padding:0;">
        <div class="card-wrapper">
          <div class="carteirinha-card">
            <span class="carteirinha-bg-left">Agora você faz parte da rede campo do bosque</span>
            <div class="carteirinha-info">
              <div class="carteirinha-id">PLN-31</div>
              <p class="carteirinha-name">${USER.fullName}</p>
              <p class="carteirinha-meta">CPF: 025.775.565-94<br>Vigência 27 de março de 2031</p>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end;position:relative;z-index:1">
              <div class="carteirinha-plan-badge">🌿 Plano: <strong>Bosque Social</strong></div>
              <div class="carteirinha-logo-text">
                <p class="brand">CAMPO<br>DO BOSQUE</p>
                <p class="sub">Assistência Familiar</p>
              </div>
            </div>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-outline" onclick="alert('Abrindo benefícios...')">Ver benefícios</button>
          <button class="btn-solid" onclick="alert('Gerando PDF da carteirinha...')">Baixar em PDF</button>
        </div>
      </div>
    </div>`,

  faturas: () => `
    <div id="screen-faturas" class="screen">
      ${renderHeader('Minhas faturas', true)}
      <div class="panel" style="padding:0;border-radius:20px 20px 0 0;margin-top:-12px;">
        <div class="faturas-filter">
          <div class="filter-label">⚙️ Filtro</div>
          <div class="filter-row">
            <div class="select-wrap">
              <select aria-label="Filtrar por período"><option>Todo período</option><option>Este mês</option><option>Últimos 3 meses</option></select>
              <span class="chev">▾</span>
            </div>
            <div class="select-wrap">
              <select aria-label="Filtrar por status"><option>Todos os status</option><option>Em aberto</option><option>Pago</option><option>Vencido</option></select>
              <span class="chev">▾</span>
            </div>
          </div>
        </div>
        <div class="faturas-count">1 fatura em aberto ▾</div>
        <div class="faturas-list">
          ${FATURAS.map(f => renderFaturaCard(f)).join('')}
        </div>
      </div>
      ${renderTabBar('faturas')}
    </div>`,

  atendimento: () => `
    <div id="screen-atendimento" class="screen">
      ${renderHeader('Atendimento', true)}
      <div class="panel" style="border-radius:20px 20px 0 0;margin-top:-12px;padding:0;">
        <div class="accordion">
          <div class="accordion-item open" id="acc-central">
            <div class="accordion-header" onclick="toggleAccordion('acc-central')">
              <div class="accordion-header-text">
                <p class="title">Central de Relacionamento</p>
                <p class="sub">Consultas, informações e serviços</p>
              </div>
              <span class="accordion-chevron">▲</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-content">
                <button class="btn-phone-card" onclick="window.location.href='tel:40040021'">
                  <div class="btn-phone-left">
                    <p class="label">Central de Relacionamento</p>
                    <p class="number">4004 0021</p>
                  </div>
                  <span class="btn-call">Ligar</span>
                </button>
                <button class="btn-whatsapp" onclick="window.open('https://wa.me/5571999999999','_blank')">
                  Iniciar conversa pelo WhatsApp
                </button>
              </div>
            </div>
          </div>
          <div class="accordion-item" id="acc-sac">
            <div class="accordion-header" onclick="toggleAccordion('acc-sac')">
              <div class="accordion-header-text">
                <p class="title">SAC</p>
                <p class="sub">Reclamações, cancelamentos e informações</p>
              </div>
              <span class="accordion-chevron">▾</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-content">
                <button class="btn-phone-card" onclick="window.location.href='tel:08001234567'">
                  <div class="btn-phone-left">
                    <p class="label">SAC Gratuito</p>
                    <p class="number">0800 123 4567</p>
                  </div>
                  <span class="btn-call">Ligar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${renderTabBar('atendimento')}
    </div>`,

  ajustes: () => `
    <div id="screen-ajustes" class="screen">
      ${renderHeader('Ajustes', true)}
      <div class="panel" style="border-radius:20px 20px 0 0;margin-top:-12px;padding:0;display:flex;flex-direction:column;">
        <div class="settings-list">
          <div class="settings-item" onclick="alert('Alterar senha em breve')">
            Alterar senha <span class="chev">›</span>
          </div>
          <div class="settings-item" onclick="alert('Alterar dados em breve')">
            Alterar dados de contato <span class="chev">›</span>
          </div>
          <div class="settings-item" onclick="alert('Alterar foto em breve')">
            Alterar foto de Perfil <span class="chev">›</span>
          </div>
        </div>
        <div class="settings-logout-area">
          <button class="btn-logout-full" onclick="navigate('login')">&#x2192; Sair do Aplicativo</button>
        </div>
      </div>
      ${renderTabBar('ajustes')}
    </div>`,

  assinaturas: () => `
    <div id="screen-assinaturas" class="screen">
      ${renderHeader('Assinaturas digitais', true)}
      <div class="panel" style="border-radius:20px 20px 0 0;margin-top:-12px;padding:0;">
        <div class="assinaturas-list">
          <div class="assinatura-card">
            <p class="assinatura-title">Contrato de Prestação de Serviço</p>
            <p class="assinatura-subtitle">Leia o contrato antes de realizar as assinaturas.</p>
            <button class="btn-outline" onclick="alert('Baixando contrato...')">⬇ Baixar Contrato</button>
          </div>
          <div class="assinatura-card highlighted">
            <p class="assinatura-title">Titular - Assinatura 1</p>
            <div class="assinatura-status-row">
              <span class="icon">ℹ️</span> Aguardando assinatura
            </div>
            <button class="btn-solid" onclick="alert('Abrindo documento para assinatura...')">⬇ Baixar Contrato</button>
          </div>
          <div class="assinatura-card">
            <p class="assinatura-title">Corresponsável financeiro</p>
            <div class="assinatura-status-row">
              <span class="icon">ℹ️</span> Aguarde a etapa anterior
            </div>
            <button class="btn-solid" disabled style="opacity:0.4;cursor:not-allowed">✍ Assinar agora</button>
          </div>
        </div>
      </div>
      ${renderTabBar('home')}
    </div>`,

  cadastro: () => `
    <div id="screen-cadastro" class="screen">
      ${renderHeader('Cadastro', true)}
      <div class="panel" style="border-radius:20px 20px 0 0;margin-top:-12px;">
        <p style="text-align:center;font-size:15px;font-weight:600;color:#212121;margin-bottom:8px">Endereço do titular</p>
        <div style="display:flex;gap:4px;margin-bottom:24px">
          ${[0,1,2,3,4,5].map((i,idx) => `<div style="flex:1;height:4px;border-radius:4px;background:${idx===0?'#3a9b28':'#e0e0e0'}"></div>`).join('')}
        </div>
        <div style="display:flex;gap:12px;margin-bottom:14px">
          <div style="flex:1">
            <label style="font-size:10px;font-weight:700;color:#616161;letter-spacing:1px">CEP</label>
            <div class="input-wrap" style="border-radius:8px;margin-top:4px;border:1px solid #e0e0e0">
              <input type="text" value="40250887" maxlength="9" style="font-size:15px"/>
            </div>
          </div>
          <div style="flex:1">
            <label style="font-size:10px;font-weight:700;color:#616161;letter-spacing:1px">UF</label>
            <div class="input-wrap" style="border-radius:8px;margin-top:4px;border:1px solid #e0e0e0">
              <select style="flex:1;font-size:15px;color:#212121"><option>BA</option><option>SP</option><option>RJ</option></select>
              <span style="color:#3a9b28">▾</span>
            </div>
          </div>
        </div>
        ${['CIDADE','BAIRRO','RUA','COMPLEMENTO','PONTO DE REFERÊNCIA'].map(f=>`
          <div style="margin-bottom:14px">
            <label style="font-size:10px;font-weight:700;color:#616161;letter-spacing:1px">${f}</label>
            <div class="input-wrap" style="border-radius:8px;margin-top:4px;border:1px solid #e0e0e0">
              <input type="text" style="font-size:15px"/>
            </div>
          </div>`).join('')}
        <button class="btn-solid" style="margin-top:8px" onclick="navigate('home')">Próximo</button>
      </div>
    </div>`
};

// ===== FATURA CARD RENDERER =====
function renderFaturaCard(f) {
  const isPago = f.status === 'pago';
  return `<div class="fatura-card">
    <div class="fatura-body">
      <div class="fatura-border-left">
        <div class="fatura-stripe ${f.status}"></div>
        <div class="fatura-content">
          <p class="fatura-title">${f.titulo}</p>
          <p class="fatura-due"><span style="font-weight:600">Vencimento</span><br>${f.vencimento}</p>
          <div class="fatura-row">
            <span class="fatura-value">${f.valor}</span>
            <span class="status-badge ${f.status}">
              ${f.status==='atual'?'ⓘ Atual':f.status==='vencido'?'⚠ Vencido':'✓ Pago'}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="fatura-actions">
      ${isPago
        ? `<button class="btn-recibo" onclick="alert('Abrindo recibo...')">🧾 Ver recibo</button>`
        : `<button class="btn-pagar" onclick="alert('Redirecionando para pagamento...')">PAGAR</button>`}
    </div>
  </div>`;
}

// ===== ACCORDION TOGGLE =====
function toggleAccordion(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
  const chev = el.querySelector('.accordion-chevron');
  chev.textContent = el.classList.contains('open') ? '▲' : '▾';
}

// ===== CAROUSEL LOGIC =====
let carouselIndex = 0;
const CAROUSEL_TOTAL = 3;

function carouselNext() {
  if (carouselIndex < CAROUSEL_TOTAL - 1) {
    carouselIndex++;
    const track = document.getElementById('carousel-track');
    if (track) track.style.transform = `translateX(-${carouselIndex * 100}%)`;
    const dots = document.querySelectorAll('.dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === carouselIndex));
    if (carouselIndex === CAROUSEL_TOTAL - 1) {
      document.getElementById('carousel-btn').textContent = 'Começar';
      document.getElementById('carousel-btn').onclick = () => navigate('login');
    }
  } else {
    navigate('login');
  }
}

// ===== LOGIN LOGIC =====
function doLogin() {
  const email = document.getElementById('input-email').value.trim();
  const senha = document.getElementById('input-senha').value.trim();
  if (!email || !senha) { alert('Preencha e-mail e senha.'); return; }
  navigate('home');
}

// ===== BOOT =====
function boot() {
  const app = document.getElementById('app');
  app.innerHTML = Object.values(SCREENS).map(fn => fn()).join('');

  // Make splash first active
  document.getElementById('screen-splash').classList.add('active');

  // Auto-advance splash
  setTimeout(() => navigate('onboarding'), 2200);
}

document.addEventListener('DOMContentLoaded', boot);
