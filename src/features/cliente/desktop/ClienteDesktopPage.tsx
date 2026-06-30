"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Loader2,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  History,
  Barcode,
  Copy,
  QrCode,
  ExternalLink,
  Calendar as CalendarIcon,
  PenTool,
  Save,
  CreditCard,
  Users,
  IdCard,
  PenLine,
  ShieldCheck,
  HeartHandshake,
  BadgeCheck,
  Flower2,
  Headset,
  Settings,
  Gift,
  BookOpen,
  Phone,
  MessageCircle,
  LogOut,
  KeyRound,
  ArrowRight,
  Tag,
  Lock,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCPF } from "@/helpers/formHelpers";
import type { ClientePlano } from "@/types/ClientePlano";
import {
  consultarClientePorCpf,
  mapTitularToCarteirinha,
} from "@/services/clienteCarteirinha.service";
import CarteirinhaAsImage from "@/components/CarteirinhaAsImage";
import { useQuery } from "@tanstack/react-query";
import { listarContasDoCliente } from "@/services/financeiro/contasCliente.service";
import { reconsultarContaReceber } from "@/services/financeiro/contas.service";
import {
  listarAssinaturas,
  salvarAssinatura,
  type AssinaturaDigital,
} from "@/services/assinaturas-cliente.service";
import getTenantFromHost from "@/utils/getTenantFromHost";
import SignaturePad, {
  type SignaturePadHandle,
} from "@/components/SignaturePad";
import Image from "next/image";
import { AsaasWingsMark } from "@/components/ui/AsaasWingsMark";
import api from "@/utils/api";
import { formatDatePtBr } from "@/utils/date";
import {
  listarVantagensCliente,
  listarCategoriasCliente,
  obterVantagemCliente,
  registrarResgate,
} from "@/services/parcerias.service";
import {
  alterarPagamentoCliente,
  type CreditCardPayload,
  type MetodoPagamentoBillingType,
} from "@/services/cliente-pagamento.service";
import { changePassword } from "@/services/auth-cliente.service";
import type { ParceriaVantagemResumo } from "@/types/Parcerias";

const normalizeCpf = (value: string) => value.replace(/\D/g, "");

const validateCPF = (cpf: string): boolean => {
  const strCPF = normalizeCpf(cpf);
  if (strCPF.length !== 11) return false;

  let soma;
  let resto;
  soma = 0;

  if (strCPF === "00000000000") return false;

  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(strCPF.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(strCPF.substring(10, 11))) return false;

  return true;
};

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validatePassword = (value: string): string | null => {
  if (!value || value.length < 8)
    return "A senha deve ter no mínimo 8 caracteres.";
  if (!/[A-Za-z]/.test(value)) return "A senha deve ter pelo menos 1 letra.";
  if (!/\d/.test(value)) return "A senha deve ter pelo menos 1 número.";
  if (!/[^A-Za-z0-9]/.test(value))
    return "A senha deve ter pelo menos 1 caractere especial.";
  return null;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });

