"use client";

import "@/app/styles/cliente-mobile.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import type { ClientePlano } from "@/types/ClientePlano";
import {
  consultarClientePorCpf,
  mapTitularToCarteirinha,
} from "@/services/clienteCarteirinha.service";
import { listarContasDoCliente } from "@/services/financeiro/contasCliente.service";
import { listarVantagensCliente } from "@/services/parcerias.service";
import { API_VERSION, getApiUrl } from "@/config/api-config";
import api from "@/utils/api";
import getTenantFromHost from "@/utils/getTenantFromHost";

import MobileLoginScreen, {
  type AuthView,
  type FirstAccessStep,
  type ForgotStep,
} from "./MobileLoginScreen";
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import CarteirinhaScreen from "./screens/CarteirinhaScreen";
import FaturasScreen from "./screens/FaturasScreen";
import AssinaturasScreen from "./screens/AssinaturasScreen";
import AjustesScreen from "./screens/AjustesScreen";
import AtendimentoScreen from "./screens/AtendimentoScreen";
import EntendaSeuPlanoScreen from "./screens/EntendaSeuPlanoScreen";
import DependentesScreen from "./screens/DependentesScreen";
import ParceriasScreen from "./screens/ParceriasScreen";
import ContratoBlockerOverlay from "./screens/ContratoBlockerOverlay";

/* ===================================================================
   Types
   =================================================================== */

export type TabId = "home" | "atendimento" | "faturas" | "ajustes";
export type ScreenId =
  | TabId
  | "carteirinha"
  | "assinaturas"
  | "entenda-seu-plano"
  | "historico-plano"
  | "dependentes"
  | "parcerias";

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "home", icon: "/cliente-mobile/Vector-8.svg", label: "Início" },
  {
    id: "atendimento",
    icon: "/cliente-mobile/Vector-9.svg",
    label: "Atendimento",
  },
  { id: "faturas", icon: "/cliente-mobile/Vector-11.svg", label: "Faturas" },
  { id: "ajustes", icon: "/cliente-mobile/Vector-10.svg", label: "Ajustes" },
];

const SCREENS_WITH_TABBAR: ScreenId[] = [
  "home",
  "atendimento",
  "faturas",
  "ajustes",
  "assinaturas",
  "carteirinha",
  "entenda-seu-plano",
  "historico-plano",
  "dependentes",
  "parcerias",
];

const DEFAULT_DIAS_SUSPENSAO = 90;
const DEFAULT_DIAS_POS_SUSPENSAO = 92;
const TENANTS_CLIENTE = [
  { slug: "lider", label: "Líder" },
  { slug: "pax", label: "Pax" },
  { slug: "bosque", label: "Bosque" },
] as const;

type TenantCadastro = {
  tenant: (typeof TENANTS_CLIENTE)[number];
  cliente: ClientePlano;
};

function normalizarNavegacaoBloqueada(
  navState: { screen: ScreenId; activeTab: TabId },
  contratosBloqueado: boolean,
): { screen: ScreenId; activeTab: TabId } {
  if (!contratosBloqueado || navState.screen === "assinaturas") {
    return navState;
  }

  return {
    activeTab: "home",
    screen: "assinaturas",
  };
}

/* ===================================================================
   Helpers
   =================================================================== */

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const normalizeCpf = (v: string) => v.replace(/\D/g, "");

function validateCPF(cpf: string): boolean {
  const s = normalizeCpf(cpf);
  if (s.length !== 11 || s === "00000000000") return false;
  let sum = 0;
  for (let i = 1; i <= 9; i++) sum += parseInt(s[i - 1]) * (11 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(s[9])) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(s[i - 1]) * (12 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(s[10]);
}

function validarLoginCliente(value: string): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "Informe CPF ou e-mail.";
  if (isEmail(trimmed)) return null;
  if (validateCPF(normalizeCpf(trimmed))) return null;
  return "Informe um CPF válido (11 dígitos) ou um e-mail válido.";
}

function validatePassword(value: string): string | null {
  if (!value || value.length < 8)
    return "A senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Za-z]/.test(value)) return "A senha deve ter pelo menos 1 letra.";
  if (!/\d/.test(value)) return "A senha deve ter pelo menos 1 número.";
  if (!/[^A-Za-z0-9]/.test(value))
    return "A senha deve ter pelo menos 1 caractere especial.";
  return null;
}

function extractServerMessage(err: unknown): string | null {
  const e = err as {
    response?: {
      data?: { message?: unknown; code?: unknown };
      status?: number;
    };
  };
  return typeof e?.response?.data?.message === "string"
    ? e.response.data.message
    : null;
}

function extractServerCode(err: unknown): string | null {
  const e = err as { response?: { data?: { code?: unknown } } };
  return typeof e?.response?.data?.code === "string"
    ? e.response.data.code
    : null;
}

type PaymentPendingPayload = {
  nome?: string;
  emailMasked?: string;
  telefoneMasked?: string;
  paymentUrl?: string;
  vencimento?: string;
  valor?: number;
};

function getSubdomainFromCurrentHost(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  const parts = host.split(".");
  if (host === "localhost") return null;
  if (host.endsWith(".localhost")) return parts[0] || null;
  if (host.endsWith(".planvita.com.br")) {
    if (parts.length === 3) return null;
    if (parts.length > 3) {
      const sub = parts.slice(0, -3).join(".");
      return sub === "www" ? null : sub;
    }
  }
  return null;
}

/* ===================================================================
   ClienteMobilePage
   =================================================================== */

