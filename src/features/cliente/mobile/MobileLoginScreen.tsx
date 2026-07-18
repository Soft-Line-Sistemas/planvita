"use client";

import { Loader2, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";

/* ===================================================================
   Types
   =================================================================== */

export type AuthView =
  | "login"
  | "first-access"
  | "forgot"
  | "cadastro-redirect"
  | "payment-pending";

export type FirstAccessStep = "request" | "verify" | "set-password";
export type ForgotStep = "request" | "verify" | "set-password";

export interface MobileLoginProps {
  authView: AuthView;
  setAuthView: (v: AuthView) => void;

  loginValue: string;
  setLoginValue: (v: string) => void;
  senhaValue: string;
  setSenhaValue: (v: string) => void;
  authLoading: boolean;
  authError: string | null;
  onLoginSubmit: (e: React.FormEvent) => void;

  faStep: FirstAccessStep;
  faLogin: string;
  setFaLogin: (v: string) => void;
  faOtp: string;
  setFaOtp: (v: string) => void;
  faPassword: string;
  setFaPassword: (v: string) => void;
  faPasswordConfirm: string;
  setFaPasswordConfirm: (v: string) => void;
  faLoading: boolean;
  faError: string | null;
  faInfo: string | null;
  faDestination: string | null;
  faChannel: "email" | "whatsapp" | null;
  faWhatsappAvailable: boolean;
  onStartFirstAccess: (channel?: "email" | "whatsapp") => void;
  onVerifyFirstAccess: () => void;
  onCompleteFirstAccess: () => void;

  fgStep: ForgotStep;
  fgLogin: string;
  setFgLogin: (v: string) => void;
  fgOtp: string;
  setFgOtp: (v: string) => void;
  fgPassword: string;
  setFgPassword: (v: string) => void;
  fgPasswordConfirm: string;
  setFgPasswordConfirm: (v: string) => void;
  fgLoading: boolean;
  fgError: string | null;
  fgInfo: string | null;
  fgDestination: string | null;
  onStartForgot: () => void;
  onVerifyForgot: () => void;
  onCompleteForgot: () => void;

  cadastroMessage: string;

  ppNome: string | null;
  ppEmailMasked: string | null;
  ppTelefoneMasked: string | null;
  ppPaymentUrl: string | null;
  ppVencimento: string | null;
  ppValor: number | null;
  ppLoading: boolean;
  ppError: string | null;
  ppSucesso: boolean;
  onReenviarPagamento: () => void;
  onVerificarPagamento: () => void;
}

/* ===================================================================
   Reusable bits
   =================================================================== */

function LogoCard() {
  return (
    <div className="cm-login-logo-card">
      <Image
        src="/cliente-mobile/logo.svg"
        alt="Campo do Bosque"
        width={241}
        height={78}
        priority
      />
    </div>
  );
}

function PillInput({
  iconSrc,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
  error,
  otp,
}: {
  iconSrc: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "numeric" | "tel";
  maxLength?: number;
  error?: boolean;
  otp?: boolean;
}) {
  return (
    <div
      className={`cm-login-input-wrap${error ? " error" : ""}${otp ? " cm-login-input-otp" : ""}`}
    >
      <span className="cm-login-input-icon" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} alt="" />
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
      />
    </div>
  );
}

function ErrBox({ message }: { message: string }) {
  return (
    <div className="cm-alert cm-alert-danger">
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  );
}

function InfoBox({ message }: { message: string }) {
  return (
    <div className="cm-alert cm-alert-info">
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  );
}

function SuccessBox({ message }: { message: string }) {
  return (
    <div className="cm-alert cm-alert-success">
      <CheckCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>{message}</span>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="cm-login-back"
      onClick={onClick}
      aria-label="Voltar"
    >
      <ArrowLeft size={18} />
      <span>Voltar</span>
    </button>
  );
}

/* ===================================================================
   Login view (Login-1 design)
   =================================================================== */

