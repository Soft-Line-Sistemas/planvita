"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const TIPOS_ASSINATURA = [
  { id: "TITULAR_ASSINATURA_1", label: "Titular - Assinatura 1" },
  { id: "TITULAR_ASSINATURA_2", label: "Titular - Assinatura 2" },
  { id: "CORRESPONSAVEL_ASSINATURA_1", label: "Responsável financeiro - 1" },
  { id: "CORRESPONSAVEL_ASSINATURA_2", label: "Responsável financeiro - 2" },
] as const;
const CONTRATO_URL = "/docs/contrato.docx";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
const API_VERSION =
  process.env.NEXT_PUBLIC_API_VERSION || process.env.API_VERSION || "v1";
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
    "carteirinha" | "plano" | "dependentes" | "financeiro" | "assinaturas"
  >("carteirinha");
  const [assinaturaEmProgresso, setAssinaturaEmProgresso] = useState<
    string | null
  >(null);
  const [assinaturaMensagem, setAssinaturaMensagem] = useState<string | null>(
    null,
  );
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
    if (!tenantAtivo) return;
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
      if (!ASSINATURA_API_BASE || !cliente?.titularId || !assinaturaId) {
        return undefined;
      }
      const base = `${ASSINATURA_API_BASE}/titular/${cliente.titularId}/assinaturas/${assinaturaId}/arquivo`;
      const params = new URLSearchParams();
      if (mode === "inline") {
        params.set("mode", "inline");
      }
      if (tenantAtivo) {
        params.set("tenant", tenantAtivo);
      }
      return params.toString() ? `${base}?${params.toString()}` : base;
    },
    [cliente?.titularId, tenantAtivo],
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
        response?: { data?: { message?: unknown } };
      };
      const serverMessage =
        typeof errorObject?.response?.data?.message === "string"
          ? errorObject.response.data.message
          : null;
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
    queryFn: () => listarContasDoCliente(cliente!.titularId!),
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
    queryFn: () => listarAssinaturas(cliente!.titularId!),
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
      await salvarAssinatura(cliente.titularId, { tipo, assinaturaBase64 });
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
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">
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

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-100 via-white to-slate-100 pb-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pt-16">
        <header className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-[#22c55e]">
            Planvita
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Área do Cliente
          </h1>
          <p className="text-base text-slate-600 md:text-lg">
            Entre com seu CPF ou e-mail e sua senha para acessar sua
            carteirinha, boletos e plano.
          </p>
        </header>

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
                {firstAccessStep === "setPassword" &&
                firstAccessVerificationToken
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
                    <label className="text-sm font-medium text-slate-700">
                      {`Código enviado para ${firstAccessDestination || "seu contato"}`}
                    </label>
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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

        {!cliente && !authChecked && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          </div>
        )}

        {!cliente && authChecked && (
          <div className="mx-auto w-full max-w-lg space-y-6">
            <Card className="shadow-lg border-slate-200">
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>
                  Use seu CPF ou e-mail. Se for seu primeiro acesso, crie sua
                  senha.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="login"
                      className="text-sm font-medium text-slate-700"
                    >
                      Login (CPF ou e-mail)
                    </label>
                    <Input
                      id="login"
                      name="login"
                      placeholder="CPF ou e-mail"
                      value={loginValue}
                      onChange={(event) => setLoginValue(event.target.value)}
                      className={authError ? "border-red-500" : ""}
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="senha"
                      className="text-sm font-medium text-slate-700"
                    >
                      Senha
                    </label>
                    <Input
                      id="senha"
                      name="senha"
                      type="password"
                      placeholder="Sua senha"
                      value={senhaValue}
                      onChange={(event) => setSenhaValue(event.target.value)}
                      className={authError ? "border-red-500" : ""}
                      autoComplete="current-password"
                    />
                  </div>

                  {authError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{authError}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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

                  <div className="flex flex-col items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-center text-center text-slate-600 hover:text-slate-900"
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
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-center text-center text-slate-600 hover:text-slate-900"
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
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-center text-center text-slate-600 hover:text-slate-900"
                        onClick={() => setMostrarAcessoRapido((prev) => !prev)}
                      >
                        {mostrarAcessoRapido
                          ? "Ocultar acesso rápido"
                          : "Acesso rápido (legado) por CPF"}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {ENABLE_LEGACY_QUICK_ACCESS && mostrarAcessoRapido && (
              <Card className="shadow-lg border-slate-200">
                <CardHeader>
                  <CardTitle>Acesso rápido (legado)</CardTitle>
                  <CardDescription>
                    Consulta direta por CPF (modo compatível com o sistema
                    atual).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
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
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
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
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!isLoading && cliente && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  {cliente.nome.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {cliente.nome}
                  </h2>
                  <p className="text-sm text-slate-500">{cliente.cpf}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-slate-500 hover:text-slate-900"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sair / Nova Consulta
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {[
                { id: "carteirinha", label: "Carteirinha" },
                { id: "plano", label: "Meu Plano" },
                cliente?.dependentes && cliente.dependentes.length > 0
                  ? { id: "dependentes", label: "Dependentes" }
                  : null,
                { id: "financeiro", label: "Financeiro e Boletos" },
                { id: "assinaturas", label: "Assinaturas" },
              ]
                .filter(Boolean)
                .map((aba) => (
                  <button
                    key={(aba as { id: string }).id}
                    onClick={() =>
                      setAbaAtiva((aba as { id: string }).id as typeof abaAtiva)
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                      abaAtiva === (aba as { id: string }).id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {(aba as { label: string }).label}
                  </button>
                ))}
            </div>

            {posSuspensaoAtingido && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Plano suspenso com pendência prolongada</AlertTitle>
                <AlertDescription>
                  Seu plano está suspenso há mais de {diasPosSuspensao} dias de
                  atraso. Regularize o pagamento para solicitar a reativação.
                </AlertDescription>
              </Alert>
            )}

            {!posSuspensaoAtingido && suspensoPorRegra && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Plano suspenso</AlertTitle>
                <AlertDescription>
                  Seu plano atingiu a regra de suspensão ({diasSuspensao} dias
                  de atraso). Regularize o pagamento para retomar os benefícios.
                </AlertDescription>
              </Alert>
            )}

            {abaAtiva === "carteirinha" && clienteExibicao && (
              <CarteirinhaAsImage
                cliente={clienteExibicao}
                isFlipped={isFlipped}
                setIsFlipped={setIsFlipped}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            )}

            {abaAtiva === "plano" && clienteExibicao && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-emerald-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700">
                      <FileText className="h-5 w-5" />
                      Detalhes do Contrato
                    </CardTitle>
                    <CardDescription>
                      Informações completas sobre seu plano atual.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">
                          Plano Contratado
                        </span>
                        <p className="font-semibold text-lg">
                          {cliente.plano.nome}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">
                          Código do Contrato
                        </span>
                        <p className="font-medium">{cliente.plano.codigo}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">
                          Valor Mensal
                        </span>
                        <p className="font-medium">
                          {formatCurrency(cliente.plano.valorMensal)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Status</span>
                        <Badge
                          variant={
                            clienteExibicao.plano.status === "ativo"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            clienteExibicao.plano.status === "ativo"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : ""
                          }
                        >
                          {clienteExibicao.plano.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-gray-500">Vigência</span>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {formatDate(cliente.plano.vigencia.inicio)} até{" "}
                          {formatDate(cliente.plano.vigencia.fim)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 text-emerald-800">
                        Coberturas e Benefícios
                      </h4>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        {cliente.plano.cobertura.map((item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="flex items-start gap-2"
                          >
                            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-emerald-100 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-700 text-base">
                      <History className="h-5 w-5" />
                      Histórico do Plano
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative pl-4 border-l-2 border-emerald-100 space-y-6">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" />
                        <p className="text-sm font-medium">Situação Atual</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(new Date().toISOString())}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Plano {clienteExibicao.plano.status}
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-gray-300 ring-4 ring-white" />
                        <p className="text-sm font-medium">Contratação</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(cliente.plano.vigencia.inicio)}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Início da vigência do plano {cliente.plano.nome}.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {abaAtiva === "dependentes" && (
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    Dependentes do plano
                  </CardTitle>
                  <CardDescription>
                    Veja quem está vinculado ao seu plano como dependente.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cliente.dependentes && cliente.dependentes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cliente.dependentes.map((dep) => (
                        <div
                          key={dep.id}
                          className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4 flex flex-col gap-1"
                        >
                          <span className="text-sm font-semibold text-slate-900">
                            {dep.nome}
                          </span>
                          {dep.tipo && (
                            <span className="text-xs uppercase tracking-wide text-emerald-700">
                              {dep.tipo}
                            </span>
                          )}
                          {dep.dataNascimento && (
                            <span className="text-xs text-slate-500">
                              Nascimento: {formatDate(dep.dataNascimento)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Nenhum dependente cadastrado neste plano.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {abaAtiva === "financeiro" && (
              <Card className="border-emerald-100 shadow-sm">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-emerald-700 flex items-center gap-2">
                      <Barcode className="h-5 w-5" />
                      Minhas Faturas
                    </CardTitle>
                    <CardDescription>
                      Consulte seus boletos, status de pagamento e emita 2ª via.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      value={filtroPeriodo}
                      onValueChange={setFiltroPeriodo}
                    >
                      <SelectTrigger className="w-[180px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todo o período</SelectItem>
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
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="pago">Pago</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {mensagemFinanceiro ? (
                    <Alert className="mb-4">
                      <AlertDescription>{mensagemFinanceiro}</AlertDescription>
                    </Alert>
                  ) : null}
                  {isLoadingFinanceiro ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <p>Buscando suas faturas...</p>
                    </div>
                  ) : contasFiltradas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Descrição</th>
                            <th className="px-4 py-2 text-left">Vencimento</th>
                            <th className="px-4 py-2 text-left">Valor</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contasFiltradas.map((conta) => (
                            <tr key={conta.id} className="border-b">
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  {conta.descricao}
                                  {(conta.asaasPaymentId ||
                                    conta.asaasSubscriptionId) && (
                                    <AsaasWingsMark variant="inline" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                {formatDate(conta.vencimento)}
                              </td>
                              <td className="px-4 py-2">
                                {formatCurrency(conta.valor)}
                              </td>
                              <td className="px-4 py-2">
                                {getStatusBadge(conta.status)}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <div className="flex justify-end gap-2 flex-wrap">
                                  {conta.paymentUrl ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                      onClick={() =>
                                        window.open(conta.paymentUrl!, "_blank")
                                      }
                                    >
                                      <Barcode className="h-4 w-4" />
                                      {conta.status === "PENDENTE" ||
                                      conta.status === "ATRASADO"
                                        ? "Pagar Boleto"
                                        : "Ver Recibo"}
                                    </Button>
                                  ) : null}

                                  {conta.pixQrCode ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                        onClick={() =>
                                          setPixSelecionado({
                                            descricao: conta.descricao,
                                            valor: conta.valor,
                                            vencimento: conta.vencimento,
                                            codigo: conta.pixQrCode!,
                                          })
                                        }
                                      >
                                        <QrCode className="h-4 w-4" />
                                        Ver QR Code PIX
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 text-sky-700 border-sky-200 hover:bg-sky-50"
                                        onClick={() =>
                                          copiarCodigoPix(conta.pixQrCode!)
                                        }
                                      >
                                        <Copy className="h-4 w-4" />
                                        Copiar PIX
                                      </Button>
                                    </>
                                  ) : null}

                                  {!conta.paymentUrl && !conta.pixQrCode ? (
                                    <span className="text-xs text-gray-400">
                                      Indisponível
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>
                        Nenhuma fatura encontrada para o filtro selecionado.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {abaAtiva === "assinaturas" && (
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-700">
                      Assinaturas digitais
                    </h3>
                    <p className="text-sm text-gray-500">
                      Capture as assinaturas do titular e do responsável
                      financeiro.
                    </p>
                  </div>
                  {assinaturaMensagem && (
                    <p className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded-md">
                      {assinaturaMensagem}
                    </p>
                  )}
                </div>

                {!cliente.titularId ? (
                  <p className="text-sm text-gray-500">
                    Titular não identificado para vincular assinaturas.
                  </p>
                ) : isLoadingAssinaturas && assinaturas.length === 0 ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="size-4 animate-spin" />
                    Carregando assinaturas...
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-4 text-sm text-gray-700 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Contrato de Prestação de Serviços
                        </h4>
                        <p className="mt-1">
                          Leia o contrato antes de realizar as assinaturas.
                        </p>
                      </div>
                      <a
                        href={CONTRATO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-emerald-700 font-medium shadow-sm"
                      >
                        <Download className="size-4" />
                        Baixar Contrato
                      </a>
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
            )}
          </div>
        )}
      </div>
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
    </main>
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
      <Card className="border-emerald-200 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-emerald-800">
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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
      <Card className="border-emerald-100 bg-emerald-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-emerald-800 flex items-center justify-between">
            {titulo}
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </CardTitle>
          <CardDescription className="text-xs">
            Assinado em {formatDate(assinatura.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 w-full border border-emerald-100 bg-white rounded flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Assinatura"
                className="max-h-full max-w-full object-contain"
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
              className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50"
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
          ? "border-emerald-400 shadow-md ring-2 ring-emerald-100"
          : "border-slate-200 opacity-70 grayscale"
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-slate-700 flex items-center justify-between">
          {titulo}
          {estado === "ativa" && (
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
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
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
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