export default function ClienteMobilePage() {
  /* --- Onboarding (splash + carousel — shown before login) --- */
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  /* --- Tenant --- */
  const subdomainFromHost =
    typeof window !== "undefined" ? getSubdomainFromCurrentHost() : null;
  const [tenantSelecionado, setTenantSelecionado] = useState<string | null>(
    subdomainFromHost,
  );
  const tenantAtivo = tenantSelecionado || getTenantFromHost();
  const isMainDomainClienteRoute = !subdomainFromHost;

  /* --- Auth state --- */
  const [authChecked, setAuthChecked] = useState(false);
  const [cliente, setCliente] = useState<ClientePlano | null>(null);

  /* --- Auth view / flow --- */
  const [authView, setAuthView] = useState<AuthView>("login");

  /* --- Login form --- */
  const [loginValue, setLoginValue] = useState("");
  const [senhaValue, setSenhaValue] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cadastrosEncontrados, setCadastrosEncontrados] = useState<
    TenantCadastro[]
  >([]);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);

  /* --- First access --- */
  const [faStep, setFaStep] = useState<FirstAccessStep>("request");
  const [faLogin, setFaLogin] = useState("");
  const [faOtp, setFaOtp] = useState("");
  const [faVerificationToken, setFaVerificationToken] = useState("");
  const [faPassword, setFaPassword] = useState("");
  const [faPasswordConfirm, setFaPasswordConfirm] = useState("");
  const [faLoading, setFaLoading] = useState(false);
  const [faError, setFaError] = useState<string | null>(null);
  const [faInfo, setFaInfo] = useState<string | null>(null);
  const [faDestination, setFaDestination] = useState<string | null>(null);
  const [faChannel, setFaChannel] = useState<"email" | "whatsapp" | null>(null);

  /* --- Forgot password --- */
  const [fgStep, setFgStep] = useState<ForgotStep>("request");
  const [fgLogin, setFgLogin] = useState("");
  const [fgOtp, setFgOtp] = useState("");
  const [fgVerificationToken, setFgVerificationToken] = useState("");
  const [fgPassword, setFgPassword] = useState("");
  const [fgPasswordConfirm, setFgPasswordConfirm] = useState("");
  const [fgLoading, setFgLoading] = useState(false);
  const [fgError, setFgError] = useState<string | null>(null);
  const [fgInfo, setFgInfo] = useState<string | null>(null);
  const [fgDestination, setFgDestination] = useState<string | null>(null);

  /* --- Cadastro redirect --- */
  const [cadastroMessage, setCadastroMessage] = useState(
    "Não encontramos CPF ou e-mail cadastrado. Finalize seu cadastro para continuar.",
  );

  /* --- Payment pending --- */
  const [ppNome, setPpNome] = useState<string | null>(null);
  const [ppEmailMasked, setPpEmailMasked] = useState<string | null>(null);
  const [ppTelefoneMasked, setPpTelefoneMasked] = useState<string | null>(null);
  const [ppPaymentUrl, setPpPaymentUrl] = useState<string | null>(null);
  const [ppVencimento, setPpVencimento] = useState<string | null>(null);
  const [ppValor, setPpValor] = useState<number | null>(null);
  const [ppLoading, setPpLoading] = useState(false);
  const [ppError, setPpError] = useState<string | null>(null);
  const [ppSucesso, setPpSucesso] = useState(false);

  const populatePaymentPending = useCallback((d: PaymentPendingPayload) => {
    setPpNome(d.nome ?? null);
    setPpEmailMasked(d.emailMasked ?? null);
    setPpTelefoneMasked(d.telefoneMasked ?? null);
    setPpPaymentUrl(d.paymentUrl ?? null);
    setPpVencimento(d.vencimento ?? null);
    setPpValor(d.valor ?? null);
  }, []);

  const loadPaymentPending = useCallback(
    async (login: string, markSuccess = false) => {
      setPpNome(null);
      setPpEmailMasked(null);
      setPpTelefoneMasked(null);
      setPpPaymentUrl(null);
      setPpVencimento(null);
      setPpValor(null);
      setPpError(null);
      setPpSucesso(markSuccess);

      const res = await api.post("/auth/pagamento/reenviar", { login });
      populatePaymentPending(res.data as PaymentPendingPayload);
    },
    [populatePaymentPending],
  );

  /* --- Navigation --- */
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [screen, setScreen] = useState<ScreenId>("home");
  const [abrirFotoModalAoEntrarAjustes, setAbrirFotoModalAoEntrarAjustes] =
    useState(false);
  const [mostrarHistoricoCompletoFaturas, setMostrarHistoricoCompletoFaturas] =
    useState(false);
  const isHandlingPopStateRef = useRef(false);
  const lastHistoryKeyRef = useRef<string | null>(null);
  const historyBootstrappedRef = useRef(false);

  const goTo = useCallback((s: ScreenId) => setScreen(s), []);
  const goBack = useCallback(() => {
    // Em abas principais, "voltar" leva para Home para evitar no-op.
    if (screen === activeTab) {
      if (activeTab !== "home") {
        setActiveTab("home");
        setScreen("home");
        return;
      }
      if (typeof window !== "undefined") window.history.back();
      return;
    }
    // Em sub-telas, volta para a aba ativa.
    setScreen(activeTab);
  }, [activeTab, screen]);
  const changeTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setScreen(tab);
  }, []);
  const goToAjustesComModalFoto = useCallback(() => {
    setAbrirFotoModalAoEntrarAjustes(true);
    setActiveTab("ajustes");
    setScreen("ajustes");
  }, []);

  const selecionarTenant = useCallback((tenant: string) => {
    setTenantSelecionado(tenant);
    if (typeof document !== "undefined") {
      document.cookie = `tenant=${tenant}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  /* --- URL params handled ref --- */
  const urlParamsHandledRef = useRef(false);

  /* ===== Sync subdomain ===== */
  useEffect(() => {
    if (subdomainFromHost) setTenantSelecionado(subdomainFromHost);
  }, [subdomainFromHost]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    const syncViewportHeight = () => {
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--cm-app-height", `${viewportHeight}px`);
    };

    syncViewportHeight();

    const onPageShow = () => syncViewportHeight();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") syncViewportHeight();
    };

    window.addEventListener("resize", syncViewportHeight);
    window.addEventListener("orientationchange", syncViewportHeight);
    window.addEventListener("pageshow", onPageShow);
    window.visualViewport?.addEventListener("resize", syncViewportHeight);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("resize", syncViewportHeight);
      window.removeEventListener("orientationchange", syncViewportHeight);
      window.removeEventListener("pageshow", onPageShow);
      window.visualViewport?.removeEventListener("resize", syncViewportHeight);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      root.style.removeProperty("--cm-app-height");
    };
  }, []);

  /* ===== Handle URL params (primeiro-acesso / reset) ===== */
  useEffect(() => {
    if (typeof window === "undefined" || urlParamsHandledRef.current) return;
    urlParamsHandledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const modo = params.get("modo");
    const loginHint = (params.get("login") || "").trim();
    const tokenFromUrl = (params.get("token") || "").trim();
    const tenantFromUrl = (params.get("tenant") || "").trim().toLowerCase();

    if (tenantFromUrl) {
      setTenantSelecionado(tenantFromUrl);
      document.cookie = `tenant=${tenantFromUrl}; path=/; max-age=31536000; SameSite=Lax`;
    }

    if (modo === "primeiro-acesso") {
      if (tokenFromUrl) {
        setFaVerificationToken(tokenFromUrl);
        setFaStep("set-password");
        setFaInfo("Link validado. Defina sua senha para concluir.");
      }
      if (loginHint) {
        setFaLogin(loginHint);
        setLoginValue(loginHint);
      }
      setAuthView("first-access");
    }

    if (modo === "pagamento-pendente") {
      if (loginHint) {
        setLoginValue(loginHint);
        setFaLogin(loginHint);
      }
      setAuthView("payment-pending");
      if (loginHint) {
        void loadPaymentPending(loginHint).catch(() => {
          setPpError(
            "Nao foi possivel carregar os dados da cobranca. Voce ainda pode reenviar o link abaixo.",
          );
        });
      }
    }

    if (modo === "reset") {
      if (tokenFromUrl) {
        setFgVerificationToken(tokenFromUrl);
        setFgStep("set-password");
        setFgInfo("Link validado. Defina sua nova senha.");
      }
      if (loginHint) {
        setFgLogin(loginHint);
        setLoginValue(loginHint);
      }
      setAuthView("forgot");
    }
  }, [loadPaymentPending]);

  /* ===== Auth check ===== */
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modo = params.get("modo");
      const hasRecovery =
        modo === "reset" ||
        modo === "primeiro-acesso" ||
        Boolean(params.get("token"));
      if (hasRecovery) {
        setAuthChecked(true);
        return;
      }
    }

    let ativo = true;
    setAuthChecked(false);

    api
      .get("/titular/me")
      .then((res) => {
        if (!ativo) return;
        const mapped = mapTitularToCarteirinha(res.data);
        setCliente(mapped);
      })
      .catch(() => {
        /* unauthenticated – stays on login */
      })
      .finally(() => {
        if (ativo) setAuthChecked(true);
      });

    return () => {
      ativo = false;
    };
  }, [tenantAtivo]);

  /* ===== Load cliente after login ===== */
  const carregarCliente = useCallback(async () => {
    const { data } = await api.get("/titular/me");
    const mapped = mapTitularToCarteirinha(data);
    setCliente(mapped);
    setActiveTab("home");
    setScreen("home");
  }, []);

  /* ===== Refresh cliente silently (sem redirecionar) ===== */
  const refreshCliente = useCallback(async () => {
    try {
      const { data } = await api.get("/titular/me");
      const mapped = mapTitularToCarteirinha(data);
      setCliente(mapped);
    } catch {
      /* ignora falha silenciosa */
    }
  }, []);

  const tentarDescobrirCadastrosPorCpf = useCallback(
    async (cpf: string): Promise<TenantCadastro[]> => {
      const consultas = await Promise.allSettled(
        TENANTS_CLIENTE.map(async (tenant) => {
          const clienteEncontrado = await consultarClientePorCpf(cpf, {
            tenant: tenant.slug,
          });
          return { tenant, cliente: clienteEncontrado };
        }),
      );

      return consultas
        .filter(
          (resultado): resultado is PromiseFulfilledResult<TenantCadastro> =>
            resultado.status === "fulfilled",
        )
        .map((resultado) => resultado.value);
    },
    [],
  );

  /* ===================================================================
     Login handler
     ================================================================ */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const loginErr = validarLoginCliente(loginValue);
    if (loginErr) {
      setAuthError(loginErr);
      return;
    }
    if (!senhaValue) {
      setAuthError("Informe sua senha.");
      return;
    }

    setAuthLoading(true);
    try {
      const loginNormalizado = loginValue.trim();
      const cpfDigits = normalizeCpf(loginNormalizado);

      if (
        isMainDomainClienteRoute &&
        !isEmail(loginNormalizado) &&
        validateCPF(cpfDigits)
      ) {
        const encontrados = await tentarDescobrirCadastrosPorCpf(cpfDigits);
        if (encontrados.length > 1) {
          setCadastrosEncontrados(encontrados);
          setModalCadastroAberto(true);
          return;
        }

        if (encontrados.length === 1) {
          selecionarTenant(encontrados[0].tenant.slug);
        }
      }

      await api.post("/auth/login", {
        login: loginNormalizado,
        password: senhaValue,
        audience: "cliente",
      });
      await carregarCliente();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const code = extractServerCode(err);
      if (status === 428 && code === "FIRST_ACCESS_REQUIRED") {
        setFaLogin(loginValue.trim());
        setFaStep("request");
        setFaInfo(
          "Seu cadastro ainda não possui senha. Valide seu acesso e crie uma senha.",
        );
        setAuthView("first-access");
        return;
      }
      if (status === 402 && code === "PAYMENT_REQUIRED") {
        setAuthView("payment-pending");
        try {
          await loadPaymentPending(loginValue.trim());
        } catch {
          // non-fatal — view already shown with "reenviar" option
        }
        return;
      }
      setAuthError("Não foi possível entrar. Verifique seu login e senha.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSelecionarCadastro = useCallback(
    async (cadastro: TenantCadastro) => {
      if (authLoading) return;
      selecionarTenant(cadastro.tenant.slug);
      setModalCadastroAberto(false);
      setCadastrosEncontrados([]);

      setAuthLoading(true);
      setAuthError(null);
      try {
        await api.post("/auth/login", {
          login: loginValue.trim(),
          password: senhaValue,
          audience: "cliente",
        });
        await carregarCliente();
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        const code = extractServerCode(err);
        if (status === 428 && code === "FIRST_ACCESS_REQUIRED") {
          setFaLogin(loginValue.trim());
          setFaStep("request");
          setFaInfo(
            "Seu cadastro ainda não possui senha. Valide seu acesso e crie uma senha.",
          );
          setAuthView("first-access");
          return;
        }
        if (status === 402 && code === "PAYMENT_REQUIRED") {
          setAuthView("payment-pending");
          try {
            await loadPaymentPending(loginValue.trim());
          } catch {
            // non-fatal
          }
          return;
        }
        setAuthError("Não foi possível entrar. Verifique seu login e senha.");
      } finally {
        setAuthLoading(false);
      }
    },
    [
      authLoading,
      carregarCliente,
      loadPaymentPending,
      loginValue,
      selecionarTenant,
      senhaValue,
    ],
  );

  /* ===================================================================
     First access handlers
     ================================================================ */
  const onStartFirstAccess = async (channel?: "email" | "whatsapp") => {
    setFaError(null);
    setFaInfo(null);
    setFaDestination(null);
    const loginErr = validarLoginCliente(faLogin);
    if (loginErr) {
      setFaError(loginErr);
      return;
    }

    setFaLoading(true);
    try {
      const { data } = await api.post("/auth/first-access", {
        login: faLogin.trim(),
        ...(channel ? { channel } : {}),
      });
      const destination =
        data?.start?.destinationMasked || data?.start?.channel || "seu contato";
      setFaDestination(destination);
      setFaChannel(data?.start?.channel === "whatsapp" ? "whatsapp" : "email");
      const devOtp = data?.start?.dev?.otp;
      setFaInfo(devOtp ? `Código (dev): ${devOtp}` : null);
      setFaStep("verify");
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const code = extractServerCode(err);
      const msg = extractServerMessage(err);
      const precisaCadastro =
        code === "FIRST_ACCESS_CONTACT_REQUIRED" ||
        status === 404 ||
        msg === "Cliente não encontrado.";

      if (precisaCadastro) {
        setCadastroMessage(
          msg ||
            "Não encontramos CPF ou e-mail cadastrado. Finalize seu cadastro para continuar.",
        );
        setAuthView("cadastro-redirect");
        return;
      }
      setFaError(msg || "Não foi possível enviar o código.");
    } finally {
      setFaLoading(false);
    }
  };

  const onVerifyFirstAccess = async () => {
    setFaError(null);
    setFaInfo(null);
    if (!faOtp.trim()) {
      setFaError("Informe o código recebido.");
      return;
    }

    setFaLoading(true);
    try {
      const { data } = await api.post("/auth/verify", {
        login: faLogin.trim(),
        otp: faOtp.trim(),
        purpose: "FIRST_ACCESS",
      });
      const token = String(data?.verificationToken ?? "");
      if (!token) {
        setFaError("Não foi possível validar o código.");
        return;
      }
      setFaVerificationToken(token);
      setFaStep("set-password");
    } catch (err) {
      setFaError(extractServerMessage(err) || "Código inválido ou expirado.");
    } finally {
      setFaLoading(false);
    }
  };

  const onCompleteFirstAccess = async () => {
    setFaError(null);
    setFaInfo(null);
    const pwdErr = validatePassword(faPassword);
    if (pwdErr) {
      setFaError(pwdErr);
      return;
    }
    if (faPassword !== faPasswordConfirm) {
      setFaError("As senhas não conferem.");
      return;
    }

    setFaLoading(true);
    try {
      await api.post("/auth/first-access", {
        verificationToken: faVerificationToken,
        password: faPassword,
      });
      const loginForAuto = faLogin.trim();
      if (loginForAuto) {
        setFaInfo("Senha criada com sucesso. Entrando...");
        await api.post("/auth/login", {
          login: loginForAuto,
          password: faPassword,
          audience: "cliente",
        });
        await carregarCliente();
      }
      // Clear params
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.get("modo") === "primeiro-acesso") {
          url.searchParams.delete("modo");
          url.searchParams.delete("login");
          url.searchParams.delete("token");
          window.history.replaceState(
            {},
            "",
            `${url.pathname}${url.search || ""}`,
          );
        }
      }
    } catch (err) {
      setFaError(
        extractServerMessage(err) ||
          "Não foi possível concluir o primeiro acesso.",
      );
    } finally {
      setFaLoading(false);
    }
  };

  /* ===================================================================
     Forgot password handlers
     ================================================================ */
  const onStartForgot = async () => {
    setFgError(null);
    setFgInfo(null);
    setFgDestination(null);
    const loginErr = validarLoginCliente(fgLogin);
    if (loginErr) {
      setFgError(loginErr);
      return;
    }

    setFgLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", {
        login: fgLogin.trim(),
      });
      const destination =
        data?.start?.destinationMasked || data?.start?.channel || "seu contato";
      setFgDestination(destination);
      const devOtp = data?.start?.dev?.otp;
      setFgInfo(
        `Enviamos um código para ${destination}.${devOtp ? ` Código (dev): ${devOtp}` : ""}`,
      );
      setFgStep("verify");
    } catch (err) {
      setFgError(
        extractServerMessage(err) || "Não foi possível iniciar a recuperação.",
      );
    } finally {
      setFgLoading(false);
    }
  };

  const onVerifyForgot = async () => {
    setFgError(null);
    setFgInfo(null);
    if (!fgOtp.trim()) {
      setFgError("Informe o código recebido.");
      return;
    }

    setFgLoading(true);
    try {
      const { data } = await api.post("/auth/verify", {
        login: fgLogin.trim(),
        otp: fgOtp.trim(),
        purpose: "RESET_PASSWORD",
      });
      const token = String(data?.verificationToken ?? "");
      if (!token) {
        setFgError("Não foi possível validar o código.");
        return;
      }
      setFgVerificationToken(token);
      setFgStep("set-password");
    } catch (err) {
      setFgError(extractServerMessage(err) || "Código inválido ou expirado.");
    } finally {
      setFgLoading(false);
    }
  };

  const onCompleteForgot = async () => {
    setFgError(null);
    setFgInfo(null);
    const pwdErr = validatePassword(fgPassword);
    if (pwdErr) {
      setFgError(pwdErr);
      return;
    }
    if (fgPassword !== fgPasswordConfirm) {
      setFgError("As senhas não conferem.");
      return;
    }

    setFgLoading(true);
    try {
      await api.post("/auth/reset-password", {
        verificationToken: fgVerificationToken,
        password: fgPassword,
      });
      setFgInfo("Senha alterada com sucesso.");
      setLoginValue(fgLogin.trim());
      setSenhaValue("");
      setAuthView("login");
    } catch (err) {
      setFgError(
        extractServerMessage(err) || "Não foi possível alterar a senha.",
      );
    } finally {
      setFgLoading(false);
    }
  };

  /* ===================================================================
     Payment pending — reenviar link
     ================================================================ */
  const onReenviarPagamento = useCallback(async () => {
    setPpError(null);
    setPpSucesso(false);
    setPpLoading(true);
    try {
      await loadPaymentPending(loginValue.trim(), true);
      setPpSucesso(true);
    } catch (err) {
      const msg = extractServerMessage(err);
      setPpError(msg ?? "Não foi possível reenviar o link. Tente novamente.");
    } finally {
      setPpLoading(false);
    }
  }, [loadPaymentPending, loginValue]);

  const onVerificarPagamento = useCallback(async () => {
    setPpError(null);
    setPpSucesso(false);

    const login = loginValue.trim();
    const loginErr = validarLoginCliente(login);
    if (loginErr) {
      setPpError(loginErr);
      return;
    }

    setPpLoading(true);
    try {
      setFaLogin(login);
      const { data } = await api.post("/auth/first-access", { login });
      const destination =
        data?.start?.destinationMasked || data?.start?.channel || "seu contato";
      setFaDestination(destination);
      setFaChannel(data?.start?.channel === "whatsapp" ? "whatsapp" : "email");
      const devOtp = data?.start?.dev?.otp;
      setFaInfo(
        devOtp
          ? `Pagamento confirmado. Codigo (dev): ${devOtp}`
          : "Pagamento confirmado. Enviamos um codigo para validar seu primeiro acesso.",
      );
      setFaStep("verify");
      setAuthView("first-access");
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      const code = extractServerCode(err);
      const msg = extractServerMessage(err);

      if (status === 402 && code === "PAYMENT_REQUIRED") {
        setPpError(
          "O pagamento ainda nao foi confirmado. Assim que o webhook atualizar, este botao liberara o primeiro acesso.",
        );
        try {
          await loadPaymentPending(login);
        } catch {
          // keep current state
        }
        return;
      }

      setPpError(msg ?? "Nao foi possivel verificar o pagamento agora.");
    } finally {
      setPpLoading(false);
    }
  }, [loadPaymentPending, loginValue]);

  /* ===================================================================
     Logout
     ================================================================ */
  const handleLogout = useCallback(() => {
    api.post("/auth/logout").catch(() => {});
    setCliente(null);
    setLoginValue("");
    setSenhaValue("");
    setAuthError(null);
    setAuthView("login");
    setActiveTab("home");
    setScreen("home");
  }, []);

  const handleFotoPerfilChange = useCallback((fotoPerfilUrl: string | null) => {
    const proxyUrl = fotoPerfilUrl
      ? `${getApiUrl()}/${API_VERSION}/titular/me/foto/arquivo?t=${Date.now()}`
      : null;
    setCliente((prev) => (prev ? { ...prev, fotoPerfilUrl: proxyUrl } : prev));
  }, []);

  /* ===================================================================
     Financeiro query (used by Home + suspension logic)
     ================================================================ */
  const {
    data: contasFinanceiras = [],
    isLoading: isLoadingFinanceiro,
    error: erroFinanceiro,
  } = useQuery({
    queryKey: [
      "cliente-financeiro-mobile",
      cliente?.titularId ?? "anon",
      mostrarHistoricoCompletoFaturas ? "historico" : "padrao",
    ],
    queryFn: () =>
      listarContasDoCliente({ historico: mostrarHistoricoCompletoFaturas }),
    enabled: Boolean(cliente),
    staleTime: 30 * 1000,
  });

  /* Suspension logic */
  const maxDiasAtraso = useMemo(() => {
    if (!contasFinanceiras.length) return 0;
    const hoje = new Date();
    return contasFinanceiras.reduce((max, c) => {
      const s = String(c.status ?? "").toUpperCase();
      if (["PAGO", "RECEBIDO", "CANCELADO"].includes(s)) return max;
      const diff =
        (hoje.getTime() - new Date(c.vencimento).getTime()) /
        (1000 * 60 * 60 * 24);
      return Math.max(max, diff > 0 ? Math.floor(diff) : 0);
    }, 0);
  }, [contasFinanceiras]);

  const diasSuspensao = DEFAULT_DIAS_SUSPENSAO;
  const diasPosSuspensao = DEFAULT_DIAS_POS_SUSPENSAO;

  const suspensoPorRegra = maxDiasAtraso >= diasSuspensao;
  const posSuspensaoAtingido = maxDiasAtraso >= diasPosSuspensao;

  /* Bloqueio por contrato pendente: ativa assim que o pagamento é confirmado */
  const contratosBloqueado = useMemo(() => {
    if (!cliente?.assinaturasPendentes) return false;
    const confirmadoEm = cliente?.pagamentoConfirmadoEm;
    if (!confirmadoEm) return false;
    return !Number.isNaN(new Date(confirmadoEm).getTime());
  }, [cliente]);

  const clienteExibicao = useMemo<ClientePlano | null>(() => {
    if (!cliente) return null;
    if (cliente.plano.status === "suspenso" || !suspensoPorRegra)
      return cliente;
    return {
      ...cliente,
      plano: { ...cliente.plano, status: "suspenso" },
    };
  }, [cliente, suspensoPorRegra]);

  /* ===== Browser history sync for Android back button ===== */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = (event: PopStateEvent) => {
      const navState = event.state?.clienteMobileNav as
        | { screen?: ScreenId; activeTab?: TabId }
        | undefined;
      if (!navState?.screen || !navState?.activeTab) return;

      const navStateNormalizado = normalizarNavegacaoBloqueada(
        {
          activeTab: navState.activeTab,
          screen: navState.screen,
        },
        contratosBloqueado,
      );

      isHandlingPopStateRef.current = true;
      setActiveTab(navStateNormalizado.activeTab);
      setScreen(navStateNormalizado.screen);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [contratosBloqueado]);

  useEffect(() => {
    if (typeof window === "undefined" || !cliente) return;
    const navState = normalizarNavegacaoBloqueada(
      { screen, activeTab },
      contratosBloqueado,
    );
    const historyKey = `${navState.activeTab}:${navState.screen}`;

    if (!historyBootstrappedRef.current) {
      window.history.replaceState(
        { ...(window.history.state ?? {}), clienteMobileNav: navState },
        "",
      );
      lastHistoryKeyRef.current = historyKey;
      historyBootstrappedRef.current = true;
      return;
    }

    if (isHandlingPopStateRef.current) {
      lastHistoryKeyRef.current = historyKey;
      isHandlingPopStateRef.current = false;
      return;
    }

    if (lastHistoryKeyRef.current === historyKey) return;
    lastHistoryKeyRef.current = historyKey;

    window.history.pushState(
      { ...(window.history.state ?? {}), clienteMobileNav: navState },
      "",
    );
  }, [activeTab, cliente, contratosBloqueado, screen]);

  const { data: parceriasDisponiveis = [] } = useQuery({
    queryKey: ["parcerias", "cliente", "gate"],
    queryFn: () => listarVantagensCliente({ limit: 1 }),
    enabled: Boolean(cliente),
    staleTime: 60_000,
  });
  const hasParcerias = parceriasDisponiveis.length > 0;

  useEffect(() => {
    if (!hasParcerias && screen === "parcerias") {
      setScreen("home");
      setActiveTab("home");
    }
  }, [hasParcerias, screen]);

  const handleContratoTabClick = useCallback(
    (tab: TabId) => {
      if (contratosBloqueado && tab !== "home") return;
      changeTab(tab);
    },
    [contratosBloqueado, changeTab],
  );

  const handleGoToAssinaturas = useCallback(() => {
    goTo("assinaturas");
  }, [goTo]);

  useEffect(() => {
    if (!contratosBloqueado) return;
    if (activeTab !== "home") setActiveTab("home");
    if (screen !== "assinaturas") setScreen("assinaturas");
  }, [activeTab, contratosBloqueado, screen]);

  const goToComBloqueioContrato = useCallback(
    (destino: ScreenId) => {
      if (contratosBloqueado && destino !== "assinaturas") {
        setScreen("assinaturas");
        return;
      }
      goTo(destino);
    },
    [contratosBloqueado, goTo],
  );

  const changeTabComBloqueioContrato = useCallback(
    (tab: TabId) => {
      if (contratosBloqueado) {
        setActiveTab("home");
        setScreen("assinaturas");
        return;
      }
      changeTab(tab);
    },
    [contratosBloqueado, changeTab],
  );

  const goBackComBloqueioContrato = useCallback(() => {
    if (contratosBloqueado) {
      setActiveTab("home");
      setScreen("assinaturas");
      return;
    }
    goBack();
  }, [contratosBloqueado, goBack]);

  const goToAjustesComModalFotoBloqueioContrato = useCallback(() => {
    if (contratosBloqueado) {
      setScreen("assinaturas");
      return;
    }
    goToAjustesComModalFoto();
  }, [contratosBloqueado, goToAjustesComModalFoto]);

  /* ===================================================================
     Render – Onboarding splash / carousel (first visit, unauthenticated)
     ================================================================ */
  if (authChecked && showOnboarding && !cliente) {
    return <SplashScreen onComplete={handleOnboardingComplete} />;
  }

  /* ===================================================================
     Render – Loading state
     ================================================================ */
  if (!authChecked) {
    return (
      <div className="cm-loading" aria-label="Carregando">
        <Loader2 size={32} className="cm-spinner" aria-hidden />
      </div>
    );
  }

  /* ===================================================================
     Render – Unauthenticated
     ================================================================ */
  if (!cliente) {
    return (
      <>
        <MobileLoginScreen
          authView={authView}
          setAuthView={(v) => {
            setAuthView(v);
            /* Reset first-access state when switching away */
            if (v !== "first-access") {
              setFaStep("request");
              setFaOtp("");
              setFaVerificationToken("");
              setFaPassword("");
              setFaPasswordConfirm("");
              setFaDestination(null);
              setFaChannel(null);
              setFaInfo(null);
              setFaError(null);
            }
            /* Reset forgot state when switching away */
            if (v !== "forgot") {
              setFgStep("request");
              setFgOtp("");
              setFgVerificationToken("");
              setFgPassword("");
              setFgPasswordConfirm("");
              setFgDestination(null);
              setFgInfo(null);
              setFgError(null);
            }
          }}
          /* login */
          loginValue={loginValue}
          setLoginValue={setLoginValue}
          senhaValue={senhaValue}
          setSenhaValue={setSenhaValue}
          authLoading={authLoading}
          authError={authError}
          onLoginSubmit={handleLoginSubmit}
          /* first access */
          faStep={faStep}
          faLogin={faLogin}
          setFaLogin={setFaLogin}
          faOtp={faOtp}
          setFaOtp={setFaOtp}
          faPassword={faPassword}
          setFaPassword={setFaPassword}
          faPasswordConfirm={faPasswordConfirm}
          setFaPasswordConfirm={setFaPasswordConfirm}
          faLoading={faLoading}
          faError={faError}
          faInfo={faInfo}
          faDestination={faDestination}
          faChannel={faChannel}
          onStartFirstAccess={onStartFirstAccess}
          onVerifyFirstAccess={onVerifyFirstAccess}
          onCompleteFirstAccess={onCompleteFirstAccess}
          /* forgot */
          fgStep={fgStep}
          fgLogin={fgLogin}
          setFgLogin={setFgLogin}
          fgOtp={fgOtp}
          setFgOtp={setFgOtp}
          fgPassword={fgPassword}
          setFgPassword={setFgPassword}
          fgPasswordConfirm={fgPasswordConfirm}
          setFgPasswordConfirm={setFgPasswordConfirm}
          fgLoading={fgLoading}
          fgError={fgError}
          fgInfo={fgInfo}
          fgDestination={fgDestination}
          onStartForgot={onStartForgot}
          onVerifyForgot={onVerifyForgot}
          onCompleteForgot={onCompleteForgot}
          /* cadastro redirect */
          cadastroMessage={cadastroMessage}
          /* payment pending */
          ppNome={ppNome}
          ppEmailMasked={ppEmailMasked}
          ppTelefoneMasked={ppTelefoneMasked}
          ppPaymentUrl={ppPaymentUrl}
          ppVencimento={ppVencimento}
          ppValor={ppValor}
          ppLoading={ppLoading}
          ppError={ppError}
          ppSucesso={ppSucesso}
          onReenviarPagamento={onReenviarPagamento}
          onVerificarPagamento={onVerificarPagamento}
        />

        {modalCadastroAberto && (
          <div className="cm-tenant-modal-overlay" role="dialog" aria-modal>
            <div className="cm-tenant-modal-card">
              <h2 className="cm-tenant-modal-title">
                Escolha a unidade para acessar
              </h2>
              <p className="cm-tenant-modal-subtitle">
                Este CPF foi encontrado em mais de uma unidade.
              </p>
              <div className="cm-tenant-modal-list">
                {cadastrosEncontrados.map((cadastro) => (
                  <button
                    key={cadastro.tenant.slug}
                    type="button"
                    className="cm-tenant-modal-item"
                    disabled={authLoading}
                    onClick={() => handleSelecionarCadastro(cadastro)}
                  >
                    <span>{cadastro.tenant.label}</span>
                    <small>{cadastro.cliente.nome}</small>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="cm-tenant-modal-cancel"
                onClick={() => setModalCadastroAberto(false)}
                disabled={authLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ===================================================================
     Render – Authenticated shell
     ================================================================ */
  const showTabBar = SCREENS_WITH_TABBAR.includes(screen);
  const tabBarActive: TabId | null = TABS.some((tab) => tab.id === screen)
    ? (screen as TabId)
    : null;

  return (
    <div className="cm-app">
      {/* Overlay de bloqueio por contrato pendente */}
      {contratosBloqueado && screen !== "assinaturas" && (
        <ContratoBlockerOverlay
          nomeCliente={cliente.nome}
          emailCliente={cliente.email}
          telefoneCliente={cliente.telefone}
          onAssinar={handleGoToAssinaturas}
        />
      )}

      {/* Current screen */}
      <div
        className={`cm-content${contratosBloqueado && screen !== "assinaturas" ? " cm-content--bloqueado" : ""}`}
      >
        {screen === "home" && clienteExibicao && (
          <HomeScreen
            cliente={clienteExibicao}
            contasFinanceiras={contasFinanceiras}
            isLoadingFinanceiro={isLoadingFinanceiro}
            suspensoPorRegra={suspensoPorRegra}
            posSuspensaoAtingido={posSuspensaoAtingido}
            diasSuspensao={diasSuspensao}
            diasPosSuspensao={diasPosSuspensao}
            goTo={goToComBloqueioContrato}
            changeTab={changeTabComBloqueioContrato}
            onOpenFotoAjustes={goToAjustesComModalFotoBloqueioContrato}
            onLogout={handleLogout}
            hasParcerias={hasParcerias}
          />
        )}

        {screen === "carteirinha" && clienteExibicao && (
          <CarteirinhaScreen
            cliente={clienteExibicao}
            onBack={goBackComBloqueioContrato}
          />
        )}

        {screen === "faturas" && (
          <FaturasScreen
            contas={contasFinanceiras}
            isLoading={isLoadingFinanceiro}
            errorMessage={
              erroFinanceiro instanceof Error ? erroFinanceiro.message : null
            }
            onBack={goBackComBloqueioContrato}
            mostrarHistoricoCompleto={mostrarHistoricoCompletoFaturas}
            onHistoricoCompletoChange={setMostrarHistoricoCompletoFaturas}
          />
        )}

        {screen === "assinaturas" && (
          <AssinaturasScreen
            titularId={
              typeof cliente.titularId === "number"
                ? cliente.titularId
                : typeof cliente.titularId === "string"
                  ? parseInt(cliente.titularId, 10)
                  : null
            }
            onBack={goBackComBloqueioContrato}
            onAllSigned={refreshCliente}
          />
        )}

        {screen === "atendimento" && (
          <AtendimentoScreen
            onBack={goBackComBloqueioContrato}
            tenantSlug={tenantAtivo}
          />
        )}

        {screen === "ajustes" && (
          <AjustesScreen
            cliente={cliente}
            onLogout={handleLogout}
            onBack={goBackComBloqueioContrato}
            onFotoPerfilChange={handleFotoPerfilChange}
            onPagamentoAlterado={(novoMetodo) => {
              setCliente((prev) =>
                prev
                  ? {
                      ...prev,
                      metodoPagamentoAtual:
                        novoMetodo === "CREDIT_CARD" ||
                        novoMetodo === "PIX" ||
                        novoMetodo === "BOLETO"
                          ? novoMetodo
                          : prev.metodoPagamentoAtual,
                      cartaoPagamento:
                        novoMetodo !== "CREDIT_CARD"
                          ? null
                          : prev.cartaoPagamento,
                    }
                  : prev,
              );
            }}
            openFotoModalOnEnter={abrirFotoModalAoEntrarAjustes}
            onOpenFotoModalHandled={() =>
              setAbrirFotoModalAoEntrarAjustes(false)
            }
          />
        )}

        {screen === "entenda-seu-plano" && clienteExibicao && (
          <EntendaSeuPlanoScreen
            cliente={clienteExibicao}
            onBack={goBackComBloqueioContrato}
          />
        )}

        {screen === "historico-plano" && clienteExibicao && (
          <EntendaSeuPlanoScreen
            cliente={clienteExibicao}
            onBack={goBackComBloqueioContrato}
            initialSection="historico"
            headerTitle="Histórico do Plano"
          />
        )}

        {screen === "dependentes" && clienteExibicao && (
          <DependentesScreen
            cliente={clienteExibicao}
            onBack={goBackComBloqueioContrato}
          />
        )}

        {screen === "parcerias" && hasParcerias && (
          <ParceriasScreen
            onBack={goBackComBloqueioContrato}
            onGoAtendimento={() => changeTabComBloqueioContrato("atendimento")}
          />
        )}
      </div>

      {/* Bottom tab bar — in document flow */}
      {showTabBar && (
        <nav
          className={`cm-tab-bar${contratosBloqueado ? " cm-tab-bar--bloqueado" : ""}`}
          aria-label="Navegação principal"
        >
          {TABS.map((tab) => {
            const tabBloqueada = contratosBloqueado && tab.id !== "home";
            return (
              <button
                key={tab.id}
                type="button"
                className={`cm-tab-btn${tabBarActive === tab.id ? " active" : ""}${tabBloqueada ? " cm-tab-btn--disabled" : ""}`}
                onClick={() => handleContratoTabClick(tab.id)}
                disabled={tabBloqueada}
                aria-current={tabBarActive === tab.id ? "page" : undefined}
                aria-disabled={tabBloqueada}
                title={
                  tabBloqueada
                    ? "Assine o contrato para acessar esta área"
                    : undefined
                }
              >
                <span className="cm-tab-icon">
                  <Image
                    src={tab.icon}
                    alt=""
                    width={24}
                    height={24}
                    aria-hidden
                  />
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
