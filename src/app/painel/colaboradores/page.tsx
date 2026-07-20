"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/utils/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import {
  Camera,
  LayoutGrid,
  Loader2,
  MoreVertical,
  Search,
  Table as TableIcon,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LinksRedesSociais from "@/components/LinksRedesSocias";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import getTenantFromHost from "@/utils/getTenantFromHost";
import { buildConsultorCadastroLink } from "@/utils/consultorPublic";

type Role = {
  id: number;
  name: string;
};

type User = {
  linkCadastro?: string;
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  roleId?: number | null;
  consultorId?: number | null;
  consultorCodigo?: string | null;
  consultorWhatsapp?: string | null;
  valorComissaoIndicacao?: number | null;
  comissaoPendente?: number;
};

const AVATAR_ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Falha ao processar arquivo."));
    };
    reader.onerror = () => reject(new Error("Falha ao processar arquivo."));
    reader.readAsDataURL(file);
  });
}

function getInitials(name?: string) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export default function AcessoPage() {
  const { user, hasPermission, loading: authLoading } = useAuth();
  const currentTenant = user?.tenant || getTenantFromHost();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  const [createOpen, setCreateOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<number | null>(null);
  const [newUserCommission, setNewUserCommission] = useState("0");
  const [newUserWhatsapp, setNewUserWhatsapp] = useState("");
  const [creating, setCreating] = useState(false);

  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<number | null>(null);
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editCommission, setEditCommission] = useState("0");
  const [savingEdit, setSavingEdit] = useState(false);

  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [emailModalUser, setEmailModalUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [uploadingAvatarId, setUploadingAvatarId] = useState<number | null>(
    null,
  );
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarTargetUserId = useRef<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!hasPermission("user.view")) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          api.get("/users"),
          api.get("/roles"),
        ]);
        setUsers(usersRes.data as User[]);
        setRoles(rolesRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar dados de acesso");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, hasPermission]);

  const isAdmin = user?.role?.name === "admin_master";
  const canAssignRole = hasPermission("user.assign_roles");
  const canUpdateUser = hasPermission("user.update");
  const roleSelecionada = roles.find((role) => role.id === newUserRole);
  const roleSelecionadaEhConsultor =
    roleSelecionada?.name?.toLowerCase().trim() === "consultor";
  const editRoleSelecionada = roles.find((role) => role.id === editRole);
  const editRoleEhConsultor =
    editRoleSelecionada?.name?.toLowerCase().trim() === "consultor";

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name?.toLowerCase()?.includes(search.toLowerCase()) ||
          u.email?.toLowerCase()?.includes(search.toLowerCase()),
      ),
    [users, search],
  );

  const roleName = (roleId?: number | null) =>
    roles.find((r) => r.id === roleId)?.name;
  const isConsultor = (target: User) => {
    const roleAtual = roles.find((r) => r.id === target.roleId);
    return (
      roleAtual?.name?.toLowerCase().trim() === "consultor" ||
      !!target.consultorId
    );
  };

  const resetCreateForm = () => {
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole(null);
    setNewUserCommission("0");
    setNewUserWhatsapp("");
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail || !newUserRole) {
      toast.error("Preencha todos os campos para criar o colaborador");
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/users", {
        nome: newUserName,
        email: newUserEmail,
        roleId: newUserRole,
        whatsapp: roleSelecionadaEhConsultor ? newUserWhatsapp : undefined,
        valorComissaoIndicacao: roleSelecionadaEhConsultor
          ? Number(newUserCommission || 0)
          : undefined,
      });

      const consultorId = res.data.consultorId;
      const linkCadastro = consultorId
        ? buildConsultorCadastroLink(window.location.origin, {
            codigo: res.data.consultorCodigo,
            legacyId: consultorId,
            tenantId: currentTenant,
          })
        : undefined;

      setUsers((prev) => [...prev, { ...res.data, linkCadastro }]);
      resetCreateForm();
      setCreateOpen(false);
      toast.success("Colaborador criado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar colaborador");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (target: User) => {
    setEditUser(target);
    setEditRole(target.roleId ?? null);
    setEditWhatsapp(target.consultorWhatsapp ?? "");
    setEditCommission(String(Number(target.valorComissaoIndicacao ?? 0)));
  };

  const handleSaveEdit = async () => {
    if (!editUser || !editRole) {
      toast.error("Selecione um cargo para o colaborador");
      return;
    }

    setSavingEdit(true);
    try {
      const { data } = await api.put(`/users/${editUser.id}/role`, {
        roleId: editRole,
        whatsapp: editRoleEhConsultor ? editWhatsapp : undefined,
        valorComissaoIndicacao: editRoleEhConsultor
          ? Number(editCommission || 0)
          : undefined,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser.id
            ? {
                ...u,
                roleId: editRole,
                consultorWhatsapp: editRoleEhConsultor ? editWhatsapp : null,
                consultorId: editRoleEhConsultor
                  ? (data?.consultor?.id ?? u.consultorId)
                  : null,
                consultorCodigo: editRoleEhConsultor
                  ? (data?.consultor?.codigo ?? u.consultorCodigo)
                  : null,
                valorComissaoIndicacao: editRoleEhConsultor
                  ? Number(
                      data?.consultor?.valorComissaoIndicacao ??
                        editCommission ??
                        0,
                    )
                  : null,
              }
            : u,
        ),
      );
      toast.success("Colaborador atualizado com sucesso");
      setEditUser(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar colaborador");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenPasswordModal = (target: User) => {
    setPasswordModalUser(target);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleOpenEmailModal = (target: User) => {
    setEmailModalUser(target);
    setNewEmail(target.email);
  };

  const handleResetPassword = async () => {
    if (!passwordModalUser) return;

    if (newPassword.trim().length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setResettingPassword(true);
    try {
      await api.put(`/users/${passwordModalUser.id}/password`, {
        newPassword,
      });
      toast.success(
        `Senha de ${passwordModalUser.name || "colaborador"} atualizada`,
      );
      setPasswordModalUser(null);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível atualizar a senha");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailModalUser) return;

    if (!newEmail.trim()) {
      toast.error("Informe um e-mail válido");
      return;
    }

    setUpdatingEmail(true);
    try {
      await api.put(`/users/${emailModalUser.id}/email`, {
        email: newEmail.trim(),
      });

      setUsers((prev) =>
        prev.map((existing) =>
          existing.id === emailModalUser.id
            ? { ...existing, email: newEmail.trim() }
            : existing,
        ),
      );
      toast.success("E-mail atualizado com sucesso");
      setEmailModalUser(null);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível atualizar o e-mail");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handlePickAvatar = (userId: number) => {
    avatarTargetUserId.current = userId;
    avatarInputRef.current?.click();
  };

  const handleAvatarFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    const targetUserId = avatarTargetUserId.current;
    event.target.value = "";
    if (!file || !targetUserId) return;

    if (!AVATAR_ALLOWED_MIME.includes(file.type)) {
      toast.error("Envie uma imagem PNG, JPEG ou WEBP");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("A imagem deve ter até 5MB");
      return;
    }

    setUploadingAvatarId(targetUserId);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const { data } = await api.put(`/users/${targetUserId}/avatar`, {
        fileBase64: dataUrl,
        filename: file.name,
        mimeType: file.type,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId ? { ...u, avatarUrl: data.avatarUrl } : u,
        ),
      );
      toast.success("Foto atualizada com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível enviar a foto");
    } finally {
      setUploadingAvatarId(null);
    }
  };

  const handleRemoveAvatar = async (targetUserId: number) => {
    setUploadingAvatarId(targetUserId);
    try {
      await api.delete(`/users/${targetUserId}/avatar`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId ? { ...u, avatarUrl: null } : u,
        ),
      );
      toast.success("Foto removida");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível remover a foto");
    } finally {
      setUploadingAvatarId(null);
    }
  };

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  const handleSendLink = (target: User) => {
    const link =
      target.linkCadastro ||
      (target.consultorId
        ? buildConsultorCadastroLink(window.location.origin, {
            codigo: target.consultorCodigo,
            legacyId: target.consultorId,
            tenantId: currentTenant,
          })
        : "");
    if (!link) {
      toast.error("Este colaborador não possui vínculo de consultor");
      return;
    }
    setSelectedLink(link);
    setShareModalOpen(true);
  };

  if (!authLoading && !loading && !hasPermission("user.view")) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sem permissão</CardTitle>
          </CardHeader>
          <CardContent>Você não pode visualizar colaboradores.</CardContent>
        </Card>
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Carregando dados...
      </div>
    );
  }

  return (
    <motion.div
      className="p-8 space-y-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <input
        ref={avatarInputRef}
        type="file"
        accept={AVATAR_ALLOWED_MIME.join(",")}
        className="hidden"
        onChange={handleAvatarFileSelected}
      />

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Colaboradores e seus Cargos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie acesso, cargos e comissões da equipe.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar colaborador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
            <Button
              type="button"
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
          {hasPermission("user.create") && (
            <Button onClick={() => setCreateOpen(true)} className="sm:w-auto">
              Novo Colaborador
            </Button>
          )}
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm py-16 flex flex-col items-center gap-2 text-center">
          <Users className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm font-medium">Nenhum colaborador encontrado</p>
          <p className="text-xs text-muted-foreground">
            Ajuste sua busca ou cadastre um novo colaborador.
          </p>
        </div>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((target) => (
            <motion.div
              key={target.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar className="size-14">
                      <AvatarImage
                        src={target.avatarUrl ?? undefined}
                        alt={target.name}
                      />
                      <AvatarFallback className="bg-[#f2faf0] text-primary font-semibold">
                        {getInitials(target.name)}
                      </AvatarFallback>
                    </Avatar>
                    {canUpdateUser && (
                      <button
                        type="button"
                        onClick={() => handlePickAvatar(target.id)}
                        disabled={uploadingAvatarId === target.id}
                        className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:bg-primary/90 disabled:opacity-60"
                        title="Alterar foto"
                      >
                        {uploadingAvatarId === target.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Camera className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{target.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {target.email}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canAssignRole && (
                      <DropdownMenuItem onClick={() => handleOpenEdit(target)}>
                        Editar cargo
                      </DropdownMenuItem>
                    )}
                    {canUpdateUser && (
                      <DropdownMenuItem
                        onClick={() => handleOpenEmailModal(target)}
                      >
                        Alterar e-mail
                      </DropdownMenuItem>
                    )}
                    {isAdmin && canUpdateUser && (
                      <DropdownMenuItem
                        onClick={() => handleOpenPasswordModal(target)}
                      >
                        Alterar senha
                      </DropdownMenuItem>
                    )}
                    {target.consultorId && (
                      <DropdownMenuItem onClick={() => handleSendLink(target)}>
                        Enviar link de cadastro
                      </DropdownMenuItem>
                    )}
                    {canUpdateUser && target.avatarUrl && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemoveAvatar(target.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover foto
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                {target.roleId ? (
                  <Badge variant="secondary">{roleName(target.roleId)}</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Sem cargo
                  </Badge>
                )}
              </div>

              {isConsultor(target) && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-sm">
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Codigo</p>
                    <p className="font-medium">
                      {target.consultorCodigo ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Comissão</p>
                    <p className="font-medium">
                      R$ {Number(target.valorComissaoIndicacao ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">A receber</p>
                    <p className="font-medium">
                      R$ {Number(target.comissaoPendente ?? 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableCaption>
                {filteredUsers.length > 0
                  ? "Lista completa de usuários cadastrados"
                  : "Nenhum usuário encontrado"}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>A receber</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((target) => (
                  <TableRow key={target.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage
                            src={target.avatarUrl ?? undefined}
                            alt={target.name}
                          />
                          <AvatarFallback className="bg-[#f2faf0] text-primary text-xs font-semibold">
                            {getInitials(target.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium leading-tight">
                            {target.name}
                          </p>
                          <p className="text-xs text-muted-foreground leading-tight">
                            {target.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {target.roleId ? (
                        <Badge variant="secondary">
                          {roleName(target.roleId)}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Sem cargo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isConsultor(target)
                        ? (target.consultorCodigo ?? "—")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {isConsultor(target)
                        ? `R$ ${Number(target.valorComissaoIndicacao ?? 0).toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {isConsultor(target)
                        ? `R$ ${Number(target.comissaoPendente ?? 0).toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canAssignRole && (
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(target)}
                            >
                              Editar cargo
                            </DropdownMenuItem>
                          )}
                          {canUpdateUser && (
                            <DropdownMenuItem
                              onClick={() => handleOpenEmailModal(target)}
                            >
                              Alterar e-mail
                            </DropdownMenuItem>
                          )}
                          {isAdmin && canUpdateUser && (
                            <DropdownMenuItem
                              onClick={() => handleOpenPasswordModal(target)}
                            >
                              Alterar senha
                            </DropdownMenuItem>
                          )}
                          {target.consultorId && (
                            <DropdownMenuItem
                              onClick={() => handleSendLink(target)}
                            >
                              Enviar link de cadastro
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal: Criar novo colaborador */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Colaborador</DialogTitle>
            <DialogDescription>
              Preencha os dados para cadastrar um novo colaborador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome completo</Label>
              <Input
                id="new-name"
                placeholder="Nome completo"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">E-mail</Label>
              <Input
                id="new-email"
                placeholder="E-mail"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={newUserRole?.toString() || ""}
                onValueChange={(val) => setNewUserRole(Number(val))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {roleSelecionadaEhConsultor && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-whatsapp">WhatsApp do consultor</Label>
                  <Input
                    id="new-whatsapp"
                    placeholder="WhatsApp do consultor"
                    value={newUserWhatsapp}
                    onChange={(e) => setNewUserWhatsapp(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-commission">
                    Comissão por referência (R$)
                  </Label>
                  <Input
                    id="new-commission"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={newUserCommission}
                    onChange={(e) => setNewUserCommission(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? "Criando..." : "Criar Colaborador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar cargo/comissão */}
      <Dialog
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
            <DialogDescription>
              Atualize o cargo de{" "}
              <span className="font-semibold">
                {editUser?.name || "o colaborador"}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={editRole?.toString() || ""}
                onValueChange={(val) => setEditRole(Number(val))}
                disabled={!canAssignRole}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editRoleEhConsultor && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-whatsapp">WhatsApp do consultor</Label>
                  <Input
                    id="edit-whatsapp"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    placeholder="WhatsApp"
                    disabled={!canAssignRole}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-commission">
                    Comissão por referência (R$)
                  </Label>
                  <Input
                    id="edit-commission"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editCommission}
                    onChange={(e) => setEditCommission(e.target.value)}
                    disabled={!canAssignRole}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditUser(null)}
              disabled={savingEdit}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={savingEdit || !canAssignRole}
            >
              {savingEdit ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Alterar e-mail */}
      {isAdmin && (
        <Dialog
          open={!!emailModalUser}
          onOpenChange={(open) => {
            if (!open) setEmailModalUser(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Alterar e-mail do colaborador</DialogTitle>
              <DialogDescription>
                Atualize o e-mail de{" "}
                <span className="font-semibold">
                  {emailModalUser?.name || "o colaborador"}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-email-modal">Novo e-mail</Label>
                <Input
                  id="new-email-modal"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colaborador@empresa.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailModalUser(null)}
                disabled={updatingEmail}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateEmail} disabled={updatingEmail}>
                {updatingEmail ? "Atualizando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal: Alterar senha */}
      {isAdmin && (
        <Dialog
          open={!!passwordModalUser}
          onOpenChange={(open) => {
            if (!open) setPasswordModalUser(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Alterar senha do colaborador</DialogTitle>
              <DialogDescription>
                Defina uma nova senha para{" "}
                <span className="font-semibold">
                  {passwordModalUser?.name || "o colaborador"}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                A nova senha deve conter no mínimo 6 caracteres. Compartilhe com
                o colaborador após salvar.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalUser(null)}
                disabled={resettingPassword}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={resettingPassword}
              >
                {resettingPassword ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {selectedLink && (
        <LinksRedesSociais
          link={selectedLink}
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
