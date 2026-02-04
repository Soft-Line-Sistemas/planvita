"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  UserPlus,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Shield,
  ClipboardCheck,
  Layers,
  UserCog,
  CreditCard,
  KeyRound,
  Bell,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoPlanvita from "@/assets/logo-planvita.png";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { useMemo } from "react";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  requiredPermission?: string;
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasPermission } = useAuth();

  useEffect(() => {
    if (!loading && !user && process.env.NODE_ENV === "production") {
      router.push("/login");
    }
  }, [user, loading, router]);

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      href: "/painel/dashboard",
      requiredPermission: "dashboard.view",
    },
    {
      id: "cadastro",
      label: "Novo Cadastro",
      icon: UserPlus,
      href: "/painel/cliente/cadastro",
      requiredPermission: "titular.create",
    },
    {
      id: "clientes",
      label: "Clientes",
      icon: Users,
      href: "/painel/cliente/",
      requiredPermission: "titular.view",
    },
    {
      id: "colaboradores",
      label: "Colaboradores",
      icon: UserCog,
      href: "/painel/colaboradores",
      requiredPermission: "user.view",
    },
    {
      id: "planos",
      label: "Gestão de Planos",
      icon: Layers,
      href: "/painel/gestao/planos",
      requiredPermission: "plano.view",
    },
    {
      id: "financeiro",
      label: "Financeiro",
      icon: CreditCard,
      href: "/painel/gestao/financeiro",
      requiredPermission: "finance.view",
    },
    {
      id: "notificacoes",
      label: "Notificações",
      icon: Bell,
      href: "/painel/gestao/notificacoes",
      requiredPermission: "notifications.read",
    },
    {
      id: "relatorios",
      label: "Relatórios",
      icon: FileText,
      href: "/painel/relatorios",
      requiredPermission: "report.view",
    },
    {
      id: "permissions",
      label: "Permissões",
      icon: Shield,
      href: "/painel/permissoes",
      requiredPermission: "role.view",
    },
    {
      id: "configuracoes",
      label: "Regras",
      icon: ClipboardCheck,
      href: "/painel/configuracoes",
      requiredPermission: "layout.view",
    },
    {
      id: "conta",
      label: "Minha Conta",
      icon: KeyRound,
      href: "/painel/conta",
    },
  ];

  const handleLogout = async () => {
    await api.post(`/auth/logout`);
    router.push("/login");
  };

  const consultorLink = useMemo(() => {
    const isConsultor = user?.role?.name?.toLowerCase() === "consultor";
    const consultorId = user?.consultor?.id;
    if (isConsultor && consultorId && typeof window !== "undefined") {
      return `${window.location.origin}/cliente/cadastro?consultorId=${consultorId}`;
    }
    return null;
  }, [user]);

  const handleCopyLink = () => {
    if (consultorLink) {
      navigator.clipboard.writeText(consultorLink);
      toast.success("Link copiado com sucesso!");
    }
  };

  return (
    <>
      {/* Botão mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg border border-gray-200"
        >
          {isCollapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-xl border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isCollapsed ? "-translate-x-full" : "translate-x-0"}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Cabeçalho */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-center mb-4">
              <Image
                src={logoPlanvita}
                alt="Logo Planvita"
                width={120}
                height={40}
                className="h-auto w-32"
                priority
              />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-green-700">
                Sistema Planvita
              </h2>
              <p className="text-sm text-gray-600">Gestão de Planos</p>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems
              .filter(
                (item) =>
                  !item.requiredPermission ||
                  hasPermission(item.requiredPermission) ||
                  loading,
              )
              .map(({ id, label, icon: Icon, href }) => {
                let isActive = false;

                const exactPaths = ["/painel/cliente/cadastro"];
                if (exactPaths.includes(pathname) && href === pathname) {
                  isActive = true;
                } else {
                  if (id === "clientes") {
                    isActive =
                      pathname.startsWith("/painel/cliente") &&
                      pathname !== "/painel/cliente/cadastro";
                  } else {
                    isActive =
                      pathname === href || pathname.startsWith(href + "/");
                  }
                }

                return (
                  <Link key={id} href={href} passHref>
                    <Button
                      asChild
                      variant={isActive ? "default" : "ghost"}
                      className={`
          w-full justify-start h-12 transition-all duration-200
          ${
            isActive
              ? "bg-green-600 text-white shadow-md hover:bg-green-700"
              : "text-gray-700 hover:bg-green-50 hover:text-green-700"
          }
        `}
                      onClick={() => setIsCollapsed(true)}
                    >
                      <div className="flex items-center w-full">
                        <Icon className="mr-3 h-5 w-5" />
                        {label}
                      </div>
                    </Button>
                  </Link>
                );
              })}
          </nav>

          {/* Rodapé */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            {consultorLink && (
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <LinkIcon className="mr-3 h-4 w-4" />
                Copiar meu link
              </Button>
            )}

            <Card className="p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500">{user?.role?.name}</p>
                </div>
              </div>
            </Card>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
