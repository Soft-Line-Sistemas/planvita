"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  FileText,
  Menu,
  X,
  ShieldCheck,
  Layers,
  SquareUserRound,
  CreditCard,
  HandCoins,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  iconSrc?: string;
  href: string;
  requiredPermission?: string;
}

interface SidebarProps {
  isDesktopCollapsed: boolean;
}

export function Sidebar({ isDesktopCollapsed }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, hasPermission } = useAuth();
  const isConsultor = user?.role?.name?.toLowerCase() === "consultor";

  useEffect(() => {
    if (!loading && !user && process.env.NODE_ENV === "production") {
      router.push("/login");
    }
  }, [user, loading, router]);

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
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
    ...(isConsultor
      ? [
          {
            id: "comissoes",
            label: "Minhas Comissões",
            icon: HandCoins,
            href: "/painel/comissoes",
            requiredPermission: "titular.view",
          } as MenuItem,
        ]
      : []),
    {
      id: "colaboradores",
      label: "Colaboradores",
      icon: SquareUserRound,
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
      id: "parcerias",
      label: "Parcerias",
      icon: HandCoins,
      href: "/painel/gestao/parcerias",
      requiredPermission: "parcerias.view",
    },
    {
      id: "financeiro",
      label: "Financeiro",
      icon: CreditCard,
      href: "/painel/gestao/financeiro",
      requiredPermission: "finance.view",
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
      icon: ShieldCheck,
      href: "/painel/permissoes",
      requiredPermission: "role.view",
    },
    {
      id: "configuracoes",
      label: "Configurações",
      icon: Settings,
      href: "/painel/configuracoes",
      requiredPermission: "layout.view",
    },
  ];

  return (
    <>
      {/* Botão mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200
          transform transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          ${isDesktopCollapsed ? "lg:w-20" : "lg:w-64"}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Menu */}
          <nav className="flex-1 px-4 pt-6 pb-4 space-y-2 overflow-y-auto">
            {menuItems
              .filter(
                (item) =>
                  !item.requiredPermission ||
                  hasPermission(item.requiredPermission) ||
                  loading,
              )
              .map(({ id, label, icon: Icon, iconSrc, href }) => {
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
                  <div key={id} className="flex items-center gap-[4px]">
                    <span
                      className={`h-10 w-[3px] rounded-[20px] ${isActive ? "bg-[#1EBA4B]" : "bg-transparent"}`}
                    />
                    <Link
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
          flex w-full items-center h-12 rounded-[13px] transition-all duration-200 font-semibold
          ${isDesktopCollapsed ? "justify-center px-0" : "justify-start px-3"}
          ${
            isActive
              ? "bg-[#F2FAF4] text-[#1EBA4B]"
              : "text-gray-700 hover:bg-green-50 hover:text-gray-800"
          }
        `}
                    >
                      {iconSrc ? (
                        <Image
                          src={iconSrc}
                          alt=""
                          width={20}
                          height={20}
                          aria-hidden="true"
                          className={`h-5 w-5 ${isActive ? "" : "grayscale brightness-0 opacity-80"} ${isDesktopCollapsed ? "" : "mr-3"}`}
                        />
                      ) : (
                        <Icon
                          className={`h-5 w-5 ${isDesktopCollapsed ? "" : "mr-3"}`}
                        />
                      )}
                      {!isDesktopCollapsed && label}
                    </Link>
                  </div>
                );
              })}
          </nav>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
