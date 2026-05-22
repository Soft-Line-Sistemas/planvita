"use client";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import logoPlanvita from "@/assets/logo-planvita.png";
import { PanelLeftOpen } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import api from "@/utils/api";

export default function SidebarWrapper({ children }: { children: ReactNode }) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const showSidebar =
    !pathname.includes("/login") &&
    pathname !== "/cliente" &&
    pathname !== "/cliente/cadastro";

  useEffect(() => {
    const storedState =
      typeof window !== "undefined"
        ? window.localStorage.getItem("planvita:sidebar:collapsed")
        : null;
    if (storedState !== null) {
      setIsDesktopCollapsed(storedState === "true");
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "planvita:sidebar:collapsed",
        String(isDesktopCollapsed),
      );
    }
  }, [isDesktopCollapsed]);

  const formattedHeaderTime = useMemo(() => {
    const monthNames = [
      "JAN",
      "FEV",
      "MAR",
      "ABR",
      "MAI",
      "JUN",
      "JUL",
      "AGO",
      "SET",
      "OUT",
      "NOV",
      "DEZ",
    ];
    const day = String(currentTime.getDate()).padStart(2, "0");
    const month = monthNames[currentTime.getMonth()];
    const year = currentTime.getFullYear();
    const hours = String(currentTime.getHours()).padStart(2, "0");
    const minutes = String(currentTime.getMinutes()).padStart(2, "0");
    const seconds = String(currentTime.getSeconds()).padStart(2, "0");

    return {
      date: `${day}.${month} ${year}`,
      time: `${hours}:${minutes}:${seconds}`,
    };
  }, [currentTime]);

  const userInitial = useMemo(() => {
    const nome = user?.nome?.trim();
    if (!nome) return "U";
    return nome.charAt(0).toUpperCase();
  }, [user?.nome]);

  const handleLogout = async () => {
    await api.post("/auth/logout");
    router.push("/login");
  };

  return (
    <div className="min-h-screen">
      {showSidebar && (
        <header className="h-[104px] border-b border-gray-200 bg-white">
          <div className="flex h-full items-center">
            <div
              className={`hidden lg:flex items-center justify-between gap-2 pl-6 ${isDesktopCollapsed ? "w-20" : "w-64"}`}
            >
              <Image
                src={isDesktopCollapsed ? "/adm-pc/logo-min.svg" : logoPlanvita}
                alt={
                  isDesktopCollapsed
                    ? "Logo Planvita reduzida"
                    : "Logo Planvita"
                }
                width={isDesktopCollapsed ? 40 : 120}
                height={40}
                className={isDesktopCollapsed ? "h-auto w-10" : "h-auto w-32"}
                priority
              />
              <button
                type="button"
                aria-label={
                  isDesktopCollapsed ? "Expandir sidebar" : "Recolher sidebar"
                }
                onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                className="flex items-center justify-center h-[30px] w-[30px]"
              >
                {isDesktopCollapsed ? (
                  <PanelLeftOpen
                    className="h-[18px] w-[18px] text-[#767780]"
                    strokeWidth={1.5}
                  />
                ) : (
                  <Image
                    src="/adm-pc/Button.svg"
                    alt="Recolher sidebar"
                    width={18}
                    height={18}
                  />
                )}
              </button>
            </div>
            <div className="hidden lg:flex flex-1 items-center justify-end gap-4 px-6">
              <div className="flex items-center gap-2 rounded-[55px] border border-[#E9E9E9] bg-transparent px-[19px] py-[13px]">
                <Image
                  src="/adm-pc/Vector(10).svg"
                  alt="Horário atual"
                  width={19}
                  height={19}
                  className="h-[19px] w-[19px]"
                />
                <span className="text-sm text-[#4C4C4C]">
                  {formattedHeaderTime.date}
                </span>
                <span className="text-sm text-[#E9E9E9]">|</span>
                <span className="text-sm text-[#4C4C4C]">
                  {formattedHeaderTime.time}
                </span>
              </div>
              <button
                type="button"
                aria-label="Notificações"
                className="relative flex h-[43px] w-[43px] cursor-pointer items-center justify-center rounded-full border border-[#E9E9E9] bg-transparent"
                onClick={() => router.push("/painel/gestao/notificacoes")}
              >
                <Image
                  src="/adm-pc/Icon(11).svg"
                  alt="Sino de notificações"
                  width={20}
                  height={20}
                />
                <Image
                  src="/adm-pc/Icon(12).svg"
                  alt="Notificação ativa"
                  width={10}
                  height={10}
                  className="absolute top-[9px] right-[10px]"
                />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Abrir menu do perfil"
                    className="cursor-pointer rounded-full"
                  >
                    <Avatar className="h-10 w-10 border border-[#F5F6F8] shadow-md">
                      <AvatarImage src="" alt="Foto de perfil do usuário" />
                      <AvatarFallback className="bg-[#F2FAF4] text-[#1EBA4B] font-semibold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onClick={() => router.push("/painel/conta")}
                  >
                    Minha Conta
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600"
                  >
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}
      <div
        className={`flex ${showSidebar ? "min-h-[calc(100vh-104px)]" : "min-h-screen"}`}
      >
        {showSidebar && <Sidebar isDesktopCollapsed={isDesktopCollapsed} />}
        <main className="flex-1 min-w-0 pc-panel-root">
          <div className="pc-panel-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