const formatDate = (value: string) => {
  return formatDatePtBr(value, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatBirthDate = (isoDate?: string | null) => {
  if (!isoDate) return "—";
  return formatDatePtBr(isoDate);
};

const getAgeFromBirthDate = (isoDate?: string | null) => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const TIPOS_ASSINATURA = [
  { id: "TITULAR_ASSINATURA_1", label: "Titular - Assinatura 1" },
  { id: "TITULAR_ASSINATURA_2", label: "Titular - Assinatura 2" },
  { id: "CORRESPONSAVEL_ASSINATURA_1", label: "Responsável financeiro - 1" },
  { id: "CORRESPONSAVEL_ASSINATURA_2", label: "Responsável financeiro - 2" },
] as const;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
const CONTRATO_URL = API_BASE_URL
  ? `${API_BASE_URL}/${API_VERSION}/titular/me/contrato/arquivo?format=pdf`
  : "/docs/contrato.docx";
const ENABLE_LEGACY_QUICK_ACCESS =
  process.env.NEXT_PUBLIC_ENABLE_LEGACY_QUICK_ACCESS === "true";
const ASSINATURA_API_BASE = API_BASE_URL
  ? `${API_BASE_URL}/${API_VERSION}`
  : undefined;
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

const getSubdomainFromCurrentHost = (): string | null => {
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
};

const buildClienteUrlByUnidade = (
  unidade: string,
  cpfValue?: string,
): string => {
  if (typeof window === "undefined") return `/cliente`;

  const { protocol, hostname, port } = window.location;
  const host = hostname.toLowerCase();
  let baseUrl = "";

  if (host.endsWith(".localhost")) {
    const portPart = port ? `:${port}` : "";
    baseUrl = `${protocol}//${unidade}.localhost${portPart}/cliente`;
  } else if (host === "localhost") {
    const portPart = port ? `:${port}` : "";
    baseUrl = `${protocol}//${unidade}.localhost${portPart}/cliente`;
  } else if (host.endsWith(".planvita.com.br") || host === "planvita.com.br") {
    baseUrl = `${protocol}//${unidade}.planvita.com.br/cliente`;
  } else {
    baseUrl = `${protocol}//${unidade}.${host}/cliente`;
  }

  if (!cpfValue) return baseUrl;

  const digitsOnly = cpfValue.replace(/\D/g, "");
  const url = new URL(baseUrl);
  url.searchParams.set("cpf", digitsOnly);
  return url.toString();
};

export default function ConsultaClientePage() {
  const subdomainFromHost =
    typeof window !== "undefined" ? getSubdomainFromCurrentHost() : null;
  const isMainDomainClienteRoute = !subdomainFromHost;
  const [cpf, setCpf] = useState("");
  const [cliente, setCliente] = useState<ClientePlano | null>(null);
  const [tenantSelecionado, setTenantSelecionado] = useState<string | null>(
    subdomainFromHost,
  );
  const [cadastrosEncontrados, setCadastrosEncontrados] = useState<
    TenantCadastro[]
  >([]);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<
    | "carteirinha"
    | "plano"
    | "dependentes"
    | "financeiro"
    | "assinaturas"
    | "atendimento"
    | "parcerias"
    | "ajustes"
  >("carteirinha");
  const [assinaturaEmProgresso, setAssinaturaEmProgresso] = useState<
    string | null
  >(null);
  const [assinaturaMensagem, setAssinaturaMensagem] = useState<string | null>(
    null,
  );
  const [baixandoContrato, setBaixandoContrato] = useState(false);
  const autoBuscaExecutadaRef = useRef(false);
  const tenantAtivo = tenantSelecionado || getTenantFromHost();
  const [authChecked, setAuthChecked] = useState(false);
  const [loginValue, setLoginValue] = useState("");
  const [senhaValue, setSenhaValue] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mostrarAcessoRapido, setMostrarAcessoRapido] = useState(false);

  const [firstAccessOpen, setFirstAccessOpen] = useState(false);
  const [firstAccessStep, setFirstAccessStep] = useState<
    "request" | "verify" | "setPassword"
  >("request");
  const [firstAccessLogin, setFirstAccessLogin] = useState("");
  const [firstAccessOtp, setFirstAccessOtp] = useState("");
  const [firstAccessVerificationToken, setFirstAccessVerificationToken] =
    useState<string>("");
  const [firstAccessPassword, setFirstAccessPassword] = useState("");
  const [firstAccessPasswordConfirm, setFirstAccessPasswordConfirm] =
    useState("");
  const [firstAccessInfo, setFirstAccessInfo] = useState<string | null>(null);
  const [firstAccessDestination, setFirstAccessDestination] = useState<
    string | null
  >(null);
  const [firstAccessChannel, setFirstAccessChannel] = useState<
    "email" | "whatsapp" | null
  >(null);
  const [firstAccessError, setFirstAccessError] = useState<string | null>(null);
  const [firstAccessLoading, setFirstAccessLoading] = useState(false);
  const [cadastroRedirectOpen, setCadastroRedirectOpen] = useState(false);
  const [cadastroRedirectMessage, setCadastroRedirectMessage] = useState(
    "Não encontramos CPF ou e-mail cadastrado para concluir o primeiro acesso. Finalize seu cadastro para continuar.",
  );

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<
    "request" | "verify" | "setPassword"
  >("request");
  const [forgotLogin, setForgotLogin] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotVerificationToken, setForgotVerificationToken] =
    useState<string>("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotPasswordConfirm, setForgotPasswordConfirm] = useState("");
  const [forgotInfo, setForgotInfo] = useState<string | null>(null);
  const [forgotDestination, setForgotDestination] = useState<string | null>(
    null,
  );
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Filtros Financeiro
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todos");
  const [mensagemFinanceiro, setMensagemFinanceiro] = useState<string | null>(
    null,
  );
  const [pixSelecionado, setPixSelecionado] = useState<{
    descricao: string;
    valor: number;
    vencimento: string;
    codigo: string;
  } | null>(null);

  const handleDownloadContrato = useCallback(async () => {
    setBaixandoContrato(true);
    try {
      const response = await fetch(CONTRATO_URL, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Não foi possível gerar o contrato em PDF.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "contrato-assinado.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setAssinaturaMensagem(
        error instanceof Error ? error.message : "Falha ao baixar contrato.",
      );
    } finally {
      setBaixandoContrato(false);
    }
  }, []);

  const resetFirstAccessState = useCallback(() => {
    setFirstAccessStep("request");
    setFirstAccessOtp("");
    setFirstAccessVerificationToken("");
    setFirstAccessPassword("");
    setFirstAccessPasswordConfirm("");
    setFirstAccessDestination(null);
    setFirstAccessChannel(null);
    setFirstAccessInfo(null);
    setFirstAccessError(null);
  }, []);

  const clearFirstAccessQueryParams = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const modo = url.searchParams.get("modo");
    if (modo !== "primeiro-acesso") return;

    url.searchParams.delete("modo");
    url.searchParams.delete("login");
    url.searchParams.delete("token");
    const query = url.searchParams.toString();
    const nextUrl = `${url.pathname}${query ? `?${query}` : ""}${url.hash}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  useEffect(() => {
    if (subdomainFromHost) {
      setTenantSelecionado(subdomainFromHost);
    }
  }, [subdomainFromHost]);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
      setFirstAccessOpen(true);
      setFirstAccessStep(tokenFromUrl ? "setPassword" : "request");
      if (tokenFromUrl) {
        setFirstAccessVerificationToken(tokenFromUrl);
        setFirstAccessInfo("Link validado. Defina sua nova senha.");
      }
      if (loginHint) {
        setFirstAccessLogin(loginHint);
        setLoginValue(loginHint);
      }
    }

    if (modo === "reset") {
      setForgotOpen(true);
      setForgotStep(tokenFromUrl ? "setPassword" : "request");
      if (tokenFromUrl) {
        setForgotVerificationToken(tokenFromUrl);
        setForgotInfo("Link validado. Defina sua nova senha.");
      }
      if (loginHint) {
        setForgotLogin(loginHint);
        setLoginValue(loginHint);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modo = params.get("modo");
      const hasRecoveryContext =
        modo === "reset" ||
        modo === "primeiro-acesso" ||
        Boolean(params.get("token"));

      if (hasRecoveryContext) {
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
        setCpf(mapped.cpf);
      })
      .catch(() => {
        if (!ativo) return;
      })
      .finally(() => {
        if (ativo) setAuthChecked(true);
      });

    return () => {
      ativo = false;
    };
  }, [tenantAtivo]);

  const buildAssinaturaUrl = useCallback(
    (
      assinaturaId?: number,
      mode: "inline" | "attachment" = "inline",
    ): string | undefined => {
      if (!ASSINATURA_API_BASE || !assinaturaId) {
        return undefined;
      }
      const base = `${ASSINATURA_API_BASE}/titular/me/assinaturas/${assinaturaId}/arquivo`;
      const params = new URLSearchParams();
      if (mode === "inline") {
        params.set("mode", "inline");
      }
      return params.toString() ? `${base}?${params.toString()}` : base;
    },
    [],
  );

  const selecionarTenant = useCallback((tenant: string) => {
    setTenantSelecionado(tenant);
    if (typeof document !== "undefined") {
      document.cookie = `tenant=${tenant}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  const extrairMensagemErro = (fetchError: unknown) => {
    const errorObject =
      typeof fetchError === "object" && fetchError !== null
        ? (fetchError as {
            response?: { data?: { error?: string; message?: string } };
          })
        : undefined;

    const detailedError = errorObject?.response?.data?.error;
    const serverMessage = errorObject?.response?.data?.message;

    if (detailedError) return `Erro técnico: ${detailedError}`;
    if (serverMessage && serverMessage !== "Internal server error") {
      return serverMessage;
    }
    return "CPF não encontrado ou não cadastrado. Verifique se digitou corretamente ou entre em contato com o suporte.";
  };

  const handleSelecionarCadastro = useCallback(
    (cadastro: TenantCadastro) => {
      selecionarTenant(cadastro.tenant.slug);

      if (isMainDomainClienteRoute) {
        window.location.href = buildClienteUrlByUnidade(
          cadastro.tenant.slug,
          cadastro.cliente.cpf,
        );
        return;
      }

      setCliente(cadastro.cliente);
      setAbaAtiva("carteirinha");
      setModalCadastroAberto(false);
    },
    [isMainDomainClienteRoute, selecionarTenant],
  );

  const consultarCpf = useCallback(
    async (digitsOnly: string) => {
      setError(null);
      setModalCadastroAberto(false);
      setCadastrosEncontrados([]);

      setIsLoading(true);
      setCliente(null);
      setIsFlipped(false);

      try {
        if (!isMainDomainClienteRoute) {
          const clienteEncontrado = await consultarClientePorCpf(digitsOnly);
          setCliente(clienteEncontrado);
          setAbaAtiva("carteirinha");
          return;
        }

        const consultas = await Promise.allSettled(
          TENANTS_CLIENTE.map(async (tenant) => {
            const clienteEncontrado = await consultarClientePorCpf(digitsOnly, {
              tenant: tenant.slug,
            });
            return { tenant, cliente: clienteEncontrado };
          }),
        );

        const encontrados = consultas
          .filter(
            (resultado): resultado is PromiseFulfilledResult<TenantCadastro> =>
              resultado.status === "fulfilled",
          )
          .map((resultado) => resultado.value);

        if (encontrados.length === 0) {
          setError(
            "CPF não encontrado ou não cadastrado. Verifique se digitou corretamente ou entre em contato com o suporte.",
          );
          return;
        }

        if (encontrados.length === 1) {
          handleSelecionarCadastro(encontrados[0]);
          return;
        }

        setCadastrosEncontrados(encontrados);
        setModalCadastroAberto(true);
      } catch (fetchError: unknown) {
        console.error(fetchError);
        setError(extrairMensagemErro(fetchError));
      } finally {
        setIsLoading(false);
      }
    },
    [handleSelecionarCadastro, isMainDomainClienteRoute],
  );

  const validarLoginCliente = (value: string): string | null => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "Informe CPF ou e-mail.";
    if (isEmail(trimmed)) return null;
    const cpfDigits = normalizeCpf(trimmed);
    if (validateCPF(cpfDigits)) return null;
    return "Informe um CPF válido (11 dígitos) ou um e-mail válido.";
  };

  const carregarClienteAutenticado = async () => {
    const { data } = await api.get("/titular/me");
    const mapped = mapTitularToCarteirinha(data);
    setCliente(mapped);
    setCpf(mapped.cpf);
    setAbaAtiva("carteirinha");
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);

    const loginError = validarLoginCliente(loginValue);
    if (loginError) {
      setAuthError(loginError);
      return;
    }

    if (!senhaValue) {
      setAuthError("Informe sua senha.");
      return;
    }

    setAuthLoading(true);
    try {
      await api.post("/auth/login", {
        login: loginValue.trim(),
        password: senhaValue,
        audience: "cliente",
      });

      await carregarClienteAutenticado();
      setMostrarAcessoRapido(false);
    } catch (err: unknown) {
      const errorObject = err as {
        response?: {
          status?: number;
          data?: { message?: unknown; code?: unknown };
        };
      };
      const status = errorObject?.response?.status;
      const serverMessage =
        typeof errorObject?.response?.data?.message === "string"
          ? errorObject.response.data.message
          : null;
      const code =
        typeof errorObject?.response?.data?.code === "string"
          ? errorObject.response.data.code
          : null;

      if (status === 428 && code === "FIRST_ACCESS_REQUIRED") {
        setFirstAccessOpen(true);
        setFirstAccessStep("request");
        setFirstAccessLogin(loginValue.trim());
        setFirstAccessDestination(null);
        setFirstAccessChannel(null);
        setFirstAccessInfo(
          "Seu cadastro ainda não possui senha. Vamos validar seu acesso e criar sua senha.",
        );
        return;
      }

      setAuthError(
        serverMessage ||
          "Não foi possível entrar. Verifique seu login e senha.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const startFirstAccess = async (channel?: "email" | "whatsapp") => {
    setFirstAccessError(null);
    if (firstAccessStep === "verify") {
      setFirstAccessInfo(null);
    }
    setFirstAccessDestination(null);
    const loginError = validarLoginCliente(firstAccessLogin);
    if (loginError) {
      setFirstAccessError(loginError);
      return;
    }

    setFirstAccessLoading(true);
    try {
      const { data } = await api.post("/auth/first-access", {
        login: firstAccessLogin.trim(),
        ...(channel ? { channel } : {}),
      });
      const destination =
        data?.start?.destinationMasked || data?.start?.channel || "seu contato";
      setFirstAccessDestination(destination);
      setFirstAccessChannel(
        data?.start?.channel === "whatsapp" ? "whatsapp" : "email",
      );
      const devOtp = data?.start?.dev?.otp;
      setFirstAccessInfo(devOtp ? `Código (dev): ${devOtp}` : null);
      setFirstAccessStep("verify");
    } catch (err: unknown) {
      const errorObject = err as {
        response?: {
          status?: number;
          data?: { message?: unknown; code?: unknown };
        };
      };
      const status = errorObject?.response?.status;
      const serverMessage =
        typeof errorObject?.response?.data?.message === "string"
          ? errorObject.response.data.message
          : null;
      const code =
        typeof errorObject?.response?.data?.code === "string"
          ? errorObject.response.data.code
          : null;

      const precisaRedirecionarParaCadastro =
        code === "FIRST_ACCESS_CONTACT_REQUIRED" ||
        status === 404 ||
        serverMessage === "Cliente não encontrado.";

      if (precisaRedirecionarParaCadastro) {
        setFirstAccessOpen(false);
        setCadastroRedirectMessage(
          serverMessage ||
            "Não encontramos CPF ou e-mail cadastrado para concluir o primeiro acesso. Finalize seu cadastro para continuar.",
        );
        setCadastroRedirectOpen(true);
        return;
      }

      setFirstAccessError(serverMessage || "Não foi possível enviar o código.");
    } finally {
      setFirstAccessLoading(false);
    }
  };

  const verifyFirstAccessOtp = async () => {
    setFirstAccessError(null);
    setFirstAccessInfo(null);
    if (!firstAccessOtp.trim()) {
      setFirstAccessError("Informe o código recebido.");
      return;
    }

    setFirstAccessLoading(true);
    try {
      const { data } = await api.post("/auth/verify", {
        login: firstAccessLogin.trim(),
        otp: firstAccessOtp.trim(),
        purpose: "FIRST_ACCESS",
      });
      const token = String(data?.verificationToken ?? "");
      if (!token) {
        setFirstAccessError("Não foi possível validar o código.");
        return;
      }
      setFirstAccessVerificationToken(token);
      setFirstAccessStep("setPassword");
    } catch (err: unknown) {
      const errorObject = err as {
        response?: { data?: { message?: unknown } };
      };
      const serverMessage =
        typeof errorObject?.response?.data?.message === "string"
          ? errorObject.response.data.message
          : null;
      setFirstAccessError(serverMessage || "Código inválido ou expirado.");
    } finally {
      setFirstAccessLoading(false);
    }
  };

  const completeFirstAccess = async () => {
    setFirstAccessError(null);
    setFirstAccessInfo(null);

    const passwordValidation = validatePassword(firstAccessPassword);
    if (passwordValidation) {
      setFirstAccessError(passwordValidation);
      return;
    }
    if (firstAccessPassword !== firstAccessPasswordConfirm) {
      setFirstAccessError("As senhas não conferem.");
      return;
    }

    setFirstAccessLoading(true);
    try {
      await api.post("/auth/first-access", {
        verificationToken: firstAccessVerificationToken,
        password: firstAccessPassword,
      });

      const loginForAutoLogin = firstAccessLogin.trim();
      if (loginForAutoLogin) {
        setFirstAccessInfo("Senha criada com sucesso. Entrando...");
        await api.post("/auth/login", {
          login: loginForAutoLogin,
          password: firstAccessPassword,
          audience: "cliente",
        });
        await carregarClienteAutenticado();
      } else {
        setLoginValue("");
        setSenhaValue("");
      }
      setFirstAccessOpen(false);
      resetFirstAccessState();
      clearFirstAccessQueryParams();
    } catch (err: unknown) {
      const errorObject = err as {
        response?: { data?: { message?: unknown } };
      };
      const serverMessage =
        typeof errorObject?.response?.data?.message === "string"
          ? errorObject.response.data.message
          : null;
      setFirstAccessError(
        serverMessage || "Não foi possível concluir o primeiro acesso.",
      );
    } finally {
      setFirstAccessLoading(false);
    }
  };

  const startForgotPassword = async () => {
    setForgotError(null);
    setForgotInfo(null);
    setForgotDestination(null);
    const loginError = validarLoginCliente(forgotLogin);
    if (loginError) {
      setForgotError(loginError);
      return;
    }

    setForgotLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", {
        login: forgotLogin.trim(),
      });
      const destination =
        data?.start?.destinationMasked || data?.start?.channel || "seu contato";
      setForgotDestination(destination);
      const devOtp = data?.start?.dev?.otp;
      setForgotInfo(
        `Enviamos um código para ${destination}.${devOtp ? ` Código (dev): ${devOtp}` : ""}`,
      );
      setForgotStep("verify");
    } catch (err: unknown) {
      const errorObject = err as {
        response?: { data?: { message?: unknown } };
      };
      const serverMessage =
        typeof errorObject?.response?.data?.message === "string"
          ? errorObject.response.data.message
          : null;
      setForgotError(
        serverMessage || "Não foi possível iniciar a recuperação.",
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const verifyForgotOtp = async () => {
    setForgotError(null);
    setForgotInfo(null);
    if (!forgotOtp.trim()) {
      setForgotError("Informe o código recebido.");
      return;
    }

    setForgotLoading(true);
    try {
      const { data } = await api.post("/auth/verify", {
        login: forgotLogin.trim(),
        otp: forgotOtp.trim(),
        purpose: "RESET_PASSWORD",
      });
      const token = String(data?.verificationToken ?? "");
      if (!token) {
        setForgotError("Não foi possível validar o código.");
        return;
      }
      setForgotVerificationToken(token);
      setForgotStep("setPassword");
    } catch (err: unknown) {
      const errorObject = err as {
        response?: { data?: { message?: unknown } };
      };
      const serverMessage =
        typeof errorObject?.response?.data?.message === "string"
          ? errorObject.response.data.message
          : null;
      setForgotError(serverMessage || "Código inválido ou expirado.");
    } finally {
      setForgotLoading(false);
    }
  };

  const completeForgotPassword = async () => {
    setForgotError(null);
    setForgotInfo(null);

    const passwordValidation = validatePassword(forgotPassword);
    if (passwordValidation) {
      setForgotError(passwordValidation);
      return;
    }
    if (forgotPassword !== forgotPasswordConfirm) {
      setForgotError("As senhas não conferem.");
      return;
    }

    setForgotLoading(true);
    try {
      await api.post("/auth/reset-password", {
        verificationToken: forgotVerificationToken,
        password: forgotPassword,
      });
      setForgotInfo("Senha alterada com sucesso.");
      setForgotOpen(false);
      setLoginValue(forgotLogin.trim());
      setSenhaValue("");
    } catch (err: unknown) {
      const errorObject = err as {
        response?: { data?: { message?: unknown } };
      };
      const serverMessage =
        typeof errorObject?.response?.data?.message === "string"
          ? errorObject.response.data.message
          : null;
      setForgotError(serverMessage || "Não foi possível alterar a senha.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const digitsOnly = normalizeCpf(cpf);
    if (!validateCPF(digitsOnly)) {
      setError("CPF inválido. Por favor, verifique os números digitados.");
      return;
    }

    await consultarCpf(digitsOnly);
  };

  useEffect(() => {
    if (isMainDomainClienteRoute || autoBuscaExecutadaRef.current) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const cpfFromUrl = normalizeCpf(params.get("cpf") || "");
    if (!validateCPF(cpfFromUrl)) return;

    autoBuscaExecutadaRef.current = true;
    setCpf(formatCPF(cpfFromUrl));
    void consultarCpf(cpfFromUrl);
  }, [consultarCpf, isMainDomainClienteRoute]);

  const handleReset = () => {
    api.post("/auth/logout").catch(() => {});
    setCpf("");
    setCliente(null);
    setError(null);
    setAuthError(null);
    setSenhaValue("");
    setCadastrosEncontrados([]);
    setModalCadastroAberto(false);
    setIsFlipped(false);
    setAbaAtiva("carteirinha");
  };

  const {
    data: contasFinanceiras = [],
    isLoading: isLoadingFinanceiro,
    refetch: refetchFinanceiro,
  } = useQuery({
    queryKey: ["cliente-financeiro", tenantAtivo, cliente?.titularId],
    queryFn: () => listarContasDoCliente(),
    enabled: Boolean(cliente?.titularId && tenantAtivo),
    staleTime: 30 * 1000,
  });

  const { data: regraNotificacao } = useQuery<{
    diasSuspensao?: number | null;
    diasPosSuspensao?: number | null;
  } | null>({
    queryKey: ["cliente-regras-notificacao", tenantAtivo],
    queryFn: async () => {
      const { data } = await api.get("/regras");
      if (!Array.isArray(data) || data.length === 0) return null;
      const regra = data[0] ?? null;
      return regra
        ? {
            diasSuspensao: regra.diasSuspensao,
            diasPosSuspensao: regra.diasPosSuspensao,
          }
        : null;
    },
    enabled: Boolean(tenantAtivo),
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (cliente?.titularId) {
      refetchFinanceiro();
    }
  }, [cliente?.titularId, tenantAtivo, refetchFinanceiro]);

  const maxDiasAtrasoFinanceiro = useMemo(() => {
    if (!Array.isArray(contasFinanceiras) || contasFinanceiras.length === 0)
      return 0;
    const hoje = new Date();

    const calcularDiasAtraso = (vencimento: string) => {
      const dataVencimento = new Date(vencimento);
      if (Number.isNaN(dataVencimento.getTime())) return 0;
      const diff = hoje.getTime() - dataVencimento.getTime();
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      return dias > 0 ? dias : 0;
    };

    return contasFinanceiras.reduce((maior, conta) => {
      const status = String(conta.status ?? "").toUpperCase();
      if (["PAGO", "RECEBIDO", "CANCELADO"].includes(status)) return maior;
      return Math.max(maior, calcularDiasAtraso(conta.vencimento));
    }, 0);
  }, [contasFinanceiras]);

  const diasSuspensao =
    regraNotificacao?.diasSuspensao && regraNotificacao.diasSuspensao > 0
      ? regraNotificacao.diasSuspensao
      : DEFAULT_DIAS_SUSPENSAO;
  const diasPosSuspensao =
    regraNotificacao?.diasPosSuspensao && regraNotificacao.diasPosSuspensao > 0
      ? regraNotificacao.diasPosSuspensao
      : DEFAULT_DIAS_POS_SUSPENSAO;

  const suspensoPorRegra = maxDiasAtrasoFinanceiro >= diasSuspensao;
  const posSuspensaoAtingido = maxDiasAtrasoFinanceiro >= diasPosSuspensao;

  const clienteExibicao = useMemo(() => {
    if (!cliente) return null;
    if (cliente.plano.status === "suspenso" || !suspensoPorRegra)
      return cliente;
    return {
      ...cliente,
      plano: {
        ...cliente.plano,
        status: "suspenso",
      },
    };
  }, [cliente, suspensoPorRegra]);

  const contasFiltradas = useMemo(() => {
    let filtradas = [...contasFinanceiras];

    // Ordenação cronológica (mais recente primeiro)
    filtradas.sort(
      (a, b) =>
        new Date(b.vencimento).getTime() - new Date(a.vencimento).getTime(),
    );

    if (filtroStatus !== "todos") {
      filtradas = filtradas.filter(
        (conta) => conta.status.toUpperCase() === filtroStatus.toUpperCase(),
      );
    }

    if (filtroPeriodo !== "todos") {
      const hoje = new Date();
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(hoje.getDate() - 30);
      const sessentaDiasAtras = new Date();
      sessentaDiasAtras.setDate(hoje.getDate() - 60);
      const noventaDiasAtras = new Date();
      noventaDiasAtras.setDate(hoje.getDate() - 90);

      if (filtroPeriodo === "30") {
        filtradas = filtradas.filter(
          (c) => new Date(c.vencimento) >= trintaDiasAtras,
        );
      } else if (filtroPeriodo === "60") {
        filtradas = filtradas.filter(
          (c) => new Date(c.vencimento) >= sessentaDiasAtras,
        );
      } else if (filtroPeriodo === "90") {
        filtradas = filtradas.filter(
          (c) => new Date(c.vencimento) >= noventaDiasAtras,
        );
      } else if (filtroPeriodo === "ano") {
        const anoAtual = hoje.getFullYear();
        filtradas = filtradas.filter(
          (c) => new Date(c.vencimento).getFullYear() === anoAtual,
        );
      }
    }

    return filtradas;
  }, [contasFinanceiras, filtroStatus, filtroPeriodo]);

  const {
    data: assinaturas = [],
    isLoading: isLoadingAssinaturas,
    refetch: refetchAssinaturas,
  } = useQuery<AssinaturaDigital[]>({
    queryKey: ["cliente-assinaturas", tenantAtivo, cliente?.titularId],
    queryFn: () => listarAssinaturas(),
    enabled: Boolean(cliente?.titularId && tenantAtivo),
    staleTime: 30 * 1000,
  });

  const assinaturasMap = useMemo(() => {
    return assinaturas.reduce<Record<string, AssinaturaDigital>>(
      (acc, item) => {
        acc[item.tipo] = item;
        return acc;
      },
      {},
    );
  }, [assinaturas]);

  const proximaEtapaIndex = useMemo(() => {
    for (let i = 0; i < TIPOS_ASSINATURA.length; i += 1) {
      if (!assinaturasMap[TIPOS_ASSINATURA[i].id]) {
        return i;
      }
    }
    return TIPOS_ASSINATURA.length;
  }, [assinaturasMap]);

  useEffect(() => {
    if (abaAtiva === "assinaturas" && proximaEtapaIndex === 0) {
      setAssinaturaMensagem(
        "Leia o contrato e colete a primeira assinatura do titular.",
      );
    } else {
      setAssinaturaMensagem(null);
    }
  }, [abaAtiva, proximaEtapaIndex]);

  const handleSalvarAssinatura = async (
    tipo: string,
    assinaturaBase64: string,
  ) => {
    if (!cliente?.titularId) return;
    setAssinaturaMensagem(null);
    setAssinaturaEmProgresso(tipo);
    try {
      await salvarAssinatura({ tipo, assinaturaBase64 });
      await refetchAssinaturas();
    } catch (erro) {
      setAssinaturaMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível salvar a assinatura.",
      );
    } finally {
      setAssinaturaEmProgresso(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAGO":
      case "RECEBIDO":
        return (
          <Badge className="bg-[#e8f5e3] text-[#2d7a1f] hover:bg-[#c5e3be] border-[#c5e3be]">
            <CheckCircle className="w-3 h-3 mr-1" /> Pago
          </Badge>
        );
      case "PENDENTE":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">
            <Clock className="w-3 h-3 mr-1" /> Pendente
          </Badge>
        );
      case "ATRASADO":
      case "VENCIDO":
        return (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Vencido
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPixQrImageSrc = (codigoPix: string) => {
    if (!codigoPix) return "";
    if (codigoPix.startsWith("data:image/")) return codigoPix;
    if (/^https?:\/\//i.test(codigoPix)) return codigoPix;
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
      codigoPix,
    )}`;
  };

  const copiarCodigoPix = async (codigoPix: string) => {
    if (!codigoPix) return;
    try {
      await navigator.clipboard.writeText(codigoPix);
      setMensagemFinanceiro("Código PIX copiado com sucesso.");
      setTimeout(() => setMensagemFinanceiro(null), 3000);
    } catch {
      setMensagemFinanceiro("Não foi possível copiar o código PIX.");
      setTimeout(() => setMensagemFinanceiro(null), 3000);
    }
  };

  const reconsultarContaAsaasSeNecessario = async (conta: {
    id: number;
    status: string;
    asaasPaymentId?: string | null;
    asaasSubscriptionId?: string | null;
  }) => {
    const vinculadaAsaas = Boolean(
      conta.asaasPaymentId || conta.asaasSubscriptionId,
    );
    if (!vinculadaAsaas) return;

    const status = String(conta.status ?? "").toUpperCase();
    const podeEstarDefasada = ["PENDENTE", "ATRASADO", "VENCIDO"].includes(
      status,
    );
    if (!podeEstarDefasada) return;

    try {
      await reconsultarContaReceber(conta.id);
      await refetchFinanceiro();
    } catch {
      // Mantém a ação do usuário mesmo sem sucesso na reconsulta.
    }
  };

  // ─── helpers de navegação do dashboard ──────────────────────────
  const navItems = [
    { id: "carteirinha", label: "Carteirinha", Icon: IdCard },
    { id: "plano", label: "Meu Plano", Icon: BookOpen },
    ...(cliente?.dependentes && cliente.dependentes.length > 0
      ? [{ id: "dependentes", label: "Dependentes", Icon: Users }]
      : []),
    { id: "financeiro", label: "Financeiro", Icon: CreditCard },
    { id: "assinaturas", label: "Assinaturas", Icon: PenLine },
    { id: "atendimento", label: "Atendimento", Icon: Headset },
    { id: "parcerias", label: "Parcerias", Icon: Gift },
    { id: "ajustes", label: "Ajustes", Icon: Settings },
  ] as { id: typeof abaAtiva; label: string; Icon: React.ElementType }[];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Modais (primeiro acesso, recuperar senha, cadastro, PIX) ── */}
      <Dialog
        open={firstAccessOpen}
        onOpenChange={(open) => {
          setFirstAccessOpen(open);
          if (!open) {
            resetFirstAccessState();
            clearFirstAccessQueryParams();
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Primeiro acesso</DialogTitle>
            <DialogDescription>
              {firstAccessStep === "setPassword" && firstAccessVerificationToken
                ? "Link validado. Defina sua senha para concluir o primeiro acesso."
                : "Valide sua identidade com um código e crie sua senha."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {firstAccessStep === "request" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    CPF ou e-mail
                  </label>
                  <Input
                    value={firstAccessLogin}
                    onChange={(e) => setFirstAccessLogin(e.target.value)}
                    placeholder="CPF ou e-mail"
                    autoComplete="username"
                  />
                </div>
                {firstAccessInfo && (
                  <Alert>
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>{firstAccessInfo}</AlertDescription>
                  </Alert>
                )}
                {firstAccessError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{firstAccessError}</AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={() => {
                    void startFirstAccess();
                  }}
                  className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
                  disabled={firstAccessLoading}
                >
                  {firstAccessLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar código"
                  )}
                </Button>
              </>
            )}
            {firstAccessStep === "verify" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{`Código enviado para ${firstAccessDestination || "seu contato"}`}</label>
                  <Input
                    value={firstAccessOtp}
                    onChange={(e) => setFirstAccessOtp(e.target.value)}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
                {firstAccessChannel !== "whatsapp" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      void startFirstAccess("whatsapp");
                    }}
                    disabled={firstAccessLoading}
                  >
                    Enviar código por WhatsApp
                  </Button>
                )}
                {firstAccessInfo && (
                  <p className="text-xs text-slate-500">{firstAccessInfo}</p>
                )}
                {firstAccessError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{firstAccessError}</AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={verifyFirstAccessOtp}
                  className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
                  disabled={firstAccessLoading}
                >
                  {firstAccessLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    "Validar código"
                  )}
                </Button>
              </>
            )}
            {firstAccessStep === "setPassword" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nova senha
                  </label>
                  <Input
                    type="password"
                    value={firstAccessPassword}
                    onChange={(e) => setFirstAccessPassword(e.target.value)}
                    placeholder="Mín. 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Confirmar senha
                  </label>
                  <Input
                    type="password"
                    value={firstAccessPasswordConfirm}
                    onChange={(e) =>
                      setFirstAccessPasswordConfirm(e.target.value)
                    }
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                  />
                </div>
                {firstAccessInfo && (
                  <Alert>
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>{firstAccessInfo}</AlertDescription>
                  </Alert>
                )}
                {firstAccessError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{firstAccessError}</AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={completeFirstAccess}
                  className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
                  disabled={firstAccessLoading}
                >
                  {firstAccessLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Criar senha e entrar"
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={forgotOpen}
        onOpenChange={(open) => {
          setForgotOpen(open);
          if (!open) {
            setForgotStep("request");
            setForgotOtp("");
            setForgotVerificationToken("");
            setForgotPassword("");
            setForgotPasswordConfirm("");
            setForgotDestination(null);
            setForgotInfo(null);
            setForgotError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              {forgotStep === "setPassword" && forgotVerificationToken
                ? "Link validado. Defina sua nova senha."
                : "Envie um código, valide e defina uma nova senha."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {forgotStep === "request" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    CPF ou e-mail
                  </label>
                  <Input
                    value={forgotLogin}
                    onChange={(e) => setForgotLogin(e.target.value)}
                    placeholder="CPF ou e-mail"
                    autoComplete="username"
                  />
                </div>
                {forgotInfo && (
                  <Alert>
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>{forgotInfo}</AlertDescription>
                  </Alert>
                )}
                {forgotError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={startForgotPassword}
                  className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar código"
                  )}
                </Button>
              </>
            )}

            {forgotStep === "verify" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {`Código enviado para ${forgotDestination || "seu contato"}`}
                  </label>
                  <Input
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
                {forgotInfo && (
                  <Alert>
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>{forgotInfo}</AlertDescription>
                  </Alert>
                )}
                {forgotError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={verifyForgotOtp}
                  className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    "Validar código"
                  )}
                </Button>
              </>
            )}

            {forgotStep === "setPassword" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Nova senha
                  </label>
                  <Input
                    type="password"
                    value={forgotPassword}
                    onChange={(e) => setForgotPassword(e.target.value)}
                    placeholder="Mín. 8 caracteres"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Confirmar senha
                  </label>
                  <Input
                    type="password"
                    value={forgotPasswordConfirm}
                    onChange={(e) => setForgotPasswordConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                  />
                </div>
                {forgotInfo && (
                  <Alert>
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>{forgotInfo}</AlertDescription>
                  </Alert>
                )}
                {forgotError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{forgotError}</AlertDescription>
                  </Alert>
                )}
                <Button
                  onClick={completeForgotPassword}
                  className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Alterar senha"
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cadastroRedirectOpen}
        onOpenChange={setCadastroRedirectOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro necessário</DialogTitle>
            <DialogDescription>{cadastroRedirectMessage}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
              onClick={() => {
                window.location.href = "/cliente/cadastro";
              }}
            >
              Ir para cadastro
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setCadastroRedirectOpen(false)}
            >
              Agora não
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── TELA DE LOGIN ─────────────────────────────────────────────── */}
      {!cliente && (
        <div className="flex min-h-screen bg-white">
          {/* painel esquerdo — hero com gradiente do mobile */}
          <div
            className="hidden lg:flex w-[460px] flex-shrink-0 flex-col justify-between px-12 py-14 text-white relative overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #43980d 0%, #66c827 100%)",
            }}
          >
            {/* círculos decorativos de fundo */}
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10" />
            <div className="absolute bottom-20 -left-16 h-52 w-52 rounded-full bg-white/10" />
            <div className="absolute top-1/2 right-8 h-32 w-32 rounded-full bg-white/10" />

            {/* logo oficial */}
            <div className="relative z-10">
              <Image
                src="/cliente-mobile/logo.svg"
                alt="Campo do Bosque"
                width={200}
                height={63}
                className="brightness-0 invert mb-10"
                unoptimized
              />
              <h2 className="text-3xl font-bold leading-snug mb-3">
                Bem-vindo à<br />
                Área do Cliente
              </h2>
              <p className="text-white/80 text-sm leading-relaxed">
                Acesse sua carteirinha, acompanhe seu plano, faturas e muito
                mais com segurança.
              </p>
            </div>

            {/* benefícios */}
            <div className="relative z-10 space-y-3">
              {[
                { Icon: ShieldCheck, text: "Proteção para toda a família" },
                {
                  Icon: HeartHandshake,
                  text: "Atendimento humanizado 24 horas",
                },
                {
                  Icon: BadgeCheck,
                  text: "Cobertura garantida no momento que precisa",
                },
                { Icon: Flower2, text: "Cerimônias com dignidade e respeito" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm text-white/90">{text}</span>
                </div>
              ))}
            </div>

            {/* rodapé */}
            <p className="relative z-10 text-xs text-white/50">
              © {new Date().getFullYear()} Campo do Bosque · Assistência
              Funeral
            </p>
          </div>

          {/* painel direito — formulário */}
          <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12">
            {/* logo para mobile (visível só em telas pequenas) */}
            <div className="lg:hidden mb-8">
              <Image
                src="/cliente-mobile/logo.svg"
                alt="Campo do Bosque"
                width={180}
                height={56}
                unoptimized
              />
            </div>

            {!authChecked ? (
              <div className="flex flex-col items-center gap-4 text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin text-[#3a9b28]" />
                <p className="text-sm">Verificando sessão...</p>
              </div>
            ) : (
              <div className="w-full max-w-[360px]">
                {/* cabeçalho do form */}
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">
                    Acesse sua conta
                  </h1>
                  <p className="text-sm text-slate-500">
                    Digite seu CPF ou e-mail e senha para entrar.
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="login"
                      className="text-sm font-medium text-slate-700"
                    >
                      CPF ou e-mail
                    </label>
                    <Input
                      id="login"
                      name="login"
                      placeholder="000.000.000-00 ou email@exemplo.com"
                      value={loginValue}
                      onChange={(event) => setLoginValue(event.target.value)}
                      className={`h-11 bg-white ${authError ? "border-red-400 focus-visible:ring-red-300" : "border-slate-300"}`}
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="senha"
                        className="text-sm font-medium text-slate-700"
                      >
                        Senha
                      </label>
                      <button
                        type="button"
                        className="text-xs text-[#3a9b28] hover:text-[#2d7a1f] hover:underline font-medium"
                        onClick={() => {
                          setForgotOpen(true);
                          setForgotStep("request");
                          setForgotLogin(loginValue.trim());
                          setForgotOtp("");
                          setForgotPassword("");
                          setForgotPasswordConfirm("");
                          setForgotDestination(null);
                          setForgotInfo(null);
                          setForgotError(null);
                        }}
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <Input
                      id="senha"
                      name="senha"
                      type="password"
                      placeholder="Sua senha"
                      value={senhaValue}
                      onChange={(event) => setSenhaValue(event.target.value)}
                      className={`h-11 bg-white ${authError ? "border-red-400 focus-visible:ring-red-300" : "border-slate-300"}`}
                      autoComplete="current-password"
                    />
                  </div>

                  {authError && (
                    <Alert variant="destructive" className="py-2.5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {authError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-white font-semibold shadow-sm mt-1"
                    style={{
                      background:
                        "linear-gradient(135deg, #3a9b28 0%, #2d7a1f 100%)",
                    }}
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-slate-50 px-3 text-xs text-slate-400">
                        ou
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 border-slate-300 text-[#3a9b28] hover:bg-[#f2faf0] hover:border-[#3a9b28] font-medium"
                    onClick={() => {
                      setFirstAccessOpen(true);
                      setFirstAccessStep("request");
                      setFirstAccessLogin(loginValue.trim());
                      setFirstAccessOtp("");
                      setFirstAccessPassword("");
                      setFirstAccessPasswordConfirm("");
                      setFirstAccessDestination(null);
                      setFirstAccessInfo(null);
                      setFirstAccessError(null);
                    }}
                  >
                    Primeiro acesso / Criar senha
                  </Button>

                  {ENABLE_LEGACY_QUICK_ACCESS && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-slate-500 hover:text-slate-700 text-sm"
                        onClick={() => setMostrarAcessoRapido((prev) => !prev)}
                      >
                        {mostrarAcessoRapido
                          ? "Ocultar acesso rápido"
                          : "Acesso rápido (legado) por CPF"}
                      </Button>
                      {mostrarAcessoRapido && (
                        <form
                          onSubmit={handleSubmit}
                          className="space-y-3 pt-2 border-t border-slate-200"
                        >
                          <label
                            htmlFor="cpf"
                            className="text-sm font-medium text-slate-700"
                          >
                            CPF do titular
                          </label>
                          <Input
                            id="cpf"
                            name="cpf"
                            inputMode="numeric"
                            placeholder="000.000.000-00"
                            value={cpf}
                            onChange={(event) =>
                              setCpf(formatCPF(event.target.value))
                            }
                            maxLength={14}
                            className={error ? "border-red-500" : ""}
                          />
                          {error && (
                            <Alert variant="destructive" className="py-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}
                          <Button
                            type="submit"
                            className="w-full bg-[#2d7a1f] hover:bg-[#1e5a14] text-white"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Consultando...
                              </>
                            ) : (
                              "Consultar"
                            )}
                          </Button>
                        </form>
                      )}
                    </>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
      {!isLoading && cliente && (
        <div className="flex min-h-screen animate-in fade-in duration-300">
          {/* ── Sidebar ── */}
          <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-white border-r border-slate-100 shadow-sm">
            {/* logo / brand */}
            <div className="flex items-center px-5 py-4 border-b border-slate-100">
              <Image
                src="/cliente-mobile/logo.svg"
                alt="Campo do Bosque"
                width={148}
                height={46}
                unoptimized
              />
            </div>

            {/* avatar do cliente */}
            <div className="px-5 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#3a9b28] to-[#2d7a1f] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {cliente.nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {cliente.nome}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {cliente.cpf}
                  </p>
                </div>
              </div>
              {clienteExibicao && (
                <div className="mt-3">
                  <Badge
                    className={`text-[11px] font-semibold px-2 py-0.5 ${
                      clienteExibicao.plano.status === "ativo"
                        ? "bg-[#e8f5e3] text-[#2d7a1f] border-[#c5e3be]"
                        : "bg-rose-100 text-rose-700 border-rose-200"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {clienteExibicao.plano.status === "ativo" ? (
                        <>
                          <CheckCircle className="h-3 w-3" /> Plano Ativo
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3" /> Plano Suspenso
                        </>
                      )}
                    </span>
                  </Badge>
                </div>
              )}
            </div>

            {/* navegação */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAbaAtiva(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    abaAtiva === item.id
                      ? "bg-[#2d7a1f] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* rodapé sidebar */}
            <div className="px-3 py-4 border-t border-slate-100">
              <button
                onClick={handleReset}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Sair
              </button>
            </div>
          </aside>

          {/* ── Conteúdo principal ── */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            {/* topbar */}
            <header className="bg-white border-b border-slate-100 px-6 lg:px-8 h-16 flex items-center justify-between flex-shrink-0">
              <div>
                <h1 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  {(() => {
                    const active = navItems.find((n) => n.id === abaAtiva);
                    return active ? (
                      <active.Icon className="h-4 w-4 text-[#3a9b28]" />
                    ) : null;
                  })()}
                  {navItems.find((n) => n.id === abaAtiva)?.label ??
                    "Dashboard"}
                </h1>
              </div>

              {/* nav mobile (tabs compactas no topo) */}
              <div className="flex lg:hidden gap-1 overflow-x-auto">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAbaAtiva(item.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      abaAtiva === item.id
                        ? "bg-[#2d7a1f] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                <span>
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  })}
                </span>
              </div>
            </header>

            {/* alertas de suspensão */}
            {(posSuspensaoAtingido || suspensoPorRegra) && (
              <div className="px-6 lg:px-8 pt-4">
                {posSuspensaoAtingido ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      Plano suspenso com pendência prolongada
                    </AlertTitle>
                    <AlertDescription>
                      Seu plano está suspenso há mais de {diasPosSuspensao} dias
                      de atraso. Regularize o pagamento para solicitar a
                      reativação.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Plano suspenso</AlertTitle>
                    <AlertDescription>
                      Seu plano atingiu a regra de suspensão ({diasSuspensao}{" "}
                      dias de atraso). Regularize o pagamento para retomar os
                      benefícios.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* área de conteúdo */}
            <main className="flex-1 px-6 lg:px-8 py-6 space-y-6">
              {/* ── CARTEIRINHA ── */}
              {abaAtiva === "carteirinha" && clienteExibicao && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-[#e8f5e3] flex items-center justify-center">
                        <ClipboardList className="h-5 w-5 text-[#2d7a1f]" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                          Plano
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {cliente.plano.nome}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                          Mensalidade
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {formatCurrency(cliente.plano.valorMensal)}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${clienteExibicao.plano.status === "ativo" ? "bg-[#e8f5e3]" : "bg-rose-100"}`}
                      >
                        {clienteExibicao.plano.status === "ativo" ? (
                          <CheckCircle className="h-5 w-5 text-[#2d7a1f]" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-rose-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                          Status
                        </p>
                        <p
                          className={`text-sm font-semibold mt-0.5 ${clienteExibicao.plano.status === "ativo" ? "text-[#2d7a1f]" : "text-rose-600"}`}
                        >
                          {clienteExibicao.plano.status
                            .charAt(0)
                            .toUpperCase() +
                            clienteExibicao.plano.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-slate-700 mb-5 flex items-center gap-2">
                      <IdCard className="h-4 w-4 text-[#3a9b28]" /> Carteirinha
                      Digital
                    </h2>
                    <CarteirinhaAsImage
                      cliente={clienteExibicao}
                      isFlipped={isFlipped}
                      setIsFlipped={setIsFlipped}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                </div>
              )}

              {/* ── MEU PLANO ── */}
              {abaAtiva === "plano" && clienteExibicao && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-5">
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="h-8 w-8 rounded-lg bg-[#e8f5e3] flex items-center justify-center">
                          <FileText className="h-4 w-4 text-[#2d7a1f]" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-slate-800">
                            Detalhes do Contrato
                          </h2>
                          <p className="text-xs text-slate-400">
                            Informações completas sobre seu plano atual
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        {[
                          {
                            label: "Plano Contratado",
                            value: cliente.plano.nome,
                            large: true,
                          },
                          {
                            label: "Código do Contrato",
                            value: cliente.plano.codigo,
                          },
                          {
                            label: "Valor Mensal",
                            value: formatCurrency(cliente.plano.valorMensal),
                          },
                          {
                            label: "Status",
                            value: clienteExibicao.plano.status.toUpperCase(),
                            isStatus: true,
                          },
                        ].map((field) => (
                          <div
                            key={field.label}
                            className="space-y-1 p-3 bg-slate-50 rounded-lg"
                          >
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                              {field.label}
                            </p>
                            {field.isStatus ? (
                              <Badge
                                className={`mt-1 ${clienteExibicao.plano.status === "ativo" ? "bg-[#e8f5e3] text-[#2d7a1f] border-[#c5e3be]" : "bg-rose-100 text-rose-700 border-rose-200"}`}
                              >
                                {field.value}
                              </Badge>
                            ) : (
                              <p
                                className={`font-semibold text-slate-800 ${field.large ? "text-base" : "text-sm"}`}
                              >
                                {field.value}
                              </p>
                            )}
                          </div>
                        ))}
                        <div className="col-span-2 space-y-1 p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            Período de Vigência
                          </p>
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 mt-1">
                            <CalendarIcon className="h-4 w-4 text-[#3a9b28]" />
                            {formatDate(cliente.plano.vigencia.inicio)}
                            <span className="text-slate-400 font-normal">
                              até
                            </span>
                            {formatDate(cliente.plano.vigencia.fim)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                      <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#3a9b28]" />
                        Coberturas e Benefícios
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {cliente.plano.cobertura.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-2 text-sm text-slate-600 bg-[#f2faf0] rounded-lg px-3 py-2"
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-[#3a9b28] mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <History className="h-4 w-4 text-slate-600" />
                      </div>
                      <h2 className="text-sm font-semibold text-slate-800">
                        Histórico do Plano
                      </h2>
                    </div>
                    <div className="relative pl-5 border-l-2 border-[#e8f5e3] space-y-6">
                      <div className="relative">
                        <div className="absolute -left-[25px] top-1 h-3.5 w-3.5 rounded-full bg-[#3a9b28] ring-4 ring-white border border-[#c5e3be]" />
                        <p className="text-sm font-semibold text-slate-800">
                          Situação Atual
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(new Date().toISOString())}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded px-2 py-1">
                          Plano {clienteExibicao.plano.status}
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[25px] top-1 h-3.5 w-3.5 rounded-full bg-slate-300 ring-4 ring-white" />
                        <p className="text-sm font-semibold text-slate-800">
                          Contratação
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(cliente.plano.vigencia.inicio)}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded px-2 py-1">
                          Início da vigência do plano {cliente.plano.nome}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DEPENDENTES ── */}
              {abaAtiva === "dependentes" && (
                <div className="space-y-5">
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-slate-800">
                          Dependentes do Plano
                        </h2>
                        <p className="text-xs text-slate-400">
                          {cliente.dependentes?.length
                            ? `${cliente.dependentes.length} dependente${cliente.dependentes.length > 1 ? "s" : ""} vinculado${cliente.dependentes.length > 1 ? "s" : ""}`
                            : "Nenhum dependente cadastrado"}
                        </p>
                      </div>
                    </div>
                    {cliente.dependentes && cliente.dependentes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {cliente.dependentes.map((dep) => {
                          const parentesco = dep.parentesco ?? dep.tipo ?? "—";
                          const idadeCalculada = getAgeFromBirthDate(
                            dep.dataNascimento,
                          );
                          const idade =
                            typeof dep.idade === "number"
                              ? dep.idade
                              : idadeCalculada;
                          const carencia =
                            typeof dep.carenciaRestante === "number"
                              ? dep.carenciaRestante
                              : typeof dep.carenciaDias === "number"
                                ? dep.carenciaDias
                                : null;
                          const emCarencia = carencia != null && carencia > 0;

                          return (
                            <div
                              key={dep.id}
                              className="rounded-xl border border-slate-100 bg-white shadow-sm p-5 flex flex-col gap-3 hover:border-[#c5e3be] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-base flex-shrink-0">
                                  {dep.nome.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-800 truncate">
                                    {dep.nome}
                                  </p>
                                  <p className="text-xs text-[#2d7a1f] font-medium uppercase tracking-wide">
                                    {parentesco}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-50 rounded-lg p-2">
                                  <p className="text-slate-400">Idade</p>
                                  <p className="font-semibold text-slate-700 mt-0.5">
                                    {idade != null ? `${idade} anos` : "—"}
                                  </p>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-2">
                                  <p className="text-slate-400">Nascimento</p>
                                  <p className="font-semibold text-slate-700 mt-0.5">
                                    {formatBirthDate(dep.dataNascimento)}
                                  </p>
                                </div>
                              </div>
                              {emCarencia ? (
                                <Badge className="w-fit bg-amber-100 text-amber-800 border-amber-300 text-xs">
                                  Carência: {carencia} dias
                                </Badge>
                              ) : dep.valorAdicionalMensal &&
                                dep.valorAdicionalMensal > 0 ? (
                                <Badge className="w-fit bg-blue-100 text-blue-800 border-blue-300 text-xs">
                                  Adicional:{" "}
                                  {dep.valorAdicionalMensal.toLocaleString(
                                    "pt-BR",
                                    { style: "currency", currency: "BRL" },
                                  )}
                                </Badge>
                              ) : (
                                <Badge className="w-fit bg-[#e8f5e3] text-[#1e5a14] border-[#7cc46e] text-xs flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> Coberto
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <Users className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                        <p className="text-sm">
                          Nenhum dependente cadastrado neste plano.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── FINANCEIRO ── */}
              {abaAtiva === "financeiro" && (
                <div className="space-y-5">
                  {/* resumo financeiro */}
                  {contasFinanceiras.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            Total de Faturas
                          </p>
                          <p className="text-xl font-bold text-slate-800 mt-0.5">
                            {contasFinanceiras.length}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              faturas
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-[#e8f5e3] flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-[#2d7a1f]" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            Pagas
                          </p>
                          <p className="text-xl font-bold text-slate-800 mt-0.5">
                            {
                              contasFinanceiras.filter((c) =>
                                ["PAGO", "RECEBIDO"].includes(
                                  c.status.toUpperCase(),
                                ),
                              ).length
                            }{" "}
                            <span className="text-xs font-normal text-slate-400">
                              faturas
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-rose-700" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                            Pendentes / Vencidas
                          </p>
                          <p className="text-xl font-bold text-slate-800 mt-0.5">
                            {
                              contasFinanceiras.filter((c) =>
                                ["PENDENTE", "ATRASADO", "VENCIDO"].includes(
                                  c.status.toUpperCase(),
                                ),
                              ).length
                            }{" "}
                            <span className="text-xs font-normal text-slate-400">
                              faturas
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* tabela de faturas */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Barcode className="h-4 w-4 text-indigo-700" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-slate-800">
                            Minhas Faturas
                          </h2>
                          <p className="text-xs text-slate-400">
                            Consulte boletos, PIX e status de pagamento
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={filtroPeriodo}
                          onValueChange={setFiltroPeriodo}
                        >
                          <SelectTrigger className="w-[150px] h-8 text-xs">
                            <Filter className="w-3 h-3 mr-1.5" />
                            <SelectValue placeholder="Período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">
                              Todo o período
                            </SelectItem>
                            <SelectItem value="30">Últimos 30 dias</SelectItem>
                            <SelectItem value="60">Últimos 60 dias</SelectItem>
                            <SelectItem value="90">Últimos 90 dias</SelectItem>
                            <SelectItem value="ano">Este ano</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={filtroStatus}
                          onValueChange={setFiltroStatus}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="vencido">Vencido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {mensagemFinanceiro && (
                      <div className="px-5 pt-4">
                        <Alert className="py-2">
                          <AlertDescription>
                            {mensagemFinanceiro}
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    <div className="p-2">
                      {isLoadingFinanceiro ? (
                        <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400">
                          <Loader2 className="h-8 w-8 animate-spin text-[#3a9b28]" />
                          <p className="text-sm">Buscando suas faturas...</p>
                        </div>
                      ) : contasFiltradas.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                  Descrição
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                  Vencimento
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                  Valor
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                  Status
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">
                                  Ações
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {contasFiltradas.map((conta) => (
                                <tr
                                  key={conta.id}
                                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                                >
                                  <td className="px-4 py-3 text-slate-700">
                                    <div className="flex items-center gap-2 font-medium">
                                      {conta.descricao}
                                      {(conta.asaasPaymentId ||
                                        conta.asaasSubscriptionId) && (
                                        <AsaasWingsMark variant="inline" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 text-xs">
                                    {formatDate(conta.vencimento)}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-800">
                                    {formatCurrency(conta.valor)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {getStatusBadge(conta.status)}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1.5 flex-wrap">
                                      {conta.paymentUrl && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs gap-1.5 text-[#2d7a1f] border-[#c5e3be] hover:bg-[#f2faf0]"
                                          onClick={async () => {
                                            await reconsultarContaAsaasSeNecessario(
                                              conta,
                                            );
                                            window.open(
                                              conta.paymentUrl!,
                                              "_blank",
                                            );
                                          }}
                                        >
                                          <Barcode className="h-3 w-3" />
                                          {conta.status === "PENDENTE" ||
                                          conta.status === "ATRASADO"
                                            ? "Pagar"
                                            : "Recibo"}
                                        </Button>
                                      )}
                                      {conta.pixQrCode && (
                                        <>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs gap-1.5 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                            onClick={async () => {
                                              await reconsultarContaAsaasSeNecessario(
                                                conta,
                                              );
                                              setPixSelecionado({
                                                descricao: conta.descricao,
                                                valor: conta.valor,
                                                vencimento: conta.vencimento,
                                                codigo: conta.pixQrCode!,
                                              });
                                            }}
                                          >
                                            <QrCode className="h-3 w-3" /> PIX
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs gap-1.5 text-sky-700 border-sky-200 hover:bg-sky-50"
                                            onClick={async () => {
                                              await reconsultarContaAsaasSeNecessario(
                                                conta,
                                              );
                                              copiarCodigoPix(conta.pixQrCode!);
                                            }}
                                          >
                                            <Copy className="h-3 w-3" /> Copiar
                                          </Button>
                                        </>
                                      )}
                                      {!conta.paymentUrl &&
                                        !conta.pixQrCode && (
                                          <span className="text-xs text-slate-300">
                                            —
                                          </span>
                                        )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-14 text-slate-400">
                          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                          <p className="text-sm">
                            Nenhuma fatura encontrada para o filtro selecionado.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ASSINATURAS ── */}
              {abaAtiva === "assinaturas" && (
                <div className="space-y-5">
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                          <PenLine className="h-4 w-4 text-violet-700" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-slate-800">
                            Assinaturas Digitais
                          </h2>
                          <p className="text-xs text-slate-400">
                            Capture as assinaturas do titular e do responsável
                            financeiro
                          </p>
                        </div>
                      </div>
                      {assinaturaMensagem && (
                        <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                          {assinaturaMensagem}
                        </p>
                      )}
                    </div>

                    {!cliente.titularId ? (
                      <p className="text-sm text-slate-400">
                        Titular não identificado para vincular assinaturas.
                      </p>
                    ) : isLoadingAssinaturas && assinaturas.length === 0 ? (
                      <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
                        <Loader2 className="size-4 animate-spin" /> Carregando
                        assinaturas...
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="rounded-xl border border-dashed border-[#c5e3be] bg-[#f2faf0] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-[#e8f5e3] flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4 w-4 text-[#2d7a1f]" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-[#164d10]">
                                Contrato de Prestação de Serviços
                              </h4>
                              <p className="text-xs text-[#2d7a1f]">
                                Leia o contrato antes de realizar as
                                assinaturas.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleDownloadContrato}
                            disabled={baixandoContrato}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c5e3be] rounded-lg hover:bg-[#f2faf0] transition-colors text-[#1e5a14] text-sm font-medium shadow-sm flex-shrink-0"
                          >
                            {baixandoContrato ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Download className="size-4" />
                            )}
                            {baixandoContrato
                              ? "Gerando PDF..."
                              : "Baixar Contrato"}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {TIPOS_ASSINATURA.map((tipo, index) => {
                            const assinaturaAtual = assinaturasMap[tipo.id];
                            const previewUrl = buildAssinaturaUrl(
                              assinaturaAtual?.id,
                              "inline",
                            );
                            const downloadUrl = buildAssinaturaUrl(
                              assinaturaAtual?.id,
                              "attachment",
                            );
                            return (
                              <AssinaturaCard
                                key={tipo.id}
                                tipoId={tipo.id}
                                titulo={tipo.label}
                                assinatura={assinaturaAtual}
                                onSalvar={handleSalvarAssinatura}
                                salvando={assinaturaEmProgresso === tipo.id}
                                previewUrl={previewUrl}
                                downloadUrl={downloadUrl}
                                estado={
                                  assinaturaAtual
                                    ? "concluida"
                                    : index === proximaEtapaIndex
                                      ? "ativa"
                                      : "pendente"
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* ── ATENDIMENTO ── */}
              {abaAtiva === "atendimento" && (
                <DesktopAtendimentoSection tenantSlug={tenantAtivo} />
              )}

              {/* ── PARCERIAS ── */}
              {abaAtiva === "parcerias" && (
                <DesktopParceriasSection
                  onGoAtendimento={() => setAbaAtiva("atendimento")}
                />
              )}

              {/* ── AJUSTES ── */}
              {abaAtiva === "ajustes" && cliente && (
                <DesktopAjustesSection
                  cliente={cliente}
                  onLogout={handleReset}
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
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* ── Modal PIX ── */}
      <Dialog
        open={Boolean(pixSelecionado)}
        onOpenChange={(open) => {
          if (!open) setPixSelecionado(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
            <DialogDescription>
              QR Code e código copia e cola da cobrança Asaas.
            </DialogDescription>
          </DialogHeader>
          {pixSelecionado ? (
            <div className="space-y-4">
              <div className="rounded-md border bg-slate-50 p-3 text-sm space-y-1">
                <p className="font-semibold text-slate-800">
                  {pixSelecionado.descricao}
                </p>
                <p className="text-slate-600">
                  Valor: {formatCurrency(pixSelecionado.valor)}
                </p>
                <p className="text-slate-600">
                  Vencimento: {formatDate(pixSelecionado.vencimento)}
                </p>
              </div>

              <div className="flex justify-center rounded-md border bg-white p-3">
                {/* Se o Asaas já retornar imagem/base64, usa direto; se retornar payload, gera QR visual */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPixQrImageSrc(pixSelecionado.codigo)}
                  alt="QR Code PIX"
                  className="h-64 w-64 object-contain"
                />
              </div>

              <div className="rounded-md border bg-slate-50 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Código PIX (copia e cola)
                </p>
                <p className="text-xs break-all text-slate-700">
                  {pixSelecionado.codigo}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1 gap-2"
                  onClick={() => copiarCodigoPix(pixSelecionado.codigo)}
                >
                  <Copy className="h-4 w-4" />
                  Copiar código PIX
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (pixSelecionado.codigo.startsWith("http")) {
                      window.open(pixSelecionado.codigo, "_blank");
                    }
                  }}
                  disabled={!pixSelecionado.codigo.startsWith("http")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={modalCadastroAberto} onOpenChange={setModalCadastroAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escolha um cadastro para acessar</DialogTitle>
            <DialogDescription>
              Este CPF foi encontrado em mais de uma unidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {cadastrosEncontrados.map((cadastro) => (
              <Button
                key={cadastro.tenant.slug}
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleSelecionarCadastro(cadastro)}
              >
                <span>{cadastro.tenant.label}</span>
                <span className="text-xs text-slate-500">
                  {cadastro.cliente.nome}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =====================================================================
   DesktopAtendimentoSection
   ===================================================================== */

const TENANT_ATENDIMENTO_CONFIG: Record<
  string,
  { centralNumber: string; sacNumber: string; whatsappNumber: string }
> = {
  bosque: {
    centralNumber: "71 3034-7323",
    sacNumber: "71 3034-7323",
    whatsappNumber: "71 3034-7323",
  },
  pax: {
    centralNumber: "71 3034-7323",
    sacNumber: "71 3034-7323",
    whatsappNumber: "71 3034-7323",
  },
  lider: {
    centralNumber: "71 3034-7323",
    sacNumber: "71 3034-7323",
    whatsappNumber: "71 3034-7323",
  },
};

function DesktopAtendimentoSection({
  tenantSlug,
}: {
  tenantSlug: string | null;
}) {
  const config =
    TENANT_ATENDIMENTO_CONFIG[(tenantSlug ?? "").toLowerCase()] ??
    TENANT_ATENDIMENTO_CONFIG.bosque;
  const centralTel = config.centralNumber.replace(/\D/g, "");
  const sacTel = config.sacNumber.replace(/\D/g, "");
  const whatsappTel = config.whatsappNumber.replace(/\D/g, "");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Central de Relacionamento */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-[#e8f5e3] flex items-center justify-center flex-shrink-0">
              <Phone className="h-4 w-4 text-[#2d7a1f]" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Central de Relacionamento
              </h2>
              <p className="text-xs text-slate-400">
                Consultas, informações e serviços
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-xs text-slate-400 font-medium">Telefone</p>
                <p className="text-sm font-semibold text-slate-800">
                  {config.centralNumber}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5 text-[#2d7a1f] border-[#c5e3be] hover:bg-[#f2faf0]"
                onClick={() => window.open(`tel:${centralTel}`, "_self")}
              >
                <Phone className="h-3 w-3" /> Ligar
              </Button>
            </div>
            <Button
              className="w-full bg-[#25d366] hover:bg-[#1da851] text-white gap-2"
              onClick={() =>
                window.open(`https://wa.me/55${whatsappTel}`, "_blank")
              }
            >
              <MessageCircle className="h-4 w-4" />
              Iniciar conversa pelo WhatsApp
            </Button>
          </div>
        </div>

        {/* SAC */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Headset className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">SAC</h2>
              <p className="text-xs text-slate-400">
                Reclamações, cancelamentos e informações
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-400 font-medium">Telefone SAC</p>
              <p className="text-sm font-semibold text-slate-800">
                {config.sacNumber}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
              onClick={() => window.open(`tel:${sacTel}`, "_self")}
            >
              <Phone className="h-3 w-3" /> Ligar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   DesktopParceriasSection
   ===================================================================== */

function DesktopParceriasSection({
  onGoAtendimento,
}: {
  onGoAtendimento: () => void;
}) {
  const [q, setQ] = React.useState("");
  const [categoriaId, setCategoriaId] = React.useState<number | undefined>();
  const [slugSelecionado, setSlugSelecionado] = React.useState<string | null>(
    null,
  );

  const { data: categorias = [] } = useQuery({
    queryKey: ["parcerias-desktop", "categorias"],
    queryFn: listarCategoriasCliente,
  });

  const {
    data: vantagens = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["parcerias-desktop", "vantagens", q, categoriaId],
    queryFn: () => listarVantagensCliente({ q, categoriaId }),
  });

  const { data: detalhe, isLoading: loadingDetalhe } = useQuery({
    queryKey: ["parcerias-desktop", "detalhe", slugSelecionado],
    queryFn: () => obterVantagemCliente(String(slugSelecionado)),
    enabled: Boolean(slugSelecionado),
  });

  const handleAcao = async (
    vantagem: ParceriaVantagemResumo,
    canal: "CUPOM" | "LINK" | "WHATSAPP",
    url?: string | null,
  ) => {
    if (!vantagem.elegivel) return;
    try {
      await registrarResgate(vantagem.id, canal);
    } catch {
      /* silent */
    }
    if (canal === "CUPOM" && detalhe?.codigoCupom) {
      await navigator.clipboard.writeText(detalhe.codigoCupom);
    }
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Gift className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Parcerias e Vantagens
            </h2>
            <p className="text-xs text-slate-400">
              Descontos e benefícios exclusivos para membros do plano
            </p>
          </div>
        </div>

        {/* Busca + categorias */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#3a9b28]/30 focus:border-[#3a9b28]"
            placeholder="Buscar parceiro ou vantagem..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto">
            <button
              type="button"
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${!categoriaId ? "bg-[#2d7a1f] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              onClick={() => setCategoriaId(undefined)}
            >
              Todas
            </button>
            {categorias.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${categoriaId === c.id ? "bg-[#2d7a1f] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                onClick={() => setCategoriaId(c.id)}
              >
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Carregando vantagens...</span>
          </div>
        )}
        {isError && (
          <p className="text-sm text-rose-600 py-4">
            Falha ao carregar vantagens.
          </p>
        )}
        {!isLoading && !isError && vantagens.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Gift className="h-10 w-10 mx-auto mb-3 text-slate-200" />
            <p className="text-sm font-semibold text-slate-600">Em breve!</p>
            <p className="text-xs mt-1">
              Estamos preparando parcerias e vantagens exclusivas para os
              membros do plano.
            </p>
          </div>
        )}
        {!isLoading && vantagens.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {vantagens.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSlugSelecionado(item.slug)}
                className="text-left p-4 rounded-xl border border-slate-100 hover:border-[#c5e3be] hover:bg-[#f2faf0]/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Tag className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {item.titulo}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {item.descricaoCurta || item.parceiro.nome}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.parceiro.nome}
                      {item.parceiro.cidade
                        ? ` • ${item.parceiro.cidade}/${item.parceiro.uf ?? ""}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    {item.tipo}
                  </span>
                  <span
                    className={`text-xs ${item.elegivel ? "text-[#2d7a1f]" : "text-rose-600"}`}
                  >
                    {item.elegivel
                      ? "Disponível"
                      : item.motivoBloqueio || "Indisponível"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal detalhe */}
      <Dialog
        open={Boolean(slugSelecionado)}
        onOpenChange={(open) => {
          if (!open) setSlugSelecionado(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detalhe?.titulo ??
                (loadingDetalhe ? "Carregando..." : "Vantagem")}
            </DialogTitle>
          </DialogHeader>
          {loadingDetalhe ? (
            <div className="flex items-center gap-2 py-6 text-slate-400 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando
              detalhes...
            </div>
          ) : detalhe ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                {detalhe.descricaoCompleta || detalhe.descricaoCurta}
              </p>
              {detalhe.regrasUso && (
                <p className="text-xs text-slate-400 border-t pt-3">
                  {detalhe.regrasUso}
                </p>
              )}
              {!detalhe.elegivel && detalhe.motivoBloqueio && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{detalhe.motivoBloqueio}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2 flex-wrap">
                {detalhe.codigoCupom && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => handleAcao(detalhe, "CUPOM")}
                    disabled={!detalhe.elegivel}
                  >
                    <Copy className="h-3 w-3" /> Copiar cupom
                  </Button>
                )}
                {detalhe.linkResgate && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() =>
                      handleAcao(detalhe, "LINK", detalhe.linkResgate)
                    }
                    disabled={!detalhe.elegivel}
                  >
                    <ExternalLink className="h-3 w-3" /> Abrir link
                  </Button>
                )}
                {detalhe.whatsapp && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() =>
                      handleAcao(
                        detalhe,
                        "WHATSAPP",
                        `https://wa.me/${detalhe.whatsapp?.replace(/\D/g, "")}`,
                      )
                    }
                    disabled={!detalhe.elegivel}
                  >
                    <MessageCircle className="h-3 w-3" /> WhatsApp
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Dúvidas?{" "}
                <button
                  type="button"
                  className="text-[#3a9b28] underline font-medium"
                  onClick={() => {
                    setSlugSelecionado(null);
                    onGoAtendimento();
                  }}
                >
                  Fale com nosso atendimento
                </button>
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =====================================================================
   DesktopAjustesSection
   ===================================================================== */

type CardDesktopValues = {
  holderName: string;
  holderCpf: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

function formatCardNumDesktop(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}
function formatCpfDesktop(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function validateCardDesktop(card: CardDesktopValues) {
  const errors: Partial<Record<keyof CardDesktopValues, string>> = {};
  if (!card.holderName.trim() || card.holderName.trim().length < 3)
    errors.holderName = "Informe o nome impresso no cartão.";
  if (card.holderCpf.replace(/\D/g, "").length !== 11)
    errors.holderCpf = "CPF do portador inválido.";
  const digits = card.number.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19)
    errors.number = "Número do cartão inválido.";
  const month = Number(card.expiryMonth.replace(/\D/g, ""));
  if (!month || month < 1 || month > 12) errors.expiryMonth = "Mês inválido.";
  if (card.expiryYear.replace(/\D/g, "").length < 2)
    errors.expiryYear = "Ano inválido.";
  if (card.ccv.replace(/\D/g, "").length < 3) errors.ccv = "CVV inválido.";
  return errors;
}

function emptyCardDesktop(): CardDesktopValues {
  return {
    holderName: "",
    holderCpf: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: "",
  };
}

function DesktopAjustesSection({
  cliente,
  onLogout,
  onPagamentoAlterado,
}: {
  cliente: ClientePlano;
  onLogout: () => void;
  onPagamentoAlterado?: (novoMetodo: string) => void;
}) {
  const [subView, setSubView] = React.useState<
    "menu" | "senha" | "pagamento-menu" | "trocar-metodo" | "atualizar-cartao"
  >("menu");
  const [pwdCurrent, setPwdCurrent] = React.useState("");
  const [pwdNew, setPwdNew] = React.useState("");
  const [pwdConfirm, setPwdConfirm] = React.useState("");
  const [pwdLoading, setPwdLoading] = React.useState(false);
  const [pwdError, setPwdError] = React.useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = React.useState(false);

  const [card, setCard] = React.useState<CardDesktopValues>(emptyCardDesktop());
  const [cardErrors, setCardErrors] = React.useState<
    Partial<Record<keyof CardDesktopValues, string>>
  >({});
  const [novoMetodo, setNovoMetodo] =
    React.useState<MetodoPagamentoBillingType>("PIX");
  const [pagLoading, setPagLoading] = React.useState(false);
  const [pagError, setPagError] = React.useState<string | null>(null);
  const [pagSuccess, setPagSuccess] = React.useState(false);

  const metodoAtual = cliente.metodoPagamentoAtual;
  const cartao = cliente.cartaoPagamento;

  const labelMetodo = (m?: string | null) => {
    if (m === "CREDIT_CARD") return "Cartão de crédito";
    if (m === "PIX") return "PIX";
    if (m === "BOLETO") return "Boleto";
    return "—";
  };

  const handleSenhaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    if (!pwdCurrent) {
      setPwdError("Informe sua senha atual.");
      return;
    }
    const validacao = validatePassword(pwdNew);
    if (validacao) {
      setPwdError(validacao);
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError("As senhas não conferem.");
      return;
    }
    setPwdLoading(true);
    try {
      await changePassword({
        currentPassword: pwdCurrent,
        newPassword: pwdNew,
      });
      setPwdSuccess(true);
      setTimeout(() => {
        setSubView("menu");
        setPwdSuccess(false);
        setPwdCurrent("");
        setPwdNew("");
        setPwdConfirm("");
      }, 2000);
    } catch (err) {
      const e = err as { response?: { data?: { message?: unknown } } };
      setPwdError(
        typeof e?.response?.data?.message === "string"
          ? e.response.data.message
          : "Não foi possível alterar a senha.",
      );
    } finally {
      setPwdLoading(false);
    }
  };

  const handleAtualizarCartao = async (e: React.FormEvent) => {
    e.preventDefault();
    setPagError(null);
    const errs = validateCardDesktop(card);
    if (Object.keys(errs).length > 0) {
      setCardErrors(errs);
      return;
    }
    setPagLoading(true);
    try {
      const result = await alterarPagamentoCliente({
        action: "ATUALIZAR_CARTAO",
        creditCard: card as CreditCardPayload,
      });
      setPagSuccess(true);
      onPagamentoAlterado?.(result.metodoPagamento);
      setTimeout(() => {
        setSubView("pagamento-menu");
        setPagSuccess(false);
        setCard(emptyCardDesktop());
      }, 2000);
    } catch (err) {
      const e = err as { response?: { data?: { message?: unknown } } };
      setPagError(
        typeof e?.response?.data?.message === "string"
          ? e.response.data.message
          : "Não foi possível atualizar o cartão.",
      );
    } finally {
      setPagLoading(false);
    }
  };

  const handleTrocarMetodo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPagError(null);
    if (novoMetodo === "CREDIT_CARD") {
      const errs = validateCardDesktop(card);
      if (Object.keys(errs).length > 0) {
        setCardErrors(errs);
        return;
      }
    }
    setPagLoading(true);
    try {
      const result = await alterarPagamentoCliente({
        action: "TROCAR_METODO",
        novoMetodo,
        creditCard:
          novoMetodo === "CREDIT_CARD"
            ? (card as CreditCardPayload)
            : undefined,
      });
      setPagSuccess(true);
      onPagamentoAlterado?.(result.metodoPagamento);
      setTimeout(() => {
        setSubView("pagamento-menu");
        setPagSuccess(false);
        setCard(emptyCardDesktop());
      }, 2000);
    } catch (err) {
      const e = err as { response?: { data?: { message?: unknown } } };
      setPagError(
        typeof e?.response?.data?.message === "string"
          ? e.response.data.message
          : "Não foi possível alterar o método.",
      );
    } finally {
      setPagLoading(false);
    }
  };

  const cardFormField = (
    label: string,
    field: keyof CardDesktopValues,
    placeholder: string,
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"],
    autoComplete?: string,
    formatter?: (v: string) => string,
  ) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        className={`w-full h-9 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9b28]/30 focus:border-[#3a9b28] ${cardErrors[field] ? "border-rose-400" : "border-slate-200"}`}
        value={card[field]}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(ev) => {
          const val = formatter ? formatter(ev.target.value) : ev.target.value;
          setCard((prev) => ({ ...prev, [field]: val }));
          setCardErrors((prev) => ({ ...prev, [field]: undefined }));
        }}
      />
      {cardErrors[field] && (
        <p className="text-xs text-rose-600">{cardErrors[field]}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-100">
          {subView !== "menu" && (
            <button
              type="button"
              onClick={() => {
                setSubView("menu");
                setPwdError(null);
                setPagError(null);
                setCardErrors({});
              }}
              className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition"
            >
              <ArrowRight className="h-4 w-4 text-slate-500 rotate-180" />
            </button>
          )}
          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Settings className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              {subView === "menu"
                ? "Ajustes"
                : subView === "senha"
                  ? "Alterar Senha"
                  : subView === "pagamento-menu"
                    ? "Pagamento"
                    : subView === "trocar-metodo"
                      ? "Trocar Método"
                      : "Atualizar Cartão"}
            </h2>
            <p className="text-xs text-slate-400">
              {subView === "menu" ? "Gerencie sua conta e configurações" : ""}
            </p>
          </div>
        </div>

        <div className="p-6">
          {/* MENU */}
          {subView === "menu" && (
            <div className="divide-y divide-slate-100">
              {[
                {
                  icon: KeyRound,
                  label: "Alterar senha",
                  desc: "Altere sua senha de acesso",
                  action: () => setSubView("senha"),
                },
                {
                  icon: CreditCard,
                  label: "Pagamento",
                  desc: `Método atual: ${labelMetodo(metodoAtual)}`,
                  action: () => setSubView("pagamento-menu"),
                },
                {
                  icon: Lock,
                  label: "Política de Privacidade",
                  desc: "Veja como seus dados são usados",
                  action: () => window.open("/privacidade", "_blank"),
                },
              ].map(({ icon: Icon, label, desc, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  className="w-full flex items-center gap-4 py-4 hover:bg-slate-50 -mx-6 px-6 transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {label}
                    </p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </button>
              ))}
              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                  onClick={onLogout}
                >
                  <LogOut className="h-4 w-4" /> Sair da conta
                </Button>
              </div>
            </div>
          )}

          {/* ALTERAR SENHA */}
          {subView === "senha" && (
            <form onSubmit={handleSenhaSubmit} className="space-y-4 max-w-sm">
              {pwdSuccess ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="h-14 w-14 rounded-full bg-[#e8f5e3] flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-[#3a9b28]" />
                  </div>
                  <p className="font-semibold text-slate-800">
                    Senha alterada com sucesso!
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Senha atual
                    </label>
                    <input
                      type="password"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9b28]/30 focus:border-[#3a9b28]"
                      value={pwdCurrent}
                      onChange={(e) => setPwdCurrent(e.target.value)}
                      autoComplete="current-password"
                      placeholder="Senha atual"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Nova senha
                    </label>
                    <input
                      type="password"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9b28]/30 focus:border-[#3a9b28]"
                      value={pwdNew}
                      onChange={(e) => setPwdNew(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Mín. 8 caracteres"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Confirmar nova senha
                    </label>
                    <input
                      type="password"
                      className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9b28]/30 focus:border-[#3a9b28]"
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
                    />
                  </div>
                  {pwdError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{pwdError}</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
                    disabled={pwdLoading}
                  >
                    {pwdLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Salvando...
                      </>
                    ) : (
                      "Alterar senha"
                    )}
                  </Button>
                </>
              )}
            </form>
          )}

          {/* PAGAMENTO — MENU */}
          {subView === "pagamento-menu" && (
            <div className="space-y-4 max-w-sm">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">
                  Método atual
                </p>
                <div className="flex items-center gap-3">
                  {metodoAtual === "CREDIT_CARD" && (
                    <CreditCard className="h-5 w-5 text-[#3a9b28]" />
                  )}
                  {metodoAtual === "PIX" && (
                    <QrCode className="h-5 w-5 text-[#3a9b28]" />
                  )}
                  {(metodoAtual === "BOLETO" || !metodoAtual) && (
                    <Barcode className="h-5 w-5 text-[#3a9b28]" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {labelMetodo(metodoAtual)}
                    </p>
                    {cartao && (
                      <p className="text-xs text-slate-500">
                        {cartao.brand} •••• {cartao.last4} — {cartao.holderName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {metodoAtual === "CREDIT_CARD" && (
                  <button
                    type="button"
                    onClick={() => {
                      setCard(emptyCardDesktop());
                      setCardErrors({});
                      setPagError(null);
                      setPagSuccess(false);
                      setSubView("atualizar-cartao");
                    }}
                    className="w-full flex items-center gap-4 py-3 hover:bg-slate-50 transition text-left"
                  >
                    <CreditCard className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <span className="flex-1 text-sm text-slate-700">
                      Atualizar cartão de crédito
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCard(emptyCardDesktop());
                    setCardErrors({});
                    setPagError(null);
                    setPagSuccess(false);
                    setSubView("trocar-metodo");
                  }}
                  className="w-full flex items-center gap-4 py-3 hover:bg-slate-50 transition text-left"
                >
                  <ArrowRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                  <span className="flex-1 text-sm text-slate-700">
                    Trocar método de pagamento
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </button>
              </div>
            </div>
          )}

          {/* ATUALIZAR CARTÃO */}
          {subView === "atualizar-cartao" && (
            <form
              onSubmit={handleAtualizarCartao}
              className="space-y-4 max-w-sm"
            >
              {pagSuccess ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="h-14 w-14 rounded-full bg-[#e8f5e3] flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-[#3a9b28]" />
                  </div>
                  <p className="font-semibold text-slate-800">
                    Cartão atualizado!
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    O novo cartão substituirá o atual na recorrência mensal.
                  </p>
                  {cardFormField(
                    "Nome no cartão",
                    "holderName",
                    "Como está no cartão",
                    "text",
                    "cc-name",
                  )}
                  {cardFormField(
                    "CPF do portador",
                    "holderCpf",
                    "000.000.000-00",
                    "numeric",
                    "off",
                    formatCpfDesktop,
                  )}
                  {cardFormField(
                    "Número do cartão",
                    "number",
                    "0000 0000 0000 0000",
                    "numeric",
                    "cc-number",
                    formatCardNumDesktop,
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    {cardFormField(
                      "Mês",
                      "expiryMonth",
                      "MM",
                      "numeric",
                      "cc-exp-month",
                      (v) => v.replace(/\D/g, "").slice(0, 2),
                    )}
                    {cardFormField(
                      "Ano",
                      "expiryYear",
                      "AAAA",
                      "numeric",
                      "cc-exp-year",
                      (v) => v.replace(/\D/g, "").slice(0, 4),
                    )}
                    {cardFormField(
                      "CVV",
                      "ccv",
                      "CVV",
                      "numeric",
                      "cc-csc",
                      (v) => v.replace(/\D/g, "").slice(0, 4),
                    )}
                  </div>
                  {pagError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{pagError}</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
                    disabled={pagLoading}
                  >
                    {pagLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Salvando...
                      </>
                    ) : (
                      "Salvar novo cartão"
                    )}
                  </Button>
                </>
              )}
            </form>
          )}

          {/* TROCAR MÉTODO */}
          {subView === "trocar-metodo" && (
            <form onSubmit={handleTrocarMetodo} className="space-y-4 max-w-sm">
              {pagSuccess ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="h-14 w-14 rounded-full bg-[#e8f5e3] flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-[#3a9b28]" />
                  </div>
                  <p className="font-semibold text-slate-800">
                    Método atualizado!
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {(
                      [
                        "PIX",
                        "BOLETO",
                        "CREDIT_CARD",
                      ] as MetodoPagamentoBillingType[]
                    ).map((opt) => {
                      const isAtual = opt === metodoAtual;
                      const labels: Record<string, string> = {
                        PIX: "PIX",
                        BOLETO: "Boleto bancário",
                        CREDIT_CARD: "Cartão de crédito",
                      };
                      const descs: Record<string, string> = {
                        PIX: "Cobrança instantânea com QR Code.",
                        BOLETO: "Pagamento por boleto mensal.",
                        CREDIT_CARD: "Recorrência automática no cartão.",
                      };
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={isAtual}
                          onClick={() => {
                            setNovoMetodo(opt);
                            setCardErrors({});
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${novoMetodo === opt ? "border-[#3a9b28] bg-[#f2faf0]" : "border-slate-200 hover:border-slate-300"} ${isAtual ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div
                            className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${novoMetodo === opt ? "border-[#3a9b28]" : "border-slate-300"}`}
                          >
                            {novoMetodo === opt && (
                              <div className="h-2.5 w-2.5 rounded-full bg-[#3a9b28]" />
                            )}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-slate-800">
                              {labels[opt]}
                              {isAtual && (
                                <span className="text-xs text-slate-400 ml-2">
                                  (atual)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">
                              {descs[opt]}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {novoMetodo === "CREDIT_CARD" && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      {cardFormField(
                        "Nome no cartão",
                        "holderName",
                        "Como está no cartão",
                        "text",
                        "cc-name",
                      )}
                      {cardFormField(
                        "CPF do portador",
                        "holderCpf",
                        "000.000.000-00",
                        "numeric",
                        "off",
                        formatCpfDesktop,
                      )}
                      {cardFormField(
                        "Número do cartão",
                        "number",
                        "0000 0000 0000 0000",
                        "numeric",
                        "cc-number",
                        formatCardNumDesktop,
                      )}
                      <div className="grid grid-cols-3 gap-3">
                        {cardFormField(
                          "Mês",
                          "expiryMonth",
                          "MM",
                          "numeric",
                          "cc-exp-month",
                          (v) => v.replace(/\D/g, "").slice(0, 2),
                        )}
                        {cardFormField(
                          "Ano",
                          "expiryYear",
                          "AAAA",
                          "numeric",
                          "cc-exp-year",
                          (v) => v.replace(/\D/g, "").slice(0, 4),
                        )}
                        {cardFormField(
                          "CVV",
                          "ccv",
                          "CVV",
                          "numeric",
                          "cc-csc",
                          (v) => v.replace(/\D/g, "").slice(0, 4),
                        )}
                      </div>
                    </div>
                  )}
                  {pagError && (
                    <Alert variant="destructive" className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{pagError}</AlertDescription>
                    </Alert>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
                    disabled={pagLoading || novoMetodo === metodoAtual}
                  >
                    {pagLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Salvando...
                      </>
                    ) : (
                      "Confirmar troca"
                    )}
                  </Button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

type AssinaturaCardProps = {
  tipoId: string;
  titulo: string;
  assinatura?: AssinaturaDigital;
  onSalvar: (tipo: string, assinaturaBase64: string) => Promise<void>;
  salvando: boolean;
  estado: "pendente" | "ativa" | "concluida";
  previewUrl?: string;
  downloadUrl?: string;
};

function AssinaturaCard({
  tipoId,
  titulo,
  assinatura,
  onSalvar,
  salvando,
  estado,
  previewUrl,
  downloadUrl,
}: AssinaturaCardProps) {
  const [capturando, setCapturando] = useState(false);
  const padRef = useRef<SignaturePadHandle>(null);

  const iniciarCaptura = () => {
    if (estado !== "pendente" && estado !== "ativa") return;
    setCapturando(true);
  };

  const cancelarCaptura = () => {
    setCapturando(false);
  };

  const confirmarAssinatura = async () => {
    if (!padRef.current) return;
    if (!padRef.current.hasDrawing()) {
      alert("Por favor, assine antes de salvar.");
      return;
    }
    const dataUrl = padRef.current.getDataURL();
    if (!dataUrl) return;

    await onSalvar(tipoId, dataUrl);
    setCapturando(false);
  };

  if (capturando) {
    return (
      <Card className="border-[#c5e3be] shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-[#1e5a14]">
            Coletando: {titulo}
          </CardTitle>
          <CardDescription>
            Assine no quadro abaixo usando o mouse ou dedo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
            <SignaturePad
              ref={padRef}
              width={600}
              height={200}
              className="touch-none bg-white cursor-crosshair"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={cancelarCaptura}
            disabled={salvando}
            className="text-slate-500"
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmarAssinatura}
            disabled={salvando}
            className="bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
          >
            {salvando ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Salvar Assinatura
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (estado === "concluida" && assinatura) {
    return (
      <Card className="border-[#e8f5e3] bg-[#f2faf0]/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-[#1e5a14] flex items-center justify-between">
            {titulo}
            <CheckCircle className="h-5 w-5 text-[#3a9b28]" />
          </CardTitle>
          <CardDescription className="text-xs">
            Assinado em {formatDate(assinatura.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 w-full border border-[#e8f5e3] bg-white rounded flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Assinatura"
                width={320}
                height={80}
                unoptimized
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400">
                Visualização indisponível
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          {downloadUrl && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[#2d7a1f] border-[#c5e3be] hover:bg-[#f2faf0]"
              onClick={() => window.open(downloadUrl, "_blank")}
            >
              <Download className="mr-2 size-4" />
              Baixar Arquivo
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card
      className={`transition-all ${
        estado === "ativa"
          ? "border-[#3a9b28] shadow-md ring-2 ring-[#e8f5e3]"
          : "border-slate-200 opacity-70 grayscale"
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-slate-700 flex items-center justify-between">
          {titulo}
          {estado === "ativa" && (
            <span className="flex h-2 w-2 rounded-full bg-[#3a9b28]"></span>
          )}
        </CardTitle>
        <CardDescription>
          {estado === "ativa"
            ? "Aguardando assinatura"
            : "Aguarde a etapa anterior"}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button
          className={`w-full ${
            estado === "ativa"
              ? "bg-[#3a9b28] hover:bg-[#2d7a1f] text-white"
              : "bg-slate-100 text-slate-400"
          }`}
          disabled={estado !== "ativa"}
          onClick={iniciarCaptura}
        >
          <PenTool className="mr-2 size-4" />
          Assinar Agora
        </Button>
      </CardFooter>
    </Card>
  );
}