function LoginView({
  loginValue,
  setLoginValue,
  senhaValue,
  setSenhaValue,
  authLoading,
  authError,
  onLoginSubmit,
  setAuthView,
}: Pick<
  MobileLoginProps,
  | "loginValue"
  | "setLoginValue"
  | "senhaValue"
  | "setSenhaValue"
  | "authLoading"
  | "authError"
  | "onLoginSubmit"
  | "setAuthView"
>) {
  return (
    <form onSubmit={onLoginSubmit} className="cm-login-content">
      <div className="cm-login-form-block">
        <h1 className="cm-login-title">
          Faça login para continuar ou crie uma conta
        </h1>

        <PillInput
          iconSrc="/cliente-mobile/Vector-12.svg"
          type="text"
          value={loginValue}
          onChange={setLoginValue}
          placeholder="CPF ou E-mail"
          autoComplete="username"
          inputMode="email"
          error={Boolean(authError)}
        />

        <PillInput
          iconSrc="/cliente-mobile/Vector-13.svg"
          type="password"
          value={senhaValue}
          onChange={setSenhaValue}
          placeholder="Senha"
          autoComplete="current-password"
          error={Boolean(authError)}
        />

        <div className="cm-login-forgot-row">
          <button
            type="button"
            className="cm-login-link"
            onClick={() => setAuthView("forgot")}
          >
            Esqueceu a senha?
          </button>
        </div>

        {authError && <ErrBox message={authError} />}

        <button
          type="submit"
          className="cm-login-btn-primary"
          disabled={authLoading}
        >
          {authLoading ? (
            <>
              <Loader2 size={18} className="cm-spinner" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </button>
      </div>

      <div className="cm-login-footer-stack">
        <p className="cm-login-footer">
          Não tem uma conta?
          <button
            type="button"
            className="cm-login-footer-link"
            onClick={() => {
              window.location.href = "/cliente/cadastro";
            }}
          >
            Crie uma agora!
          </button>
        </p>
        <button
          type="button"
          className="cm-login-link cm-login-link-strong"
          onClick={() => setAuthView("first-access")}
        >
          Primeiro acesso
        </button>
      </div>
    </form>
  );
}

/* ===================================================================
   First Access view
   =================================================================== */

function FirstAccessView({
  faStep,
  faLogin,
  setFaLogin,
  faOtp,
  setFaOtp,
  faPassword,
  setFaPassword,
  faPasswordConfirm,
  setFaPasswordConfirm,
  faLoading,
  faError,
  faInfo,
  faDestination,
  faChannel,
  faWhatsappAvailable,
  onStartFirstAccess,
  onVerifyFirstAccess,
  onCompleteFirstAccess,
  setAuthView,
}: Pick<
  MobileLoginProps,
  | "faStep"
  | "faLogin"
  | "setFaLogin"
  | "faOtp"
  | "setFaOtp"
  | "faPassword"
  | "setFaPassword"
  | "faPasswordConfirm"
  | "setFaPasswordConfirm"
  | "faLoading"
  | "faError"
  | "faInfo"
  | "faDestination"
  | "faChannel"
  | "faWhatsappAvailable"
  | "onStartFirstAccess"
  | "onVerifyFirstAccess"
  | "onCompleteFirstAccess"
  | "setAuthView"
>) {
  const panelPb = "max(env(safe-area-inset-bottom, 0px), 32px)";

  return (
    <>
      <div className="cm-app-header">
        <button
          type="button"
          className="cm-btn-back"
          onClick={() => setAuthView("login")}
          aria-label="Voltar"
        >
          <Image
            src="/cliente-mobile/Vector-30.svg"
            alt=""
            width={20}
            height={17}
            aria-hidden
          />
        </button>
        <h1>Primeiro acesso</h1>
      </div>

      <div
        className="cm-panel cm-alterar-senha-panel"
        style={{ paddingBottom: panelPb }}
      >
        {faStep === "request" && (
          <>
            <div className="cm-alterar-senha-heading">
              <Image
                src="/cliente-mobile/Vector-21.svg"
                alt=""
                width={22}
                height={26}
                aria-hidden
              />
              <h2>Validação de identidade</h2>
            </div>

            <div className="cm-alterar-senha-criteria">
              <p className="cm-alterar-senha-criteria-title">Como funciona:</p>
              <ul className="cm-alterar-senha-criteria-list">
                <li>Informe seu CPF ou e-mail cadastrado;</li>
                <li>
                  Escolha se deseja receber o código por e-mail ou WhatsApp;
                </li>
                <li>Valide o código e crie sua senha de acesso.</li>
              </ul>
            </div>

            <div className="cm-alterar-senha-form">
              <input
                type="text"
                className="cm-input"
                value={faLogin}
                onChange={(e) => setFaLogin(e.target.value)}
                placeholder="CPF ou E-mail"
                autoComplete="username"
                inputMode="email"
              />

              {faInfo && <InfoBox message={faInfo} />}
              {faError && <ErrBox message={faError} />}

              <button
                type="button"
                className={
                  faWhatsappAvailable
                    ? "cm-btn-outline"
                    : "cm-btn-solid cm-alterar-senha-submit"
                }
                disabled={faLoading}
                onClick={() => onStartFirstAccess("email")}
              >
                {faLoading ? (
                  <>
                    <Loader2 size={18} className="cm-spinner" />
                    Enviando...
                  </>
                ) : (
                  "Receber por e-mail"
                )}
              </button>

              {faWhatsappAvailable && (
                <button
                  type="button"
                  className="cm-btn-solid cm-alterar-senha-submit"
                  disabled={faLoading}
                  onClick={() => onStartFirstAccess("whatsapp")}
                >
                  {faLoading ? (
                    <>
                      <Loader2 size={18} className="cm-spinner" />
                      Enviando...
                    </>
                  ) : (
                    "Receber por WhatsApp"
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {faStep === "verify" && (
          <>
            <div className="cm-alterar-senha-heading">
              <Image
                src="/cliente-mobile/Vector-21.svg"
                alt=""
                width={22}
                height={26}
                aria-hidden
              />
              <h2>Validar código</h2>
            </div>

            <div className="cm-alterar-senha-criteria">
              <p className="cm-alterar-senha-criteria-title">Instruções:</p>
              <ul className="cm-alterar-senha-criteria-list">
                <li>
                  Código enviado para{" "}
                  <strong>{faDestination ?? "seu contato"}</strong>;
                </li>
                <li>Digite os 6 dígitos no campo abaixo;</li>
                <li>O código expira em alguns minutos.</li>
              </ul>
            </div>

            <div className="cm-alterar-senha-form">
              <input
                type="text"
                className="cm-input cm-input-otp"
                value={faOtp}
                onChange={(e) => setFaOtp(e.target.value)}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
              />

              {faInfo && <InfoBox message={faInfo} />}
              {faError && <ErrBox message={faError} />}

              {faChannel !== "whatsapp" && (
                <button
                  type="button"
                  className="cm-btn-outline cm-alterar-senha-submit"
                  disabled={faLoading}
                  onClick={() => onStartFirstAccess("whatsapp")}
                >
                  Reenviar via WhatsApp
                </button>
              )}

              <button
                type="button"
                className="cm-btn-solid cm-alterar-senha-submit"
                disabled={faLoading}
                onClick={onVerifyFirstAccess}
              >
                {faLoading ? (
                  <>
                    <Loader2 size={18} className="cm-spinner" />
                    Validando...
                  </>
                ) : (
                  "Validar código"
                )}
              </button>
            </div>
          </>
        )}

        {faStep === "set-password" && (
          <>
            <div className="cm-alterar-senha-heading">
              <Image
                src="/cliente-mobile/Vector-21.svg"
                alt=""
                width={22}
                height={26}
                aria-hidden
              />
              <h2>Crie sua senha de acesso</h2>
            </div>

            <div className="cm-alterar-senha-criteria">
              <p className="cm-alterar-senha-criteria-title">
                Critérios da senha:
              </p>
              <ul className="cm-alterar-senha-criteria-list">
                <li>Letra maiúscula no primeiro caractere;</li>
                <li>No mínimo 1 número;</li>
                <li>No mínimo 1 letra minúscula;</li>
                <li>No mínimo 1 caractere especial válido (@$#);</li>
                <li>Total de 8 caracteres válidos;</li>
              </ul>
            </div>

            <div className="cm-alterar-senha-form">
              <input
                type="password"
                className="cm-input"
                value={faPassword}
                onChange={(e) => setFaPassword(e.target.value)}
                placeholder="Nova senha"
                autoComplete="new-password"
              />
              <input
                type="password"
                className="cm-input"
                value={faPasswordConfirm}
                onChange={(e) => setFaPasswordConfirm(e.target.value)}
                placeholder="Confirmar a nova senha"
                autoComplete="new-password"
              />

              {faInfo && <SuccessBox message={faInfo} />}
              {faError && <ErrBox message={faError} />}

              <button
                type="button"
                className="cm-btn-solid cm-alterar-senha-submit"
                disabled={faLoading}
                onClick={onCompleteFirstAccess}
              >
                {faLoading ? (
                  <>
                    <Loader2 size={18} className="cm-spinner" />
                    Salvando...
                  </>
                ) : (
                  "Criar senha e entrar"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ===================================================================
   Forgot Password view
   =================================================================== */

function ForgotView({
  fgStep,
  fgLogin,
  setFgLogin,
  fgOtp,
  setFgOtp,
  fgPassword,
  setFgPassword,
  fgPasswordConfirm,
  setFgPasswordConfirm,
  fgLoading,
  fgError,
  fgInfo,
  fgDestination,
  onStartForgot,
  onVerifyForgot,
  onCompleteForgot,
  setAuthView,
}: Pick<
  MobileLoginProps,
  | "fgStep"
  | "fgLogin"
  | "setFgLogin"
  | "fgOtp"
  | "setFgOtp"
  | "fgPassword"
  | "setFgPassword"
  | "fgPasswordConfirm"
  | "setFgPasswordConfirm"
  | "fgLoading"
  | "fgError"
  | "fgInfo"
  | "fgDestination"
  | "onStartForgot"
  | "onVerifyForgot"
  | "onCompleteForgot"
  | "setAuthView"
>) {
  const panelPb = "max(env(safe-area-inset-bottom, 0px), 32px)";

  return (
    <>
      <div className="cm-app-header">
        <button
          type="button"
          className="cm-btn-back"
          onClick={() => setAuthView("login")}
          aria-label="Voltar"
        >
          <Image
            src="/cliente-mobile/Vector-30.svg"
            alt=""
            width={20}
            height={17}
            aria-hidden
          />
        </button>
        <h1>Recuperar senha</h1>
      </div>

      <div
        className="cm-panel cm-alterar-senha-panel"
        style={{ paddingBottom: panelPb }}
      >
        {fgStep === "request" && (
          <>
            <div className="cm-alterar-senha-heading">
              <Image
                src="/cliente-mobile/Vector-21.svg"
                alt=""
                width={22}
                height={26}
                aria-hidden
              />
              <h2>Redefinição de senha</h2>
            </div>

            <div className="cm-alterar-senha-criteria">
              <p className="cm-alterar-senha-criteria-title">Como funciona:</p>
              <ul className="cm-alterar-senha-criteria-list">
                <li>Informe seu CPF ou e-mail cadastrado;</li>
                <li>Enviaremos um código de verificação;</li>
                <li>Valide o código e defina sua nova senha.</li>
              </ul>
            </div>

            <div className="cm-alterar-senha-form">
              <input
                type="text"
                className="cm-input"
                value={fgLogin}
                onChange={(e) => setFgLogin(e.target.value)}
                placeholder="CPF ou E-mail"
                autoComplete="username"
                inputMode="email"
              />

              {fgInfo && <InfoBox message={fgInfo} />}
              {fgError && <ErrBox message={fgError} />}

              <button
                type="button"
                className="cm-btn-solid cm-alterar-senha-submit"
                disabled={fgLoading}
                onClick={onStartForgot}
              >
                {fgLoading ? (
                  <>
                    <Loader2 size={18} className="cm-spinner" />
                    Enviando...
                  </>
                ) : (
                  "Enviar código"
                )}
              </button>
            </div>
          </>
        )}

        {fgStep === "verify" && (
          <>
            <div className="cm-alterar-senha-heading">
              <Image
                src="/cliente-mobile/Vector-21.svg"
                alt=""
                width={22}
                height={26}
                aria-hidden
              />
              <h2>Validar código</h2>
            </div>

            <div className="cm-alterar-senha-criteria">
              <p className="cm-alterar-senha-criteria-title">Instruções:</p>
              <ul className="cm-alterar-senha-criteria-list">
                <li>
                  Código enviado para{" "}
                  <strong>{fgDestination ?? "seu contato"}</strong>;
                </li>
                <li>Digite os 6 dígitos no campo abaixo;</li>
                <li>O código expira em alguns minutos.</li>
              </ul>
            </div>

            <div className="cm-alterar-senha-form">
              <input
                type="text"
                className="cm-input cm-input-otp"
                value={fgOtp}
                onChange={(e) => setFgOtp(e.target.value)}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
              />

              {fgInfo && <InfoBox message={fgInfo} />}
              {fgError && <ErrBox message={fgError} />}

              <button
                type="button"
                className="cm-btn-solid cm-alterar-senha-submit"
                disabled={fgLoading}
                onClick={onVerifyForgot}
              >
                {fgLoading ? (
                  <>
                    <Loader2 size={18} className="cm-spinner" />
                    Validando...
                  </>
                ) : (
                  "Validar código"
                )}
              </button>
            </div>
          </>
        )}

        {fgStep === "set-password" && (
          <>
            <div className="cm-alterar-senha-heading">
              <Image
                src="/cliente-mobile/Vector-21.svg"
                alt=""
                width={22}
                height={26}
                aria-hidden
              />
              <h2>Crie sua nova senha de acesso</h2>
            </div>

            <div className="cm-alterar-senha-criteria">
              <p className="cm-alterar-senha-criteria-title">
                Critérios da senha:
              </p>
              <ul className="cm-alterar-senha-criteria-list">
                <li>Letra maiúscula no primeiro caractere;</li>
                <li>No mínimo 1 número;</li>
                <li>No mínimo 1 letra minúscula;</li>
                <li>No mínimo 1 caractere especial válido (@$#);</li>
                <li>Total de 8 caracteres válidos;</li>
              </ul>
            </div>

            <div className="cm-alterar-senha-form">
              <input
                type="password"
                className="cm-input"
                value={fgPassword}
                onChange={(e) => setFgPassword(e.target.value)}
                placeholder="Nova senha"
                autoComplete="new-password"
              />
              <input
                type="password"
                className="cm-input"
                value={fgPasswordConfirm}
                onChange={(e) => setFgPasswordConfirm(e.target.value)}
                placeholder="Confirmar a nova senha"
                autoComplete="new-password"
              />

              {fgInfo && <SuccessBox message={fgInfo} />}
              {fgError && <ErrBox message={fgError} />}

              <button
                type="button"
                className="cm-btn-solid cm-alterar-senha-submit"
                disabled={fgLoading}
                onClick={onCompleteForgot}
              >
                {fgLoading ? (
                  <>
                    <Loader2 size={18} className="cm-spinner" />
                    Salvando...
                  </>
                ) : (
                  "Alterar senha"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

/* ===================================================================
   Cadastro redirect view
   =================================================================== */

function CadastroRedirectView({
  cadastroMessage,
  setAuthView,
}: {
  cadastroMessage: string;
  setAuthView: (v: AuthView) => void;
}) {
  return (
    <>
      <BackButton onClick={() => setAuthView("login")} />

      <div
        className="cm-login-content"
        style={{ alignItems: "center", textAlign: "center" }}
      >
        <div
          className="cm-login-flow-icon"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 4px",
          }}
        >
          <AlertCircle color="#fff" size={32} />
        </div>

        <h1 className="cm-login-flow-title">Cadastro necessário</h1>
        <p className="cm-login-flow-sub">{cadastroMessage}</p>

        <button
          type="button"
          className="cm-login-btn-primary"
          onClick={() => {
            window.location.href = "/cliente/cadastro";
          }}
        >
          Ir para cadastro
        </button>

        <button
          type="button"
          className="cm-login-btn-secondary"
          onClick={() => setAuthView("login")}
        >
          Agora não
        </button>
      </div>
    </>
  );
}

/* ===================================================================
   Payment Pending view
   =================================================================== */

function PaymentPendingView({
  ppNome,
  ppEmailMasked,
  ppTelefoneMasked,
  ppPaymentUrl,
  ppVencimento,
  ppValor,
  ppLoading,
  ppError,
  ppSucesso,
  onReenviarPagamento,
  onVerificarPagamento,
  setAuthView,
}: Pick<
  MobileLoginProps,
  | "ppNome"
  | "ppEmailMasked"
  | "ppTelefoneMasked"
  | "ppPaymentUrl"
  | "ppVencimento"
  | "ppValor"
  | "ppLoading"
  | "ppError"
  | "ppSucesso"
  | "onReenviarPagamento"
  | "onVerificarPagamento"
  | "setAuthView"
>) {
  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("pt-BR");
  };

  const shouldShowResend = (() => {
    if (!ppPaymentUrl) return true;
    if (!ppVencimento) return false;
    const dueDate = new Date(ppVencimento);
    if (isNaN(dueDate.getTime())) return false;
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  })();

  return (
    <>
      <BackButton onClick={() => setAuthView("login")} />

      <div className="cm-login-content" style={{ gap: 16 }}>
        <div
          className="cm-login-flow-icon"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 4px",
          }}
        >
          <AlertCircle color="#fff" size={32} />
        </div>

        <h1 className="cm-login-flow-title">Pagamento pendente</h1>

        {ppNome && (
          <p className="cm-login-flow-sub">
            Olá, <strong>{ppNome}</strong>! Encontramos seu cadastro, mas o
            pagamento de adesão ainda não foi confirmado.
          </p>
        )}
        <p
          className="cm-login-flow-sub"
          style={{ opacity: 0.85, fontSize: 13 }}
        >
          Este pagamento refere-se à mensalidade do seu plano de assistência
          funeral contratado com Campo do Bosque.
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            width: "100%",
          }}
        >
          {ppEmailMasked && (
            <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>
              📧 {ppEmailMasked}
            </p>
          )}
          {ppTelefoneMasked && (
            <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>
              📱 {ppTelefoneMasked}
            </p>
          )}
          {ppValor !== null && (
            <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>
              💰 {formatCurrency(ppValor)}
            </p>
          )}
          {ppVencimento && (
            <p style={{ color: "#fff", fontSize: 14, margin: 0 }}>
              📅 Vencimento: {formatDate(ppVencimento)}
            </p>
          )}
        </div>

        {ppPaymentUrl && (
          <a
            href={ppPaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cm-login-btn-primary"
            style={{ textDecoration: "none", textAlign: "center" }}
          >
            Pagar agora
          </a>
        )}

        {ppSucesso && (
          <SuccessBox message="Novo link de pagamento enviado! Verifique seu e-mail ou WhatsApp." />
        )}

        {shouldShowResend && (
          <button
            type="button"
            className="cm-login-btn-secondary"
            disabled={ppLoading}
            onClick={onReenviarPagamento}
          >
            {ppLoading ? (
              <>
                <Loader2 size={18} className="cm-spinner" />
                Enviando...
              </>
            ) : (
              "Reenviar link"
            )}
          </button>
        )}

        <button
          type="button"
          className="cm-login-btn-secondary"
          disabled={ppLoading}
          onClick={onVerificarPagamento}
        >
          {ppLoading ? (
            <>
              <Loader2 size={18} className="cm-spinner" />
              Verificando...
            </>
          ) : (
            "Ja paguei, liberar primeiro acesso"
          )}
        </button>

        {ppError && <ErrBox message={ppError} />}

        <button
          type="button"
          className="cm-login-btn-secondary"
          onClick={() => setAuthView("login")}
        >
          Voltar ao login
        </button>
      </div>
    </>
  );
}

/* ===================================================================
   MobileLoginScreen (root)
   =================================================================== */

export default function MobileLoginScreen(props: MobileLoginProps) {
  const { authView, setAuthView } = props;
  const hideLogoCard = authView === "forgot" || authView === "first-access";

  return (
    <div
      className="cm-login-bg"
      style={{
        position: "relative",
        paddingBottom: hideLogoCard ? 0 : undefined,
      }}
    >
      {!hideLogoCard && <LogoCard />}

      <div
        key={authView}
        className="cm-fade-up"
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        {authView === "login" && <LoginView {...props} />}
        {authView === "first-access" && <FirstAccessView {...props} />}
        {authView === "forgot" && <ForgotView {...props} />}
        {authView === "cadastro-redirect" && (
          <CadastroRedirectView
            cadastroMessage={props.cadastroMessage}
            setAuthView={setAuthView}
          />
        )}
        {authView === "payment-pending" && (
          <PaymentPendingView
            ppNome={props.ppNome}
            ppEmailMasked={props.ppEmailMasked}
            ppTelefoneMasked={props.ppTelefoneMasked}
            ppPaymentUrl={props.ppPaymentUrl}
            ppVencimento={props.ppVencimento}
            ppValor={props.ppValor}
            ppLoading={props.ppLoading}
            ppError={props.ppError}
            ppSucesso={props.ppSucesso}
            onReenviarPagamento={props.onReenviarPagamento}
            onVerificarPagamento={props.onVerificarPagamento}
            setAuthView={setAuthView}
          />
        )}
      </div>
    </div>
  );
}
